import { SOCIALS } from '../data/socials';

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
