import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SyncQueue, syncQueue } from './syncQueue';

describe('SyncQueue', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // Variation 1: the test-environment bypass path.
  // Under NODE_ENV==='test' the queue is intentionally skipped so that mocks
  // resolve synchronously; nothing should ever accumulate in the queue.
  describe('test-environment bypass', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'test');
    });

    it('runs the task immediately without enqueueing it', () => {
      const q = new SyncQueue();
      const task = vi.fn(async () => {});
      q.enqueue(task);
      expect(task).toHaveBeenCalledTimes(1);
      expect(q.pendingTasks).toBe(0);
    });

    it('swallows a rejected task without throwing or queueing', () => {
      const q = new SyncQueue();
      expect(() =>
        q.enqueue(async () => {
          throw new Error('boom');
        })
      ).not.toThrow();
      expect(q.pendingTasks).toBe(0);
    });

    it('starts with no pending tasks and exposes a shared singleton', () => {
      expect(syncQueue).toBeInstanceOf(SyncQueue);
      expect(syncQueue.pendingTasks).toBe(0);
    });
  });

  // Variation 2: the real staggered-processing path (non-test env).
  // Tasks must run in FIFO order, separated by the stagger delay, and a
  // failing task must not stall the remainder of the queue.
  describe('staggered processing (non-test env)', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'development');
      vi.useFakeTimers();
    });

    it('processes enqueued tasks in FIFO order and drains the queue', async () => {
      const q = new SyncQueue();
      const order: number[] = [];
      q.enqueue(async () => {
        order.push(1);
      });
      q.enqueue(async () => {
        order.push(2);
      });
      q.enqueue(async () => {
        order.push(3);
      });

      await vi.runAllTimersAsync();

      expect(order).toEqual([1, 2, 3]);
      expect(q.pendingTasks).toBe(0);
    });

    it('continues processing after a task throws', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const q = new SyncQueue();
      const after = vi.fn(async () => {});

      q.enqueue(async () => {
        throw new Error('first task failed');
      });
      q.enqueue(after);

      await vi.runAllTimersAsync();

      expect(after).toHaveBeenCalledTimes(1);
      expect(q.pendingTasks).toBe(0);
    });

    it('staggers tasks by the delay rather than running them back-to-back', async () => {
      const q = new SyncQueue();
      const second = vi.fn(async () => {});

      q.enqueue(async () => {});
      q.enqueue(second);

      // First task runs right away; the second is still waiting on the stagger.
      await vi.advanceTimersByTimeAsync(0);
      expect(second).not.toHaveBeenCalled();
      expect(q.pendingTasks).toBe(1);

      // After the stagger delay elapses, the second task runs.
      await vi.advanceTimersByTimeAsync(2000);
      expect(second).toHaveBeenCalledTimes(1);
      expect(q.pendingTasks).toBe(0);
    });
  });
});
