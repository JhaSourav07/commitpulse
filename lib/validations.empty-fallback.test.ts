/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  validateGitHubUsername,
  validateStrictISODate,
  toBooleanFlag,
  toGlowFlag,
  toRefreshFlag,
  toValidTheme,
  toValidHexColor,
  toGraceValue,
  toOpacityValue,
  toDimensionValue,
} from './validations';

// A mock integration component to test how the UI handles empty/missing validation fallbacks
function ValidationUIFallback({
  initialUsername = '',
  initialDate = '',
}: {
  initialUsername?: string;
  initialDate?: string;
}) {
  const [username, setUsername] = useState(initialUsername);
  const [date, setDate] = useState(initialDate);

  const isUsernameValid = validateGitHubUsername(username);
  const isDateValid = validateStrictISODate(date);

  return React.createElement(
    'div',
    { 'data-testid': 'validation-container', style: { padding: '16px' } },
    React.createElement('input', {
      'data-testid': 'username-input',
      value: username,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value),
    }),
    React.createElement('input', {
      'data-testid': 'date-input',
      value: date,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value),
    }),
    !isUsernameValid &&
      React.createElement(
        'p',
        {
          'data-testid': 'username-error',
          className: 'text-amber-500',
          style: { color: 'rgb(245, 158, 11)', fontSize: '12px' },
        },
        'Invalid username format. Usernames can only contain alphanumeric characters and hyphens.'
      ),
    !isDateValid &&
      React.createElement(
        'p',
        {
          'data-testid': 'date-error',
          className: 'text-red-500',
          style: { color: 'rgb(239, 68, 68)', fontSize: '12px' },
        },
        'Invalid date format. Use ISO 8601 format.'
      )
  );
}

describe('lib/validations Edge Cases & Empty/Missing Inputs Verification', () => {
  describe('Type Guards on Non-String & Nullish Inputs', () => {
    it('returns false for validateGitHubUsername when inputs are nullish or non-string', () => {
      // Bypassing TypeScript checks to verify runtime safety of the validation helpers
      expect(validateGitHubUsername(null as any)).toBe(false);
      expect(validateGitHubUsername(undefined as any)).toBe(false);
      expect(validateGitHubUsername(123 as any)).toBe(false);
      expect(validateGitHubUsername({} as any)).toBe(false);
      expect(validateGitHubUsername([] as any)).toBe(false);
    });

    it('returns false for validateStrictISODate when inputs are nullish or non-string', () => {
      expect(validateStrictISODate(null as any)).toBe(false);
      expect(validateStrictISODate(undefined as any)).toBe(false);
      expect(validateStrictISODate(20230612 as any)).toBe(false);
      expect(validateStrictISODate({} as any)).toBe(false);
      expect(validateStrictISODate([] as any)).toBe(false);
    });
  });

  describe('Validation Fallback UI and Styles Integration', () => {
    it('renders validation fallback warning UI with correct error messages and styles when empty', () => {
      render(React.createElement(ValidationUIFallback, { initialUsername: '', initialDate: '' }));

      // Empty states should fail validation and display error fallbacks
      const usernameError = screen.getByTestId('username-error');
      const dateError = screen.getByTestId('date-error');

      expect(usernameError).toBeInTheDocument();
      expect(dateError).toBeInTheDocument();

      expect(usernameError.textContent).toContain('Invalid username format');
      expect(dateError.textContent).toContain('Invalid date format');

      // Verify layout standards are maintained (color code matching warning/error states and font size)
      expect(usernameError.style.color).toBe('rgb(245, 158, 11)');
      expect(usernameError.style.fontSize).toBe('12px');
      expect(dateError.style.color).toBe('rgb(239, 68, 68)');
      expect(dateError.style.fontSize).toBe('12px');
    });

    it('clears warning messages when inputs are updated to valid values', () => {
      render(React.createElement(ValidationUIFallback, { initialUsername: '', initialDate: '' }));

      const usernameInput = screen.getByTestId('username-input');
      const dateInput = screen.getByTestId('date-input');

      // Check initial errors
      expect(screen.queryByTestId('username-error')).toBeInTheDocument();
      expect(screen.queryByTestId('date-error')).toBeInTheDocument();

      // Update inputs to valid credentials
      fireEvent.change(usernameInput, { target: { value: 'octocat' } });
      fireEvent.change(dateInput, { target: { value: '2026-06-12' } });

      // Verify fallback alerts are cleared out from the DOM layout
      expect(screen.queryByTestId('username-error')).not.toBeInTheDocument();
      expect(screen.queryByTestId('date-error')).not.toBeInTheDocument();
    });
  });

  describe('Standard Helper Functions Fallback Bounds', () => {
    it('forces expected fallbacks on null/undefined flag conversions', () => {
      expect(toBooleanFlag(undefined)).toBe(false);
      expect(toBooleanFlag(null as any)).toBe(false);
      expect(toBooleanFlag('')).toBe(false);

      expect(toGlowFlag(undefined)).toBe(true);
      expect(toGlowFlag(null as any)).toBe(false);

      expect(toRefreshFlag(undefined)).toBe(false);
      expect(toRefreshFlag(null as any)).toBe(false);
    });

    it('returns theme fallback for missing or unsupported themes', () => {
      expect(toValidTheme(undefined)).toBe('dark');
      expect(toValidTheme(null as any)).toBe('dark');
      expect(toValidTheme('nonexistent_theme')).toBe('dark');
    });

    it('returns undefined for invalid or missing color hex params', () => {
      const hexValidator = toValidHexColor('ffffff');
      expect(hexValidator(undefined)).toBeUndefined();
      expect(hexValidator(null as any)).toBeUndefined();
      expect(hexValidator('invalid_hex')).toBeUndefined();
    });

    it('returns default bounds for missing or out-of-range numeric parameters', () => {
      expect(toGraceValue(undefined)).toBe(1);
      expect(toGraceValue('invalid_grace')).toBe(1);
      expect(toGraceValue('-5')).toBe(0);
      expect(toGraceValue('15')).toBe(7);

      expect(toOpacityValue(undefined)).toBe(1.0);
      expect(toOpacityValue('invalid_opacity')).toBe(1.0);
      expect(toOpacityValue('0.01')).toBe(0.1);
      expect(toOpacityValue('2.0')).toBe(1.0);

      expect(toDimensionValue(undefined)).toBeUndefined();
    });
  });
});
