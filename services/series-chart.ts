import { SERIES_MODES, SeriesMode, ScriptOutputSeriesItem } from '../types';

export const SERIES_MODE_DEFAULT: SeriesMode = 'single_axis_single_line';
export const SERIES_DUAL_AXIS_RANGE_RATIO_THRESHOLD = 3;

const isSeriesMode = (value: unknown): value is SeriesMode =>
  typeof value === 'string' && SERIES_MODES.includes(value as SeriesMode);

const parseSeriesItems = (payload: unknown): ScriptOutputSeriesItem[] => {
  if (!payload || typeof payload !== 'object') return [];
  const seriesRaw = (payload as { series?: unknown }).series;
  if (!Array.isArray(seriesRaw)) return [];

  return seriesRaw.map((item, index) => {
    const valuesRaw = Array.isArray((item as { values?: unknown })?.values)
      ? ((item as { values: unknown[] }).values ?? [])
      : [];

    return {
      name: String((item as { name?: unknown })?.name ?? `Series ${index + 1}`),
      values: valuesRaw.map((value) => Number(value)),
    };
  });
};

export const normalizeSeriesMode = (value: unknown, fallback: SeriesMode = SERIES_MODE_DEFAULT): SeriesMode =>
  isSeriesMode(value) ? value : fallback;

export const isDoubleLineSeriesMode = (mode: SeriesMode): boolean => mode !== 'single_axis_single_line';

export const isDualAxisSeriesMode = (mode: SeriesMode): boolean => mode === 'dual_axis_double_line';

export const getFirstTwoSeries = (
  payload: unknown,
): { primarySeries?: ScriptOutputSeriesItem; secondarySeries?: ScriptOutputSeriesItem } => {
  const [primarySeries, secondarySeries] = parseSeriesItems(payload);
  return { primarySeries, secondarySeries };
};

export const getFiniteSeriesValues = (series?: ScriptOutputSeriesItem): number[] => {
  if (!series) return [];
  return series.values.filter((value) => Number.isFinite(value));
};

export const getSeriesValueRange = (series?: ScriptOutputSeriesItem): number | undefined => {
  const values = getFiniteSeriesValues(series);
  if (values.length === 0) return undefined;
  return Math.max(...values) - Math.min(...values);
};

export const getSeriesRangeRatio = (
  firstSeries?: ScriptOutputSeriesItem,
  secondSeries?: ScriptOutputSeriesItem,
): number | undefined => {
  const firstRange = getSeriesValueRange(firstSeries);
  const secondRange = getSeriesValueRange(secondSeries);

  if (firstRange === undefined || secondRange === undefined) return undefined;
  if (firstRange === 0 && secondRange === 0) return 1;
  if (firstRange === 0 || secondRange === 0) return Number.POSITIVE_INFINITY;
  return Math.max(firstRange, secondRange) / Math.min(firstRange, secondRange);
};

export const inferSeriesModeFromPayload = (
  payload: unknown,
  dualAxisThreshold = SERIES_DUAL_AXIS_RANGE_RATIO_THRESHOLD,
): SeriesMode => {
  const { primarySeries, secondarySeries } = getFirstTwoSeries(payload);
  if (!primarySeries || !secondarySeries) return 'single_axis_single_line';

  const ratio = getSeriesRangeRatio(primarySeries, secondarySeries);
  if (ratio === undefined) return 'single_axis_double_line';
  return ratio >= dualAxisThreshold ? 'dual_axis_double_line' : 'single_axis_double_line';
};

export const shouldFallbackToSingleLine = (mode: SeriesMode, payload: unknown): boolean => {
  if (!isDoubleLineSeriesMode(mode)) return false;
  const { secondarySeries } = getFirstTwoSeries(payload);
  return !secondarySeries;
};
