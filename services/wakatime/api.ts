// services/wakatime/api.ts

const WAKATIME_API_ENDPOINT = 'https://wakatime.com/api/v1/users/current/stats/last_7_days';

export interface WakaTimeLanguage {
  name: string;
  percent: number;
  total_seconds: number;
  text: string;
}

export interface WakaTimeStatData {
  isConfigured: boolean;
  totalSeconds?: number;
  dailyAverage?: number;
  languages?: WakaTimeLanguage[];
  humanReadableTotal?: string;
  humanReadableDailyAverage?: string;
}

export function isWakaTimeConfigured(): boolean {
  return !!process.env.WAKATIME_API_KEY;
}

/**
 * Fetch the user's WakaTime stats
 */
export async function getWakaTimeStats(): Promise<WakaTimeStatData> {
  if (!isWakaTimeConfigured()) {
    return { isConfigured: false };
  }

  try {
    const apiKey = process.env.WAKATIME_API_KEY!;
    const authHeader = `Basic ${Buffer.from(apiKey).toString('base64')}`;

    const response = await fetch(WAKATIME_API_ENDPOINT, {
      headers: {
        Authorization: authHeader,
      },
      // Do not cache this request natively, we'll cache it at the route level
      cache: 'no-store',
    });

    if (!response.ok) {
      console.warn(`Error fetching WakaTime stats: ${response.status} ${response.statusText}`);
      return { isConfigured: true };
    }

    const json = await response.json();
    const data = json.data;

    if (!data) {
      return { isConfigured: true };
    }

    return {
      isConfigured: true,
      totalSeconds: data.total_seconds,
      dailyAverage: data.daily_average,
      languages: data.languages ? data.languages.slice(0, 5) : [],
      humanReadableTotal: data.human_readable_total,
      humanReadableDailyAverage: data.human_readable_daily_average,
    };
  } catch (error) {
    console.warn('Error fetching WakaTime stats:', error);
    return { isConfigured: true };
  }
}
