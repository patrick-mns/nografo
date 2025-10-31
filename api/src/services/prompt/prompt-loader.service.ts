import nunjucks from 'nunjucks';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile } from 'fs/promises';
import { logger } from '../../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROMPTS_DIR = join(__dirname, '../../_system-prompts');

const env = nunjucks.configure(PROMPTS_DIR, {
  autoescape: false,
  trimBlocks: true,
  lstripBlocks: true,
});

env.addFilter('truncate', function (str: string, length = 500) {
  if (!str || str.length <= length) return str;
  return str.substring(0, length - 3) + '...';
});

env.addFilter('capitalize', function (str: string) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
});

const promptCache = new Map<string, string>();
const cacheEnabled = process.env.ENABLE_PROMPT_CACHE === 'true';

export interface PromptMetadata {
  version: string;
  lastUpdated: string;
  changes?: string;
}

export interface PromptLoadOptions {
  variant?: string;
  cache?: boolean;
}

export class PromptLoaderService {
  async loadPrompt(
    promptPath: string,
    data: any = {},
    options: PromptLoadOptions = {}
  ): Promise<string> {
    const { variant = 'default', cache = cacheEnabled } = options;

    const normalizedPath = promptPath.endsWith('.njk') ? promptPath : `${promptPath}.njk`;

    const cacheKey = `${normalizedPath}:${variant}:${JSON.stringify(data)}`;
    if (cache && promptCache.has(cacheKey)) {
      logger.debug('Prompt loaded from cache', { path: normalizedPath });
      return promptCache.get(cacheKey)!;
    }

    try {
      const metadata = await this.getPromptMetadata(promptPath);

      if (process.env.LOG_PROMPTS === 'true') {
        logger.info(`Loading prompt: ${normalizedPath} (v${metadata?.version || 'unknown'})`);
      }

      const rendered = env.render(normalizedPath, {
        ...data,
        _metadata: metadata,
        _timestamp: new Date().toISOString(),
        _variant: variant,
      });

      if (cache) {
        promptCache.set(cacheKey, rendered);
      }

      return rendered;
    } catch (error: any) {
      logger.error(`Error loading prompt ${normalizedPath}`, error);
      throw new Error(`Failed to load prompt: ${promptPath} - ${error.message}`);
    }
  }

  async getPromptMetadata(promptPath: string): Promise<PromptMetadata | null> {
    try {
      const versionsPath = join(PROMPTS_DIR, 'config', 'prompt-versions.json');
      const versionsData = await readFile(versionsPath, 'utf-8');
      const versions = JSON.parse(versionsData);

      const normalizedPath = promptPath.replace(/\.njk$/, '');

      return versions[normalizedPath] || null;
    } catch (error) {
      logger.debug('No metadata found for prompt', { path: promptPath });
      return null;
    }
  }

  clearCache(): void {
    promptCache.clear();
    logger.info('Prompt cache cleared');
  }
}

export const promptLoader = new PromptLoaderService();
