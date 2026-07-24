/**
 * Recursively scans and deletes keys starting with $ from input objects.
 * Prevents MongoDB query operator injection by stripping out MongoDB operators.
 */
export function sanitizeMongoPayload<T>(input: T): T {
  if (input === null || typeof input !== 'object') {
    return input;
  }

  if (Array.isArray(input)) {
    const cloned = [];
    for (let i = 0; i < input.length; i++) {
      cloned.push(sanitizeMongoPayload(input[i]));
    }
    return cloned as unknown as T;
  }

  const obj = input as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    if (!key.startsWith('$')) {
      result[key] = sanitizeMongoPayload(obj[key]);
    }
  }

  return result as T;
}
