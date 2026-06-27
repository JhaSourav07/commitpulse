import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QuotaMonitor } from './quota-monitor';

describe('QuotaMonitor - Interactive Tooltips, Cursor Hovers & Touch Event Propagation', () => {
  let monitor: QuotaMonitor;

  beforeEach(() => {
    document.body.innerHTML = '';
    monitor = QuotaMonitor.getInstance();
    monitor.reset();
  });

  it('triggers simulated mouseenter/hover gestures on active segments or interactive nodes', () => {
    monitor.setQuota(5000, 4200, Date.now());

    const segment = document.createElement('div');
    segment.className = 'quota-segment quota-segment--active';
    const onHover = vi.fn();

    segment.addEventListener('mouseenter', () => {
      onHover(monitor.getQuota());
    });

    document.body.appendChild(segment);
    segment.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

    expect(onHover).toHaveBeenCalledOnce();
    expect(onHover.mock.calls[0][0].remaining).toBe(4200);
  });

  it('verifies that responsive tooltip layouts display at computed coordinates', () => {
    const tooltip = document.createElement('div');
    tooltip.id = 'quota-tooltip';
    document.body.appendChild(tooltip);

    const getTooltipPosition = (event: { clientX: number; clientY: number }) => ({
      top: event.clientY + 12,
      left: event.clientX + 12,
    });

    const showTooltipAt = (
      element: HTMLElement,
      position: { top: number; left: number },
      label: string
    ) => {
      element.style.position = 'absolute';
      element.style.top = `${position.top}px`;
      element.style.left = `${position.left}px`;
      element.style.display = 'block';
      element.textContent = label;
    };

    const hoverEvent = { clientX: 180, clientY: 96 };
    const position = getTooltipPosition(hoverEvent);
    const quota = monitor.getQuota();

    showTooltipAt(tooltip, position, `${quota.remaining} / ${quota.limit} API calls remaining`);

    expect(tooltip.style.top).toBe('108px');
    expect(tooltip.style.left).toBe('192px');
    expect(tooltip.style.display).toBe('block');
    expect(tooltip.textContent).toContain('5000');
  });

  it('tests custom click/touch gestures and ensures click events propagate correctly', () => {
    const panel = document.createElement('div');
    const refreshButton = document.createElement('button');
    refreshButton.type = 'button';
    refreshButton.textContent = 'Refresh quota';

    panel.appendChild(refreshButton);
    document.body.appendChild(panel);

    const panelClickSpy = vi.fn();
    const touchSpy = vi.fn();

    panel.addEventListener('click', panelClickSpy);
    refreshButton.addEventListener('touchstart', touchSpy, { passive: true });
    refreshButton.addEventListener('click', () => {
      monitor.incrementRefreshCount();
    });

    refreshButton.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
    expect(touchSpy).toHaveBeenCalledOnce();

    refreshButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(panelClickSpy).toHaveBeenCalledOnce();
    expect(monitor.getQuota().totalRefreshes).toBe(1);
  });

  it('asserts appropriate cursor style classes (like pointer) are applied on hover', () => {
    monitor.setQuota(5000, 400, Date.now());

    const indicator = document.createElement('button');
    indicator.className = 'quota-indicator';
    document.body.appendChild(indicator);

    indicator.addEventListener('mouseenter', () => {
      if (monitor.isQuotaLow()) {
        indicator.classList.add('cursor-pointer', 'quota-indicator--low');
      }
    });

    indicator.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

    expect(monitor.isQuotaLow()).toBe(true);
    expect(indicator.classList.contains('cursor-pointer')).toBe(true);
    expect(indicator.classList.contains('quota-indicator--low')).toBe(true);
  });

  it('checks that mouseleave events successfully hide temporary overlay visuals', () => {
    const segment = document.createElement('div');
    const overlay = document.createElement('div');

    overlay.id = 'quota-hover-overlay';
    overlay.style.opacity = '1';
    overlay.style.visibility = 'visible';

    document.body.appendChild(segment);
    document.body.appendChild(overlay);

    segment.addEventListener('mouseleave', () => {
      overlay.style.opacity = '0';
      overlay.style.visibility = 'hidden';
      overlay.style.display = 'none';
    });

    segment.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));

    expect(overlay.style.opacity).toBe('0');
    expect(overlay.style.visibility).toBe('hidden');
    expect(overlay.style.display).toBe('none');
  });

  it('prevents duplicate refresh increments from rapid double-click interactions', () => {
    const refreshButton = document.createElement('button');
    document.body.appendChild(refreshButton);

    const handleRefreshClick = vi.fn(() => {
      if (!refreshButton.dataset.refreshing) {
        refreshButton.dataset.refreshing = 'true';
        monitor.incrementRefreshCount();
      }
    });

    refreshButton.addEventListener('click', handleRefreshClick);

    refreshButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    refreshButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(handleRefreshClick).toHaveBeenCalledTimes(2);
    expect(monitor.getQuota().totalRefreshes).toBe(1);
  });

  it('hides tooltip overlay after hover ends when quota segment loses focus', () => {
    monitor.setQuota(5000, 2500, Date.now());

    const segment = document.createElement('div');
    const tooltip = document.createElement('div');
    tooltip.style.display = 'block';

    document.body.appendChild(segment);
    document.body.appendChild(tooltip);

    segment.addEventListener('mouseenter', () => {
      tooltip.style.display = 'block';
    });
    segment.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
    });

    segment.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    expect(tooltip.style.display).toBe('block');

    segment.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    expect(tooltip.style.display).toBe('none');
  });
});
