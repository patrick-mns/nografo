const path = require('path');

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

function validateFilePath(filePath, workspacePath) {
  if (!filePath || typeof filePath !== 'string') {
    throw new ValidationError('Invalid file path: must be a non-empty string');
  }

  const normalized = path.normalize(filePath);

  if (normalized.includes('..')) {
    throw new ValidationError('Invalid file path: path traversal not allowed');
  }

  if (workspacePath) {
    const absolutePath = path.isAbsolute(normalized)
      ? normalized
      : path.join(workspacePath, normalized);

    const relative = path.relative(workspacePath, absolutePath);

    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new ValidationError('Invalid file path: must be within workspace');
    }
  }

  return normalized;
}

function validateGraphId(graphId) {
  if (!graphId || typeof graphId !== 'string') {
    throw new ValidationError('Invalid graph ID: must be a non-empty string');
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(graphId)) {
    throw new ValidationError(
      'Invalid graph ID: only alphanumeric characters, hyphens, and underscores allowed'
    );
  }

  if (graphId.length > 100) {
    throw new ValidationError('Invalid graph ID: maximum length is 100 characters');
  }

  return graphId;
}

function validateFileContent(content) {
  if (content === null || content === undefined) {
    throw new ValidationError('Invalid content: cannot be null or undefined');
  }

  if (typeof content !== 'string') {
    throw new ValidationError('Invalid content: must be a string');
  }

  const maxSize = 10 * 1024 * 1024;
  if (content.length > maxSize) {
    throw new ValidationError(`Invalid content: exceeds maximum size of ${maxSize} bytes`);
  }

  return content;
}

function validateCommitMessage(message) {
  if (!message || typeof message !== 'string') {
    throw new ValidationError('Invalid commit message: must be a non-empty string');
  }

  const trimmed = message.trim();

  if (trimmed.length === 0) {
    throw new ValidationError('Invalid commit message: cannot be empty');
  }

  if (trimmed.length > 500) {
    throw new ValidationError('Invalid commit message: maximum length is 500 characters');
  }

  return trimmed;
}

function validateAuthorName(author) {
  if (!author || typeof author !== 'string') {
    throw new ValidationError('Invalid author name: must be a non-empty string');
  }

  const trimmed = author.trim();

  if (trimmed.length === 0) {
    throw new ValidationError('Invalid author name: cannot be empty');
  }

  if (trimmed.length > 100) {
    throw new ValidationError('Invalid author name: maximum length is 100 characters');
  }

  return trimmed;
}

function validateSearchQuery(query) {
  if (!query || typeof query !== 'string') {
    throw new ValidationError('Invalid search query: must be a non-empty string');
  }

  const trimmed = query.trim();

  if (trimmed.length === 0) {
    throw new ValidationError('Invalid search query: cannot be empty');
  }

  if (trimmed.length > 1000) {
    throw new ValidationError('Invalid search query: maximum length is 1000 characters');
  }

  return trimmed;
}

function validatePositiveNumber(value, fieldName = 'value', max = Number.MAX_SAFE_INTEGER) {
  const num = Number(value);

  if (isNaN(num)) {
    throw new ValidationError(`Invalid ${fieldName}: must be a number`);
  }

  if (num < 0) {
    throw new ValidationError(`Invalid ${fieldName}: must be positive`);
  }

  if (num > max) {
    throw new ValidationError(`Invalid ${fieldName}: exceeds maximum value of ${max}`);
  }

  return num;
}

module.exports = {
  ValidationError,
  validateFilePath,
  validateGraphId,
  validateFileContent,
  validateCommitMessage,
  validateAuthorName,
  validateSearchQuery,
  validatePositiveNumber,
};
