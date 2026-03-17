import { TOTAL, state } from '../state.js';
import { T } from '../data/types.js';
import { infraTok, turnTok, usedTok, truncRisk, turnChunks, isGen, fmt, pctStr, uc } from '../helpers.js';
import { selectTurn, selectKey, showTip, hideTip } from '../interactions.js';

export function renderTurns(sc) {
  const el = document.getElementById('turns'); el.innerHTML = '';
  const used = usedTok(sc), denom = used || 1, risk = truncRisk(sc);
  const HT = state.HT, HK = state.HK;
  let cum = 0;

  // Section: Infrastructure
  const sep1 = document.createElement('div'); sep1.className = 'turn-section-sep'; sep1.textContent = 'Infrastructure'; el.appendChild(sep1);

  // Infra row
  const infra = infraTok(sc); cum += infra;
  {
    const row = makeRow(-1, 'INFRA', null, null, false, false, HT, HK);
    const bar = row.querySelector('.tbar');
    for (const [k, v] of Object.entries(sc.infra)) {
      if (!v) continue;
      bar.appendChild(makeTc(k, v, denom, HK));
    }
    bar.appendChild(mkFree());
    row.querySelector('.tcum').innerHTML = '<span class="cv">' + fmt(infra) + '</span><span class="cl">per call</span>';
    el.appendChild(row);
  }

  // Section: Conversation
  const sep2 = document.createElement('div'); sep2.className = 'turn-section-sep'; sep2.textContent = 'Conversation turns'; el.appendChild(sep2);

  sc.turns.forEach((turn, i) => {
    const toks = turnTok(turn); cum += toks;
    const isLast = i === sc.turns.length - 1;
    const gen = isGen(turn) && isLast;
    const atRisk = risk.has(i);

    const row = makeRow(i, 'T' + (i + 1), toks, TOTAL, atRisk, gen, HT, HK);
    const bar = row.querySelector('.tbar');
    const chunks = turnChunks(turn, isLast);
    chunks.forEach(c => {
      if (c.gen) {
        const g = document.createElement('div'); g.className = 'tc-gen';
        const span = document.createElement('span'); span.textContent = '← generating'; g.appendChild(span);
        g.addEventListener('click', e => { e.stopPropagation(); selectKey('generating'); });
        bar.appendChild(g);
        const ob = document.createElement('div'); ob.className = 'tc-out';
        ob.style.width = (sc.maxOut / denom * 100) + '%'; ob.style.minWidth = '4px';
        ob.addEventListener('click', e => { e.stopPropagation(); selectKey('output_budget'); });
        bar.appendChild(ob);
      } else {
        bar.appendChild(makeTc(c.key, c.tokens, denom, HK));
      }
    });
    if (!gen) bar.appendChild(mkFree());

    const cum_el = row.querySelector('.tcum');
    if (atRisk) {
      cum_el.className = 'tcum warn';
      cum_el.innerHTML = '<span class="cv">&#9888; ' + fmt(toks) + '</span><span class="cl">will drop</span>';
    } else if (gen) {
      cum_el.innerHTML = '<span class="cv">&#8721; ' + fmt(cum - toks) + '</span><span class="cl">in context</span>';
    } else {
      cum_el.innerHTML = '<span class="cv">+' + fmt(toks) + '</span><span class="cl">&#8721; ' + fmt(cum) + '</span>';
    }
    el.appendChild(row);
  });
}

function makeRow(idx, label, toks, total, atRisk, gen, HT, HK) {
  const row = document.createElement('div');
  row.className = 'trow' + (HT === idx ? ' sel' : '') + (atRisk ? ' trunc' : '');
  row.addEventListener('click', () => selectTurn(idx));

  const left = document.createElement('div'); left.className = 'trow-left';
  const lbl = document.createElement('div');
  lbl.className = 'trow-label' + (idx === -1 ? ' infra-lbl' : gen ? ' gen-lbl' : '');
  lbl.innerHTML = label + (atRisk ? ' <span style="color:#e09838;font-size:.48rem">&#9888;</span>' : '') + (gen ? ' <span style="font-size:.5rem">&#9654;</span>' : '');
  left.appendChild(lbl);
  if (toks && total) {
    const pct = document.createElement('div'); pct.className = 'trow-pct';
    pct.textContent = ((toks / total) * 100).toFixed(1) + '%'; left.appendChild(pct);
  }
  row.appendChild(left);

  const bar = document.createElement('div'); bar.className = 'tbar'; row.appendChild(bar);
  const cum = document.createElement('div'); cum.className = 'tcum'; row.appendChild(cum);
  return row;
}

function makeTc(key, tokens, denom, HK) {
  const d = T[key], w = (tokens / denom) * 100;
  const c = document.createElement('div');
  c.className = 'tc' + (HK === key ? ' hl' : '');
  c.style.cssText = 'width:' + Math.max(w, .08) + '%;background:' + (d && d.color ? d.color : '#888');
  if (w > 4.5) c.textContent = d && d.name ? d.name : key;
  c.addEventListener('click', e => { e.stopPropagation(); selectKey(key); });
  c.addEventListener('mousemove', e => showTip(e, { key, tokens }));
  c.addEventListener('mouseleave', hideTip);
  return c;
}

function mkFree() {
  const d = document.createElement('div'); d.className = 'tc-free'; return d;
}
