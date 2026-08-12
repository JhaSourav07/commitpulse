declare module '@next/bundle-analyzer' {
  import type { NextConfig } from 'next';

  export interface BundleAnalyzerOptions {
    enabled?: boolean;
    openAnalyzer?: boolean;
    analyzerMode?: 'json' | 'static' | 'disabled' | 'server' | 'client';
    logLevel?: 'info' | 'warn' | 'error' | 'silent';
  }

  function withBundleAnalyzer(options?: BundleAnalyzerOptions): (config?: NextConfig) => NextConfig;

  export default withBundleAnalyzer;
}
