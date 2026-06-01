export interface TrustedProxyConfig {
  /**
   * List of trusted proxy IP addresses or CIDR blocks.
   * If '*' is present, all proxies are trusted (similar to express trust proxy = true).
   */
  trustedProxies: string[];

  /**
   * Whether to trust default loopback/private IP addresses:
   * 127.0.0.1, ::1, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, fc00::/7
   */
  trustPrivateRanges?: boolean;
}

export interface GetClientIpOptions {
  /**
   * Trusted proxy configuration.
   */
  proxyConfig?: TrustedProxyConfig;

  /**
   * Custom request headers to check first, in order of priority.
   * E.g., ['x-vercel-forwarded-for', 'cf-connecting-ip', 'x-real-ip']
   */
  headersPriority?: string[];
}
