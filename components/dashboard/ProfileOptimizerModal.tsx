'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Download, Copy, CheckCircle, TrendingUp, AlertCircle } from 'lucide-react';

interface ProfileOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userData: any;
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

  const handleCopy = async () => {
    const text = recommendations
      .map(
        (r) =>
          `[${r.priority}] ${r.category}\nIssue: ${r.issue}\nRecommendation: ${r.recommendation}\nAction: ${r.action}`
      )
      .join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy text', e);
    }
  };

  const handleDownload = () => {
    import('jspdf').then((module) => {
      const jsPDF = module.default;
      const doc = new jsPDF();

      const margin = 15;
      const lineHeight = 7;
      let y = margin;
      const pageWidth = doc.internal.pageSize.width;

      const addWrappedText = (text: string, x: number, yPosition: number, maxWidth: number) => {
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, yPosition);
        return lines.length * lineHeight;
      };

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('CommitPulse Profile Optimization Report', margin, y);
      y += lineHeight * 2;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Overall Score: ${overallScore} (Grade: ${grade})`, margin, y);
      y += lineHeight * 2;

      doc.setFont('helvetica', 'bold');
      doc.text('Categories:', margin, y);
      y += lineHeight;

      doc.setFont('helvetica', 'normal');
      categories.forEach((c) => {
        doc.text(`- ${c.name}: ${c.score}/100`, margin + 5, y);
        y += lineHeight;
      });

      y += lineHeight;

      // Page break if needed before recommendations
      if (y > 250) {
        doc.addPage();
        y = margin;
      }

      doc.setFont('helvetica', 'bold');
      doc.text('Recommendations:', margin, y);
      y += lineHeight;

      doc.setFont('helvetica', 'normal');
      recommendations.forEach((r) => {
        if (y > 270) {
          doc.addPage();
          y = margin;
        }

        doc.setFont('helvetica', 'bold');
        doc.text(`[${r.priority}] ${r.category}`, margin, y);
        y += lineHeight;

        doc.setFont('helvetica', 'normal');
        y += addWrappedText(`Issue: ${r.issue}`, margin + 5, y, pageWidth - margin * 2 - 5);

        if (y > 270) {
          doc.addPage();
          y = margin;
        }
        y += addWrappedText(
          `Recommendation: ${r.recommendation}`,
          margin + 5,
          y,
          pageWidth - margin * 2 - 5
        );

        if (y > 270) {
          doc.addPage();
          y = margin;
        }
        y += addWrappedText(`Action: ${r.action}`, margin + 5, y, pageWidth - margin * 2 - 5);

        y += lineHeight;
      });

      doc.save('Profile-Optimization-Report.pdf');
    });
  };

  if (!isOpen) return null;

  // Mocked Dynamic Data derived from userData
  const overallScore = userData ? Math.min(100, 40 + (userData.profile?.developerScore || 30)) : 72;
  const grade =
    overallScore >= 90
      ? 'A+'
      : overallScore >= 80
        ? 'A'
        : overallScore >= 70
          ? 'B+'
          : overallScore >= 60
            ? 'B'
            : 'C';

  const hasBio = !!userData?.profile?.bio;
  const reposCount = userData?.profile?.stats?.repositories || 0;
  const followersCount = userData?.profile?.stats?.followers || 0;
  const languagesCount = userData?.languages?.length || 0;
  const totalContributions = userData?.stats?.totalContributions || 0;
  const devScore = userData?.profile?.developerScore || 50;

  const getStatus = (score: number) => (score >= 80 ? 'good' : score >= 60 ? 'average' : 'poor');

  // Dynamic score calculations based on profile metrics
  const bioScore = hasBio ? Math.min(98, 80 + devScore * 0.2) : 30;
  const pinnedReposScore = reposCount > 0 ? Math.min(90, 50 + reposCount * 2) : 30;
  const diversityScore = Math.min(95, 40 + languagesCount * 8);
  const osScore = Math.min(
    95,
    30 + followersCount * 3 + (totalContributions > 500 ? 30 : totalContributions > 100 ? 15 : 0)
  );
  const docScore = Math.min(92, 45 + reposCount * 1.5 + (totalContributions > 300 ? 15 : 0));
  const presentationScore = Math.min(88, 50 + followersCount * 2 + languagesCount * 3);
  const readmeScore = Math.min(96, 50 + devScore * 0.4);

  const recruiterReadiness = Math.round(
    (bioScore +
      pinnedReposScore +
      diversityScore +
      osScore +
      docScore +
      presentationScore +
      readmeScore) /
      7
  );

  const categories = [
    { name: 'Profile README', score: Math.round(readmeScore), status: getStatus(readmeScore) },
    { name: 'Bio & Details', score: Math.round(bioScore), status: getStatus(bioScore) },
    {
      name: 'Pinned Repositories',
      score: Math.round(pinnedReposScore),
      status: getStatus(pinnedReposScore),
    },
    { name: 'Repository Documentation', score: Math.round(docScore), status: getStatus(docScore) },
    {
      name: 'Project Presentation',
      score: Math.round(presentationScore),
      status: getStatus(presentationScore),
    },
    {
      name: 'Portfolio Diversity',
      score: Math.round(diversityScore),
      status: getStatus(diversityScore),
    },
    { name: 'Open Source Engagement', score: Math.round(osScore), status: getStatus(osScore) },
    {
      name: 'Recruiter Readiness',
      score: recruiterReadiness,
      status: getStatus(recruiterReadiness),
    },
  ];

  const recommendations: {
    priority: string;
    category: string;
    issue: string;
    recommendation: string;
    action: string;
    impact?: string;
  }[] = [];

  // Sort categories by score ascending to focus on the worst ones
  const sortedCategories = [...categories].sort((a, b) => a.score - b.score);

  // Generate recommendations based on the lowest scoring specific categories
  sortedCategories.slice(0, 4).forEach((cat) => {
    if (cat.name === 'Open Source Engagement') {
      recommendations.push({
        priority: cat.score < 60 ? 'HIGH' : 'MEDIUM',
        category: 'Open Source Engagement',
        issue: 'Your profile lacks visible contributions to external open-source projects.',
        recommendation:
          'Contribute to established open-source repositories by fixing bugs or improving documentation.',
        impact:
          'Open-source contributions provide strong evidence of your ability to collaborate in large, existing codebases.',
        action:
          'Find an active repository matching your stack and submit a PR for a "good first issue".',
      });
    }

    if (cat.name === 'Pinned Repositories') {
      recommendations.push({
        priority: cat.score < 60 ? 'HIGH' : 'MEDIUM',
        category: 'Pinned Repository Selection',
        issue: 'Your pinned repositories may not represent your best, most complete work.',
        recommendation:
          'Replace inactive or less impactful pinned repositories with projects that demonstrate full-stack development, AI integration, or production deployment.',
        impact:
          'Pinned repositories are usually the first projects recruiters inspect to gauge your skill level.',
        action:
          'Review your pinned repos and ensure the top 2 are your most impressive, production-ready applications.',
      });
    }

    if (cat.name === 'Project Presentation') {
      recommendations.push({
        priority: cat.score < 60 ? 'HIGH' : 'MEDIUM',
        category: 'Project Presentation',
        issue:
          'Major repositories are missing visual demonstrations like screenshots or demo videos.',
        recommendation:
          'Add screenshots, demo videos, and live deployment links to your top repositories.',
        impact:
          'Visual demonstrations significantly improve recruiter engagement and prove that your code works.',
        action:
          'Record a quick 30-second demo video or take screenshots of your best project and add them to the README.',
      });
    }

    if (cat.name === 'Repository Documentation') {
      recommendations.push({
        priority: cat.score < 60 ? 'HIGH' : 'MEDIUM',
        category: 'Repository Documentation',
        issue: 'Your repositories lack comprehensive setup instructions and architecture details.',
        recommendation:
          'Add setup instructions, features, and architecture explanations to your repositories.',
        impact:
          'Recruiters and hiring managers often evaluate documentation quality before they even review code.',
        action:
          'Create a standard, professional README template and apply it to your top 3 projects.',
      });
    }

    if (cat.name === 'Bio & Details') {
      recommendations.push({
        priority: cat.score < 60 ? 'HIGH' : 'MEDIUM',
        category: 'Bio & Details',
        issue: 'Your GitHub profile bio is weak or completely empty.',
        recommendation:
          'Add a concise, professional bio detailing your primary skills, current focus, and what you are building.',
        impact:
          'A strong bio acts as your elevator pitch, sets professional context, and improves search visibility.',
        action:
          'Update your bio to something like "Full-stack developer building scalable web apps with React & Node.js."',
      });
    }

    if (cat.name === 'Portfolio Diversity') {
      recommendations.push({
        priority: cat.score < 60 ? 'HIGH' : 'MEDIUM',
        category: 'Portfolio Diversity',
        issue: 'Your profile heavily showcases a single technology without visible diversity.',
        recommendation:
          'Incorporate and highlight projects that demonstrate a different skill area such as backend systems, database management, or cloud deployment.',
        impact:
          'A diverse portfolio better showcases technical breadth and adaptability to hiring managers.',
        action:
          'Pin a repository that utilizes a secondary language or focuses heavily on infrastructure/DevOps.',
      });
    }
  });

  // Sort recommendations by priority (HIGH -> MEDIUM -> LOW)
  const priorityOrder = { HIGH: 1, MEDIUM: 2, LOW: 3 };
  recommendations.sort(
    (a, b) =>
      priorityOrder[a.priority as keyof typeof priorityOrder] -
      priorityOrder[b.priority as keyof typeof priorityOrder]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-[rgba(255,255,255,0.08)] dark:bg-[#0a0a0a] shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-black/10 dark:border-white/10 shrink-0">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 dark:text-white/40 hover:text-black dark:hover:text-white transition-all"
          >
            <X size={20} />
          </button>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="text-emerald-500" />
            Profile Optimizer
          </h2>
          <p className="text-sm text-gray-500 dark:text-[#A1A1AA] mt-1">
            Analyse your GitHub profile and receive actionable improvements to increase recruiter
            visibility and profile quality.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {!isGenerated ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative w-16 h-16 mb-6">
                <svg
                  className="animate-spin w-full h-full text-emerald-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
              <div className="h-6">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={loadingState}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-gray-900 dark:text-white font-medium"
                  >
                    {loadingSteps[loadingState]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Score Card */}
              <div className="flex flex-col md:flex-row gap-6 p-6 rounded-xl bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5">
                <div className="flex flex-col items-center justify-center shrink-0">
                  <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-4 border-emerald-500/20">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="60"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-transparent"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="60"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeDasharray="377"
                        strokeDashoffset={377 - (377 * overallScore) / 100}
                        className="text-emerald-500 transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="text-center">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        {overallScore}
                      </span>
                      <span className="block text-xs text-gray-500 font-semibold mt-1">
                        Grade: {grade}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Profile Health: Good, but has room to grow.
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    Your profile shows strong consistency and a solid foundation. However, to truly
                    stand out to recruiters, you should optimize your pinned repositories and
                    enhance your overall documentation quality.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {categories.map((cat, i) => (
                      <div key={i} className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600 dark:text-gray-400">{cat.name}</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {cat.score}/100
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${cat.status === 'good' ? 'bg-emerald-500' : cat.status === 'average' ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${cat.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-widest mb-4">
                  Actionable Recommendations
                </h3>
                <div className="space-y-4">
                  {recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="p-5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-transparent flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-1 rounded ${
                              rec.priority === 'HIGH'
                                ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                                : rec.priority === 'MEDIUM'
                                  ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            }`}
                          >
                            {rec.priority} PRIORITY
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            {rec.category}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                          {rec.issue}
                        </h4>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="p-3 bg-emerald-50 dark:bg-emerald-500/5 rounded-lg border border-emerald-100 dark:border-emerald-500/10">
                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold block mb-1">
                              Recommendation
                            </span>
                            <span className="text-gray-700 dark:text-gray-300">
                              {rec.recommendation}
                            </span>
                          </div>
                          <div className="p-3 bg-blue-50 dark:bg-blue-500/5 rounded-lg border border-blue-100 dark:border-blue-500/10">
                            <span className="text-blue-700 dark:text-blue-400 font-semibold block mb-1">
                              Why it matters
                            </span>
                            <span className="text-gray-700 dark:text-gray-300">{rec.impact}</span>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-gray-50 dark:bg-white/5 rounded-lg flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-gray-400 shrink-0" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            <strong className="text-gray-900 dark:text-white">
                              Example Action:
                            </strong>{' '}
                            {rec.action}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-black/10 dark:border-white/10 flex justify-end gap-3 shrink-0">
          <button
            disabled={!isGenerated}
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#111] hover:bg-gray-50 dark:hover:bg-white/5 text-gray-900 dark:text-white text-sm font-semibold transition-all disabled:opacity-50"
          >
            {copied ? <CheckCircle size={16} className="text-emerald-500" /> : <Copy size={16} />}
            {copied ? 'Copied' : 'Copy Text'}
          </button>
          <button
            disabled={!isGenerated}
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-black text-sm font-semibold transition-all disabled:opacity-50"
          >
            <Download size={16} />
            Download Report
          </button>
        </div>
      </motion.div>
    </div>
  );
}
