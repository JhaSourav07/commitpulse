import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BoxIcon, CheckIcon, CloseIcon, CopyIcon, ZapIcon } from './Icons';

type IconProps = React.SVGProps<SVGSVGElement>;

vi.mock('lucide-react', () => ({
  Copy: (props: IconProps) => <svg data-testid="copy-icon" {...props} />,
  Zap: (props: IconProps) => <svg data-testid="zap-icon" {...props} />,
  Box: (props: IconProps) => <svg data-testid="box-icon" {...props} />,
  Check: (props: IconProps) => <svg data-testid="check-icon" {...props} />,
  X: (props: IconProps) => <svg data-testid="close-icon" {...props} />,
}));

describe('Icons empty fallback behavior', () => {
  it('renders CopyIcon without crashing', () => {
    const { getByTestId } = render(<CopyIcon />);
    expect(getByTestId('copy-icon')).toBeDefined();
  });

  it('renders ZapIcon without crashing', () => {
    const { getByTestId } = render(<ZapIcon />);
    expect(getByTestId('zap-icon')).toBeDefined();
  });

  it('renders BoxIcon without crashing', () => {
    const { getByTestId } = render(<BoxIcon />);
    expect(getByTestId('box-icon')).toBeDefined();
  });

  it('renders CheckIcon with fallback styling', () => {
    const { getByTestId } = render(<CheckIcon />);
    const icon = getByTestId('check-icon');

    expect(icon.getAttribute('stroke')).toBe('#10b981');
  });

  it('renders CloseIcon without runtime errors', () => {
    const { getByTestId } = render(<CloseIcon />);
    expect(getByTestId('close-icon')).toBeDefined();
  });
});
