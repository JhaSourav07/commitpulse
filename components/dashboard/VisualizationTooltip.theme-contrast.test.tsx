// components/dashboard/VisualizationTooltip.theme-contrast.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { HTMLAttributes, ReactNode } from 'react';
import VisualizationTooltip from './VisualizationTooltip';
import '@testing-library/jest-dom/vitest';

// framer-motion mock — mirrors the mock used in VisualizationTooltip.test.tsx
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe('VisualizationTooltip - Dark & Light Prefers-Color-Scheme Cohesion', () => {
  it('applies paired light/dark background and border contrast classes on the tooltip root', () => {
    render(
      <VisualizationTooltip title="Cohesion" x={10} y={20}>
        Body
      </VisualizationTooltip>
    );

    const tooltip = screen.getByRole('tooltip');
    const classNames = tooltip.className.split(' ');

    // Light-mode background stays mostly opaque so foreground text never gets clipped
    expect(classNames).toContain('bg-white/95');
    // Dark-mode counterpart uses the same opacity budget
    expect(classNames).toContain('dark:bg-[#111]/95');
    // Border tokens must define edges in both schemes
    expect(classNames).toContain('border-black/10');
    expect(classNames).toContain('dark:border-white/10');
  });

  it('uses high-contrast text colors for the title in both light and dark modes', () => {
    render(
      <VisualizationTooltip title="Title" x={0} y={0}>
        Body
      </VisualizationTooltip>
    );

    // The title is the first <div> nested inside the tooltip
    const tooltip = screen.getByRole('tooltip');
    const titleDiv = tooltip.querySelector('div');

    expect(titleDiv).not.toBeNull();
    const titleClasses = titleDiv!.className.split(' ');
    // The lightest neutral on light surfaces and pure white on dark surfaces
    // guarantee the title remains legible in both color schemes.
    expect(titleClasses).toContain('text-gray-950');
    expect(titleClasses).toContain('dark:text-white');
  });

  it('uses distinct, readable text colors for the body in both light and dark modes', () => {
    render(
      <VisualizationTooltip title="Title" x={0} y={0}>
        Body
      </VisualizationTooltip>
    );

    // The body is the second <div> nested inside the tooltip
    const tooltip = screen.getByRole('tooltip');
    const bodyDiv = tooltip.querySelectorAll('div')[1];

    expect(bodyDiv).not.toBeNull();
    const bodyClasses = bodyDiv!.className.split(' ');
    // Body text uses a slightly muted palette so it never collides with the title color
    expect(bodyClasses).toContain('text-gray-600');
    expect(bodyClasses).toContain('dark:text-gray-300');
  });

  it('keeps the surface opaque enough that the foreground text is never clipped', () => {
    render(
      <VisualizationTooltip title="Overlay" x={0} y={0}>
        Body
      </VisualizationTooltip>
    );

    const tooltip = screen.getByRole('tooltip');
    const classNames = tooltip.className.split(' ');

    // A 95% opacity ceiling keeps the surface visible without leaking
    // the page background over the foreground.
    expect(classNames).toContain('bg-white/95');
    expect(classNames).toContain('dark:bg-[#111]/95');
    // Backdrop blur plus shadow tokens add depth without dimming the text.
    expect(classNames).toContain('backdrop-blur-md');
    expect(classNames).toContain('shadow-2xl');
    // Negative contrast checks: the tooltip never uses a fully transparent surface
    expect(classNames).not.toContain('bg-transparent');
    expect(classNames).not.toContain('dark:bg-transparent');
  });

  it('preserves font-weight and sizing classes for stable title/body hierarchy', () => {
    render(
      <VisualizationTooltip title="Hierarchy" x={0} y={0}>
        Body
      </VisualizationTooltip>
    );

    const tooltip = screen.getByRole('tooltip');
    const titleDiv = tooltip.querySelector('div');
    const bodyDiv = tooltip.querySelectorAll('div')[1];

    // Typography must remain intact independent of the active color scheme —
    // these classes are the contract that makes the tooltip scannable.
    const tooltipClasses = tooltip.className.split(' ');
    const titleClasses = titleDiv!.className.split(' ');
    const bodyClasses = bodyDiv!.className.split(' ');

    expect(tooltipClasses).toContain('text-xs');
    expect(titleClasses).toContain('font-semibold');
    expect(titleClasses).toContain('mb-1');
    expect(bodyClasses).toContain('text-[11px]');
    expect(bodyClasses).toContain('leading-relaxed');
  });
});
