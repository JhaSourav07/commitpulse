// lib/educational/syllabus-mapper.ts

export type AcademicDomain =
  | 'Applied AI & Data Mining'
  | 'Computer Architecture & Systems'
  | 'Full-Stack Web Development'
  | 'Database Management Systems'
  | 'Algorithms & Data Structures'
  | 'General Purpose / Uncategorized';

export const languageToDomainMap: Record<string, AcademicDomain> = {
  // Applied AI, Data Science, and Data Mining
  Python: 'Applied AI & Data Mining',
  Jupyter: 'Applied AI & Data Mining',
  'Jupyter Notebook': 'Applied AI & Data Mining',
  R: 'Applied AI & Data Mining',
  Julia: 'Applied AI & Data Mining',

  // Computer Architecture and Low-Level Systems
  C: 'Computer Architecture & Systems',
  'C++': 'Computer Architecture & Systems',
  Rust: 'Computer Architecture & Systems',
  Assembly: 'Computer Architecture & Systems',
  Go: 'Computer Architecture & Systems',

  // Modern Full-Stack (Next.js, React, Node)
  TypeScript: 'Full-Stack Web Development',
  JavaScript: 'Full-Stack Web Development',
  HTML: 'Full-Stack Web Development',
  CSS: 'Full-Stack Web Development',
  SCSS: 'Full-Stack Web Development',
  Tailwind: 'Full-Stack Web Development',

  // Databases (MongoDB, NoSQL, SQL)
  SQL: 'Database Management Systems',
  PLSQL: 'Database Management Systems',
  Java: 'Database Management Systems', // Often used in enterprise DB architectures

  // Algorithms and Competitive Programming
  Ruby: 'Algorithms & Data Structures',
  Haskell: 'Algorithms & Data Structures',
};

/**
 * Maps a raw GitHub language string to a structured academic domain.
 */
export function getAcademicDomain(language: string): AcademicDomain {
  return languageToDomainMap[language] || 'General Purpose / Uncategorized';
}
