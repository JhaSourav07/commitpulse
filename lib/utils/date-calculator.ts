/**
 * Locale-aware and calendar-system-aware date formatting utility.
 * Supports different calendar systems (Gregorian, Islamic, Buddhist, Hebrew, Persian)
 * and locale-specific configurations (such as am/pm, 24-hour, day-first, etc.).
 */

export type CalendarSystem = 'gregory' | 'islamic' | 'buddhist' | 'hebrew' | 'persian';

export interface FormatOptions {
  calendar?: CalendarSystem;
  hour12?: boolean;
  formatType?: 'date-only' | 'time-only' | 'full';
  timezone?: string;
}

/**
 * Formats a Date object according to specific locale and formatting options.
 */
export function formatLocalDate(
  date: Date,
  locale: string = 'en',
  options: FormatOptions = {}
): string {
  const { calendar, hour12, formatType = 'date-only', timezone = 'UTC' } = options;

  const intlOptions: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
  };

  // Build final locale with unicode extension for custom calendar systems if requested
  let finalLocale = locale;
  if (calendar) {
    finalLocale = `${locale}-u-ca-${calendar}`;
  }

  if (formatType === 'date-only') {
    return new Intl.DateTimeFormat(finalLocale, {
      ...intlOptions,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } else if (formatType === 'time-only') {
    return new Intl.DateTimeFormat(finalLocale, {
      ...intlOptions,
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: hour12,
    }).format(date);
  } else {
    return new Intl.DateTimeFormat(finalLocale, {
      ...intlOptions,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: hour12,
    }).format(date);
  }
}

/**
 * Valid list of 20+ supported locales for testing and localization validation.
 */
export const SUPPORTED_LOCALES = [
  'en-US', // English (United States)
  'en-GB', // English (United Kingdom)
  'ar-SA', // Arabic (Saudi Arabia) - Islamic calendar default
  'fa-IR', // Persian (Iran) - Jalali calendar default
  'he-IL', // Hebrew (Israel) - Hebrew calendar default
  'hi-IN', // Hindi (India)
  'ja-JP', // Japanese (Japan)
  'zh-CN', // Chinese (Simplified, China)
  'fr-FR', // French (France)
  'es-ES', // Spanish (Spain)
  'de-DE', // German (Germany)
  'it-IT', // Italian (Italy)
  'pt-BR', // Portuguese (Brazil)
  'ru-RU', // Russian (Russia)
  'ko-KR', // Korean (South Korea)
  'tr-TR', // Turkish (Turkey)
  'vi-VN', // Vietnamese (Vietnam)
  'th-TH', // Thai (Thailand) - Buddhist calendar default
  'nl-NL', // Dutch (Netherlands)
  'pl-PL', // Polish (Poland)
  'sv-SE', // Swedish (Sweden)
  'el-GR', // Greek (Greece)
];
