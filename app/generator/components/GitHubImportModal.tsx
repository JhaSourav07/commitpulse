'use client';

import { useState } from 'react';
import { X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { mapGitHubData, type ImportedData } from '../utils/githubMapper';

interface GitHubImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: ImportedData) => void;
}

export function GitHubImportModal({ isOpen, onClose, onApply }: GitHubImportModalProps) {
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'review'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [importedData, setImportedData] = useState<ImportedData | null>(null);

  const [selectedFields, setSelectedFields] = useState({
    name: true,
    description: true,
    techs: true,
    socials: true,
  });

  if (!isOpen) return null;

  const handleFetch = async () => {
    if (!username.trim()) return;
    setStatus('loading');
    setErrorMsg('');

    try {
      const userRes = await fetch(`https://api.github.com/users/${username.trim()}`);
      if (!userRes.ok) {
        if (userRes.status === 404) throw new Error('GitHub user not found');
        if (userRes.status === 403 || userRes.status === 429)
          throw new Error('Rate limit exceeded. Please try again later.');
        throw new Error('Failed to fetch user data');
      }
      const userData = await userRes.json();

      const [reposRes, socialsRes] = await Promise.all([
        fetch(`https://api.github.com/users/${username.trim()}/repos?per_page=100&type=owner`),
        fetch(`https://api.github.com/users/${username.trim()}/social_accounts`),
      ]);

      const reposData = reposRes.ok ? await reposRes.json() : [];
      const socialsData = socialsRes.ok ? await socialsRes.json() : [];

      const mappedData = mapGitHubData(userData, reposData, socialsData);
      setImportedData(mappedData);
      setStatus('review');
    } catch (err) {
      setStatus('error');
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('An error occurred during import.');
      }
    }
  };

  const handleApply = () => {
    if (!importedData) return;

    const finalData: ImportedData = {
      name: selectedFields.name ? importedData.name : '',
      description: selectedFields.description ? importedData.description : '',
      selectedTechs: selectedFields.techs ? importedData.selectedTechs : [],
      selectedSocials: selectedFields.socials ? importedData.selectedSocials : [],
      socialLinks: selectedFields.socials ? importedData.socialLinks : {},
    };

    onApply(finalData);
    handleClose();
  };

  const handleClose = () => {
    setUsername('');
    setStatus('idle');
    setImportedData(null);
    setErrorMsg('');
    setSelectedFields({
      name: true,
      description: true,
      techs: true,
      socials: true,
    });
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && status === 'idle') {
      handleFetch();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-[#111111] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
          <h2
            id="modal-title"
            className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white"
          >
            <FaGithub className="w-5 h-5" />
            Import from GitHub
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {status === 'idle' || status === 'loading' || status === 'error' ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-white/70">
                Enter your GitHub username to automatically populate your display name, bio, social
                links, and frequently used technologies.
              </p>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <FaGithub className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="GitHub Username"
                  disabled={status === 'loading'}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 disabled:opacity-60"
                  autoFocus
                />
              </div>

              {status === 'error' && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">{errorMsg}</p>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFetch}
                  disabled={!username.trim() || status === 'loading'}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    'Import Profile'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">
                  Successfully fetched profile data! Review the imported fields below.
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedFields.name}
                    onChange={(e) => setSelectedFields((s) => ({ ...s, name: e.target.checked }))}
                    className="mt-1 w-4 h-4 text-emerald-500 rounded border-gray-300 focus:ring-emerald-500"
                  />
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Display Name</p>
                    <p className="text-sm text-gray-500 dark:text-white/50 truncate max-w-[350px]">
                      {importedData?.name || <span className="italic opacity-60">Not set</span>}
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedFields.description}
                    onChange={(e) =>
                      setSelectedFields((s) => ({ ...s, description: e.target.checked }))
                    }
                    className="mt-1 w-4 h-4 text-emerald-500 rounded border-gray-300 focus:ring-emerald-500"
                  />
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      Bio / Description
                    </p>
                    <p className="text-sm text-gray-500 dark:text-white/50 line-clamp-2 max-w-[350px]">
                      {importedData?.description || (
                        <span className="italic opacity-60">Not set</span>
                      )}
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedFields.socials}
                    onChange={(e) =>
                      setSelectedFields((s) => ({ ...s, socials: e.target.checked }))
                    }
                    className="mt-1 w-4 h-4 text-emerald-500 rounded border-gray-300 focus:ring-emerald-500"
                  />
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Social Links</p>
                    <p className="text-sm text-gray-500 dark:text-white/50">
                      {importedData?.selectedSocials.length || 0} links found
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedFields.techs}
                    onChange={(e) => setSelectedFields((s) => ({ ...s, techs: e.target.checked }))}
                    className="mt-1 w-4 h-4 text-emerald-500 rounded border-gray-300 focus:ring-emerald-500"
                  />
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      Technologies (from repositories)
                    </p>
                    <p className="text-sm text-gray-500 dark:text-white/50">
                      {importedData?.selectedTechs.length || 0} languages detected
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  onClick={() => setStatus('idle')}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleApply}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                >
                  Apply Selected
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
