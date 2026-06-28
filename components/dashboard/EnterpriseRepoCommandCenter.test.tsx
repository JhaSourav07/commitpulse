import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EnterpriseRepoCommandCenter } from './EnterpriseRepoCommandCenter';

describe('EnterpriseRepoCommandCenter', () => {
  it('renders correctly', () => {
    render(<EnterpriseRepoCommandCenter />);
    expect(screen.getByText('Enterprise Repository Command Center')).toBeInTheDocument();
  });
});
