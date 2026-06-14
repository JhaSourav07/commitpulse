import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import eslintConfigPrettier from 'eslint-config-prettier';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  eslintConfigPrettier,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'coverage/**', '.github/**']),
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    },
  },
  {
    files: [
      '**/*.test.{js,jsx,ts,tsx}',
      '**/*.spec.{js,jsx,ts,tsx}',
      '**/__tests__/**/*.{js,jsx,ts,tsx}',
    ],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@next/next/no-img-element': 'off',
    },
  },
  {
    files: [
      'scripts/**/*.{js,mjs,ts}',
      'lib/resume-parser.ts'
    ],
    rules: {
      'no-console': 'off',
    },
  },
]);

export default eslintConfig;