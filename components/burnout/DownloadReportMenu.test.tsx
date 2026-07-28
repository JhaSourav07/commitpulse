import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DownloadReportMenu from './DownloadReportMenu';
import type { BurnoutReport } from '@/services/github/burnout-analyzer';

vi.mock('@/utils/clipboard', () => ({
  copyToClipboard: vi.fn().mockResolvedValue(undefined),
}));

const mockReport: BurnoutReport = {
  repoName: 'facebook/react',
  totalCommits: 1500,
  totalContributors: 45,
  busFactor: 2,
  dependencyRisk: 'Medium',
  sustainabilityScore: 78,
  contributors: [
    {
      username: 'dan',
      avatarUrl: 'https://github.com/dan.png',
      totalCommits: 600,
      commitShare: 40,
      burnoutScore: 75,
      riskLevel: 'High',
      activeWeeks: 10,
      highIntensityWeeks: 4,
      consecutiveHighWeeks: 2,
      restWeeks: 2,
      recentTrend: [10, 15, 20],
      recentAdditionsTrend: [100, 200],
    },
    {
      username: 'sophie',
      avatarUrl: 'https://github.com/sophie.png',
      totalCommits: 400,
      commitShare: 26.6,
      burnoutScore: 50,
      riskLevel: 'Medium',
      activeWeeks: 8,
      highIntensityWeeks: 2,
      consecutiveHighWeeks: 1,
      restWeeks: 4,
      recentTrend: [5, 10, 8],
      recentAdditionsTrend: [50, 100],
    },
  ],
  inactivityAlerts: [
    {
      username: 'gaearon',
      avatarUrl: 'https://github.com/gaearon.png',
      previousAvgWeeklyCommits: 8,
      weeksSilent: 4,
      severity: 'High',
    },
  ],
  recommendations: ['[AI Recommendation] Onboard more maintainers to lower bus factor risk.'],
};

describe('DownloadReportMenu Export & Download Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Export Report button', () => {
    render(<DownloadReportMenu report={mockReport} />);
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
  });

  it('opens dropdown menu with all required export choices when clicked', () => {
    render(<DownloadReportMenu report={mockReport} />);
    fireEvent.click(screen.getByRole('button', { name: /export/i }));

    expect(screen.getByText('Download as JSON')).toBeInTheDocument();
    expect(screen.getByText('Export as Markdown')).toBeInTheDocument();
    expect(screen.getByText('Copy Share Link')).toBeInTheDocument();
    expect(screen.getByText('Copy Markdown Summary')).toBeInTheDocument();
    expect(screen.getByText('Download as PDF')).toBeInTheDocument();
  });

  it('triggers JSON download when "Download as JSON" is clicked', () => {
    render(<DownloadReportMenu report={mockReport} />);
    fireEvent.click(screen.getByRole('button', { name: /export/i }));

    const createObjectURLMock = vi.fn().mockReturnValue('blob:test');
    const revokeObjectURLMock = vi.fn();
    vi.stubGlobal('URL', {
      createObjectURL: createObjectURLMock,
      revokeObjectURL: revokeObjectURLMock,
    });

    const anchorClickMock = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    fireEvent.click(screen.getByText('Download as JSON'));

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(anchorClickMock).toHaveBeenCalled();
    expect(screen.getByText(/JSON report downloaded!/i)).toBeInTheDocument();
  });

  it('triggers Markdown download when "Export as Markdown" is clicked', () => {
    render(<DownloadReportMenu report={mockReport} />);
    fireEvent.click(screen.getByRole('button', { name: /export/i }));

    const createObjectURLMock = vi.fn().mockReturnValue('blob:test');
    const revokeObjectURLMock = vi.fn();
    vi.stubGlobal('URL', {
      createObjectURL: createObjectURLMock,
      revokeObjectURL: revokeObjectURLMock,
    });

    const anchorClickMock = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    fireEvent.click(screen.getByText('Export as Markdown'));

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(anchorClickMock).toHaveBeenCalled();
    expect(screen.getByText(/Markdown report downloaded!/i)).toBeInTheDocument();
  });

  it('copies share link and displays toast notification when "Copy Share Link" is clicked', async () => {
    const { copyToClipboard } = await import('@/utils/clipboard');
    render(<DownloadReportMenu report={mockReport} />);
    fireEvent.click(screen.getByRole('button', { name: /export/i }));

    fireEvent.click(screen.getByText('Copy Share Link'));

    await waitFor(() => {
      expect(copyToClipboard).toHaveBeenCalledWith(
        expect.stringContaining('/burnout-analyzer?owner=facebook&repo=react')
      );
    });

    expect(screen.getByText(/Share link copied to clipboard!/i)).toBeInTheDocument();
  });

  it('copies summary and displays toast when "Copy Markdown Summary" is clicked', async () => {
    const { copyToClipboard } = await import('@/utils/clipboard');
    render(<DownloadReportMenu report={mockReport} />);
    fireEvent.click(screen.getByRole('button', { name: /export/i }));

    fireEvent.click(screen.getByText('Copy Markdown Summary'));

    await waitFor(() => {
      expect(copyToClipboard).toHaveBeenCalledWith(
        expect.stringContaining('Team Health Report: facebook/react')
      );
    });

    expect(screen.getByText(/Markdown report copied to clipboard!/i)).toBeInTheDocument();
  });
});
