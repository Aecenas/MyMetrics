import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from '../store';

describe('section marker store behavior', () => {
  beforeEach(() => {
    useStore.setState({ sectionMarkers: [] });
  });

  it('normalizes and updates section markers within grid bounds', () => {
    useStore.getState().addSectionMarker({
      title: '  Core  ',
      group: 'Infra',
      after_row: -2,
      start_col: 3,
      span_col: 9,
    });

    let marker = useStore.getState().sectionMarkers[0];
    expect(marker).toBeDefined();
    expect(marker.title).toBe('Core');
    expect(marker.after_row).toBe(-1);
    expect(marker.start_col).toBe(3);
    expect(marker.span_col).toBe(1);
    expect(marker.line_color).toBe('primary');
    expect(marker.line_style).toBe('dashed');
    expect(marker.line_width).toBe(2);
    expect(marker.label_align).toBe('center');

    useStore.getState().updateSectionMarker(marker.id, {
      after_row: 7.9,
      start_col: 2,
      span_col: 7,
      line_color: 'red',
      line_style: 'solid',
      line_width: 4,
      label_align: 'right',
    });

    marker = useStore.getState().sectionMarkers[0];
    expect(marker.after_row).toBe(7);
    expect(marker.start_col).toBe(2);
    expect(marker.span_col).toBe(2);
    expect(marker.line_color).toBe('red');
    expect(marker.line_style).toBe('solid');
    expect(marker.line_width).toBe(4);
    expect(marker.label_align).toBe('right');

    useStore.getState().removeSectionMarker(marker.id);
    expect(useStore.getState().sectionMarkers).toEqual([]);
  });
});
