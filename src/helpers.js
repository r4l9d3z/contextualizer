import { TOTAL } from './state.js';

export const fmt = n =>
  n >= 10000 ? (n / 1000).toFixed(0) + 'k'
  : n >= 1000 ? (n / 1000).toFixed(1) + 'k'
  : String(n);

export const pctStr = (n, t) => ((n / t) * 100).toFixed(1) + '%';

export const uc = r => r < 0.55 ? '#48a870' : r < 0.8 ? '#c8b530' : '#e05555';

export const isGen = t => t.assistant === null || t.assistant === undefined;

export const infraTok = sc => Object.values(sc.infra).reduce((a, v) => a + v, 0);

export const turnTok = t =>
  (t.files || 0) + (t.user || 0) + (t.thinking || 0) +
  (t.toolcall || 0) + (t.toolres || 0) + (t.assistant || 0);

export const usedTok = sc => infraTok(sc) + sc.turns.reduce((a, t) => a + turnTok(t), 0);

export function truncRisk(sc) {
  const total = usedTok(sc) + sc.maxOut;
  if (total <= TOTAL * 0.85) return new Set();
  let excess = total - TOTAL * 0.85, removed = 0;
  const risk = new Set();
  for (let i = 0; i < sc.turns.length - 1; i++) {
    if (removed >= excess) break;
    risk.add(i);
    removed += turnTok(sc.turns[i]);
  }
  return risk;
}

export function turnChunks(turn, isLast) {
  const c = [];
  if (turn.files)    c.push({ key: 'files',    tokens: turn.files });
  if (turn.user)     c.push({ key: 'user',     tokens: turn.user });
  if (turn.thinking) c.push({ key: 'thinking', tokens: turn.thinking });
  if (turn.toolcall) c.push({ key: 'toolcall', tokens: turn.toolcall });
  if (turn.toolres)  c.push({ key: 'toolres',  tokens: turn.toolres });
  if (!isGen(turn))  c.push({ key: 'assistant', tokens: turn.assistant });
  else if (isLast)   c.push({ gen: true });
  return c;
}

export function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
    .replace(/  /g, '&nbsp;&nbsp;');
}

export function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
