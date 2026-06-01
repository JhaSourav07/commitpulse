'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ParsedResume, Education, Experience } from '@/types/student';

interface ResumePreviewFormProps {
  githubUsername: string;
  parsed: ParsedResume;
  fileName: string;
  onBack: () => void;
  onComplete: () => void;
}

export default function ResumePreviewForm({
  githubUsername,
  parsed: initialParsed,
  fileName,
  onBack,
  onComplete,
}: ResumePreviewFormProps) {
  const [data, setData] = useState<ParsedResume>(initialParsed);
  const [isSaving, setIsSaving] = useState(false);

  function updateField<K extends keyof ParsedResume>(key: K, value: ParsedResume[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function addSkill() {
    setData((prev) => ({ ...prev, skills: [...prev.skills, ''] }));
  }

  function updateSkill(index: number, value: string) {
    setData((prev) => {
      const skills = [...prev.skills];
      skills[index] = value;
      return { ...prev, skills };
    });
  }

  function removeSkill(index: number) {
    setData((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  }

  function addEducation() {
    setData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        { institution: '', degree: '', field: '', startDate: '', endDate: '' },
      ],
    }));
  }

  function updateEducation(index: number, field: keyof Education, value: string) {
    setData((prev) => {
      const education = prev.education.map((edu, i) =>
        i === index ? { ...edu, [field]: value } : edu
      );
      return { ...prev, education };
    });
  }

  function removeEducation(index: number) {
    setData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
  }

  function addExperience() {
    setData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        { company: '', role: '', startDate: '', endDate: '', description: '' },
      ],
    }));
  }

  function updateExperience(index: number, field: keyof Experience, value: string) {
    setData((prev) => {
      const experience = prev.experience.map((exp, i) =>
        i === index ? { ...exp, [field]: value } : exp
      );
      return { ...prev, experience };
    });
  }

  function removeExperience(index: number) {
    setData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
  }

  async function handleConfirm() {
    if (!data.name.trim() || !data.email.trim()) {
      toast.error('Name and email are required');
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch('/api/student/resume/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubUsername, data }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        toast.error(result.error || 'Failed to save profile');
        return;
      }

      toast.success('Profile saved successfully!');
      onComplete();
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] p-6"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Review Parsed Data</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-white/50">
            From: {fileName} &mdash; Edit any fields before saving
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-white/70">
              Full Name
            </label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-[rgba(255,255,255,0.1)] dark:bg-[#111] dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-white/70">
              Email
            </label>
            <input
              type="email"
              value={data.email}
              onChange={(e) => updateField('email', e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-[rgba(255,255,255,0.1)] dark:bg-[#111] dark:text-white"
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-600 dark:text-white/70">Skills</label>
            <button
              onClick={addSkill}
              className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
            >
              <Plus size={14} /> Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill, i) => (
              <div
                key={i}
                className="flex items-center gap-1 rounded-lg border border-black/10 bg-gray-50 px-2.5 py-1.5 dark:border-[rgba(255,255,255,0.1)] dark:bg-[#111]"
              >
                <input
                  type="text"
                  value={skill}
                  onChange={(e) => updateSkill(i, e.target.value)}
                  className="w-24 bg-transparent text-sm text-gray-900 outline-none dark:text-white"
                />
                <button onClick={() => removeSkill(i)} className="text-red-400 hover:text-red-500">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-600 dark:text-white/70">
              Education
            </label>
            <button
              onClick={addEducation}
              className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
            >
              <Plus size={14} /> Add
            </button>
          </div>
          <div className="space-y-3">
            {data.education.map((edu, i) => (
              <div
                key={i}
                className="rounded-lg border border-black/10 bg-gray-50 p-3 dark:border-[rgba(255,255,255,0.1)] dark:bg-[#111]"
              >
                <div className="mb-2 flex justify-end">
                  <button
                    onClick={() => removeEducation(i)}
                    className="text-red-400 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Institution"
                    value={edu.institution}
                    onChange={(e) => updateEducation(i, 'institution', e.target.value)}
                    className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-[rgba(255,255,255,0.1)] dark:bg-[#1a1a1a] dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Degree"
                    value={edu.degree}
                    onChange={(e) => updateEducation(i, 'degree', e.target.value)}
                    className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-[rgba(255,255,255,0.1)] dark:bg-[#1a1a1a] dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Field of Study"
                    value={edu.field}
                    onChange={(e) => updateEducation(i, 'field', e.target.value)}
                    className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-[rgba(255,255,255,0.1)] dark:bg-[#1a1a1a] dark:text-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Start Year"
                      value={edu.startDate}
                      onChange={(e) => updateEducation(i, 'startDate', e.target.value)}
                      className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-[rgba(255,255,255,0.1)] dark:bg-[#1a1a1a] dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="End Year"
                      value={edu.endDate}
                      onChange={(e) => updateEducation(i, 'endDate', e.target.value)}
                      className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-[rgba(255,255,255,0.1)] dark:bg-[#1a1a1a] dark:text-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-600 dark:text-white/70">
              Experience
            </label>
            <button
              onClick={addExperience}
              className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
            >
              <Plus size={14} /> Add
            </button>
          </div>
          <div className="space-y-3">
            {data.experience.map((exp, i) => (
              <div
                key={i}
                className="rounded-lg border border-black/10 bg-gray-50 p-3 dark:border-[rgba(255,255,255,0.1)] dark:bg-[#111]"
              >
                <div className="mb-2 flex justify-end">
                  <button
                    onClick={() => removeExperience(i)}
                    className="text-red-400 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Company"
                    value={exp.company}
                    onChange={(e) => updateExperience(i, 'company', e.target.value)}
                    className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-[rgba(255,255,255,0.1)] dark:bg-[#1a1a1a] dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Role"
                    value={exp.role}
                    onChange={(e) => updateExperience(i, 'role', e.target.value)}
                    className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-[rgba(255,255,255,0.1)] dark:bg-[#1a1a1a] dark:text-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Start Year"
                      value={exp.startDate}
                      onChange={(e) => updateExperience(i, 'startDate', e.target.value)}
                      className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-[rgba(255,255,255,0.1)] dark:bg-[#1a1a1a] dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="End Year"
                      value={exp.endDate}
                      onChange={(e) => updateExperience(i, 'endDate', e.target.value)}
                      className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-[rgba(255,255,255,0.1)] dark:bg-[#1a1a1a] dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <textarea
                      placeholder="Description"
                      value={exp.description}
                      onChange={(e) => updateExperience(i, 'description', e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-[rgba(255,255,255,0.1)] dark:bg-[#1a1a1a] dark:text-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-black/10 pt-4 dark:border-[rgba(255,255,255,0.08)]">
        <button
          onClick={onBack}
          className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-[rgba(255,255,255,0.15)] dark:text-white/70 dark:hover:bg-white/5"
        >
          Back
        </button>
        <button
          onClick={handleConfirm}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          {isSaving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </motion.div>
  );
}
