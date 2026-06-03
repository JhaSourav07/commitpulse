import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateEnvironment,
  enforceEnvironmentValidation,
  getEnvVar,
  COMMITPULSE_ENV_CONFIG,
  type EnvConfig,
} from './env-validation';

describe('validateEnvironment', () => {
  it('should pass validation when all required vars are present', () => {
    const mockEnv = {
      GITHUB_TOKEN: 'ghp_test123',
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    };

    const result = validateEnvironment(COMMITPULSE_ENV_CONFIG, mockEnv);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail validation when required vars are missing', () => {
    const mockEnv = {};

    const result = validateEnvironment(COMMITPULSE_ENV_CONFIG, mockEnv);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0]).toContain('GITHUB_TOKEN');
    expect(result.errors[1]).toContain('NEXT_PUBLIC_SITE_URL');
  });

  it('should fail validation when required vars are empty strings', () => {
    const mockEnv = {
      GITHUB_TOKEN: '   ',
      NEXT_PUBLIC_SITE_URL: '',
    };

    const result = validateEnvironment(COMMITPULSE_ENV_CONFIG, mockEnv);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });

  it('should generate warnings for missing optional vars', () => {
    const mockEnv = {
      GITHUB_TOKEN: 'ghp_test123',
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
      // MONGODB_URI, KV_REST_API_URL, KV_REST_API_TOKEN are missing
    };

    const result = validateEnvironment(COMMITPULSE_ENV_CONFIG, mockEnv);

    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(3);
    expect(result.warnings[0]).toContain('MONGODB_URI');
  });

  it('should handle partial optional vars', () => {
    const mockEnv = {
      GITHUB_TOKEN: 'ghp_test123',
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
      MONGODB_URI: 'mongodb://localhost:27017',
      // KV vars still missing
    };

    const result = validateEnvironment(COMMITPULSE_ENV_CONFIG, mockEnv);

    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(2);
    expect(result.warnings.some((w) => w.includes('KV_REST_API_URL'))).toBe(true);
    expect(result.warnings.some((w) => w.includes('KV_REST_API_TOKEN'))).toBe(true);
  });

  it('should handle custom env configs', () => {
    const customConfig: EnvConfig = {
      required: [
        {
          name: 'CUSTOM_VAR',
          description: 'A custom required variable',
        },
      ],
      optional: [
        {
          name: 'OPTIONAL_VAR',
          description: 'A custom optional variable',
        },
      ],
    };

    const mockEnv = {};

    const result = validateEnvironment(customConfig, mockEnv);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('CUSTOM_VAR');
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('OPTIONAL_VAR');
  });
});

describe('enforceEnvironmentValidation', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it('should throw error when validation fails and throwOnError is true', () => {
    const config: EnvConfig = {
      required: [{ name: 'MISSING_VAR', description: 'Test var' }],
      optional: [],
    };

    expect(() => enforceEnvironmentValidation(config, { throwOnError: true })).toThrow(
      'Environment validation failed'
    );

    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should not throw when throwOnError is false', () => {
    const config: EnvConfig = {
      required: [{ name: 'MISSING_VAR', description: 'Test var' }],
      optional: [],
    };

    const result = enforceEnvironmentValidation(config, { throwOnError: false });

    expect(result.valid).toBe(false);
    expect(() => enforceEnvironmentValidation(config, { throwOnError: false })).not.toThrow();
  });

  it('should not log anything when silent is true', () => {
    const config: EnvConfig = {
      required: [{ name: 'MISSING_VAR', description: 'Test var' }],
      optional: [],
    };

    expect(() =>
      enforceEnvironmentValidation(config, { throwOnError: false, silent: true })
    ).not.toThrow();

    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should log warnings when logWarnings is true', () => {
    const config: EnvConfig = {
      required: [],
      optional: [{ name: 'OPTIONAL_VAR', description: 'Optional test var' }],
    };

    enforceEnvironmentValidation(config, { logWarnings: true, throwOnError: false });

    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  it('should not log warnings when logWarnings is false', () => {
    const config: EnvConfig = {
      required: [],
      optional: [{ name: 'OPTIONAL_VAR', description: 'Optional test var' }],
    };

    enforceEnvironmentValidation(config, { logWarnings: false, throwOnError: false });

    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
});

describe('getEnvVar', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env for each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return value when variable exists and is required', () => {
    process.env.TEST_VAR = 'test-value';

    const result = getEnvVar('TEST_VAR', true);

    expect(result).toBe('test-value');
  });

  it('should throw when required variable is missing', () => {
    delete process.env.TEST_VAR;

    expect(() => getEnvVar('TEST_VAR', true)).toThrow('Missing required environment variable');
  });

  it('should throw when required variable is empty', () => {
    process.env.TEST_VAR = '   ';

    expect(() => getEnvVar('TEST_VAR', true)).toThrow('Missing required environment variable');
  });

  it('should return undefined when optional variable is missing', () => {
    delete process.env.TEST_VAR;

    const result = getEnvVar('TEST_VAR', false);

    expect(result).toBeUndefined();
  });

  it('should return value when optional variable exists', () => {
    process.env.TEST_VAR = 'optional-value';

    const result = getEnvVar('TEST_VAR', false);

    expect(result).toBe('optional-value');
  });

  it('should default to required=true when not specified', () => {
    delete process.env.TEST_VAR;

    expect(() => getEnvVar('TEST_VAR')).toThrow();
  });
});

describe('COMMITPULSE_ENV_CONFIG', () => {
  it('should have correct required variables', () => {
    expect(COMMITPULSE_ENV_CONFIG.required).toHaveLength(2);
    
    const requiredNames = COMMITPULSE_ENV_CONFIG.required.map((v) => v.name);
    expect(requiredNames).toContain('GITHUB_TOKEN');
    expect(requiredNames).toContain('NEXT_PUBLIC_SITE_URL');
  });

  it('should have correct optional variables', () => {
    expect(COMMITPULSE_ENV_CONFIG.optional).toHaveLength(3);
    
    const optionalNames = COMMITPULSE_ENV_CONFIG.optional.map((v) => v.name);
    expect(optionalNames).toContain('MONGODB_URI');
    expect(optionalNames).toContain('KV_REST_API_URL');
    expect(optionalNames).toContain('KV_REST_API_TOKEN');
  });

  it('should have descriptions for all variables', () => {
    const allVars = [
      ...COMMITPULSE_ENV_CONFIG.required,
      ...COMMITPULSE_ENV_CONFIG.optional,
    ];

    allVars.forEach((variable) => {
      expect(variable.description).toBeTruthy();
      expect(variable.description.length).toBeGreaterThan(10);
    });
  });

  it('should have feature tags for optional variables', () => {
    COMMITPULSE_ENV_CONFIG.optional.forEach((variable) => {
      expect(variable.feature).toBeTruthy();
    });
  });
});
