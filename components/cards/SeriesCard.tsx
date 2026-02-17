import React from 'react';
import { Card, ScriptOutputSeries } from '../../types';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useStore } from '../../store';
import { t } from '../../i18n';
import {
  getFiniteSeriesValues,
  getFirstTwoSeries,
  isDoubleLineSeriesMode,
  isDualAxisSeriesMode,
  normalizeSeriesMode,
  SERIES_MODE_DEFAULT,
  shouldFallbackToSingleLine,
} from '../../services/series-chart';

interface SeriesCardProps {
  card: Card;
}

type NumericDomain = [number | 'auto', number | 'auto'];

const formatAxisValue = (value: number | string): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return String(value);
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
  if (absolute >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (absolute >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  if (absolute >= 100) return Math.round(value).toString();
  if (absolute >= 10) return value.toFixed(1).replace(/\.0$/, '');
  return value.toFixed(2).replace(/\.?0+$/, '');
};

const formatCompactAxisValue = (value: number | string): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return String(value);
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(0)}B`;
  if (absolute >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
  if (absolute >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  if (absolute >= 100) return Math.round(value).toString();
  if (absolute >= 10) return value.toFixed(0);
  return value.toFixed(1).replace(/\.0$/, '');
};

const estimateYAxisWidth = (
  values: number[],
  format: (value: number) => string,
  fontSize: number,
  minWidth: number,
  maxWidth: number,
): number => {
  if (values.length === 0) return minWidth;
  const maxLabelLength = values.reduce((longest, value) => {
    const label = format(value);
    return Math.max(longest, label.length);
  }, 0);
  const estimated = Math.ceil(maxLabelLength * fontSize * 0.62 + 10);
  return Math.max(minWidth, Math.min(maxWidth, estimated));
};

const getChartLayout = (size: Card['ui_config']['size']) => {
  switch (size) {
    case '1x1':
      return {
        margin: { top: 4, right: 2, left: 2, bottom: 2 },
        xAxisHeight: 18,
        xAxisTickMargin: 2,
        yAxisMinWidth: 24,
        yAxisMaxWidth: 36,
        xAxisMinTickGap: 24,
        yTickCount: 2,
        showXAxisTicks: true,
        showYAxisTicks: true,
        tickFontSize: 9,
        legendHeight: 18,
        legendFontSize: 9,
      };
    case '2x1':
      return {
        margin: { top: 8, right: 8, left: 6, bottom: 0 },
        xAxisHeight: 20,
        xAxisTickMargin: 6,
        yAxisMinWidth: 32,
        yAxisMaxWidth: 56,
        xAxisMinTickGap: 12,
        yTickCount: 3,
        showXAxisTicks: true,
        showYAxisTicks: true,
        tickFontSize: 10,
        legendHeight: 20,
        legendFontSize: 10,
      };
    case '1x2':
      return {
        margin: { top: 8, right: 8, left: 6, bottom: 0 },
        xAxisHeight: 22,
        xAxisTickMargin: 6,
        yAxisMinWidth: 32,
        yAxisMaxWidth: 56,
        xAxisMinTickGap: 16,
        yTickCount: 5,
        showXAxisTicks: true,
        showYAxisTicks: true,
        tickFontSize: 10,
        legendHeight: 22,
        legendFontSize: 10,
      };
    case '2x2':
    default:
      return {
        margin: { top: 10, right: 8, left: 6, bottom: 0 },
        xAxisHeight: 22,
        xAxisTickMargin: 6,
        yAxisMinWidth: 32,
        yAxisMaxWidth: 56,
        xAxisMinTickGap: 14,
        yTickCount: 5,
        showXAxisTicks: true,
        showYAxisTicks: true,
        tickFontSize: 10,
        legendHeight: 22,
        legendFontSize: 10,
      };
  }
};

const getStroke = (theme: Card['ui_config']['color_theme']) => {
  switch (theme) {
    case 'green':
      return '#10b981';
    case 'red':
      return '#f43f5e';
    case 'purple':
      return '#8b5cf6';
    case 'blue':
      return '#3b82f6';
    case 'yellow':
      return '#f59e0b';
    default:
      return '#3b82f6';
  }
};

const getSecondaryStroke = (theme: Card['ui_config']['color_theme']) => {
  switch (theme) {
    case 'green':
      return '#3b82f6';
    case 'red':
      return '#f59e0b';
    case 'purple':
      return '#14b8a6';
    case 'blue':
      return '#f97316';
    case 'yellow':
      return '#0ea5e9';
    default:
      return '#f97316';
  }
};

const buildDomain = (values: number[]): NumericDomain => {
  if (values.length === 0) return ['auto', 'auto'];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    const offset = Math.max(1, Math.abs(min) * 0.1);
    return [min - offset, max + offset];
  }
  return [min, max];
};

const getDomainSampleValues = (domain: NumericDomain): number[] => {
  if (typeof domain[0] !== 'number' || typeof domain[1] !== 'number') return [];
  return [domain[0], domain[1], (domain[0] + domain[1]) / 2];
};

export const SeriesCard: React.FC<SeriesCardProps> = ({ card }) => {
  const language = useStore((state) => state.language);
  const tr = (key: string) => t(language, key);
  const payload = card.runtimeData?.payload as ScriptOutputSeries | undefined;
  const isCompactCard = card.ui_config.size === '1x1';

  if (!payload || !payload.series || payload.series.length === 0) {
    return <div className="text-sm text-muted-foreground">{tr('common.noData')}</div>;
  }

  const requestedMode = normalizeSeriesMode(card.ui_config.series_mode, SERIES_MODE_DEFAULT);
  const { primarySeries, secondarySeries } = getFirstTwoSeries(payload);

  if (!primarySeries) {
    return <div className="text-sm text-muted-foreground">{tr('common.noData')}</div>;
  }

  const fallbackToSingleLine = shouldFallbackToSingleLine(requestedMode, payload);
  const effectiveMode = fallbackToSingleLine ? 'single_axis_single_line' : requestedMode;
  const isDoubleLine = isDoubleLineSeriesMode(effectiveMode);
  const isDualAxis = isDualAxisSeriesMode(effectiveMode);

  const primaryValues = getFiniteSeriesValues(primarySeries);
  const secondaryValues = getFiniteSeriesValues(secondarySeries);
  const sharedDomain = buildDomain(isDoubleLine ? [...primaryValues, ...secondaryValues] : primaryValues);
  const primaryDomain = buildDomain(primaryValues);
  const secondaryDomain = buildDomain(secondaryValues);

  const chartData = payload.x_axis.map((label, index) => {
    const primaryValue = Number(primarySeries.values[index]);
    const secondaryValue = secondarySeries ? Number(secondarySeries.values[index]) : Number.NaN;

    return {
      name: label,
      s0: Number.isFinite(primaryValue) ? primaryValue : undefined,
      s1: Number.isFinite(secondaryValue) ? secondaryValue : undefined,
    };
  });

  const chartLayout = getChartLayout(card.ui_config.size);
  const lineColor = getStroke(card.ui_config.color_theme);
  const secondaryLineColor = getSecondaryStroke(card.ui_config.color_theme);
  const neutralAxisColor = 'hsl(var(--muted-foreground) / 0.55)';
  const neutralTickColor = 'hsl(var(--muted-foreground))';
  const leftAxisLineColor = isDualAxis ? lineColor : neutralAxisColor;
  const rightAxisLineColor = isDualAxis ? secondaryLineColor : neutralAxisColor;
  const leftAxisTickColor = isDualAxis ? lineColor : neutralTickColor;
  const rightAxisTickColor = isDualAxis ? secondaryLineColor : neutralTickColor;
  const isMiniCard = card.ui_config.size === '1x1';

  const formatXAxisLabel = (value: string | number) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return isMiniCard ? formatCompactAxisValue(value) : formatAxisValue(value);
    }
    const text = String(value);
    if (!isMiniCard) return text;
    return text.length > 4 ? `${text.slice(0, 3)}…` : text;
  };

  const yAxisTickFormatter = (value: number | string) =>
    isMiniCard ? formatCompactAxisValue(value) : formatAxisValue(value);

  const leftAxisWidth = estimateYAxisWidth(
    getDomainSampleValues(isDualAxis ? primaryDomain : sharedDomain),
    (value) => yAxisTickFormatter(value),
    chartLayout.tickFontSize,
    chartLayout.yAxisMinWidth,
    chartLayout.yAxisMaxWidth,
  );

  const rightAxisWidth = estimateYAxisWidth(
    getDomainSampleValues(secondaryDomain),
    (value) => yAxisTickFormatter(value),
    chartLayout.tickFontSize,
    chartLayout.yAxisMinWidth,
    chartLayout.yAxisMaxWidth,
  );

  const xAxisTickStyle = { fontSize: chartLayout.tickFontSize, fill: neutralTickColor };
  const leftAxisTickStyle = { fontSize: chartLayout.tickFontSize, fill: leftAxisTickColor };
  const rightAxisTickStyle = { fontSize: chartLayout.tickFontSize, fill: rightAxisTickColor };

  return (
    <div className="w-full h-full min-h-0 flex flex-col">
      {fallbackToSingleLine && (
        <p className="px-1 pb-1 text-[11px] leading-tight text-amber-700 dark:text-amber-400">
          {tr('series.fallbackToSingleLine')}
        </p>
      )}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{
              ...chartLayout.margin,
              right: isDualAxis ? chartLayout.margin.right + rightAxisWidth + 4 : chartLayout.margin.right,
            }}
          >
            {!isDoubleLine && (
              <defs>
                <linearGradient id={`color-${card.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={lineColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
            )}
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
              opacity={isCompactCard ? 0.3 : 0.9}
            />
            <XAxis
              dataKey="name"
              tick={chartLayout.showXAxisTicks ? xAxisTickStyle : false}
              tickLine={false}
              axisLine={{ stroke: neutralAxisColor, strokeWidth: 1 }}
              height={chartLayout.xAxisHeight}
              tickMargin={chartLayout.showXAxisTicks ? chartLayout.xAxisTickMargin : 2}
              interval="preserveStartEnd"
              minTickGap={chartLayout.xAxisMinTickGap}
              tickFormatter={formatXAxisLabel}
            />
            <YAxis
              yAxisId="left"
              tick={chartLayout.showYAxisTicks ? leftAxisTickStyle : false}
              tickLine={false}
              axisLine={{ stroke: leftAxisLineColor, strokeWidth: 1.15 }}
              width={leftAxisWidth}
              tickCount={chartLayout.yTickCount}
              tickFormatter={chartLayout.showYAxisTicks ? yAxisTickFormatter : undefined}
              domain={isDualAxis ? primaryDomain : sharedDomain}
            />
            {isDualAxis && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={chartLayout.showYAxisTicks ? rightAxisTickStyle : false}
                tickLine={false}
                axisLine={{ stroke: rightAxisLineColor, strokeWidth: 1.15 }}
                width={rightAxisWidth}
                tickCount={chartLayout.yTickCount}
                tickFormatter={chartLayout.showYAxisTicks ? yAxisTickFormatter : undefined}
                domain={secondaryDomain}
              />
            )}
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--card-foreground))',
                borderRadius: 'var(--radius)',
                fontSize: '12px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              formatter={(value: number | string, name: string) => [formatAxisValue(value), name]}
            />
            {isDoubleLine && (
              <Legend
                verticalAlign="top"
                align="center"
                height={chartLayout.legendHeight}
                wrapperStyle={{
                  fontSize: `${chartLayout.legendFontSize}px`,
                  lineHeight: 1.2,
                }}
              />
            )}

            {!isDoubleLine && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="s0"
                name={primarySeries.name}
                stroke={lineColor}
                fillOpacity={1}
                fill={`url(#color-${card.id})`}
                strokeWidth={2}
                baseValue="dataMin"
                dot={false}
                isAnimationActive={!isCompactCard}
              />
            )}

            {isDoubleLine && (
              <>
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="s0"
                  name={primarySeries.name}
                  stroke={lineColor}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={!isCompactCard}
                />
                {secondarySeries && (
                  <Line
                    yAxisId={isDualAxis ? 'right' : 'left'}
                    type="monotone"
                    dataKey="s1"
                    name={secondarySeries.name}
                    stroke={secondaryLineColor}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={!isCompactCard}
                  />
                )}
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
