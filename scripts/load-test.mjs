// Native Node.js Load Testing Script (Zero Dependencies)
// Usage: node scripts/load-test.mjs

const TARGET_URL = process.env.TARGET_URL || 'http://localhost:3000/api/streak?user=souravjhahind';
const CONCURRENCY = 50;
const DURATION_MS = 10000; // 10 seconds

console.log(`Starting native load test against ${TARGET_URL}...`);
console.log(`Concurrency: ${CONCURRENCY}, Duration: ${DURATION_MS / 1000}s\n`);

let totalRequests = 0;
let errors = 0;
let isRunning = true;

const startTime = Date.now();

// Stop the test after DURATION_MS
setTimeout(() => {
  isRunning = false;
}, DURATION_MS);

async function worker() {
  while (isRunning) {
    try {
      const res = await fetch(TARGET_URL);
      // Consume the response body to avoid memory leaks
      await res.arrayBuffer(); 
      if (!res.ok) {
        errors++;
      }
      totalRequests++;
    } catch (e) {
      errors++;
      totalRequests++;
    }
  }
}

async function run() {
  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);

  const durationSec = (Date.now() - startTime) / 1000;
  const requestsPerSec = (totalRequests / durationSec).toFixed(2);

  console.log('--- Load Test Results ---');
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Requests/sec:   ${requestsPerSec}`);
  console.log(`Errors:         ${errors}`);
  
  if (errors > 0) {
    console.error('\nTest resulted in errors! The endpoint may be failing under load.');
    process.exit(1);
  } else {
    console.log('\nSuccess! Endpoint handled the massive scaling test without errors.');
  }
}

run();
