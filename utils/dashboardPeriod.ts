export type DashboardPeriodKind = 'rolling' | 'month' | 'year' | 'range';

export interface DashboardPeriod {
  kind: DashboardPeriodKind;
  label: string;
  from: string;
  to: string;
  month?: string;
  year?: string;
}

export interface DashboardPeriodInput {
  year?: string;
  month?: string;
  from?: string;
  to?: string;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function startOfMonthUtc(year: number, monthIndex: number): Date {
  return new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
}

function endOfMonthUtc(year: number, monthIndex: number): Date {
  return new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999));
}

function addMonthsUtc(date: Date, offset: number): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, date.getUTCDate(), 0, 0, 0, 0)
  );
}

function addDaysUtc(date: Date, offset: number): Date {
  return new Date(date.getTime() + offset * 24 * 60 * 60 * 1000);
}

function isValidIsoDate(value?: string): value is string {
  if (!value) return false;
  return !Number.isNaN(Date.parse(value));
}

function toIsoDayStart(date: Date): string {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0)
  ).toISOString();
}

function toIsoDayEnd(date: Date): string {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999)
  ).toISOString();
}

function formatMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function formatRollingLabel(start: Date, end: Date): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });

  return `${formatter.format(start)} to ${formatter.format(end)}`;
}

export function resolveDashboardPeriod(
  input: DashboardPeriodInput,
  now: Date = new Date()
): DashboardPeriod {
  const currentYear = now.getUTCFullYear();

  if (isValidIsoDate(input.from) && isValidIsoDate(input.to)) {
    const from = new Date(input.from);
    const to = new Date(input.to);

    return {
      kind: 'range',
      label: formatRollingLabel(from, to),
      from: toIsoDayStart(from),
      to: toIsoDayEnd(to),
    };
  }

  if (input.month && /^\d{4}-\d{2}$/.test(input.month)) {
    const [yearPart, monthPart] = input.month.split('-');
    const yearValue = Number(yearPart);
    const monthValue = Number(monthPart);

    if (
      Number.isFinite(yearValue) &&
      Number.isFinite(monthValue) &&
      monthValue >= 1 &&
      monthValue <= 12
    ) {
      const monthIndex = monthValue - 1;
      const start = startOfMonthUtc(yearValue, monthIndex);
      const end = endOfMonthUtc(yearValue, monthIndex);

      return {
        kind: 'month',
        label: formatMonthLabel(start),
        month: input.month,
        from: start.toISOString(),
        to: end.toISOString(),
      };
    }
  }

  if (input.year && /^\d{4}$/.test(input.year)) {
    const yearValue = Number(input.year);

    if (yearValue >= 2008 && yearValue <= currentYear + 5) {
      const start = new Date(Date.UTC(yearValue, 0, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(yearValue, 11, 31, 23, 59, 59, 999));

      return {
        kind: 'year',
        label: input.year,
        year: input.year,
        from: start.toISOString(),
        to: end.toISOString(),
      };
    }
  }

  const end = endOfMonthUtc(currentYear, now.getUTCMonth());
  const start = startOfMonthUtc(currentYear, now.getUTCMonth() - 11);

  return {
    kind: 'rolling',
    label: 'Last 12 months',
    from: start.toISOString(),
    to: end.toISOString(),
  };
}

export function shiftDashboardPeriod(
  period: DashboardPeriod,
  direction: 'prev' | 'next'
): DashboardPeriod {
  const offset = direction === 'next' ? 1 : -1;

  if (period.kind === 'month') {
    const base = new Date(period.from);
    const shifted = addMonthsUtc(base, offset);
    const month = `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}`;
    return resolveDashboardPeriod({ month });
  }

  if (period.kind === 'year') {
    const base = new Date(period.from);
    const year = String(base.getUTCFullYear() + offset);
    return resolveDashboardPeriod({ year });
  }

  if (period.kind === 'range') {
    const from = new Date(period.from);
    const to = new Date(period.to);
    const spanDays = Math.max(
      1,
      Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000))
    );
    const shiftedFrom = addDaysUtc(from, offset * spanDays);
    const shiftedTo = addDaysUtc(to, offset * spanDays);
    return resolveDashboardPeriod({ from: shiftedFrom.toISOString(), to: shiftedTo.toISOString() });
  }

  const from = new Date(period.from);
  const to = new Date(period.to);
  const shiftedFrom = addMonthsUtc(from, offset);
  const shiftedTo = addMonthsUtc(to, offset);
  return resolveDashboardPeriod({ from: shiftedFrom.toISOString(), to: shiftedTo.toISOString() });
}

export function dashboardPeriodToSearchParams(period: DashboardPeriod): URLSearchParams {
  const params = new URLSearchParams();

  if (period.kind === 'month' && period.month) {
    params.set('month', period.month);
    return params;
  }

  if (period.kind === 'year' && period.year) {
    params.set('year', period.year);
    return params;
  }

  params.set('from', period.from);
  params.set('to', period.to);
  return params;
}
