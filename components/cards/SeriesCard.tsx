import React from 'react';
import { Card, ScriptOutputSeries } from '../../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useStore } from '../../store';
import { t } from '../../i18n';

interface SeriesCardProps {
  card: Card;
}

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

export const SeriesCard: React.FC<SeriesCardProps> = ({ card }) => {
  const language = useStore((state) => state.language);
  const tr = (key: string) => t(language, key);
  const payload = card.runtimeData?.payload as ScriptOutputSeries | undefined;
  const isCompactCard = card.ui_config.size === '1x1';

  if (!payload || !payload.series || payload.series.length === 0) {
    return <div className="text-sm text-muted-foreground">{tr('common.noData')}</div>;
  }

  const chartData = payload.x_axis.map((label, index) => {
    const point: Record<string, string | number> = { name: label };
    payload.series.forEach((series) => {
      point[series.name] = series.values[index] ?? 0;
    });
    return point;
  });

  const primarySeries = payload.series[0]?.name;
  const primarySeriesValues = payload.series[0]?.values.filter((value) => Number.isFinite(value)) ?? [];
  const [rawMin, rawMax] =
    primarySeriesValues.length > 0
      ? [Math.min(...primarySeriesValues), Math.max(...primarySeriesValues)]
      : [undefined, undefined];
  const yDomain =
    rawMin !== undefined && rawMax !== undefined
      ? rawMin === rawMax
        ? [rawMin - Math.max(1, Math.abs(rawMin) * 0.1), rawMax + Math.max(1, Math.abs(rawMax) * 0.1)]
        : [rawMin, rawMax]
      : ['auto', 'auto'];
  const chartLayout = getChartLayout(card.ui_config.size);
  const lineColor = getStroke(card.ui_config.color_theme);
  const axisColor = 'hsl(var(--muted-foreground) / 0.55)';
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
  const yAxisWidthSampleValues =
    rawMin !== undefined && rawMax !== undefined
      ? [rawMin, rawMax, (rawMin + rawMax) / 2]
      : [];
  const yAxisWidth = estimateYAxisWidth(
    yAxisWidthSampleValues,
    (value) => yAxisTickFormatter(value),
    chartLayout.tickFontSize,
    chartLayout.yAxisMinWidth,
    chartLayout.yAxisMaxWidth,
  );
  const axisTickStyle = { fontSize: chartLayout.tickFontSize, fill: 'hsl(var(--muted-foreground))' };

  return (
    <div className="w-full h-full min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={chartLayout.margin}>
          <defs>
            <linearGradient id={`color-${card.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={lineColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            vertical={false}
            opacity={isCompactCard ? 0.3 : 0.9}
          />
          <XAxis
            dataKey="name"
            tick={chartLayout.showXAxisTicks ? axisTickStyle : false}
            tickLine={false}
            axisLine={{ stroke: axisColor, strokeWidth: 1 }}
            height={chartLayout.xAxisHeight}
            tickMargin={chartLayout.showXAxisTicks ? chartLayout.xAxisTickMargin : 2}
            interval="preserveStartEnd"
            minTickGap={chartLayout.xAxisMinTickGap}
            tickFormatter={formatXAxisLabel}
          />
          <YAxis
            tick={chartLayout.showYAxisTicks ? axisTickStyle : false}
            tickLine={false}
            axisLine={{ stroke: axisColor, strokeWidth: 1 }}
            width={yAxisWidth}
            tickCount={chartLayout.yTickCount}
            tickFormatter={chartLayout.showYAxisTicks ? yAxisTickFormatter : undefined}
            domain={yDomain}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              borderColor: 'hsl(var(--border))',
              color: 'hsl(var(--card-foreground))',
              borderRadius: 'var(--radius)',
              fontSize: '12px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            itemStyle={{ color: lineColor }}
          />
          {primarySeries && (
            <Area
              type="monotone"
              dataKey={primarySeries}
              stroke={lineColor}
              fillOpacity={1}
              fill={`url(#color-${card.id})`}
              strokeWidth={2}
              baseValue="dataMin"
              dot={false}
              isAnimationActive={!isCompactCard}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
