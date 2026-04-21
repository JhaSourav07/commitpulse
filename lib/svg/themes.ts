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
  ocean: {
    bg: '0a192f',
    text: 'ccd6f6',
    accent: '64ffda',
  },
  sunset: {
    bg: '1a0a0a',
    text: 'ffd6c0',
    accent: 'ff6b35',
  },
  forest: {
    bg: '0d1f0d',
    text: 'c8f0c8',
    accent: '39d353',
  },
  rose: {
    bg: '1f0d14',
    text: 'f0c8d4',
    accent: 'ff6b9d',
  },
  nord: {
    bg: '2e3440',
    text: 'd8dee9',
    accent: '88c0d0',
  },
};
