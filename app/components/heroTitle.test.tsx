import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { renderHeroTitle } from './heroTitle';

describe('renderHeroTitle', () => {
  it('renders the English default with the braced word in the accent span and a line break', () => {
    const { container } = render(<h1>{renderHeroTitle('Elevate Your\n{Contribution} Story.')}</h1>);

    expect(container.textContent).toBe('Elevate YourContribution Story.');
    expect(container.querySelector('br')).not.toBeNull();
    const highlight = container.querySelector('.contribution-text');
    expect(highlight?.textContent).toBe('Contribution');
  });

  it('highlights the braced word wherever it sits in a translated title (mid-line)', () => {
    // Japanese: the highlight is in the middle of the first line.
    const { container } = render(
      <h1>{renderHeroTitle('あなたの{開発の軌跡}を\n立体的に表現する。')}</h1>
    );

    expect(container.textContent).toBe('あなたの開発の軌跡を立体的に表現する。');
    expect(container.querySelector('.contribution-text')?.textContent).toBe('開発の軌跡');
    expect(container.querySelector('br')).not.toBeNull();
  });

  it('highlights a leading braced word (start of the title)', () => {
    // Korean: the highlight is the very first token.
    const { container } = render(<h1>{renderHeroTitle('{기여} 내역을\n더 돋보이게.')}</h1>);

    expect(container.textContent).toBe('기여 내역을더 돋보이게.');
    expect(container.querySelector('.contribution-text')?.textContent).toBe('기여');
  });

  it('does not leave brace markers in the rendered output', () => {
    const { container } = render(
      <h1>{renderHeroTitle('Eleva tu historia\nde {contribuciones}.')}</h1>
    );

    expect(container.textContent).not.toContain('{');
    expect(container.textContent).not.toContain('}');
    expect(container.querySelector('.contribution-text')?.textContent).toBe('contribuciones');
  });
});
