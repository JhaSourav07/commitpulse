import * as socialsData from '../data/socials';
const SOCIALS =
  socialsData && 'SOCIALS' in socialsData && Array.isArray(socialsData.SOCIALS)
    ? socialsData.SOCIALS
    : [];
import { z } from 'zod';

const emailSchema = z.string().email();

// URLs can contain alphanumeric, periods, hyphens, slashes, underscores, question marks, ampersands, percent encoding, hash, etc.
// But absolutely no spaces or path traversal like '..'
const websiteSchema = z
  .string()
  .min(1)
  .max(255)
  .regex(/^[a-zA-Z0-9_.:/\-?&=%#+]+$/)
  .refine((val) => !val.includes('..') && !val.includes('/./') && !val.includes('\\'), {
    message: 'Invalid URL format or path traversal detected',
  });

// WhatsApp should be numbers only, optionally starting with a '+'
const phoneSchema = z
  .string()
  .min(5)
  .max(20)
  .regex(/^\+?[0-9]+$/);

// StackOverflow handle can be digits or digits/username-slug
const stackOverflowSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[0-9]+(?:\/[a-zA-Z0-9_\-]+)?$/);

// Discord handles/invite-codes: alphanumeric, underscores, hyphens, periods, and optionally slashes
const discordSchema = z
  .string()
  .min(2)
  .max(100)
  .regex(/^[a-zA-Z0-9_\-./]+$/)
  .refine((val) => !val.includes('..'), { message: 'Path traversal not allowed' });

// Mastodon / Bluesky can have '@' or domain names
const fediverseSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^@?[a-zA-Z0-9_\-.]+@?[a-zA-Z0-9_\-.]*$/)
  .refine((val) => !val.includes('..'), { message: 'Path traversal not allowed' });

// Standard handle schema: alphanumeric, underscores, hyphens, periods, and optionally a single leading '@'
const standardHandleSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^@?[a-zA-Z0-9_\-.]+$/)
  .refine((val) => !val.includes('..'), { message: 'Path traversal not allowed' });

export function validateSocialHandle(id: string, value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;

  if (id !== 'email' && (trimmed.startsWith('http://') || trimmed.startsWith('https://'))) {
    return websiteSchema.safeParse(trimmed).success;
  }

  let schema;
  if (id === 'email') {
    schema = emailSchema;
  } else if (id === 'website') {
    schema = websiteSchema;
  } else if (id === 'whatsapp') {
    schema = phoneSchema;
  } else if (id === 'stackoverflow') {
    schema = stackOverflowSchema;
  } else if (id === 'discord') {
    schema = discordSchema;
  } else if (id === 'mastodon' || id === 'bluesky') {
    schema = fediverseSchema;
  } else {
    schema = standardHandleSchema;
  }

  return schema.safeParse(trimmed).success;
}

export function sanitizeSocialUrl(id: string, input: string): string {
  const value = input.trim();

  if (!value) return value;

  const social = SOCIALS.find((s) => s.id === id);
  if (!social) return value;

  const baseUrl = social.baseUrl;

  // Handle email specific extraction
  if (id === 'email') {
    return value.replace(/^mailto:/i, '');
  }

  // If the input doesn't look like a URL (no http/https), just return it
  if (!value.startsWith('http://') && !value.startsWith('https://')) {
    // Edge case: if they typed github.com/username without http
    const urlWithoutProtocol = baseUrl.replace(/^https?:\/\//, '');
    if (value.startsWith(urlWithoutProtocol)) {
      return value.slice(urlWithoutProtocol.length).split('?')[0].split('#')[0].replace(/\/$/, '');
    }
    return value;
  }

  // Extract from full URL
  try {
    const urlObj = new URL(value);
    const baseObj = new URL(baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`);

    // Check if the domain matches (ignoring www.)
    const inputHost = urlObj.hostname.replace(/^www\./, '').toLowerCase();
    const baseHost = baseObj.hostname.replace(/^www\./, '').toLowerCase();

    if (inputHost === baseHost || inputHost.endsWith(`.${baseHost}`)) {
      const inputPath = urlObj.pathname;
      const basePath = baseObj.pathname === '/' ? '' : baseObj.pathname;

      if (inputPath.startsWith(basePath)) {
        let extracted = inputPath.slice(basePath.length);
        if (extracted.startsWith('/')) {
          extracted = extracted.slice(1);
        }
        // Remove trailing slashes
        extracted = extracted.replace(/\/$/, '');

        if (extracted) {
          return extracted;
        }
      }
    }
  } catch (e) {
    // If URL parsing fails, fallback to simple string replacement
  }

  // Fallback simple string replacement
  if (value.toLowerCase().startsWith(baseUrl.toLowerCase())) {
    return value.slice(baseUrl.length).split('?')[0].split('#')[0].replace(/\/$/, '');
  }

  return value;
}
