export type HexColor = string & { __brand: 'HexColor' };

/**
 * Processed streak statistics calculated from the user's GitHub contribution data.
 */
export interface StreakStats {
  /** The user's current active streak in days. Resets to 0 if no contributions today or yesterday. */
  currentStreak: number;

  /** The user's all-time longest streak in days. */
  longestStreak: number;

  /** Total number of contributions in the queried period. */
  totalContributions: number;

  /** Local calendar date used as "today" for streak calculation (format: YYYY-MM-DD). */
  todayDate: string;
}

/**
 * Resolved color palette for a badge theme after URL parameter overrides have been applied.
 */
export interface BadgeTheme {
  /** Background fill color as a hex string WITHOUT the leading '#' (e.g. '0d1117'). */
  bg: HexColor;

  /** Label and stat text color as a hex string WITHOUT the leading '#' (e.g. 'ffffff'). */
  text: HexColor;

  /** Tower and glow accent color as a hex string WITHOUT the leading '#' (e.g. '58a6ff'). */
  accent: HexColor;
}

/**
 * Represents a single day's contribution data returned from the GitHub GraphQL API.
 */
export interface ContributionDay {
  /** Number of contributions made on this day. */
  contributionCount: number;

  /** Calendar date of this contribution entry (format: YYYY-MM-DD). */
  date: string;
}

/**
 * Represents a single week's worth of contribution days.
 */
export interface ContributionWeek {
  /** Array of contribution day entries for this week, ordered Sunday to Saturday. */
  contributionDays: ContributionDay[];
}

/**
 * Full contribution calendar returned from the GitHub GraphQL API.
 */
export interface ContributionCalendar {
  /** Total number of contributions across all weeks in this calendar. */
  totalContributions: number;

  /** Array of weekly contribution data covering the queried date range. */
  weeks: ContributionWeek[];
}

/**
 * Month-over-month contribution statistics used by the monthly view.
 */
export interface MonthlyStats {
  /** Total number of contributions in the current calendar month. */
  currentMonthTotal: number;

  /** Total number of contributions in the previous calendar month. */
  previousMonthTotal: number;

  /** Percentage change in contributions compared to the previous month (can be negative). */
  deltaPercentage: number;

  /** Absolute change in contribution count compared to the previous month (can be negative). */
  deltaAbsolute: number;

  /** Human-readable name of the current month (e.g. 'January', 'February'). */
  currentMonthName: string;
}

/**
 * Parameters accepted by the /api/streak endpoint.
 * All fields except `user` are optional; URL parameters override theme defaults.
 */
export interface BadgeParams {
  /** GitHub username whose contribution data will be fetched and rendered. Required. */
  user: string;

  /** Number of grace days before a streak resets (handles timezone edge cases). Defaults to 1. */
  grace?: number;

  /** Background fill color as a hex string WITHOUT the leading '#'. Overrides theme default. */
  bg: HexColor;

  /** Label and stat text color as a hex string WITHOUT the leading '#'. Overrides theme default. */
  text: HexColor;

  /** Tower and glow accent color as a hex string WITHOUT the leading '#'. Overrides theme default. */
  accent: HexColor;

  /** Duration of the radar scan line animation (e.g. '4s', '8s', '12s'). Defaults to '8s'. */
  speed: string;

  /** Tower height scaling algorithm. 'linear' scales proportionally; 'log' uses logarithmic scale for high contributors. Defaults to 'linear'. */
  scale: 'linear' | 'log';

  /** Font family override for badge typography (e.g. 'monospace'). Defaults to theme font. */
  font?: string;

  /** Border corner radius in pixels. Defaults to 8. */
  radius?: number;

  /** When true, automatically selects a theme based on the viewer's system color scheme. */
  autoTheme?: boolean;

  /** When true, hides the username title from the badge. */
  hide_title?: boolean;

  /** When true, renders the badge without a background card. */
  hideBackground?: boolean;

  /** When true, hides the streak and contribution stat numbers from the badge. */
  hide_stats?: boolean;

  /** Language/locale code for stat labels (e.g. 'en', 'fr', 'ja'). Defaults to 'en'. */
  lang?: string;

  /** Badge layout variant. 'default' shows the isometric monolith; 'monthly' shows month-over-month stats. */
  view?: 'default' | 'monthly';

  /** Format for the monthly delta indicator. 'percent' shows %, 'absolute' shows raw count, 'both' shows both. */
  delta_format?: 'percent' | 'absolute' | 'both';

  /** Custom width of the badge in pixels. Defaults to theme preset. */
  width?: number;

  /** Custom height of the badge in pixels. Defaults to theme preset. */
  height?: number;

  /** Preset size of the badge. 'small', 'medium', or 'large'. Overrides width and height. */
  size?: 'small' | 'medium' | 'large';
}
