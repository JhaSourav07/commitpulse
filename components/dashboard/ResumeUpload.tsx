'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ParsedResume, ResumeUploadResponse } from '@/types/student';

export interface ResumeUploadProps {
  onParsed: (data: ParsedResume, fileName: string) => void;
  onError: (error: string) => void;
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_SIZE = 5 * 1024 * 1024;

export default function ResumeUpload({ onParsed, onError }: ResumeUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(e.type === 'dragenter' || e.type === 'dragover');
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) validateAndUpload(droppedFile);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) validateAndUpload(selectedFile);
  }

  function validateAndUpload(selectedFile: File) {
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      onError('Please upload a PDF or DOCX file.');
      return;
    }

    if (selectedFile.size > MAX_SIZE) {
      onError('File size must be under 5MB.');
      return;
    }

    setFile(selectedFile);
    uploadFile(selectedFile);
  }

  async function uploadFile(selectedFile: File) {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('resume', selectedFile);

      const res = await fetch('/api/student/resume/upload', {
        method: 'POST',
        body: formData,
      });

      const result: ResumeUploadResponse = await res.json();

      if (!res.ok || !result.success) {
        onError(result.error || 'Failed to upload resume.');
        setFile(null);
        return;
      }

      if (result.data) {
        onParsed(result.data, result.fileName || selectedFile.name);
      }
    } catch {
      onError('Network error. Please try again.');
      setFile(null);
    } finally {
      setIsUploading(false);
    }
  }

  function clearFile() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (isUploading) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  }

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isUploading && inputRef.current?.click()}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={isUploading ? -1 : 0}
        aria-disabled={isUploading}
        className={`
          relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200
          ${
            isDragging
              ? 'border-emerald-500 bg-emerald-500/5'
              : 'border-black/10 dark:border-[rgba(255,255,255,0.15)] hover:border-emerald-500/50 hover:bg-gray-50 dark:hover:bg-white/5'
          }
          ${isUploading ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Upload resume"
        />

        <AnimatePresence mode="wait">
          {isUploading ? (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <Loader2 size={36} className="animate-spin text-emerald-500" />
              <p className="text-sm font-medium text-gray-600 dark:text-white/70">
                Parsing resume...
              </p>
            </motion.div>
          ) : file ? (
            <motion.div
              key="file-selected"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="relative">
                <FileText size={36} className="text-emerald-500" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                  className="absolute -right-2 -top-2 rounded-full bg-red-500 p-0.5 text-white hover:bg-red-600 transition-colors"
                  aria-label="Remove file"
                >
                  <X size={12} />
                </button>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
              <p className="text-xs text-gray-500 dark:text-white/50">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <Upload size={36} className="text-gray-400 dark:text-white/40" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-white/80">
                  Drop your resume here or click to browse
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-white/50">
                  PDF or DOCX &middot; Max 5MB
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
