import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResumeUpload from './ResumeUpload';
import type { ReactNode, HTMLAttributes } from 'react';
import '@testing-library/jest-dom';
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
describe('ResumeUpload - Massive Scaling', () => {
  const onParsed = vi.fn();
  const onError = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('handles PDF files just below the 5MB limit', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        fileName: 'large.pdf',
        data: { name: 'John Doe' },
      }),
    }) as typeof fetch;

    render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    const input = screen.getByLabelText('Upload resume');

    const file = new File([new Uint8Array(4 * 1024 * 1024)], 'large.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(input, {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(onParsed).toHaveBeenCalled();
    });
  });

  it('handles DOCX files just below the 5MB limit', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        fileName: 'large.docx',
        data: { name: 'John Doe' },
      }),
    }) as typeof fetch;
    render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    const input = screen.getByLabelText('Upload resume');

    const file = new File([new Uint8Array(4 * 1024 * 1024)], 'large.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    fireEvent.change(input, {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(onParsed).toHaveBeenCalled();
    });
  });

  it('handles large parsed resume payloads', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        fileName: 'resume.pdf',
        data: {
          name: 'John Doe',
          skills: Array(1000).fill('Python'),
        },
      }),
    }) as typeof fetch;
    render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    const input = screen.getByLabelText('Upload resume');

    fireEvent.change(input, {
      target: {
        files: [
          new File(['pdf'], 'resume.pdf', {
            type: 'application/pdf',
          }),
        ],
      },
    });

    await waitFor(() => {
      expect(onParsed).toHaveBeenCalled();
    });
  });

  it('handles extremely long filenames', async () => {
    const longName = `${'A'.repeat(200)}.pdf`;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        fileName: longName,
        data: { name: 'John Doe' },
      }),
    }) as typeof fetch;

    render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    const input = screen.getByLabelText('Upload resume');
    fireEvent.change(input, {
      target: {
        files: [
          new File(['pdf'], longName, {
            type: 'application/pdf',
          }),
        ],
      },
    });

    await waitFor(() => {
      expect(onParsed).toHaveBeenCalled();
    });
  });

  it('handles multiple rapid uploads', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        fileName: 'resume.pdf',
        data: { name: 'John Doe' },
      }),
    }) as typeof fetch;

    render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    const input = screen.getByLabelText('Upload resume');

    for (let i = 0; i < 3; i++) {
      fireEvent.change(input, {
        target: {
          files: [
            new File(['pdf'], `resume${i}.pdf`, {
              type: 'application/pdf',
            }),
          ],
        },
      });
    }
    await waitFor(() => {
      expect(onParsed).toHaveBeenCalled();
    });
  });
});
