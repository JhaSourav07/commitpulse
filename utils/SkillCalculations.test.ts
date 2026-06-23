import { describe, it, expect } from 'vitest';
import {
  calculateSkillCategories,
  calculateSkillEvolution,
  generateTechGrowthEvents,
} from './SkillCalculations';
import { LanguageData, ActivityData } from '@/types/dashboard';

describe('SkillCalculations', () => {
  const mockLanguages: LanguageData[] = [
    { name: 'TypeScript', color: '#3178c6', percentage: 60 },
    { name: 'Go', color: '#00add8', percentage: 30 },
    { name: 'HTML', color: '#e34c26', percentage: 10 },
  ];

  const mockActivity: ActivityData[] = [
    { date: '2026-06-01', count: 5, intensity: 1 },
    { date: '2026-06-02', count: 10, intensity: 2 },
  ];

  it('correctly maps languages to skill categories', () => {
    const categories = calculateSkillCategories(mockLanguages);
    expect(categories.length).toBeGreaterThan(0);
    
    // TypeScript & HTML belong to Frontend/App category -> total 70%
    const frontend = categories.find(c => c.name === 'Frontend/App');
    expect(frontend).toBeDefined();
    expect(frontend?.score).toBe(70);

    // Go belongs to Backend/Systems category -> total 30%
    const backend = categories.find(c => c.name === 'Backend/Systems');
    expect(backend).toBeDefined();
    expect(backend?.score).toBe(30);
  });

  it('computes skill evolution metrics and level mappings', () => {
    const evolution = calculateSkillEvolution(mockLanguages, mockActivity);
    expect(evolution.length).toBe(3);

    // TypeScript with 60% and 15 total commits
    const tsSkill = evolution.find(s => s.language === 'TypeScript');
    expect(tsSkill).toBeDefined();
    expect(tsSkill?.score).toBeGreaterThan(30);
    expect(tsSkill?.history.length).toBe(6);
  });

  it('generates chronological milestone and mastery events', () => {
    const events = generateTechGrowthEvents(mockLanguages, mockActivity);
    expect(events.length).toBeGreaterThan(0);

    // Should include adoption events
    const adoptions = events.filter(e => e.type === 'adoption');
    expect(adoptions.length).toBeGreaterThan(0);
  });
});
