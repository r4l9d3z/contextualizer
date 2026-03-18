(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))n(a);new MutationObserver(a=>{for(const o of a)if(o.type==="childList")for(const u of o.addedNodes)u.tagName==="LINK"&&u.rel==="modulepreload"&&n(u)}).observe(document,{childList:!0,subtree:!0});function s(a){const o={};return a.integrity&&(o.integrity=a.integrity),a.referrerPolicy&&(o.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?o.credentials="include":a.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function n(a){if(a.ep)return;a.ep=!0;const o=s(a);fetch(a.href,o)}})();const b=128e3,c={SC:null,HK:null,HT:null},ce=[{id:"fresh",label:"Fresh Conversation",sub:"First message, no history yet",infra:{system:5200,tools:8500},maxOut:4e3,infraDesc:{title:"Infrastructure — loaded before everything",desc:"Before any conversation, every API call front-loads all infrastructure. The system prompt defines who Claude is; the tool schemas define what it can do. This is constant overhead paid on every single request — including turn 1.",example:[{type:"system",text:"You are Claude, a helpful AI assistant made by Anthropic. You have access to web_search, code_execution, and file_create. Today is Saturday, March 14 2026. Respond helpfully and accurately..."},{type:"tool-result",text:`[Tool schemas loaded]
• web_search — search the web for current info
• code_execution — run Python code in a sandbox
• file_create — write files for the user to download
(each schema: 300–800 tokens of JSON)`}],note:"This <b>13.7k token</b> infrastructure block is <b>re-sent verbatim</b> on every API call in this conversation. Even if the conversation grows to 50 turns, this exact block still arrives first, every time."},turns:[{user:140,assistant:null,title:"Turn 1",desc:"First message sent, response generating",fullDesc:"The user sends their opening message. The model receives the full infrastructure block plus this single user message, then begins generating a response. That response is the OUTPUT — it doesn't exist in context yet.",example:[{type:"user",text:'"Hey, can you help me understand how transformer attention works?"'},{type:"generating",text:"← Model is generating a response. Not in context yet."}],note:"Total context so far: <b>~13.8k tokens</b>. The model has ~110k free tokens. The infrastructure block is 98% of what's in context — the user's question is just 1%."}]},{id:"replied",label:"After First Reply",sub:"History builds — re-sent every call",infra:{system:5200,tools:8500},maxOut:4e3,infraDesc:{title:"Infrastructure — re-sent every call",desc:"Same infrastructure as always. The critical insight: even though nothing changed in the infrastructure, all 13.7k tokens of it are re-transmitted to the API with every single call. There is no caching of the system prompt between requests.",example:[{type:"system",text:"You are Claude... [same 5.2k tokens as before]"},{type:"tool-result",text:"[Tool schemas — same 8.5k tokens as before]"}],note:"API calls are <b>completely stateless</b>. The server remembers nothing. Every call is independent and must include everything from scratch."},turns:[{user:140,assistant:480,title:"Turn 1",desc:"Completed — now permanent history",fullDesc:"The first exchange is complete. Both the user message AND the assistant's response are now history. They will be re-sent on every future API call for the rest of this conversation — there is no way to remove them without losing context continuity.",example:[{type:"user",text:'"Hey, can you help me understand how transformer attention works?"'},{type:"assistant",text:'"Sure! Transformer attention lets the model weigh how relevant each word is to every other word. For each token it computes query (Q), key (K), and value (V) vectors. The attention score is: Attention(Q,K,V) = softmax(QKᵀ/√dk)·V..."'}],note:"This completed turn permanently occupies <b>~620 tokens</b> of every future context window in this conversation. If there are 20 more turns, this exchange is re-sent 20 more times."},{user:110,assistant:null,title:"Turn 2",desc:"Follow-up sent, generating response",fullDesc:`The user asks a follow-up. The API now receives: full infrastructure + turn 1 (user + assistant) + this new message. The model "remembers" the first exchange not because it has memory, but because turn 1 was re-sent in this call's context.`,example:[{type:"user",text:`"What's the difference between self-attention and cross-attention?"`},{type:"generating",text:"← Generating... (not yet in context)"}],note:'Context sent to API: <b>13.7k (infra) + 620 (turn 1) + 110 (this message) = 14.4k tokens</b>. The model "remembers" the previous answer because it was re-sent, not stored.'}]},{id:"rag",label:"+ RAG + Memory",sub:"Knowledge retrieval added",infra:{system:5200,tools:8500,rag:9200,memory:650},maxOut:4e3,infraDesc:{title:"Infrastructure + RAG + Memory",desc:"Before the conversation, a retrieval pipeline searched a knowledge base for documents relevant to the user's topic, and a memory system fetched facts about this user from past sessions. Both are injected here, before any conversation.",example:[{type:"system",text:"You are Claude, an AI assistant for Meridian Research. Use the retrieved documents to provide accurate, grounded responses..."},{type:"tool-result",text:`[RAG — 3 documents retrieved]
• "Attention Is All You Need" — sections 3.2–3.4 (2,400 tokens)
• Internal ML glossary — 28 definitions (1,800 tokens)
• Transformer benchmark comparisons — table + notes (1,100 tokens)`},{type:"tool-result",text:`[MEMORY — user profile]
• Name: Dr. Sarah Chen, Senior ML Researcher
• Expertise: NLP, transformer architectures
• Style preference: mathematical depth + code examples
• Last session: discussed BERT fine-tuning for classification`}],note:"RAG + memory cost <b>9.85k tokens</b> upfront. But the answers they enable are dramatically more grounded. Trade-off: richer context vs. available conversation space."},turns:[{user:140,assistant:480,title:"Turn 1",desc:"First answer informed by RAG",fullDesc:"The assistant's response is informed by the retrieved documents and user memory. It can cite the Attention paper, tailor the depth to Dr. Chen's ML background, and give code examples because memory indicated that's her preference.",example:[{type:"user",text:'"Can you walk me through scaled dot-product attention mathematically?"'},{type:"assistant",text:`"Based on Vaswani et al. (retrieved), scaled dot-product attention is:

  Attention(Q,K,V) = softmax(QKᵀ/√dk) · V

The √dk scaling prevents vanishing gradients when dk is large — without it, for dk=512, the dot products can reach ~22σ, pushing softmax into near-zero gradient regions..."`}],note:"The RAG context made this answer dramatically better. But it cost <b>9.2k tokens</b> of infrastructure budget — before a single turn of conversation."},{user:220,assistant:720,title:"Turn 2",desc:"Follow-up using same RAG context",fullDesc:"The user goes deeper. By turn 2, the conversation builds on turn 1. The model still has the retrieved documents in context — they remain available for the entire session without being re-retrieved.",example:[{type:"user",text:'"And multi-head attention — can you show PyTorch code with the math?"'},{type:"assistant",text:`"Multi-head attention runs h parallel attention functions then concatenates:

\`\`\`python
class MultiHeadAttention(nn.Module):
    def __init__(self, d_model=512, h=8):
        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
    def forward(self, Q, K, V):
        # Split into h=8 heads, each dk=64
        ...
\`\`\`
Each head attends to different subspaces — some heads focus on syntax, others on long-range semantics..."`}],note:"Code response is ~720 tokens — longer than average. It's now part of history and will be <b>re-sent in full</b> on every future call."},{user:160,assistant:null,title:"Turn 3",desc:"Third question, generating",fullDesc:"Third message. Context window now holds: all infrastructure + RAG + memory + 2 complete turns + this message. The retrieved documents are still paying dividends — but now occupy 10% of the window.",example:[{type:"user",text:`"How does positional encoding interact with attention? Why doesn't attention handle position naturally?"`},{type:"generating",text:"← Generating..."}],note:"Infrastructure is now <b>23.5k tokens (18% of window)</b> before any conversation. That's the real cost of RAG: better answers, smaller conversation budget."}]},{id:"mcp",label:"+ MCP Servers",sub:"Gmail + Calendar connected",infra:{system:5200,tools:8500,rag:9200,memory:650,mcp:14e3},maxOut:4e3,infraDesc:{title:"Infrastructure + MCP server data",desc:"Two MCP servers are connected: Gmail and Google Calendar. Each injects its own tool schemas plus any data it pre-fetched. Gmail contributed today's top emails; Calendar added this week's events. All injected before the first word of conversation.",example:[{type:"system",text:"You are Claude, a personal AI assistant with access to Gmail and Calendar. Use these connections to help with scheduling and communications..."},{type:"tool-result",text:`[MCP:Gmail — schemas + data]
Tools: search_email, send_email, get_thread, list_labels
Pre-fetched today's inbox (5 unread):
• Marcus (9:02am): "Pre-read for 2pm Product Review — retention deck"
• Alex (10:15am): "3 questions about Q2 roadmap"
• Sarah (11:30am): "Can we push 4:30 to 5pm?"`},{type:"tool-result",text:`[MCP:Calendar — schemas + data]
Tools: get_events, create_event, find_available_slot
This week's events:
• Today 2:00pm — Product Review (Marcus, Alex, Wei)
• Today 4:30pm — 1:1 with Sarah
• Tomorrow 10am — Engineering sync`}],note:"MCP infrastructure: <b>14k tokens</b>. Combined with system + tools + RAG + memory: infrastructure is now <b>37.5k tokens — 29% of the window — before any conversation.</b>"},turns:[{user:140,assistant:480,title:"Turn 1",desc:"Answered from pre-fetched MCP data",fullDesc:"The user asks about today's schedule. No tool call needed — the Calendar data was already injected at infrastructure load time. The assistant synthesizes across Gmail and Calendar without making any live API calls.",example:[{type:"user",text:'"Do I have anything important today and did anyone email about the 2pm meeting?"'},{type:"assistant",text:`"Yes — you have a Product Review at 2pm (Marcus, Alex, Wei) and a 1:1 with Sarah at 4:30pm (she emailed asking to push to 5pm).

For the 2pm: Marcus sent a pre-read deck at 9am focusing on retention. Alex has 3 roadmap questions. I'd prep retention numbers and have roadmap answers ready."`}],note:"Zero tool calls made. The answer came entirely from <b>pre-loaded MCP data</b>. This is the ideal MCP pattern: inject once, answer many."},{user:220,assistant:720,title:"Turn 2",desc:"Cross-context synthesis",fullDesc:"A follow-up requiring synthesis across email + calendar + the previous answer. Still no tool calls — all the data is in context. The model weaves together three sources that were all pre-loaded at infrastructure time.",example:[{type:"user",text:'"Draft a reply to Alex answering his roadmap questions — I know Q3 is AI features and Q4 is enterprise."'},{type:"assistant",text:`"Here's a reply to Alex:

---
Hi Alex,

Thanks for the questions ahead of today's review. Quick answers:

1. Q3 focus: AI features — specifically the assistant integration and smart suggestions
2. Q4 focus: Enterprise tier — SSO, audit logging, and admin controls
3. Timeline: Q3 kicks off May 1 after the current sprint wraps

Let's discuss specifics at 2pm.
---"`}],note:"Still no tool calls. The draft was synthesized from <b>Gmail context + calendar context + prior turn</b>, all held in the same window."},{user:180,assistant:null,title:"Turn 3",desc:"Generating",fullDesc:"The user asks for a live action — creating a calendar event — which requires an actual MCP tool call. The model will emit a structured tool call, the MCP server will execute it, and the result will be injected before the final reply.",example:[{type:"user",text:`"Actually accept Sarah's request — move the 4:30 to 5pm and update the invite."`},{type:"generating",text:"← About to emit an MCP tool call to gcal to update the event..."}],note:"First turn requiring a live tool call. The event update will happen during generation, adding a toolcall + toolres to this turn's history."}]},{id:"tooluse",label:"Tool Use Mid-Turn",sub:"Live search called during a response",infra:{system:5200,tools:8500,rag:6e3,memory:500,mcp:14e3},maxOut:4e3,infraDesc:{title:"Infrastructure with live tool access",desc:"The infrastructure includes web_search and web_fetch tool definitions. When the model needs current information, it pauses generation, emits a tool call JSON, the external service runs, and the result is injected back — then generation resumes.",example:[{type:"system",text:"You are Claude. You have access to web_search for current information not in your training data. Use it when the user asks about recent events, live data, or anything that may have changed."},{type:"tool-result",text:`[Tool schemas: web_search, web_fetch, code_execution, file_create, ...]
(8.5k tokens of JSON schemas)`}],note:"The tool schemas must be in context <b>before</b> the model can call them. That's 8.5k tokens of overhead — paid even on turns where no tools are used."},turns:[{user:140,assistant:480,title:"Turn 1",desc:"Completed — no tools needed",fullDesc:"A background question the model could answer from training data. No tool call needed. Standard completed turn, now part of history.",example:[{type:"user",text:`"What's the general difference between GPT-style and Claude-style models?"`},{type:"assistant",text:`"Both are transformer-based LLMs trained with RLHF variants, but they differ in training philosophy. OpenAI's GPT models use standard RLHF; Anthropic uses Constitutional AI (CAI), where a separate model evaluates outputs against a set of principles before human feedback. This shapes Claude to be more reliably aligned with stated values..."`}],note:"~620 tokens added to permanent history. No tools called — answered from training knowledge."},{user:220,assistant:720,title:"Turn 2",desc:"Completed — answered from context",fullDesc:"A follow-up about coding capabilities — answered confidently from training knowledge. Still no tool calls.",example:[{type:"user",text:'"Which handles complex refactoring better in your experience?"'},{type:"assistant",text:`"It's genuinely task-dependent. For large-scale architectural refactoring (moving from monolith to microservices, or redesigning an API), I tend to produce more structured plans with explicit reasoning about trade-offs. For tightly scoped tasks like "fix this function", the differences narrow. SWE-bench Verified is the best public comparison — it uses real GitHub issues, not synthetic tests..."`}],note:"~940 tokens more history. The model is drawing on general knowledge — no live data needed yet."},{user:310,thinking:1800,toolcall:320,toolres:9200,assistant:null,title:"Turn 3",desc:"Tool call in progress — web search mid-turn",fullDesc:"The user asks for a current benchmark score — something that changes regularly. The model reasoned (thinking block) that its training data may be outdated, decided to search, emitted a tool call, received search results, and is now composing its final answer. This single turn added 11.3k tokens.",example:[{type:"user",text:`"What's the latest SWE-bench Verified score for Claude Sonnet 4?"`},{type:"thinking",text:"The user wants the current benchmark score. SWE-bench results are updated frequently and my training data has a cutoff. I should not guess — I'll run a search to get the actual current number and source it properly."},{type:"tool-call",text:'web_search({ "query": "Claude Sonnet 4 SWE-bench Verified score 2026" })'},{type:"tool-result",text:`Result 1: Anthropic Blog (Mar 2026) — "Claude Sonnet 4 achieves 72.7% on SWE-bench Verified, up from 49% for Claude 3.5 Sonnet..."
Result 2: LMSYS Leaderboard — full results table with model comparisons...
Result 3: Papers With Code — historical progression chart...`},{type:"generating",text:"← Composing answer using live search results..."}],note:"This turn added <b>11.3k tokens</b>: 1.8k thinking + 0.3k tool call + 9.2k search results. The search result alone is <b>29× larger</b> than the user message that triggered it."}]},{id:"multiagent",label:"Agentic: 3 Tool Calls",sub:"Research task — tools chained autonomously",infra:{system:5200,tools:1e4,rag:6e3,memory:500,mcp:14e3},maxOut:8e3,infraDesc:{title:"Full agentic tool infrastructure",desc:"A heavy toolset is registered: web search, web fetch, code execution, file creation, image search, MCP servers. The model can chain these autonomously. With 10 tools, schemas alone cost 10k tokens before the model reads a single document.",example:[{type:"system",text:"You are Claude, an autonomous research assistant. You have access to web_search, web_fetch, code_execution, file_create, bash_tool, image_search, gmail, gcal, places_search, and present_files. Complete research tasks end-to-end."},{type:"tool-result",text:`[10 tool schemas loaded — 10,000 tokens]
web_search, web_fetch, code_execution, file_create,
bash_tool, image_search, gmail, gcal,
places_search, present_files`}],note:"10 tools × ~500 tokens average = <b>10k tokens</b> just for definitions. Add system prompt (5.2k), RAG (6k), memory (0.5k), MCP (14k): <b>35.7k tokens of infrastructure — 28% of the window — before turn 1.</b>"},turns:[{user:140,assistant:480,title:"Turn 1",desc:"Task scoping — completed",fullDesc:"Opening exchange to frame the research task. Short, but now permanently part of history — re-sent on every remaining API call in this session.",example:[{type:"user",text:'"Research the current state of AI safety regulation globally — EU, US, and China."'},{type:"assistant",text:`"Understood. I'll research all three jurisdictions, compare their approaches, and highlight key differences. Let me gather current information..."`}],note:"This ~620-token exchange will be <b>re-transmitted on every subsequent API call</b> in this research session."},{user:310,thinking:3200,toolcall:900,toolres:24e3,assistant:null,title:"Turn 2",desc:"Agentic research — 3 chained tool calls",fullDesc:"The model autonomously chained 3 tool calls: a broad web search, then fetched the EU AI Act summary page, then fetched a comparative analysis. Each result was injected before the next decision. The model is now synthesizing across all three sources.",example:[{type:"user",text:'"Go ahead — do the full research."'},{type:"thinking",text:`I need comprehensive, current information on AI regulation in EU, US, and China. Strategy:
1. Start with a broad search to get the current status landscape
2. Fetch the EU AI Act page directly for accurate implementation timeline
3. Search specifically for China AIGC regulations
4. Synthesize into a structured comparison

The EU AI Act is most codified so I'll get that primary source...`},{type:"tool-call",text:`// Call 1
web_search({ "query": "EU AI Act 2025 2026 implementation timeline status" })
// Call 2 (after seeing result 1)
web_fetch({ "url": "https://artificialintelligenceact.eu/the-act/" })
// Call 3 (parallel research)
web_search({ "query": "China AIGC generative AI regulation 2025 2026 enforcement" })`},{type:"tool-result",text:`[Search 1] EU AI Act: prohibited systems banned Feb 2025; GPAI rules enforced Aug 2025; high-risk systems Aug 2026...
[Fetch] EU AI Act full summary: Risk tiers — Unacceptable (banned: social scoring, biometric surveillance), High (medical, hiring, credit), Limited, Minimal... [4,200 tokens]
[Search 3] China AIGC: Interim Measures for Generative AI Services effective Aug 2023; all models require CAC registration; content must uphold "socialist core values"... [2,100 tokens]`},{type:"generating",text:"← Synthesizing 3 sources into comparative analysis..."}],note:"This single turn will add <b>28.4k tokens</b>: 3.2k thinking + 0.9k tool calls + 24.3k results. The fetched EU AI Act page alone is <b>4.2k tokens</b>. After this turn, the window will be ~67% full."}]},{id:"thinking",label:"Extended Thinking ON",sub:"Hard reasoning — thinking block dominates",infra:{system:5200,tools:1e4,rag:6e3,memory:500},maxOut:16e3,infraDesc:{title:"Infrastructure — reasoning mode enabled",desc:"Extended thinking is active. The model uses a long internal scratchpad before responding. The thinking block is stored in context inside the assistant turn and can be enormous — it's not summarized or compressed.",example:[{type:"system",text:"You are Claude. Extended thinking is enabled. Use it liberally for complex problems — show your reasoning in depth."},{type:"tool-result",text:"[Tool schemas: 10 tools — 10k tokens]"}],note:"Enabling extended thinking doesn't change infrastructure size. But it transforms assistant turns from ~1k tokens into potential <b>30k–60k token blocks</b>."},turns:[{user:280,assistant:1400,title:"Turn 1",desc:"Moderate question — small thinking block",fullDesc:"A complex but well-understood topic. The thinking block (~300 tokens, not shown separately) helped structure the response but stayed compact. Still, the answer is 1.4k tokens — longer than casual conversation.",example:[{type:"user",text:'"Explain P vs NP and why it matters for cryptography."'},{type:"assistant",text:`"P vs NP is one of the Millennium Prize Problems. P is the class of problems solvable in polynomial time; NP is the class where solutions can be verified in polynomial time.

For cryptography: RSA relies on the hardness of prime factorization — believed to be NP-hard. If P=NP were proved, then any quickly-verifiable problem could also be quickly solved. RSA keys that take 10^30 years to crack today could be broken in seconds. Every current public-key cryptosystem would be broken simultaneously..."`}],note:"~1.4k token response. Longer than average but typical for a mathematical explanation with real-world implications."},{user:320,assistant:2100,title:"Turn 2",desc:"Formal proof — longer thinking + response",fullDesc:"A harder follow-up requiring a formal reduction proof. The thinking block grew (~1.5k tokens), the response became a structured mathematical proof. Important pattern: harder questions don't just produce longer answers — they also consume more context via thinking.",example:[{type:"user",text:'"Prove that 3-Colorability is NP-complete by reduction from 3-SAT."'},{type:"assistant",text:`"I'll construct the polynomial-time reduction 3-SAT ≤p 3-COL.

Given a 3-SAT formula φ with variables x₁...xn and clauses C₁...Cm, build graph G:

Gadget 1 — Variable gadgets: For each xᵢ create a triangle with vertices {xᵢ, ¬xᵢ, BASE}. In any valid 3-coloring, xᵢ and ¬xᵢ get different colors — modeling a literal assignment.

Gadget 2 — Clause gadgets: For each clause (a ∨ b ∨ c) build a 6-vertex OR gadget connected to the clause literals and TRUE vertex...

Correctionness (⇒): If φ is satisfiable, color each xᵢ-TRUE vertex with TRUE's color, ¬xᵢ with FALSE's color. Show each clause gadget is properly colorable...

Correctness (⇐): If G is 3-colorable, show the coloring induces a satisfying assignment for φ..."`}],note:"~2.1k tokens of formal proof. Now part of history. After 2 turns, context is <b>21k tokens (16% full)</b> — dominated by infrastructure."},{user:480,thinking:31e3,assistant:null,title:"Turn 3",desc:"Hard problem — thinking block dominates the window",fullDesc:"The user poses a genuinely hard algorithmic problem. The extended thinking block exploded to 31k tokens — the model explored multiple approaches, hit dead ends, backtracked, and verified each step. The thinking block alone occupies 24% of the entire 128k window. The final response hasn't been written yet.",example:[{type:"user",text:'"Design an exact algorithm for minimum weight vertex cover on graphs with n≤50, then prove correctness and analyze time complexity."'},{type:"thinking",text:`Let me think carefully. Minimum vertex cover (MVC) is NP-hard in general, but n≤50 allows exact approaches.

Approach 1 — Brute force 2^n: Enumerate all 2^50 ≈ 10^15 subsets → far too slow.

Approach 2 — ILP: Model as integer linear program. For weighted MVC:
  minimize Σ w(v)·x(v)
  subject to: x(u) + x(v) ≥ 1 for all edges (u,v)
             x(v) ∈ {0,1}
ILP branch-and-bound should work for n=50 with a good solver, but worst case is still 2^n.

Approach 3 — Wait, this is equivalent to maximum weight independent set by complementation. For n=50 we can use the Bron-Kerbosch algorithm on the complement graph...

Approach 4 — Branch and bound with König's theorem: For bipartite subgraphs, MVC = maximum matching by König. But general graphs aren't bipartite...

Actually, let me reconsider the bound. n=50 means 2^50 ≈ 10^15 operations for brute force, but with good branching strategies we can do much better. The O*(1.2738^n) parameterized algorithm...

[continues exploring for 30k more tokens of reasoning, evaluating LP relaxations, FPT algorithms, and finally settling on a branch-and-bound with linear programming relaxation as the bound function...]`},{type:"generating",text:"← Composing final algorithm + proof after 31k tokens of reasoning..."}],note:"The thinking block alone is <b>31k tokens — 24% of the entire context window</b>. Infrastructure (21.7k) + turns 1–2 (5.2k) + this thinking (31k) = <b>57.9k tokens, 45% full</b>, before writing a single word of the final answer. The max_tokens reservation (16k) means the window is effectively 73% consumed."}]},{id:"long",label:"Long Research Session",sub:"8 turns — watch the window fill",infra:{system:5200,tools:1e4,rag:9200,memory:1100,mcp:14e3},maxOut:8e3,infraDesc:{title:"Full research infrastructure — 39.5k tokens",desc:"A complete research session: system prompt with research persona, full tool suite, RAG over a company knowledge base, user memory, and live MCP connections to Gmail and Calendar. This is the cost of a well-equipped agent before it speaks a word.",example:[{type:"system",text:"You are Claude, a research analyst at Meridian Capital. You have access to our internal knowledge base, financial data tools, and communication systems. Produce rigorous, cited analysis."},{type:"tool-result",text:`[RAG — 9.2k tokens]
12 documents retrieved from internal KB:
Q4 earnings reports, competitor analysis, sector overviews, analyst notes`},{type:"tool-result",text:`[MEMORY — 1.1k tokens]
User: Sarah Chen, VP Research
Preference: executive summary first, then detail
Current project: semiconductor sector report for Q2`},{type:"tool-result",text:`[MCP:Gmail + Calendar — 14k tokens]
Today's emails + this week's calendar pre-loaded`}],note:"Infrastructure is <b>39.5k tokens — 31% of the window</b>. This is the fixed overhead cost paid on <b>every single one of the 8 API calls</b> in this session. By turn 8, 39.5k × 8 = 316k tokens of infrastructure will have been transmitted."},turns:[{user:140,assistant:480,title:"Turn 1",desc:"Task setup",fullDesc:"Opening exchange to frame the research. Short — but this ~620-token exchange will be re-sent 7 more times during this session, costing 4.3k additional tokens across the session.",example:[{type:"user",text:'"I need a comprehensive semiconductor supply chain analysis for Q2 — focus on TSMC, Samsung, and ASML."'},{type:"assistant",text:`"Understood. I'll cover manufacturing capacity, geopolitical exposure, and forward outlook for each. Starting with TSMC..."`}],note:"Small setup turn. But it will be <b>re-sent 7 more times</b> — once per remaining API call in this session."},{user:340,thinking:1600,toolcall:380,toolres:8800,assistant:1100,title:"Turn 2",desc:"TSMC deep dive — tool call + analysis",fullDesc:"First research turn. The model searched for current TSMC data, got results, and produced a detailed analytical section. Now fully stored in history — including the tool call, search results, and the 1.1k response.",example:[{type:"user",text:'"Start with TSMC — capacity utilization, CapEx plans, and key risks."'},{type:"thinking",text:"I need current TSMC numbers — utilization and CapEx change quarterly. Let me search for their latest earnings guidance and recent analyst reports..."},{type:"tool-call",text:'web_search({ "query": "TSMC Q1 2026 capacity utilization capex guidance earnings" })'},{type:"tool-result",text:"TSMC Q4 2025 call: N3/N5 utilization ~90%, N7+ ~75%. 2026 CapEx: $38B guided (flat). N2 ramp ahead of schedule. CoWoS packaging constrained through H1 2026..."},{type:"assistant",text:`"TSMC Q1 2026:
• Utilization: ~90% advanced nodes (N3/N5), ~75% mature (N7+)
• 2026 CapEx: $38B — priority to N2 ramp and Arizona Fab 21
• Key risk: CoWoS packaging is the binding constraint for AI chip supply, not wafer starts. TSMC has compute dies; it can't package HBM fast enough..."`}],note:"This turn adds <b>11.9k tokens to permanent history</b>. The window is now 40% consumed. Every future call will re-send this entire analysis."},{user:190,assistant:860,title:"Turn 3",desc:"Clarification — no tools needed",fullDesc:"A short clarifying question answered from the previous turn's context. Fast, cheap — but even 1k tokens of clarification becomes permanent overhead for all 5 remaining calls.",example:[{type:"user",text:'"The CoWoS constraint — how does that specifically affect NVIDIA H100/H200 supply?"'},{type:"assistant",text:`"CoWoS (Chip on Wafer on Substrate) is TSMC's advanced packaging tech that stacks HBM memory with compute dies. For NVIDIA: every H100/H200 needs 6 HBM3 stacks bonded to the compute die via CoWoS. Constraint here means NVIDIA can't ship more than ~X units/quarter regardless of how many compute dies they have. It's a packaging bottleneck, not a silicon one. This is why NVIDIA guided supply constraints into mid-2026 even as yields improved."`}],note:"No tools, fast answer. But the ~1k tokens created here is <b>permanent overhead</b> from here on. 5 more calls will each re-send this."},{user:420,thinking:2200,toolcall:550,toolres:13500,assistant:2e3,title:"Turn 4",desc:"Samsung section — heavy research turn",fullDesc:"Second major research block. A thinking turn, two tool calls, and a long analytical response. By now context is getting substantial: infrastructure + 3 history turns + this new turn = 72k tokens.",example:[{type:"user",text:'"Now Samsung — HBM3E ramp vs SK Hynix, and the DRAM cycle outlook."'},{type:"thinking",text:"Samsung had yield issues with HBM3E in 2024 that let SK Hynix dominate. I need to check if Samsung has recovered. Also need current DRAM pricing cycle data — this changes monthly..."},{type:"tool-call",text:`web_search({ "query": "Samsung HBM3E yield qualification status 2026 vs SK Hynix" })
web_search({ "query": "DRAM spot price cycle 2026 outlook DDR5" })`},{type:"tool-result",text:`Samsung completed NVIDIA HBM3E qualification Q4 2025, targeting 35% share vs SK Hynix 50%... DRAM spot up 22% YTD on AI server demand; DDR5 premium widening vs DDR4...
[13.5k tokens of market data and analyst commentary]`},{type:"assistant",text:`"Samsung HBM3E Recovery:
After 2024 yield struggles (SK Hynix captured ~55% market share), Samsung completed NVIDIA qualification Q4 2025. Targeting 35% HBM3E share in 2026 vs SK Hynix's 50%.

DRAM Cycle: Spot prices +22% YTD, driven by AI server DDR5 demand. The cycle appears to be mid-upcycle with DDR5 premium vs DDR4 widening — supports margin expansion for both Samsung and SK Hynix through end of 2026..."`}],note:"Context is now <b>72k tokens — 56% of the window</b>. The large tool results are the primary driver."},{user:280,assistant:1500,title:"Turn 5",desc:"Cross-company synthesis — no tools",fullDesc:"A synthesis question answered from context accumulated in turns 2–4. No new tool calls — the model draws on the TSMC and Samsung analyses already in its window. But synthesizing produces a longer response.",example:[{type:"user",text:`"Based on TSMC and Samsung — what's the real bottleneck for scaling AI compute in 2026?"`},{type:"assistant",text:`"The binding constraint isn't silicon compute — it's advanced packaging. Both TSMC's CoWoS and Samsung/SK Hynix's HBM stacking are capacity-constrained, creating a three-way race:

1. TSMC adding CoWoS capacity at Fab 6 (18-month lead time for equipment)
2. Memory makers qualifying HBM4 (Samsung and SK Hynix racing to 12-high stacks)
3. Chip designers working around the constraint (NVIDIA's GB200 NVL72 uses rack-level disaggregation to reduce per-GPU HBM requirements)

The actual GPU die supply is ample — TSMC has capacity. The packaging ecosystem is the choke point."`}],note:"Pure synthesis — no tools. But the <b>1.5k response</b> is longer than average because it's drawing on analyses from 3 previous turns."},{user:350,thinking:3100,toolcall:480,toolres:7600,assistant:1800,title:"Turn 6",desc:"ASML section — third research block",fullDesc:"Third major research block on ASML. Context is now 83k tokens (65% full). Every tool result is starting to crowd out future conversation room.",example:[{type:"user",text:'"Last company: ASML — EUV shipment schedule, High-NA ramp, and geopolitical exposure."'},{type:"thinking",text:"ASML is the sole global source for EUV and High-NA EUV. Their backlog and shipment schedule determines the pace of the entire semiconductor roadmap. Need 2026 guidance and High-NA ramp status at TSMC/Intel..."},{type:"tool-call",text:`web_search({ "query": "ASML 2026 EUV High-NA shipment guidance backlog revenue" })
web_search({ "query": "ASML China export restrictions 2025 2026 revenue impact" })`},{type:"tool-result",text:"ASML 2026 revenue guidance €30-35B; 20 High-NA units guided; backlog €36B (~3 years). China revenue reduced to 15% post-2024 export controls. High-NA first systems at TSMC and Intel..."},{type:"assistant",text:`"ASML — Monopoly Position:
ASML is the only company on Earth that makes EUV and High-NA EUV lithography systems — genuine single-point-of-failure for sub-7nm chip manufacturing globally.

High-NA Ramp: 20 units guided for 2026 (vs 0 in 2024). First customers: TSMC (2 systems) and Intel (3 systems). At €350M+ each, this is a major revenue event but low unit count.

Geopolitical: China reduced to 15% of revenue after 2024 export control expansion. Netherlands government has broad authority to restrict further. ASML is the most geopolitically exposed company in the sector..."`}],note:"Context is now <b>96k tokens — 75% full</b>. Only ~32k tokens remain, shared between the output budget (8k) and any further turns. The session is in the critical zone."},{user:210,assistant:940,title:"Turn 7",desc:"Quick clarification — expensive at 75% full",fullDesc:"A short clarifying exchange — but notice the ratio: the model is sending 96k tokens of history to generate 940 tokens of output. The context-to-output ratio is now 100:1. Even this small turn adds permanent overhead.",example:[{type:"user",text:`"Quick add — for ASML, what's the significance of High-NA for the 2nm node specifically?"`},{type:"assistant",text:`"High-NA EUV uses a higher numerical aperture (0.55 vs 0.33 for standard EUV), enabling smaller feature sizes — critical for 2nm (N2) and below. For TSMC N2: they can use standard EUV with multiple exposures (SADP), but High-NA would reduce that to single-exposure, improving yield and throughput. For Intel 18A and 14A: High-NA is essentially required. Without it, the multi-patterning complexity makes defect rates unacceptable at volume. This is why Intel's 18A ramp is heavily dependent on ASML High-NA delivery timelines..."`}],note:"The model just sent <b>96k tokens of context</b> to produce 940 tokens of response. The API received 102:1 context-to-output ratio. Infrastructure alone (39.5k) is 42× this response."},{user:260,assistant:null,title:"Turn 8",desc:"Executive summary — final synthesis",fullDesc:"The final ask: an executive summary synthesizing all prior research. The model receives 98k tokens of context — 7 complete turns of research, tool calls, results, and analysis — to generate a concluding deliverable. The window is 77% full.",example:[{type:"user",text:'"Write the executive summary: 3 key takeaways and investment implications for Q2."'},{type:"generating",text:"← Synthesizing 8 turns of semiconductor research into executive summary..."}],note:"Context is <b>99k tokens (77% full)</b>. After this response completes (~1.5k tokens), any follow-up question would send <b>~108k tokens</b> to the API — 84% of the window, with truncation risk approaching."}]},{id:"crisis",label:"⚠ Near Context Limit",sub:"89% full — oldest turns being dropped",infra:{system:5200,tools:1e4,rag:9200,memory:1100,mcp:14e3},maxOut:8e3,infraDesc:{title:"Infrastructure — protected from truncation",desc:"Even at 89% capacity, the system prompt and tool definitions are NEVER truncated. They are sacrosanct. Only conversation history gets dropped — starting from the oldest turns first. The model loses memory of past exchanges, but not its instructions.",example:[{type:"system",text:"You are Claude... [always preserved — never truncated]"},{type:"tool-result",text:"[Tool schemas — always preserved]"},{type:"tool-result",text:"[RAG chunks — always preserved]"}],note:"Infrastructure is <b>always protected</b>. In a context crisis, turns 1 and 2 will be dropped before a single byte of infrastructure is touched. The model loses conversation history, not its core instructions."},turns:[{user:400,assistant:2200,title:"Turn 1",desc:"⚠ Will be truncated first",fullDesc:"This is the oldest non-infrastructure turn and the first to be dropped when the context overflows. The model will silently lose this entire exchange — the user's original task framing and the assistant's detailed architectural decisions both disappear.",example:[{type:"user",text:`"I want to build a complete SaaS product from scratch — architecture, backend, frontend, deployment. Let's start with architecture."`},{type:"assistant",text:`"Great — here's a modern SaaS architecture:

Layer 1 — Application tier: Next.js 15 frontend (App Router), Node.js + Fastify API layer, event-driven workers via BullMQ for async tasks

Layer 2 — Data tier: PostgreSQL primary (Supabase), Redis cache + session store, S3-compatible object storage, pgvector for semantic search

Layer 3 — Infrastructure: Kubernetes on AWS EKS, Terraform for IaC, GitHub Actions CI/CD with preview deployments...

[2.2k tokens of detailed architecture decisions]"`}],note:'⚠ This turn will be <b>dropped first</b>. The model will lose the original architecture context — it may give inconsistent backend/frontend advice in future turns because it no longer "sees" what database, framework, or patterns were decided here.'},{user:580,thinking:7500,toolcall:750,toolres:17e3,assistant:3300,title:"Turn 2",desc:"⚠ Will be truncated second",fullDesc:"A massive agentic turn — tool calls fetched extensive backend documentation. This turn is 29k tokens of history at truncation risk. All that research work will simply vanish from the model's context.",example:[{type:"user",text:'"Design the full backend — API routes, auth strategy, database schema, and give me the boilerplate code."'},{type:"thinking",text:"The user wants full backend architecture with code. Need to decide: REST vs GraphQL, JWT vs sessions, ORM choice, multi-tenant schema strategy... I'll fetch current Node.js SaaS boilerplates to ensure I'm recommending current patterns..."},{type:"tool-call",text:`web_search({ "query": "Node.js Fastify SaaS boilerplate 2026 multi-tenant best practices" })
web_fetch({ "url": "https://github.com/..." })`},{type:"tool-result",text:"[17k tokens of documentation, schema examples, auth patterns, and code from GitHub repos]"},{type:"assistant",text:`"Backend Architecture:

Auth: JWT access tokens (15min) + refresh tokens (7 days) in httpOnly cookies. Redis stores refresh token allowlist.

Multi-tenancy: Row-level with tenant_id on all tables + Postgres RLS policies. Partial index on tenant_id + created_at.

Schema:
\`\`\`sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  email TEXT UNIQUE NOT NULL,
  ...
);
CREATE POLICY tenant_isolation ON users
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
\`\`\`
...[3.3k tokens of code + explanation]"`}],note:"⚠ This 29k-token turn will be <b>dropped second</b>. The model loses the fetched documentation AND all backend decisions. Future code suggestions may contradict the schema and auth patterns designed here."},{user:360,assistant:1900,title:"Turn 3",desc:"At risk — may survive if turns 1+2 are enough",fullDesc:"Shorter turn — may survive truncation since the two larger turns will be dropped first. But if those don't free enough space, this goes next. The problem: it references decisions from turn 2 that have already been dropped.",example:[{type:"user",text:'"For the database — how do I handle soft deletes and audit logging at scale?"'},{type:"assistant",text:'"For the row-level multi-tenant schema we designed: use `deleted_at TIMESTAMPTZ` for soft deletes with a partial index `WHERE deleted_at IS NULL` to keep active queries fast. For audit logging, avoid application-layer triggers — use PostgreSQL logical replication to stream WAL changes to an append-only audit table in a separate schema. This gives you: zero performance overhead on the primary, complete change history, and the ability to replay or query audit events independently..."'}],note:'~2.3k tokens. If turns 1 and 2 are dropped, this becomes the new history start — but it references "the schema we designed" from turn 2 which <b>no longer exists in context</b>.'},{user:520,thinking:10500,toolcall:600,toolres:15500,assistant:4e3,title:"Turn 4",desc:"Frontend — preserved (more recent than turns 1-2)",fullDesc:"A large agentic turn — fetched extensive Next.js documentation. Preserved over turns 1-2 because it's more recent. The logic is simple: newer context is assumed more relevant to the current task.",example:[{type:"user",text:'"Now the full frontend — Next.js App Router setup, component architecture, state management, and the auth flow."'},{type:"thinking",text:"Frontend with App Router. Need to think through: server vs client components boundary, Zustand vs Jotai for state, how to implement multi-tenant auth with the JWT strategy from the backend, optimistic updates pattern..."},{type:"tool-call",text:`web_search({ "query": "Next.js 15 App Router SaaS patterns server client components 2026" })
web_fetch({ "url": "https://nextjs.org/docs/app/..." })`},{type:"tool-result",text:"[15.5k tokens of Next.js App Router patterns, caching strategies, auth examples]"},{type:"assistant",text:`"Frontend Architecture:

Server/client split: Fetch data in server components; interactive UI in client components with \`'use client'\`. This gives you streaming SSR for initial load with client-side interactivity where needed.

State: Zustand for global state (auth session, tenant context). React Query for server state (avoids duplicating cache logic).

Auth flow: \`middleware.ts\` checks JWT on every request. Expired tokens redirect to \`/login\`; refresh happens via \`/api/auth/refresh\` server action...

[4k tokens of component tree + code]"`}],note:"This 31k-token turn is <b>preserved over turns 1-2</b> because it's more recent. The model keeps newer context, discards older."},{user:300,assistant:2100,title:"Turn 5",desc:"Testing strategy — preserved",fullDesc:"Shorter recent turn, preserved. But notice: if the user asks about the database schema or auth patterns from turn 2, the model will not know what was decided.",example:[{type:"user",text:'"What testing strategy across backend and frontend?"'},{type:"assistant",text:`"Testing pyramid for this stack:

Unit (70%): Jest + ts-jest for backend logic; React Testing Library for components. Keep unit tests fast (<10ms each).

Integration (20%): Supertest for API routes with a test database container (Docker); test the auth middleware, tenant isolation policies (critical — test that tenant A cannot access tenant B's data), and webhook handlers.

E2E (10%): Playwright for critical paths — signup flow, first login, onboarding, billing. Don't use E2E for everything; they're slow and flaky at scale.

For multi-tenancy specifically: add a dedicated tenant isolation test suite that runs as part of CI..."`}],note:`~2.4k tokens. Preserved. But notice: this test advice references "tenant isolation policies" from turn 2's schema — which has been <b>silently dropped</b> from context.`},{user:440,thinking:5500,toolcall:420,toolres:8800,assistant:null,title:"Turn 6",desc:"⚠ Deployment turn — generating without full context",fullDesc:"The user asks about deployment. Critical problem: the context window is 89% full. Turns 1 and 2 will be dropped before this API call completes. The model is generating deployment advice without knowing the original architecture decisions or the backend code. It will try to work from what remains in context.",example:[{type:"user",text:'"Final piece — Kubernetes setup, CI/CD pipeline, zero-downtime deployments."'},{type:"thinking",text:`Deployment architecture for a SaaS product. From what I can see in context: Next.js frontend (App Router), Node.js/Fastify backend, PostgreSQL + Redis, multi-tenant with RLS. I notice turns 1-2 appear to have been truncated — I can see the frontend and testing discussions but the original architecture overview and backend schema decisions are gone.

I'll design deployment to be consistent with what I can see: Node.js API, Next.js frontend, PostgreSQL, K8s on AWS EKS...`},{type:"tool-call",text:'web_search({ "query": "Kubernetes zero-downtime deployment Node.js Next.js PostgreSQL 2026" })'},{type:"tool-result",text:"[8.8k tokens of K8s deployment patterns, rolling updates, health checks, ArgoCD setup]"},{type:"generating",text:"← Generating deployment guide — without full awareness of original architecture decisions from turn 1..."}],note:"⚠ The model just noticed in its thinking that <b>turns 1-2 were truncated</b>. It's generating deployment advice that may contradict the original architecture. This is the real-world cost of context overflow: <b>silent, hard-to-detect inconsistency.</b>"}]}],m=t=>t>=1e4?(t/1e3).toFixed(0)+"k":t>=1e3?(t/1e3).toFixed(1)+"k":String(t),j=(t,e)=>(t/e*100).toFixed(1)+"%",U=t=>t<.55?"#48a870":t<.8?"#c8b530":"#e05555",N=t=>t.assistant===null||t.assistant===void 0,ue=t=>Object.values(t.infra).reduce((e,s)=>e+s,0),V=t=>(t.files||0)+(t.user||0)+(t.thinking||0)+(t.toolcall||0)+(t.toolres||0)+(t.assistant||0),oe=t=>ue(t)+t.turns.reduce((e,s)=>e+V(s),0);function Ae(t){const e=oe(t)+t.maxOut;if(e<=b*.85)return new Set;let s=e-b*.85,n=0;const a=new Set;for(let o=0;o<t.turns.length-1&&!(n>=s);o++)a.add(o),n+=V(t.turns[o]);return a}function he(t,e){const s=[];return t.files&&s.push({key:"files",tokens:t.files}),t.user&&s.push({key:"user",tokens:t.user}),t.thinking&&s.push({key:"thinking",tokens:t.thinking}),t.toolcall&&s.push({key:"toolcall",tokens:t.toolcall}),t.toolres&&s.push({key:"toolres",tokens:t.toolres}),N(t)?e&&s.push({gen:!0}):s.push({key:"assistant",tokens:t.assistant}),s}function Me(t){return new Promise(e=>setTimeout(e,t))}const B={small:500,medium:2e3,large:8e3,xl:2e4},ke=[{k:"small",v:500,label:"S"},{k:"medium",v:2e3,label:"M"},{k:"large",v:8e3,label:"L"},{k:"xl",v:2e4,label:"XL"}],$e=[{key:"system",label:"System Prompt",color:"#e05555"},{key:"tools",label:"Tool Definitions",color:"#c8b530"},{key:"rag",label:"RAG Chunks",color:"#48a870"},{key:"memory",label:"Retrieved Memory",color:"#32c0a0"},{key:"mcp",label:"MCP Server Data",color:"#3898dc"}],l={id:"interactive",label:"Interactive Build",sub:"Build your own context window",infra:{system:0,tools:0,rag:0,memory:0,mcp:0},infraPreset:{system:null,tools:null,rag:null,memory:null,mcp:null},maxOut:4e3,turns:[],get infraDesc(){return{title:"Your Infrastructure",desc:"Infrastructure you enabled. Each component is injected at the start of every API call before any conversation turns.",example:this._buildInfraExample(),note:`Total infrastructure: <b>${m(Object.values(this.infra).reduce((t,e)=>t+e,0))} tokens</b> — paid on every API call.`}},_buildInfraExample(){const t=[];return this.infra.system&&t.push({type:"system",text:`System prompt — ${m(this.infra.system)} tokens`}),this.infra.tools&&t.push({type:"tool-result",text:`Tool definitions — ${m(this.infra.tools)} tokens`}),this.infra.rag&&t.push({type:"tool-result",text:`RAG chunks — ${m(this.infra.rag)} tokens`}),this.infra.memory&&t.push({type:"tool-result",text:`Retrieved memory — ${m(this.infra.memory)} tokens`}),this.infra.mcp&&t.push({type:"tool-result",text:`MCP server data — ${m(this.infra.mcp)} tokens`}),t.length||t.push({type:"system",text:"No infrastructure components enabled yet."}),t}};function J(t,e){const s=[];e.files&&s.push(`file attachment (${m(e.files)} tok)`),e.user&&s.push(`user message (${m(e.user)} tok)`),e.thinking&&s.push(`thinking block (${m(e.thinking)} tok)`),e.toolcall&&s.push(`tool call (${m(e.toolcall)} tok)`),e.toolres&&s.push(`tool result (${m(e.toolres)} tok)`);const n=!N(e);n&&s.push(`assistant response (${m(e.assistant)} tok)`);const a=V(e),o=[];e.files&&o.push({type:"tool-result",text:`[Attached file — ${m(e.files)} tokens]`}),e.user&&o.push({type:"user",text:`User message — ${m(e.user)} tokens (~${e.user*4} characters)`}),e.thinking&&o.push({type:"thinking",text:`[Extended thinking — ${m(e.thinking)} tokens of internal reasoning]`}),e.toolcall&&o.push({type:"tool-call",text:`[Tool call — ${m(e.toolcall)} tokens]`}),e.toolres&&o.push({type:"tool-result",text:`[Tool result — ${m(e.toolres)} tokens]`}),n?o.push({type:"assistant",text:`[Assistant response — ${m(e.assistant)} tokens]`}):o.push({type:"generating",text:"← Model generating response (not yet in context)"}),e.title=`Turn ${t+1} — ${n?"Completed":"Generating"}`,e.desc=`${n?"Completed":"Active"} turn with: ${s.join(", ")}.`,e.fullDesc=`Turn ${t+1} you built interactively. Contains: ${s.join("; ")}. Total: ${m(a)} tokens. ${n?"This turn is part of conversation history and will be re-sent on every future API call.":"The response is still being generated — not in context yet."}`,e.example=o,e.note=`This turn contributes <b>${m(a)} tokens</b> — <b>${j(a,128e3)}</b> of the 128k window. ${n?"Re-transmitted on every future API call.":""}`}const E={system:{name:"System Prompt",color:"#e05555",badge:"always first",who:"Anthropic + Operator",desc:"The first thing in every context window — sent verbatim at the very top of every single API call. Defines identity, safety rules, capabilities, and operator behavior. Never truncated, even during a context crisis.",items:[{l:"Position",v:"Index 0 — guaranteed to be the first thing the model reads"},{l:"Content",v:"Persona, tone rules, capability flags, safety guidelines, operator instructions"},{l:"Protected",v:"Never dropped during truncation — treated as permanent infrastructure"},{l:"Typical size",v:"3k – 12k tokens"}]},tools:{name:"Tool Definitions",color:"#c8b530",badge:"infrastructure",who:"Platform + Operator",desc:"JSON schemas describing every tool Claude can invoke. Placed right after the system prompt. Each tool costs tokens even if it's never called. A 20-tool setup consumes 6k–16k tokens before the first message.",items:[{l:"Position",v:"After system prompt, before any conversation turns"},{l:"Per tool",v:"~300–800 tokens per schema (name + description + params)"},{l:"Waste risk",v:"Defining tools that are never called silently drains budget every call"},{l:"Typical size",v:"3k – 20k tokens"}]},rag:{name:"RAG Chunks",color:"#48a870",badge:"on demand",who:"Retrieval pipeline",desc:"Document snippets retrieved from a vector database and injected before the conversation. The model never permanently learned this knowledge — it's provided fresh on every request. Quality depends entirely on retrieval precision.",items:[{l:"Position",v:"After tool defs, before conversation turns"},{l:"How it works",v:"Semantic search over embeddings → top-k chunks injected"},{l:"Risk",v:"Irrelevant chunks consume budget without improving answers"},{l:"Typical size",v:"2k – 30k tokens"}]},memory:{name:"Retrieved Memory",color:"#32c0a0",badge:"on demand",who:"Memory system",desc:"Compressed summaries of past conversations, retrieved and injected before the current exchange. Far more token-efficient than replaying full verbatim history — weeks of chats can compress to a few hundred tokens.",items:[{l:"Position",v:"With RAG, before conversation turns"},{l:"vs. history",v:"Summaries not verbatim — much more compressed"},{l:"Typical size",v:"200 – 3k tokens"}]},mcp:{name:"MCP Server Data",color:"#3898dc",badge:"when connected",who:"MCP servers",desc:"Tool schemas and pre-fetched data from connected MCP servers (Gmail, Calendar, Slack…). Each server injects both its tool schemas and any data it retrieved. Grows with each additional server.",items:[{l:"Position",v:"With other infrastructure, before conversation turns"},{l:"Content",v:"MCP tool schemas + fetched emails, calendar events, Slack messages"},{l:"Growth",v:"Each server adds 2k–8k tokens of schemas alone, plus fetched data"},{l:"Typical size",v:"2k – 20k per connected server"}]},files:{name:"Uploaded Files / Images",color:"#5068e0",badge:"inline with turn",who:"User",desc:"Injected inline within the turn where the user uploaded them — not at the start. A multi-page PDF can add 10k–50k tokens to a single turn. Images cost ~1k–4k tokens each depending on resolution.",items:[{l:"Position",v:"Inside the user turn they were attached to"},{l:"PDFs",v:"Full extracted text injected verbatim — scales with page count"},{l:"Images",v:"~1k–4k tokens per image"},{l:"Typical size",v:"500 – 50k+ tokens (unbounded)"}]},user:{name:"User Message",color:"#7258dc",badge:"per turn",who:"Human",desc:"Each user message alternates with assistant responses in strict order. Every prior user message is re-sent on each API call — context is stateless, so the full history is re-transmitted every time.",items:[{l:"Position",v:"Alternates strictly with assistant responses"},{l:"Re-sent",v:"Every previous message travels with every new API call"},{l:"Typical size",v:"50 – 5k tokens per message"}]},thinking:{name:"Extended Thinking",color:"#b838b8",badge:"optional mode",who:"Claude",desc:"Claude's internal reasoning scratchpad, generated before the reply and stored inside the assistant turn. Can completely dominate the context window — hard reasoning problems routinely produce 20k–50k token thinking blocks.",items:[{l:"Position",v:"Inside assistant turn, before the response text"},{l:"Warning",v:"A single block can consume 25–40% of the entire window"},{l:"When useful",v:"Math proofs, multi-step planning, complex analysis, debugging"},{l:"Typical size",v:"2k – 60k tokens"}]},toolcall:{name:"Tool Call (outgoing)",color:"#e09838",badge:"per invocation",who:"Claude",desc:"The structured JSON Claude emits to invoke a tool. Appears inside the assistant turn, separate from and smaller than the result it triggers. Accumulates across multiple calls in agentic loops.",items:[{l:"Position",v:"Inside assistant turn, after thinking (if any)"},{l:"Content",v:"Tool name, structured arguments, unique call ID"},{l:"In loops",v:"10 tool calls = 1k–6k tokens of overhead just for the calls"},{l:"Typical size",v:"100 – 600 tokens each"}]},toolres:{name:"Tool Result",color:"#40b8b8",badge:"per invocation",who:"External service",desc:"Raw output returned by a tool, injected as a special context entry. Often the single largest token consumer in an agentic turn. A single web_fetch can return 50k tokens — truncation strategies are critical.",items:[{l:"Position",v:"Follows its tool call, before the assistant's final reply"},{l:"Risk",v:"Completely unbounded — one fetch can overflow the entire window"},{l:"Best practice",v:"Truncate results; extract only what's needed"},{l:"Typical size",v:"500 – 60k tokens"}]},assistant:{name:"Assistant Response",color:"#dc5088",badge:"per turn",who:"Claude",desc:"Claude's completed reply, stored in history and re-sent on every subsequent call. This is NOT the current generation — only finished turns. The model's own verbosity permanently taxes its future context budget.",items:[{l:"Position",v:"End of each completed turn"},{l:"Key point",v:"What's currently being generated is OUTPUT — not yet in context"},{l:"Accumulates",v:"Every prior response is re-sent in full on each new API call"},{l:"Typical size",v:"100 – 10k tokens per response"}]},generating:{name:"Current Generation (Output)",color:"#b838b8",badge:"NOT in context",who:"Claude (now)",desc:"What the model is writing right now is the OUTPUT — it does not exist inside the context window yet. It only enters context on the NEXT API call, after the user sends another message.",items:[{l:"Status",v:"Being streamed — not yet part of the context window"},{l:"Enters context",v:"Only on the next API call, after user sends next message"},{l:"This explains",v:"Why the model can't re-read its own response as it writes it"},{l:"Budget",v:"Limited by the separate max_tokens parameter"}]},output_budget:{name:"Output Budget (max_tokens)",color:"#3898dc",badge:"reserved",who:"API parameter",desc:"Space reserved for the model's upcoming response, controlled by the max_tokens API parameter. This counts against the total context limit — it's a hard reservation, not a suggestion.",items:[{l:"Formula",v:"input_tokens + max_tokens ≤ 128k total window"},{l:"Effect",v:"A large max_tokens directly shrinks available history space"},{l:"Typical",v:"4k – 16k tokens reserved"}]}};function Ce(){var o,u,d;const t=document.getElementById("slist"),e=((o=c.SC)==null?void 0:o.id)==="interactive"&&((u=document.getElementById("ixPanel"))==null?void 0:u.style.display)!=="none",s=((d=document.getElementById("simPanel"))==null?void 0:d.style.display)!=="none",n=`
    <button class="sb ${s?"on":""}" data-id="simulator">
      <span class="l">🎬 Simulator</span>
      <span class="s">Submit a prompt, watch tool calls fire</span>
      <span class="sb-dot"></span>
    </button>`,a=`
    <button class="sb ${e?"on":""}" data-id="interactive">
      <span class="l">✏ Interactive Build</span>
      <span class="s">Build your own context window</span>
      <span class="sb-dot"></span>
    </button>`;t.innerHTML=n+a+ce.map(r=>{var i;return`
    <button class="sb ${((i=c.SC)==null?void 0:i.id)===r.id&&!s&&!e?"on":""}" data-id="${r.id}">
      <span class="l">${r.label}</span>
      <span class="s">${r.sub}</span>
      <span class="sb-dot"></span>
    </button>`}).join(""),t.querySelectorAll(".sb").forEach(r=>r.addEventListener("click",()=>Pe(r.dataset.id)))}function G(t){var x,_;const e=oe(t),s=(e+t.maxOut)/b,n=ue(t);document.getElementById("scTitle").textContent=t.label,document.getElementById("tokUsed").textContent=m(e),document.getElementById("infraLabel").textContent=`infra: ${m(n)} · ${j(n,b)}`,document.getElementById("utilDot").style.background=U(s),document.getElementById("overflow").classList.toggle("show",s>.88);const a=document.getElementById("ufg");a.style.width=Math.min(s*100,100)+"%",a.style.background=U(s);const o=document.getElementById("upct");o.textContent=(s*100).toFixed(1)+"%",o.style.color=U(s);const u=t.turns.length?t.turns[t.turns.length-1]:null,d=u?N(u):!1,r=document.getElementById("stateNote");r.className="state-note "+(d?"generating":"idle"),r.innerHTML=u?d?`<span class="sn-icon">▶</span><span>Model is generating — output is <b>NOT in context yet</b>. ${m(t.maxOut)} token output budget reserved. It enters context on the next API call.</span>`:`<span class="sn-icon">✓</span><span>All turns complete. Next message triggers a new API call sending all <b>${m(e)} tokens</b> of context.</span>`:'<span class="sn-icon">○</span><span>No turns yet — add infrastructure and messages using the controls on the left.</span>';const i=document.getElementById("linbar");i.innerHTML="";const h=c.HT!=null&&c.HT>=0;h?i.classList.add("turn-active"):i.classList.remove("turn-active");let f=0;for(const[g,y]of Object.entries(t.infra)){if(!y)continue;const k=document.createElement("div");k.className="lseg"+(c.HK===g?" hl":"");const M=y/b*100;k.style.cssText=`width:${M}%;background:${((x=E[g])==null?void 0:x.color)||"#888"}`;const O=document.createElement("div");O.className="ll",O.textContent=((_=E[g])==null?void 0:_.name)||g,k.appendChild(O),k.addEventListener("click",()=>P(g)),k.addEventListener("mousemove",ae=>te(ae,{key:g,tokens:y})),k.addEventListener("mouseleave",se),i.appendChild(k),f+=M}const p=document.createElement("div");p.className="linbar-divider",p.style.left=f+"%",i.appendChild(p);let v=f,w=v,A=v;t.turns.forEach((g,y)=>{const k=y===t.turns.length-1,M=he(g,k),O=c.HT===y;let ae=f;M.forEach(ie=>{var be,ve;if(ie.gen)return;const q=ie.key,ge=ie.tokens,ye=ge/b*100,$=document.createElement("div");$.className="lseg"+(c.HK===q?" hl":""),h&&O&&$.classList.add("in-turn"),$.style.cssText=`width:${ye}%;background:${((be=E[q])==null?void 0:be.color)||"#888"}`;const re=document.createElement("div");re.className="ll",re.textContent=((ve=E[q])==null?void 0:ve.name)||q,$.appendChild(re),$.addEventListener("click",le=>{le.stopPropagation(),P(q)}),$.addEventListener("mousemove",le=>te(le,{key:q,tokens:ge})),$.addEventListener("mouseleave",se),i.appendChild($),f+=ye}),O&&(w=ae,A=f)});const T=document.createElement("div");T.className="lseg-out",T.style.cssText=`width:${t.maxOut/b*100}%;flex-shrink:0`;const I=document.createElement("div");I.className="ll2",t.maxOut/b>.03&&(I.textContent="output budget"),T.appendChild(I),T.addEventListener("click",()=>P("output_budget")),T.addEventListener("mousemove",g=>te(g,{key:"output_budget",tokens:t.maxOut})),T.addEventListener("mouseleave",se),i.appendChild(T);const L=b-e-t.maxOut;if(L>0){const g=document.createElement("div");g.className="lseg-free";const y=document.createElement("span");y.textContent=m(L)+" free",g.appendChild(y),i.appendChild(g)}if(c.HT!=null&&c.HT>=0){const g=document.createElement("div");g.className="turn-bracket",g.style.left=w+"%",g.style.width=A-w+"%",i.appendChild(g)}const C=document.getElementById("lticks");C.innerHTML="",[0,25,50,75,100].forEach(g=>{const y=document.createElement("div");y.className="ltick",y.style.left=g+"%",y.textContent=g===0?"0":m(g===100?b:b*g/100),C.appendChild(y)})}function K(t){const e=document.getElementById("turns");e.innerHTML="";const s=oe(t),n=s||1,a=Ae(t),o=c.HT,u=c.HK;let d=0;const r=document.createElement("div");r.className="turn-section-sep",r.textContent="Infrastructure",e.appendChild(r);const i=ue(t);d+=i;{const f=xe(-1,"INFRA",null,null,!1,!1,o),p=f.querySelector(".tbar");for(const[v,w]of Object.entries(t.infra))w&&p.appendChild(we(v,w,n,u));p.appendChild(Te()),f.querySelector(".tcum").innerHTML='<span class="cv">'+m(i)+'</span><span class="cl">per call</span>',e.appendChild(f)}const h=document.createElement("div");h.className="turn-section-sep",h.textContent="Conversation turns",e.appendChild(h),t.turns.forEach((f,p)=>{const v=V(f);d+=v;const w=p===t.turns.length-1,A=N(f)&&w,T=a.has(p),I=xe(p,"T"+(p+1),v,b,T,A,o),L=I.querySelector(".tbar");he(f,w).forEach(_=>{if(_.gen){const g=document.createElement("div");g.className="tc-gen";const y=document.createElement("span");y.textContent="← generating",g.appendChild(y),g.addEventListener("click",M=>{M.stopPropagation(),P("generating")}),L.appendChild(g);const k=document.createElement("div");k.className="tc-out",k.style.width=t.maxOut/n*100+"%",k.style.minWidth="4px",k.addEventListener("click",M=>{M.stopPropagation(),P("output_budget")}),L.appendChild(k)}else L.appendChild(we(_.key,_.tokens,n,u))}),A||L.appendChild(Te());const x=I.querySelector(".tcum");T?(x.className="tcum warn",x.innerHTML='<span class="cv">&#9888; '+m(v)+'</span><span class="cl">will drop</span>'):A?x.innerHTML='<span class="cv">&#8721; '+m(d-v)+'</span><span class="cl">in context</span>':x.innerHTML='<span class="cv">+'+m(v)+'</span><span class="cl">&#8721; '+m(d)+"</span>",e.appendChild(I)})}function xe(t,e,s,n,a,o,u,d){const r=document.createElement("div");r.className="trow"+(u===t?" sel":"")+(a?" trunc":""),r.addEventListener("click",()=>ee(t));const i=document.createElement("div");i.className="trow-left";const h=document.createElement("div");if(h.className="trow-label"+(t===-1?" infra-lbl":o?" gen-lbl":""),h.innerHTML=e+(a?' <span style="color:#e09838;font-size:.48rem">&#9888;</span>':"")+(o?' <span style="font-size:.5rem">&#9654;</span>':""),i.appendChild(h),s&&n){const v=document.createElement("div");v.className="trow-pct",v.textContent=(s/n*100).toFixed(1)+"%",i.appendChild(v)}r.appendChild(i);const f=document.createElement("div");f.className="tbar",r.appendChild(f);const p=document.createElement("div");return p.className="tcum",r.appendChild(p),r}function we(t,e,s,n){const a=E[t],o=e/s*100,u=document.createElement("div");return u.className="tc"+(n===t?" hl":""),u.style.cssText="width:"+Math.max(o,.08)+"%;background:"+(a&&a.color?a.color:"#888"),o>4.5&&(u.textContent=a&&a.name?a.name:t),u.addEventListener("click",d=>{d.stopPropagation(),P(t)}),u.addEventListener("mousemove",d=>te(d,{key:t,tokens:e})),u.addEventListener("mouseleave",se),u}function Te(){const t=document.createElement("div");return t.className="tc-free",t}function W(){const t=new Set(["output_budget"]);Object.entries(c.SC.infra).forEach(([e,s])=>{s&&t.add(e)}),c.SC.turns.forEach(e=>{e.files&&t.add("files"),e.user&&t.add("user"),e.thinking&&t.add("thinking"),e.toolcall&&t.add("toolcall"),e.toolres&&t.add("toolres"),N(e)?t.add("generating"):t.add("assistant")}),document.getElementById("legend").innerHTML=[...t].filter(e=>E[e]).map(e=>`
    <div class="li ${c.HK===e?"hl":""}" data-key="${e}" style="${c.HK===e?`color:${E[e].color}`:""}">
      <div class="ldot" style="background:${E[e].color}"></div>
      <span>${E[e].name}</span>
    </div>`).join(""),document.getElementById("legend").querySelectorAll(".li").forEach(e=>e.addEventListener("click",()=>P(e.dataset.key)))}const Re=[{id:"Infrastructure",label:"Infrastructure (every call)",keys:["system","tools","rag","memory","mcp"]},{id:"User Input",label:"User Input",keys:["files","user"]},{id:"Tool Use",label:"Tool Use",keys:["toolcall","toolres"]},{id:"Assistant",label:"Assistant Output",keys:["thinking","assistant"]}];function z(){const t=c.HK,e=c.HT,s=document.getElementById("rp"),n=document.getElementById("rpTitle"),a=document.getElementById("rpHint");s.classList.add("fade-in"),setTimeout(()=>s.classList.remove("fade-in"),250),t?(n.textContent="Segment Detail",a.textContent="← back button below",He(s)):e!=null?(n.textContent=e===-1?"Infrastructure":"Turn Detail",a.textContent="use ← → to navigate",Be(s)):(n.textContent="Token Budget",a.textContent="click any turn or segment",Ne(s))}function Ne(t){const e=c.SC,s=c.HK,n=oe(e),a={};for(const[h,f]of Object.entries(e.infra))a[h]=(a[h]||0)+f;e.turns.forEach(h=>{["files","user","thinking","toolcall","toolres"].forEach(f=>{h[f]&&(a[f]=(a[f]||0)+h[f])}),N(h)||(a.assistant=(a.assistant||0)+(h.assistant||0))});let o='<div class="bk-title">Token Budget</div>';Re.forEach(h=>{const f=h.keys.filter(p=>a[p]);f.length&&(o+=`<div class="bk-group"><div class="bk-glabel">${h.label}</div>`,f.forEach(p=>{const v=a[p]||0,w=E[p],A=Math.round(v/b*100);o+=`<div class="bk-row ${s===p?"hl":""}" data-key="${p}">
        <div class="bkdot" style="background:${w.color}"></div>
        <div class="bk-name">${w.name}</div>
        <div class="bk-minibar"><div class="bk-minifill" style="width:${A}%;background:${w.color}"></div></div>
        <div class="bk-tok">${m(v)}</div>
        <div class="bk-pct">${j(v,b)}</div>
      </div>`}),o+="</div>")});const u=Math.round(e.maxOut/b*100);o+=`<div class="bk-group"><div class="bk-glabel">Reserved (output budget)</div>
    <div class="bk-row ${s==="output_budget"?"hl":""}" data-key="output_budget">
      <div class="bkdot" style="background:#3898dc"></div>
      <div class="bk-name">max_tokens</div>
      <div class="bk-minibar"><div class="bk-minifill" style="width:${u}%;background:#3898dc"></div></div>
      <div class="bk-tok">${m(e.maxOut)}</div>
      <div class="bk-pct">${j(e.maxOut,b)}</div>
    </div></div>`;const d=n+e.maxOut,r=b-d,i=d/b;o+=`<div class="bk-summary">
    <div style="display:flex;justify-content:space-between;font-size:.58rem;color:var(--mu2);margin-bottom:4px">
      <span>Input + output budget</span>
      <span style="color:${U(i)};font-weight:600">${(i*100).toFixed(1)}%</span>
    </div>
    <div class="bk-summary-bar">
      <div class="bk-summary-fill" style="width:${Math.min(i*100,100)}%;background:${U(i)}"></div>
    </div>
    <div class="bk-summary-row">
      <span>Input: <b>${m(n)}</b></span>
      <span>Reserved: <b>${m(e.maxOut)}</b></span>
      <span>Free: <b style="color:${r<0?"#e05555":"inherit"}">${r>0?m(r):"OVER"}</b></span>
    </div>
  </div>
  <div class="bk-tip">
    Mini-bars are proportional to the full 128k window — not just to used tokens.<br><br>
    ↑ Click any turn row to see a real-world example.<br>
    Click any colored segment for technical details.
  </div>`,t.innerHTML=o,t.querySelectorAll(".bk-row[data-key]").forEach(h=>h.addEventListener("click",()=>P(h.dataset.key)))}function Be(t){var T,I,L;const e=c.SC,s=c.HT,n=s===-1,a=e.turns.length,o=s<=0?-1:s-1,u=n?0:s<a-1?s+1:null,d=!n,r=u!==null,i=n?e.infraDesc:e.turns[s],h=!n&&Ae(e).has(s),f=!n&&N(e.turns[s])&&s===e.turns.length-1;let p="";p+=`<div class="td-nav">
    <button class="td-back" data-back="1">← Budget</button>
    <div class="td-nav-btns">
      <button class="td-nav-btn" data-prev="1" ${d?"":"disabled"}>← Prev</button>
      <button class="td-nav-btn" data-next="1" ${r?"":"disabled"}>Next →</button>
    </div>
  </div>`,h&&(p+=`<div class="td-warn">⚠ This turn will be truncated — it's the oldest non-protected content and will be dropped first when the context window runs out of space.</div>`);const v=n?"Infrastructure":`Turn ${s+1} of ${a}`;if(p+=`
    <div class="td-turn-number">${v}</div>
    <div class="td-badge-row">
      <span class="td-badge" style="color:${h?"#e09838":f?"#b838b8":"#48a870"};border-color:${h?"rgba(224,152,56,.3)":f?"rgba(184,56,184,.3)":"rgba(72,168,112,.3)"}">${n?"Re-sent on every API call":f?"Currently generating — output NOT yet in context":h?"Completed — AT RISK of truncation":"Completed — part of conversation history"}</span>
    </div>
    <div class="td-title">${i.title||""}</div>
    <div class="td-desc">${i.fullDesc||i.desc||""}</div>
  `,!n){const C=e.turns[s],x=he(C,s===e.turns.length-1),_=V(C)||1;p+='<div class="td-segs-label">Segments in this turn</div><div class="td-segs">',x.forEach(g=>{if(g.gen)p+=`<div class="td-seg-row" data-key="generating">
          <div class="td-seg-dot" style="background:rgba(184,56,184,.5);border:1px dashed rgba(184,56,184,.6)"></div>
          <div class="td-seg-name" style="color:rgba(184,56,184,.8)">Current Generation</div>
          <div class="td-seg-bar"></div>
          <div class="td-seg-tok" style="color:rgba(184,56,184,.6)">output</div>
          <div class="td-seg-pct" style="color:rgba(184,56,184,.5)">—</div>
        </div>`;else{const y=E[g.key],k=Math.round(g.tokens/_*100);p+=`<div class="td-seg-row" data-key="${g.key}">
          <div class="td-seg-dot" style="background:${(y==null?void 0:y.color)||"#888"}"></div>
          <div class="td-seg-name">${(y==null?void 0:y.name)||g.key}</div>
          <div class="td-seg-bar"><div class="td-seg-fill" style="width:${k}%;background:${(y==null?void 0:y.color)||"#888"}"></div></div>
          <div class="td-seg-tok">${m(g.tokens)}</div>
          <div class="td-seg-pct">${j(g.tokens,b)}</div>
        </div>`}}),p+="</div>"}const A=i.example;if(A&&A.length){const C={user:"User",assistant:"Claude",thinking:"Claude thinking",system:"System Prompt","tool-call":"Tool Call","tool-result":"Tool Result",generating:"← Generating (output)"};p+='<div class="td-example"><div class="td-ex-label">Real-world example</div>',A.forEach(x=>{const _=x.type==="tool-call"?"tool-call":x.type==="tool-result"?"tool-result":x.type;p+=`<div class="bubble ${_}"><span class="bl">${C[x.type]||x.type}</span>${De(x.text)}</div>`}),p+="</div>"}i.note&&(p+=`<div class="td-note">${i.note}</div>`),t.innerHTML=p,(T=t.querySelector("[data-back]"))==null||T.addEventListener("click",()=>ee(null)),(I=t.querySelector("[data-prev]"))==null||I.addEventListener("click",()=>{d&&ee(o)}),(L=t.querySelector("[data-next]"))==null||L.addEventListener("click",()=>{r&&ee(u)}),t.querySelectorAll(".td-seg-row[data-key]").forEach(C=>C.addEventListener("click",()=>P(C.dataset.key)))}function He(t){var d;const e=c.SC,s=c.HK,n=E[s];if(!n){t.innerHTML="";return}let a=0,o=0;for(const[r,i]of Object.entries(e.infra))r===s&&(a+=i,o++);e.turns.forEach(r=>{const i={files:r.files,user:r.user,thinking:r.thinking,toolcall:r.toolcall,toolres:r.toolres,assistant:r.assistant};i[s]&&(a+=i[s],o++)}),s==="output_budget"&&(a=e.maxOut);const u=s!=="generating";t.innerHTML=`
    <div style="margin-bottom:10px">
      <button class="td-back" id="segBack">← Back</button>
    </div>
    <div class="sd-name" style="color:${n.color}">${n.name}</div>
    <div class="sd-tok">${u&&a?m(a)+" tokens · "+j(a,b)+" of window":"not yet in context"}${o>1?" · "+o+" occurrences":""}</div>
    <div class="sd-badges">
      <span class="sd-badge" style="color:${n.color};border-color:${n.color}30">${n.badge}</span>
      <span class="sd-badge" style="color:var(--mu2);border-color:var(--mu)25">${n.who}</span>
    </div>
    <div class="sd-desc">${n.desc}</div>
    <div class="sd-items">${n.items.map(r=>`
      <div class="sd-item">
        <div class="sd-il">${r.l}</div>
        <div class="sd-iv">${r.v}</div>
      </div>`).join("")}</div>`,(d=t.querySelector("#segBack"))==null||d.addEventListener("click",()=>P(null))}function De(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/`([^`]+)`/g,"<code>$1</code>").replace(/\n/g,"<br>").replace(/  /g,"&nbsp;&nbsp;")}function de(){G(c.SC),K(c.SC),W(),z()}function R(){Ie(),de()}function Ie(){const t=document.getElementById("ixBody");if(!t)return;let e='<div class="ix-body">';e+='<div class="ix-section"><div class="ix-section-title">Infrastructure</div>',$e.forEach(function(o){const u=o.key,d=o.label,r=o.color,i=l.infra[u],h=i>0,f=l.infraPreset[u];e+='<div class="ix-component '+(h?"active":"")+'" data-comp="'+u+'">',e+='<div class="ix-comp-header">',e+='<div class="ix-comp-dot" style="background:'+r+";opacity:"+(h?1:.35)+'"></div>',e+='<span class="ix-comp-name">'+d+"</span>",e+='<span class="ix-comp-tok">'+(h?m(i)+"&nbsp;tok":"")+"</span>",e+='<input type="checkbox" class="ix-toggle" data-comp-toggle="'+u+'" '+(h?"checked":"")+">",e+="</div>",h&&(e+='<div class="ix-presets">',ke.forEach(function(p){e+='<button class="ix-preset '+(f===p.k?"on":"")+'" data-comp-preset="'+u+'" data-preset="'+p.k+'">'+p.label+'&nbsp;<span style="opacity:.6">'+m(p.v)+"</span></button>"}),e+="</div>",e+='<input type="number" class="ix-custom-input" placeholder="Custom token count" value="'+(f?"":i)+'" data-comp-custom="'+u+'" min="1" max="128000">'),e+="</div>"}),e+="</div>",e+='<div class="ix-section">',e+='<div class="ix-section-title">Output Budget (max_tokens)</div>',e+='<div class="ix-slider-row">',e+='<input type="range" class="ix-slider" id="ixMaxOut" min="256" max="32000" step="256" value="'+l.maxOut+'">',e+='<span class="ix-slider-val" id="ixMaxOutVal">'+m(l.maxOut)+"</span>",e+="</div></div>";const s=l.turns.length>0,n=s?l.turns[l.turns.length-1]:null,a=n&&n.user>0&&N(n);e+='<div class="ix-section"><div class="ix-section-title">Conversation</div>',a||(e+='<textarea class="ix-msg-area" id="ixMsgArea" placeholder="Type user message…" rows="3"></textarea>',e+='<div class="ix-char-hint" id="ixCharHint">0 chars ≈ 0 tokens</div>',e+='<div class="ix-btn-row">',e+='<button class="ix-btn primary" id="ixSendBtn">Send →</button>',s&&(e+='<button class="ix-btn danger" id="ixRemoveBtn">Remove last turn</button>'),e+="</div>"),a&&(e+='<div class="ix-post-actions">',e+='<div class="ix-post-label">Turn '+l.turns.length+" — choose next step</div>",e+='<div class="ix-btn-row">',e+='<button class="ix-btn" id="ixAddThinking">+ Thinking</button>',e+='<button class="ix-btn" id="ixAddToolCall">+ Tool Call</button>',e+='<button class="ix-btn" id="ixAddFile">+ File</button>',e+="</div>",e+='<div class="ix-size-row" style="margin-top:6px;">',e+='<span class="ix-size-label">Generate response:</span>',ke.forEach(function(o){e+='<button class="ix-btn" data-gen-preset="'+o.k+'">'+o.label+'&nbsp;<span style="opacity:.6">'+m(o.v)+"</span></button>"}),e+="</div>",e+='<div class="ix-btn-row" style="margin-top:3px;">',e+='<button class="ix-btn danger" id="ixRemoveBtn">Remove last turn</button>',e+="</div>",e+="</div>"),e+="</div>",e+='<div style="padding-top:4px;border-top:1px solid var(--bd);margin-top:4px;">',e+='<button class="ix-btn danger" id="ixReset" style="width:100%;">Reset</button>',e+="</div>",e+="</div>",t.innerHTML=e,je()}function je(){document.querySelectorAll("[data-comp-toggle]").forEach(function(d){d.addEventListener("change",function(r){const i=r.target.dataset.compToggle;r.target.checked?(l.infra[i]=B.small,l.infraPreset[i]="small"):(l.infra[i]=0,l.infraPreset[i]=null),R()})}),document.querySelectorAll("[data-comp-preset]").forEach(function(d){d.addEventListener("click",function(){const r=d.dataset.compPreset,i=d.dataset.preset;l.infra[r]=B[i],l.infraPreset[r]=i,R()})}),document.querySelectorAll("[data-comp-custom]").forEach(function(d){d.addEventListener("input",function(){const r=d.dataset.compCustom,i=parseInt(d.value,10);!isNaN(i)&&i>0&&(l.infra[r]=i,l.infraPreset[r]=null,de())})});const t=document.getElementById("ixMaxOut");t&&t.addEventListener("input",function(){l.maxOut=parseInt(t.value,10),document.getElementById("ixMaxOutVal").textContent=m(l.maxOut),de()});const e=document.getElementById("ixMsgArea");if(e){e.addEventListener("input",function(){const r=e.value.length,i=Math.ceil(r/4);document.getElementById("ixCharHint").textContent=r+" chars ≈ "+m(i)+" tokens"});const d=document.getElementById("ixSendBtn");d&&d.addEventListener("click",function(){const r=e.value.trim();if(!r)return;const h={user:Math.ceil(r.length/4),assistant:null,files:0,thinking:0,toolcall:0,toolres:0};J(l.turns.length,h),l.turns.push(h),R()})}const s=document.getElementById("ixAddThinking");s&&s.addEventListener("click",function(){Se("thinking",B.medium)});const n=document.getElementById("ixAddToolCall");n&&n.addEventListener("click",function(){const d=l.turns[l.turns.length-1];d.toolcall=(d.toolcall||0)+B.small,d.toolres=(d.toolres||0)+B.medium,J(l.turns.length-1,d),R()});const a=document.getElementById("ixAddFile");a&&a.addEventListener("click",function(){Se("files",B.medium)}),document.querySelectorAll("[data-gen-preset]").forEach(function(d){d.addEventListener("click",function(){const r=l.turns[l.turns.length-1];r.assistant=B[d.dataset.genPreset],J(l.turns.length-1,r),R()})});const o=document.getElementById("ixRemoveBtn");o&&o.addEventListener("click",function(){l.turns.length>0&&(l.turns.pop(),R())});const u=document.getElementById("ixReset");u&&u.addEventListener("click",Oe)}function Oe(){l.infra={system:0,tools:0,rag:0,memory:0,mcp:0},l.infraPreset={system:null,tools:null,rag:null,memory:null,mcp:null},l.maxOut=4e3,l.turns=[],c.SC&&c.SC.id==="interactive"&&R()}function Se(t,e){const s=l.turns[l.turns.length-1];s[t]=(s[t]||0)+e,J(l.turns.length-1,s),R()}const me={"README.md":`# todo-app

A lightweight todo application built with vanilla JavaScript.

## Features
- Create, edit, and delete todos
- Mark todos as complete
- Filter by status (all / active / completed)
- Persist todos to localStorage
- Sync with remote API (optional)

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

Open http://localhost:3000 in your browser.

## Project Structure

\`\`\`
src/
  index.js          Entry point
  api.js            Remote API client
  storage.js        localStorage wrapper
  components/
    App.js          Root component
    TodoList.js     Renders the todo list
    TodoItem.js     Individual todo row
tests/
  storage.test.js   Unit tests for storage module
\`\`\`

## Configuration

Set \`VITE_API_BASE\` in \`.env\` to point to a remote todo API.
Omit it to run in offline mode (localStorage only).

## License
MIT`,"package.json":`{
  "name": "todo-app",
  "version": "1.2.0",
  "description": "Lightweight todo app with localStorage and optional API sync",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run"
  },
  "devDependencies": {
    "vite": "^6.0.0",
    "vitest": "^2.0.0"
  }
}`,"src/index.js":`import { loadTodos, saveTodos } from './storage.js';
import { App } from './components/App.js';

const root = document.getElementById('root');
const todos = loadTodos();

const app = new App({ todos, onSave: saveTodos });
app.mount(root);`,"src/api.js":`const BASE_URL = import.meta.env.VITE_API_BASE ?? null;

export async function fetchTodos() {
  if (!BASE_URL) return null;
  const res = await fetch(\`\${BASE_URL}/todos\`);
  if (!res.ok) throw new Error(\`API error: \${res.status}\`);
  return res.json();
}

export async function createTodo(text) {
  if (!BASE_URL) return null;
  const res = await fetch(\`\${BASE_URL}/todos\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, done: false }),
  });
  return res.json();
}

export async function updateTodo(id, patch) {
  if (!BASE_URL) return null;
  const res = await fetch(\`\${BASE_URL}/todos/\${id}\`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  return res.json();
}

export async function deleteTodo(id) {
  if (!BASE_URL) return null;
  await fetch(\`\${BASE_URL}/todos/\${id}\`, { method: 'DELETE' });
}`,"src/storage.js":`const KEY = 'todos-v1';

export function loadTodos() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTodos(todos) {
  localStorage.setItem(KEY, JSON.stringify(todos));
}

export function clearTodos() {
  localStorage.removeItem(KEY);
}`,"src/components/App.js":`import { TodoList } from './TodoList.js';

export class App {
  constructor({ todos, onSave }) {
    this.todos = todos;
    this.onSave = onSave;
    this.filter = 'all';
  }

  addTodo(text) {
    if (!text.trim()) return;
    this.todos.push({ id: Date.now(), text: text.trim(), done: false });
    this.onSave(this.todos);
    this.render();
  }

  toggleTodo(id) {
    const todo = this.todos.find(t => t.id === id);
    if (todo) { todo.done = !todo.done; this.onSave(this.todos); this.render(); }
  }

  deleteTodo(id) {
    this.todos = this.todos.filter(t => t.id !== id);
    this.onSave(this.todos);
    this.render();
  }

  setFilter(f) { this.filter = f; this.render(); }

  get visible() {
    if (this.filter === 'active')    return this.todos.filter(t => !t.done);
    if (this.filter === 'completed') return this.todos.filter(t =>  t.done);
    return this.todos;
  }

  mount(root) { this.root = root; this.render(); }

  render() {
    if (!this.root) return;
    this.root.innerHTML = \`
      <div class="app">
        <h1>Todos</h1>
        <input id="new-todo" placeholder="What needs to be done?" />
        <div id="list"></div>
        <div class="filters">
          <button class="\${this.filter==='all'?'active':''}" data-f="all">All</button>
          <button class="\${this.filter==='active'?'active':''}" data-f="active">Active</button>
          <button class="\${this.filter==='completed'?'active':''}" data-f="completed">Completed</button>
        </div>
      </div>\`;
    new TodoList({ todos: this.visible, onToggle: id=>this.toggleTodo(id), onDelete: id=>this.deleteTodo(id) })
      .mount(this.root.querySelector('#list'));
    this.root.querySelector('#new-todo').addEventListener('keydown', e => {
      if (e.key === 'Enter') { this.addTodo(e.target.value); e.target.value = ''; }
    });
    this.root.querySelectorAll('[data-f]').forEach(btn =>
      btn.addEventListener('click', () => this.setFilter(btn.dataset.f)));
  }
}`,"src/components/TodoList.js":`import { TodoItem } from './TodoItem.js';

export class TodoList {
  constructor({ todos, onToggle, onDelete }) {
    this.todos = todos;
    this.onToggle = onToggle;
    this.onDelete = onDelete;
  }

  mount(el) {
    el.innerHTML = '';
    if (this.todos.length === 0) {
      el.innerHTML = '<p class="empty">No todos yet.</p>';
      return;
    }
    this.todos.forEach(todo => {
      new TodoItem({ todo, onToggle: this.onToggle, onDelete: this.onDelete }).mount(el);
    });
  }
}`,"src/components/TodoItem.js":`export class TodoItem {
  constructor({ todo, onToggle, onDelete }) {
    this.todo = todo;
    this.onToggle = onToggle;
    this.onDelete = onDelete;
  }

  mount(el) {
    const div = document.createElement('div');
    div.className = \`todo-item\${this.todo.done ? ' done' : ''}\`;
    div.innerHTML = \`
      <input type="checkbox" \${this.todo.done ? 'checked' : ''} />
      <span>\${this.todo.text}</span>
      <button class="delete">×</button>\`;
    div.querySelector('input').addEventListener('change', () => this.onToggle(this.todo.id));
    div.querySelector('.delete').addEventListener('click', () => this.onDelete(this.todo.id));
    el.appendChild(div);
  }
}`,"tests/storage.test.js":`import { describe, it, expect, beforeEach } from 'vitest';
import { loadTodos, saveTodos, clearTodos } from '../src/storage.js';

describe('storage', () => {
  beforeEach(() => clearTodos());

  it('returns empty array when no data', () => {
    expect(loadTodos()).toEqual([]);
  });

  it('saves and loads todos', () => {
    const todos = [{ id: 1, text: 'Buy milk', done: false }];
    saveTodos(todos);
    expect(loadTodos()).toEqual(todos);
  });

  it('handles corrupt localStorage gracefully', () => {
    localStorage.setItem('todos-v1', '{bad json}');
    expect(loadTodos()).toEqual([]);
  });

  it('clears todos', () => {
    saveTodos([{ id: 1, text: 'Test', done: false }]);
    clearTodos();
    expect(loadTodos()).toEqual([]);
  });
});`},F=Object.keys(me);function ne({path:t}){const e=me[t];if(!e){const s=F.join(", "),n=`Error: File "${t}" not found.

Available files: ${s}`;return{content:n,tokens:Math.ceil(n.length/4)}}return{content:e,tokens:Math.ceil(e.length/4)}}function pe({directory:t=""}={}){const e=F.filter(n=>t===""||n.startsWith(t.replace(/\/?$/,"/"))),s=e.length?e.join(`
`):`No files found in "${t}"`;return{content:s,tokens:Math.ceil(s.length/4)}}function Le({query:t,case_sensitive:e=!1}={}){const s=e?t:t.toLowerCase(),n=Object.entries(me).filter(([,o])=>(e?o:o.toLowerCase()).includes(s)).map(([o,u])=>u.split(`
`).map((i,h)=>({line:i,n:h+1})).filter(({line:i})=>(e?i:i.toLowerCase()).includes(s)).slice(0,3).map(({line:i,n:h})=>`  ${o}:${h}: ${i.trim()}`).join(`
`)).filter(Boolean),a=n.length?n.join(`
`):`No matches found for "${t}"`;return{content:a,tokens:Math.ceil(a.length/4)}}const qe=[{name:"read_file",description:"Read the contents of a file by path",params:"path: string",color:"#c8b530",fn:ne},{name:"list_files",description:"List files in the project (optionally filter by directory)",params:"directory?: string",color:"#48a870",fn:pe},{name:"search_files",description:"Search file contents for a string or pattern",params:"query: string, case_sensitive?: boolean",color:"#3898dc",fn:Le}],Fe={slow:2.5,normal:1,fast:.3};let fe="normal",X=!1,Z=!1;function Ue(t){fe=t}function Ge(){return fe}function Y(){return X}function _e(){Z=!0}function Ke(t,e={}){const s=t.toLowerCase(),n=e.thinking??!1;return/read|open|show|view|display|cat|print/.test(s)&&/\.(js|ts|json|md|css|txt|html)/.test(s)?Ee(t,n):/read|open|show|view/.test(s)&&/readme/i.test(s)?Ee("README.md",n):/list|ls|what files|show files|dir|tree|structure/.test(s)?We(t,n):/search|find|grep|where|look for/.test(s)?ze(t,n):/analyz|refactor|fix|debug|improv|review|audit|check/.test(s)?Ve(t,n):Qe(t,n)}function Q(t){return Math.max(20,Math.ceil(t.length/4))}function Ee(t,e){const s=t.match(/[\w./\-]+\.(js|ts|json|md|css|txt|html)/i);let n=s?s[0]:null;(!n||!F.includes(n))&&(n=F.includes("src/storage.js")?"src/storage.js":F[0]);const a=ne({path:n}),o=[];return o.push({type:"set_infra",key:"tools",tokens:1200,delay:0}),o.push({type:"add_user",tokens:Q(t),delay:300}),e&&o.push({type:"add_thinking",tokens:1800,delay:900}),o.push({type:"add_toolcall",name:"read_file",args:`{ "path": "${n}" }`,tokens:48,delay:e?1600:900}),o.push({type:"add_toolres",name:"read_file",content:a.content,tokens:a.tokens,delay:1400}),o.push({type:"add_assistant",tokens:380,delay:1e3}),{steps:o,title:`read_file("${n}")`}}function We(t,e){const s=pe({}),n=[];return n.push({type:"set_infra",key:"tools",tokens:1200,delay:0}),n.push({type:"add_user",tokens:Q(t),delay:300}),e&&n.push({type:"add_thinking",tokens:1200,delay:900}),n.push({type:"add_toolcall",name:"list_files",args:"{}",tokens:38,delay:e?1400:900}),n.push({type:"add_toolres",name:"list_files",content:s.content,tokens:s.tokens,delay:1200}),n.push({type:"add_assistant",tokens:290,delay:900}),{steps:n,title:"list_files()"}}function ze(t,e){const s=t.match(/(?:search|find|grep|look for)\s+["']?([^"']+?)["']?\s*(?:in|$)/i),n=s?s[1].trim():"loadTodos",a=Le({query:n}),o=[];return o.push({type:"set_infra",key:"tools",tokens:1200,delay:0}),o.push({type:"add_user",tokens:Q(t),delay:300}),e&&o.push({type:"add_thinking",tokens:1400,delay:900}),o.push({type:"add_toolcall",name:"search_files",args:`{ "query": "${n}" }`,tokens:42,delay:e?1400:900}),o.push({type:"add_toolres",name:"search_files",content:a.content,tokens:a.tokens,delay:1200}),o.push({type:"add_assistant",tokens:320,delay:900}),{steps:o,title:`search_files("${n}")`}}function Ve(t,e){const s=pe({}),n=ne({path:"src/storage.js"}),a=ne({path:"tests/storage.test.js"}),o=[];return o.push({type:"set_infra",key:"tools",tokens:1800,delay:0}),o.push({type:"add_user",tokens:Q(t),delay:300}),e&&o.push({type:"add_thinking",tokens:4200,delay:900}),o.push({type:"add_toolcall",name:"list_files",args:"{}",tokens:38,delay:e?2e3:900}),o.push({type:"add_toolres",name:"list_files",content:s.content,tokens:s.tokens,delay:1e3}),o.push({type:"add_toolcall",name:"read_file",args:'{ "path": "src/storage.js" }',tokens:48,delay:900}),o.push({type:"add_toolres",name:"read_file",content:n.content,tokens:n.tokens,delay:1e3}),o.push({type:"add_toolcall",name:"read_file",args:'{ "path": "tests/storage.test.js" }',tokens:52,delay:900}),o.push({type:"add_toolres",name:"read_file",content:a.content,tokens:a.tokens,delay:1e3}),o.push({type:"add_assistant",tokens:620,delay:1200}),{steps:o,title:"3-step agentic loop"}}function Qe(t,e){const s=[];return s.push({type:"set_infra",key:"system",tokens:800,delay:0}),s.push({type:"add_user",tokens:Q(t),delay:300}),e&&s.push({type:"add_thinking",tokens:2400,delay:900}),s.push({type:"add_assistant",tokens:240,delay:e?1800:900}),{steps:s,title:"simple response"}}async function Ye(t,e,{onStep:s,onDone:n,onAbort:a,onError:o}){if(!X){X=!0,Z=!1;try{const u=Ke(t,e),{steps:d}=u,r=Fe[fe]??1;l.infra={system:0,tools:0,rag:0,memory:0,mcp:0},l.maxOut=4096,l.turns=[];for(let i=0;i<d.length;i++){if(Z){a==null||a();return}const h=d[i],f=Math.round((h.delay??800)*r);if(f>0&&await Me(f),Z){a==null||a();return}Je(h),s==null||s(i+1,d.length,h)}n==null||n()}catch(u){o==null||o(u)}finally{X=!1}}}function Je(t){var e;switch(t.type){case"set_infra":l.infra[t.key]=t.tokens;break;case"add_user":{l.turns.push({user:t.tokens,assistant:null,thinking:0,toolcall:0,toolres:0,files:0,_simTitle:"User message",_simDesc:"User submitted a prompt to the model.",_simExample:[{type:"user",text:((e=c.SC)==null?void 0:e._lastPrompt)??"User prompt"}],_toolcalls:[],_toolresults:[]});break}case"add_thinking":{const s=l.turns[l.turns.length-1];s&&(s.thinking=t.tokens);break}case"add_toolcall":{const s=l.turns[l.turns.length-1];s&&(s.toolcall=(s.toolcall||0)+t.tokens,s._toolcalls=s._toolcalls||[],s._toolcalls.push({name:t.name,args:t.args,tokens:t.tokens}));break}case"add_toolres":{const s=l.turns[l.turns.length-1];s&&(s.toolres=(s.toolres||0)+t.tokens,s._toolresults=s._toolresults||[],s._toolresults.push({name:t.name,content:t.content,tokens:t.tokens}));break}case"add_assistant":{const s=l.turns[l.turns.length-1];s&&(s.assistant=t.tokens);break}}}let S=null;function Xe(t){S=t}function D(){const t=document.getElementById("simBody");if(!t)return;const e=Ge();t.innerHTML=`
    <div class="sim-body">

      <div class="sim-section">
        <div class="sim-section-title">Prompt</div>
        <textarea
          id="simPrompt"
          class="sim-prompt"
          placeholder="Describe what you want the AI to do&#10;&#10;Try: &quot;list the files&quot;, &quot;read src/storage.js&quot;, &quot;search for loadTodos&quot;, &quot;analyze and fix the storage module&quot;"
          rows="5"
        ></textarea>
      </div>

      <div class="sim-section">
        <div class="sim-section-title">Options</div>
        <label class="sim-option">
          <input type="checkbox" id="simThinking" />
          <span>Enable extended thinking</span>
        </label>
        <div class="sim-speed-row">
          <span class="sim-speed-label">Speed</span>
          <div class="sim-speed-btns">
            <button class="sim-speed-btn ${e==="slow"?"on":""}" data-speed="slow">Slow</button>
            <button class="sim-speed-btn ${e==="normal"?"on":""}" data-speed="normal">Normal</button>
            <button class="sim-speed-btn ${e==="fast"?"on":""}" data-speed="fast">Fast</button>
          </div>
        </div>
      </div>

      <div class="sim-section">
        <div class="sim-btn-row">
          <button id="simSubmit" class="sim-btn primary" ${Y()?"disabled":""}>
            ${Y()?"⏳ Running…":"▶ Submit"}
          </button>
          <button id="simAbort" class="sim-btn danger" ${Y()?"":"disabled"}>
            ✕ Stop
          </button>
          <button id="simReset" class="sim-btn" ${Y()?"disabled":""}>
            Reset
          </button>
        </div>
      </div>

      <div id="simStatus" class="sim-status" style="display:none"></div>

      <div class="sim-section">
        <div class="sim-section-title">Available tools</div>
        <div class="sim-tools">
          ${qe.map(s=>`
            <div class="sim-tool">
              <span class="sim-tool-dot" style="background:${s.color}"></span>
              <div class="sim-tool-info">
                <span class="sim-tool-name">${s.name}</span>
                <span class="sim-tool-desc">${s.description}</span>
              </div>
            </div>`).join("")}
        </div>
      </div>

      <div class="sim-section">
        <div class="sim-section-title">Sample project files</div>
        <div id="simFileList" class="sim-file-list"></div>
      </div>

    </div>`,Ze(),et()}function Ze(){const t=document.getElementById("simFileList");t&&(t.innerHTML=F.map(e=>`<div class="sim-file">${e}</div>`).join(""))}function et(){document.querySelectorAll(".sim-speed-btn").forEach(n=>{n.addEventListener("click",()=>{Ue(n.dataset.speed),document.querySelectorAll(".sim-speed-btn").forEach(a=>a.classList.remove("on")),n.classList.add("on")})});const t=document.getElementById("simSubmit");t&&t.addEventListener("click",tt);const e=document.getElementById("simAbort");e&&e.addEventListener("click",()=>{_e(),H("Simulation stopped.","idle"),D(),S==null||S()});const s=document.getElementById("simReset");s&&s.addEventListener("click",st)}async function tt(){var a,o;const t=document.getElementById("simPrompt"),e=(a=t==null?void 0:t.value)==null?void 0:a.trim();if(!e){H("Please enter a prompt first.","warn");return}const s=((o=document.getElementById("simThinking"))==null?void 0:o.checked)??!1;c.SC&&(c.SC._lastPrompt=e),H("Starting simulation…","running"),D();let n=0;await Ye(e,{thinking:s},{onStep(u,d,r){n=u;const i=nt(r);H(`Step ${u}/${d}: ${i}`,"running"),S==null||S()},onDone(){H("✓ Simulation complete. Click any turn or segment for details.","done"),D(),S==null||S()},onAbort(){D()},onError(u){H(`Error: ${u.message}`,"error"),D()}})}function st(){_e(),l.infra={system:0,tools:0,rag:0,memory:0,mcp:0},l.turns=[],l.maxOut=4096,H("",""),D(),S==null||S()}function H(t,e){const s=document.getElementById("simStatus");if(s){if(!t){s.style.display="none";return}s.style.display="block",s.className=`sim-status sim-status--${e}`,s.textContent=t}}function nt(t){switch(t.type){case"set_infra":return`Setting up infrastructure (${t.key})`;case"add_user":return"Adding user message";case"add_thinking":return"Model is thinking…";case"add_toolcall":return`Tool call → ${t.name}`;case"add_toolres":return`Tool result ← ${t.name}`;case"add_assistant":return"Generating response";default:return t.type}}function Pe(t){const e=document.getElementById("ixPanel"),s=document.getElementById("simPanel");e&&(e.style.display="none"),s&&(s.style.display="none"),t==="simulator"?(c.SC=l,c.HK=null,c.HT=null,l.infra={system:0,tools:0,rag:0,memory:0,mcp:0},l.turns=[],l.maxOut=4096,s&&(s.style.display="block"),D(),Xe(()=>{G(c.SC),K(c.SC),W(),z()})):t==="interactive"?(c.SC=l,c.HK=null,c.HT=null,e&&(e.style.display="block"),Ie()):(c.SC=ce.find(n=>n.id===t)||ce[0],c.HK=null,c.HT=null),Ce(),G(c.SC),K(c.SC),W(),z()}function P(t){c.HK=c.HK===t?null:t,c.HK&&(c.HT=null),G(c.SC),K(c.SC),W(),z()}function ee(t){t===null?c.HT=null:(c.HT=c.HT===t?null:t,c.HT!=null&&(c.HK=null)),G(c.SC),K(c.SC),W(),z()}function te(t,e){const s=E[e.key],n=document.getElementById("tip");n.innerHTML='<b style="color:'+(s&&s.color?s.color:"#888")+'">'+(s&&s.name?s.name:e.key)+"</b><br>"+m(e.tokens)+" tokens · "+j(e.tokens,b),n.style.left=t.clientX+14+"px",n.style.top=t.clientY-8+"px",n.classList.add("show")}function se(){document.getElementById("tip").classList.remove("show")}function ot(){let t=null;try{t=localStorage.getItem("ctx-theme")}catch{}const e=window.matchMedia("(prefers-color-scheme: dark)").matches,s=t||(e?"dark":"light");document.documentElement.setAttribute("data-theme",s),n(s),document.getElementById("themeToggle").addEventListener("click",function(){const o=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";document.documentElement.setAttribute("data-theme",o);try{localStorage.setItem("ctx-theme",o)}catch{}n(o)});function n(a){const o=document.getElementById("themeLabel");o&&(o.textContent=a==="dark"?"Light mode":"Dark mode")}}ot();Ce();Pe("fresh");
