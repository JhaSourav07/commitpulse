import 'server-only';

/**
 * A queue to stagger incoming sync tasks across the available hourly quota.
 * This prevents the application from making too many concurrent requests to the GitHub API,
 * which could lead to rate limit exhaustion.
 */
export class SyncQueue {
  private queue: (() => Promise<void>)[] = [];
  private isProcessing = false;
  // Delay between processing tasks to stagger API usage (e.g., 2 seconds)
  private readonly STAGGER_DELAY_MS = 2000;

  /**
   * Enqueues a new sync task.
   * @param task An async function representing the sync job.
   * @returns A promise that resolves when the queued task settles.
   */
  public enqueue(task: () => Promise<void>): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      return task().catch((error) => {
        console.error('[SyncQueue] Task failed during test:', error);
      });
    }

    return new Promise<void>((resolve) => {
      const wrappedTask = async () => {
        try {
          await task();
        } catch (error) {
          console.error('[SyncQueue] Task failed:', error);
        } finally {
          resolve();
        }
      };

      this.queue.push(wrappedTask);
      void this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        const task = this.queue.shift();
        if (task) {
          await task();
        }

        if (this.queue.length > 0) {
          await new Promise((resolve) => setTimeout(resolve, this.STAGGER_DELAY_MS));
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  public get pendingTasks(): number {
    return this.queue.length;
  }
}

export const syncQueue = new SyncQueue();
