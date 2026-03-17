import '../css/variables.css';
import '../css/layout.css';
import '../css/scenarios.css';
import '../css/center.css';
import '../css/interactive.css';
import '../css/right.css';
import '../css/simulator.css';

import { initTheme, select } from './interactions.js';
import { renderScenarios } from './render/scenarios.js';

initTheme();
renderScenarios();
select('fresh');
