/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function normalizePath(filePath) {
  // Replace build ID folder (e.g. static/oRr73JL35eL4J_9y-Ef4Q/_buildManifest.js -> static/[build-id]/_buildManifest.js)
  let normalized = filePath.replace(
    /static\/[^/]+\/(_buildManifest|_ssgManifest)\.js$/,
    'static/[build-id]/$1.js'
  );

  // Replace hex hashes preceded by dash or dot (e.g. -711ef29bc66f648c or .dac65e4204a83905)
  normalized = normalized.replace(/[-.][a-f0-9]{8,24}(?=\.js|\.css)/gi, '-[hash]');

  // Replace pure hex filenames (e.g. static/css/9186d3cc0904cc35.css -> static/css/[hash].css)
  normalized = normalized.replace(/\/([a-f0-9]{8,24})\.(js|css)$/gi, '/[hash].$2');

  return normalized;
}

function walkDir(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, fileList);
    } else {
      if (file.endsWith('.js') || file.endsWith('.css')) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

function measureBundle() {
  const staticDir = path.join(process.cwd(), '.next', 'static');
  if (!fs.existsSync(staticDir)) {
    console.error('No .next/static directory found. Make sure to run npm run build first.');
    process.exit(1);
  }
  const files = walkDir(staticDir);
  const results = {};

  for (const file of files) {
    const relativePath = path.relative(path.join(process.cwd(), '.next'), file).replace(/\\/g, '/');
    const content = fs.readFileSync(file);
    const size = content.length;
    const gzipped = zlib.gzipSync(content).length;

    const norm = normalizePath(relativePath);
    if (!results[norm]) {
      results[norm] = { size: 0, gzipped: 0, filesCount: 0 };
    }
    results[norm].size += size;
    results[norm].gzipped += gzipped;
    results[norm].filesCount += 1;
  }

  const outputJson = JSON.stringify(results, null, 2);
  const outputPath = process.argv[2];

  if (outputPath) {
    fs.writeFileSync(outputPath, outputJson, 'utf8');
    console.log(`Saved bundle size measurements to ${outputPath}`);
  } else {
    console.log(outputJson);
  }
}

measureBundle();
