import { IX } from '../data/interactive.js';
import { state } from '../state.js';
import { sleep } from '../helpers.js';
import { read_file, list_files, search_files } from './tools.js';
import { FILE_TREE } from './sampleFiles.js';

/** Speed multipliers applied to all step delays */
export const SPEEDS = { slow: 2.5, normal: 1, fast: 0.3 };

let _speed = 'normal';
let _running = false;
let _abortFlag = false;

export function setSpeed(s) { _speed = s; }
export function getSpeed() { return _speed; }
export function isRunning() { return _running; }
export function abortSimulation() { _abortFlag = true; }

/* ─── Script builder ──────────────────────────────────────────────── */

/**
 * Analyzes the prompt and returns a step sequence.
 * Steps are objects: { type, delay, ...data }
 */
export function buildScript(prompt, opts = {}) {
  const p = prompt.toLowerCase();
  const enableThinking = opts.thinking ?? false;

  if (/read|open|show|view|display|cat|print/.test(p) && /\.(js|ts|json|md|css|txt|html)/.test(p)) {
    return readFileScript(prompt, enableThinking);
  }
  if (/read|open|show|view/.test(p) && /readme/i.test(p)) {
    return readFileScript('README.md', enableThinking);
  }
  if (/list|ls|what files|show files|dir|tree|structure/.test(p)) {
    return listFilesScript(prompt, enableThinking);
  }
  if (/search|find|grep|where|look for/.test(p)) {
    return searchScript(prompt, enableThinking);
  }
  if (/analyz|refactor|fix|debug|improv|review|audit|check/.test(p)) {
    return agenticScript(prompt, enableThinking);
  }
  return simpleScript(prompt, enableThinking);
}

function userTokens(prompt) {
  return Math.max(20, Math.ceil(prompt.length / 4));
}

function readFileScript(prompt, thinking) {
  // Try to extract a file path from the prompt
  const fileMatch = prompt.match(/[\w./\-]+\.(js|ts|json|md|css|txt|html)/i);
  let targetFile = fileMatch ? fileMatch[0] : null;
  if (!targetFile || !FILE_TREE.includes(targetFile)) {
    // Pick a sensible default
    targetFile = FILE_TREE.includes('src/storage.js') ? 'src/storage.js' : FILE_TREE[0];
  }

  const toolResult = read_file({ path: targetFile });
  const steps = [];

  steps.push({ type: 'set_infra', key: 'tools', tokens: 1200, delay: 0 });
  steps.push({ type: 'add_user', tokens: userTokens(prompt), delay: 300 });
  if (thinking) steps.push({ type: 'add_thinking', tokens: 1800, delay: 900 });
  steps.push({ type: 'add_toolcall', name: 'read_file', args: `{ "path": "${targetFile}" }`, tokens: 48, delay: thinking ? 1600 : 900 });
  steps.push({ type: 'add_toolres', name: 'read_file', content: toolResult.content, tokens: toolResult.tokens, delay: 1400 });
  steps.push({ type: 'add_assistant', tokens: 380, delay: 1000 });

  return { steps, title: `read_file("${targetFile}")` };
}

function listFilesScript(prompt, thinking) {
  const toolResult = list_files({});
  const steps = [];

  steps.push({ type: 'set_infra', key: 'tools', tokens: 1200, delay: 0 });
  steps.push({ type: 'add_user', tokens: userTokens(prompt), delay: 300 });
  if (thinking) steps.push({ type: 'add_thinking', tokens: 1200, delay: 900 });
  steps.push({ type: 'add_toolcall', name: 'list_files', args: '{}', tokens: 38, delay: thinking ? 1400 : 900 });
  steps.push({ type: 'add_toolres', name: 'list_files', content: toolResult.content, tokens: toolResult.tokens, delay: 1200 });
  steps.push({ type: 'add_assistant', tokens: 290, delay: 900 });

  return { steps, title: 'list_files()' };
}

function searchScript(prompt, thinking) {
  // Extract query from prompt heuristically
  const queryMatch = prompt.match(/(?:search|find|grep|look for)\s+["']?([^"']+?)["']?\s*(?:in|$)/i);
  const query = queryMatch ? queryMatch[1].trim() : 'loadTodos';

  const toolResult = search_files({ query });
  const steps = [];

  steps.push({ type: 'set_infra', key: 'tools', tokens: 1200, delay: 0 });
  steps.push({ type: 'add_user', tokens: userTokens(prompt), delay: 300 });
  if (thinking) steps.push({ type: 'add_thinking', tokens: 1400, delay: 900 });
  steps.push({ type: 'add_toolcall', name: 'search_files', args: `{ "query": "${query}" }`, tokens: 42, delay: thinking ? 1400 : 900 });
  steps.push({ type: 'add_toolres', name: 'search_files', content: toolResult.content, tokens: toolResult.tokens, delay: 1200 });
  steps.push({ type: 'add_assistant', tokens: 320, delay: 900 });

  return { steps, title: `search_files("${query}")` };
}

function agenticScript(prompt, thinking) {
  const listResult = list_files({});
  const storageResult = read_file({ path: 'src/storage.js' });
  const testResult = read_file({ path: 'tests/storage.test.js' });
  const steps = [];

  steps.push({ type: 'set_infra', key: 'tools', tokens: 1800, delay: 0 });
  steps.push({ type: 'add_user', tokens: userTokens(prompt), delay: 300 });
  if (thinking) steps.push({ type: 'add_thinking', tokens: 4200, delay: 900 });
  steps.push({ type: 'add_toolcall', name: 'list_files', args: '{}', tokens: 38, delay: thinking ? 2000 : 900 });
  steps.push({ type: 'add_toolres', name: 'list_files', content: listResult.content, tokens: listResult.tokens, delay: 1000 });
  steps.push({ type: 'add_toolcall', name: 'read_file', args: '{ "path": "src/storage.js" }', tokens: 48, delay: 900 });
  steps.push({ type: 'add_toolres', name: 'read_file', content: storageResult.content, tokens: storageResult.tokens, delay: 1000 });
  steps.push({ type: 'add_toolcall', name: 'read_file', args: '{ "path": "tests/storage.test.js" }', tokens: 52, delay: 900 });
  steps.push({ type: 'add_toolres', name: 'read_file', content: testResult.content, tokens: testResult.tokens, delay: 1000 });
  steps.push({ type: 'add_assistant', tokens: 620, delay: 1200 });

  return { steps, title: '3-step agentic loop' };
}

function simpleScript(prompt, thinking) {
  const steps = [];

  steps.push({ type: 'set_infra', key: 'system', tokens: 800, delay: 0 });
  steps.push({ type: 'add_user', tokens: userTokens(prompt), delay: 300 });
  if (thinking) steps.push({ type: 'add_thinking', tokens: 2400, delay: 900 });
  steps.push({ type: 'add_assistant', tokens: 240, delay: thinking ? 1800 : 900 });

  return { steps, title: 'simple response' };
}

/* ─── Animation engine ────────────────────────────────────────────── */

/**
 * Run the simulation for a given prompt.
 * Calls onStep(stepIndex, totalSteps) after each step.
 * Calls onDone() when complete.
 * Calls onAbort() if aborted.
 */
export async function runSimulation(prompt, opts, { onStep, onDone, onAbort, onError }) {
  if (_running) return;
  _running = true;
  _abortFlag = false;

  try {
    const script = buildScript(prompt, opts);
    const { steps } = script;
    const mult = SPEEDS[_speed] ?? 1;

    // Reset IX to a clean state before each simulation
    IX.infra = { system: 0, tools: 0, rag: 0, memory: 0, mcp: 0 };
    IX.maxOut = 4096;
    IX.turns = [];

    for (let i = 0; i < steps.length; i++) {
      if (_abortFlag) { onAbort?.(); return; }

      const step = steps[i];
      const delay = Math.round((step.delay ?? 800) * mult);
      if (delay > 0) await sleep(delay);
      if (_abortFlag) { onAbort?.(); return; }

      applyStep(step);
      onStep?.(i + 1, steps.length, step);
    }

    onDone?.();
  } catch (err) {
    onError?.(err);
  } finally {
    _running = false;
  }
}

/* ─── Step applicators ────────────────────────────────────────────── */

function applyStep(step) {
  switch (step.type) {
    case 'set_infra':
      IX.infra[step.key] = step.tokens;
      break;

    case 'add_user': {
      // Start a new turn with just the user message
      IX.turns.push({
        user: step.tokens,
        assistant: 0,
        thinking: 0,
        toolcall: 0,
        toolres: 0,
        files: 0,
        // metadata for right-panel display
        _simTitle: 'User message',
        _simDesc: 'User submitted a prompt to the model.',
        _simExample: [{ type: 'user', text: state.SC?._lastPrompt ?? 'User prompt' }],
        _toolcalls: [],
        _toolresults: [],
      });
      break;
    }

    case 'add_thinking': {
      const last = IX.turns[IX.turns.length - 1];
      if (last) last.thinking = step.tokens;
      break;
    }

    case 'add_toolcall': {
      const last = IX.turns[IX.turns.length - 1];
      if (last) {
        last.toolcall = (last.toolcall || 0) + step.tokens;
        last._toolcalls = last._toolcalls || [];
        last._toolcalls.push({ name: step.name, args: step.args, tokens: step.tokens });
      }
      break;
    }

    case 'add_toolres': {
      const last = IX.turns[IX.turns.length - 1];
      if (last) {
        last.toolres = (last.toolres || 0) + step.tokens;
        last._toolresults = last._toolresults || [];
        last._toolresults.push({ name: step.name, content: step.content, tokens: step.tokens });
      }
      break;
    }

    case 'add_assistant': {
      const last = IX.turns[IX.turns.length - 1];
      if (last) last.assistant = step.tokens;
      break;
    }
  }
}
