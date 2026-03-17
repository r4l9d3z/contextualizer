import { SAMPLE_FILES, FILE_TREE } from './sampleFiles.js';

/**
 * Execute a tool call and return { content, tokens }.
 * All tool results are derived from the synthetic sample project.
 */

export function read_file({ path }) {
  const content = SAMPLE_FILES[path];
  if (!content) {
    const available = FILE_TREE.join(', ');
    const msg = `Error: File "${path}" not found.\n\nAvailable files: ${available}`;
    return { content: msg, tokens: Math.ceil(msg.length / 4) };
  }
  return { content, tokens: Math.ceil(content.length / 4) };
}

export function list_files({ directory = '' } = {}) {
  const files = FILE_TREE.filter(f =>
    directory === '' || f.startsWith(directory.replace(/\/?$/, '/'))
  );
  const content = files.length
    ? files.join('\n')
    : `No files found in "${directory}"`;
  return { content, tokens: Math.ceil(content.length / 4) };
}

export function search_files({ query, case_sensitive = false } = {}) {
  const q = case_sensitive ? query : query.toLowerCase();
  const matches = Object.entries(SAMPLE_FILES)
    .filter(([, v]) => (case_sensitive ? v : v.toLowerCase()).includes(q))
    .map(([path, content]) => {
      const lines = content.split('\n');
      const matchedLines = lines
        .map((line, i) => ({ line, n: i + 1 }))
        .filter(({ line }) => (case_sensitive ? line : line.toLowerCase()).includes(q))
        .slice(0, 3)
        .map(({ line, n }) => `  ${path}:${n}: ${line.trim()}`);
      return matchedLines.join('\n');
    })
    .filter(Boolean);

  const content = matches.length
    ? matches.join('\n')
    : `No matches found for "${query}"`;
  return { content, tokens: Math.ceil(content.length / 4) };
}

/** Registry used by the engine and panel to display available tools */
export const TOOL_REGISTRY = [
  {
    name: 'read_file',
    description: 'Read the contents of a file by path',
    params: 'path: string',
    color: '#c8b530',
    fn: read_file,
  },
  {
    name: 'list_files',
    description: 'List files in the project (optionally filter by directory)',
    params: 'directory?: string',
    color: '#48a870',
    fn: list_files,
  },
  {
    name: 'search_files',
    description: 'Search file contents for a string or pattern',
    params: 'query: string, case_sensitive?: boolean',
    color: '#3898dc',
    fn: search_files,
  },
];
