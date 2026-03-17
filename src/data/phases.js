export const PHASES = [
  { id: 'Infrastructure', label: 'Infrastructure (every call)', keys: ['system', 'tools', 'rag', 'memory', 'mcp'] },
  { id: 'User Input',     label: 'User Input',                  keys: ['files', 'user'] },
  { id: 'Tool Use',       label: 'Tool Use',                    keys: ['toolcall', 'toolres'] },
  { id: 'Assistant',      label: 'Assistant Output',            keys: ['thinking', 'assistant'] },
];
