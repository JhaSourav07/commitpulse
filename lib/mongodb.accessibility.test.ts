import { describe, it, expect } from 'vitest';
import dbConnect, { dbDisconnect } from './mongodb';

describe('mongodb - Exports & Runtime/Env Guardrails', () => {
  it('exports dbConnect as a default function', () => {
    expect(dbConnect).toBeDefined();
    expect(dbConnect).toBeInstanceOf(Function);
  });

  it('exports dbDisconnect as a named function', () => {
    expect(dbDisconnect).toBeDefined();
    expect(dbDisconnect).toBeInstanceOf(Function);
  });

  it('rejects with Edge runtime error when NEXT_RUNTIME is edge', async () => {
    const originalRuntime = process.env.NEXT_RUNTIME;
    process.env.NEXT_RUNTIME = 'edge';
    try {
      await expect(dbConnect()).rejects.toThrow('MongoDB is not supported in the Edge runtime');
    } finally {
      process.env.NEXT_RUNTIME = originalRuntime;
    }
  });

  it('rejects with missing URI error when MONGODB_URI is not defined', async () => {
    const originalUri = process.env.MONGODB_URI;
    delete process.env.MONGODB_URI;
    try {
      await expect(dbConnect()).rejects.toThrow(
        'Please define the MONGODB_URI environment variable'
      );
    } finally {
      if (originalUri === undefined) {
        delete process.env.MONGODB_URI;
      } else {
        process.env.MONGODB_URI = originalUri;
      }
    }
  });

  it('dbDisconnect returns a Promise that resolves', async () => {
    await expect(dbDisconnect()).resolves.toBeUndefined();
  });
});
