'use client';

import { copyToClipboard } from '@/utils/clipboard';
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Download, Copy, CheckCircle, TrendingUp, AlertCircle } from 'lucide-react';

interface ProfileOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: {
    profile?: {
      bio?: string;
      developerScore?: number;
      stats?: {
        repositories?: number;
        followers?: number;
      };
    };
    languages?: unknown[];
    stats?: {
      totalContributions?: number;
      [key: string]: unknown;
    };
  } | null;
}

export default function ProfileOptimizerModal({
  isOpen,
  onClose,
  userData,
}: ProfileOptimizerModalProps) {
  const [loadingState, setLoadingState] = useState<number>(0);
  const [isGenerated, setIsGenerated] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadingSteps = [
    'Analysing GitHub profile...',
    'Evaluating repository quality...',
    'Checking contribution consistency...',
    'Generating recommendations...',
  ];

  useEffect(() => {
    if (isOpen) {
      // Safe: synchronous reset to initial state each time the modal opens.
      // setLoadingState(0) and setIsGenerated(false) always run together and
      // only in response to the isOpen prop changing — no async race possible.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoadingState(0);

      setIsGenerated(false);

      const interval = setInterval(() => {
        setLoadingState((prev) => {
          if (prev >= loadingSteps.length - 1) {
            clearInterval(interval);
            setTimeout(() => setIsGenerated(true), 600);
            return prev;
          }
          return prev + 1;
        });
      }, 800);

      return () => clearInterval(interval);
    }
  }, [isOpen, loadingSteps.length]);

  //prevents background scrolling while the modal is open
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleCopy = async () => {
    const text = recommendations
      .map(
        (r) =>
          `[${r.priority}] ${r.category}\nIssue: ${r.issue}\nRecommendation: ${r.recommendation}\nAction: ${r.action}`
      )
      .join('\n\n');
    try {
      await copyToClipboard(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy text', e);
    }
  };

  const handleDownload = () => {
    import('jspdf').then((module) => {
    .catch(err => console.error(err))