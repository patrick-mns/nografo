import type { Node, Edge } from '@/store/graphStore';

export interface ExportOptions {
  includeInactiveNodes?: boolean;
  includeMetadata?: boolean;
  includeConnections?: boolean;
  promptInfo?: {
    provider: string;
    model?: string;
    promptType?: string;
  };
  userPrompt?: string;
}

export function generateContextMarkdown(
  nodes: Node[],
  edges: Edge[],
  options: ExportOptions = {}
): string {
  const {
    includeInactiveNodes = false,
    includeMetadata = true,
    includeConnections = true,
  } = options;

  const activeNodes = includeInactiveNodes ? nodes : nodes.filter((node) => node.data.active);

  if (activeNodes.length === 0) {
    return '# Context\n\nNo active nodes found.\n';
  }

  let markdown = '# Active Context\n\n';

  if (options.userPrompt) {
    markdown += `**User Prompt:**\n`;
    markdown += `> ${options.userPrompt}\n\n`;
  }

  if (options.promptInfo) {
    markdown += `**AI Configuration Used:**\n`;
    markdown += `- Provider: ${options.promptInfo.provider.toUpperCase()}\n`;
    if (options.promptInfo.model) {
      markdown += `- Model: ${options.promptInfo.model}\n`;
    }
    if (options.promptInfo.promptType) {
      markdown += `- Prompt Type: ${options.promptInfo.promptType}\n`;
    }
    markdown += '\n';
  }

  if (includeMetadata) {
    markdown += `> Generated: ${new Date().toISOString()}\n`;
    markdown += `> Active Nodes: ${activeNodes.length}\n`;
    if (!includeInactiveNodes) {
      markdown += `> Total Nodes: ${nodes.length}\n`;
    }
    markdown += '\n---\n\n';
  }

  const nodesByGraph = new Map<string, typeof activeNodes>();
  activeNodes.forEach((node) => {
    const graphId = node.data.graphId || 'current';
    if (!nodesByGraph.has(graphId)) {
      nodesByGraph.set(graphId, []);
    }
    nodesByGraph.get(graphId)!.push(node);
  });

  let nodeIndex = 0;
  nodesByGraph.forEach((graphNodes, graphId) => {
    if (nodesByGraph.size > 1) {
      const graphName = graphNodes[0]?.data.graphName || graphId;
      markdown += `### 📊 Graph: ${graphName}\n\n`;
    }

    graphNodes.forEach((node) => {
      nodeIndex++;
      markdown += `## ${nodeIndex}. ${node.data.label}\n\n`;

      if (includeMetadata) {
        markdown += `**ID:** \`${node.id}\`\n\n`;
        markdown += `**Type:** ${node.type || 'contextNode'}\n\n`;

        if (node.data.graphId && nodesByGraph.size > 1) {
          markdown += `**Source Graph:** ${node.data.graphName || node.data.graphId}\n\n`;
        }

        if (node.data.attachedFiles && node.data.attachedFiles.length > 0) {
          markdown += `**Attached Files:**\n`;
          node.data.attachedFiles.forEach((file) => {
            markdown += `- \`${file.path}\`\n`;
          });
          markdown += '\n';
        }
      }

      if (node.data.content) {
        markdown += `${node.data.content}\n\n`;
      }

      markdown += '---\n\n';
    });
  });

  if (includeConnections) {
    const activeNodeIds = new Set(activeNodes.map((n) => n.id));
    const activeEdges = edges.filter(
      (edge) => activeNodeIds.has(edge.source) && activeNodeIds.has(edge.target)
    );

    if (activeEdges.length > 0) {
      markdown += '## Connections\n\n';
      markdown += 'Graph connections between active nodes:\n\n';

      activeEdges.forEach((edge) => {
        const sourceNode = nodes.find((n) => n.id === edge.source);
        const targetNode = nodes.find((n) => n.id === edge.target);

        if (sourceNode && targetNode) {
          markdown += `- **${sourceNode.data.label}** → **${targetNode.data.label}**\n`;
        }
      });

      markdown += '\n';
    }
  }

  return markdown;
}

export function generateContextText(nodes: Node[]): string {
  const activeNodes = nodes.filter((node) => node.data.active);

  if (activeNodes.length === 0) {
    return 'No active context found.';
  }

  return activeNodes.map((node) => `${node.data.label}: ${node.data.content}`).join('\n\n');
}

export function generateContextJSON(nodes: Node[], edges: Edge[], includeInactive = false): string {
  const filteredNodes = includeInactive ? nodes : nodes.filter((node) => node.data.active);

  const activeNodeIds = new Set(filteredNodes.map((n) => n.id));
  const filteredEdges = edges.filter(
    (edge) => activeNodeIds.has(edge.source) && activeNodeIds.has(edge.target)
  );

  return JSON.stringify(
    {
      nodes: filteredNodes,
      edges: filteredEdges,
      metadata: {
        exportedAt: new Date().toISOString(),
        nodeCount: filteredNodes.length,
        edgeCount: filteredEdges.length,
      },
    },
    null,
    2
  );
}
