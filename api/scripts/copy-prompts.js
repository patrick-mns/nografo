#!/usr/bin/env node

import { cp } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const srcDir = join(__dirname, '..', 'src', '_system-prompts');
const distDir = join(__dirname, '..', 'dist', '_system-prompts');

async function copyPrompts() {
  try {
    console.log('📋 Copying system prompts to dist...');
    await cp(srcDir, distDir, { recursive: true });
    console.log('✅ System prompts copied successfully!');
  } catch (error) {
    console.error('❌ Error copying system prompts:', error);
    process.exit(1);
  }
}

copyPrompts();
