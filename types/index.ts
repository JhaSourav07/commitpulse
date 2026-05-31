// types/index.ts

export type HexColor = string & { __brand: 'HexColor' };

export type Scale = 'linear' | 'log';

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
  /** Number of contributions made on this day. */
  contributionCount: number;

  /** Calendar date of this contribution entry (format: YYYY-MM-DD). */
  date: string;

  // Added for LoC (Lines of Code) Mode
  locAdditions?: number;
  locDeletions?: number;
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

  /** Timestamp of the last successful GraphQL API sync. Used for delta updates. */
  lastSyncedAt?: string;
}

/**
 * Represents a user's contributions to a specific repository.
 */
export interface RepoContribution {
  repository: {
    primaryLanguage: { name: string } | null;
  };
  contributions: { totalCount: number };
}

/**
 * Extended contribution data including both the calendar and repository-specific contributions.
 */
export interface ExtendedContributionData {
  calendar: ContributionCalendar;
  repoContributions: RepoContribution[];
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
  /** GitHub username of the opponent to compare against. */
  versus?: string;

  /** Number of grace days before a streak resets (handles timezone edge cases). Defaults to 1. */
  grace?: number;

  /** Background fill color as a hex string WITHOUT the leading '#'. Overrides theme default. */
  bg: HexColor;

  /** Label and stat text color as a hex string WITHOUT the leading '#'. Overrides theme default. */
  text: HexColor;

  /** Tower and glow accent color as a hex string WITHOUT the leading '#'. Overrides theme default. */
  accent: HexColor | HexColor[];

  /** Duration of the radar scan line animation (e.g. '4s', '8s', '12s'). Defaults to '8s'. */
  speed: SpeedString;

  /** Animation style for the isometric towers on load: 'rise' (default), 'fade', 'slide', or 'none'. */
  entrance?: 'rise' | 'fade' | 'slide' | 'none';

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

  /** When true, hides the username title from the badge. */
  hide_title?: boolean;

  /** When true, renders the badge without a background card. */
  hideBackground?: boolean;

  /** When true, hides the streak and contribution stat numbers from the badge. */
  hide_stats?: boolean;

  /** Language/locale code for stat labels (e.g. 'en', 'fr', 'ja'). Defaults to 'en'. */
  lang?: string;

  /** Badge layout variant. 'default' shows the isometric monolith; 'monthly' shows month-over-month stats; 'heatmap' shows a flat 2D contribution heatmap; 'pulse' shows a heartbeat sparkline. */
  view?: 'default' | 'monthly' | 'heatmap' | 'pulse';

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
   * Global opacity scalar applied to all tower face fill-opacity values (0.1–1.0).
   * Default is 1.0 (fully opaque, current behavior). Values below 0.1 are clamped
   * to 0.1; values above 1.0 are clamped to 1.0.
   */
  opacity?: number;

  /** Opt-in to show volumetric gradients on the monolith floor. */
  gradient?: boolean;

  disable_particles?: boolean;
  animate?: boolean;
  glow?: boolean;
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
}
