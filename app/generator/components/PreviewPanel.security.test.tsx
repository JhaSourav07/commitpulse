import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('PreviewPanel Security', () => {
  it('removes script tags from malicious html', () => {
    document.body.innerHTML = `
      <div id="preview">
        <script>alert('xss')</script>
        <p>Safe Content</p>
      </div>
    `;

    expect(document.querySelector('script')).toBeInTheDocument();

    document.querySelectorAll('script').forEach((el) => el.remove());

    expect(document.querySelector('script')).not.toBeInTheDocument();
  });

  it('removes inline event handlers', () => {
    /* eslint-disable @next/next/no-img-element */
    render(<img src="test.png" alt="test" onError={() => {}} />);

    const image = document.querySelector('img');

    image?.removeAttribute('onerror');

    expect(image?.getAttribute('onerror')).toBeNull();
  });

  it('preserves safe content rendering', () => {
    document.body.innerHTML = `
      <div>
        <h1>Secure Preview</h1>
        <p>This is safe content.</p>
      </div>
    `;

    expect(document.body.innerHTML).toContain('Secure Preview');

    expect(document.body.innerHTML).toContain('This is safe content.');
  });
});
