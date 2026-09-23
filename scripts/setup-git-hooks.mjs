#!/usr/bin/env node

/**
 * リポジトリ同梱の .githooks を .git/hooks にインストールする。
 * （git config は変更しない）
 */

import { copyFileSync, chmodSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcDir = path.join(root, '.githooks');
const destDir = path.join(root, '.git', 'hooks');

const hooks = ['pre-commit'];

if (!existsSync(path.join(root, '.git'))) {
  console.warn('setup-git-hooks: .git が見つからないためスキップします');
  process.exit(0);
}

mkdirSync(destDir, { recursive: true });

for (const name of hooks) {
  const src = path.join(srcDir, name);
  const dest = path.join(destDir, name);
  if (!existsSync(src)) {
    console.warn(`setup-git-hooks: missing ${src}`);
    continue;
  }
  copyFileSync(src, dest);
  chmodSync(dest, 0o755);
  console.log(`setup-git-hooks: installed ${name}`);
}
