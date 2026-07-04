import { render } from '@testing-library/react';
import { useTranslation, TranslationProvider } from './TranslationContext';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';

vi.unmock('./TranslationContext');

describe('TranslationContext - Missing Translation Key Warnings', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleWarnSpy: any;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it('should log a warning in development mode when translation key is missing', () => {
    vi.stubEnv('NODE_ENV', 'development');
    render(
      <TranslationProvider>
        <TestComponent missingKey="home.nonexistent" />
      </TranslationProvider>
    );

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '⚠ Missing translation key "home.nonexistent" in locale "en"'
    );
  });

  it('should NOT log a warning in production mode when translation key is missing', () => {
    vi.stubEnv('NODE_ENV', 'production');
    render(
      <TranslationProvider>
        <TestComponent missingKey="home.nonexistent" />
      </TranslationProvider>
    );

    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
});

const TestComponent = ({ missingKey }: { missingKey?: string }) => {
  const { language, t } = useTranslation();
  return (
    <div>
      <span data-testid="lang">{language}</span>
      <span data-testid="welcome">{t('home.welcome')}</span>
      {missingKey && <span data-testid="missing">{t(missingKey)}</span>}
    </div>
  );
};
