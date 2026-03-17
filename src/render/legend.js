import { state } from '../state.js';
import { T } from '../data/types.js';
import { turnChunks, infraTok, isGen } from '../helpers.js';
import { selectKey } from '../interactions.js';

export function renderLegend() {
  const SC = state.SC, HK = state.HK;
  const keys = new Set(['output_budget']);
  Object.entries(state.SC.infra).forEach(([k, v]) => { if (v) keys.add(k); });
  state.SC.turns.forEach(t => {
    if (t.files)    keys.add('files');
    if (t.user)     keys.add('user');
    if (t.thinking) keys.add('thinking');
    if (t.toolcall) keys.add('toolcall');
    if (t.toolres)  keys.add('toolres');
    if (isGen(t))   keys.add('generating'); else keys.add('assistant');
  });
  document.getElementById('legend').innerHTML = [...keys].filter(k => T[k]).map(k => `
    <div class="li ${state.HK === k ? 'hl' : ''}" data-key="${k}" style="${state.HK === k ? `color:${T[k].color}` : ''}">
      <div class="ldot" style="background:${T[k].color}"></div>
      <span>${T[k].name}</span>
    </div>`).join('');
  document.getElementById('legend').querySelectorAll('.li').forEach(li =>
    li.addEventListener('click', () => selectKey(li.dataset.key)));
}
