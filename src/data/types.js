export const T = {
  system:{
    name:'System Prompt', color:'#e05555', badge:'always first', who:'Anthropic + Operator',
    desc:'The first thing in every context window — sent verbatim at the very top of every single API call. Defines identity, safety rules, capabilities, and operator behavior. Never truncated, even during a context crisis.',
    items:[
      {l:'Position',    v:'Index 0 — guaranteed to be the first thing the model reads'},
      {l:'Content',     v:'Persona, tone rules, capability flags, safety guidelines, operator instructions'},
      {l:'Protected',   v:'Never dropped during truncation — treated as permanent infrastructure'},
      {l:'Typical size',v:'3k – 12k tokens'},
    ]
  },
  tools:{
    name:'Tool Definitions', color:'#c8b530', badge:'infrastructure', who:'Platform + Operator',
    desc:"JSON schemas describing every tool Claude can invoke. Placed right after the system prompt. Each tool costs tokens even if it's never called. A 20-tool setup consumes 6k–16k tokens before the first message.",
    items:[
      {l:'Position',    v:'After system prompt, before any conversation turns'},
      {l:'Per tool',    v:'~300–800 tokens per schema (name + description + params)'},
      {l:'Waste risk',  v:'Defining tools that are never called silently drains budget every call'},
      {l:'Typical size',v:'3k – 20k tokens'},
    ]
  },
  rag:{
    name:'RAG Chunks', color:'#48a870', badge:'on demand', who:'Retrieval pipeline',
    desc:"Document snippets retrieved from a vector database and injected before the conversation. The model never permanently learned this knowledge — it's provided fresh on every request. Quality depends entirely on retrieval precision.",
    items:[
      {l:'Position',    v:'After tool defs, before conversation turns'},
      {l:'How it works',v:'Semantic search over embeddings → top-k chunks injected'},
      {l:'Risk',        v:'Irrelevant chunks consume budget without improving answers'},
      {l:'Typical size',v:'2k – 30k tokens'},
    ]
  },
  memory:{
    name:'Retrieved Memory', color:'#32c0a0', badge:'on demand', who:'Memory system',
    desc:'Compressed summaries of past conversations, retrieved and injected before the current exchange. Far more token-efficient than replaying full verbatim history — weeks of chats can compress to a few hundred tokens.',
    items:[
      {l:'Position',    v:'With RAG, before conversation turns'},
      {l:'vs. history', v:'Summaries not verbatim — much more compressed'},
      {l:'Typical size',v:'200 – 3k tokens'},
    ]
  },
  mcp:{
    name:'MCP Server Data', color:'#3898dc', badge:'when connected', who:'MCP servers',
    desc:'Tool schemas and pre-fetched data from connected MCP servers (Gmail, Calendar, Slack…). Each server injects both its tool schemas and any data it retrieved. Grows with each additional server.',
    items:[
      {l:'Position',    v:'With other infrastructure, before conversation turns'},
      {l:'Content',     v:'MCP tool schemas + fetched emails, calendar events, Slack messages'},
      {l:'Growth',      v:'Each server adds 2k–8k tokens of schemas alone, plus fetched data'},
      {l:'Typical size',v:'2k – 20k per connected server'},
    ]
  },
  files:{
    name:'Uploaded Files / Images', color:'#5068e0', badge:'inline with turn', who:'User',
    desc:'Injected inline within the turn where the user uploaded them — not at the start. A multi-page PDF can add 10k–50k tokens to a single turn. Images cost ~1k–4k tokens each depending on resolution.',
    items:[
      {l:'Position',    v:'Inside the user turn they were attached to'},
      {l:'PDFs',        v:'Full extracted text injected verbatim — scales with page count'},
      {l:'Images',      v:'~1k–4k tokens per image'},
      {l:'Typical size',v:'500 – 50k+ tokens (unbounded)'},
    ]
  },
  user:{
    name:'User Message', color:'#7258dc', badge:'per turn', who:'Human',
    desc:'Each user message alternates with assistant responses in strict order. Every prior user message is re-sent on each API call — context is stateless, so the full history is re-transmitted every time.',
    items:[
      {l:'Position',    v:'Alternates strictly with assistant responses'},
      {l:'Re-sent',     v:'Every previous message travels with every new API call'},
      {l:'Typical size',v:'50 – 5k tokens per message'},
    ]
  },
  thinking:{
    name:'Extended Thinking', color:'#b838b8', badge:'optional mode', who:'Claude',
    desc:"Claude's internal reasoning scratchpad, generated before the reply and stored inside the assistant turn. Can completely dominate the context window — hard reasoning problems routinely produce 20k–50k token thinking blocks.",
    items:[
      {l:'Position',    v:'Inside assistant turn, before the response text'},
      {l:'Warning',     v:'A single block can consume 25–40% of the entire window'},
      {l:'When useful', v:'Math proofs, multi-step planning, complex analysis, debugging'},
      {l:'Typical size',v:'2k – 60k tokens'},
    ]
  },
  toolcall:{
    name:'Tool Call (outgoing)', color:'#e09838', badge:'per invocation', who:'Claude',
    desc:'The structured JSON Claude emits to invoke a tool. Appears inside the assistant turn, separate from and smaller than the result it triggers. Accumulates across multiple calls in agentic loops.',
    items:[
      {l:'Position',    v:'Inside assistant turn, after thinking (if any)'},
      {l:'Content',     v:'Tool name, structured arguments, unique call ID'},
      {l:'In loops',    v:'10 tool calls = 1k–6k tokens of overhead just for the calls'},
      {l:'Typical size',v:'100 – 600 tokens each'},
    ]
  },
  toolres:{
    name:'Tool Result', color:'#40b8b8', badge:'per invocation', who:'External service',
    desc:"Raw output returned by a tool, injected as a special context entry. Often the single largest token consumer in an agentic turn. A single web_fetch can return 50k tokens — truncation strategies are critical.",
    items:[
      {l:'Position',    v:"Follows its tool call, before the assistant's final reply"},
      {l:'Risk',        v:'Completely unbounded — one fetch can overflow the entire window'},
      {l:'Best practice',v:"Truncate results; extract only what's needed"},
      {l:'Typical size',v:'500 – 60k tokens'},
    ]
  },
  assistant:{
    name:'Assistant Response', color:'#dc5088', badge:'per turn', who:'Claude',
    desc:"Claude's completed reply, stored in history and re-sent on every subsequent call. This is NOT the current generation — only finished turns. The model's own verbosity permanently taxes its future context budget.",
    items:[
      {l:'Position',    v:'End of each completed turn'},
      {l:'Key point',   v:"What's currently being generated is OUTPUT — not yet in context"},
      {l:'Accumulates', v:'Every prior response is re-sent in full on each new API call'},
      {l:'Typical size',v:'100 – 10k tokens per response'},
    ]
  },
  generating:{
    name:'Current Generation (Output)', color:'#b838b8', badge:'NOT in context', who:'Claude (now)',
    desc:"What the model is writing right now is the OUTPUT — it does not exist inside the context window yet. It only enters context on the NEXT API call, after the user sends another message.",
    items:[
      {l:'Status',         v:'Being streamed — not yet part of the context window'},
      {l:'Enters context', v:'Only on the next API call, after user sends next message'},
      {l:'This explains',  v:"Why the model can't re-read its own response as it writes it"},
      {l:'Budget',         v:'Limited by the separate max_tokens parameter'},
    ]
  },
  output_budget:{
    name:'Output Budget (max_tokens)', color:'#3898dc', badge:'reserved', who:'API parameter',
    desc:"Space reserved for the model's upcoming response, controlled by the max_tokens API parameter. This counts against the total context limit — it's a hard reservation, not a suggestion.",
    items:[
      {l:'Formula',  v:'input_tokens + max_tokens ≤ 128k total window'},
      {l:'Effect',   v:'A large max_tokens directly shrinks available history space'},
      {l:'Typical',  v:'4k – 16k tokens reserved'},
    ]
  },
};
