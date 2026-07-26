export const getIntensityColor = (intensity: number): string => {
  switch (intensity) {
    case 0:
      return 'bg-gray-200 dark:bg-[#161616]';
    case 1:
      return 'bg-gray-400 dark:bg-zinc-700';
    case 2:
      return 'bg-gray-500 dark:bg-zinc-500';
    case 3:
      return 'bg-gray-700 dark:bg-zinc-300';
    case 4:
      return 'bg-black dark:bg-white';
    default:
      return 'bg-gray-200 dark:bg-[#161616]';
  }
};
