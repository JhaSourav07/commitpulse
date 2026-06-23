'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, BookOpen, ChevronRight, Sparkles } from 'lucide-react';
import { LanguageData, ActivityData } from '@/types/dashboard';
import { useTranslation } from '@/context/TranslationContext';
import {
  calculateSkillCategories,
  calculateSkillEvolution,
  generateTechGrowthEvents,
} from '@/utils/SkillCalculations';
import SkillTrendChart from './SkillTrendChart';
import TechnologyGrowthTimeline from './TechnologyGrowthTimeline';

interface DeveloperSkillEvolutionProps {
  languages: LanguageData[];
  activity: ActivityData[];
}

export default function DeveloperSkillEvolution({
  languages = [],
  activity = [],
}: DeveloperSkillEvolutionProps) {
  const { t } = useTranslation();
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Compute skills using our utility functions
  const skillCategories = useMemo(() => calculateSkillCategories(languages), [languages]);
  const skillEvolution = useMemo(() => calculateSkillEvolution(languages, activity), [languages, activity]);
  const techGrowthEvents = useMemo(() => generateTechGrowthEvents(languages, activity), [languages, activity]);

  // Set default selected language if none is selected
  useEffect(() => {
    if (!selectedLang && skillEvolution.length > 0) {
      setSelectedLang(skillEvolution[0].language);
    }
  }, [skillEvolution, selectedLang]);

  // Filter languages based on active category
  const filteredSkills = useMemo(() => {
    if (activeCategory === 'All') return skillEvolution;
    
    // Find skill category to see which languages belong
    const cat = skillCategories.find((c) => c.name === activeCategory);
    if (!cat) return skillEvolution;
    
    return skillEvolution.filter((skill) =>
      cat.languages.some((l) => l.toLowerCase() === skill.language.toLowerCase())
    );
  }, [skillEvolution, activeCategory, skillCategories]);

  const selectedSkillData = useMemo(() => {
    return skillEvolution.find((s) => s.language === selectedLang) || null;
  }, [skillEvolution, selectedLang]);

  const categoryNames = useMemo(() => {
    return ['All', ...skillCategories.map((c) => c.name)];
  }, [skillCategories]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] shadow-sm"
    >
      <div className="flex items-center gap-2.5 mb-5 border-b border-black/5 dark:border-white/5 pb-4">
        <Cpu size={18} className="text-zinc-500 dark:text-[#A1A1AA]" />
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">
            {t('dashboard.skill_evolution.title') || 'Developer Skill Evolution'}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-0.5">
            {t('dashboard.skill_evolution.subtitle') || 'Analyze technology adoption trends and progression metrics.'}
          </p>
        </div>
      </div>

      {/* Categories Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categoryNames.map((catName) => (
          <button
            key={catName}
            onClick={() => setActiveCategory(catName)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200 ${
              activeCategory === catName
                ? 'bg-zinc-800 dark:bg-white text-white dark:text-black shadow-sm'
                : 'bg-zinc-100 dark:bg-[#111] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
            }`}
          >
            {catName}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Skill Progression List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredSkills.map((skill) => (
              <motion.div
                layout
                key={skill.language}
                onClick={() => setSelectedLang(skill.language)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 flex items-center justify-between ${
                  selectedLang === skill.language
                    ? 'bg-gray-100 dark:bg-[#121212] border-black/20 dark:border-white/20'
                    : 'bg-white dark:bg-[#0a0a0a] border-zinc-200 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: skill.color }}
                  />
                  <div>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white">
                      {skill.language}
                    </span>
                    <span className="text-[10px] text-zinc-400 dark:text-[#777] block mt-0.5">
                      {skill.level}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs font-bold text-zinc-900 dark:text-white">
                      {skill.score}/100
                    </span>
                    <span className="text-[9px] text-emerald-500 dark:text-emerald-400 font-semibold block mt-0.5">
                      +{skill.growthRate}% growth
                    </span>
                  </div>
                  <ChevronRight size={14} className="text-zinc-400" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Selected Skill Details & Timeline */}
        <div className="p-5 rounded-xl bg-gray-50 dark:bg-[#111] border border-black/5 dark:border-[rgba(255,255,255,0.05)]">
          {selectedSkillData ? (
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen size={14} className="text-zinc-500" />
                  <span className="text-xs font-bold text-zinc-950 dark:text-white">
                    {selectedSkillData.language} Trajectory
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                  <Sparkles size={10} />
                  <span>{selectedSkillData.level}</span>
                </div>
              </div>

              {/* Progress Slider Display */}
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mb-4">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${selectedSkillData.score}%` }}
                  transition={{ duration: 0.6 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: selectedSkillData.color }}
                />
              </div>

              {/* Skill Trend Chart */}
              <SkillTrendChart
                history={selectedSkillData.history}
                color={selectedSkillData.color}
                language={selectedSkillData.language}
              />
            </div>
          ) : (
            <div className="text-center text-xs text-zinc-400 py-10">
              Select a language to view skill trajectory.
            </div>
          )}

          {/* Technology Timeline */}
          {techGrowthEvents.length > 0 && (
            <TechnologyGrowthTimeline events={techGrowthEvents} />
          )}
        </div>
      </div>
    </motion.div>
  );
}
