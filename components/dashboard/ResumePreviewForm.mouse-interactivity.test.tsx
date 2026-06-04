import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import ResumePreviewForm from './ResumePreviewForm';
import '@testing-library/jest-dom';

const toastMocks = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: toastMocks.error,
    success: toastMocks.success,
  },
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

const parsed = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '1234567890',
  skills: ['React'],
  education: [],
  experience: [],
};

describe('ResumePreviewForm - Mouse Interactivity & Touch Propagation', () => {
  const onBack = vi.fn();
  const onComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps hover affordances intact while add actions still update the skill list', () => {
    render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={parsed}
        fileName="resume.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    const addButtons = screen.getAllByRole('button', { name: /^Add$/i });
    const addSkillButton = addButtons[0];

    fireEvent.mouseEnter(addSkillButton);
    fireEvent.mouseLeave(addSkillButton);
    fireEvent.click(addSkillButton);

    expect(addSkillButton).toHaveClass('hover:text-emerald-500');
    expect(screen.getAllByRole('textbox')).toHaveLength(4);
  });

  it('exposes hover tooltips on remove controls and removes nested sections on click', () => {
    render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={parsed}
        fileName="resume.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    const addButtons = screen.getAllByRole('button', { name: /^Add$/i });
    fireEvent.click(addButtons[1]);
    fireEvent.click(addButtons[2]);

    const removeSkillButton = screen.getByRole('button', {
      name: /^Remove skill \d+$/i,
    });
    const removeEducationButton = screen.getByRole('button', {
      name: /Remove education entry 1/i,
    });
    const removeExperienceButton = screen.getByRole('button', {
      name: /Remove experience entry 1/i,
    });

    expect(removeSkillButton).toHaveAttribute('title', 'Remove skill 1');
    expect(removeEducationButton).toHaveAttribute('title', 'Remove education entry 1');
    expect(removeExperienceButton).toHaveAttribute('title', 'Remove experience entry 1');

    fireEvent.mouseEnter(removeSkillButton);
    fireEvent.click(removeSkillButton);
    fireEvent.click(removeEducationButton);
    fireEvent.click(removeExperienceButton);

    expect(screen.getAllByRole('textbox')).toHaveLength(2);
    expect(screen.queryByPlaceholderText('Institution')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Company')).not.toBeInTheDocument();
  });

  it('propagates touch events from interactive controls up to parent listeners', () => {
    const parentTouchStart = vi.fn();
    const parentTouchEnd = vi.fn();

    render(
      <div onTouchStart={parentTouchStart} onTouchEnd={parentTouchEnd}>
        <ResumePreviewForm
          githubUsername="john"
          parsed={parsed}
          fileName="resume.pdf"
          onBack={onBack}
          onComplete={onComplete}
        />
      </div>
    );

    const addExperienceButton = screen.getAllByRole('button', { name: /^Add$/i })[2];

    fireEvent.touchStart(addExperienceButton, {
      touches: [{ identifier: 1, clientX: 24, clientY: 64 }],
    });
    fireEvent.touchEnd(addExperienceButton, {
      changedTouches: [{ identifier: 1, clientX: 24, clientY: 64 }],
    });
    fireEvent.click(addExperienceButton);

    expect(parentTouchStart).toHaveBeenCalled();
    expect(parentTouchEnd).toHaveBeenCalled();
    expect(screen.getByPlaceholderText('Company')).toBeInTheDocument();
  });

  it('transitions the save button into a pending state and completes after the request resolves', async () => {
    let resolveFetch:
      | ((value: { ok: boolean; json: () => Promise<{ success: boolean }> }) => void)
      | undefined;

    const pendingFetch = new Promise<{ ok: boolean; json: () => Promise<{ success: boolean }> }>(
      (resolve) => {
        resolveFetch = resolve;
      }
    );

    vi.stubGlobal('fetch', vi.fn().mockReturnValue(pendingFetch));

    render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={parsed}
        fileName="resume.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    const saveButton = screen.getByRole('button', { name: /Save Profile/i });
    fireEvent.click(saveButton);

    expect(screen.getByRole('button', { name: /Saving.../i })).toBeDisabled();

    resolveFetch?.({
      ok: true,
      json: async () => ({ success: true }),
    });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    expect(toastMocks.success).toHaveBeenCalledWith('Profile saved successfully!');
  });
});
