#!/usr/bin/env node

/**
 * 開発サーバー自動クリーンアップスクリプト
 *
 * @description
 * 開発サーバー起動時に自動的に.nextディレクトリをクリーンアップし、
 * エラー発生時に自動的に再起動します。
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const NEXT_DIR = path.join(process.cwd(), '.next');
const TURBO_DIR = path.join(process.cwd(), '.turbo');

// ディレクトリを削除する関数
function removeDir(dir) {
  if (fs.existsSync(dir)) {
    console.log(`🧹 Cleaning up ${dir}...`);
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`✅ Cleaned up ${dir}`);
  }
}

// 開発サーバーを起動
function startDevServer() {
  console.log('🚀 Starting development server...');
  
  const devProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
  });

  devProcess.on('error', (error) => {
    console.error('❌ Error starting dev server:', error);
    cleanupAndRestart();
  });

  devProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`❌ Dev server exited with code ${code}`);
      cleanupAndRestart();
    }
  });

  // SIGINT/SIGTERM時のクリーンアップ
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping dev server...');
    devProcess.kill('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Stopping dev server...');
    devProcess.kill('SIGTERM');
    process.exit(0);
  });

  return devProcess;
}

// クリーンアップして再起動
function cleanupAndRestart() {
  console.log('\n🔄 Cleaning up and restarting...');
  removeDir(NEXT_DIR);
  removeDir(TURBO_DIR);
  
  // 少し待ってから再起動
  setTimeout(() => {
    console.log('🔄 Restarting...');
    startDevServer();
  }, 1000);
}

// 初回起動時にクリーンアップ
console.log('🧹 Initial cleanup...');
removeDir(NEXT_DIR);
removeDir(TURBO_DIR);

// 開発サーバーを起動
startDevServer();

