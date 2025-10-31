const fs = require('fs').promises;
const path = require('path');

class GraphsOperations {
  constructor(logger) {
    this.logger = logger;
  }

  async listGraphs(workspacePath) {
    if (!workspacePath) {
      throw new Error('No workspace selected');
    }

    const graphsPath = path.join(workspacePath, '.nografo', 'graphs');

    this.logger.debug('Scanning graphs directory', { path: graphsPath });

    try {
      const files = await fs.readdir(graphsPath);

      const graphs = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(graphsPath, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const graph = JSON.parse(content);

          graphs.push({
            id: path.basename(file, '.json'),
            name: graph.name || 'Untitled',
            createdAt: graph.createdAt,
            updatedAt: graph.updatedAt,
            nodeCount: graph.nodes?.length || 0,
          });
        }
      }

      this.logger.debug('Graphs loaded', { count: graphs.length });

      return graphs.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      this.logger.error('Failed to list graphs', { error: error.message, path: graphsPath });
      return [];
    }
  }

  async saveGraph(workspacePath, graphId, graphData) {
    if (!workspacePath) {
      throw new Error('No workspace selected');
    }

    const graphPath = path.join(workspacePath, '.nografo', 'graphs', `${graphId}.json`);

    const dataToSave = {
      ...graphData,
      id: graphId,
      name: graphData.name || graphId,
      updatedAt: new Date().toISOString(),
      createdAt: graphData.createdAt || new Date().toISOString(),
    };

    await fs.writeFile(graphPath, JSON.stringify(dataToSave, null, 2));
    this.logger.info('Graph saved successfully', {
      graphId,
      name: dataToSave.name,
      nodes: dataToSave.nodes?.length || 0,
    });

    return true;
  }

  async loadGraph(workspacePath, graphId) {
    if (!workspacePath) {
      throw new Error('No workspace selected');
    }

    const graphPath = path.join(workspacePath, '.nografo', 'graphs', `${graphId}.json`);

    const content = await fs.readFile(graphPath, 'utf-8');
    return JSON.parse(content);
  }

  async deleteGraph(workspacePath, graphId) {
    if (!workspacePath) {
      throw new Error('No workspace selected');
    }

    const graphPath = path.join(workspacePath, '.nografo', 'graphs', `${graphId}.json`);

    await fs.unlink(graphPath);

    this.logger.info('Graph deleted successfully', { graphId });
    return true;
  }
}

module.exports = GraphsOperations;
