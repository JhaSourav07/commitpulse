'use client';
import { useState, useRef, useEffect } from 'react';
import { toPng, toCanvas } from 'html-to-image';
import type { DashboardExportData } from '@/types/dashboard';

type OptionState = 'idle' | 'loading' | 'success' | 'error';

const BASE_ORIGIN =
  (typeof window !== 'undefined' ? window.location.origin : null) ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  'https://commitpulse.vercel.app';
const PROFILE_URL = (username: string) => `${BASE_ORIGIN}/dashboard/${username}`;

export function useShareActions(
  username: string,
  exportData: DashboardExportData,
  onClose: () => void
) {
  const [states, setStates] = useState<Record<string, OptionState>>({});

  const timeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const setOptionState = (key: string, state: OptionState) => {
    setStates((prev) => ({ ...prev, [key]: state }));
    if (state === 'success' || state === 'error') {
      if (timeoutsRef.current[key]) clearTimeout(timeoutsRef.current[key]);
      timeoutsRef.current[key] = setTimeout(
        () => setStates((prev) => ({ ...prev, [key]: 'idle' })),
        2500
      );
    }
  };
  useEffect(() => {
    const t = timeoutsRef.current;
    return () => {
      Object.values(t).forEach(clearTimeout);
    };
  }, []);

  const handleCopyLink = async (): Promise<boolean> => {
    setOptionState('copy', 'loading');
    try {
      await navigator.clipboard.writeText(PROFILE_URL(username));
      setOptionState('copy', 'success');
      setTimeout(() => onClose(), 800);
      return true;
    } catch {
      setOptionState('copy', 'error');
      return false;
    }
  };

  const handleTwitter = () => {
    const url = PROFILE_URL(username);
    const text = encodeURIComponent(`Check out my GitHub commit pulse on CommitPulse 🚀\n${url}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'noopener');
    onClose();
  };

  const handleLinkedIn = () => {
    const url = encodeURIComponent(PROFILE_URL(username));
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'noopener');
    onClose();
  };

  const handleReddit = () => {
    const url = encodeURIComponent(PROFILE_URL(username));
    const title = encodeURIComponent('Check out my CommitPulse dashboard 🚀');
    window.open(
      `https://www.reddit.com/submit?url=${url}&title=${title}`,
      '_blank',
      'noopener,noreferrer'
    );
    onClose();
  };

  const handleDownloadPNG = async () => {
    setOptionState('png', 'loading');
    try {
      const node =
        document.getElementById('dashboard-root') ??
        document.querySelector<HTMLElement>('[data-dashboard]') ??
        document.body;
      const isDark =
        typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
      const dataUrl = await toPng(node, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: isDark ? '#050505' : '#ffffff',
        filter: (el) => {
          if (el instanceof HTMLElement) {
            if (el.id === 'share-sheet-overlay') return false;
            if (el.id === 'generate-dashboard-btn') return false;
          }
          return true;
        },
      });
      const link = document.createElement('a');
      link.download = `${username}-commitpulse.png`;
      link.href = dataUrl;
      link.click();
      setOptionState('png', 'success');
    } catch {
      setOptionState('png', 'error');
    }
  };

  const handleDownloadWEBP = async () => {
    setOptionState('webp', 'loading');
    try {
      const node =
        document.getElementById('dashboard-root') ??
        document.querySelector<HTMLElement>('[data-dashboard]') ??
        document.body;
      const isDark =
        typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
      const canvas = await toCanvas(node, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: isDark ? '#050505' : '#ffffff',
        filter: (el) => {
          if (el instanceof HTMLElement) {
            if (el.id === 'share-sheet-overlay') return false;
            if (el.id === 'generate-dashboard-btn') return false;
          }
          return true;
        },
      });
      const dataUrl = canvas.toDataURL('image/webp');
      const link = document.createElement('a');
      link.download = `${username}-commitpulse.webp`;
      link.href = dataUrl;
      link.click();
      setOptionState('webp', 'success');
    } catch {
      setOptionState('webp', 'error');
    }
  };

  const handleCopyImage = async () => {
    setOptionState('copyImage', 'loading');

    try {
      if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
        throw new Error('Clipboard image API not supported');
      }

      const node =
        document.getElementById('dashboard-root') ??
        document.querySelector<HTMLElement>('[data-dashboard]') ??
        document.body;

      const isDark =
        typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

      const canvas = await toCanvas(node, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: isDark ? '#050505' : '#ffffff',
        filter: (el) => {
          if (el instanceof HTMLElement) {
            if (el.id === 'share-sheet-overlay') return false;
            if (el.id === 'generate-dashboard-btn') return false;
          }
          return true;
        },
      });

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create image blob'));
        }, 'image/png');
      });

      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
        }),
      ]);

      setOptionState('copyImage', 'success');
      setTimeout(() => onClose(), 800);
    } catch {
      setOptionState('copyImage', 'error');
    }
  };

  const handleDownloadSVG = async () => {
    setOptionState('svg', 'loading');
    try {
      const response = await fetch(`/api/streak?user=${encodeURIComponent(username)}`);
      if (!response.ok) throw new Error('Failed to fetch SVG');
      const svgText = await response.text();
      const blob = new Blob([svgText], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${username}-commitpulse.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      setOptionState('svg', 'success');
    } catch {
      setOptionState('svg', 'error');
    }
  };

  const handleCopyMarkdown = async () => {
    setOptionState('markdown', 'loading');
    try {
      const markdown = `![CommitPulse](${window.location.origin}/api/streak?user=${encodeURIComponent(username)})`;
      await navigator.clipboard.writeText(markdown);
      setOptionState('markdown', 'success');
      setTimeout(() => onClose(), 800);
    } catch {
      setOptionState('markdown', 'error');
    }
  };

  const downloadTextFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.download = filename;
    link.href = url;
    link.click();

    URL.revokeObjectURL(url);
  };

  const escapeCsvValue = (value: string | number | null | undefined): string => {
    const stringValue = value == null ? '' : String(value);

    if (/[",\n\r]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  };

  const handleDownloadCSV = () => {
    setOptionState('csv', 'loading');

    try {
      const exportedAt = new Date().toISOString();
      const dailyActivity = exportData.activity ?? [];

      const rows: Array<Array<string | number>> = [
        ['field', 'value'],
        ['username', username],
        ['profileUrl', PROFILE_URL(username)],
        ['exportedAt', exportedAt],
        ['totalContributions', exportData.stats.totalContributions],
        ['currentStreak', exportData.stats.currentStreak],
        ['longestStreak', exportData.stats.peakStreak],
        [],
        ['date', 'dailyContributionCount', 'intensity'],
        ...dailyActivity.map((day) => [day.date, day.count, day.intensity]),
      ];

      const csv = rows.map((row) => row.map(escapeCsvValue).join(',')).join('\n');

      downloadTextFile(csv, `commitpulse-${username}-stats.csv`, 'text/csv;charset=utf-8');

      setOptionState('csv', 'success');
    } catch {
      setOptionState('csv', 'error');
    }
  };

  const handleDownloadJSON = () => {
    setOptionState('json', 'loading');

    try {
      const dailyContributions = (exportData.activity ?? []).map((day) => ({
        date: day.date,
        count: day.count,
        intensity: day.intensity,
      }));

      const payload = {
        username,
        profileUrl: PROFILE_URL(username),
        exportedAt: new Date().toISOString(),
        totalContributions: exportData.stats.totalContributions,
        currentStreak: exportData.stats.currentStreak,
        longestStreak: exportData.stats.peakStreak,
        contributionDates: dailyContributions.map((day) => day.date),
        dailyContributions,
        topLanguages: exportData.languages,
      };

      downloadTextFile(
        JSON.stringify(payload, null, 2),
        `commitpulse-${username}-stats.json`,
        'application/json'
      );

      setOptionState('json', 'success');
    } catch {
      setOptionState('json', 'error');
    }
  };

  const handleNativeShare = async () => {
    if (!('share' in navigator)) {
      setOptionState('native', 'loading');
      const success = await handleCopyLink();
      setOptionState('native', success ? 'success' : 'error');
      return;
    }
    setOptionState('native', 'loading');
    try {
      await navigator.share({
        title: `${username}'s Commit Pulse`,
        text: `Check out my GitHub commit pulse on CommitPulse 🚀`,
        url: PROFILE_URL(username),
      });
      setOptionState('native', 'success');
      setTimeout(() => onClose(), 800);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setOptionState('native', 'error');
      } else {
        setOptionState('native', 'idle');
      }
    }
  };

  return {
    states,
    handleCopyLink,
    handleTwitter,
    handleLinkedIn,
    handleReddit,
    handleDownloadPNG,
    handleDownloadWEBP,
    handleCopyImage,
    handleDownloadSVG,
    handleCopyMarkdown,
    handleDownloadCSV,
    handleDownloadJSON,
    handleNativeShare,
  };
}
