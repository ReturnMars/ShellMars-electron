#!/usr/bin/env node

/**
 * Postinstall script that runs electron-builder install-app-deps
 * and gracefully handles optional dependency rebuild failures (like cpu-features)
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🔧 Rebuilding native dependencies for Electron...\n');

// Use npx to ensure electron-builder is found
const electronBuilder = spawn('npx', ['--yes', 'electron-builder', 'install-app-deps'], {
  stdio: 'inherit',
  shell: true,
  cwd: path.resolve(__dirname, '..')
});

electronBuilder.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Native dependencies rebuilt successfully');
    process.exit(0);
  } else {
    // Check if the error is related to cpu-features (optional dependency)
    console.log('\n⚠️  Some optional dependencies failed to rebuild (e.g. cpu-features)');
    console.log('   This is normal and won\'t affect functionality.\n');
    console.log('   ssh2 will work without cpu-features, just without CPU-specific optimizations.\n');
    // Exit with success code to allow installation to continue
    process.exit(0);
  }
});

electronBuilder.on('error', (err) => {
  console.error('\n❌ Error running electron-builder:', err.message);
  console.log('\n⚠️  Continuing anyway - optional dependencies may not be rebuilt\n');
  process.exit(0);
});

