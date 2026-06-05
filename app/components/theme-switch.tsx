'use client';

import { Moon, Sun } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type ButtonHTMLAttributes } from 'react';
import { flushSync } from 'react-dom';

export type AnimationVariant = 'circle' | 'rectangle' | 'gif' | 'polygon' | 'circle-blur';

export type AnimationStart =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center'
  | 'top-center'
  | 'bottom-center'
  | 'bottom-up'
  | 'top-down'
  | 'left-right'
  | 'right-left';

interface Animation {
  name: string;
  css: string;
}

interface ViewTransition {
  finished?: Promise<void>;
}

interface ThemeToggleOptions {
  variant?: AnimationVariant;
  start?: AnimationStart;
  blur?: boolean;
  gifUrl?: string;
}

interface ThemeToggleButtonProps
  extends
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onClick'>,
    ThemeToggleOptions {
  className?: string;
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => ViewTransition;
};

const STYLE_ID = 'commitpulse-theme-transition-styles';
const TRANSITION_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

const getInitialIsDark = () => {
  if (typeof window === 'undefined') {
    return true;
  }

  const storedTheme = window.localStorage.getItem('theme');

  if (storedTheme) {
    return storedTheme !== 'light';
  }

  return true;
};

const getPositionCoords = (position: AnimationStart) => {
  switch (position) {
    case 'top-left':
      return { cx: '0', cy: '0' };
    case 'top-right':
      return { cx: '40', cy: '0' };
    case 'bottom-left':
      return { cx: '0', cy: '40' };
    case 'bottom-right':
      return { cx: '40', cy: '40' };
    case 'center':
      return { cx: '20', cy: '20' };
    case 'top-center':
      return { cx: '20', cy: '0' };
    case 'bottom-center':
      return { cx: '20', cy: '40' };
    case 'bottom-up':
    case 'top-down':
    case 'left-right':
    case 'right-left':
      return { cx: '20', cy: '20' };
  }
};

const getTransformOrigin = (start: AnimationStart) => {
  switch (start) {
    case 'top-left':
      return 'top left';
    case 'top-right':
      return 'top right';
    case 'bottom-left':
      return 'bottom left';
    case 'bottom-right':
      return 'bottom right';
    case 'center':
      return 'center';
    case 'top-center':
      return 'top center';
    case 'bottom-center':
      return 'bottom center';
    case 'bottom-up':
    case 'top-down':
    case 'left-right':
    case 'right-left':
      return 'center';
  }
};

const generateSVG = (variant: AnimationVariant, start: AnimationStart) => {
  if (variant === 'rectangle') {
    return '';
  }

  const { cx, cy } = getPositionCoords(start);

  if (variant === 'circle-blur') {
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><defs><filter id="blur"><feGaussianBlur stdDeviation="2"/></filter></defs><circle cx="${cx}" cy="${cy}" r="18" fill="white" filter="url(%23blur)"/></svg>`;
  }

  if (variant === 'circle') {
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="${cx}" cy="${cy}" r="20" fill="white"/></svg>`;
  }

  return '';
};

const getCircleClipPathPosition = (position: AnimationStart) => {
  switch (position) {
    case 'top-left':
      return '0% 0%';
    case 'top-right':
      return '100% 0%';
    case 'bottom-left':
      return '0% 100%';
    case 'bottom-right':
      return '100% 100%';
    case 'top-center':
      return '50% 0%';
    case 'bottom-center':
      return '50% 100%';
    default:
      return '50% 50%';
  }
};

const getRectangleClipPath = (direction: AnimationStart) => {
  switch (direction) {
    case 'bottom-up':
      return {
        from: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)',
        to: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      };
    case 'top-down':
      return {
        from: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
        to: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      };
    case 'left-right':
      return {
        from: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)',
        to: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      };
    case 'right-left':
      return {
        from: 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)',
        to: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      };
    case 'top-left':
      return {
        from: 'polygon(0% 0%, 0% 0%, 0% 0%, 0% 0%)',
        to: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      };
    case 'top-right':
      return {
        from: 'polygon(100% 0%, 100% 0%, 100% 0%, 100% 0%)',
        to: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      };
    case 'bottom-left':
      return {
        from: 'polygon(0% 100%, 0% 100%, 0% 100%, 0% 100%)',
        to: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      };
    case 'bottom-right':
      return {
        from: 'polygon(100% 100%, 100% 100%, 100% 100%, 100% 100%)',
        to: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      };
    default:
      return {
        from: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)',
        to: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      };
  }
};

const getPolygonClipPaths = (position: AnimationStart) => {
  switch (position) {
    case 'top-right':
      return {
        darkFrom: 'polygon(150% -71%, 250% 71%, 250% 71%, 150% -71%)',
        darkTo: 'polygon(150% -71%, 250% 71%, 50% 171%, -71% 50%)',
        lightFrom: 'polygon(-71% 50%, 50% 171%, 50% 171%, -71% 50%)',
        lightTo: 'polygon(-71% 50%, 50% 171%, 250% 71%, 150% -71%)',
      };
    default:
      return {
        darkFrom: 'polygon(50% -71%, -50% 71%, -50% 71%, 50% -71%)',
        darkTo: 'polygon(50% -71%, -50% 71%, 50% 171%, 171% 50%)',
        lightFrom: 'polygon(171% 50%, 50% 171%, 50% 171%, 171% 50%)',
        lightTo: 'polygon(171% 50%, 50% 171%, -50% 71%, 50% -71%)',
      };
  }
};

export const createAnimation = (
  variant: AnimationVariant,
  start: AnimationStart = 'center',
  blur = false,
  url?: string
): Animation => {
  const svg = generateSVG(variant, start);
  const transformOrigin = getTransformOrigin(start);

  if (variant === 'rectangle') {
    const clipPath = getRectangleClipPath(start);

    return {
      name: `${variant}-${start}${blur ? '-blur' : ''}`,
      css: `
        ::view-transition-group(root) {
          animation-duration: 0.7s;
          animation-timing-function: ${TRANSITION_EASING};
        }

        ::view-transition-new(root) {
          animation-name: reveal-light-${start}${blur ? '-blur' : ''};
          ${blur ? 'filter: blur(2px);' : ''}
        }

        ::view-transition-old(root),
        .dark::view-transition-old(root) {
          animation: none;
          z-index: -1;
        }

        .dark::view-transition-new(root) {
          animation-name: reveal-dark-${start}${blur ? '-blur' : ''};
          ${blur ? 'filter: blur(2px);' : ''}
        }

        @keyframes reveal-dark-${start}${blur ? '-blur' : ''} {
          from {
            clip-path: ${clipPath.from};
            ${blur ? 'filter: blur(8px);' : ''}
          }
          ${blur ? '50% { filter: blur(4px); }' : ''}
          to {
            clip-path: ${clipPath.to};
            ${blur ? 'filter: blur(0px);' : ''}
          }
        }

        @keyframes reveal-light-${start}${blur ? '-blur' : ''} {
          from {
            clip-path: ${clipPath.from};
            ${blur ? 'filter: blur(8px);' : ''}
          }
          ${blur ? '50% { filter: blur(4px); }' : ''}
          to {
            clip-path: ${clipPath.to};
            ${blur ? 'filter: blur(0px);' : ''}
          }
        }
      `,
    };
  }

  if (variant === 'gif') {
    return {
      name: `${variant}-${start}`,
      css: `
        ::view-transition-group(root) {
          animation-timing-function: ${TRANSITION_EASING};
        }

        ::view-transition-new(root) {
          mask: url('${url ?? ''}') center / 0 no-repeat;
          animation: scale 3s;
        }

        ::view-transition-old(root),
        .dark::view-transition-old(root) {
          animation: scale 3s;
        }

        @keyframes scale {
          0% {
            mask-size: 0;
          }
          10% {
            mask-size: 50vmax;
          }
          90% {
            mask-size: 50vmax;
          }
          100% {
            mask-size: 2000vmax;
          }
        }
      `,
    };
  }

  if (variant === 'circle-blur') {
    return {
      name: `${variant}-${start}`,
      css: `
        ::view-transition-group(root) {
          animation-timing-function: ${TRANSITION_EASING};
        }

        ::view-transition-new(root) {
          mask: url('${svg}') ${start === 'center' ? 'center' : start.replace('-', ' ')} / 0 no-repeat;
          mask-origin: content-box;
          animation: scale 1s;
          transform-origin: ${transformOrigin};
        }

        ::view-transition-old(root),
        .dark::view-transition-old(root) {
          animation: scale 1s;
          transform-origin: ${transformOrigin};
          z-index: -1;
        }

        @keyframes scale {
          to {
            mask-size: 350vmax;
          }
        }
      `,
    };
  }

  if (variant === 'polygon') {
    const clipPaths = getPolygonClipPaths(start);

    return {
      name: `${variant}-${start}${blur ? '-blur' : ''}`,
      css: `
        ::view-transition-group(root) {
          animation-duration: 0.7s;
          animation-timing-function: ${TRANSITION_EASING};
        }

        ::view-transition-new(root) {
          animation-name: reveal-light-${start}${blur ? '-blur' : ''};
          ${blur ? 'filter: blur(2px);' : ''}
        }

        ::view-transition-old(root),
        .dark::view-transition-old(root) {
          animation: none;
          z-index: -1;
        }

        .dark::view-transition-new(root) {
          animation-name: reveal-dark-${start}${blur ? '-blur' : ''};
          ${blur ? 'filter: blur(2px);' : ''}
        }

        @keyframes reveal-dark-${start}${blur ? '-blur' : ''} {
          from {
            clip-path: ${clipPaths.darkFrom};
            ${blur ? 'filter: blur(8px);' : ''}
          }
          ${blur ? '50% { filter: blur(4px); }' : ''}
          to {
            clip-path: ${clipPaths.darkTo};
            ${blur ? 'filter: blur(0px);' : ''}
          }
        }

        @keyframes reveal-light-${start}${blur ? '-blur' : ''} {
          from {
            clip-path: ${clipPaths.lightFrom};
            ${blur ? 'filter: blur(8px);' : ''}
          }
          ${blur ? '50% { filter: blur(4px); }' : ''}
          to {
            clip-path: ${clipPaths.lightTo};
            ${blur ? 'filter: blur(0px);' : ''}
          }
        }
      `,
    };
  }

  const clipPosition = getCircleClipPathPosition(start);

  return {
    name: `${variant}-${start}${blur ? '-blur' : ''}`,
    css: `
      ::view-transition-group(root) {
        animation-duration: ${start === 'center' ? '0.7s' : '1s'};
        animation-timing-function: ${TRANSITION_EASING};
      }

      ::view-transition-new(root) {
        animation-name: reveal-light-${start}${blur ? '-blur' : ''};
        ${blur ? 'filter: blur(2px);' : ''}
      }

      ::view-transition-old(root),
      .dark::view-transition-old(root) {
        animation: none;
        z-index: -1;
      }

      .dark::view-transition-new(root) {
        animation-name: reveal-dark-${start}${blur ? '-blur' : ''};
        ${blur ? 'filter: blur(2px);' : ''}
      }

      @keyframes reveal-dark-${start}${blur ? '-blur' : ''} {
        from {
          clip-path: circle(0% at ${clipPosition});
          ${blur ? 'filter: blur(8px);' : ''}
        }
        ${blur ? '50% { filter: blur(4px); }' : ''}
        to {
          clip-path: circle(${start === 'center' ? '100%' : '150%'} at ${clipPosition});
          ${blur ? 'filter: blur(0px);' : ''}
        }
      }

      @keyframes reveal-light-${start}${blur ? '-blur' : ''} {
        from {
          clip-path: circle(0% at ${clipPosition});
          ${blur ? 'filter: blur(8px);' : ''}
        }
        ${blur ? '50% { filter: blur(4px); }' : ''}
        to {
          clip-path: circle(${start === 'center' ? '100%' : '150%'} at ${clipPosition});
          ${blur ? 'filter: blur(0px);' : ''}
        }
      }
    `,
  };
};

export const useThemeToggle = ({
  variant = 'circle',
  start = 'top-right',
  blur = false,
  gifUrl = '',
}: ThemeToggleOptions = {}) => {
  const animation = useMemo(
    () => createAnimation(variant, start, blur, gifUrl),
    [blur, gifUrl, start, variant]
  );
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(getInitialIsDark);

  const persistTheme = useCallback((nextIsDark: boolean) => {
    document.documentElement.classList.toggle('dark', nextIsDark);
    document.documentElement.style.colorScheme = nextIsDark ? 'dark' : 'light';
    window.localStorage.setItem('theme', nextIsDark ? 'dark' : 'light');
  }, []);

  const syncTheme = useCallback(
    (nextIsDark: boolean) => {
      flushSync(() => {
        setIsDark(nextIsDark);
      });
      persistTheme(nextIsDark);
    },
    [persistTheme]
  );

  const injectStyles = useCallback((css: string) => {
    let styleElement = document.getElementById(STYLE_ID) as HTMLStyleElement | null;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = STYLE_ID;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = css;
  }, []);

  useEffect(() => {
    persistTheme(isDark);
  }, [isDark, persistTheme]);

  // SSR hydration guard: mounted starts false on both server and client so
  // the initial render matches. After hydration this effect flips it once,
  // enabling the theme toggle button (which relies on document / window APIs)
  // and preventing a flash of the wrong icon before the JS bundle runs.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const toggleTheme = useCallback(() => {
    if (!mounted) {
      return;
    }

    const nextIsDark = !isDark;
    injectStyles(animation.css);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      syncTheme(nextIsDark);
      return;
    }

    const transitionDocument = document as ViewTransitionDocument;

    if (!transitionDocument.startViewTransition) {
      syncTheme(nextIsDark);
      return;
    }

    transitionDocument.startViewTransition(() => {
      syncTheme(nextIsDark);
    });
  }, [animation.css, injectStyles, isDark, mounted, syncTheme]);

  return {
    animationName: animation.name,
    isDark,
    mounted,
    setIsDark: syncTheme,
    toggleTheme,
  };
};

export function ThemeToggleButton({
  className,
  variant = 'circle',
  start = 'top-right',
  blur = false,
  gifUrl = '',
  ...props
}: ThemeToggleButtonProps) {
  const { isDark, mounted, toggleTheme } = useThemeToggle({
    variant,
    start,
    blur,
    gifUrl,
  });

  return (
    <button
      type="button"
      className={cx(
        'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-700 transition hover:bg-gray-100 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10',
        className
      )}
      onClick={toggleTheme}
      aria-label="Toggle theme"
      {...props}
    >
      {mounted ? (
        isDark ? (
          <Moon size={18} />
        ) : (
          <Sun size={18} />
        )
      ) : (
        <span className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}
