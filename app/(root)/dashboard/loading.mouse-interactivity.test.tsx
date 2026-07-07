import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import DashboardLoading from './loading';

describe('DashboardLoading Mouse Interactivity', () => {
  it('renders without throwing during repeated mounts', () => {
    expect(() => render(<DashboardLoading />)).not.toThrow();
  });

  it('renders no interactive buttons', () => {
    const { container } = render(<DashboardLoading />);

    expect(container.querySelectorAll('button')).toHaveLength(0);
  });

  it('renders no form inputs', () => {
    const { container } = render(<DashboardLoading />);

    expect(container.querySelectorAll('input')).toHaveLength(0);
  });

  it('renders no links that could receive pointer interactions', () => {
    const { container } = render(<DashboardLoading />);

    expect(container.querySelectorAll('a')).toHaveLength(0);
  });

  it('renders an empty container after mount', () => {
    const { container } = render(<DashboardLoading />);

    expect(container.childElementCount).toBe(0);
  });
});
