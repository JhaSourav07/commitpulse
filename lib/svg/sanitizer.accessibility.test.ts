import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

import { sanitizeFont, sanitizeHexColor } from './sanitizer';

describe('SVG Sanitizer Accessibility (Integration)', () => {
  it('inspects markup for correct use of aria-labelledby and title', () => {
    document.body.innerHTML = `
      <svg role="img" aria-labelledby="svg-title">
        <title id="svg-title">Chart preview</title>
        <circle cx="10" cy="10" r="5"></circle>
      </svg>
    `;

    const svg = screen.getByLabelText('Chart preview');
    expect(svg).toBeTruthy();
    expect(svg.getAttribute('aria-labelledby')).toBe('svg-title');
  });

  it('asserts focusable elements expose tabIndex and accept keyboard focus', async () => {
    document.body.innerHTML = `
      <svg>
        <g role="group" id="g1" tabIndex="0"></g>
      </svg>
    `;

    const group = document.getElementById('g1') as HTMLElement;
    expect(group).not.toBeNull();
    expect(group?.tabIndex).toBeGreaterThanOrEqual(0);

    // focus via keyboard
    (group as HTMLElement).focus();
    expect(document.activeElement).toBe(group);
  });

  it('verifies tooltip labels announced via aria-describedby', () => {
    document.body.innerHTML = `
      <svg>
        <g role="group" aria-describedby="d1" id="tool">
          <desc id="d1">Tooltip description for screen readers</desc>
        </g>
      </svg>
    `;

    const group = screen.getByRole('group');
    const descId = group.getAttribute('aria-describedby');
    expect(descId).toBe('d1');

    const desc = document.getElementById(String(descId));
    expect(desc?.textContent).toBe('Tooltip description for screen readers');
  });

  it('tests keyboard tab ordering across focusable SVG nodes', async () => {
    document.body.innerHTML = `
      <button id="b1">before</button>
      <svg>
        <g role="button" tabIndex="0" id="s1"></g>
        <g role="button" tabIndex="0" id="s2"></g>
      </svg>
      <button id="b2">after</button>
    `;

    const user = userEvent.setup();
    const b1 = document.getElementById('b1') as HTMLElement;
    const s1 = document.getElementById('s1') as HTMLElement;
    const s2 = document.getElementById('s2') as HTMLElement;
    const b2 = document.getElementById('b2') as HTMLElement;

    // initial focus on body
    await user.tab();
    expect(document.activeElement).toBe(b1);

    await user.tab();
    expect(document.activeElement).toBe(s1);

    await user.tab();
    expect(document.activeElement).toBe(s2);

    await user.tab();
    expect(document.activeElement).toBe(b2);
  });

  it('confirms heading order is logical after sanitization injection', () => {
    const cleaned = sanitizeFont('Open Sans');
    document.body.innerHTML = `
      <h1>Main title</h1>
      <h2>${String(cleaned)}</h2>
    `;

    const headings = Array.from(document.querySelectorAll('h1, h2')) as HTMLElement[];
    expect(headings[0].tagName).toBe('H1');
    expect(headings[1].tagName).toBe('H2');
    expect(headings[1].textContent).toBe(String(cleaned));
  });
});
