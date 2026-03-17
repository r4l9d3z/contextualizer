# Contextualizer

> **See exactly what fills an LLM context window — and simulate it yourself.**

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen?style=flat-square)](https://r4l9d3z.github.io/contextualizer/)

An interactive LLM context window simulator. Submit a prompt, watch tool calls fire, and see exactly how the 128k context window fills up — turn by turn, segment by segment.

## What It Does

Context windows are invisible by default. This tool makes them tangible:

- **🎬 Simulator mode** — type a prompt, click Submit, and watch a scripted simulation unfold: user message → thinking → tool call → tool result → assistant response. The context window visualization updates in real time as each step is added.
- **✏ Interactive Build** — manually toggle infrastructure components, send messages, add tool calls, and generate responses step by step.
- **9 preset scenarios** — curated walkthroughs from a fresh conversation (11% full) to near context limit (89% full, oldest turns being dropped).

## The Simulator

The simulator drives **scripted tool calls** against a bundled synthetic project (a fictional todo app). No API key required — it works fully offline as a static site.

**Prompts that trigger tool call sequences:**

| Prompt pattern | Sequence triggered |
|---|---|
| "read src/storage.js" | `list_files` → `read_file` → response |
| "list the files" | `list_files` → response |
| "search for loadTodos" | `search_files` → response |
| "analyze the storage module" | `list_files` → `read_file` × 2 → response |
| Anything else | user message → optional thinking → response |

Toggle **extended thinking** to watch thinking blocks grow and dominate the window. Adjust the **speed** (Slow / Normal / Fast) to control animation pacing.

## What Fills a Context Window

### Phase 1 — Infrastructure (every call)
| Component | Who sets it | Typical size |
|---|---|---|
| System Prompt | Operator | 3k – 12k |
| Tool Definitions | Platform | 3k – 20k |
| RAG Chunks | Retrieval pipeline | 2k – 30k |
| Retrieved Memory | Memory system | 200 – 3k |
| MCP Server Data | MCP servers | 2k – 20k per server |

### Phase 2 — Conversation (per turn)
User messages, uploaded files, tool calls, tool results, assistant responses, extended thinking.

### Phase 3 — Reserved
`max_tokens` output budget — counts against the total window limit.

## Key Concepts

- **Stateless** — every API call re-sends the full history from scratch. Nothing is remembered between calls.
- **Infrastructure compounds** — paid on every single API call, even for a one-line follow-up.
- **Tool results are unbounded** — one `web_fetch` can return 50k tokens.
- **Extended thinking dominates** — hard reasoning problems routinely generate 20k–50k token thinking blocks.
- **Truncation is silent** — when the window fills, oldest turns are dropped without warning.

## Running Locally

```bash
npm install
npm run dev
```

Open http://localhost:5173/contextualizer/ in your browser.

```bash
npm run build    # produce static dist/ for deployment
npm run preview  # preview the production build locally
```

## Deployment (GitHub Pages)

Pushing to `master` triggers a GitHub Actions workflow that:
1. Runs `npm ci && npm run build`
2. Deploys `dist/` to the `gh-pages` branch via [peaceiris/actions-gh-pages](https://github.com/peaceiris/actions-gh-pages)

The site is then served at `https://<user>.github.io/contextualizer/`.

The `vite.config.js` sets `base: '/contextualizer/'` to match the GitHub Pages sub-path.

## Tech Stack

| Layer | Technology |
|---|---|
| Build | [Vite 6](https://vite.dev) |
| Language | Vanilla JavaScript (ES modules) |
| Styling | Vanilla CSS with custom properties |
| Fonts | JetBrains Mono + Syne (Google Fonts) |
| Deploy | GitHub Actions → GitHub Pages |
| Runtime dependencies | Zero |

## Project Structure

```
contextualizer/
├── index.html                  # Shell HTML — minimal boilerplate
├── vite.config.js              # Base path for GitHub Pages sub-path
├── package.json
├── .github/workflows/deploy.yml
├── src/
│   ├── main.js                 # Entry point — imports CSS + calls init()
│   ├── state.js                # Shared mutable state (SC, HK, HT) + TOTAL
│   ├── helpers.js              # Pure functions: fmt, usedTok, truncRisk, etc.
│   ├── interactions.js         # select(), selectKey(), selectTurn(), theme
│   ├── data/
│   │   ├── types.js            # Segment type registry (T)
│   │   ├── phases.js           # Phase groupings for the budget panel
│   │   ├── scenarios.js        # 9 preset scenario definitions
│   │   └── interactive.js      # IX state, PRESETS, makeTurnMeta()
│   ├── render/
│   │   ├── index.js            # Re-exports + rerender() / ixRerender()
│   │   ├── scenarios.js        # Left panel scenario buttons
│   │   ├── linbar.js           # Linear bar (absolute 128k scale)
│   │   ├── turns.js            # Turn stack (relative scale)
│   │   ├── legend.js           # Color legend
│   │   ├── right.js            # Token budget + turn/segment detail
│   │   └── interactive.js      # Interactive Build panel + wiring
│   └── simulator/
│       ├── engine.js           # Prompt → script → animated step sequence
│       ├── tools.js            # read_file, list_files, search_files handlers
│       ├── panel.js            # Simulator UI panel + event wiring
│       └── sampleFiles.js      # Bundled synthetic todo-app project files
└── css/
    ├── variables.css           # CSS custom properties (dark + light themes)
    ├── layout.css              # Body, 3-column grid, panels
    ├── scenarios.css           # Scenario buttons
    ├── center.css              # Linear bar, turn stack, legend
    ├── interactive.css         # Interactive Build controls
    ├── right.css               # Token budget + detail panels
    └── simulator.css           # Simulator panel styles
```

## Scenarios

1. **Fresh Conversation** (11%) — infrastructure only, first message sending
2. **After First Reply** (12%) — history builds, re-sent every call
3. **+ RAG + Memory** (19%) — knowledge retrieval cost
4. **+ MCP Servers** (30%) — Gmail + Calendar pre-fetched data
5. **Tool Use Mid-Turn** (41%) — live web search during a response
6. **Agentic: 3 Tool Calls** (56%) — chained autonomous research
7. **Extended Thinking ON** (73%) — 31k token thinking block dominates
8. **Long Research Session** (77%) — 8-turn semiconductor analyst
9. **⚠ Near Context Limit** (89%) — oldest turns truncated, model loses history
