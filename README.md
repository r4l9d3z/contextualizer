# Contextualizer

> **See exactly what fills an LLM context window — and why it runs out.**

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen?style=flat-square)](https://r4l9d3z.github.io/contextualizer/)
[![Single file](https://img.shields.io/badge/build-single%20HTML%20file-blue?style=flat-square)]()
[![No dependencies](https://img.shields.io/badge/dependencies-none-lightgrey?style=flat-square)]()

-----

## Why this exists

If you’ve ever wondered why a model “forgot” something from earlier in the conversation, or why your carefully engineered agent starts hallucinating after a few tool calls — the answer is almost always the context window.

The problem is that the window is invisible. You can’t see how full it is, what’s taking up space, or which turns are about to be silently dropped.

**Contextualizer makes all of that visible.** It models the exact order and structure of a real context window — infrastructure first, then interleaved conversation turns, then tool results and reasoning — so you can develop an intuition for how tokens are consumed before you hit a production problem.

**Useful if you are:**

- Building on the LLM API and designing prompt architecture
- Debugging why a model loses track of context mid-conversation
- Teaching or learning how LLMs actually work under the hood
- Evaluating tradeoffs between RAG, MCP, memory, and tool use

-----

## Table of contents

- [What fills the window](#what-fills-the-window)
- [Key concepts](#key-concepts)
- [Scenarios](#scenarios)
- [How to use it](#how-to-use-it)
- [Running locally](#running-locally)
- [Technical notes](#technical-notes)
- [Contributing](#contributing)

-----

## What fills the window

A context window is not just chat history. It is a single flat sequence of token blocks, loaded in a specific order every time an API call is made. Here’s what actually goes in, and when.

### Phase 1 — Infrastructure (before any conversation)

Everything below is transmitted on **every single API call**, regardless of how long the conversation has been running.

|Segment             |Who sets it         |Key behaviour                                                              |Typical size |
|--------------------|--------------------|---------------------------------------------------------------------------|-------------|
|**System Prompt**   |Anthropic + Operator|Always index 0. Never truncated, even at capacity                          |3k – 12k     |
|**Tool Definitions**|Platform + Operator |JSON schemas for every tool — cost paid even if tool is never called       |3k – 20k     |
|**RAG Chunks**      |Retrieval pipeline  |Retrieved fresh per request. Irrelevant chunks silently waste budget       |2k – 30k     |
|**Retrieved Memory**|Memory system       |Compressed summaries of past sessions. Much cheaper than replaying history |200 – 3k     |
|**MCP Server Data** |External MCP servers|Tool schemas + pre-fetched data (emails, calendar, Slack). Grows per server|2k – 20k each|

A fully-equipped production setup — system prompt + tools + RAG + memory + two MCP servers — can consume **35k–50k tokens before the first user message is sent**. That’s up to 40% of a 128k window as fixed overhead.

### Phase 2 — Conversation turns (interleaved, in order)

Turns are stored and re-sent in strict alternating order: `user → assistant → user → assistant`. They are **not** grouped by type. Every prior turn is re-transmitted verbatim on each new API call.

|Segment                    |Key behaviour                                                              |Typical size  |
|---------------------------|---------------------------------------------------------------------------|--------------|
|**User Message**           |Re-sent in full every call                                                 |50 – 5k       |
|**Uploaded Files / Images**|Injected inline in the turn they were attached to                          |500 – 50k+    |
|**Extended Thinking**      |Reasoning scratchpad inside the assistant turn. Can be enormous            |2k – 60k      |
|**Tool Call (outgoing)**   |Structured JSON to invoke a tool. Separate from and smaller than the result|100 – 600 each|
|**Tool Result**            |Raw output injected after the call. Frequently the largest single item     |500 – 60k each|
|**Assistant Response**     |Completed reply. Re-sent on every subsequent call                          |100 – 10k     |

### Phase 3 — Reserved (at the end)

|Segment               |Key behaviour                                                                        |Typical size|
|----------------------|-------------------------------------------------------------------------------------|------------|
|**Output Budget**     |Space reserved by `max_tokens`. Counts against the context limit                     |4k – 16k    |
|**Current Generation**|What the model is writing **right now**. Not in context yet — enters on the next call|—           |

-----

## Key concepts

### The window is stateless — everything travels every time

There is no persistent memory between API calls. The server remembers nothing. Every call is a fresh request that must re-supply the complete conversation history from scratch.

A 10-turn conversation sends all 10 user messages and all 10 assistant responses on every single call. The model “remembers” turn 3 not because it was stored — because it was re-transmitted.

**Implication:** a verbose assistant response doesn’t just cost tokens once. It costs those tokens again on every future turn in the conversation.

### Infrastructure overhead compounds silently

In an 8-turn research session with 39.5k tokens of infrastructure, that infrastructure is transmitted 8 times. Total infrastructure cost across the session: **316k tokens** — for content that never changes.

### Tool results are the wildcard

Tool definitions cost tokens upfront. Tool results cost tokens per invocation — and they’re completely unbounded. A single `web_fetch` call can return 50k+ tokens of page content. Three tool calls in one agentic turn can add 30k tokens before the assistant writes a word of its reply.

### Extended thinking can take over the window

When extended thinking is enabled, a genuinely hard problem can produce a 30k–50k token reasoning block inside a single turn. In the extended thinking scenario in this tool, one thinking block consumes **24% of the entire 128k window**.

The formula: `input tokens + max_tokens ≤ 128k`. If thinking runs long and the conversation history is substantial, the available space for the actual response shrinks fast.

### Truncation is silent, ordered, and lossy

When the window fills up:

1. The **oldest conversation turns are dropped first** — not the largest, not the least important, the oldest
1. The **system prompt and infrastructure are never truncated** — they are protected
1. **No error is thrown** — the model simply receives a shorter history and may not know what was dropped

The practical consequence: if the model designed an architecture in turn 1 and that turn gets truncated by turn 8, it will give deployment advice inconsistent with its own earlier decisions — with no warning to the user.

-----

## Scenarios

Nine scenarios walk through progressively more complex setups. Each one shows the window state at a specific moment in a realistic conversation.

|Scenario                 |Window usage|What it demonstrates                                                     |
|-------------------------|------------|-------------------------------------------------------------------------|
|**Fresh Conversation**   |~11%        |Baseline infrastructure before any conversation                          |
|**After First Reply**    |~12%        |How completed turns become permanent, re-sent history                    |
|**+ RAG + Memory**       |~19%        |Knowledge retrieval cost vs. quality benefit                             |
|**+ MCP Servers**        |~30%        |Pre-fetched data from Gmail + Calendar; answering without live tool calls|
|**Tool Use Mid-Turn**    |~41%        |Web search flow: thinking → tool call → result → response                |
|**Agentic: 3 Tool Calls**|~56%        |Chained autonomous research — EU/US/China AI regulation                  |
|**Extended Thinking ON** |~73%        |A 31k token thinking block on an NP-completeness proof                   |
|**Long Research Session**|~77%        |8-turn semiconductor analyst session — watch the window fill             |
|**⚠ Near Context Limit** |~89%        |SaaS product build — oldest turns truncated, model loses context         |

The last scenario is the most instructive: the model’s thinking block in turn 6 explicitly notes that turns 1–2 appear to have been dropped, and it has to reconstruct decisions it can no longer see.

-----

## How to use it

```
┌─────────────┐  ┌──────────────────────────────────────┐  ┌──────────────────┐
│  Scenarios  │  │          Center panel                │  │   Detail panel   │
│             │  │                                      │  │                  │
│ Click any   │  │  ① Linear bar — absolute scale       │  │  Default:        │
│ scenario to │  │    Shows every segment in order      │  │  Token budget    │
│ load it     │  │                                      │  │  breakdown       │
│             │  │  ② Utilization bar — % full          │  │                  │
│ Active one  │  │                                      │  │  Click a turn:   │
│ is          │  │  ③ Turn stack — relative scale       │  │  Explanation +   │
│ highlighted │  │    Click any row → detail panel      │  │  real example +  │
│             │  │                                      │  │  segment list    │
└─────────────┘  │  ④ Legend — click to highlight       │  │                  │
                 │    a type across all views           │  │  Click a segment:│
                 │                                      │  │  Technical deep  │
                 └──────────────────────────────────────┘  │  dive            │
                                                           └──────────────────┘
```

**Turn rows** — bars are scaled to *used* tokens (not total window) so small segments stay readable. The cumulative column on the right shows `+Xk` added this turn and `∑ Xk` total sent to the API so far.

**Linear bar** — scaled to the full 128k window. The vertical divider marks where infrastructure ends and conversation turns begin. When a turn is selected, non-selected segments dim and a bracket appears under the selected turn’s chunks.

**Prev / Next** in the detail panel — step through every turn without returning to the budget view.

**⚠ rows** in the crisis scenario — faded rows with orange labels are turns that will be dropped before the current API call completes.

-----

## License

MIT — do whatever you want with it.
