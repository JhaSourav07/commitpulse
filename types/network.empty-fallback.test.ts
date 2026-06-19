import { describe, expect, it, afterEach } from 'vitest';
import type { GetClientIpOptions, TrustedProxyConfig } from './network';

/**
 * A simulated component rendering function that generates a DOM layout
 * representing a network configuration and client IP retrieval status.
 * It consumes the network config and options, handling empty/missing
 * properties with clear, styled fallback states and non-breaking UI.
 */
function renderNetworkStatusComponent(
  options?: GetClientIpOptions | null,
  config?: TrustedProxyConfig | null
): HTMLDivElement {
  const container = document.createElement('div');
  container.id = 'network-status-component';
  container.className = 'p-4 border rounded-xl bg-white/90 shadow-sm dark:bg-black/90';

  // Title
  const title = document.createElement('h3');
  title.id = 'network-title';
  title.className = 'text-lg font-semibold text-gray-900 dark:text-gray-100';
  title.textContent = 'Network Configuration Status';
  container.appendChild(title);

  // Case 1: Completely missing configuration parameters
  if (!options && !config) {
    const fallback = document.createElement('div');
    fallback.id = 'fallback-empty-marker';
    fallback.className = 'mt-2 text-sm text-red-500 font-medium fallback-error';
    fallback.textContent = 'No configuration parameters provided. Reverting to default settings.';
    container.appendChild(fallback);
    return container;
  }

  // Trusted Proxies Section
  const proxySection = document.createElement('div');
  proxySection.className = 'mt-3 space-y-2';

  const proxyTitle = document.createElement('h4');
  proxyTitle.className = 'text-sm font-medium text-gray-700 dark:text-gray-300';
  proxyTitle.textContent = 'Trusted Proxy Configuration';
  proxySection.appendChild(proxyTitle);

  const proxies = config?.trustedProxies ?? options?.proxyConfig?.trustedProxies;
  const trustPrivate = config?.trustPrivateRanges ?? options?.proxyConfig?.trustPrivateRanges;

  if (!proxies || proxies.length === 0) {
    const emptyMarker = document.createElement('p');
    emptyMarker.id = 'empty-proxies-marker';
    emptyMarker.className = 'text-xs text-amber-600 font-medium italic empty-fallback-text';
    emptyMarker.textContent = 'No trusted proxies configured. Direct connections only.';
    proxySection.appendChild(emptyMarker);
  } else {
    const list = document.createElement('ul');
    list.id = 'proxy-list';
    list.className = 'list-disc pl-5 text-xs text-gray-600 dark:text-gray-400';
    proxies.forEach((p) => {
      const li = document.createElement('li');
      li.textContent = p;
      list.appendChild(li);
    });
    proxySection.appendChild(list);
  }

  const trustPrivateEl = document.createElement('div');
  trustPrivateEl.id = 'private-ranges-status';
  trustPrivateEl.className = 'text-xs text-gray-500 dark:text-gray-400 mt-1';
  trustPrivateEl.textContent = `Trust Private Ranges: ${trustPrivate === true ? 'Enabled' : 'Disabled'}`;
  proxySection.appendChild(trustPrivateEl);

  container.appendChild(proxySection);

  // Headers Priority Section
  const headersSection = document.createElement('div');
  headersSection.className = 'mt-4 border-t pt-2 border-gray-200 dark:border-gray-800';

  const headersTitle = document.createElement('h4');
  headersTitle.className = 'text-sm font-medium text-gray-700 dark:text-gray-300';
  headersTitle.textContent = 'Headers Priority Order';
  headersSection.appendChild(headersTitle);

  const headers = options?.headersPriority;
  if (!headers || headers.length === 0) {
    const emptyHeaders = document.createElement('p');
    emptyHeaders.id = 'empty-headers-marker';
    emptyHeaders.className = 'text-xs text-gray-400 italic empty-fallback-text';
    emptyHeaders.textContent = 'Using default headers priority hierarchy.';
    headersSection.appendChild(emptyHeaders);
  } else {
    const list = document.createElement('ol');
    list.id = 'headers-priority-list';
    list.className = 'list-decimal pl-5 text-xs text-gray-600 dark:text-gray-400';
    headers.forEach((h) => {
      const li = document.createElement('li');
      li.textContent = h;
      list.appendChild(li);
    });
    headersSection.appendChild(list);
  }

  container.appendChild(headersSection);

  // Direct IP status
  const directIpSection = document.createElement('div');
  directIpSection.className = 'mt-3 text-xs text-gray-500 dark:text-gray-400';
  const directIpVal = options?.directIp;
  if (!directIpVal) {
    const noDirectIp = document.createElement('span');
    noDirectIp.id = 'empty-direct-ip-marker';
    noDirectIp.className = 'text-amber-500 font-semibold';
    noDirectIp.textContent = 'Direct IP: Not configured';
    directIpSection.appendChild(noDirectIp);
  } else {
    const directIpEl = document.createElement('span');
    directIpEl.textContent = `Direct IP: ${directIpVal}`;
    directIpSection.appendChild(directIpEl);
  }
  container.appendChild(directIpSection);

  return container;
}

describe('types/network - Edge Cases & Empty/Missing Inputs Verification', () => {
  let rootElement: HTMLDivElement | null = null;

  afterEach(() => {
    if (rootElement && document.body.contains(rootElement)) {
      document.body.removeChild(rootElement);
    }
    rootElement = null;
  });

  it('1. renders without runtime errors and displays correct fallback UI when parameters are null', () => {
    // Assert no unexpected runtime errors or hydration/rendering failures
    expect(() => {
      rootElement = renderNetworkStatusComponent(null, null);
      document.body.appendChild(rootElement);
    }).not.toThrow();

    // Verify key DOM structures for empty fallback exist
    const fallbackEl = document.getElementById('fallback-empty-marker');
    expect(fallbackEl).not.toBeNull();
    expect(fallbackEl?.textContent).toContain('No configuration parameters provided');

    // Verify standard styles are maintained in this default empty layout state
    expect(rootElement?.className).toContain('p-4');
    expect(rootElement?.className).toContain('border');
    expect(rootElement?.className).toContain('rounded-xl');
    expect(fallbackEl?.className).toContain('text-red-500');
  });

  it('2. handles empty trusted proxies configuration gracefully with empty marker and default styles', () => {
    const emptyConfig: TrustedProxyConfig = {
      trustedProxies: [],
    };

    expect(() => {
      rootElement = renderNetworkStatusComponent(null, emptyConfig);
      document.body.appendChild(rootElement);
    }).not.toThrow();

    // Verify empty proxy marker exists in the DOM
    const emptyProxiesMarker = document.getElementById('empty-proxies-marker');
    expect(emptyProxiesMarker).not.toBeNull();
    expect(emptyProxiesMarker?.textContent).toContain('No trusted proxies configured');
    expect(emptyProxiesMarker?.className).toContain('empty-fallback-text');

    // Verify private ranges status is disabled/fallback
    const privateRangesEl = document.getElementById('private-ranges-status');
    expect(privateRangesEl?.textContent).toContain('Trust Private Ranges: Disabled');
  });

  it('3. handles empty headers priority list by displaying fallback message and default state', () => {
    const emptyOptions: GetClientIpOptions = {
      headersPriority: [],
    };

    expect(() => {
      rootElement = renderNetworkStatusComponent(emptyOptions, null);
      document.body.appendChild(rootElement);
    }).not.toThrow();

    // Verify empty headers priority marker exists
    const emptyHeadersMarker = document.getElementById('empty-headers-marker');
    expect(emptyHeadersMarker).not.toBeNull();
    expect(emptyHeadersMarker?.textContent).toContain('Using default headers priority hierarchy');

    // Verify priority list itself does not render
    const listEl = document.getElementById('headers-priority-list');
    expect(listEl).toBeNull();
  });

  it('4. displays empty marker when direct IP is not configured or undefined', () => {
    const optionsWithoutDirectIp: GetClientIpOptions = {
      directIp: undefined,
    };

    expect(() => {
      rootElement = renderNetworkStatusComponent(optionsWithoutDirectIp, null);
      document.body.appendChild(rootElement);
    }).not.toThrow();

    // Verify empty direct IP marker exists
    const emptyDirectIpMarker = document.getElementById('empty-direct-ip-marker');
    expect(emptyDirectIpMarker).not.toBeNull();
    expect(emptyDirectIpMarker?.textContent).toContain('Direct IP: Not configured');
    expect(emptyDirectIpMarker?.className).toContain('text-amber-500');
  });

  it('5. renders list items correctly under a complete/valid config without any fallback empty markers', () => {
    const fullOptions: GetClientIpOptions = {
      proxyConfig: {
        trustedProxies: ['192.168.1.1', '10.0.0.0/24'],
        trustPrivateRanges: true,
      },
      headersPriority: ['x-real-ip', 'cf-connecting-ip'],
      directIp: '127.0.0.1',
    };

    expect(() => {
      rootElement = renderNetworkStatusComponent(fullOptions, null);
      document.body.appendChild(rootElement);
    }).not.toThrow();

    // Assert that no fallback empty markers are present
    expect(document.getElementById('fallback-empty-marker')).toBeNull();
    expect(document.getElementById('empty-proxies-marker')).toBeNull();
    expect(document.getElementById('empty-headers-marker')).toBeNull();
    expect(document.getElementById('empty-direct-ip-marker')).toBeNull();

    // Verify the proxy list items
    const proxyList = document.getElementById('proxy-list');
    expect(proxyList).not.toBeNull();
    expect(proxyList?.children.length).toBe(2);
    expect(proxyList?.children[0].textContent).toBe('192.168.1.1');
    expect(proxyList?.children[1].textContent).toBe('10.0.0.0/24');

    // Verify headers list items
    const headersList = document.getElementById('headers-priority-list');
    expect(headersList).not.toBeNull();
    expect(headersList?.children.length).toBe(2);
    expect(headersList?.children[0].textContent).toBe('x-real-ip');
    expect(headersList?.children[1].textContent).toBe('cf-connecting-ip');

    // Verify private ranges and direct IP values
    const privateRangesEl = document.getElementById('private-ranges-status');
    expect(privateRangesEl?.textContent).toContain('Trust Private Ranges: Enabled');
    expect(rootElement?.textContent).toContain('Direct IP: 127.0.0.1');
  });
});
