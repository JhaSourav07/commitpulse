/**
 * Environment Variable Validation Module
 *
 * Validates required and optional environment variables at application startup.
 * This prevents runtime errors from missing configuration and provides clear
 * error messages during development and build time.
 */

export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface EnvConfig {
  required: {
    name: string;
    description: string;
    example?: string;
  }[];
  optional: {
    name: string;
    description: string;
    example?: string;
    feature?: string;
  }[];
}

/**
 * Validates environment variables against the provided configuration.
 *
 * @param config - Configuration specifying required and optional env vars
 * @param env - Environment object to validate (defaults to process.env)
 * @returns Validation result with errors and warnings
 */
export function validateEnvironment(
  config: EnvConfig,
  env: NodeJS.ProcessEnv = process.env
): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate required variables
  for (const variable of config.required) {
    const value = env[variable.name];
    
    if (!value || value.trim() === '') {
      const errorMsg = [
        `❌ Missing required environment variable: ${variable.name}`,
        `   Description: ${variable.description}`,
        variable.example ? `   Example: ${variable.example}` : '',
        `   ⚠️  Application will fail at runtime without this variable.`,
      ]
        .filter(Boolean)
        .join('\n');
      
      errors.push(errorMsg);
    }
  }

  // Validate optional variables (warnings only)
  for (const variable of config.optional) {
    const value = env[variable.name];
    
    if (!value || value.trim() === '') {
      const warningMsg = [
        `⚠️  Optional environment variable not set: ${variable.name}`,
        `   Description: ${variable.description}`,
        variable.feature ? `   Feature affected: ${variable.feature}` : '',
        variable.example ? `   Example: ${variable.example}` : '',
        `   ℹ️  Application will work without this, but with limited functionality.`,
      ]
        .filter(Boolean)
        .join('\n');
      
      warnings.push(warningMsg);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * CommitPulse environment configuration
 */
export const COMMITPULSE_ENV_CONFIG: EnvConfig = {
  required: [
    {
      name: 'GITHUB_TOKEN',
      description: 'GitHub Personal Access Token for GraphQL API authentication',
      example: 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    },
    {
      name: 'NEXT_PUBLIC_SITE_URL',
      description: 'Public site URL for generating absolute URLs',
      example: 'http://localhost:3000 (dev) or https://commitpulse.vercel.app (prod)',
    },
  ],
  optional: [
    {
      name: 'MONGODB_URI',
      description: 'MongoDB connection string for user tracking',
      feature: 'User tracking on landing page',
      example: 'mongodb+srv://<username>:<password>@cluster.mongodb.net/commitpulse',
    },
    {
      name: 'KV_REST_API_URL',
      description: 'Upstash Redis REST API URL for distributed rate limiting',
      feature: 'Distributed rate limiting across serverless instances',
      example: 'https://<your-db>.upstash.io',
    },
    {
      name: 'KV_REST_API_TOKEN',
      description: 'Upstash Redis REST API token',
      feature: 'Distributed rate limiting across serverless instances',
      example: '<your-upstash-token>',
    },
  ],
};

/**
 * Throws an error if required environment variables are missing.
 * Logs warnings for missing optional variables.
 *
 * @param config - Environment configuration to validate
 * @param options - Validation options
 */
export function enforceEnvironmentValidation(
  config: EnvConfig = COMMITPULSE_ENV_CONFIG,
  options: {
    throwOnError?: boolean;
    logWarnings?: boolean;
    silent?: boolean;
  } = {}
): EnvValidationResult {
  const { throwOnError = true, logWarnings = true, silent = false } = options;

  const result = validateEnvironment(config);

  if (!silent) {
    // Log errors
    if (result.errors.length > 0) {
      console.error('\n' + '='.repeat(80));
      console.error('❌ ENVIRONMENT VALIDATION FAILED');
      console.error('='.repeat(80));
      result.errors.forEach((error) => console.error('\n' + error));
      console.error('\n' + '='.repeat(80));
      console.error('💡 TIP: Copy .env.local.example to .env.local and fill in the values.');
      console.error('='.repeat(80) + '\n');
    }

    // Log warnings
    if (logWarnings && result.warnings.length > 0) {
      console.warn('\n' + '-'.repeat(80));
      console.warn('⚠️  ENVIRONMENT WARNINGS');
      console.warn('-'.repeat(80));
      result.warnings.forEach((warning) => console.warn('\n' + warning));
      console.warn('\n' + '-'.repeat(80) + '\n');
    }
  }

  if (!result.valid && throwOnError) {
    throw new Error(
      `Environment validation failed: ${result.errors.length} required variable(s) missing. ` +
        `Check the console output above for details.`
    );
  }

  return result;
}

/**
 * Validates a single environment variable at runtime.
 * Useful for lazy validation of optional features.
 *
 * @param name - Name of the environment variable
 * @param required - Whether the variable is required
 * @returns The value if present, or throws if required and missing
 */
export function getEnvVar(name: string, required: boolean = true): string | undefined {
  const value = process.env[name];

  if (required && (!value || value.trim() === '')) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Please check .env.local.example for setup instructions.`
    );
  }

  return value;
}

/**
 * Type-safe environment variable getter with validation.
 * Provides better DX with autocomplete and type checking.
 */
export const env = {
  // Required variables
  get GITHUB_TOKEN(): string {
    return getEnvVar('GITHUB_TOKEN', true)!;
  },
  get NEXT_PUBLIC_SITE_URL(): string {
    return getEnvVar('NEXT_PUBLIC_SITE_URL', true)!;
  },

  // Optional variables
  get MONGODB_URI(): string | undefined {
    return getEnvVar('MONGODB_URI', false);
  },
  get KV_REST_API_URL(): string | undefined {
    return getEnvVar('KV_REST_API_URL', false);
  },
  get KV_REST_API_TOKEN(): string | undefined {
    return getEnvVar('KV_REST_API_TOKEN', false);
  },
} as const;
