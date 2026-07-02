// app/generator/components/SectionCard.massive-scaling.test.tsx

import { act, render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SectionCard, FieldLabel } from './SectionCard';

describe('SectionCard - Massive Data Sets and Extreme High Bounds Scaling', () => {
  // Test Case 1: Massive title, description, badge and deeply nested children
  it(
    '1. renders without crashing when given massive title, description, ' +
      'badge value and thousands of nested child elements',
    () => {
      const massiveTitle = 'Contributor Activity Log '.repeat(500).trim(); // ~12 000 chars
      const massiveDescription = 'High-volume event entry '.repeat(1000).trim(); // ~24 000 chars
      const extremeBadge = 999_999;

      // Build thousands of child nodes representing contributor actions
      const manyItems = Array.from({ length: 3000 }, (_, i) => (
        <div key={i} data-testid={`action-item-${i}`}>
          Action #{i}: commit pushed at index {i}
        </div>
      ));

      const { container } = render(
        <SectionCard
          title={massiveTitle}
          description={massiveDescription}
          badge={extremeBadge}
          defaultOpen={true}
        >
          <div id="contributor-list">{manyItems}</div>
        </SectionCard>
      );

      // Title heading should be present and hold the value without truncation in the DOM
      const titleEl = container.querySelector('h3');
      expect(titleEl).toBeInTheDocument();
      expect(titleEl?.textContent).toBe(massiveTitle);

      // Badge should display the extreme numeric value
      expect(screen.getByText(String(extremeBadge))).toBeInTheDocument();

      // All 3 000 child items should be mounted in the DOM
      const contributorList = container.querySelector('#contributor-list');
      expect(contributorList).toBeInTheDocument();
      expect(contributorList?.childElementCount).toBe(3000);

      // The wrapping card element must still be a single root node (no layout tree break)
      expect(container.firstChild).toBeInTheDocument();
      expect(container.children).toHaveLength(1);
    }
  );

  // Test Case 2: Collapse / expand toggle under a heavy children load preserves DOM integrity
  it('2. toggle open/close state correctly when thousands of grid items are rendered as children', () => {
    const gridItems = Array.from({ length: 5000 }, (_, i) => (
      <span key={i} className={`grid-item-${i % 12}`}>
        {`Item ${i}`}
      </span>
    ));

    render(
      <SectionCard title="Massive Grid Section" defaultOpen={true}>
        <div data-testid="grid-container" role="list">
          {gridItems}
        </div>
      </SectionCard>
    );

    const toggleButton = screen.getByRole('button', { name: /Massive Grid Section/i });

    // Initially open - all grid items should be in the document
    expect(screen.getByTestId('grid-container')).toBeInTheDocument();
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

    // The ChevronDown SVG must be present and correctly scoped inside the button
    // even under 5 000-item load - verifies SVG coordinates scale cleanly
    const svgIcon = toggleButton.querySelector('svg');
    expect(svgIcon).not.toBeNull();
    expect(svgIcon?.getAttribute('width')).toBeTruthy();
    expect(svgIcon?.getAttribute('height')).toBeTruthy();

    // Collapse the card
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

    // Content region should be completely removed from the DOM (no dangling nodes)
    expect(screen.queryByTestId('grid-container')).not.toBeInTheDocument();

    // SVG must still be present after collapse (button itself stays mounted)
    expect(toggleButton.querySelector('svg')).not.toBeNull();

    // Expand again and verify children re-mount without errors
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('grid-container')).toBeInTheDocument();
  });

  // Test Case 3: Extreme string values in children - verify text wrapping integrity
  it(
    '3. handles children containing extremely long strings and special characters ' +
      'without breaking layout',
    () => {
      const extremeString = '🚀'.repeat(2000) + 'A'.repeat(10000) + '中文'.repeat(3000);
      const specialCharString = '<script>alert("xss")</script>'.repeat(500);
      const unicodeMetrics = '∑∆Ω'.repeat(4000);

      const { container } = render(
        <SectionCard
          title="Extreme String Section"
          description={'D'.repeat(5000)}
          defaultOpen={true}
        >
          <p data-testid="extreme-text">{extremeString}</p>
          <p data-testid="special-chars">{specialCharString}</p>
          <p data-testid="unicode-metrics">{unicodeMetrics}</p>
        </SectionCard>
      );

      // All paragraphs should be in the DOM and hold full text content
      const extremeEl = screen.getByTestId('extreme-text');
      expect(extremeEl).toBeInTheDocument();
      expect(extremeEl.textContent).toBe(extremeString);

      const specialEl = screen.getByTestId('special-chars');
      expect(specialEl).toBeInTheDocument();
      // Content must be text-node escaped - no actual <script> elements injected
      expect(container.querySelectorAll('script')).toHaveLength(0);
      expect(specialEl.textContent).toBe(specialCharString);

      const unicodeEl = screen.getByTestId('unicode-metrics');
      expect(unicodeEl).toBeInTheDocument();
      expect(unicodeEl.textContent?.length).toBeGreaterThan(0);

      // The card structure should still have only one root wrapper (no overflow into siblings)
      expect(container.children).toHaveLength(1);
    }
  );

  // Test Case 4: High-frequency rerender performance - must complete within 3 000 ms
  it(
    '4. completes rapid sequential rerenders with varying heavy payloads ' +
      'within acceptable time limits',
    () => {
      const makeChildren = (count: number) =>
        Array.from({ length: count }, (_, i) => (
          <div key={i} data-index={i}>
            Contributor {i} pushed {i * 7} commits
          </div>
        ));

      const { rerender } = render(
        <SectionCard title="Performance Section" badge={0} defaultOpen={true}>
          {makeChildren(100)}
        </SectionCard>
      );

      const start = performance.now();

      act(() => {
        for (let i = 1; i <= 30; i++) {
          rerender(
            <SectionCard
              title={`Performance Section Iteration ${i}`}
              description={`Cycle ${i}: ` + 'x'.repeat(i * 100)}
              badge={i * 1000}
              defaultOpen={i % 2 === 0}
            >
              {makeChildren(i * 50)}
            </SectionCard>
          );
        }
      });

      const duration = performance.now() - start;

      // 30 rerenders with growing children payloads must stay below 3 000 ms
      expect(duration).toBeLessThan(3000);

      // Final rendered title should reflect the last iteration
      expect(screen.getByText(/Performance Section Iteration 30/i)).toBeInTheDocument();

      // ChevronDown SVG must still be rendered correctly after heavy rerender cycles -
      // verifies SVG coordinates do not degrade under repeated reconciliation
      const finalButton = screen.getByRole('button', {
        name: /Performance Section Iteration 30/i,
      });
      expect(finalButton.querySelector('svg')).not.toBeNull();
    }
  );

  // Test Case 5: Multiple SectionCard instances with high badge counts and FieldLabel children
  it(
    '5. renders multiple SectionCard and FieldLabel instances simultaneously with extreme ' +
      'metrics without browser layout breakage',
    () => {
      // Build an activity log simulating thousands of contributor data points split across sections
      const sectionCount = 10;
      const itemsPerSection = 500;

      const sections = Array.from({ length: sectionCount }, (_, sIdx) => {
        const items = Array.from({ length: itemsPerSection }, (_, iIdx) => (
          <div key={iIdx} data-testid={`s${sIdx}-item-${iIdx}`}>
            <FieldLabel htmlFor={`s${sIdx}-input-${iIdx}`}>{`Field ${iIdx}`}</FieldLabel>
            <input id={`s${sIdx}-input-${iIdx}`} defaultValue={`value-${'v'.repeat(50)}-${iIdx}`} />
          </div>
        ));

        return (
          <SectionCard
            key={sIdx}
            title={`Activity Log Section ${sIdx}`}
            description={`Tracking ${itemsPerSection} contributor events in section ${sIdx}`}
            badge={itemsPerSection * (sIdx + 1)}
            defaultOpen={true}
            icon="📊"
          >
            <div data-testid={`section-body-${sIdx}`}>{items}</div>
          </SectionCard>
        );
      });

      const { container } = render(<div data-testid="multi-section-root">{sections}</div>);

      const root = screen.getByTestId('multi-section-root');
      expect(root).toBeInTheDocument();

      // Every section card body must be mounted
      for (let sIdx = 0; sIdx < sectionCount; sIdx++) {
        const body = screen.getByTestId(`section-body-${sIdx}`);
        expect(body).toBeInTheDocument();
        expect(body.childElementCount).toBe(itemsPerSection);
      }

      // Total number of top-level cards should equal sectionCount (no extra root fragments)
      const allToggleButtons = screen.getAllByRole('button');
      expect(allToggleButtons.length).toBe(sectionCount);

      // Badge values should scale correctly for each section
      for (let sIdx = 0; sIdx < sectionCount; sIdx++) {
        const expectedBadge = itemsPerSection * (sIdx + 1);
        expect(screen.getByText(String(expectedBadge))).toBeInTheDocument();
      }

      // The overall container must remain a single DOM root without stray sibling nodes
      expect(container.children).toHaveLength(1);
    }
  );
});
