import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import eslintConfigPrettier from 'eslint-config-prettier';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  eslintConfigPrettier,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'coverage/**',
    '.github/**',
    'public/sw.js',
    'public/sw.js.map',
    'lib/svg/fonts.ts',
    'scratch/**',
    'public/swe-*.js',
    'public/swe-*.js.map',
    'public/workbox-*.js',
    'public/workbox-*.js.map',
  ]),
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    },
  },
  {
    files: [
      '**/*.test.{js,jsx,ts,tsx}',
      '**/__tests__/**/*.{js,jsx,ts,tsx}',
      'scripts/**/*.{js,jsx,ts,tsx}',
    ],
    rules: {
      'no-console': 'off',
    },
  },
]);

export default eslintConfig;
