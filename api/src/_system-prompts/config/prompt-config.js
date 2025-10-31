import nunjucks from 'nunjucks';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROMPTS_DIR = join(__dirname, '..');

// Configurar Nunjucks
const env = nunjucks.configure(PROMPTS_DIR, {
  autoescape: false, // Não fazer escape HTML
  trimBlocks: true, // Remove whitespace depois de tags
  lstripBlocks: true, // Remove whitespace antes de tags
});

// Filtros customizados
env.addFilter('truncate', function (str, length = 500) {
  if (!str || str.length <= length) return str;
  return str.substring(0, length - 3) + '...';
});

env.addFilter('capitalize', function (str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
});

// Cache de prompts (opcional - útil para produção)
const promptCache = new Map();
let cacheEnabled = process.env.NODE_ENV === 'production';

/**
 * Carrega e renderiza um prompt template
 *
 * @param {string} promptPath - Caminho relativo do prompt (ex: 'commands/stream')
 * @param {object} data - Dados para o template
 * @param {object} options - Opções adicionais
 * @param {string} options.variant - Variante do prompt (ex: 'experimental')
 * @param {boolean} options.cache - Forçar uso/não-uso de cache
 * @returns {Promise<string>} Prompt renderizado
 *
 * @example
 * const prompt = await loadPrompt('commands/stream', {
 *   ragContext: { contextText: '...', stats: {...} },
 *   conversationHistory: messages,
 *   workspaceName: 'my-project'
 * });
 */
export async function loadPrompt(promptPath, data = {}, options = {}) {
  const { variant = 'default', cache = cacheEnabled } = options;

  // Normalizar path
  const normalizedPath = promptPath.endsWith('.njk') ? promptPath : `${promptPath}.njk`;

  // Verificar cache
  const cacheKey = `${normalizedPath}:${variant}:${JSON.stringify(data)}`;
  if (cache && promptCache.has(cacheKey)) {
    return promptCache.get(cacheKey);
  }

  try {
    // Carregar metadata se necessário
    const metadata = await getPromptMetadata(promptPath);

    // Log para tracking (opcional)
    if (process.env.LOG_PROMPTS === 'true') {
      console.log(`[Prompt] Loading: ${normalizedPath} (v${metadata?.version || 'unknown'})`);
    }

    // Renderizar template
    const rendered = env.render(normalizedPath, {
      ...data,
      // Adicionar helpers úteis
      _metadata: metadata,
      _timestamp: new Date().toISOString(),
      _variant: variant,
    });

    // Armazenar em cache se habilitado
    if (cache) {
      promptCache.set(cacheKey, rendered);
    }

    return rendered;
  } catch (error) {
    console.error(`[Prompt] Error loading ${normalizedPath}:`, error);
    throw new Error(`Failed to load prompt: ${promptPath} - ${error.message}`);
  }
}

/**
 * Carrega metadata de um prompt
 */
async function getPromptMetadata(promptPath) {
  try {
    const versionsPath = join(__dirname, 'prompt-versions.json');
    const versionsData = await readFile(versionsPath, 'utf-8');
    const versions = JSON.parse(versionsData);

    // Remover extensão se tiver
    const cleanPath = promptPath.replace(/\.njk$/, '');

    return versions.prompts?.[cleanPath] || versions.base?.[cleanPath] || null;
  } catch (error) {
    console.warn(`[Prompt] Could not load metadata for ${promptPath}:`, error.message);
    return null;
  }
}

/**
 * Lista todos os prompts disponíveis
 */
export async function listAvailablePrompts() {
  try {
    const versionsPath = join(__dirname, 'prompt-versions.json');
    const versionsData = await readFile(versionsPath, 'utf-8');
    const versions = JSON.parse(versionsData);

    return {
      prompts: Object.keys(versions.prompts || {}),
      base: Object.keys(versions.base || {}),
    };
  } catch (error) {
    console.error('[Prompt] Error listing prompts:', error);
    return { prompts: [], base: [] };
  }
}

/**
 * Limpa o cache de prompts
 */
export function clearPromptCache() {
  promptCache.clear();
  console.log('[Prompt] Cache cleared');
}

/**
 * Habilita/desabilita cache de prompts
 */
export function setPromptCache(enabled) {
  cacheEnabled = enabled;
  if (!enabled) {
    clearPromptCache();
  }
  console.log(`[Prompt] Cache ${enabled ? 'enabled' : 'disabled'}`);
}

/**
 * Pré-carrega prompts comuns (útil no startup)
 */
export async function preloadCommonPrompts() {
  const commonPrompts = ['commands/stream', 'commands/regular', 'commands/create'];

  console.log('[Prompt] Preloading common prompts...');

  const results = await Promise.allSettled(
    commonPrompts.map((path) =>
      loadPrompt(path, {}, { cache: true }).catch((err) => {
        console.warn(`[Prompt] Failed to preload ${path}:`, err.message);
      })
    )
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  console.log(`[Prompt] Preloaded ${succeeded}/${commonPrompts.length} prompts`);
}

// Export para uso direto do nunjucks env se necessário
export { env as nunjucksEnv };
