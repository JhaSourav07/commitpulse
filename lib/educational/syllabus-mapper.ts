// lib/educational/syllabus-mapper.ts

/**
 * Academic domains used to categorise GitHub technology usage in the educational module.
 *
 * - Applied AI & Data Mining: Python, R, Julia, etc.\n * - Computer Architecture & Systems: C, C++, Rust, Go, Assembly\n * - Full-Stack Web Development: TypeScript, JavaScript, CSS, HTML\n * - Database Management Systems: SQL, Java, MongoDB\n * - Algorithms & Data Structures: Ruby, Haskell\n * - General Purpose / Uncategorized: any language not mapped above
 */
export type AcademicDomain =
  | 'Applied AI & Data Mining'
  | 'Computer Architecture & Systems'
  | 'Full-Stack Web Development'
  | 'Database Management Systems'
  | 'Algorithms & Data Structures'
  | 'General Purpose / Uncategorized';

/**
 * Maps lowercase GitHub language names to academic domains.
 *
 * Used by the educational module to categorise a user's technology stack
 * into an academic domain for learning recommendations.
 */
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
/**
 * Maps a raw GitHub language string to an academic domain.
 *
 * Uses a case-sensitive lookup against `languageToDomainMap`. Unrecognised
 * languages default to `'General Purpose / Uncategorized'`.
 *
 * @param language - The GitHub language name as returned by the GitHub API\n * @returns The corresponding `AcademicDomain`, or `'General Purpose / Uncategorized'` if not found\n */
export function getAcademicDomain(language: string): AcademicDomain {
  return languageToDomainMap[language] || 'General Purpose / Uncategorized';
}
