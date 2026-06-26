import { render, act, screen } from '@testing-library/react';
import { useTranslation, TranslationProvider } from './TranslationContext';
import { vi, describe, it, expect } from 'vitest';
import React from 'react';

vi.unmock('./TranslationContext');

describe('TranslationContext - Tab Synchronization', () => {
  it('should auto-detect browser language or fall back to localStorage', () => {
    localStorage.clear();
    render(
      <TranslationProvider>
        <TestComponent />
      </TranslationProvider>
    );
    expect(screen.getByTestId('lang').textContent).toBe('en');
  });

  it('should react to storage event and update language preference across tabs', () => {
    localStorage.clear();
    render(
      <TranslationProvider>
        <TestComponent />
      </TranslationProvider>
    );

    expect(screen.getByTestId('lang').textContent).toBe('en');

    // Simulate storage event from another tab
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'language',
          newValue: 'es',
        })
      );
    });

    expect(screen.getByTestId('lang').textContent).toBe('es');
    expect(document.documentElement.lang).toBe('es');
  });

  it('should ignore storage events for unrelated keys', () => {
    localStorage.clear();
    render(
      <TranslationProvider>
        <TestComponent />
      </TranslationProvider>
    );

    expect(screen.getByTestId('lang').textContent).toBe('en');

    // Simulate storage event for another key
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'theme',
          newValue: 'dark',
        })
      );
    });

    expect(screen.getByTestId('lang').textContent).toBe('en');
  });

  it('should ignore storage events with invalid language values', () => {
    localStorage.clear();
    render(
      <TranslationProvider>
        <TestComponent />
      </TranslationProvider>
    );

    expect(screen.getByTestId('lang').textContent).toBe('en');

    // Simulate storage event with invalid lang
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'language',
          newValue: 'invalid_lang',
        })
      );
    });

    expect(screen.getByTestId('lang').textContent).toBe('en');
  });
});

const TestComponent = () => {
  const { language, changeLanguage, t } = useTranslation();
  return (
    <div>
      <span data-testid="lang">{language}</span>
      <button data-testid="change-btn" onClick={() => changeLanguage('es')}>
        Change
      </button>
      <span data-testid="welcome">{t('home.welcome')}</span>
    </div>
  );
};
