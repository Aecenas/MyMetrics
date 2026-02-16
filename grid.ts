export const MIN_DASHBOARD_COLUMNS = 2;
export const MAX_DASHBOARD_COLUMNS = 6;
export const DEFAULT_DASHBOARD_COLUMNS = 4;

export const clampDashboardColumns = (value: unknown): number => {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed)) return DEFAULT_DASHBOARD_COLUMNS;
  return Math.max(MIN_DASHBOARD_COLUMNS, Math.min(MAX_DASHBOARD_COLUMNS, parsed));
};
