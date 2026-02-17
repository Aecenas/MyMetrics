import { describe, expect, it } from 'vitest';
import {
  inferSeriesModeFromPayload,
  normalizeSeriesMode,
  shouldFallbackToSingleLine,
} from './series-chart';

describe('series chart helpers', () => {
  it('normalizes mode with fallback', () => {
    expect(normalizeSeriesMode('single_axis_double_line')).toBe('single_axis_double_line');
    expect(normalizeSeriesMode('unknown')).toBe('single_axis_single_line');
    expect(normalizeSeriesMode(undefined, 'dual_axis_double_line')).toBe('dual_axis_double_line');
  });

  it('infers single-axis double-line when two ranges are close', () => {
    const mode = inferSeriesModeFromPayload({
      series: [
        { name: 'cpu', values: [0, 10, 8] },
        { name: 'mem', values: [2, 20, 16] },
      ],
    });

    expect(mode).toBe('single_axis_double_line');
  });

  it('infers dual-axis double-line when range ratio is large', () => {
    const mode = inferSeriesModeFromPayload({
      series: [
        { name: 'cpu', values: [0, 10, 8] },
        { name: 'cost', values: [0, 40, 30] },
      ],
    });

    expect(mode).toBe('dual_axis_double_line');
  });

  it('falls back to single-axis single-line when second line is missing', () => {
    const mode = inferSeriesModeFromPayload({
      series: [{ name: 'cpu', values: [0, 10, 8] }],
    });

    expect(mode).toBe('single_axis_single_line');
    expect(
      shouldFallbackToSingleLine('single_axis_double_line', {
        series: [{ name: 'cpu', values: [1, 2, 3] }],
      }),
    ).toBe(true);
  });

  it('does not fallback when second line exists', () => {
    expect(
      shouldFallbackToSingleLine('dual_axis_double_line', {
        series: [
          { name: 'cpu', values: [1, 2, 3] },
          { name: 'mem', values: [3, 4, 5] },
        ],
      }),
    ).toBe(false);
  });
});
