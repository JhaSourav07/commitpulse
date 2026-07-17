import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { SEARCH_DOMAINS } from './domains';

describe('SEARCH_DOMAINS — sync with app/**/page.tsx routes', () => {
  it('contains an entry for every static (non-dynamic) top-level page route', () => {
    // Mirrors the file's own documented contract: "Keep this list in sync
    // with app/**/page.tsx routes". Dynamic routes ([username], [orgname])
    // are intentionally excluded — those aren't static searchable domains.
    const expectedHrefs = [
      '/',
      '/generator',
      '/compare',
      '/burnout-analyzer',
      '/customize',
      '/contributors',
      '/achievements',
      '/documentation',
      '/faq',
      '/guidelines',
      '/support',
    ];

    const actualHrefs = SEARCH_DOMAINS.map((d) => d.href);
    for (const href of expectedHrefs) {
      expect(actualHrefs).toContain(href);
    }
  });

  it('has a unique id for every domain entry', () => {
    const ids = SEARCH_DOMAINS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has a unique href for every internal domain entry', () => {
    const internalHrefs = SEARCH_DOMAINS.filter((d) => d.href.startsWith('/')).map((d) => d.href);
    expect(new Set(internalHrefs).size).toBe(internalHrefs.length);
  });

  it('every domain has at least one keyword', () => {
    for (const domain of SEARCH_DOMAINS) {
      expect(domain.keywords.length).toBeGreaterThan(0);
    }
  });

  it('faq, guidelines, and support entries correspond to real page.tsx files', () => {
    const newEntries = ['faq', 'guidelines', 'support'];
    for (const slug of newEntries) {
      const pagePath = path.join(process.cwd(), 'app', slug, 'page.tsx');
      expect(fs.existsSync(pagePath)).toBe(true);
    }
  });
});
