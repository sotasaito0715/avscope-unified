#!/usr/bin/env node

/**
 * Favicon生成スクリプト
 * 
 * @description
 * AV Scope用のFaviconを生成します。
 * 検索・スコープのコンセプトに合わせたデザインを作成します。
 */

const fs = require('fs');
const path = require('path');

// SVG Favicon
const faviconSvg = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- 背景円 -->
  <circle cx="16" cy="16" r="15" fill="#1a1a1a" stroke="#333" stroke-width="2"/>
  
  <!-- スコープ/検索アイコン -->
  <circle cx="16" cy="16" r="8" fill="none" stroke="#00ff88" stroke-width="2"/>
  
  <!-- 中心のドット -->
  <circle cx="16" cy="16" r="2" fill="#00ff88"/>
  
  <!-- クロスヘア -->
  <line x1="16" y1="8" x2="16" y2="24" stroke="#00ff88" stroke-width="1.5"/>
  <line x1="8" y1="16" x2="24" y2="16" stroke="#00ff88" stroke-width="1.5"/>
  
  <!-- 装飾的な外側の円 -->
  <circle cx="16" cy="16" r="11" fill="none" stroke="#00ff88" stroke-width="1" opacity="0.3"/>
</svg>`;

// Apple Touch Icon (180x180)
const appleTouchIconSvg = `<svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="180" height="180" rx="20" fill="#1a1a1a"/>
  <circle cx="90" cy="90" r="45" fill="none" stroke="#00ff88" stroke-width="4"/>
  <circle cx="90" cy="90" r="10" fill="#00ff88"/>
  <line x1="90" y1="45" x2="90" y2="135" stroke="#00ff88" stroke-width="3"/>
  <line x1="45" y1="90" x2="135" y2="90" stroke="#00ff88" stroke-width="3"/>
  <circle cx="90" cy="90" r="60" fill="none" stroke="#00ff88" stroke-width="2" opacity="0.3"/>
</svg>`;

// 16x16 Favicon
const favicon16Svg = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="8" cy="8" r="7" fill="#1a1a1a" stroke="#333" stroke-width="1"/>
  <circle cx="8" cy="8" r="4" fill="none" stroke="#00ff88" stroke-width="1"/>
  <circle cx="8" cy="8" r="1" fill="#00ff88"/>
  <line x1="8" y1="4" x2="8" y2="12" stroke="#00ff88" stroke-width="0.8"/>
  <line x1="4" y1="8" x2="12" y2="8" stroke="#00ff88" stroke-width="0.8"/>
</svg>`;

// 32x32 Favicon
const favicon32Svg = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="16" cy="16" r="15" fill="#1a1a1a" stroke="#333" stroke-width="2"/>
  <circle cx="16" cy="16" r="8" fill="none" stroke="#00ff88" stroke-width="2"/>
  <circle cx="16" cy="16" r="2" fill="#00ff88"/>
  <line x1="16" y1="8" x2="16" y2="24" stroke="#00ff88" stroke-width="1.5"/>
  <line x1="8" y1="16" x2="24" y2="16" stroke="#00ff88" stroke-width="1.5"/>
  <circle cx="16" cy="16" r="11" fill="none" stroke="#00ff88" stroke-width="1" opacity="0.3"/>
</svg>`;

// 48x48 Favicon
const favicon48Svg = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="24" cy="24" r="22" fill="#1a1a1a" stroke="#333" stroke-width="2"/>
  <circle cx="24" cy="24" r="12" fill="none" stroke="#00ff88" stroke-width="2"/>
  <circle cx="24" cy="24" r="3" fill="#00ff88"/>
  <line x1="24" y1="12" x2="24" y2="36" stroke="#00ff88" stroke-width="2"/>
  <line x1="12" y1="24" x2="36" y2="24" stroke="#00ff88" stroke-width="2"/>
  <circle cx="24" cy="24" r="16" fill="none" stroke="#00ff88" stroke-width="1" opacity="0.3"/>
</svg>`;

// ファイルを保存
const publicDir = path.join(__dirname, '..', 'public');

// SVG Favicon
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg);
console.log('✅ favicon.svg created');

// Apple Touch Icon
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.svg'), appleTouchIconSvg);
console.log('✅ apple-touch-icon.svg created');

// 16x16 Favicon
fs.writeFileSync(path.join(publicDir, 'favicon-16x16.svg'), favicon16Svg);
console.log('✅ favicon-16x16.svg created');

// 32x32 Favicon
fs.writeFileSync(path.join(publicDir, 'favicon-32x32.svg'), favicon32Svg);
console.log('✅ favicon-32x32.svg created');

// 48x48 Favicon
fs.writeFileSync(path.join(publicDir, 'favicon-48x48.svg'), favicon48Svg);
console.log('✅ favicon-48x48.svg created');

console.log('\n🎉 All favicon files generated successfully!');
console.log('\n📁 Generated files:');
console.log('  - favicon.svg (32x32)');
console.log('  - apple-touch-icon.svg (180x180)');
console.log('  - favicon-16x16.svg (16x16)');
console.log('  - favicon-32x32.svg (32x32)');
console.log('  - favicon-48x48.svg (48x48)');
