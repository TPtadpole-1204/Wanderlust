// Global localStorage polyfill for Node.js CLI verification environment
if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => {
      store[key] = String(val);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
  };
}

async function main() {
  const { runAllVerificationTests } = await import('./services/verificationSuite.ts');
  const { INITIAL_TOKYO_TRIP } = await import('./services/storage.ts');

  console.log('======================================================');
  console.log('🧪 Wanderlust 系統操作與常理邏輯自動化驗證測試 (CLI)');
  console.log('======================================================\n');

  const report = runAllVerificationTests(INITIAL_TOKYO_TRIP);

  for (const res of report.results) {
    const statusIcon = res.passed ? '✅ [PASS]' : '❌ [FAIL]';
    console.log(`${statusIcon} [${res.category}] ${res.name} (${res.durationMs}ms)`);
    console.log(`   └─ ${res.details}\n`);
  }

  console.log('------------------------------------------------------');
  console.log(
    `📊 測試總結：共 ${report.totalChecks} 項檢測 | 通過: ${report.passedChecks} | 失敗: ${report.failedChecks}`
  );
  console.log('------------------------------------------------------');

  if (report.failedChecks > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Verification execution error:', err);
  process.exit(1);
});
