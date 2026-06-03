# Environment Validation System

## Overview

CommitPulse implements a comprehensive environment validation system that catches configuration issues at startup rather than runtime. This prevents the application from booting successfully when critical environment variables are missing, providing better developer experience and faster debugging.

## Problem Solved

### Before

```typescript
// Application boots successfully ✅
// First user tracking request comes in ❌
// Error: "Please define the MONGODB_URI environment variable"
// User sees 500 error
// Developer wastes time debugging
```

### After

```typescript
// Application initialization starts
// Environment validation runs
// Missing GITHUB_TOKEN detected ❌
// Clear error message displayed
// Application fails to start (fast feedback)
// Developer fixes config before runtime issues
```

## Architecture

### Components

1. **`lib/env-validation.ts`** - Core validation logic
2. **`instrumentation.ts`** - Next.js startup hook
3. **`lib/mongodb.ts`** - Enhanced with availability checking

### Validation Flow

```
App Start
    ↓
instrumentation.ts (register)
    ↓
enforceEnvironmentValidation()
    ↓
validateEnvironment()
    ↓
Check Required Vars → Errors if missing
    ↓
Check Optional Vars → Warnings if missing
    ↓
Log Results
    ↓
Throw if Required Missing (Production)
    ↓
Continue if Valid
```

## Usage

### Basic Validation

The validation runs automatically at startup via `instrumentation.ts`:

```typescript
// instrumentation.ts
import { enforceEnvironmentValidation } from './lib/env-validation';

export async function register() {
  enforceEnvironmentValidation(); // Validates and throws on error
}
```

### Custom Validation

You can create custom validation configs:

```typescript
import { validateEnvironment, type EnvConfig } from '@/lib/env-validation';

const myConfig: EnvConfig = {
  required: [
    {
      name: 'API_KEY',
      description: 'API key for external service',
      example: 'sk_live_...',
    },
  ],
  optional: [
    {
      name: 'DEBUG_MODE',
      description: 'Enable debug logging',
      feature: 'Enhanced debugging',
    },
  ],
};

const result = validateEnvironment(myConfig);

if (!result.valid) {
  console.error('Validation failed:', result.errors);
}
```

### Runtime Checks

For optional features, check availability before use:

```typescript
import { isMongoDBAvailable } from '@/lib/mongodb';

// Check before attempting connection
if (isMongoDBAvailable()) {
  await dbConnect();
  // Use MongoDB features
} else {
  console.warn('MongoDB not configured - skipping user tracking');
  // Graceful degradation
}
```

### Type-Safe Environment Access

Use the `env` object for type-safe access:

```typescript
import { env } from '@/lib/env-validation';

// Required variables (throws if missing)
const githubToken = env.GITHUB_TOKEN;

// Optional variables (returns undefined if missing)
const mongoUri = env.MONGODB_URI;

if (mongoUri) {
  // Use MongoDB
}
```

## Configuration

### Environment Variables

**Required** (Application fails without these):

- `GITHUB_TOKEN` - GitHub Personal Access Token
- `NEXT_PUBLIC_SITE_URL` - Public site URL for Open Graph metadata

**Optional** (Application works with degraded features):

- `MONGODB_URI` - MongoDB connection string (user tracking disabled without)
- `KV_REST_API_URL` - Upstash Redis URL (rate limiting per-instance without)
- `KV_REST_API_TOKEN` - Upstash Redis token

### Validation Options

```typescript
enforceEnvironmentValidation(config, {
  throwOnError: true, // Throw when required vars missing
  logWarnings: true, // Log warnings for optional vars
  silent: false, // Suppress all console output
});
```

## Error Messages

### Required Variable Missing

```
================================================================================
❌ ENVIRONMENT VALIDATION FAILED
================================================================================

❌ Missing required environment variable: GITHUB_TOKEN
   Description: GitHub Personal Access Token for GraphQL API authentication
   Example: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ⚠️  Application will fail at runtime without this variable.

================================================================================
💡 TIP: Copy .env.local.example to .env.local and fill in the values.
================================================================================
```

### Optional Variable Missing

```
--------------------------------------------------------------------------------
⚠️  ENVIRONMENT WARNINGS
--------------------------------------------------------------------------------

⚠️  Optional environment variable not set: MONGODB_URI
   Description: MongoDB connection string for user tracking
   Feature affected: User tracking on landing page
   Example: mongodb+srv://<username>:<password>@cluster.mongodb.net/commitpulse
   ℹ️  Application will work without this, but with limited functionality.

--------------------------------------------------------------------------------
```

## API Reference

### `validateEnvironment(config, env?)`

Validates environment variables against configuration.

**Parameters:**
- `config: EnvConfig` - Validation configuration
- `env?: NodeJS.ProcessEnv` - Environment to validate (defaults to `process.env`)

**Returns:** `EnvValidationResult`

```typescript
interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
```

### `enforceEnvironmentValidation(config?, options?)`

Validates and optionally throws on errors.

**Parameters:**
- `config?: EnvConfig` - Validation configuration (defaults to `COMMITPULSE_ENV_CONFIG`)
- `options?: object` - Validation options

**Options:**
```typescript
{
  throwOnError?: boolean; // Default: true
  logWarnings?: boolean;  // Default: true
  silent?: boolean;       // Default: false
}
```

### `getEnvVar(name, required?)`

Gets a single environment variable with validation.

**Parameters:**
- `name: string` - Variable name
- `required?: boolean` - Whether required (default: `true`)

**Returns:** `string | undefined`

### `isMongoDBAvailable()`

Checks if MongoDB is configured.

**Returns:** `boolean`

```typescript
if (isMongoDBAvailable()) {
  await dbConnect();
}
```

### `env` Object

Type-safe environment variable access.

```typescript
const token = env.GITHUB_TOKEN; // string
const uri = env.MONGODB_URI;    // string | undefined
```

## Testing

### Unit Tests

```bash
npm test lib/env-validation.test.ts
npm test lib/mongodb.test.ts
```

### Test Coverage

- ✅ Required variable validation
- ✅ Optional variable warnings
- ✅ Empty string handling
- ✅ Whitespace trimming
- ✅ Custom configurations
- ✅ Error throwing behavior
- ✅ Silent mode
- ✅ MongoDB availability checks
- ✅ Connection caching
- ✅ Graceful degradation

## Integration Examples

### API Route with Optional MongoDB

```typescript
import { isMongoDBAvailable, dbConnect } from '@/lib/mongodb';

export async function POST(req: Request) {
  // Check availability first
  if (!isMongoDBAvailable()) {
    return Response.json({ 
      success: true, 
      bypassed: true,
      message: 'User tracking disabled' 
    });
  }

  // Safe to connect
  await dbConnect();
  // ... use database
}
```

### Feature Flag Based on Environment

```typescript
import { env } from '@/lib/env-validation';

export const features = {
  userTracking: Boolean(env.MONGODB_URI),
  rateLimiting: Boolean(env.KV_REST_API_URL && env.KV_REST_API_TOKEN),
  analytics: true, // Always enabled
};
```

## Migration Guide

### Updating Existing Code

**Before:**
```typescript
if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI required');
}
await mongoose.connect(process.env.MONGODB_URI);
```

**After:**
```typescript
import { isMongoDBAvailable, dbConnect } from '@/lib/mongodb';

if (isMongoDBAvailable()) {
  await dbConnect(); // Handles connection with validation
}
```

## Best Practices

1. **Use `isMongoDBAvailable()` before connecting**
   ```typescript
   if (isMongoDBAvailable()) {
     await dbConnect();
   }
   ```

2. **Use the `env` object for type safety**
   ```typescript
   const token = env.GITHUB_TOKEN; // Type-safe
   ```

3. **Check optional features at runtime**
   ```typescript
   if (env.MONGODB_URI) {
     // Enable feature
   }
   ```

4. **Provide graceful degradation**
   ```typescript
   if (!isMongoDBAvailable()) {
     console.warn('Feature disabled - MongoDB not configured');
     return fallbackBehavior();
   }
   ```

5. **Add descriptive error messages**
   ```typescript
   const config: EnvConfig = {
     required: [{
       name: 'MY_VAR',
       description: 'Clear explanation of what this is for',
       example: 'sample_value_format',
     }],
   };
   ```

## Troubleshooting

### Application Won't Start

**Symptom:** Application fails during startup with environment validation error.

**Solution:** 
1. Copy `.env.local.example` to `.env.local`
2. Fill in required variables
3. Restart application

### Optional Feature Not Working

**Symptom:** Feature silently disabled without error.

**Solution:**
1. Check console for warnings about missing optional vars
2. Add the relevant environment variable
3. Restart application

### Tests Failing

**Symptom:** Environment validation interferes with tests.

**Solution:**
```typescript
import { enforceEnvironmentValidation } from '@/lib/env-validation';

// In test setup
enforceEnvironmentValidation(config, {
  throwOnError: false,
  silent: true,
});
```

## Future Enhancements

- [ ] Add validation for environment variable formats (URL, token patterns)
- [ ] Support for environment-specific configs (dev, staging, prod)
- [ ] Integration with external secret management (Vault, AWS Secrets Manager)
- [ ] Auto-generation of `.env.local.example` from config
- [ ] VS Code extension for inline validation
- [ ] Runtime environment reload without restart

## References

- [Next.js Instrumentation](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [12-Factor App Config](https://12factor.net/config)
