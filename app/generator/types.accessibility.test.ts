import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { Technology, Social, GeneratorState } from './types';

// Mock framer-motion directly to pure HTML elements with explicit display configurations
vi.mock('framer-motion', () => ({
  motion: {
    div: Object.assign(
      (props: React.ComponentPropsWithoutRef<'div'>) => React.createElement('div', props),
      { displayName: 'MotionDiv' }
    ),
    button: Object.assign(
      (props: React.ComponentPropsWithoutRef<'button'>) => React.createElement('button', props),
      { displayName: 'MotionButton' }
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

interface GeneratorTypesTestProps {
  state: GeneratorState;
  technologies: Technology[];
  socials: Social[];
}

const GeneratorTypesTestComponent: React.FC<GeneratorTypesTestProps> = ({
  state,
  technologies,
  socials,
}) => {
  const [hoveredInfo, setHoveredInfo] = React.useState<string | null>(null);

  return React.createElement(
    'main',
    { role: 'main', 'aria-labelledby': 'main-title', className: 'p-6' },
    React.createElement(
      'h1',
      { id: 'main-title', className: 'text-2xl font-bold' },
      'Profile Generator Settings'
    ),

    React.createElement(
      'section',
      { 'aria-labelledby': 'section-tech', className: 'mt-4' },
      React.createElement(
        'h2',
        { id: 'section-tech', className: 'text-xl' },
        'Technologies Selection'
      ),
      React.createElement(
        'p',
        { id: 'tech-desc', className: 'text-sm text-gray-500' },
        'Select tags.'
      ),
      React.createElement(
        'div',
        {
          role: 'group',
          'aria-labelledby': 'section-tech',
          'aria-describedby': 'tech-desc',
          className: 'flex gap-2',
        },
        technologies.map((tech) =>
          React.createElement(
            'button',
            {
              key: tech.id,
              role: 'button',
              'aria-pressed': state.selectedTechs.includes(tech.id),
              'aria-label': `Select ${tech.name} category ${tech.category}`,
              onMouseEnter: () => setHoveredInfo(`Tech: ${tech.name}`),
              onMouseLeave: () => setHoveredInfo(null),
              className: 'focus:outline-none focus:ring-2 focus:ring-blue-500',
              tabIndex: 0,
            },
            tech.name
          )
        )
      )
    ),

    React.createElement(
      'section',
      { 'aria-labelledby': 'section-socials', className: 'mt-6' },
      React.createElement('h2', { id: 'section-socials', className: 'text-xl' }, 'Social Channels'),
      React.createElement(
        'div',
        { className: 'flex flex-col gap-4' },
        socials.map((social) => {
          const isSelected = state.selectedSocials.includes(social.id);
          return React.createElement(
            'div',
            { key: social.id, className: 'border p-3' },
            React.createElement(
              'h3',
              { id: `lbl-${social.id}`, className: 'text-lg' },
              social.name
            ),
            React.createElement(
              'button',
              {
                role: 'button',
                'aria-pressed': isSelected,
                'aria-labelledby': `lbl-${social.id}`,
                className: 'focus:outline-none focus:ring-2 focus:ring-blue-500',
                tabIndex: 0,
              },
              isSelected ? 'Enabled' : 'Disabled'
            ),
            isSelected &&
              React.createElement('input', {
                role: 'textbox',
                type: 'text',
                'aria-describedby': `desc-${social.id}`,
                className: 'focus:outline-none focus:ring-2 focus:ring-blue-500',
                readOnly: true,
              }),
            isSelected &&
              React.createElement(
                'span',
                { id: `desc-${social.id}`, className: 'text-xs' },
                `URL starts with ${social.baseUrl}`
              )
          );
        })
      )
    ),
    React.createElement(
      'div',
      { id: 'announcer-panel', role: 'status', 'aria-live': 'polite', className: 'sr-only' },
      hoveredInfo || ''
    )
  );
};

const mockTechnologies: Technology[] = [
  { id: 'ts', name: 'TypeScript', category: 'Languages', iconUrl: '', type: 'devicon' },
  { id: 'react', name: 'React', category: 'Frontend', iconUrl: '', type: 'simpleicon' },
];

const mockSocials: Social[] = [
  {
    id: 'github',
    name: 'GitHub',
    category: 'Developer',
    iconUrl: '',
    type: 'simpleicon',
    baseUrl: 'https://github.com/',
    placeholder: 'username',
  },
];

const mockInitialState: GeneratorState = {
  name: 'John Doe',
  description: 'Dev',
  selectedTechs: ['ts'],
  selectedSocials: ['github'],
  socialLinks: { github: 'https://github.com/johndoe' },
  githubUsername: 'johndoe',
  showCommitPulse: true,
  commitPulseAccent: 'emerald',
  showSnakeGraph: false,
  showPacmanGraph: false,
  graphPlacement: 'bottom',
};

describe('GeneratorTypes Accessibility & Screen Reader Compliance (Variation 4)', () => {
  it('Case 1: Verify correct ARIA labels, roles, and descriptions mapping configurations', () => {
    const { container } = render(
      React.createElement(GeneratorTypesTestComponent, {
        state: mockInitialState,
        technologies: mockTechnologies,
        socials: mockSocials,
      })
    );

    expect(screen.getByRole('main')).toHaveAttribute('aria-labelledby', 'main-title');
    expect(
      screen.getByRole('button', { name: 'Select TypeScript category Languages' })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'desc-github');
    expect(container.querySelector('#desc-github')).toHaveTextContent('https://github.com/');
  });

  it('Case 2: Assert interactive keyboard element states maintain explicit focus rules', () => {
    render(
      React.createElement(GeneratorTypesTestComponent, {
        state: mockInitialState,
        technologies: mockTechnologies,
        socials: mockSocials,
      })
    );

    const elements = [screen.getByRole('textbox'), screen.getAllByRole('button')[0]];
    elements.forEach((el) => {
      act(() => el.focus());
      expect(document.activeElement).toBe(el);
      expect(el.className).toContain('focus:ring-2');
    });
  });

  it('Case 3: Test that hover elements update the screen reader accessible announcer live panel', () => {
    const { container } = render(
      React.createElement(GeneratorTypesTestComponent, {
        state: mockInitialState,
        technologies: mockTechnologies,
        socials: mockSocials,
      })
    );
    const announcer = container.querySelector('#announcer-panel')!;

    expect(announcer).toHaveAttribute('role', 'status');
    expect(announcer).toHaveAttribute('aria-live', 'polite');

    act(() => {
      fireEvent.mouseEnter(screen.getAllByRole('button')[0]);
    });
    expect(announcer).toHaveTextContent('Tech: TypeScript');
  });

  it('Case 4: Verify sequential keyboard control path navigation matches logical HTML DOM order', () => {
    const { container } = render(
      React.createElement(GeneratorTypesTestComponent, {
        state: mockInitialState,
        technologies: mockTechnologies,
        socials: mockSocials,
      })
    );
    const focusable = Array.from(container.querySelectorAll('button, input')) as HTMLElement[];

    focusable.forEach((el) =>
      expect(Number(el.getAttribute('tabindex') || 0)).toBeGreaterThanOrEqual(0)
    );
    expect(focusable.indexOf(screen.getAllByRole('button')[0])).toBeLessThan(
      focusable.indexOf(screen.getAllByRole('button')[1])
    );
    expect(focusable.indexOf(screen.getAllByRole('button')[2])).toBeLessThan(
      focusable.indexOf(screen.getByRole('textbox'))
    );
  });

  it('Case 5: Confirm standard headings exist in a correct, logical structural hierarchy sequence', () => {
    const { container } = render(
      React.createElement(GeneratorTypesTestComponent, {
        state: mockInitialState,
        technologies: mockTechnologies,
        socials: mockSocials,
      })
    );
    const headingLevels = Array.from(container.querySelectorAll('h1, h2, h3')).map((h) =>
      parseInt(h.tagName.substring(1), 10)
    );

    for (let i = 0; i < headingLevels.length - 1; i++) {
      expect(headingLevels[i + 1] - headingLevels[i]).toBeLessThanOrEqual(1);
    }
  });
});
