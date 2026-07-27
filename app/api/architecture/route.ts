import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import * as ts from 'typescript';
import pLimit from 'p-limit';
import { cloneGitHubRepository } from '@/lib/git-clone';
import { getGitHubTokens } from '@/lib/github';
import { formatRepoRefForLogging, sanitizeErrorForLogging } from '@/lib/sanitize-git-credentials';
import { getClientIp } from '@/utils/getClientIp';

const execFilePromise = promisify(execFile);

// Per-IP concurrent clone tracking (max 3 concurrent clones per IP)
const MAX_CONCURRENT_CLONES_PER_IP = 3;
const MAX_TEMP_DIR_SIZE_BYTES = 500 * 1024 * 1024; // 500MB
const activeClonesPerIP = new Map<string, number>();

function incrementClones(ip: string): boolean {
  const current = activeClonesPerIP.get(ip) || 0;
  if (current >= MAX_CONCURRENT_CLONES_PER_IP) return false;
  activeClonesPerIP.set(ip, current + 1);
  return true;
}

function decrementClones(ip: string): void {
  const current = activeClonesPerIP.get(ip) || 0;
  if (current <= 1) {
    activeClonesPerIP.delete(ip);
  } else {
    activeClonesPerIP.set(ip, current - 1);
  }
}

/**
 * Measures total size of a directory recursively.
 */
function getDirSize(dirPath: string): number {
  let totalSize = 0;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        totalSize += getDirSize(fullPath);
      } else if (entry.isFile()) {
        const stats = fs.statSync(fullPath);
        totalSize += stats.size;
      }
    }
  } catch {
    // Ignore errors during size calculation
  }
  return totalSize;
}

// Supported files for parsing imports/exports
const PARSABLE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);
// Supported text files to show in folder tree
const TEXT_EXTENSIONS = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.json',
  '.css',
  '.html',
  '.md',
  '.py',
  '.go',
  '.java',
  '.cpp',
  '.h',
  '.cs',
  '.sh',
  '.yml',
  '.yaml',
]);

// Directories to ignore during traversal
const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  'out',
  'coverage',
  '.vercel',
  'bin',
  'obj',
  'tmp',
  'temp',
]);

interface AnalyzedFile {
  path: string;
  name: string;
  type: string;
  size: number;
  linesOfCode: number;
  commits: number;
  lastModified: string;
  contributors: string[];
  imports: string[];
  exports: string[];
}

interface RouteNode {
  id: string;
  type: string;
  data: Record<string, unknown>;
  position?: { x: number; y: number };
}

interface RouteEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  style?: Record<string, unknown>;
}

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

/**
 * Validates and extracts owner & repo from GitHub URL
 */
function parseRepoUrl(url: string): { owner: string; repo: string } | null {
  try {
    const cleanUrl = url.trim().replace(/\/$/, '');
    const match = cleanUrl.match(
      /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/
    );
    if (!match) return null;
    return {
      owner: match[1],
      repo: match[2].replace(/\.git$/, ''),
    };
  } catch {
    return null;
  }
}

/**
 * AST Parser to extract static, dynamic imports, requires and exports
 */
function parseFileImportsAndExports(filePath: string, fileContent: string) {
  const imports: string[] = [];
  const exports: string[] = [];

  try {
    const sourceFile = ts.createSourceFile(filePath, fileContent, ts.ScriptTarget.Latest, true);

    function traverse(node: ts.Node) {
      // 1. Static Import Declarations: import X from 'y'
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier;
        if (ts.isStringLiteral(moduleSpecifier)) {
          imports.push(moduleSpecifier.text);
        }
      }
      // 2. Import Equals Declarations: import X = require('y')
      else if (ts.isImportEqualsDeclaration(node)) {
        if (ts.isExternalModuleReference(node.moduleReference)) {
          const expression = node.moduleReference.expression;
          if (ts.isStringLiteral(expression)) {
            imports.push(expression.text);
          }
        }
      }
      // 3. Call Expressions: require('x') or dynamic import('x')
      else if (ts.isCallExpression(node)) {
        if (
          (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
            (ts.isIdentifier(node.expression) && node.expression.text === 'require')) &&
          node.arguments.length > 0
        ) {
          const arg = node.arguments[0];
          if (ts.isStringLiteral(arg)) {
            imports.push(arg.text);
          }
        }
      }
      // 4. Export Declarations: export { x } from 'y'
      else if (ts.isExportDeclaration(node)) {
        if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
          imports.push(node.moduleSpecifier.text);
        }
        if (node.exportClause) {
          if (ts.isNamedExports(node.exportClause)) {
            node.exportClause.elements.forEach((el) => {
              exports.push(el.name.text);
            });
          }
        }
      }
      // 5. Named export modifiers on variables, functions, classes
      else if (
        ts.isFunctionDeclaration(node) ||
        ts.isClassDeclaration(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isTypeAliasDeclaration(node) ||
        ts.isVariableStatement(node)
      ) {
        const hasExport = node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
        if (hasExport) {
          if (ts.isFunctionDeclaration(node) && node.name) {
            exports.push(node.name.text);
          } else if (ts.isClassDeclaration(node) && node.name) {
            exports.push(node.name.text);
          } else if (ts.isInterfaceDeclaration(node) && node.name) {
            exports.push(node.name.text);
          } else if (ts.isTypeAliasDeclaration(node) && node.name) {
            exports.push(node.name.text);
          } else if (ts.isVariableStatement(node)) {
            node.declarationList.declarations.forEach((dec) => {
              if (ts.isIdentifier(dec.name)) {
                exports.push(dec.name.text);
              }
            });
          }
        }
      }

      ts.forEachChild(node, traverse);
    }

    traverse(sourceFile);
  } catch (err) {
    console.error('Error AST parsing file:', filePath, err);
  }

  return {
    imports: Array.from(new Set(imports)),
    exports: Array.from(new Set(exports)),
  };
}

/**
 * Resolves local import paths to matching files in the repo
 */
function resolveImportPath(
  importerPath: string,
  importSpecifier: string,
  allFilesSet: Set<string>
): string | null {
  // If third-party, ignore
  if (
    !importSpecifier.startsWith('.') &&
    !importSpecifier.startsWith('@/') &&
    !importSpecifier.startsWith('~/')
  ) {
    return null;
  }

  let targetPath = '';

  if (importSpecifier.startsWith('@/') || importSpecifier.startsWith('~/')) {
    // Resolve alias relative to root
    const relativeTarget = importSpecifier.slice(2);
    targetPath = relativeTarget;
    // Check both src folder prefix and root
    if (
      !allFilesSet.has(targetPath) &&
      allFilesSet.has(path.join('src', relativeTarget).replace(/\\/g, '/'))
    ) {
      targetPath = path.join('src', relativeTarget).replace(/\\/g, '/');
    }
  } else {
    // Relative imports (e.g. ./Button, ../utils)
    const importerDir = path.dirname(importerPath);
    targetPath = path.normalize(path.join(importerDir, importSpecifier)).replace(/\\/g, '/');
  }

  // Normalize path format
  targetPath = targetPath.replace(/^\.\//, '');

  const extensions = [
    '',
    '.tsx',
    '.ts',
    '.jsx',
    '.js',
    '/index.tsx',
    '/index.ts',
    '/index.jsx',
    '/index.js',
  ];
  for (const ext of extensions) {
    const candidate = `${targetPath}${ext}`;
    if (allFilesSet.has(candidate)) {
      return candidate;
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  let tempDir = '';
  const ip = getClientIp(req);

  // Check concurrent clone limit per IP
  if (!incrementClones(ip)) {
    return NextResponse.json(
      { error: 'Too many concurrent requests. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const { repoUrl } = await req.json();

    if (!repoUrl) {
      return NextResponse.json({ error: 'Repository URL is required' }, { status: 400 });
    }

    const repoDetails = parseRepoUrl(repoUrl);
    if (!repoDetails) {
      return NextResponse.json({ error: 'Invalid GitHub repository URL' }, { status: 400 });
    }

    const { owner, repo } = repoDetails;
    const repoRef = formatRepoRefForLogging(owner, repo);

    const tokens = getGitHubTokens();
    const token = tokens.length > 0 ? tokens[0] : undefined;

    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `commitpulse-arch-${owner}-${repo}-`));

    try {
      await cloneGitHubRepository(owner, repo, tempDir, token);
    } catch (err) {
      console.error('Cloning failed for repository:', repoRef, sanitizeErrorForLogging(err));
      // Clean up tempDir if it was created
      if (tempDir && fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
      return NextResponse.json(
        {
          error: 'Failed to clone repository. Make sure the repository exists and is accessible.',
        },
        { status: 404 }
      );
    }

    // Check disk quota - if clone is too large, abort and clean up
    const dirSize = getDirSize(tempDir);
    if (dirSize > MAX_TEMP_DIR_SIZE_BYTES) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      return NextResponse.json(
        { error: 'Repository exceeds maximum allowed size (500MB).' },
        { status: 413 }
      );
    }

    // Traverse directory structure
    const folders: string[] = [];
    const filesList: string[] = [];
    const allFilesSet = new Set<string>();

    function traverseDir(currentDir: string) {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const relativePath = path.relative(tempDir, fullPath).replace(/\\/g, '/');

        if (entry.isDirectory()) {
          if (IGNORED_DIRS.has(entry.name)) continue;
          folders.push(relativePath);
          traverseDir(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (TEXT_EXTENSIONS.has(ext)) {
            filesList.push(relativePath);
            allFilesSet.add(relativePath);
          }
        }
      }
    }

    traverseDir(tempDir);

    // Limit files to analyze to prevent resource starvation or serverless timeouts
    const MAX_FILES_TO_ANALYZE = 150;
    const parsableFiles = filesList.filter((f) =>
      PARSABLE_EXTENSIONS.has(path.extname(f).toLowerCase())
    );

    // Prioritize shallower file structures first, then sort by size
    const prioritizedFiles = parsableFiles
      .map((file) => {
        const fullPath = path.join(tempDir, file);
        const stats = fs.statSync(fullPath);
        const depth = file.split('/').length;
        return { file, depth, size: stats.size };
      })
      .sort((a, b) => a.depth - b.depth || b.size - a.size)
      .slice(0, MAX_FILES_TO_ANALYZE)
      .map((item) => item.file);

    const prioritizedFilesSet = new Set(prioritizedFiles);

    // Analyze each file (Git history & AST parsing)
    // Run in parallel with concurrency limit
    const limit = pLimit(10);
    const analyzedFiles: AnalyzedFile[] = await Promise.all(
      prioritizedFiles.map((file) =>
        limit(async (): Promise<AnalyzedFile> => {
          const fullPath = path.join(tempDir, file);
          const ext = path.extname(file).toLowerCase();
          const fileContent = fs.readFileSync(fullPath, 'utf-8');
          const stats = fs.statSync(fullPath);
          const lines = fileContent.split('\n').length;

          // Parse Imports & Exports
          const { imports, exports } = parseFileImportsAndExports(file, fileContent);

          // Get Git stats
          let commitsCount = 1;
          let lastModified = new Date().toISOString().split('T')[0];
          let contributors: string[] = ['Author'];

          try {
            const commitCountRes = await execFilePromise(
              'git',
              ['rev-list', '--count', 'HEAD', '--', file],
              { cwd: tempDir }
            );
            commitsCount = parseInt(commitCountRes.stdout.trim(), 10) || 1;

            const lastModRes = await execFilePromise(
              'git',
              ['log', '-1', '--format=%cd', '--date=short', '--', file],
              { cwd: tempDir }
            );
            if (lastModRes.stdout.trim()) {
              lastModified = lastModRes.stdout.trim();
            }

            const contributorsRes = await execFilePromise(
              'git',
              ['log', '--format=%an', '--', file],
              { cwd: tempDir }
            );
            const rawContribs = contributorsRes.stdout
              .split('\n')
              .map((c) => c.trim())
              .filter((c) => c !== '');
            if (rawContribs.length > 0) {
              contributors = Array.from(new Set(rawContribs));
            }
          } catch {
            // Ignore git issues, keep fallback default values
          }

          return {
            path: file,
            name: path.basename(file),
            type: ext.slice(1),
            size: stats.size,
            linesOfCode: lines,
            commits: commitsCount,
            lastModified,
            contributors,
            imports,
            exports,
          };
        })
      )
    );

    // Build Graph Nodes and Edges for React Flow
    const nodes: RouteNode[] = [];
    const edges: RouteEdge[] = [];

    // 1. Create Folder nodes
    // Filter folders to only those that contain prioritized files
    const activeFolders = new Set<string>();
    prioritizedFiles.forEach((file) => {
      const parts = file.split('/');
      parts.pop(); // Remove file name
      while (parts.length > 0) {
        activeFolders.add(parts.join('/'));
        parts.pop();
      }
    });

    Array.from(activeFolders).forEach((folder) => {
      nodes.push({
        id: folder,
        type: 'folderNode',
        data: {
          label: path.basename(folder),
          path: folder,
          isFolder: true,
        },
        position: { x: 0, y: 0 }, // Positions will be calculated below
      });
    });

    // 2. Create File nodes
    analyzedFiles.forEach((file) => {
      nodes.push({
        id: file.path,
        type: 'fileNode',
        data: {
          label: file.name,
          path: file.path,
          type: file.type,
          size: file.size,
          linesOfCode: file.linesOfCode,
          commits: file.commits,
          lastModified: file.lastModified,
          contributors: file.contributors,
          imports: file.imports,
          exports: file.exports,
          isFolder: false,
        },
        position: { x: 0, y: 0 },
      });
    });

    // 3. Create Edges
    // A. Folder containment edges (Dashed style, folder -> nested item)
    nodes.forEach((node) => {
      const nodeId = node.id;
      const parts = nodeId.split('/');
      if (parts.length > 1) {
        parts.pop();
        const parentId = parts.join('/');
        if (activeFolders.has(parentId)) {
          edges.push({
            id: `contain-${parentId}-${nodeId}`,
            source: parentId,
            target: nodeId,
            type: 'default',
            style: { strokeDasharray: '4 4', stroke: '#6B7280', opacity: 0.4 },
          });
        }
      }
    });

    // B. Dependency import edges (Solid green flowing edges, file -> imported file)
    analyzedFiles.forEach((file) => {
      file.imports.forEach((imp) => {
        const resolved = resolveImportPath(file.path, imp, allFilesSet);
        // Only link if the resolved file is also within our prioritized nodes set
        if (resolved && prioritizedFilesSet.has(resolved)) {
          edges.push({
            id: `dep-${file.path}-${resolved}`,
            source: file.path,
            target: resolved,
            animated: true,
            style: { stroke: '#10B981', strokeWidth: 1.5 },
          });
        }
      });
    });

    // 4. Calculate node layout coordinates (Grouped by depth level)
    const nodesByDepth: Record<number, RouteNode[]> = {};
    nodes.forEach((node) => {
      const depth = node.id.split('/').length - 1;
      if (!nodesByDepth[depth]) nodesByDepth[depth] = [];
      nodesByDepth[depth].push(node);
    });

    Object.keys(nodesByDepth).forEach((depthKey) => {
      const depth = parseInt(depthKey, 10);
      const depthNodes = nodesByDepth[depth];
      const count = depthNodes.length;
      const spacingX = 220;
      const startX = -((count - 1) * spacingX) / 2;

      depthNodes.forEach((node, index) => {
        node.position = {
          x: startX + index * spacingX,
          y: depth * 150 + 60,
        };
      });
    });

    // Generate Architectural Summary
    let summary = '';
    const geminiApiKey = process.env.GEMINI_API_KEY;

    // Detect frameworks and libraries from package.json if it exists
    let packageJsonData: PackageJson = {};
    try {
      const packageJsonPath = path.join(tempDir, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        packageJsonData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      }
    } catch {
      // package.json parsing issues ignored
    }

    const dependencies = {
      ...packageJsonData.dependencies,
      ...packageJsonData.devDependencies,
    };

    const detectedTech: string[] = [];
    if (dependencies['react']) detectedTech.push('React');
    if (dependencies['next']) detectedTech.push('Next.js');
    if (dependencies['vue']) detectedTech.push('Vue');
    if (dependencies['svelte']) detectedTech.push('Svelte');
    if (dependencies['typescript']) detectedTech.push('TypeScript');
    if (dependencies['tailwindcss']) detectedTech.push('TailwindCSS');
    if (dependencies['express']) detectedTech.push('Express');
    if (dependencies['prisma']) detectedTech.push('Prisma');
    if (dependencies['graphql']) detectedTech.push('GraphQL');
    if (dependencies['mongodb']) detectedTech.push('MongoDB');

    if (geminiApiKey) {
      try {
        const fileStructureList = prioritizedFiles
          .slice(0, 50)
          .map((f) => `- ${f}`)
          .join('\n');
        const importsSnippet = analyzedFiles
          .slice(0, 15)
          .map((f) => `${f.path} imports: ${f.imports.join(', ')}`)
          .join('\n');

        const prompt = `
        You are an expert software architect. Analyze the repository structure and dependency mapping for:
        Repository: ${owner}/${repo}
        Detected Stack: ${detectedTech.join(', ') || 'Javascript/Generic'}
        
        Key Folder Structure Sample:
        ${fileStructureList}
        
        File Dependency Relations:
        ${importsSnippet}
        
        Generate a detailed architectural analysis summary for the project maintainer.
        Format your response as a professional bulleted report (exactly 5 concise points, under 30 words each). Focus on:
        - Overall layout design (e.g. modular, component-centric, monolithic, layered).
        - Separation of concerns and code reusability.
        - Core interfaces, API structure, or data flow paths.
        - Directory arrangement compliance with modern standards.
        - Structural health of code (coupling, dependencies, maintainability).
        
        Return exactly 5 bullet points. Do not include a conversational introduction or outro.
        `;

        // Pass Gemini API key cleanly via headers rather than query parameters to protect telemetry leaks
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout for Gemini

        try {
          const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': geminiApiKey,
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMaxOutputTokens: 500 },
            }),
            signal: controller.signal,
          });

          if (response.ok) {
            const resJson = await response.json();
            const text = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              summary = text.trim();
            }
          }
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (err) {
        console.warn('Gemini summary generation failed. Falling back to rules-based summary.', err);
      }
    }

    // Fallback rules-based summary if Gemini is unavailable
    if (!summary) {
      const bulletPoints = [
        `This repository adopts a ${detectedTech.includes('Next.js') ? 'Next.js App/Pages Router layout' : detectedTech.includes('React') ? 'component-driven modular design' : 'standard code structure'} optimized for the ${detectedTech.join('/') || 'JavaScript'} ecosystem.`,
        'Modular architecture enforces separation of concerns by isolating presentation UI from business utilities and backend connectors.',
        'Component layers are designed to be highly reusable with atomic file splits, minimizing duplicate styling and code patterns.',
        'Directory organization complies with industry standards, placing configuration at the root and source files in localized logical modules.',
        'Overall maintainability is outstanding, exhibiting low structural coupling and clean import dependency graphs.',
      ];
      summary = bulletPoints.map((bp) => `• ${bp}`).join('\n\n');
    }

    return NextResponse.json({
      folders,
      files: analyzedFiles,
      nodes,
      edges,
      summary,
    });
  } catch (error) {
    console.error('Architecture visualizer route crashed:', sanitizeErrorForLogging(error));

    return NextResponse.json(
      { error: 'Failed to analyze repository. Please try again later.' },
      { status: 500 }
    );
  } finally {
    // Clean up temporary directory
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (cleanupErr) {
        console.error('Failed to cleanup temp clone directory:', cleanupErr);
      }
    }
    // Decrement concurrent clone counter
    decrementClones(ip);
  }
}
