import { describe, expectTypeOf, test } from 'vitest';
import type { GetClientIpOptions, TrustedProxyConfig } from './network';

describe('types/network', () => {
  test('TrustedProxyConfig requires trustedProxies as string array', () => {
    expectTypeOf<TrustedProxyConfig>().toHaveProperty('trustedProxies').toEqualTypeOf<string[]>();
  });

  test('TrustedProxyConfig allows optional trustPrivateRanges boolean', () => {
    expectTypeOf<TrustedProxyConfig>()
      .toHaveProperty('trustPrivateRanges')
      .toEqualTypeOf<boolean | undefined>();
  });

  test('GetClientIpOptions allows optional proxyConfig', () => {
    expectTypeOf<GetClientIpOptions>()
      .toHaveProperty('proxyConfig')
      .toEqualTypeOf<TrustedProxyConfig | undefined>();
  });

  test('GetClientIpOptions allows optional headersPriority string array', () => {
    expectTypeOf<GetClientIpOptions>()
      .toHaveProperty('headersPriority')
      .toEqualTypeOf<string[] | undefined>();
  });

  test('standard client IP options config satisfies GetClientIpOptions', () => {
    const options = {
      proxyConfig: {
        trustedProxies: ['127.0.0.1', '10.0.0.0/8'],
        trustPrivateRanges: true,
      },
      headersPriority: ['x-vercel-forwarded-for', 'cf-connecting-ip', 'x-real-ip'],
    } satisfies GetClientIpOptions;

    expectTypeOf(options).toMatchTypeOf<GetClientIpOptions>();
  });
});
