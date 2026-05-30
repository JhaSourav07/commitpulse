/**
 * Default fallback date range when year is missing or invalid.
 * Uses current year as fallback.
 */
export const DEFAULT_DATE_RANGE = {
  from: `${new Date().getUTCFullYear()}-01-01T00:00:00Z`,
  to: `${new Date().getUTCFullYear()}-12-31T23:59:59Z`,
};

/**
 * Date range with from and to ISO strings for GitHub API queries.
 */
export interface DateRange {
  from: string;
  to: string;
}

/**
 * Formats a year into a date range for GitHub contributions query.
 * Returns fallback default ranges when year is missing, partial, or invalid.
 *
 * @param year - The year as string (e.g., "2024", "24", "2", "", undefined)
 * @returns DateRange object with from and to ISO date strings
 *
 * @example
 * formatDateRange("2024") // { from: "2024-01-01T00:00:00Z", to: "2024-12-31T23:59:59Z" }
 * formatDateRange("24") // { from: "2024-01-01T00:00:00Z", to: "2024-12-31T23:59:59Z" }
 * formatDateRange("") // returns DEFAULT_DATE_RANGE
 * formatDateRange(undefined) // returns DEFAULT_DATE_RANGE
 */
export function formatDateRange(year?: string): DateRange {
  if (!year || year.trim() === '') {
    return { ...DEFAULT_DATE_RANGE };
  }

  const trimmedYear = year.trim();

  // Handle partial years (1 or 2 digits): assume 20xx
  // For 2-digit: '24' -> 2024
  // For 1-digit: '4' -> 2024 (not 2004, to stay in reasonable range)
  let fullYear: number;
  if (trimmedYear.length === 2) {
    fullYear = parseInt('20' + trimmedYear, 10);
  } else if (trimmedYear.length === 1) {
    // 1-digit: map to 2020 + digit (4 -> 2024, 9 -> 2029)
    fullYear = 2020 + parseInt(trimmedYear, 10);
  } else {
    fullYear = parseInt(trimmedYear, 10);
  }

  // Validate parsed year – must be >= 2008 (GitHub founding year) and reasonable future limit
  const currentYear = new Date().getUTCFullYear();
  const isValidYear = !isNaN(fullYear) && fullYear >= 2008 && fullYear <= currentYear + 5;

  if (!isValidYear) {
    return { ...DEFAULT_DATE_RANGE };
  }

  return {
    from: `${fullYear}-01-01T00:00:00Z`,
    to: `${fullYear}-12-31T23:59:59Z`,
  };
}
