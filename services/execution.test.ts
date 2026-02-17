import { describe, expect, it } from 'vitest';
import { __testables } from './execution';

describe('execution contract normalize', () => {
  it('normalizes scalar payload with default mapping', () => {
    const payload = __testables.normalizePayload(
      {
        type: 'scalar',
        data: {
          value: 18,
          unit: '%',
          trend: 'up',
        },
      },
      'scalar',
      {},
    );

    expect(payload).toEqual({
      value: 18,
      unit: '%',
      trend: 'up',
      color: undefined,
    });
  });

  it('normalizes series payload with custom mapping', () => {
    const payload = __testables.normalizePayload(
      {
        type: 'series',
        data: {
          axis: ['A', 'B'],
          lines: [{ label: 'kpi', nums: [1, 2] }],
        },
      },
      'series',
      {
        series: {
          x_axis_key: 'axis',
          series_key: 'lines',
          series_name_key: 'label',
          series_values_key: 'nums',
        },
      },
    );

    expect(payload).toEqual({
      x_axis: ['A', 'B'],
      series: [{ name: 'kpi', values: [1, 2] }],
    });
  });

  it('keeps multiple series entries when names are duplicated', () => {
    const payload = __testables.normalizePayload(
      {
        type: 'series',
        data: {
          x_axis: ['A', 'B'],
          series: [
            { name: 'dup', values: [1, 2] },
            { name: 'dup', values: [3, 4] },
          ],
        },
      },
      'series',
      {},
    );

    expect(payload).toEqual({
      x_axis: ['A', 'B'],
      series: [
        { name: 'dup', values: [1, 2] },
        { name: 'dup', values: [3, 4] },
      ],
    });
  });

  it('normalizes status state aliases', () => {
    const payload = __testables.normalizePayload(
      {
        type: 'status',
        data: {
          label: 'DB',
          state: 'critical',
          message: 'down',
        },
      },
      'status',
      {},
    );

    expect(payload).toEqual({
      label: 'DB',
      state: 'error',
      message: 'down',
    });
  });

  it('normalizes gauge payload with custom mapping', () => {
    const payload = __testables.normalizePayload(
      {
        type: 'gauge',
        data: {
          limits: { low: 10, high: 60 },
          current: '28.5',
          suffix: 'MB',
        },
      },
      'gauge',
      {
        gauge: {
          min_key: 'limits.low',
          max_key: 'limits.high',
          value_key: 'current',
          unit_key: 'suffix',
        },
      },
    );

    expect(payload).toEqual({
      min: 10,
      max: 60,
      value: 28.5,
      unit: 'MB',
    });
  });

  it('normalizes digest payload with custom mapping', () => {
    const payload = __testables.normalizePayload(
      {
        type: 'digest',
        data: {
          blocks: [
            { heading: 'A', content: 'alpha' },
            { heading: 'B', content: 'beta' },
          ],
        },
      },
      'digest',
      {
        digest: {
          items_key: 'blocks',
          title_key: 'heading',
          body_key: 'content',
        },
      },
    );

    expect(payload).toEqual({
      items: [
        { title: 'A', body: 'alpha' },
        { title: 'B', body: 'beta' },
      ],
    });
  });

  it('throws when digest item body is missing', () => {
    expect(() =>
      __testables.normalizePayload(
        {
          type: 'digest',
          data: {
            items: [{ title: 'A' }],
          },
        },
        'digest',
        {},
      ),
    ).toThrow(/digest/i);
  });

  it('throws when type does not match card type', () => {
    expect(() =>
      __testables.normalizePayload(
        {
          type: 'scalar',
          data: { value: 1 },
        },
        'series',
        {},
      ),
    ).toThrow(/card type|不一致/);
  });
});
