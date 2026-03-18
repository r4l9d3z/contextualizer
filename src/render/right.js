import { state } from '../state.js';
import { T } from '../data/types.js';
import { PHASES } from '../data/phases.js';
import { TOTAL } from '../state.js';
import { infraTok, turnTok, usedTok, truncRisk, turnChunks, fmt, pctStr, uc, isGen } from '../helpers.js';
import { selectKey, selectTurn } from '../interactions.js';

export function renderRight() {
  const SC = state.SC, HK = state.HK, HT = state.HT;
  const panel = document.getElementById('rp');
  const title = document.getElementById('rpTitle');
  const hint = document.getElementById('rpHint');
  panel.classList.add('fade-in');
  setTimeout(() => panel.classList.remove('fade-in'), 250);

  if (HK) {
    title.textContent = 'Segment Detail'; hint.textContent = '← back button below';
    renderSegDetail(panel);
  } else if (HT != null) {
    title.textContent = HT === -1 ? 'Infrastructure' : 'Turn Detail'; hint.textContent = 'use ← → to navigate';
    renderTurnDetail(panel);
  } else {
    title.textContent = 'Token Budget'; hint.textContent = 'click any turn or segment';
    renderBudget(panel);
  }
}

/* ── Budget ── */
export function renderBudget(panel) {
  const SC = state.SC, HK = state.HK;
  const used = usedTok(SC), totals = {};
  for (const [k, v] of Object.entries(SC.infra)) totals[k] = (totals[k] || 0) + v;
  SC.turns.forEach(t => {
    ['files','user','thinking','toolcall','toolres'].forEach(k => { if (t[k]) totals[k] = (totals[k] || 0) + t[k]; });
    if (!isGen(t)) totals.assistant = (totals.assistant || 0) + (t.assistant || 0);
  });

  let html = `<div class="bk-title">Token Budget</div>`;
  PHASES.forEach(ph => {
    const phKeys = ph.keys.filter(k => totals[k]);
    if (!phKeys.length) return;
    html += `<div class="bk-group"><div class="bk-glabel">${ph.label}</div>`;
    phKeys.forEach(k => {
      const tok = totals[k] || 0, d = T[k];
      const bw = Math.round((tok / TOTAL) * 100);
      html += `<div class="bk-row ${HK === k ? 'hl' : ''}" data-key="${k}">
        <div class="bkdot" style="background:${d.color}"></div>
        <div class="bk-name">${d.name}</div>
        <div class="bk-minibar"><div class="bk-minifill" style="width:${bw}%;background:${d.color}"></div></div>
        <div class="bk-tok">${fmt(tok)}</div>
        <div class="bk-pct">${pctStr(tok, TOTAL)}</div>
      </div>`;
    });
    html += `</div>`;
  });

  // Output budget row
  const obw = Math.round((SC.maxOut / TOTAL) * 100);
  html += `<div class="bk-group"><div class="bk-glabel">Reserved (output budget)</div>
    <div class="bk-row ${HK === 'output_budget' ? 'hl' : ''}" data-key="output_budget">
      <div class="bkdot" style="background:#3898dc"></div>
      <div class="bk-name">max_tokens</div>
      <div class="bk-minibar"><div class="bk-minifill" style="width:${obw}%;background:#3898dc"></div></div>
      <div class="bk-tok">${fmt(SC.maxOut)}</div>
      <div class="bk-pct">${pctStr(SC.maxOut, TOTAL)}</div>
    </div></div>`;

  const totalW = used + SC.maxOut, freeAmt = TOTAL - totalW, r = totalW / TOTAL;
  html += `<div class="bk-summary">
    <div style="display:flex;justify-content:space-between;font-size:.58rem;color:var(--mu2);margin-bottom:4px">
      <span>Input + output budget</span>
      <span style="color:${uc(r)};font-weight:600">${(r * 100).toFixed(1)}%</span>
    </div>
    <div class="bk-summary-bar">
      <div class="bk-summary-fill" style="width:${Math.min(r * 100, 100)}%;background:${uc(r)}"></div>
    </div>
    <div class="bk-summary-row">
      <span>Input: <b>${fmt(used)}</b></span>
      <span>Reserved: <b>${fmt(SC.maxOut)}</b></span>
      <span>Free: <b style="color:${freeAmt < 0 ? '#e05555' : 'inherit'}">${freeAmt > 0 ? fmt(freeAmt) : 'OVER'}</b></span>
    </div>
  </div>
  <div class="bk-tip">
    Mini-bars are proportional to the full 128k window — not just to used tokens.<br><br>
    ↑ Click any turn row to see a real-world example.<br>
    Click any colored segment for technical details.
  </div>`;

  panel.innerHTML = html;
  panel.querySelectorAll('.bk-row[data-key]').forEach(r =>
    r.addEventListener('click', () => selectKey(r.dataset.key)));
}

/* ── Turn Detail ── */
export function renderTurnDetail(panel) {
  const SC = state.SC, HT = state.HT;
  const isInfra = HT === -1;
  const totalTurns = SC.turns.length;
  const prevIdx = HT <= 0 ? -1 : HT - 1;
  const nextIdx = isInfra ? 0 : (HT < totalTurns - 1 ? HT + 1 : null);
  const canPrev = !(isInfra);
  const canNext = nextIdx !== null;

  const data = isInfra ? SC.infraDesc : SC.turns[HT];
  const atRisk = !isInfra && truncRisk(SC).has(HT);
  const genTurn = !isInfra && isGen(SC.turns[HT]) && HT === SC.turns.length - 1;

  let html = '';

  // Navigation
  html += `<div class="td-nav">
    <button class="td-back" data-back="1">← Budget</button>
    <div class="td-nav-btns">
      <button class="td-nav-btn" data-prev="1" ${!canPrev ? 'disabled' : ''}>← Prev</button>
      <button class="td-nav-btn" data-next="1" ${!canNext ? 'disabled' : ''}>Next →</button>
    </div>
  </div>`;

  // Truncation warning
  if (atRisk) {
    html += `<div class="td-warn">⚠ This turn will be truncated — it's the oldest non-protected content and will be dropped first when the context window runs out of space.</div>`;
  }

  // Turn number + title
  const turnNum = isInfra ? 'Infrastructure' : `Turn ${HT + 1} of ${totalTurns}`;
  const statusLabel = isInfra
    ? 'Re-sent on every API call'
    : genTurn
      ? 'Currently generating — output NOT yet in context'
      : atRisk
        ? 'Completed — AT RISK of truncation'
        : 'Completed — part of conversation history';

  html += `
    <div class="td-turn-number">${turnNum}</div>
    <div class="td-badge-row">
      <span class="td-badge" style="color:${atRisk ? '#e09838' : genTurn ? '#b838b8' : '#48a870'};border-color:${atRisk ? 'rgba(224,152,56,.3)' : genTurn ? 'rgba(184,56,184,.3)' : 'rgba(72,168,112,.3)'}">${statusLabel}</span>
    </div>
    <div class="td-title">${data.title || ''}</div>
    <div class="td-desc">${data.fullDesc || data.desc || ''}</div>
  `;

  // Segment breakdown (for conversation turns)
  if (!isInfra) {
    const turn = SC.turns[HT];
    const chunks = turnChunks(turn, HT === SC.turns.length - 1);
    const tToks = turnTok(turn) || 1;
    html += `<div class="td-segs-label">Segments in this turn</div><div class="td-segs">`;
    chunks.forEach(c => {
      if (c.gen) {
        html += `<div class="td-seg-row" data-key="generating">
          <div class="td-seg-dot" style="background:rgba(184,56,184,.5);border:1px dashed rgba(184,56,184,.6)"></div>
          <div class="td-seg-name" style="color:rgba(184,56,184,.8)">Current Generation</div>
          <div class="td-seg-bar"></div>
          <div class="td-seg-tok" style="color:rgba(184,56,184,.6)">output</div>
          <div class="td-seg-pct" style="color:rgba(184,56,184,.5)">—</div>
        </div>`;
      } else {
        const d = T[c.key];
        const bw = Math.round((c.tokens / tToks) * 100);
        html += `<div class="td-seg-row" data-key="${c.key}">
          <div class="td-seg-dot" style="background:${d?.color || '#888'}"></div>
          <div class="td-seg-name">${d?.name || c.key}</div>
          <div class="td-seg-bar"><div class="td-seg-fill" style="width:${bw}%;background:${d?.color || '#888'}"></div></div>
          <div class="td-seg-tok">${fmt(c.tokens)}</div>
          <div class="td-seg-pct">${pctStr(c.tokens, TOTAL)}</div>
        </div>`;
      }
    });
    html += `</div>`;
  }

  // Example bubbles
  const example = data.example;
  if (example && example.length) {
    const labels = {user:'User', assistant:'Claude', thinking:'Claude thinking', system:'System Prompt', 'tool-call':'Tool Call', 'tool-result':'Tool Result', 'generating':'← Generating (output)'};
    html += `<div class="td-example"><div class="td-ex-label">Real-world example</div>`;
    example.forEach(b => {
      const cls = b.type === 'tool-call' ? 'tool-call' : b.type === 'tool-result' ? 'tool-result' : b.type;
      html += `<div class="bubble ${cls}"><span class="bl">${labels[b.type] || b.type}</span>${escHtml(b.text)}</div>`;
    });
    html += `</div>`;
  }

  // Note
  if (data.note) {
    html += `<div class="td-note">${data.note}</div>`;
  }

  panel.innerHTML = html;

  // Wire buttons
  panel.querySelector('[data-back]')?.addEventListener('click', () => selectTurn(null));
  panel.querySelector('[data-prev]')?.addEventListener('click', () => { if (canPrev) selectTurn(prevIdx); });
  panel.querySelector('[data-next]')?.addEventListener('click', () => { if (canNext) selectTurn(nextIdx); });
  panel.querySelectorAll('.td-seg-row[data-key]').forEach(r =>
    r.addEventListener('click', () => selectKey(r.dataset.key)));
}

/* ── Segment Detail ── */
export function renderSegDetail(panel) {
  const SC = state.SC, HK = state.HK;
  const d = T[HK]; if (!d) { panel.innerHTML = ''; return; }
  let total = 0, count = 0;
  for (const [k, v] of Object.entries(SC.infra)) { if (k === HK) { total += v; count++; } }
  SC.turns.forEach(t => {
    const map = {files:t.files, user:t.user, thinking:t.thinking, toolcall:t.toolcall, toolres:t.toolres, assistant:t.assistant};
    if (map[HK]) { total += map[HK]; count++; }
  });
  if (HK === 'output_budget') total = SC.maxOut;
  const inWindow = HK !== 'generating';

  panel.innerHTML = `
    <div style="margin-bottom:10px">
      <button class="td-back" id="segBack">← Back</button>
    </div>
    <div class="sd-name" style="color:${d.color}">${d.name}</div>
    <div class="sd-tok">${inWindow && total ? fmt(total) + ' tokens · ' + pctStr(total, TOTAL) + ' of window' : 'not yet in context'}${count > 1 ? ' · ' + count + ' occurrences' : ''}</div>
    <div class="sd-badges">
      <span class="sd-badge" style="color:${d.color};border-color:${d.color}30">${d.badge}</span>
      <span class="sd-badge" style="color:var(--mu2);border-color:var(--mu)25">${d.who}</span>
    </div>
    <div class="sd-desc">${d.desc}</div>
    <div class="sd-items">${d.items.map(it => `
      <div class="sd-item">
        <div class="sd-il">${it.l}</div>
        <div class="sd-iv">${it.v}</div>
      </div>`).join('')}</div>`;

  panel.querySelector('#segBack')?.addEventListener('click', () => selectKey(null));
}

function escHtml(s) {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
    .replace(/  /g, '&nbsp;&nbsp;');
}
