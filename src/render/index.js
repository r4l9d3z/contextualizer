export { renderScenarios } from './scenarios.js';
export { renderLinbar } from './linbar.js';
export { renderTurns } from './turns.js';
export { renderLegend } from './legend.js';
export { renderRight } from './right.js';
export { renderIxPanel, wireIxPanel, ixReset, ixAddSegmentToLastTurn } from './interactive.js';
import { state } from '../state.js';
import { renderLinbar } from './linbar.js';
import { renderTurns } from './turns.js';
import { renderLegend } from './legend.js';
import { renderRight } from './right.js';
import { renderIxPanel } from './interactive.js';
import { IX } from '../data/interactive.js';

export function rerender() {
  renderLinbar(state.SC);
  renderTurns(state.SC);
  renderLegend();
  renderRight();
}

export function ixRerender() {
  renderIxPanel();
  rerender();
}
