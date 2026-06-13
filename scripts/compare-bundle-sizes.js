/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');

function formatSize(bytes) {
  const absBytes = Math.abs(bytes);
  const val = (absBytes / 1024).toFixed(2) + ' KB';
  return bytes < 0 ? `-${val}` : val;
}

function formatDiff(bytes, baseBytes) {
  if (bytes === 0) return '0 B';
  const val = formatSize(bytes);
  const pct = baseBytes > 0 ? ((bytes / baseBytes) * 100).toFixed(2) + '%' : '+100%';
  const sign = bytes > 0 ? '+' : '';
  return `${sign}${val} (${sign}${pct})`;
}

function main() {
  const prPath = process.argv[2];
  const basePath = process.argv[3];

  if (!prPath || !basePath) {
    console.error('Usage: node compare-bundle-sizes.js <pr-sizes.json> <base-sizes.json>');
    process.exit(1);
  }

  const prData = JSON.parse(fs.readFileSync(prPath, 'utf8'));
  const baseData = JSON.parse(fs.readFileSync(basePath, 'utf8'));

  const allKeys = Array.from(new Set([...Object.keys(prData), ...Object.keys(baseData)])).sort();

  const rows = [];
  let prTotalJS = 0;
  let baseTotalJS = 0;
  let prTotalCSS = 0;
  let baseTotalCSS = 0;

  for (const key of allKeys) {
    const pr = prData[key] || { size: 0, gzipped: 0 };
    const base = baseData[key] || { size: 0, gzipped: 0 };

    const sizeDiff = pr.size - base.size;
    const gzipDiff = pr.gzipped - base.gzipped;

    if (key.endsWith('.js')) {
      prTotalJS += pr.size;
      baseTotalJS += base.size;
    } else if (key.endsWith('.css')) {
      prTotalCSS += pr.size;
      baseTotalCSS += base.size;
    }

    // Only show individual files with a difference > 100 bytes to keep the table clean
    if (Math.abs(sizeDiff) > 100 || Math.abs(gzipDiff) > 100) {
      let status = '⚪';
      if (!baseData[key]) status = '🆕 New';
      else if (!prData[key]) status = '🗑️ Deleted';
      else if (gzipDiff > 0) status = '🔴 Regression';
      else if (gzipDiff < 0) status = '🟢 Improvement';

      rows.push({
        asset: `\`${key}\``,
        prSize: pr.gzipped > 0 ? formatSize(pr.gzipped) : '-',
        baseSize: base.gzipped > 0 ? formatSize(base.gzipped) : '-',
        diff: formatDiff(gzipDiff, base.gzipped),
        status,
      });
    }
  }

  console.log('### 📦 Next.js Bundle Size Report (Gzipped Sizes)\n');
  if (rows.length === 0) {
    console.log('✨ No significant bundle size changes detected.');
  } else {
    console.log('| Asset | PR Size | Base Size | Difference | Status |');
    console.log('| :--- | :--- | :--- | :--- | :--- |');
    for (const r of rows) {
      console.log(`| ${r.asset} | ${r.prSize} | ${r.baseSize} | ${r.diff} | ${r.status} |`);
    }
  }

  console.log('\n### 📊 Summary of Totals\n');
  console.log('| Category | PR Size | Base Size | Difference |');
  console.log('| :--- | :--- | :--- | :--- |');

  const jsDiff = prTotalJS - baseTotalJS;
  console.log(
    `| **Total JS** | ${formatSize(prTotalJS)} | ${formatSize(baseTotalJS)} | ${formatDiff(jsDiff, baseTotalJS)} |`
  );

  const cssDiff = prTotalCSS - baseTotalCSS;
  console.log(
    `| **Total CSS** | ${formatSize(prTotalCSS)} | ${formatSize(baseTotalCSS)} | ${formatDiff(cssDiff, baseTotalCSS)} |`
  );
}

main();
