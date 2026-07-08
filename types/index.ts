// types/index.ts

/**
 * Branded hex color string. Only `sanitizeHexColor` (for user input)
 * or `hexColor` (for hardcoded literals) may produce this type.
 * Do not cast plain strings to HexColor manually.
 */
export type HexColor = string & { __brand: 'HexColor' };

export type Scale = 'linear' | 'log' | 'sqrt';

export type BadgeSize = 'small' | 'medium' | 'large';

export type SpeedString = `${number}s`;

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

  /** Negative/error state color as a hex string WITHOUT the leading '#' (e.g. 'ff4444'). Optional. */
  negative?: HexColor;
}

/**
 * Represents a single day's contribution data returned from the GitHub GraphQL API.
 */
export interface ContributionDay {
  /** Number of contributions made on this day (commits mode). */
  contributionCount: number;

  /** Calendar date of this contribution entry (format: YYYY-MM-DD). */
  date: string;

  /**
   * Lines of code added on this day.
   * Only present when data is fetched in LoC mode (`?mode=loc`).
   * Always `undefined` in standard commits mode.
   * Use the `isLocDay()` type guard before accessing this field directly.
   */
  locAdditions?: number;

  /**
   * Lines of code deleted on this day.
   * Only present when data is fetched in LoC mode (`?mode=loc`).
   * Always `undefined` in standard commits mode.
   * Use the `isLocDay()` type guard before accessing this field directly.
   */
  locDeletions?: number;
}

/**
 * Type guard that narrows a `ContributionDay` to confirm both `locAdditions`
 * and `locDeletions` are present — i.e. the day was fetched in LoC mode.
 *
 * Use this instead of `|| 0` fallbacks to make LoC field access type-safe:
 *
 * @example
 * // Without type guard (unsafe — silent 0 if data missing):
 * const count = (day.locAdditions || 0) + (day.locDeletions || 0);
 *
 * // With type guard (safe — TypeScript guarantees fields are numbers):
 * if (isLocDay(day)) {
 *   const count = day.locAdditions + day.locDeletions;
 * }
 *
 * @param day - Any ContributionDay from commits or LoC mode
 * @returns true if both locAdditions and locDeletions are numbers
 */
export function isLocDay(
  day: ContributionDay
): day is ContributionDay & { locAdditions: number; locDeletions: number } {
  return typeof day.locAdditions === 'number' && typeof day.locDeletions === 'number';
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

  /** Optional aggregate repository contribution count preserved from mocked or extended calendar payloads. */
  repoContributions?: number;

  /** Timestamp of the last successful GraphQL API sync. Used for delta updates. */
  lastSyncedAt?: string;
}

/**
 * Represents a user's contributions to a specific repository.
 */
export interface RepoContribution {
  repository: {
    name: string;
    nameWithOwner?: string;
    primaryLanguage: { name: string } | null;
  };
  contributions: { totalCount: number };
}

/**
 * A repository that the user has contributed to, as returned by the
 * `repositoriesContributedTo` GraphQL query.
 */
export interface ContributedRepo {
  /** Repository name (without owner prefix). */
  name: string;

  /** Full repository identifier including owner (e.g. "owner/repo"). */
  nameWithOwner: string;

  /** Owner of the repository. */
  owner: { login: string };

  /** Number of stars on the repository. */
  stargazerCount: number;

  /** Number of forks of the repository. */
  forkCount: number;

  /** Primary programming language of the repository, if any. */
  primaryLanguage: { name: string } | null;

  /** ISO 8601 timestamp of the last update. */
  updatedAt: string;
}

/**
 * Extended contribution data including both the calendar and repository-specific contributions.
 */
export interface ExtendedContributionData {
  calendar: ContributionCalendar;
  repoContributions: RepoContribution[];
  totalPRs?: number;
  totalIssues?: number;
  totalReviews?: number;
  isOfflineFallback?: boolean;
}

/**
 * Month-over-month contribution statistics used by the monthly view.
 */
export interface MonthlyStats {
  /** Total number of contributions in the current calendar month. */
  currentMonthTotal: number;

  /** Total number of contributions in the previous calendar month. */
  previousMonthTotal: number;

  /** Percentage change in contributions compared to the previous month (can be negative). Null when previous month has zero contributions (undefined baseline). */
  deltaPercentage: number | null;

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

  label?: boolean;
  /** GitHub username of the opponent to compare against. */
  versus?: string;

  /**
   * Number of consecutive missed days forgiven before the streak resets to zero.
   * Controls how lenient streak tracking is for users who occasionally miss a day:
   * - `grace=0`: strict mode — any single missed day immediately resets the streak
   * - `grace=1`: default — one missed day is forgiven before the streak breaks
   * - `grace=2`: lenient — two consecutive missed days are forgiven
   *
   * Accepted range: 0–7. Values outside this range are clamped by `toGraceValue()`.
   *
   * Note: this parameter is unrelated to timezone handling. Timezone behavior
   * (aligning "today" with the user's local midnight) is controlled separately
   * by the `?tz=` URL parameter via `utils/time.ts`.
   */
  grace?: number;

  /** Background fill color as a hex string WITHOUT the leading '#'. Overrides theme default. */
  bg: HexColor;

  /** Background fill color type. 'solid' (default), 'linear', or 'radial' gradient. */
  bgType?: 'solid' | 'linear' | 'radial';

  /** Start color for the background gradient. Hex string WITHOUT the leading '#'. */
  bgStart?: HexColor;

  /** End color for the background gradient. Hex string WITHOUT the leading '#'. */
  bgEnd?: HexColor;

  /** Angle for linear background gradient in degrees (0-360). */
  bgAngle?: number;

  /** Label and stat text color as a hex string WITHOUT the leading '#'. Overrides theme default. */
  text: HexColor;

  /** Tower and glow accent color as a hex string WITHOUT the leading '#'. Overrides theme default. */
  accent: HexColor | HexColor[];

  /** Duration of the radar scan line animation (e.g. '4s', '8s', '12s'). Defaults to '8s'. */
  speed: SpeedString;

  /** Animation style for the isometric towers on load: 'rise' (default), 'fade', 'slide', 'wave', 'bounce', or 'none'. */
  entrance?: 'rise' | 'fade' | 'slide' | 'wave' | 'bounce' | 'none';

  /** Tower height scaling algorithm. 'linear' scales proportionally; 'log' uses logarithmic scale for high contributors. Defaults to 'linear'. */
  scale: Scale;

  /** Font family override for badge typography (e.g. 'monospace'). Defaults to theme font. */
  font?: string;

  /** Border corner radius in pixels. Defaults to 8. */
  radius?: number;

  /** Custom stroke color for the main SVG container. Hex string WITHOUT the leading '#'. */
  border?: string;

  /** When true, automatically selects a theme based on the viewer's system color scheme. */
  autoTheme?: boolean;

  /** Predefined theme name to use for the badge color palette. Overridden by explicit bg/text/accent parameters. */
  theme?: string;

  /** When true, hides the username title from the badge. */
  hide_title?: boolean;

  /** Custom text to display as the title. */
  custom_title?: string;

  /** Custom text to display as the subtitle. */
  custom_subtitle?: string;

  /** When true, renders the badge without a background card. */
  hideBackground?: boolean;

  /** When true, hides the streak and contribution stat numbers from the badge. */
  hide_stats?: boolean;

  /** Language/locale code for stat labels (e.g. 'en', 'fr', 'ja'). Defaults to 'en'. */
  lang?: string;

  /** Badge layout variant. 'default' shows the isometric monolith; 'monthly' shows month-over-month stats; 'heatmap' shows a flat 2D contribution heatmap; 'pulse' shows a heartbeat sparkline; 'skyline' shows a city skyline; 'languages' shows a 3D isometric city of top programming languages; 'constellation' shows a celestial star-map SVG visualization; 'radar' shows a radar chart of contribution metrics. */
  view?:
    | 'default'
    | 'monthly'
    | 'heatmap'
    | 'pulse'
    | 'skyline'
    | 'languages'
    | 'constellation'
    | 'radar'
    | 'doughnut'
    | 'pie'
    | 'activity_graph'
    | 'commit_clock'
    | 'weekday';

  /** Format for the monthly delta indicator. 'percent' shows %, 'absolute' shows raw count, 'both' shows both. */
  delta_format?: 'percent' | 'absolute' | 'both';

  /** Custom width of the badge in pixels. Defaults to theme preset. */
  width?: number;

  /** Custom height of the badge in pixels. Defaults to theme preset. */
  height?: number;

  /** Preset size of the badge. 'small', 'medium', or 'large'. Overrides width and height. */
  size?: BadgeSize;

  /** Rendering mode. 'commits' is the default. 'loc' switches to Lines of Code landscape. */
  mode?: 'commits' | 'loc';

  /** Render the monolith for a specific repository (e.g. "owner/repo") instead of the whole profile. */
  repo?: string;

  /** Organization name to generate a Mega-City for. */
  org?: string;

  /** When true, renders optional 3D isometric month headers and weekday labels. */
  labels?: boolean;

  /** Custom text color for the labels. Overrides text parameter. */
  labelColor?: HexColor;

  /**
   * When true, applies intensity-based opacity shading to tower faces so
   * lower intensity levels appear slightly translucent/dimmer.
   * Default is false (opt-in).
   */
  shading?: boolean;

  /**
   * When true, dims weekend towers (Saturdays and Sundays) to 0.3 opacity.
   * Default is false.
   */
  dim_weekends?: boolean;

  /**
   * Global opacity scalar applied to all tower face fill-opacity values (0.1–1.0).
   * Default is 1.0 (fully opaque, current behavior). Values below 0.1 are clamped
   * to 0.1; values above 1.0 are clamped to 1.0.
   */
  opacity?: number;

  /** Opt-in to show volumetric gradients on the monolith floor. */
  gradient?: boolean;

  /** Custom gradient color stops as comma-separated hex colors (e.g. 'ff6b35,ff007f,7000ff'). Requires at least 2 valid colors. */
  gradient_stops?: string;

  /** Custom gradient direction: 'vertical', 'horizontal', or 'diagonal'. Only used when gradient=true. */
  gradient_dir?: 'vertical' | 'horizontal' | 'diagonal';

  disable_particles?: boolean;
  animate?: boolean;
  glow?: boolean;
  isOfflineFallback?: boolean;
  badges?: boolean;

  /** Projection rotation angle around the Z-axis in degrees (0-360). */
  theta?: number;

  /** Projection tilt angle around the X-axis in degrees (0-90). */
  phi?: number;

  /** When true, renders a compact single-row card (~100px tall) with only username, avatar, and streak count. Skips the full isometric grid. */
  compact?: boolean;

  /** @internal Temporary property to track custom gradient ID during SVG generation. */
  __customGradientId?: string;
}

export interface GraphNode {
  id: string;
  name: string;
  type: 'User' | 'Repo' | 'Contribution' | 'Fork';
  val: number;
  color: string;
  stats?: {
    stars?: number;
    forks?: number;
    language?: string | null;
    updatedAt?: string;
    description?: string | null;
  };
  x?: number;
  y?: number;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
}
// ─── Email Notification Types ───────────────────────────────────────────────

export type NotificationFrequency = 'realtime' | 'daily' | 'weekly';

export interface NotificationPreferences {
  enabled: boolean;
  frequency: NotificationFrequency;
  email: string;
  notifyOnCommit: boolean;
  notifyOnStreak: boolean;
  notifyOnMilestone: boolean;
}

export interface NotificationPayload {
  username: string;
  email: string;
  frequency: NotificationFrequency;
  preferences: {
    notifyOnCommit: boolean;
    notifyOnStreak: boolean;
    notifyOnMilestone: boolean;
  };
}

export interface NotificationResponse {
  success: boolean;
  message: string;
  data?: NotificationPayload;
  managementToken?: string;
}
