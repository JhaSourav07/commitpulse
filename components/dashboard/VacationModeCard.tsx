'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, X, Plus, Loader2, CalendarDays } from 'lucide-react';

interface VacationModeCardProps {
  username: string;
}

export default function VacationModeCard({ username }: VacationModeCardProps) {
  const [dates, setDates] = useState<string[]>([]);
  const [newDate, setNewDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch existing vacation dates on mount
  const fetchDates = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/user/vacation');
      if (!res.ok) throw new Error('Failed to load vacation dates');
      const data = await res.json();
      setDates(data.vacationDates ?? []);
    } catch {
      toast.error('Could not load vacation dates.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Wrap the call in an async function
    const run = async () => {
      await fetchDates();
    };
    run();
  }, [fetchDates]);

  const saveDates = useCallback(async (updatedDates: string[]) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/user/vacation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vacationDates: updatedDates }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to save');
      }
      setDates(updatedDates);
      toast.success('Vacation dates saved!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setIsSaving(false);
    }
  }, []);

  const handleAddDate = () => {
    if (!newDate) return;
    if (dates.includes(newDate)) {
      toast.info('That date is already on your list.');
      return;
    }
    const updated = [...dates, newDate].sort();
    saveDates(updated);
    setNewDate('');
  };

  const handleRemoveDate = (date: string) => {
    const updated = dates.filter((d) => d !== date);
    saveDates(updated);
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div
      id="vacation-mode-card"
      className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/40 to-indigo-950/30 backdrop-blur-sm p-5 shadow-lg shadow-violet-900/10"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/30">
          <Plane size={15} className="text-violet-300" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white leading-tight">Streak Freeze</h3>
          <p className="text-[11px] text-violet-300/70 leading-tight">Vacation Mode</p>
        </div>
        {isSaving && <Loader2 size={14} className="ml-auto text-violet-400 animate-spin" />}
      </div>

      <p className="text-[11.5px] text-zinc-400 mb-4 leading-relaxed">
        Mark vacation days to protect your streak and hide them from the burnout radar while
        you&apos;re away.
      </p>

      {/* Dates list */}
      <div className="min-h-[40px] mb-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-3">
            <Loader2 size={16} className="text-violet-400 animate-spin" />
          </div>
        ) : dates.length === 0 ? (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-dashed border-white/10">
            <CalendarDays size={13} className="text-zinc-500" />
            <span className="text-[11.5px] text-zinc-500">No vacation dates set</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {dates.map((date) => (
                <motion.div
                  key={date}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/15 border border-violet-500/25 text-[11.5px] text-violet-200 font-medium"
                >
                  <span>{date}</span>
                  <button
                    onClick={() => handleRemoveDate(date)}
                    disabled={isSaving}
                    aria-label={`Remove vacation date ${date}`}
                    className="text-violet-400 hover:text-red-400 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <X size={11} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add new date */}
      <div className="flex gap-2 items-center">
        <input
          id={`vacation-date-input-${username}`}
          type="date"
          value={newDate}
          min={today}
          onChange={(e) => setNewDate(e.target.value)}
          disabled={isSaving || isLoading}
          aria-label="Select vacation date to add"
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-[12px] text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500/60 disabled:opacity-50 [color-scheme:dark]"
        />
        <button
          id={`vacation-add-btn-${username}`}
          onClick={handleAddDate}
          disabled={!newDate || isSaving || isLoading}
          aria-label="Add vacation date"
          className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[12px] font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Plus size={13} />
          Add
        </button>
      </div>
    </div>
  );
}
