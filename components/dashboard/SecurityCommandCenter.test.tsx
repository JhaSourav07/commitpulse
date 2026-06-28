import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SecurityCommandCenter } from './SecurityCommandCenter';

describe('SecurityCommandCenter', () => {
  it('renders correctly', () => {
    render(<SecurityCommandCenter />);
    expect(screen.getByText('Repository Security Command Center')).toBeInTheDocument();
  });
});
