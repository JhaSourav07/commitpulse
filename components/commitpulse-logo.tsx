type CommitPulseLogoProps = {
  className?: string;
};

export function CommitPulseLogo({ className = 'h-5 w-5' }: CommitPulseLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m7.5 4.27 9 5.15" />
      <path d="M3.29 7L12 12l8.71-5" />
      <path d="M12 22V12" />
    </svg>
  );
}
