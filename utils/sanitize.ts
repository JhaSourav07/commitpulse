/**
 * Recursively scans and deletes keys starting with $ from input objects.
 * Prevents MongoDB query operator injection by stripping out MongoDB operators.
 */
export function sanitizeMongoPayload<T>(input: T): T {
  if (input === null || typeof input !== 'object') {
    return input;
  }

  if (Array.isArray(input)) {
    for (let i = 0; i < input.length; i++) {
      input[i] = sanitizeMongoPayload(input[i]);
    }
    return input;
  }

  const obj = input as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$')) {
      delete obj[key];
    } else {
      obj[key] = sanitizeMongoPayload(obj[key]);
    }
  }

  return input;
}
