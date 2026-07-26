import { describe, expect, it } from 'vitest';
import { containsSecrets, detectSecrets, redactSecrets } from './secretScanner';

describe('detectSecrets', () => {
  it('detects classic GitHub personal access tokens', () => {
    const text = `fix auth: use ghp_${'a1B2c3D4'.repeat(5)} for now`;
    const findings = detectSecrets(text);
    expect(findings).toHaveLength(1);
    expect(findings[0].type).toBe('github-token');
  });

  it('detects fine-grained GitHub tokens', () => {
    const text = `temp: github_pat_11ABCDEFG0${'x'.repeat(60)}`;
    expect(detectSecrets(text)[0]?.type).toBe('github-token');
  });

  it('detects AWS access key ids', () => {
    expect(detectSecrets('creds AKIAIOSFODNN7EXAMPLE added')[0]?.type).toBe('aws-access-key-id');
  });

  it('detects Slack and Stripe tokens', () => {
    expect(detectSecrets('xoxb-123456789012-abcdefghijkl')[0]?.type).toBe('slack-token');
    expect(detectSecrets(`sk_live_${'4eC39HqLyjWDarjtT1zdp7dc'}`)[0]?.type).toBe('stripe-key');
  });

  it('detects JWTs', () => {
    const jwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJVadQssw5c';
    expect(detectSecrets(`token: ${jwt}`)[0]?.type).toBe('jwt');
  });

  it('detects private key blocks including truncated ones', () => {
    const block = '-----BEGIN RSA PRIVATE KEY-----\nMIIEow...\n-----END RSA PRIVATE KEY-----';
    expect(detectSecrets(block)[0]?.type).toBe('private-key-block');
    expect(detectSecrets('-----BEGIN PRIVATE KEY-----\nMIIEow')[0]?.type).toBe('private-key-block');
  });

  it('detects credentials embedded in connection strings', () => {
    const text = 'point to postgres://admin:hunter22secret@db.internal:5432/prod';
    expect(detectSecrets(text)[0]?.type).toBe('connection-string-credentials');
  });

  it('detects password and api key assignments', () => {
    expect(detectSecrets('set password=SuperSecret99!')[0]?.type).toBe('credential-assignment');
    expect(detectSecrets('API_KEY: "abcd1234efgh5678"')[0]?.type).toBe('credential-assignment');
  });

  it('does not flag ordinary commit messages', () => {
    const messages = [
      'fix: handle empty contribution calendar',
      'feat(auth): rotate tokens on schedule',
      'docs: document the password reset flow',
      'refactor: extract secret scanner into lib',
      'chore: bump eslint to 9.20.1',
      'password requirements updated in validation docs',
    ];
    for (const message of messages) {
      expect(detectSecrets(message)).toHaveLength(0);
    }
  });

  it('does not flag placeholders and env indirection', () => {
    expect(detectSecrets('password=${DB_PASSWORD}')).toHaveLength(0);
    expect(detectSecrets('api_key=<your-key-here>')).toHaveLength(0);
  });
});

describe('redactSecrets', () => {
  it('replaces the secret with a typed placeholder and keeps the rest', () => {
    const redacted = redactSecrets('deploy with AKIAIOSFODNN7EXAMPLE today');
    expect(redacted).toBe('deploy with [REDACTED:aws-access-key-id] today');
  });

  it('redacts multiple different secrets in one message', () => {
    const text = 'creds: AKIAIOSFODNN7EXAMPLE and password=Sup3rSecret!';
    const redacted = redactSecrets(text);
    expect(redacted).toContain('[REDACTED:aws-access-key-id]');
    expect(redacted).toContain('[REDACTED:credential-assignment]');
    expect(redacted).not.toContain('AKIAIOSFODNN7EXAMPLE');
    expect(redacted).not.toContain('Sup3rSecret!');
  });

  it('returns the identical reference when nothing matches', () => {
    const text = 'fix: adjust badge colors';
    expect(redactSecrets(text)).toBe(text);
  });
});

describe('containsSecrets', () => {
  it('reports presence without mutating', () => {
    expect(containsSecrets('token ghp_' + 'A1b2C3d4'.repeat(5))).toBe(true);
    expect(containsSecrets('perfectly normal message')).toBe(false);
  });
});
