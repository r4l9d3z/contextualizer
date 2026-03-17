import { IX, PRESETS, PRESET_LABELS, INFRA_COMPONENTS, makeTurnMeta } from '../data/interactive.js';
import { state } from '../state.js';
import { T } from '../data/types.js';
import { fmt, isGen } from '../helpers.js';
import { rerender, ixRerender } from './index.js';
import { selectTurn } from '../interactions.js';

export function renderIxPanel() {
  const body = document.getElementById('ixBody');
  if (!body) return;
  let html = '<div class="ix-body">';

  // Infrastructure section
  html += '<div class="ix-section"><div class="ix-section-title">Infrastructure</div>';
  INFRA_COMPONENTS.forEach(function(comp) {
    const key = comp.key, label = comp.label, color = comp.color;
    const tok = IX.infra[key], active = tok > 0, preset = IX.infraPreset[key];
    html += '<div class="ix-component ' + (active ? 'active' : '') + '" data-comp="' + key + '">';
    html += '<div class="ix-comp-header">';
    html += '<div class="ix-comp-dot" style="background:' + color + ';opacity:' + (active ? 1 : .35) + '"></div>';
    html += '<span class="ix-comp-name">' + label + '</span>';
    html += '<span class="ix-comp-tok">' + (active ? fmt(tok) + '&nbsp;tok' : '') + '</span>';
    html += '<input type="checkbox" class="ix-toggle" data-comp-toggle="' + key + '" ' + (active ? 'checked' : '') + '>';
    html += '</div>';
    if (active) {
      html += '<div class="ix-presets">';
      PRESET_LABELS.forEach(function(p) {
        html += '<button class="ix-preset ' + (preset === p.k ? 'on' : '') + '" data-comp-preset="' + key + '" data-preset="' + p.k + '">' + p.label + '&nbsp;<span style="opacity:.6">' + fmt(p.v) + '</span></button>';
      });
      html += '</div>';
      html += '<input type="number" class="ix-custom-input" placeholder="Custom token count" value="' + (preset ? '' : tok) + '" data-comp-custom="' + key + '" min="1" max="128000">';
    }
    html += '</div>';
  });
  html += '</div>';

  // Output Budget section
  html += '<div class="ix-section">';
  html += '<div class="ix-section-title">Output Budget (max_tokens)</div>';
  html += '<div class="ix-slider-row">';
  html += '<input type="range" class="ix-slider" id="ixMaxOut" min="256" max="32000" step="256" value="' + IX.maxOut + '">';
  html += '<span class="ix-slider-val" id="ixMaxOutVal">' + fmt(IX.maxOut) + '</span>';
  html += '</div></div>';

  // Conversation section
  const hasTurns = IX.turns.length > 0;
  const lastTurn = hasTurns ? IX.turns[IX.turns.length - 1] : null;
  const showPostActions = lastTurn && lastTurn.user > 0 && isGen(lastTurn);

  html += '<div class="ix-section"><div class="ix-section-title">Conversation</div>';

  if (!showPostActions) {
    html += '<textarea class="ix-msg-area" id="ixMsgArea" placeholder="Type user message\u2026" rows="3"></textarea>';
    html += '<div class="ix-char-hint" id="ixCharHint">0 chars \u2248 0 tokens</div>';
    html += '<div class="ix-btn-row">';
    html += '<button class="ix-btn primary" id="ixSendBtn">Send \u2192</button>';
    if (hasTurns) html += '<button class="ix-btn danger" id="ixRemoveBtn">Remove last turn</button>';
    html += '</div>';
  }

  if (showPostActions) {
    html += '<div class="ix-post-actions">';
    html += '<div class="ix-post-label">Turn ' + IX.turns.length + ' \u2014 choose next step</div>';
    html += '<div class="ix-btn-row">';
    html += '<button class="ix-btn" id="ixAddThinking">+ Thinking</button>';
    html += '<button class="ix-btn" id="ixAddToolCall">+ Tool Call</button>';
    html += '<button class="ix-btn" id="ixAddFile">+ File</button>';
    html += '</div>';
    html += '<div class="ix-size-row" style="margin-top:6px;">';
    html += '<span class="ix-size-label">Generate response:</span>';
    PRESET_LABELS.forEach(function(p) {
      html += '<button class="ix-btn" data-gen-preset="' + p.k + '">' + p.label + '&nbsp;<span style="opacity:.6">' + fmt(p.v) + '</span></button>';
    });
    html += '</div>';
    html += '<div class="ix-btn-row" style="margin-top:3px;">';
    html += '<button class="ix-btn danger" id="ixRemoveBtn">Remove last turn</button>';
    html += '</div>';
    html += '</div>';
  }
  html += '</div>';

  // Reset section
  html += '<div style="padding-top:4px;border-top:1px solid var(--bd);margin-top:4px;">';
  html += '<button class="ix-btn danger" id="ixReset" style="width:100%;">Reset</button>';
  html += '</div>';
  html += '</div>'; // close ix-body

  body.innerHTML = html;
  wireIxPanel();
}

export function wireIxPanel() {
  // Toggle infrastructure on/off
  document.querySelectorAll('[data-comp-toggle]').forEach(function(cb) {
    cb.addEventListener('change', function(e) {
      const key = e.target.dataset.compToggle;
      if (e.target.checked) {
        IX.infra[key] = PRESETS.small;
        IX.infraPreset[key] = 'small';
      } else {
        IX.infra[key] = 0;
        IX.infraPreset[key] = null;
      }
      ixRerender();
    });
  });

  // Preset size buttons
  document.querySelectorAll('[data-comp-preset]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const key = btn.dataset.compPreset, preset = btn.dataset.preset;
      IX.infra[key] = PRESETS[preset];
      IX.infraPreset[key] = preset;
      ixRerender();
    });
  });

  // Custom token inputs (update center only to preserve focus)
  document.querySelectorAll('[data-comp-custom]').forEach(function(inp) {
    inp.addEventListener('input', function() {
      const key = inp.dataset.compCustom, val = parseInt(inp.value, 10);
      if (!isNaN(val) && val > 0) {
        IX.infra[key] = val;
        IX.infraPreset[key] = null;
        rerender();
      }
    });
  });

  // Max tokens slider (update center only to preserve drag)
  const slider = document.getElementById('ixMaxOut');
  if (slider) {
    slider.addEventListener('input', function() {
      IX.maxOut = parseInt(slider.value, 10);
      document.getElementById('ixMaxOutVal').textContent = fmt(IX.maxOut);
      rerender();
    });
  }

  // Textarea live hint
  const textarea = document.getElementById('ixMsgArea');
  if (textarea) {
    textarea.addEventListener('input', function() {
      const chars = textarea.value.length, toks = Math.ceil(chars / 4);
      document.getElementById('ixCharHint').textContent = chars + ' chars \u2248 ' + fmt(toks) + ' tokens';
    });
    const sendBtn = document.getElementById('ixSendBtn');
    if (sendBtn) {
      sendBtn.addEventListener('click', function() {
        const text = textarea.value.trim();
        if (!text) return;
        const toks = Math.ceil(text.length / 4);
        const turn = {user: toks, assistant: null, files: 0, thinking: 0, toolcall: 0, toolres: 0};
        makeTurnMeta(IX.turns.length, turn);
        IX.turns.push(turn);
        ixRerender();
      });
    }
  }

  // Post-turn actions
  const addThinking = document.getElementById('ixAddThinking');
  if (addThinking) addThinking.addEventListener('click', function() { ixAddSegmentToLastTurn('thinking', PRESETS.medium); });

  const addToolCall = document.getElementById('ixAddToolCall');
  if (addToolCall) addToolCall.addEventListener('click', function() {
    const turn = IX.turns[IX.turns.length - 1];
    turn.toolcall = (turn.toolcall || 0) + PRESETS.small;
    turn.toolres = (turn.toolres || 0) + PRESETS.medium;
    makeTurnMeta(IX.turns.length - 1, turn);
    ixRerender();
  });

  const addFile = document.getElementById('ixAddFile');
  if (addFile) addFile.addEventListener('click', function() { ixAddSegmentToLastTurn('files', PRESETS.medium); });

  // Generate response
  document.querySelectorAll('[data-gen-preset]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const turn = IX.turns[IX.turns.length - 1];
      turn.assistant = PRESETS[btn.dataset.genPreset];
      makeTurnMeta(IX.turns.length - 1, turn);
      ixRerender();
    });
  });

  // Remove last turn
  const removeBtn = document.getElementById('ixRemoveBtn');
  if (removeBtn) removeBtn.addEventListener('click', function() {
    if (IX.turns.length > 0) { IX.turns.pop(); ixRerender(); }
  });

  // Reset
  const resetBtn = document.getElementById('ixReset');
  if (resetBtn) resetBtn.addEventListener('click', ixReset);
}

export function ixReset() {
  IX.infra = {system: 0, tools: 0, rag: 0, memory: 0, mcp: 0};
  IX.infraPreset = {system: null, tools: null, rag: null, memory: null, mcp: null};
  IX.maxOut = 4000;
  IX.turns = [];
  if (state.SC && state.SC.id === 'interactive') { ixRerender(); }
}

export function ixAddSegmentToLastTurn(key, defaultTok) {
  const turn = IX.turns[IX.turns.length - 1];
  turn[key] = (turn[key] || 0) + defaultTok;
  makeTurnMeta(IX.turns.length - 1, turn);
  ixRerender();
}
