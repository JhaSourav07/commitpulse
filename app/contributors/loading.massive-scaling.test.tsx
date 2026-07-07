import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import Loading from './loading';

afterEach(() => {
  cleanup();
});

describe('ContributorsLoading massive scaling behavior', () => {
  it('renders a large number of loading components without failure', () => {
    expect(() => {
      for (let i = 0; i < 250; i++) {
        render(<Loading />);
        cleanup();
      }
    }).not.toThrow();
  });

  it('does not duplicate loading text across repeated high-volume renders', () => {
    render(
      <>
        {Array.from({ length: 100 }, (_, index) => (
          <Loading key={index} />
        ))}
      </>
    );

    expect(screen.queryAllByText('Loading the collective...')).toHaveLength(0);
  });

  it('does not duplicate contributor fetch messaging at scale', () => {
    render(
      <>
        {Array.from({ length: 100 }, (_, index) => (
          <Loading key={index} />
        ))}
      </>
    );

    expect(screen.queryAllByText('Fetching contributor data from GitHub')).toHaveLength(0);
  });

  it('renders spinner elements consistently under heavy load', () => {
    const { container } = render(
      <>
        {Array.from({ length: 100 }, (_, index) => (
          <Loading key={index} />
        ))}
      </>
    );

    expect(container.querySelectorAll('.animate-spin')).toHaveLength(100);
  });

  it('maintains status regions across large render batches', () => {
    render(
      <>
        {Array.from({ length: 100 }, (_, index) => (
          <Loading key={index} />
        ))}
      </>
    );

    expect(screen.getAllByRole('status')).toHaveLength(100);
  });
});
