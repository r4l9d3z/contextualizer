import { fmt, pctStr, turnTok, isGen } from '../helpers.js';

export const PRESETS = {small:500, medium:2000, large:8000, xl:20000};
export const PRESET_LABELS = [
  {k:'small', v:500,   label:'S'},
  {k:'medium',v:2000,  label:'M'},
  {k:'large', v:8000,  label:'L'},
  {k:'xl',    v:20000, label:'XL'},
];
export const INFRA_COMPONENTS = [
  {key:'system', label:'System Prompt',    color:'#e05555'},
  {key:'tools',  label:'Tool Definitions', color:'#c8b530'},
  {key:'rag',    label:'RAG Chunks',       color:'#48a870'},
  {key:'memory', label:'Retrieved Memory', color:'#32c0a0'},
  {key:'mcp',    label:'MCP Server Data',  color:'#3898dc'},
];

export const IX = {
  id:'interactive', label:'Interactive Build', sub:'Build your own context window',
  infra:{system:0, tools:0, rag:0, memory:0, mcp:0},
  infraPreset:{system:null, tools:null, rag:null, memory:null, mcp:null},
  maxOut:4000,
  turns:[],
  get infraDesc(){
    return {
      title:'Your Infrastructure',
      desc:'Infrastructure you enabled. Each component is injected at the start of every API call before any conversation turns.',
      example:this._buildInfraExample(),
      note:`Total infrastructure: <b>${fmt(Object.values(this.infra).reduce((a,v)=>a+v,0))} tokens</b> — paid on every API call.`
    };
  },
  _buildInfraExample(){
    const ex=[];
    if(this.infra.system)  ex.push({type:'system',      text:`System prompt — ${fmt(this.infra.system)} tokens`});
    if(this.infra.tools)   ex.push({type:'tool-result', text:`Tool definitions — ${fmt(this.infra.tools)} tokens`});
    if(this.infra.rag)     ex.push({type:'tool-result', text:`RAG chunks — ${fmt(this.infra.rag)} tokens`});
    if(this.infra.memory)  ex.push({type:'tool-result', text:`Retrieved memory — ${fmt(this.infra.memory)} tokens`});
    if(this.infra.mcp)     ex.push({type:'tool-result', text:`MCP server data — ${fmt(this.infra.mcp)} tokens`});
    if(!ex.length)         ex.push({type:'system', text:'No infrastructure components enabled yet.'});
    return ex;
  }
};

export function makeTurnMeta(idx, turn) {
  const segs = [];
  if(turn.files)    segs.push(`file attachment (${fmt(turn.files)} tok)`);
  if(turn.user)     segs.push(`user message (${fmt(turn.user)} tok)`);
  if(turn.thinking) segs.push(`thinking block (${fmt(turn.thinking)} tok)`);
  if(turn.toolcall) segs.push(`tool call (${fmt(turn.toolcall)} tok)`);
  if(turn.toolres)  segs.push(`tool result (${fmt(turn.toolres)} tok)`);
  const complete = !isGen(turn);
  if(complete)      segs.push(`assistant response (${fmt(turn.assistant)} tok)`);
  const total = turnTok(turn);
  const ex = [];
  if(turn.files)    ex.push({type:'tool-result', text:`[Attached file — ${fmt(turn.files)} tokens]`});
  if(turn.user)     ex.push({type:'user',        text:`User message — ${fmt(turn.user)} tokens (~${turn.user*4} characters)`});
  if(turn.thinking) ex.push({type:'thinking',    text:`[Extended thinking — ${fmt(turn.thinking)} tokens of internal reasoning]`});
  if(turn.toolcall) ex.push({type:'tool-call',   text:`[Tool call — ${fmt(turn.toolcall)} tokens]`});
  if(turn.toolres)  ex.push({type:'tool-result', text:`[Tool result — ${fmt(turn.toolres)} tokens]`});
  if(complete)      ex.push({type:'assistant',   text:`[Assistant response — ${fmt(turn.assistant)} tokens]`});
  else              ex.push({type:'generating',  text:'← Model generating response (not yet in context)'});
  turn.title    = `Turn ${idx+1} — ${complete ? 'Completed' : 'Generating'}`;
  turn.desc     = `${complete ? 'Completed' : 'Active'} turn with: ${segs.join(', ')}.`;
  turn.fullDesc = `Turn ${idx+1} you built interactively. Contains: ${segs.join('; ')}. Total: ${fmt(total)} tokens. ${complete ? 'This turn is part of conversation history and will be re-sent on every future API call.' : 'The response is still being generated — not in context yet.'}`;
  turn.example  = ex;
  turn.note     = `This turn contributes <b>${fmt(total)} tokens</b> — <b>${pctStr(total, 128000)}</b> of the 128k window. ${complete ? 'Re-transmitted on every future API call.' : ''}`;
}
