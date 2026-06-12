import { vi } from 'vitest';

const RealDateTimeFormat = Intl.DateTimeFormat;
const DEFAULT_TIMEZONE = 'UTC';

let activeTimezone = DEFAULT_TIMEZONE;
let installed = false;

type DateTimeFormatArgs = ConstructorParameters<typeof Intl.DateTimeFormat>;

function createFormatter([locales, options]: DateTimeFormatArgs) {
  return new RealDateTimeFormat(locales, {
    ...options,
    timeZone: options?.timeZone ?? activeTimezone,
  });
}

export function installTimezoneMock(defaultTimezone: string = DEFAULT_TIMEZONE) {
  activeTimezone = defaultTimezone;

  if (installed) {
    return;
  }

  installed = true;

  vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(function mockedDateTimeFormat(
    this: unknown,
    ...args: DateTimeFormatArgs
  ) {
    return createFormatter(args);
  } as typeof Intl.DateTimeFormat);
}

export function setMockTimezone(timezone: string) {
  activeTimezone = timezone;
}

export function resetMockTimezone() {
  activeTimezone = DEFAULT_TIMEZONE;
}

export function getMockTimezone() {
  return activeTimezone;
}
