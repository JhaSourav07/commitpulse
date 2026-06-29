import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SyncQueue } from './syncQueue';

describe('SyncQueue', () => {
  let queue: SyncQueue;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubEnv('NODE_ENV', 'development');
    queue = new SyncQueue();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it('executes a single enqueued task', async () => {
    const fn = vi.fn();
    queue.enqueue(async () => {
      fn();
    });
    await vi.advanceTimersByTimeAsync(2100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('stagger delay between multiple tasks', async () => {
    const order: number[] = [];
    queue.enqueue(async () => {
      order.push(1);
    });
    queue.enqueue(async () => {
      order.push(2);
    });
    await vi.advanceTimersByTimeAsync(1900);
    expect(order).toEqual([1]);
    await vi.advanceTimersByTimeAsync(2100);
    expect(order).toEqual([1, 2]);
  });

  it('does not re-process while a task is running', async () => {
    const slow = vi.fn().mockImplementation(() => new Promise(() => {}));
    queue.enqueue(slow);
    queue.enqueue(async () => {});
    await vi.advanceTimersByTimeAsync(100);
    expect(slow).toHaveBeenCalledTimes(1);
  });

  it('isolates errors between tasks', async () => {
    const errFn = vi.fn().mockRejectedValue(new Error('boom'));
    const okFn = vi.fn();
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    queue.enqueue(errFn);
    queue.enqueue(okFn);
    await vi.advanceTimersByTimeAsync(4200);
    expect(errFn).toHaveBeenCalledTimes(1);
    expect(okFn).toHaveBeenCalledTimes(1);
    errSpy.mockRestore();
  });

  it('reports pending task count', async () => {
    expect(queue.pendingTasks).toBe(0);
    queue.enqueue(async () => {
      await new Promise(() => {});
    });
    queue.enqueue(async () => {});
    expect(queue.pendingTasks).toBe(1);
  });

  it('bypasses queue in test environment', () => {
    vi.stubEnv('NODE_ENV', 'test');
    const q = new SyncQueue();
    const fn = vi.fn();
    q.enqueue(async () => {
      fn();
    });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(q.pendingTasks).toBe(0);
  });
});
