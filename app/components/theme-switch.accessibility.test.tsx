import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggleButton } from './theme-switch';

describe('ThemeSwitch Component - Accessibility Standards', () => {
  it('1. correctly uses accessible label coordinates (aria-label/role)', () => {
    // Testing the accessible label and describedby coordinate mappings
    render(<ThemeToggleButton aria-describedby="theme-desc" />);
    const button = screen.getByRole('button', { name: /toggle theme/i });

    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Toggle theme');
    expect(button).toHaveAttribute('aria-describedby', 'theme-desc');
  });

  it('2. maintains visible outline and key focus behaviors', async () => {
    const user = userEvent.setup();
    render(<ThemeToggleButton />);
    const button = screen.getByRole('button', { name: /toggle theme/i });

    // Elements that accept key focus must natively accept tab sequences
    expect(button).not.toHaveFocus();
    await user.tab();
    expect(button).toHaveFocus();
  });

  it('3. ensures tooltip labels are announced with correct descriptions', () => {
    // Testing the component correctly applies standard HTML title attributes for tooltips
    render(<ThemeToggleButton title="Switch between dark and light mode" />);

    const button = screen.getByTitle(/switch between dark and light mode/i);
    expect(button).toBeInTheDocument();
    // Ensure the primary screen reader aria-label is not accidentally overwritten
    expect(button).toHaveAttribute('aria-label', 'Toggle theme');
  });

  it('4. ensures normal keyboard control path and tab ordering', async () => {
    const user = userEvent.setup();

    // Testing normal document flow keyboard tab sequence ordering
    render(
      <div>
        <button>First Item</button>
        <ThemeToggleButton />
        <button>Last Item</button>
      </div>
    );

    await user.tab();
    expect(screen.getByText('First Item')).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: /toggle theme/i })).toHaveFocus();

    await user.tab();
    expect(screen.getByText('Last Item')).toHaveFocus();
  });

  it('5. confirms component integrates safely with standard logical hierarchical headings', () => {
    // Validating that the button exists safely within semantic sectioning roots (h1/h2)
    render(
      <main>
        <h1>Site Settings</h1>
        <section>
          <h2>Appearance</h2>
          <ThemeToggleButton />
        </section>
      </main>
    );

    const heading1 = screen.getByRole('heading', { level: 1 });
    const heading2 = screen.getByRole('heading', { level: 2 });
    const button = screen.getByRole('button', { name: /toggle theme/i });

    expect(heading1).toHaveTextContent('Site Settings');
    expect(heading2).toHaveTextContent('Appearance');
    expect(button).toBeInTheDocument();
  });
});
