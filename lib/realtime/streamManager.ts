import { fetchGitHubContributions } from '@/lib/github';
import { calculateStreak } from '@/lib/calculate';
import type { ContributionCalendar } from '@/types';
import { diffContributions, type ContributionDelta } from './diffContributions';

type ConnectionCallback = (event: string, data: unknown) => void;

interface StreamConnection {
  id: string;
  username: string;
  interval: number;
  callback: ConnectionCallback;
  timer: NodeJS.Timeout;
  lastCalendar: ContributionCalendar | null;
  lastStreak: { currentStreak: number; longestStreak: number; totalContributions: number } | null;
}

class StreamManager {
  private connections = new Map<string, StreamConnection>();

  public register(
    id: string,
    username: string,
    interval: number,
    callback: ConnectionCallback
  ): void {
    // interval is in seconds
    const intervalMs = interval * 1000;

    const connection: StreamConnection = {
      id,
      username,
      interval,
      callback,
      lastCalendar: null,
      lastStreak: null,
      timer: setInterval(() => this.poll(id), intervalMs),
    };

    this.connections.set(id, connection);

    // Perform initial fetch immediately
    this.poll(id);
  }

  public unregister(id: string): void {
    const connection = this.connections.get(id);
    if (connection) {
      clearInterval(connection.timer);
      this.connections.delete(id);
    }
  }

  private async poll(id: string): Promise<void> {
    const connection = this.connections.get(id);
    if (!connection) return;

    try {
      const data = await fetchGitHubContributions(connection.username, { bypassCache: true });
      const newCalendar = data.calendar;
      const newStreak = calculateStreak(newCalendar);

      if (connection.lastCalendar) {
        // Calculate diffs
        const deltas = diffContributions(connection.username, connection.lastCalendar, newCalendar);
        for (const delta of deltas) {
          connection.callback('contribution_added', delta.payload);
        }

        // Compare streaks
        if (
          !connection.lastStreak ||
          connection.lastStreak.currentStreak !== newStreak.currentStreak ||
          connection.lastStreak.longestStreak !== newStreak.longestStreak ||
          connection.lastStreak.totalContributions !== newStreak.totalContributions
        ) {
          const streakDelta: ContributionDelta = {
            type: 'streak_change',
            payload: {
              username: connection.username,
              currentStreak: newStreak.currentStreak,
              longestStreak: newStreak.longestStreak,
              totalContributions: newStreak.totalContributions,
            },
          };
          connection.callback('streak_change', streakDelta.payload);
        }
      } else {
        // First fetch: send current state
        const initialStreakDelta: ContributionDelta = {
          type: 'streak_change',
          payload: {
            username: connection.username,
            currentStreak: newStreak.currentStreak,
            longestStreak: newStreak.longestStreak,
            totalContributions: newStreak.totalContributions,
          },
        };
        connection.callback('streak_change', initialStreakDelta.payload);
      }

      connection.lastCalendar = newCalendar;
      connection.lastStreak = {
        currentStreak: newStreak.currentStreak,
        longestStreak: newStreak.longestStreak,
        totalContributions: newStreak.totalContributions,
      };
    } catch (error) {
      connection.callback('error', {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

export const streamManager = new StreamManager();
export type { ConnectionCallback, StreamConnection };
