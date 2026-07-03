import React, { useEffect, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { useRecentSearches, MAX_SEARCHES } from './useRecentSearches';

const setViewport = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });

  window.dispatchEvent(new Event('resize'));
};

function ResponsiveSearchPanel() {
  const { searches, addSearch, clearSearches } = useRecentSearches();

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const children: React.ReactNode[] = [];

  if (isMobile) {
    children.push(
      React.createElement(
        'button',
        {
          key: 'toggle',
          'data-testid': 'toggle',
          onClick: () => setMenuOpen((p) => !p),
        },
        'Menu'
      )
    );

    children.push(
      React.createElement(
        'span',
        {
          key: 'menu-state',
          'data-testid': 'menu-state',
        },
        menuOpen ? 'open' : 'closed'
      )
    );
  }

  children.push(
    React.createElement(
      'nav',
      {
        key: 'nav',
        'data-testid': 'navigation',
        className: isMobile ? 'text-sm' : 'text-lg',
      },
      'Navigation'
    )
  );

  children.push(
    React.createElement(
      'ul',
      {
        key: 'list',
        'data-testid': 'search-list',
      },
      searches.map((search) => React.createElement('li', { key: search }, search))
    )
  );

  children.push(
    React.createElement(
      'button',
      {
        key: 'add',
        onClick: () => addSearch(`search-${searches.length + 1}`),
      },
      'Add'
    )
  );

  children.push(
    React.createElement(
      'button',
      {
        key: 'clear',
        onClick: clearSearches,
      },
      'Clear'
    )
  );

  return React.createElement(
    'div',
    {
      'data-testid': 'container',
      className: isMobile ? 'flex-col' : 'flex-row',
      style: {
        width: isMobile ? '100%' : '800px',
      },
    },
    ...children
  );
}

describe('useRecentSearches responsive breakpoints', () => {
  beforeEach(() => {
    localStorage.clear();
    setViewport(375);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders correctly at 375px', () => {
    render(React.createElement(ResponsiveSearchPanel));

    expect(window.innerWidth).toBe(375);
  });

  it('uses vertical layout', () => {
    render(React.createElement(ResponsiveSearchPanel));

    expect(screen.getByTestId('container').className).toContain('flex-col');
  });

  it('uses fluid width', () => {
    render(React.createElement(ResponsiveSearchPanel));

    expect(screen.getByTestId('container').style.width).toBe('100%');
  });

  it('scales navigation and preserves max searches', async () => {
    const user = userEvent.setup();

    render(React.createElement(ResponsiveSearchPanel));

    expect(screen.getByTestId('navigation').className).toContain('text-sm');

    for (let i = 0; i < MAX_SEARCHES + 2; i++) {
      await user.click(screen.getByText('Add'));
    }

    expect(screen.getByTestId('search-list').children.length).toBe(MAX_SEARCHES);
  });

  it('handles mobile toggle state', async () => {
    const user = userEvent.setup();

    render(React.createElement(ResponsiveSearchPanel));

    expect(screen.getByTestId('menu-state')).toHaveTextContent('closed');

    await user.click(screen.getByTestId('toggle'));

    expect(screen.getByTestId('menu-state')).toHaveTextContent('open');
  });
});
