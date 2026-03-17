export const SCENARIOS = [
{
  id:'fresh', label:'Fresh Conversation', sub:'First message, no history yet',
  infra:{system:5200, tools:8500},
  maxOut:4000,
  infraDesc:{
    title:'Infrastructure — loaded before everything',
    desc:'Before any conversation, every API call front-loads all infrastructure. The system prompt defines who Claude is; the tool schemas define what it can do. This is constant overhead paid on every single request — including turn 1.',
    example:[
      {type:'system',      text:'You are Claude, a helpful AI assistant made by Anthropic. You have access to web_search, code_execution, and file_create. Today is Saturday, March 14 2026. Respond helpfully and accurately...'},
      {type:'tool-result', text:'[Tool schemas loaded]\n• web_search — search the web for current info\n• code_execution — run Python code in a sandbox\n• file_create — write files for the user to download\n(each schema: 300–800 tokens of JSON)'},
    ],
    note:'This <b>13.7k token</b> infrastructure block is <b>re-sent verbatim</b> on every API call in this conversation. Even if the conversation grows to 50 turns, this exact block still arrives first, every time.'
  },
  turns:[
    {
      user:140, assistant:null,
      title:'Turn 1', desc:'First message sent, response generating',
      fullDesc:'The user sends their opening message. The model receives the full infrastructure block plus this single user message, then begins generating a response. That response is the OUTPUT — it doesn\'t exist in context yet.',
      example:[
        {type:'user',       text:'"Hey, can you help me understand how transformer attention works?"'},
        {type:'generating', text:'← Model is generating a response. Not in context yet.'},
      ],
      note:'Total context so far: <b>~13.8k tokens</b>. The model has ~110k free tokens. The infrastructure block is 98% of what\'s in context — the user\'s question is just 1%.'
    }
  ]
},
{
  id:'replied', label:'After First Reply', sub:'History builds — re-sent every call',
  infra:{system:5200, tools:8500},
  maxOut:4000,
  infraDesc:{
    title:'Infrastructure — re-sent every call',
    desc:'Same infrastructure as always. The critical insight: even though nothing changed in the infrastructure, all 13.7k tokens of it are re-transmitted to the API with every single call. There is no caching of the system prompt between requests.',
    example:[
      {type:'system', text:'You are Claude... [same 5.2k tokens as before]'},
      {type:'tool-result', text:'[Tool schemas — same 8.5k tokens as before]'},
    ],
    note:'API calls are <b>completely stateless</b>. The server remembers nothing. Every call is independent and must include everything from scratch.'
  },
  turns:[
    {
      user:140, assistant:480,
      title:'Turn 1', desc:'Completed — now permanent history',
      fullDesc:'The first exchange is complete. Both the user message AND the assistant\'s response are now history. They will be re-sent on every future API call for the rest of this conversation — there is no way to remove them without losing context continuity.',
      example:[
        {type:'user',      text:'"Hey, can you help me understand how transformer attention works?"'},
        {type:'assistant', text:'"Sure! Transformer attention lets the model weigh how relevant each word is to every other word. For each token it computes query (Q), key (K), and value (V) vectors. The attention score is: Attention(Q,K,V) = softmax(QKᵀ/√dk)·V..."'},
      ],
      note:'This completed turn permanently occupies <b>~620 tokens</b> of every future context window in this conversation. If there are 20 more turns, this exchange is re-sent 20 more times.'
    },
    {
      user:110, assistant:null,
      title:'Turn 2', desc:'Follow-up sent, generating response',
      fullDesc:'The user asks a follow-up. The API now receives: full infrastructure + turn 1 (user + assistant) + this new message. The model "remembers" the first exchange not because it has memory, but because turn 1 was re-sent in this call\'s context.',
      example:[
        {type:'user',       text:'"What\'s the difference between self-attention and cross-attention?"'},
        {type:'generating', text:'← Generating... (not yet in context)'},
      ],
      note:'Context sent to API: <b>13.7k (infra) + 620 (turn 1) + 110 (this message) = 14.4k tokens</b>. The model "remembers" the previous answer because it was re-sent, not stored.'
    }
  ]
},
{
  id:'rag', label:'+ RAG + Memory', sub:'Knowledge retrieval added',
  infra:{system:5200, tools:8500, rag:9200, memory:650},
  maxOut:4000,
  infraDesc:{
    title:'Infrastructure + RAG + Memory',
    desc:'Before the conversation, a retrieval pipeline searched a knowledge base for documents relevant to the user\'s topic, and a memory system fetched facts about this user from past sessions. Both are injected here, before any conversation.',
    example:[
      {type:'system',      text:'You are Claude, an AI assistant for Meridian Research. Use the retrieved documents to provide accurate, grounded responses...'},
      {type:'tool-result', text:'[RAG — 3 documents retrieved]\n• "Attention Is All You Need" — sections 3.2–3.4 (2,400 tokens)\n• Internal ML glossary — 28 definitions (1,800 tokens)\n• Transformer benchmark comparisons — table + notes (1,100 tokens)'},
      {type:'tool-result', text:'[MEMORY — user profile]\n• Name: Dr. Sarah Chen, Senior ML Researcher\n• Expertise: NLP, transformer architectures\n• Style preference: mathematical depth + code examples\n• Last session: discussed BERT fine-tuning for classification'},
    ],
    note:'RAG + memory cost <b>9.85k tokens</b> upfront. But the answers they enable are dramatically more grounded. Trade-off: richer context vs. available conversation space.'
  },
  turns:[
    {
      user:140, assistant:480,
      title:'Turn 1', desc:'First answer informed by RAG',
      fullDesc:'The assistant\'s response is informed by the retrieved documents and user memory. It can cite the Attention paper, tailor the depth to Dr. Chen\'s ML background, and give code examples because memory indicated that\'s her preference.',
      example:[
        {type:'user',      text:'"Can you walk me through scaled dot-product attention mathematically?"'},
        {type:'assistant', text:'"Based on Vaswani et al. (retrieved), scaled dot-product attention is:\n\n  Attention(Q,K,V) = softmax(QKᵀ/√dk) · V\n\nThe √dk scaling prevents vanishing gradients when dk is large — without it, for dk=512, the dot products can reach ~22σ, pushing softmax into near-zero gradient regions..."'},
      ],
      note:'The RAG context made this answer dramatically better. But it cost <b>9.2k tokens</b> of infrastructure budget — before a single turn of conversation.'
    },
    {
      user:220, assistant:720,
      title:'Turn 2', desc:'Follow-up using same RAG context',
      fullDesc:'The user goes deeper. By turn 2, the conversation builds on turn 1. The model still has the retrieved documents in context — they remain available for the entire session without being re-retrieved.',
      example:[
        {type:'user',      text:'"And multi-head attention — can you show PyTorch code with the math?"'},
        {type:'assistant', text:'"Multi-head attention runs h parallel attention functions then concatenates:\n\n```python\nclass MultiHeadAttention(nn.Module):\n    def __init__(self, d_model=512, h=8):\n        self.W_q = nn.Linear(d_model, d_model)\n        self.W_k = nn.Linear(d_model, d_model)\n        self.W_v = nn.Linear(d_model, d_model)\n    def forward(self, Q, K, V):\n        # Split into h=8 heads, each dk=64\n        ...\n```\nEach head attends to different subspaces — some heads focus on syntax, others on long-range semantics..."'},
      ],
      note:'Code response is ~720 tokens — longer than average. It\'s now part of history and will be <b>re-sent in full</b> on every future call.'
    },
    {
      user:160, assistant:null,
      title:'Turn 3', desc:'Third question, generating',
      fullDesc:'Third message. Context window now holds: all infrastructure + RAG + memory + 2 complete turns + this message. The retrieved documents are still paying dividends — but now occupy 10% of the window.',
      example:[
        {type:'user',       text:'"How does positional encoding interact with attention? Why doesn\'t attention handle position naturally?"'},
        {type:'generating', text:'← Generating...'},
      ],
      note:'Infrastructure is now <b>23.5k tokens (18% of window)</b> before any conversation. That\'s the real cost of RAG: better answers, smaller conversation budget.'
    }
  ]
},
{
  id:'mcp', label:'+ MCP Servers', sub:'Gmail + Calendar connected',
  infra:{system:5200, tools:8500, rag:9200, memory:650, mcp:14000},
  maxOut:4000,
  infraDesc:{
    title:'Infrastructure + MCP server data',
    desc:'Two MCP servers are connected: Gmail and Google Calendar. Each injects its own tool schemas plus any data it pre-fetched. Gmail contributed today\'s top emails; Calendar added this week\'s events. All injected before the first word of conversation.',
    example:[
      {type:'system',      text:'You are Claude, a personal AI assistant with access to Gmail and Calendar. Use these connections to help with scheduling and communications...'},
      {type:'tool-result', text:'[MCP:Gmail — schemas + data]\nTools: search_email, send_email, get_thread, list_labels\nPre-fetched today\'s inbox (5 unread):\n• Marcus (9:02am): "Pre-read for 2pm Product Review — retention deck"\n• Alex (10:15am): "3 questions about Q2 roadmap"\n• Sarah (11:30am): "Can we push 4:30 to 5pm?"'},
      {type:'tool-result', text:'[MCP:Calendar — schemas + data]\nTools: get_events, create_event, find_available_slot\nThis week\'s events:\n• Today 2:00pm — Product Review (Marcus, Alex, Wei)\n• Today 4:30pm — 1:1 with Sarah\n• Tomorrow 10am — Engineering sync'},
    ],
    note:'MCP infrastructure: <b>14k tokens</b>. Combined with system + tools + RAG + memory: infrastructure is now <b>37.5k tokens — 29% of the window — before any conversation.</b>'
  },
  turns:[
    {
      user:140, assistant:480,
      title:'Turn 1', desc:'Answered from pre-fetched MCP data',
      fullDesc:'The user asks about today\'s schedule. No tool call needed — the Calendar data was already injected at infrastructure load time. The assistant synthesizes across Gmail and Calendar without making any live API calls.',
      example:[
        {type:'user',      text:'"Do I have anything important today and did anyone email about the 2pm meeting?"'},
        {type:'assistant', text:'"Yes — you have a Product Review at 2pm (Marcus, Alex, Wei) and a 1:1 with Sarah at 4:30pm (she emailed asking to push to 5pm).\n\nFor the 2pm: Marcus sent a pre-read deck at 9am focusing on retention. Alex has 3 roadmap questions. I\'d prep retention numbers and have roadmap answers ready."'},
      ],
      note:'Zero tool calls made. The answer came entirely from <b>pre-loaded MCP data</b>. This is the ideal MCP pattern: inject once, answer many.'
    },
    {
      user:220, assistant:720,
      title:'Turn 2', desc:'Cross-context synthesis',
      fullDesc:'A follow-up requiring synthesis across email + calendar + the previous answer. Still no tool calls — all the data is in context. The model weaves together three sources that were all pre-loaded at infrastructure time.',
      example:[
        {type:'user',      text:'"Draft a reply to Alex answering his roadmap questions — I know Q3 is AI features and Q4 is enterprise."'},
        {type:'assistant', text:'"Here\'s a reply to Alex:\n\n---\nHi Alex,\n\nThanks for the questions ahead of today\'s review. Quick answers:\n\n1. Q3 focus: AI features — specifically the assistant integration and smart suggestions\n2. Q4 focus: Enterprise tier — SSO, audit logging, and admin controls\n3. Timeline: Q3 kicks off May 1 after the current sprint wraps\n\nLet\'s discuss specifics at 2pm.\n---"'},
      ],
      note:'Still no tool calls. The draft was synthesized from <b>Gmail context + calendar context + prior turn</b>, all held in the same window.'
    },
    {
      user:180, assistant:null,
      title:'Turn 3', desc:'Generating',
      fullDesc:'The user asks for a live action — creating a calendar event — which requires an actual MCP tool call. The model will emit a structured tool call, the MCP server will execute it, and the result will be injected before the final reply.',
      example:[
        {type:'user',       text:'"Actually accept Sarah\'s request — move the 4:30 to 5pm and update the invite."'},
        {type:'generating', text:'← About to emit an MCP tool call to gcal to update the event...'},
      ],
      note:'First turn requiring a live tool call. The event update will happen during generation, adding a toolcall + toolres to this turn\'s history.'
    }
  ]
},
{
  id:'tooluse', label:'Tool Use Mid-Turn', sub:'Live search called during a response',
  infra:{system:5200, tools:8500, rag:6000, memory:500, mcp:14000},
  maxOut:4000,
  infraDesc:{
    title:'Infrastructure with live tool access',
    desc:'The infrastructure includes web_search and web_fetch tool definitions. When the model needs current information, it pauses generation, emits a tool call JSON, the external service runs, and the result is injected back — then generation resumes.',
    example:[
      {type:'system',      text:'You are Claude. You have access to web_search for current information not in your training data. Use it when the user asks about recent events, live data, or anything that may have changed.'},
      {type:'tool-result', text:'[Tool schemas: web_search, web_fetch, code_execution, file_create, ...]\n(8.5k tokens of JSON schemas)'},
    ],
    note:'The tool schemas must be in context <b>before</b> the model can call them. That\'s 8.5k tokens of overhead — paid even on turns where no tools are used.'
  },
  turns:[
    {
      user:140, assistant:480,
      title:'Turn 1', desc:'Completed — no tools needed',
      fullDesc:'A background question the model could answer from training data. No tool call needed. Standard completed turn, now part of history.',
      example:[
        {type:'user',      text:'"What\'s the general difference between GPT-style and Claude-style models?"'},
        {type:'assistant', text:'"Both are transformer-based LLMs trained with RLHF variants, but they differ in training philosophy. OpenAI\'s GPT models use standard RLHF; Anthropic uses Constitutional AI (CAI), where a separate model evaluates outputs against a set of principles before human feedback. This shapes Claude to be more reliably aligned with stated values..."'},
      ],
      note:'~620 tokens added to permanent history. No tools called — answered from training knowledge.'
    },
    {
      user:220, assistant:720,
      title:'Turn 2', desc:'Completed — answered from context',
      fullDesc:'A follow-up about coding capabilities — answered confidently from training knowledge. Still no tool calls.',
      example:[
        {type:'user',      text:'"Which handles complex refactoring better in your experience?"'},
        {type:'assistant', text:'"It\'s genuinely task-dependent. For large-scale architectural refactoring (moving from monolith to microservices, or redesigning an API), I tend to produce more structured plans with explicit reasoning about trade-offs. For tightly scoped tasks like \"fix this function\", the differences narrow. SWE-bench Verified is the best public comparison — it uses real GitHub issues, not synthetic tests..."'},
      ],
      note:'~940 tokens more history. The model is drawing on general knowledge — no live data needed yet.'
    },
    {
      user:310, thinking:1800, toolcall:320, toolres:9200, assistant:null,
      title:'Turn 3', desc:'Tool call in progress — web search mid-turn',
      fullDesc:'The user asks for a current benchmark score — something that changes regularly. The model reasoned (thinking block) that its training data may be outdated, decided to search, emitted a tool call, received search results, and is now composing its final answer. This single turn added 11.3k tokens.',
      example:[
        {type:'user',      text:'"What\'s the latest SWE-bench Verified score for Claude Sonnet 4?"'},
        {type:'thinking',  text:'The user wants the current benchmark score. SWE-bench results are updated frequently and my training data has a cutoff. I should not guess — I\'ll run a search to get the actual current number and source it properly.'},
        {type:'tool-call', text:'web_search({ "query": "Claude Sonnet 4 SWE-bench Verified score 2026" })'},
        {type:'tool-result',text:'Result 1: Anthropic Blog (Mar 2026) — "Claude Sonnet 4 achieves 72.7% on SWE-bench Verified, up from 49% for Claude 3.5 Sonnet..."\nResult 2: LMSYS Leaderboard — full results table with model comparisons...\nResult 3: Papers With Code — historical progression chart...'},
        {type:'generating',text:'← Composing answer using live search results...'},
      ],
      note:'This turn added <b>11.3k tokens</b>: 1.8k thinking + 0.3k tool call + 9.2k search results. The search result alone is <b>29× larger</b> than the user message that triggered it.'
    }
  ]
},
{
  id:'multiagent', label:'Agentic: 3 Tool Calls', sub:'Research task — tools chained autonomously',
  infra:{system:5200, tools:10000, rag:6000, memory:500, mcp:14000},
  maxOut:8000,
  infraDesc:{
    title:'Full agentic tool infrastructure',
    desc:'A heavy toolset is registered: web search, web fetch, code execution, file creation, image search, MCP servers. The model can chain these autonomously. With 10 tools, schemas alone cost 10k tokens before the model reads a single document.',
    example:[
      {type:'system',      text:'You are Claude, an autonomous research assistant. You have access to web_search, web_fetch, code_execution, file_create, bash_tool, image_search, gmail, gcal, places_search, and present_files. Complete research tasks end-to-end.'},
      {type:'tool-result', text:'[10 tool schemas loaded — 10,000 tokens]\nweb_search, web_fetch, code_execution, file_create,\nbash_tool, image_search, gmail, gcal,\nplaces_search, present_files'},
    ],
    note:'10 tools × ~500 tokens average = <b>10k tokens</b> just for definitions. Add system prompt (5.2k), RAG (6k), memory (0.5k), MCP (14k): <b>35.7k tokens of infrastructure — 28% of the window — before turn 1.</b>'
  },
  turns:[
    {
      user:140, assistant:480,
      title:'Turn 1', desc:'Task scoping — completed',
      fullDesc:'Opening exchange to frame the research task. Short, but now permanently part of history — re-sent on every remaining API call in this session.',
      example:[
        {type:'user',      text:'"Research the current state of AI safety regulation globally — EU, US, and China."'},
        {type:'assistant', text:'"Understood. I\'ll research all three jurisdictions, compare their approaches, and highlight key differences. Let me gather current information..."'},
      ],
      note:'This ~620-token exchange will be <b>re-transmitted on every subsequent API call</b> in this research session.'
    },
    {
      user:310, thinking:3200, toolcall:900, toolres:24000, assistant:null,
      title:'Turn 2', desc:'Agentic research — 3 chained tool calls',
      fullDesc:'The model autonomously chained 3 tool calls: a broad web search, then fetched the EU AI Act summary page, then fetched a comparative analysis. Each result was injected before the next decision. The model is now synthesizing across all three sources.',
      example:[
        {type:'user',      text:'"Go ahead — do the full research."'},
        {type:'thinking',  text:'I need comprehensive, current information on AI regulation in EU, US, and China. Strategy:\n1. Start with a broad search to get the current status landscape\n2. Fetch the EU AI Act page directly for accurate implementation timeline\n3. Search specifically for China AIGC regulations\n4. Synthesize into a structured comparison\n\nThe EU AI Act is most codified so I\'ll get that primary source...'},
        {type:'tool-call', text:'// Call 1\nweb_search({ "query": "EU AI Act 2025 2026 implementation timeline status" })\n// Call 2 (after seeing result 1)\nweb_fetch({ "url": "https://artificialintelligenceact.eu/the-act/" })\n// Call 3 (parallel research)\nweb_search({ "query": "China AIGC generative AI regulation 2025 2026 enforcement" })'},
        {type:'tool-result',text:'[Search 1] EU AI Act: prohibited systems banned Feb 2025; GPAI rules enforced Aug 2025; high-risk systems Aug 2026...\n[Fetch] EU AI Act full summary: Risk tiers — Unacceptable (banned: social scoring, biometric surveillance), High (medical, hiring, credit), Limited, Minimal... [4,200 tokens]\n[Search 3] China AIGC: Interim Measures for Generative AI Services effective Aug 2023; all models require CAC registration; content must uphold "socialist core values"... [2,100 tokens]'},
        {type:'generating',text:'← Synthesizing 3 sources into comparative analysis...'},
      ],
      note:'This single turn will add <b>28.4k tokens</b>: 3.2k thinking + 0.9k tool calls + 24.3k results. The fetched EU AI Act page alone is <b>4.2k tokens</b>. After this turn, the window will be ~67% full.'
    }
  ]
},
{
  id:'thinking', label:'Extended Thinking ON', sub:'Hard reasoning — thinking block dominates',
  infra:{system:5200, tools:10000, rag:6000, memory:500},
  maxOut:16000,
  infraDesc:{
    title:'Infrastructure — reasoning mode enabled',
    desc:'Extended thinking is active. The model uses a long internal scratchpad before responding. The thinking block is stored in context inside the assistant turn and can be enormous — it\'s not summarized or compressed.',
    example:[
      {type:'system',      text:'You are Claude. Extended thinking is enabled. Use it liberally for complex problems — show your reasoning in depth.'},
      {type:'tool-result', text:'[Tool schemas: 10 tools — 10k tokens]'},
    ],
    note:'Enabling extended thinking doesn\'t change infrastructure size. But it transforms assistant turns from ~1k tokens into potential <b>30k–60k token blocks</b>.'
  },
  turns:[
    {
      user:280, assistant:1400,
      title:'Turn 1', desc:'Moderate question — small thinking block',
      fullDesc:'A complex but well-understood topic. The thinking block (~300 tokens, not shown separately) helped structure the response but stayed compact. Still, the answer is 1.4k tokens — longer than casual conversation.',
      example:[
        {type:'user',      text:'"Explain P vs NP and why it matters for cryptography."'},
        {type:'assistant', text:'"P vs NP is one of the Millennium Prize Problems. P is the class of problems solvable in polynomial time; NP is the class where solutions can be verified in polynomial time.\n\nFor cryptography: RSA relies on the hardness of prime factorization — believed to be NP-hard. If P=NP were proved, then any quickly-verifiable problem could also be quickly solved. RSA keys that take 10^30 years to crack today could be broken in seconds. Every current public-key cryptosystem would be broken simultaneously..."'},
      ],
      note:'~1.4k token response. Longer than average but typical for a mathematical explanation with real-world implications.'
    },
    {
      user:320, assistant:2100,
      title:'Turn 2', desc:'Formal proof — longer thinking + response',
      fullDesc:'A harder follow-up requiring a formal reduction proof. The thinking block grew (~1.5k tokens), the response became a structured mathematical proof. Important pattern: harder questions don\'t just produce longer answers — they also consume more context via thinking.',
      example:[
        {type:'user',      text:'"Prove that 3-Colorability is NP-complete by reduction from 3-SAT."'},
        {type:'assistant', text:'"I\'ll construct the polynomial-time reduction 3-SAT ≤p 3-COL.\n\nGiven a 3-SAT formula φ with variables x₁...xn and clauses C₁...Cm, build graph G:\n\nGadget 1 — Variable gadgets: For each xᵢ create a triangle with vertices {xᵢ, ¬xᵢ, BASE}. In any valid 3-coloring, xᵢ and ¬xᵢ get different colors — modeling a literal assignment.\n\nGadget 2 — Clause gadgets: For each clause (a ∨ b ∨ c) build a 6-vertex OR gadget connected to the clause literals and TRUE vertex...\n\nCorrectionness (⇒): If φ is satisfiable, color each xᵢ-TRUE vertex with TRUE\'s color, ¬xᵢ with FALSE\'s color. Show each clause gadget is properly colorable...\n\nCorrectness (⇐): If G is 3-colorable, show the coloring induces a satisfying assignment for φ..."'},
      ],
      note:'~2.1k tokens of formal proof. Now part of history. After 2 turns, context is <b>21k tokens (16% full)</b> — dominated by infrastructure.'
    },
    {
      user:480, thinking:31000, assistant:null,
      title:'Turn 3', desc:'Hard problem — thinking block dominates the window',
      fullDesc:'The user poses a genuinely hard algorithmic problem. The extended thinking block exploded to 31k tokens — the model explored multiple approaches, hit dead ends, backtracked, and verified each step. The thinking block alone occupies 24% of the entire 128k window. The final response hasn\'t been written yet.',
      example:[
        {type:'user',     text:'"Design an exact algorithm for minimum weight vertex cover on graphs with n≤50, then prove correctness and analyze time complexity."'},
        {type:'thinking', text:'Let me think carefully. Minimum vertex cover (MVC) is NP-hard in general, but n≤50 allows exact approaches.\n\nApproach 1 — Brute force 2^n: Enumerate all 2^50 ≈ 10^15 subsets → far too slow.\n\nApproach 2 — ILP: Model as integer linear program. For weighted MVC:\n  minimize Σ w(v)·x(v)\n  subject to: x(u) + x(v) ≥ 1 for all edges (u,v)\n             x(v) ∈ {0,1}\nILP branch-and-bound should work for n=50 with a good solver, but worst case is still 2^n.\n\nApproach 3 — Wait, this is equivalent to maximum weight independent set by complementation. For n=50 we can use the Bron-Kerbosch algorithm on the complement graph...\n\nApproach 4 — Branch and bound with König\'s theorem: For bipartite subgraphs, MVC = maximum matching by König. But general graphs aren\'t bipartite...\n\nActually, let me reconsider the bound. n=50 means 2^50 ≈ 10^15 operations for brute force, but with good branching strategies we can do much better. The O*(1.2738^n) parameterized algorithm...\n\n[continues exploring for 30k more tokens of reasoning, evaluating LP relaxations, FPT algorithms, and finally settling on a branch-and-bound with linear programming relaxation as the bound function...]'},
        {type:'generating',text:'← Composing final algorithm + proof after 31k tokens of reasoning...'},
      ],
      note:'The thinking block alone is <b>31k tokens — 24% of the entire context window</b>. Infrastructure (21.7k) + turns 1–2 (5.2k) + this thinking (31k) = <b>57.9k tokens, 45% full</b>, before writing a single word of the final answer. The max_tokens reservation (16k) means the window is effectively 73% consumed.'
    }
  ]
},
{
  id:'long', label:'Long Research Session', sub:'8 turns — watch the window fill',
  infra:{system:5200, tools:10000, rag:9200, memory:1100, mcp:14000},
  maxOut:8000,
  infraDesc:{
    title:'Full research infrastructure — 39.5k tokens',
    desc:'A complete research session: system prompt with research persona, full tool suite, RAG over a company knowledge base, user memory, and live MCP connections to Gmail and Calendar. This is the cost of a well-equipped agent before it speaks a word.',
    example:[
      {type:'system',      text:'You are Claude, a research analyst at Meridian Capital. You have access to our internal knowledge base, financial data tools, and communication systems. Produce rigorous, cited analysis.'},
      {type:'tool-result', text:'[RAG — 9.2k tokens]\n12 documents retrieved from internal KB:\nQ4 earnings reports, competitor analysis, sector overviews, analyst notes'},
      {type:'tool-result', text:'[MEMORY — 1.1k tokens]\nUser: Sarah Chen, VP Research\nPreference: executive summary first, then detail\nCurrent project: semiconductor sector report for Q2'},
      {type:'tool-result', text:'[MCP:Gmail + Calendar — 14k tokens]\nToday\'s emails + this week\'s calendar pre-loaded'},
    ],
    note:'Infrastructure is <b>39.5k tokens — 31% of the window</b>. This is the fixed overhead cost paid on <b>every single one of the 8 API calls</b> in this session. By turn 8, 39.5k × 8 = 316k tokens of infrastructure will have been transmitted.'
  },
  turns:[
    {
      user:140, assistant:480,
      title:'Turn 1', desc:'Task setup',
      fullDesc:'Opening exchange to frame the research. Short — but this ~620-token exchange will be re-sent 7 more times during this session, costing 4.3k additional tokens across the session.',
      example:[
        {type:'user',      text:'"I need a comprehensive semiconductor supply chain analysis for Q2 — focus on TSMC, Samsung, and ASML."'},
        {type:'assistant', text:'"Understood. I\'ll cover manufacturing capacity, geopolitical exposure, and forward outlook for each. Starting with TSMC..."'},
      ],
      note:'Small setup turn. But it will be <b>re-sent 7 more times</b> — once per remaining API call in this session.'
    },
    {
      user:340, thinking:1600, toolcall:380, toolres:8800, assistant:1100,
      title:'Turn 2', desc:'TSMC deep dive — tool call + analysis',
      fullDesc:'First research turn. The model searched for current TSMC data, got results, and produced a detailed analytical section. Now fully stored in history — including the tool call, search results, and the 1.1k response.',
      example:[
        {type:'user',      text:'"Start with TSMC — capacity utilization, CapEx plans, and key risks."'},
        {type:'thinking',  text:'I need current TSMC numbers — utilization and CapEx change quarterly. Let me search for their latest earnings guidance and recent analyst reports...'},
        {type:'tool-call', text:'web_search({ "query": "TSMC Q1 2026 capacity utilization capex guidance earnings" })'},
        {type:'tool-result',text:'TSMC Q4 2025 call: N3/N5 utilization ~90%, N7+ ~75%. 2026 CapEx: $38B guided (flat). N2 ramp ahead of schedule. CoWoS packaging constrained through H1 2026...'},
        {type:'assistant', text:'"TSMC Q1 2026:\n• Utilization: ~90% advanced nodes (N3/N5), ~75% mature (N7+)\n• 2026 CapEx: $38B — priority to N2 ramp and Arizona Fab 21\n• Key risk: CoWoS packaging is the binding constraint for AI chip supply, not wafer starts. TSMC has compute dies; it can\'t package HBM fast enough..."'},
      ],
      note:'This turn adds <b>11.9k tokens to permanent history</b>. The window is now 40% consumed. Every future call will re-send this entire analysis.'
    },
    {
      user:190, assistant:860,
      title:'Turn 3', desc:'Clarification — no tools needed',
      fullDesc:'A short clarifying question answered from the previous turn\'s context. Fast, cheap — but even 1k tokens of clarification becomes permanent overhead for all 5 remaining calls.',
      example:[
        {type:'user',      text:'"The CoWoS constraint — how does that specifically affect NVIDIA H100/H200 supply?"'},
        {type:'assistant', text:'"CoWoS (Chip on Wafer on Substrate) is TSMC\'s advanced packaging tech that stacks HBM memory with compute dies. For NVIDIA: every H100/H200 needs 6 HBM3 stacks bonded to the compute die via CoWoS. Constraint here means NVIDIA can\'t ship more than ~X units/quarter regardless of how many compute dies they have. It\'s a packaging bottleneck, not a silicon one. This is why NVIDIA guided supply constraints into mid-2026 even as yields improved."'},
      ],
      note:'No tools, fast answer. But the ~1k tokens created here is <b>permanent overhead</b> from here on. 5 more calls will each re-send this.'
    },
    {
      user:420, thinking:2200, toolcall:550, toolres:13500, assistant:2000,
      title:'Turn 4', desc:'Samsung section — heavy research turn',
      fullDesc:'Second major research block. A thinking turn, two tool calls, and a long analytical response. By now context is getting substantial: infrastructure + 3 history turns + this new turn = 72k tokens.',
      example:[
        {type:'user',      text:'"Now Samsung — HBM3E ramp vs SK Hynix, and the DRAM cycle outlook."'},
        {type:'thinking',  text:'Samsung had yield issues with HBM3E in 2024 that let SK Hynix dominate. I need to check if Samsung has recovered. Also need current DRAM pricing cycle data — this changes monthly...'},
        {type:'tool-call', text:'web_search({ "query": "Samsung HBM3E yield qualification status 2026 vs SK Hynix" })\nweb_search({ "query": "DRAM spot price cycle 2026 outlook DDR5" })'},
        {type:'tool-result',text:'Samsung completed NVIDIA HBM3E qualification Q4 2025, targeting 35% share vs SK Hynix 50%... DRAM spot up 22% YTD on AI server demand; DDR5 premium widening vs DDR4...\n[13.5k tokens of market data and analyst commentary]'},
        {type:'assistant', text:'"Samsung HBM3E Recovery:\nAfter 2024 yield struggles (SK Hynix captured ~55% market share), Samsung completed NVIDIA qualification Q4 2025. Targeting 35% HBM3E share in 2026 vs SK Hynix\'s 50%.\n\nDRAM Cycle: Spot prices +22% YTD, driven by AI server DDR5 demand. The cycle appears to be mid-upcycle with DDR5 premium vs DDR4 widening — supports margin expansion for both Samsung and SK Hynix through end of 2026..."'},
      ],
      note:'Context is now <b>72k tokens — 56% of the window</b>. The large tool results are the primary driver.'
    },
    {
      user:280, assistant:1500,
      title:'Turn 5', desc:'Cross-company synthesis — no tools',
      fullDesc:'A synthesis question answered from context accumulated in turns 2–4. No new tool calls — the model draws on the TSMC and Samsung analyses already in its window. But synthesizing produces a longer response.',
      example:[
        {type:'user',      text:'"Based on TSMC and Samsung — what\'s the real bottleneck for scaling AI compute in 2026?"'},
        {type:'assistant', text:'"The binding constraint isn\'t silicon compute — it\'s advanced packaging. Both TSMC\'s CoWoS and Samsung/SK Hynix\'s HBM stacking are capacity-constrained, creating a three-way race:\n\n1. TSMC adding CoWoS capacity at Fab 6 (18-month lead time for equipment)\n2. Memory makers qualifying HBM4 (Samsung and SK Hynix racing to 12-high stacks)\n3. Chip designers working around the constraint (NVIDIA\'s GB200 NVL72 uses rack-level disaggregation to reduce per-GPU HBM requirements)\n\nThe actual GPU die supply is ample — TSMC has capacity. The packaging ecosystem is the choke point."'},
      ],
      note:'Pure synthesis — no tools. But the <b>1.5k response</b> is longer than average because it\'s drawing on analyses from 3 previous turns.'
    },
    {
      user:350, thinking:3100, toolcall:480, toolres:7600, assistant:1800,
      title:'Turn 6', desc:'ASML section — third research block',
      fullDesc:'Third major research block on ASML. Context is now 83k tokens (65% full). Every tool result is starting to crowd out future conversation room.',
      example:[
        {type:'user',      text:'"Last company: ASML — EUV shipment schedule, High-NA ramp, and geopolitical exposure."'},
        {type:'thinking',  text:'ASML is the sole global source for EUV and High-NA EUV. Their backlog and shipment schedule determines the pace of the entire semiconductor roadmap. Need 2026 guidance and High-NA ramp status at TSMC/Intel...'},
        {type:'tool-call', text:'web_search({ "query": "ASML 2026 EUV High-NA shipment guidance backlog revenue" })\nweb_search({ "query": "ASML China export restrictions 2025 2026 revenue impact" })'},
        {type:'tool-result',text:'ASML 2026 revenue guidance €30-35B; 20 High-NA units guided; backlog €36B (~3 years). China revenue reduced to 15% post-2024 export controls. High-NA first systems at TSMC and Intel...'},
        {type:'assistant', text:'"ASML — Monopoly Position:\nASML is the only company on Earth that makes EUV and High-NA EUV lithography systems — genuine single-point-of-failure for sub-7nm chip manufacturing globally.\n\nHigh-NA Ramp: 20 units guided for 2026 (vs 0 in 2024). First customers: TSMC (2 systems) and Intel (3 systems). At €350M+ each, this is a major revenue event but low unit count.\n\nGeopolitical: China reduced to 15% of revenue after 2024 export control expansion. Netherlands government has broad authority to restrict further. ASML is the most geopolitically exposed company in the sector..."'},
      ],
      note:'Context is now <b>96k tokens — 75% full</b>. Only ~32k tokens remain, shared between the output budget (8k) and any further turns. The session is in the critical zone.'
    },
    {
      user:210, assistant:940,
      title:'Turn 7', desc:'Quick clarification — expensive at 75% full',
      fullDesc:'A short clarifying exchange — but notice the ratio: the model is sending 96k tokens of history to generate 940 tokens of output. The context-to-output ratio is now 100:1. Even this small turn adds permanent overhead.',
      example:[
        {type:'user',      text:'"Quick add — for ASML, what\'s the significance of High-NA for the 2nm node specifically?"'},
        {type:'assistant', text:'"High-NA EUV uses a higher numerical aperture (0.55 vs 0.33 for standard EUV), enabling smaller feature sizes — critical for 2nm (N2) and below. For TSMC N2: they can use standard EUV with multiple exposures (SADP), but High-NA would reduce that to single-exposure, improving yield and throughput. For Intel 18A and 14A: High-NA is essentially required. Without it, the multi-patterning complexity makes defect rates unacceptable at volume. This is why Intel\'s 18A ramp is heavily dependent on ASML High-NA delivery timelines..."'},
      ],
      note:'The model just sent <b>96k tokens of context</b> to produce 940 tokens of response. The API received 102:1 context-to-output ratio. Infrastructure alone (39.5k) is 42× this response.'
    },
    {
      user:260, assistant:null,
      title:'Turn 8', desc:'Executive summary — final synthesis',
      fullDesc:'The final ask: an executive summary synthesizing all prior research. The model receives 98k tokens of context — 7 complete turns of research, tool calls, results, and analysis — to generate a concluding deliverable. The window is 77% full.',
      example:[
        {type:'user',      text:'"Write the executive summary: 3 key takeaways and investment implications for Q2."'},
        {type:'generating',text:'← Synthesizing 8 turns of semiconductor research into executive summary...'},
      ],
      note:'Context is <b>99k tokens (77% full)</b>. After this response completes (~1.5k tokens), any follow-up question would send <b>~108k tokens</b> to the API — 84% of the window, with truncation risk approaching.'
    }
  ]
},
{
  id:'crisis', label:'⚠ Near Context Limit', sub:'89% full — oldest turns being dropped',
  infra:{system:5200, tools:10000, rag:9200, memory:1100, mcp:14000},
  maxOut:8000,
  infraDesc:{
    title:'Infrastructure — protected from truncation',
    desc:'Even at 89% capacity, the system prompt and tool definitions are NEVER truncated. They are sacrosanct. Only conversation history gets dropped — starting from the oldest turns first. The model loses memory of past exchanges, but not its instructions.',
    example:[
      {type:'system',      text:'You are Claude... [always preserved — never truncated]'},
      {type:'tool-result', text:'[Tool schemas — always preserved]'},
      {type:'tool-result', text:'[RAG chunks — always preserved]'},
    ],
    note:'Infrastructure is <b>always protected</b>. In a context crisis, turns 1 and 2 will be dropped before a single byte of infrastructure is touched. The model loses conversation history, not its core instructions.'
  },
  turns:[
    {
      user:400, assistant:2200,
      title:'Turn 1', desc:'⚠ Will be truncated first',
      fullDesc:'This is the oldest non-infrastructure turn and the first to be dropped when the context overflows. The model will silently lose this entire exchange — the user\'s original task framing and the assistant\'s detailed architectural decisions both disappear.',
      example:[
        {type:'user',      text:'"I want to build a complete SaaS product from scratch — architecture, backend, frontend, deployment. Let\'s start with architecture."'},
        {type:'assistant', text:'"Great — here\'s a modern SaaS architecture:\n\nLayer 1 — Application tier: Next.js 15 frontend (App Router), Node.js + Fastify API layer, event-driven workers via BullMQ for async tasks\n\nLayer 2 — Data tier: PostgreSQL primary (Supabase), Redis cache + session store, S3-compatible object storage, pgvector for semantic search\n\nLayer 3 — Infrastructure: Kubernetes on AWS EKS, Terraform for IaC, GitHub Actions CI/CD with preview deployments...\n\n[2.2k tokens of detailed architecture decisions]"'},
      ],
      note:'⚠ This turn will be <b>dropped first</b>. The model will lose the original architecture context — it may give inconsistent backend/frontend advice in future turns because it no longer "sees" what database, framework, or patterns were decided here.'
    },
    {
      user:580, thinking:7500, toolcall:750, toolres:17000, assistant:3300,
      title:'Turn 2', desc:'⚠ Will be truncated second',
      fullDesc:'A massive agentic turn — tool calls fetched extensive backend documentation. This turn is 29k tokens of history at truncation risk. All that research work will simply vanish from the model\'s context.',
      example:[
        {type:'user',      text:'"Design the full backend — API routes, auth strategy, database schema, and give me the boilerplate code."'},
        {type:'thinking',  text:'The user wants full backend architecture with code. Need to decide: REST vs GraphQL, JWT vs sessions, ORM choice, multi-tenant schema strategy... I\'ll fetch current Node.js SaaS boilerplates to ensure I\'m recommending current patterns...'},
        {type:'tool-call', text:'web_search({ "query": "Node.js Fastify SaaS boilerplate 2026 multi-tenant best practices" })\nweb_fetch({ "url": "https://github.com/..." })'},
        {type:'tool-result',text:'[17k tokens of documentation, schema examples, auth patterns, and code from GitHub repos]'},
        {type:'assistant', text:'"Backend Architecture:\n\nAuth: JWT access tokens (15min) + refresh tokens (7 days) in httpOnly cookies. Redis stores refresh token allowlist.\n\nMulti-tenancy: Row-level with tenant_id on all tables + Postgres RLS policies. Partial index on tenant_id + created_at.\n\nSchema:\n```sql\nCREATE TABLE users (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  tenant_id UUID NOT NULL REFERENCES tenants(id),\n  email TEXT UNIQUE NOT NULL,\n  ...\n);\nCREATE POLICY tenant_isolation ON users\n  USING (tenant_id = current_setting(\'app.tenant_id\')::uuid);\n```\n...[3.3k tokens of code + explanation]"'},
      ],
      note:'⚠ This 29k-token turn will be <b>dropped second</b>. The model loses the fetched documentation AND all backend decisions. Future code suggestions may contradict the schema and auth patterns designed here.'
    },
    {
      user:360, assistant:1900,
      title:'Turn 3', desc:'At risk — may survive if turns 1+2 are enough',
      fullDesc:'Shorter turn — may survive truncation since the two larger turns will be dropped first. But if those don\'t free enough space, this goes next. The problem: it references decisions from turn 2 that have already been dropped.',
      example:[
        {type:'user',      text:'"For the database — how do I handle soft deletes and audit logging at scale?"'},
        {type:'assistant', text:'"For the row-level multi-tenant schema we designed: use `deleted_at TIMESTAMPTZ` for soft deletes with a partial index `WHERE deleted_at IS NULL` to keep active queries fast. For audit logging, avoid application-layer triggers — use PostgreSQL logical replication to stream WAL changes to an append-only audit table in a separate schema. This gives you: zero performance overhead on the primary, complete change history, and the ability to replay or query audit events independently..."'},
      ],
      note:'~2.3k tokens. If turns 1 and 2 are dropped, this becomes the new history start — but it references "the schema we designed" from turn 2 which <b>no longer exists in context</b>.'
    },
    {
      user:520, thinking:10500, toolcall:600, toolres:15500, assistant:4000,
      title:'Turn 4', desc:'Frontend — preserved (more recent than turns 1-2)',
      fullDesc:'A large agentic turn — fetched extensive Next.js documentation. Preserved over turns 1-2 because it\'s more recent. The logic is simple: newer context is assumed more relevant to the current task.',
      example:[
        {type:'user',      text:'"Now the full frontend — Next.js App Router setup, component architecture, state management, and the auth flow."'},
        {type:'thinking',  text:'Frontend with App Router. Need to think through: server vs client components boundary, Zustand vs Jotai for state, how to implement multi-tenant auth with the JWT strategy from the backend, optimistic updates pattern...'},
        {type:'tool-call', text:'web_search({ "query": "Next.js 15 App Router SaaS patterns server client components 2026" })\nweb_fetch({ "url": "https://nextjs.org/docs/app/..." })'},
        {type:'tool-result',text:'[15.5k tokens of Next.js App Router patterns, caching strategies, auth examples]'},
        {type:'assistant', text:'"Frontend Architecture:\n\nServer/client split: Fetch data in server components; interactive UI in client components with `\'use client\'`. This gives you streaming SSR for initial load with client-side interactivity where needed.\n\nState: Zustand for global state (auth session, tenant context). React Query for server state (avoids duplicating cache logic).\n\nAuth flow: `middleware.ts` checks JWT on every request. Expired tokens redirect to `/login`; refresh happens via `/api/auth/refresh` server action...\n\n[4k tokens of component tree + code]"'},
      ],
      note:'This 31k-token turn is <b>preserved over turns 1-2</b> because it\'s more recent. The model keeps newer context, discards older.'
    },
    {
      user:300, assistant:2100,
      title:'Turn 5', desc:'Testing strategy — preserved',
      fullDesc:'Shorter recent turn, preserved. But notice: if the user asks about the database schema or auth patterns from turn 2, the model will not know what was decided.',
      example:[
        {type:'user',      text:'"What testing strategy across backend and frontend?"'},
        {type:'assistant', text:'"Testing pyramid for this stack:\n\nUnit (70%): Jest + ts-jest for backend logic; React Testing Library for components. Keep unit tests fast (<10ms each).\n\nIntegration (20%): Supertest for API routes with a test database container (Docker); test the auth middleware, tenant isolation policies (critical — test that tenant A cannot access tenant B\'s data), and webhook handlers.\n\nE2E (10%): Playwright for critical paths — signup flow, first login, onboarding, billing. Don\'t use E2E for everything; they\'re slow and flaky at scale.\n\nFor multi-tenancy specifically: add a dedicated tenant isolation test suite that runs as part of CI..."'},
      ],
      note:'~2.4k tokens. Preserved. But notice: this test advice references "tenant isolation policies" from turn 2\'s schema — which has been <b>silently dropped</b> from context.'
    },
    {
      user:440, thinking:5500, toolcall:420, toolres:8800, assistant:null,
      title:'Turn 6', desc:'⚠ Deployment turn — generating without full context',
      fullDesc:'The user asks about deployment. Critical problem: the context window is 89% full. Turns 1 and 2 will be dropped before this API call completes. The model is generating deployment advice without knowing the original architecture decisions or the backend code. It will try to work from what remains in context.',
      example:[
        {type:'user',     text:'"Final piece — Kubernetes setup, CI/CD pipeline, zero-downtime deployments."'},
        {type:'thinking', text:'Deployment architecture for a SaaS product. From what I can see in context: Next.js frontend (App Router), Node.js/Fastify backend, PostgreSQL + Redis, multi-tenant with RLS. I notice turns 1-2 appear to have been truncated — I can see the frontend and testing discussions but the original architecture overview and backend schema decisions are gone.\n\nI\'ll design deployment to be consistent with what I can see: Node.js API, Next.js frontend, PostgreSQL, K8s on AWS EKS...'},
        {type:'tool-call', text:'web_search({ "query": "Kubernetes zero-downtime deployment Node.js Next.js PostgreSQL 2026" })'},
        {type:'tool-result',text:'[8.8k tokens of K8s deployment patterns, rolling updates, health checks, ArgoCD setup]'},
        {type:'generating',text:'← Generating deployment guide — without full awareness of original architecture decisions from turn 1...'},
      ],
      note:'⚠ The model just noticed in its thinking that <b>turns 1-2 were truncated</b>. It\'s generating deployment advice that may contradict the original architecture. This is the real-world cost of context overflow: <b>silent, hard-to-detect inconsistency.</b>'
    }
  ]
}
];

