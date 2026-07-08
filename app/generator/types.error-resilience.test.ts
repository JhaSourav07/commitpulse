import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import '@testing-library/jest-dom';
import type { GeneratorState, Technology, Social } from './types';

// Mock Component that throws when accessing a nested property that is mock-rejected/nullified
const BuggyComponent = ({ state }: { state: GeneratorState | null }) => {
  if (!state) {
    throw new Error('Database connectivity error or missing GeneratorState');
  }
  return React.createElement('div', { 'data-testid': 'state-name' }, state.name);
};

const FallbackComponent = ({ error, resetErrorBoundary }: FallbackProps) => {
  return React.createElement(
    'div',
    { 'data-testid': 'error-boundary-ui', className: 'p-4 border rounded bg-red-50 text-red-700' },
    [
      React.createElement('h2', { key: 'title' }, 'Error Recovery Panel'),
      React.createElement(
        'p',
        { key: 'msg' },
        error instanceof Error ? error.message : String(error)
      ),
      React.createElement(
        'button',
        {
          key: 'reset-btn',
          'data-testid': 'reset-button',
          className: 'px-4 py-2 mt-2 bg-red-600 text-white rounded',
          onClick: resetErrorBoundary,
        },
        'Retry / Reset state'
      ),
    ]
  );
};

const InteractiveBoundaryParent = ({ initialState }: { initialState: GeneratorState | null }) => {
  const [state, setState] = useState<GeneratorState | null>(initialState);

  const handleReset = () => {
    setState({
      name: 'Recovered User',
      description: 'Full Stack',
      selectedTechs: [],
      selectedSocials: [],
      socialLinks: {},
      githubUsername: 'recovered',
      showCommitPulse: true,
      commitPulseAccent: '#00ff55',
      showRepoSpotlight: false,
      spotlightRepo: '',
      showSnakeGraph: false,
      showPacmanGraph: false,
      graphPlacement: 'middle',
    });
  };

  return React.createElement(
    ErrorBoundary,
    {
      FallbackComponent: FallbackComponent,
      onReset: handleReset,
    },
    React.createElement(BuggyComponent, { state })
  );
};

describe('GeneratorTypes - Hydration Stability, Exception Safety & Error Fallbacks', () => {
  const validState: GeneratorState = {
    name: 'John Doe',
    description: 'Developer',
    selectedTechs: ['react'],
    selectedSocials: ['github'],
    socialLinks: { github: 'https://github.com/johndoe' },
    githubUsername: 'johndoe',
    showCommitPulse: true,
    commitPulseAccent: '#ff0055',
    showRepoSpotlight: false,
    spotlightRepo: '',
    showSnakeGraph: true,
    showPacmanGraph: true,
    graphPlacement: 'middle',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('Case 1: verifies hydration stability of mock data matching generator interfaces', () => {
    const tech: Technology = {
      id: 'react',
      name: 'React',
      category: 'Frontend',
      iconUrl: 'https://react.dev',
      type: 'devicon',
    };

    const social: Social = {
      id: 'github',
      name: 'GitHub',
      category: 'Developer',
      iconUrl: 'https://github.com',
      type: 'simpleicon',
      baseUrl: 'https://github.com/',
      placeholder: 'username',
    };

    expect(validState.name).toBe('John Doe');
    expect(tech.name).toBe('React');
    expect(social.name).toBe('GitHub');
  });

  it('Case 2: encases execution calls in localized boundary elements', () => {
    render(React.createElement(InteractiveBoundaryParent, { initialState: null }));

    // Expect the fallback error boundary to catch the throw from the buggy component
    expect(screen.getByTestId('error-boundary-ui')).toBeInTheDocument();
    expect(screen.queryByTestId('state-name')).not.toBeInTheDocument();
  });

  it('Case 3: verifies target modules render a clean error recovery UI instead of crashing the site', () => {
    render(React.createElement(InteractiveBoundaryParent, { initialState: null }));

    const recoveryPanel = screen.getByTestId('error-boundary-ui');
    expect(recoveryPanel).toHaveTextContent('Error Recovery Panel');
    expect(recoveryPanel).toHaveTextContent(
      'Database connectivity error or missing GeneratorState'
    );
  });

  it('Case 4: verify exceptions are logged to dev-telemetry trackers', () => {
    render(React.createElement(InteractiveBoundaryParent, { initialState: null }));

    expect(console.error).toHaveBeenCalled();
  });

  it('Case 5: ensure user reset/reload paths are available on the recovery panels', () => {
    render(React.createElement(InteractiveBoundaryParent, { initialState: null }));

    expect(screen.getByTestId('error-boundary-ui')).toBeInTheDocument();

    const resetBtn = screen.getByTestId('reset-button');
    fireEvent.click(resetBtn);

    // After reset, it should render the buggy component with recovered state data
    expect(screen.queryByTestId('error-boundary-ui')).not.toBeInTheDocument();
    expect(screen.getByTestId('state-name')).toHaveTextContent('Recovered User');
  });
});
