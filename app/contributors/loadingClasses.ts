// Expected Tailwind classes on the /contributors loading skeleton, shared across
// the loading.*.test.tsx suites so the light/dark expectations live in one place.
export const LOADING_ROOT_CLASSES: string[] = [
  'flex',
  'min-h-screen',
  'items-center',
  'justify-center',
  'bg-white',
  'dark:bg-[#050505]',
  'text-black',
  'dark:text-white',
];

export const LOADING_SPINNER_CLASSES: string[] = [
  'h-16',
  'w-16',
  'animate-spin',
  'rounded-full',
  'border-2',
  'border-black/10',
  'dark:border-white/10',
  'border-t-cyan-400',
];
