import type React from 'react';
import { Loader2 } from 'lucide-react';

export interface SpinnerProps {
  /**
   * Text announced to assistive technology while loading. When `showLabel` is
   * true this is also rendered visibly; otherwise it is exposed via a
   * visually-hidden node so screen-reader users still receive feedback.
   */
  label?: string;
  /** Icon width/height in pixels. */
  size?: number;
  /** Render the label as visible text (default) instead of screen-reader-only. */
  showLabel?: boolean;
  /** Extra classes for the outer status container. */
  className?: string;
  /** Extra classes for the spinning icon (e.g. color). */
  iconClassName?: string;
  /** Extra classes for the visible label. */
  labelClassName?: string;
}

const join = (...classes: Array<string | false | undefined>): string =>
  classes.filter(Boolean).join(' ');

/**
 * Accessible loading indicator.
 *
 * The container is a live `role="status"` region so the loading state is
 * announced to screen readers — a bare `<Loader2 className="animate-spin" />`
 * icon is silent to assistive tech, which is the gap this component closes
 * (see issue #2253). The icon itself is `aria-hidden` because it carries no
 * text; the announcement comes from the label. The `animate-spin` animation is
 * neutralised automatically by the global `prefers-reduced-motion` rule in
 * `app/globals.css`, so no extra handling is needed here.
 */
export function Spinner({
  label = 'Loading',
  size = 32,
  showLabel = true,
  className,
  iconClassName,
  labelClassName,
}: SpinnerProps): React.JSX.Element {
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label}
      className={join('flex flex-col items-center justify-center', className)}
    >
      <Loader2
        aria-hidden="true"
        className={join('animate-spin', iconClassName || 'text-cyan-500')}
        style={{ width: size, height: size }}
      />
      {showLabel ? (
        <span className={join('mt-4 font-medium', labelClassName)}>{label}</span>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </span>
  );
}

export default Spinner;
