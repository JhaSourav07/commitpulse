'use client';
import { useState, useRef, useEffect } from 'react';
import { toPng, toCanvas } from 'html-to-image';
import type { DashboardExportData } from '@/types/dashboard';
import { getDashboardUrl, getOrigin } from '@/utils/urls';

type OptionState = 'idle' | 'loading' | 'success' | 'error';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const XLINK_NAMESPACE = 'http://www.w3.org/1999/xlink';
const UNSAFE_SVG_ELEMENTS = new Set([
  'script',
  'foreignobject',
  'iframe',
  'object',
  'embed',
  'audio',
  'video',
  'canvas',
  'meta',
  'base',
]);

const CONTROL_CHARS_REGEX = /[\u0000-\u001F\u007F]+/g;

function normalizeLineEndings(value: string): string {
  return value.replace(/\r\n?/g, '\n');
}

function sanitizeUsernameForUrl(username: string): string {
  return username.trim().replace(CONTROL_CHARS_REGEX, '');
}

function sanitizeFilenameSegment(value: string): string {
  const cleaned = value
    .trim()
    .replace(CONTROL_CHARS_REGEX, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return cleaned || 'commitpulse-export';
}

function buildStreakSvgUrl(username: string): string {
  const url = new URL('/api/streak', getOrigin());
  url.searchParams.set('user', sanitizeUsernameForUrl(username));
  return url.toString();
}

function removeUnsafeSvgAttributes(element: Element) {
  const attributes = Array.from(element.attributes);
  for (const attr of attributes) {
    const attrName = attr.name.toLowerCase();
    const attrValue = attr.value.trim();

    if (attrName.startsWith('on')) {
      element.removeAttribute(attr.name);
      continue;
    }

    if (attrName === 'href' || attrName === 'xlink:href') {
      const normalized = attrValue.toLowerCase();
      if (
        normalized.startsWith('javascript:') ||
        normalized.startsWith('vbscript:') ||
        normalized.startsWith('data:')
      ) {
        element.removeAttribute(attr.name);
      }
    }
  }
}

function sanitizeAndCanonicalizeSvg(svgText: string): string {
  const normalizedText = normalizeLineEndings(svgText).trim();
  const parser = new DOMParser();
  const parsed = parser.parseFromString(normalizedText, 'image/svg+xml');
  const parseError = parsed.querySelector('parsererror');

  if (parseError) {
    throw new Error('Invalid SVG payload');
  }

  const root = parsed.documentElement;
  if (!root || root.tagName.toLowerCase() !== 'svg') {
    throw new Error('SVG root element is required');
  }

  if (!root.getAttribute('xmlns')) {
    root.setAttribute('xmlns', SVG_NAMESPACE);
  }

  if (!root.getAttribute('xmlns:xlink')) {
    root.setAttribute('xmlns:xlink', XLINK_NAMESPACE);
  }

  const elements = Array.from(parsed.querySelectorAll('*'));
  for (const element of elements) {
    if (UNSAFE_SVG_ELEMENTS.has(element.tagName.toLowerCase())) {
      element.remove();
      continue;
    }

    removeUnsafeSvgAttributes(element);
  }

  removeUnsafeSvgAttributes(root);
  return `${new XMLSerializer().serializeToString(root)}\n`;
}

function buildMarkdownExport(username: string): string {
  return `![CommitPulse](${buildStreakSvgUrl(username)})`;
}

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
      await navigator.clipboard.writeText(getDashboardUrl(username));
      setOptionState('copy', 'success');
      setTimeout(() => onClose(), 800);
      return true;
    } catch {
      setOptionState('copy', 'error');
      return false;
    }
  };

  const handleTwitter = () => {
    const url = getDashboardUrl(username);
    const text = encodeURIComponent(`Check out my GitHub commit pulse on CommitPulse 🚀\n${url}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'noopener');
    onClose();
  };

  const handleLinkedIn = () => {
    const url = encodeURIComponent(getDashboardUrl(username));
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'noopener');
    onClose();
  };

  const handleReddit = () => {
    const url = encodeURIComponent(getDashboardUrl(username));
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
      const response = await fetch(buildStreakSvgUrl(username));
      if (!response.ok) throw new Error('Failed to fetch SVG');
      const svgText = sanitizeAndCanonicalizeSvg(await response.text());
      const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${sanitizeFilenameSegment(username)}-commitpulse.svg`;
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
      const markdown = buildMarkdownExport(username);
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
        ['profileUrl', getDashboardUrl(username)],
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
        profileUrl: getDashboardUrl(username),
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
        url: getDashboardUrl(username),
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
