import { SCENARIOS } from '../data/scenarios.js';
import { state } from '../state.js';
import { select } from '../interactions.js';

export function renderScenarios() {
  const el = document.getElementById('slist');
  const isInteractive = state.SC?.id === 'interactive' && document.getElementById('ixPanel')?.style.display !== 'none';
  const isSimulator   = document.getElementById('simPanel')?.style.display !== 'none';

  const simBtn = `
    <button class="sb ${isSimulator ? 'on' : ''}" data-id="simulator">
      <span class="l">🎬 Simulator</span>
      <span class="s">Submit a prompt, watch tool calls fire</span>
      <span class="sb-dot"></span>
    </button>`;

  const ixBtn = `
    <button class="sb ${isInteractive ? 'on' : ''}" data-id="interactive">
      <span class="l">✏ Interactive Build</span>
      <span class="s">Build your own context window</span>
      <span class="sb-dot"></span>
    </button>`;

  el.innerHTML = simBtn + ixBtn + SCENARIOS.map(s => `
    <button class="sb ${state.SC?.id === s.id && !isSimulator && !isInteractive ? 'on' : ''}" data-id="${s.id}">
      <span class="l">${s.label}</span>
      <span class="s">${s.sub}</span>
      <span class="sb-dot"></span>
    </button>`).join('');

  el.querySelectorAll('.sb').forEach(b =>
    b.addEventListener('click', () => select(b.dataset.id)));
}
