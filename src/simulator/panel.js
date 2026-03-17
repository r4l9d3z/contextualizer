import { state } from '../state.js';
import { IX } from '../data/interactive.js';
import { TOOL_REGISTRY } from './tools.js';
import { FILE_TREE } from './sampleFiles.js';
import { runSimulation, isRunning, abortSimulation, setSpeed, getSpeed } from './engine.js';

let _onUpdate = null;

/** Register the callback that rerenders the visualization after each step */
export function setSimUpdateCallback(fn) { _onUpdate = fn; }

/* ─── Panel render ─────────────────────────────────────────────── */

export function renderSimPanel() {
  const panel = document.getElementById('simBody');
  if (!panel) return;

  const speed = getSpeed();

  panel.innerHTML = `
    <div class="sim-body">

      <div class="sim-section">
        <div class="sim-section-title">Prompt</div>
        <textarea
          id="simPrompt"
          class="sim-prompt"
          placeholder="Describe what you want the AI to do&#10;&#10;Try: &quot;list the files&quot;, &quot;read src/storage.js&quot;, &quot;search for loadTodos&quot;, &quot;analyze and fix the storage module&quot;"
          rows="5"
        ></textarea>
      </div>

      <div class="sim-section">
        <div class="sim-section-title">Options</div>
        <label class="sim-option">
          <input type="checkbox" id="simThinking" />
          <span>Enable extended thinking</span>
        </label>
        <div class="sim-speed-row">
          <span class="sim-speed-label">Speed</span>
          <div class="sim-speed-btns">
            <button class="sim-speed-btn ${speed === 'slow'   ? 'on' : ''}" data-speed="slow">Slow</button>
            <button class="sim-speed-btn ${speed === 'normal' ? 'on' : ''}" data-speed="normal">Normal</button>
            <button class="sim-speed-btn ${speed === 'fast'   ? 'on' : ''}" data-speed="fast">Fast</button>
          </div>
        </div>
      </div>

      <div class="sim-section">
        <div class="sim-btn-row">
          <button id="simSubmit" class="sim-btn primary" ${isRunning() ? 'disabled' : ''}>
            ${isRunning() ? '⏳ Running…' : '▶ Submit'}
          </button>
          <button id="simAbort" class="sim-btn danger" ${isRunning() ? '' : 'disabled'}>
            ✕ Stop
          </button>
          <button id="simReset" class="sim-btn" ${isRunning() ? 'disabled' : ''}>
            Reset
          </button>
        </div>
      </div>

      <div id="simStatus" class="sim-status" style="display:none"></div>

      <div class="sim-section">
        <div class="sim-section-title">Available tools</div>
        <div class="sim-tools">
          ${TOOL_REGISTRY.map(t => `
            <div class="sim-tool">
              <span class="sim-tool-dot" style="background:${t.color}"></span>
              <div class="sim-tool-info">
                <span class="sim-tool-name">${t.name}</span>
                <span class="sim-tool-desc">${t.description}</span>
              </div>
            </div>`).join('')}
        </div>
      </div>

      <div class="sim-section">
        <div class="sim-section-title">Sample project files</div>
        <div id="simFileList" class="sim-file-list"></div>
      </div>

    </div>`;

  _renderFileList();
  _wireSimPanel();
}

function _renderFileList() {
  const el = document.getElementById('simFileList');
  if (!el) return;
  el.innerHTML = FILE_TREE.map(f =>
    `<div class="sim-file">${f}</div>`
  ).join('');
}

/* ─── Wire events ──────────────────────────────────────────────── */

function _wireSimPanel() {
  // Speed buttons
  document.querySelectorAll('.sim-speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setSpeed(btn.dataset.speed);
      document.querySelectorAll('.sim-speed-btn').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
    });
  });

  // Submit
  const submitBtn = document.getElementById('simSubmit');
  if (submitBtn) {
    submitBtn.addEventListener('click', _handleSubmit);
  }

  // Abort
  const abortBtn = document.getElementById('simAbort');
  if (abortBtn) {
    abortBtn.addEventListener('click', () => {
      abortSimulation();
      _setStatus('Simulation stopped.', 'idle');
      renderSimPanel();
      _onUpdate?.();
    });
  }

  // Reset
  const resetBtn = document.getElementById('simReset');
  if (resetBtn) {
    resetBtn.addEventListener('click', _handleReset);
  }
}

async function _handleSubmit() {
  const promptEl = document.getElementById('simPrompt');
  const prompt = promptEl?.value?.trim();
  if (!prompt) { _setStatus('Please enter a prompt first.', 'warn'); return; }

  const thinking = document.getElementById('simThinking')?.checked ?? false;

  // Store the prompt on state so the engine can reference it
  if (state.SC) state.SC._lastPrompt = prompt;

  _setStatus('Starting simulation…', 'running');
  renderSimPanel(); // disable buttons

  let step = 0;

  await runSimulation(prompt, { thinking }, {
    onStep(i, total, stepObj) {
      step = i;
      const label = _stepLabel(stepObj);
      _setStatus(`Step ${i}/${total}: ${label}`, 'running');
      _onUpdate?.();
    },
    onDone() {
      _setStatus('✓ Simulation complete. Click any turn or segment for details.', 'done');
      renderSimPanel();
      _onUpdate?.();
    },
    onAbort() {
      renderSimPanel();
    },
    onError(err) {
      _setStatus(`Error: ${err.message}`, 'error');
      renderSimPanel();
    },
  });
}

function _handleReset() {
  abortSimulation();
  IX.infra = { system: 0, tools: 0, rag: 0, memory: 0, mcp: 0 };
  IX.turns = [];
  IX.maxOut = 4096;
  _setStatus('', '');
  renderSimPanel();
  _onUpdate?.();
}

function _setStatus(msg, type) {
  const el = document.getElementById('simStatus');
  if (!el) return;
  if (!msg) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  el.className = `sim-status sim-status--${type}`;
  el.textContent = msg;
}

function _stepLabel(step) {
  switch (step.type) {
    case 'set_infra':   return `Setting up infrastructure (${step.key})`;
    case 'add_user':    return 'Adding user message';
    case 'add_thinking':return 'Model is thinking…';
    case 'add_toolcall':return `Tool call → ${step.name}`;
    case 'add_toolres': return `Tool result ← ${step.name}`;
    case 'add_assistant':return 'Generating response';
    default:            return step.type;
  }
}
