'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import ResumeUpload from './ResumeUpload';
import ResumePreviewForm from './ResumePreviewForm';
import type { ParsedResume } from '@/types/student';

type Stage = 'idle' | 'uploaded' | 'success';

const LOCAL_STORAGE_KEY = 'userProfile';

interface ResumeProfileSectionProps {
  githubUsername: string;
}

export default function ResumeProfileSection({ githubUsername }: ResumeProfileSectionProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [parsed, setParsed] = useState<ParsedResume | null>(null);
  const [fileName, setFileName] = useState('');
  const [savedProfile, setSavedProfile] = useState<ParsedResume | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsedValue = JSON.parse(stored) as ParsedResume;
        if (parsedValue?.name && parsedValue?.email) {
          setSavedProfile(parsedValue);
        }
      }
    } catch {
      // Ignore invalid or inaccessible localStorage data.
    }
  }, []);

  function handleParsed(data: ParsedResume, name: string) {
    setParsed(data);
    setFileName(name);
    setStage('uploaded');
  }

  function handleError(error: string) {
    toast.error(error);
  }

  function handleBack() {
    setStage('idle');
    setParsed(null);
  }

  function handleComplete() {
    setStage('success');
    toast.success('Profile updated from resume!');
  }

  return (
    <div className="rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] p-4">
      <div className="mb-3 flex items-center gap-2">
        <FileText size={16} className="text-emerald-500" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Resume Profile</h3>
      </div>

      <AnimatePresence mode="wait">
        {stage === 'success' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-700 dark:text-emerald-300"
          >
            <FileText size={16} />
            <span className="font-medium">Profile synced from resume</span>
          </motion.div>
        ) : stage === 'uploaded' && parsed ? (
          <motion.div key="preview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <ResumePreviewForm
              githubUsername={githubUsername}
              parsed={parsed}
              fileName={fileName}
              onBack={handleBack}
              onComplete={handleComplete}
            />
          </motion.div>
        ) : (
          <motion.div key="upload" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <p className="mb-3 text-xs text-gray-500 dark:text-white/50 leading-relaxed">
              Upload your PDF or DOCX resume to auto-fill your profile with skills, education, and
              experience.
            </p>
            {savedProfile ? (
              <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
                <p className="mb-2">Found previously parsed profile data on this device.</p>
                <button
                  type="button"
                  onClick={() => {
                    setParsed(savedProfile);
                    setFileName('Saved profile data');
                    setStage('uploaded');
                  }}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  Review saved profile
                </button>
              </div>
            ) : null}
            <ResumeUpload onParsed={handleParsed} onError={handleError} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
