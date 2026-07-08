const pendingRequests = new Map<string, Promise<unknown>>();

export function buildDedupKey(username: string, params: Record<string, unknown>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce<Record<string, unknown>>((acc, k) => {
      acc[k] = params[k];
      return acc;
    }, {});
  return `${username}::${JSON.stringify(sortedParams)}`;
}

export async function dedupFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key) as Promise<T>;
  }
  const promise = fetcher().finally(() => {
    pendingRequests.delete(key);
  });
  pendingRequests.set(key, promise as Promise<unknown>);
  return promise;
}

export function getPendingRequestCount(): number {
  return pendingRequests.size;
}
