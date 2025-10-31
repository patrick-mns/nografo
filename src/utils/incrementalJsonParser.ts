export interface ParsedNode {
  id: string;
  type?: string;
  position?: { x: number; y: number };
  data: {
    label: string;
    content: string;
    active?: boolean;
  };
}

export interface ParsedEdge {
  id?: string;
  source: string;
  target: string;
  type?: string;
}

export interface ParsedGraph {
  nodes: ParsedNode[];
  edges: ParsedEdge[];
}

export interface IncrementalUpdate {
  type: 'node' | 'edge' | 'complete';
  data: ParsedNode | ParsedEdge | ParsedGraph | null;
  isPartial: boolean;
}

export class IncrementalJsonParser {
  private buffer: string = '';
  private currentNodes: ParsedNode[] = [];
  private currentEdges: ParsedEdge[] = [];
  private inNodesArray: boolean = false;
  private inEdgesArray: boolean = false;

  addChunk(chunk: string): IncrementalUpdate[] {
    this.buffer += chunk;
    return this.processBuffer();
  }

  private processBuffer(): IncrementalUpdate[] {
    const updates: IncrementalUpdate[] = [];

    const nodeUpdates = this.extractNodes();
    const edgeUpdates = this.extractEdges();

    updates.push(...nodeUpdates, ...edgeUpdates);

    if (this.isGraphComplete()) {
      const graph: ParsedGraph = {
        nodes: this.currentNodes,
        edges: this.currentEdges,
      };
      updates.push({
        type: 'complete',
        data: graph,
        isPartial: false,
      });
    }

    return updates;
  }

  private extractNodes(): IncrementalUpdate[] {
    const updates: IncrementalUpdate[] = [];

    if (!this.inNodesArray) {
      const nodesMatch = this.buffer.match(/"nodes"\s*:\s*\[/);
      if (nodesMatch) {
        this.inNodesArray = true;
        this.buffer = this.buffer.substring(nodesMatch.index! + nodesMatch[0].length);
      }
    }

    if (this.inNodesArray) {
      const extracted = this.extractCompleteObjects(this.buffer);

      for (const obj of extracted.objects) {
        try {
          const node = this.parseNode(obj);
          if (node) {
            this.currentNodes.push(node);
            updates.push({
              type: 'node',
              data: node,
              isPartial: false,
            });
          }
        } catch {
          console.warn('Failed to parse node');
        }
      }

      this.buffer = extracted.remaining;

      if (this.buffer.includes(']')) {
        const endIdx = this.buffer.indexOf(']');
        this.buffer = this.buffer.substring(endIdx + 1);
        this.inNodesArray = false;
      }
    }

    return updates;
  }

  private extractEdges(): IncrementalUpdate[] {
    const updates: IncrementalUpdate[] = [];

    if (!this.inEdgesArray) {
      const edgesMatch = this.buffer.match(/"edges"\s*:\s*\[/);
      if (edgesMatch) {
        this.inEdgesArray = true;
        this.buffer = this.buffer.substring(edgesMatch.index! + edgesMatch[0].length);
      }
    }

    if (this.inEdgesArray) {
      const extracted = this.extractCompleteObjects(this.buffer);

      for (const obj of extracted.objects) {
        try {
          const edge = this.parseEdge(obj);
          if (edge) {
            this.currentEdges.push(edge);
            updates.push({
              type: 'edge',
              data: edge,
              isPartial: false,
            });
          }
        } catch {
          console.warn('Failed to parse edge');
        }
      }

      this.buffer = extracted.remaining;

      if (this.buffer.includes(']')) {
        const endIdx = this.buffer.indexOf(']');
        this.buffer = this.buffer.substring(endIdx + 1);
        this.inEdgesArray = false;
      }
    }

    return updates;
  }

  private extractCompleteObjects(text: string): { objects: string[]; remaining: string } {
    const objects: string[] = [];
    let depth = 0;
    let objStart = -1;
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === '{') {
        if (depth === 0) {
          objStart = i;
        }
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0 && objStart !== -1) {
          const objText = text.substring(objStart, i + 1);
          objects.push(objText);
          objStart = -1;
        }
      }
    }

    let remaining = text;
    if (objects.length > 0) {
      const lastObjEnd = text.lastIndexOf('}') + 1;
      remaining = text.substring(lastObjEnd);
    }

    return { objects, remaining };
  }

  private parseNode(jsonText: string): ParsedNode | null {
    try {
      const obj = JSON.parse(jsonText);

      if (!obj.id || !obj.data || !obj.data.label) {
        return null;
      }

      return {
        id: obj.id,
        type: obj.type || 'contextNode',
        position: obj.position || { x: 0, y: 0 },
        data: {
          label: obj.data.label,
          content: obj.data.content || '',
          active: obj.data.active !== undefined ? obj.data.active : false,
        },
      };
    } catch (e) {
      return null;
    }
  }

  private parseEdge(jsonText: string): ParsedEdge | null {
    try {
      const obj = JSON.parse(jsonText);

      if (!obj.source || !obj.target) {
        return null;
      }

      return {
        id: obj.id,
        source: obj.source,
        target: obj.target,
        type: obj.type || 'default',
      };
    } catch (e) {
      return null;
    }
  }

  private isGraphComplete(): boolean {
    return !this.inNodesArray && !this.inEdgesArray && this.currentNodes.length > 0;
  }

  getCurrentState(): ParsedGraph {
    return {
      nodes: this.currentNodes,
      edges: this.currentEdges,
    };
  }

  reset(): void {
    this.buffer = '';
    this.currentNodes = [];
    this.currentEdges = [];
    this.inNodesArray = false;
    this.inEdgesArray = false;
  }

  finalize(): ParsedGraph {
    if (this.buffer.trim()) {
      try {
        const fullJson = this.extractFullJson(this.buffer);
        if (fullJson) {
          const graph = JSON.parse(fullJson) as ParsedGraph;
          if (graph.nodes) {
            this.currentNodes = graph.nodes;
          }
          if (graph.edges) {
            this.currentEdges = graph.edges;
          }
        }
      } catch {
        console.warn('Failed to parse final buffer');
      }
    }

    return this.getCurrentState();
  }

  private extractFullJson(text: string): string | null {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        JSON.parse(match[0]);
        return match[0];
      } catch (e) {
        return null;
      }
    }
    return null;
  }
}

export function createStreamParser() {
  return new IncrementalJsonParser();
}
