import { promptLoader } from './prompt-loader.service.js';
import { logger } from '../../utils/logger.js';

export class PromptBuilderService {
  async buildChatPrompt(_userMessage: string, context: any = {}): Promise<string> {
    try {
      const promptType = context.hasRAG ? 'commands/stream' : 'commands/regular';

      const hasWorkspaceContext = !!(context.nodes && context.nodes.length > 0);

      logger.debug('Chat prompt context received', {
        hasNodes: !!context.nodes,
        nodeCount: context.nodes?.length || 0,
        hasRAG: context.hasRAG,
        hasHistory: context.conversationHistory?.length || 0,
      });

      const systemPrompt = await promptLoader.loadPrompt(promptType, {
        ragContext: context.ragStats,
        conversationHistory: context.conversationHistory || [],
        workspaceName: context.workspaceName,
        hasRAG: context.hasRAG,
        workspaceContext: context.nodes
          ? {
              nodes: context.nodes,
              edges: context.edges || [],
            }
          : null,
        hasWorkspaceContext,
        repositoryInfo: context.repository_owner
          ? {
              owner: context.repository_owner,
              name: context.repository_name,
              branch: context.repository_branch,
            }
          : null,
      });

      logger.debug('Chat prompt built', {
        type: promptType,
        hasWorkspaceContext,
        nodeCount: context.nodes?.length || 0,
        promptLength: systemPrompt.length,
      });

      if (hasWorkspaceContext) {
        const contextSection = systemPrompt.includes('ACTIVE CONTEXT FROM GRAPH')
          ? 'INCLUDES workspace context'
          : 'MISSING workspace context';
        logger.info('System prompt check', {
          hasWorkspaceContext,
          contextSection,
          nodeCount: context.nodes?.length || 0,
        });
      }

      return systemPrompt;
    } catch (error: any) {
      logger.error('Error building chat prompt', error);
      throw error;
    }
  }

  async buildEnhancePrompt(content: string, request: string, context: any = {}): Promise<string> {
    try {
      const systemPrompt = await promptLoader.loadPrompt('operations/enhance', {
        content,
        task: request,
        ...context,
      });

      logger.debug('Enhance prompt built');
      return systemPrompt;
    } catch (error: any) {
      logger.error('Error building enhance prompt', error);
      throw error;
    }
  }

  async buildCommandPrompt(command: string, context: any = {}): Promise<string> {
    try {
      const commandMap: Record<string, string> = {
        active: 'commands/active',
        add: 'commands/add',
        create: 'commands/create',
      };

      const promptPath = commandMap[command];
      if (!promptPath) {
        throw new Error(`Unknown command: ${command}`);
      }

      const systemPrompt = await promptLoader.loadPrompt(promptPath, context);

      logger.debug('Command prompt built', { command });
      return systemPrompt;
    } catch (error: any) {
      logger.error('Error building command prompt', error);
      throw error;
    }
  }
}

export const promptBuilder = new PromptBuilderService();
