import { createElement, forwardRef, Fragment, type ReactNode } from 'react';

const MOTION_PROP_KEYS = new Set([
  'animate',
  'initial',
  'transition',
  'viewport',
  'whileHover',
  'whileTap',
  'whileInView',
  'exit',
  'layout',
  'layoutId',
  'drag',
  'dragConstraints',
  'dragElastic',
  'dragMomentum',
  'dragTransition',
  'variants',
  'custom',
  'onAnimationComplete',
  'onUpdate',
]);

function stripMotionProps(props: Record<string, unknown>) {
  const safeProps: Record<string, unknown> = { ...props };

  for (const key of MOTION_PROP_KEYS) {
    delete safeProps[key];
  }

  return safeProps;
}

function createMotionComponent(tag: string) {
  return forwardRef<unknown, { children?: ReactNode; [key: string]: unknown }>(
    function MotionComponent({ children, ...props }, ref) {
      return createElement(tag, { ...stripMotionProps(props), ref }, children);
    }
  );
}

export function createFramerMotionMock() {
  const cache = new Map<string, ReturnType<typeof createMotionComponent>>();

  const motion = new Proxy(
    {},
    {
      get(_target, prop) {
        if (typeof prop !== 'string') {
          return undefined;
        }

        if (!cache.has(prop)) {
          cache.set(prop, createMotionComponent(prop));
        }

        return cache.get(prop);
      },
    }
  ) as Record<string, ReturnType<typeof createMotionComponent>>;

  return {
    motion,
    AnimatePresence: ({ children }: { children: ReactNode }) =>
      createElement(Fragment, null, children),
  };
}

export type FramerMotionMock = ReturnType<typeof createFramerMotionMock>;
