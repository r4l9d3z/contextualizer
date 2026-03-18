import { state, TOTAL } from './state.js';
import { SCENARIOS } from './data/scenarios.js';
import { IX } from './data/interactive.js';
import { T } from './data/types.js';
import { fmt, pctStr } from './helpers.js';
import { renderScenarios } from './render/scenarios.js';
import { renderLinbar } from './render/linbar.js';
import { renderTurns } from './render/turns.js';
import { renderLegend } from './render/legend.js';
import { renderRight } from './render/right.js';
import { renderIxPanel } from './render/interactive.js';
import { renderSimPanel, setSimUpdateCallback } from './simulator/panel.js';

export function select(id) {
  const ixPanel  = document.getElementById('ixPanel');
  const simPanel = document.getElementById('simPanel');

  // Hide both side panels first
  if (ixPanel)  ixPanel.style.display  = 'none';
  if (simPanel) simPanel.style.display = 'none';

  if (id === 'simulator') {
    state.SC = IX;
    state.HK = null; state.HT = null;
    // Reset IX for a clean sim run
    IX.infra  = { system: 0, tools: 0, rag: 0, memory: 0, mcp: 0 };
    IX.turns  = [];
    IX.maxOut = 4096;
    if (simPanel) simPanel.style.display = 'block';
    renderSimPanel();
    setSimUpdateCallback(() => {
      renderLinbar(state.SC);
      renderTurns(state.SC);
      renderLegend();
      renderRight();
    });
  } else if (id === 'interactive') {
    state.SC = IX;
    state.HK = null; state.HT = null;
    if (ixPanel) ixPanel.style.display = 'block';
    renderIxPanel();
  } else {
    state.SC = SCENARIOS.find(s => s.id === id) || SCENARIOS[0];
    state.HK = null; state.HT = null;
  }

  renderScenarios();
  renderLinbar(state.SC);
  renderTurns(state.SC);
  renderLegend();
  renderRight();
}

export function selectKey(key) {
  state.HK = (state.HK === key) ? null : key;
  if (state.HK) state.HT = null;
  renderLinbar(state.SC); renderTurns(state.SC); renderLegend(); renderRight();
}

export function selectTurn(idx) {
  if (idx === null) { state.HT = null; }
  else { state.HT = (state.HT === idx) ? null : idx; if (state.HT != null) state.HK = null; }
  renderLinbar(state.SC); renderTurns(state.SC); renderLegend(); renderRight();
}

export function showTip(e, seg) {
  const d = T[seg.key], tip = document.getElementById('tip');
  tip.innerHTML = '<b style="color:' + (d && d.color ? d.color : '#888') + '">' + (d && d.name ? d.name : seg.key) + '</b><br>' + fmt(seg.tokens) + ' tokens \u00b7 ' + pctStr(seg.tokens, TOTAL);
  tip.style.left = (e.clientX + 14) + 'px'; tip.style.top = (e.clientY - 8) + 'px';
  tip.classList.add('show');
}

export function hideTip() {
  document.getElementById('tip').classList.remove('show');
}

export function initTheme() {
  let stored = null;
  try { stored = localStorage.getItem('ctx-theme'); } catch(e) {}
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initial = stored || (systemDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', initial);
  updateToggleLabel(initial);

  document.getElementById('themeToggle').addEventListener('click', function() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('ctx-theme', next); } catch(e) {}
    updateToggleLabel(next);
  });

  function updateToggleLabel(theme) {
    const lbl = document.getElementById('themeLabel');
    if (lbl) lbl.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
  }
}
