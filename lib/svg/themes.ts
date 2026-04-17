// lib/svg/themes.ts
import { BadgeTheme } from '../../types';

export const themes: Record<string, BadgeTheme> = {
  dark: {
    bg: '0d1117',
    text: 'c9d1d9',
    accent: '58a6ff',
  },
  light: {
    bg: 'ffffff',
    text: '24292f',
    accent: '0969da',
  },
  neon: {
    bg: '000000',
    text: '00ffcc',
    accent: 'ff00ff',
  },
  github: {
    bg: '0d1117',
    text: 'ffffff',
    accent: '238636', // The classic green
  },
  dracula: {
    bg: '282a36',
    text: 'f8f8f2',
    accent: 'bd93f9',
  },
};
