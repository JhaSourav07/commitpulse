import type React from 'react';
import { render, screen } from '@testing-library/react';
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

describe('Icons massive scaling behavior', () => {
  it('renders 500 CopyIcon instances without crashing', () => {
    render(
      <>
        {Array.from({ length: 500 }, (_, index) => (
          <CopyIcon key={index} />
        ))}
      </>
    );

    expect(screen.getAllByTestId('copy-icon')).toHaveLength(500);
  });

  it('renders 500 ZapIcon instances without crashing', () => {
    render(
      <>
        {Array.from({ length: 500 }, (_, index) => (
          <ZapIcon key={index} />
        ))}
      </>
    );

    expect(screen.getAllByTestId('zap-icon')).toHaveLength(500);
  });

  it('renders mixed icon sets at high volume', () => {
    render(
      <>
        {Array.from({ length: 100 }, (_, index) => (
          <div key={index}>
            <CopyIcon />
            <ZapIcon />
            <BoxIcon />
            <CheckIcon />
            <CloseIcon />
          </div>
        ))}
      </>
    );

    expect(screen.getAllByTestId('copy-icon')).toHaveLength(100);
    expect(screen.getAllByTestId('zap-icon')).toHaveLength(100);
    expect(screen.getAllByTestId('box-icon')).toHaveLength(100);
    expect(screen.getAllByTestId('check-icon')).toHaveLength(100);
    expect(screen.getAllByTestId('close-icon')).toHaveLength(100);
  });

  it('preserves icon dimension attributes across many rendered icons', () => {
    render(
      <>
        {Array.from({ length: 100 }, (_, index) => (
          <CopyIcon key={index} />
        ))}
      </>
    );

    expect(
      screen.getAllByTestId('copy-icon').every((icon) => icon.getAttribute('width') === '20')
    ).toBe(true);
  });

  it('preserves CheckIcon stroke styling across high-volume renders', () => {
    render(
      <>
        {Array.from({ length: 100 }, (_, index) => (
          <CheckIcon key={index} />
        ))}
      </>
    );

    expect(
      screen.getAllByTestId('check-icon').every((icon) => icon.getAttribute('stroke') === '#10b981')
    ).toBe(true);
  });
});
