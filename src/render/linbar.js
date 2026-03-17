import { TOTAL, state } from '../state.js';
import { T } from '../data/types.js';
import { infraTok, turnTok, usedTok, truncRisk, turnChunks, isGen, fmt, pctStr, uc } from '../helpers.js';
import { selectKey, selectTurn, showTip, hideTip } from '../interactions.js';

export function renderLinbar(sc){
  const used=usedTok(sc), ratio=(used+sc.maxOut)/TOTAL, infra=infraTok(sc);

  document.getElementById('scTitle').textContent=sc.label;
  document.getElementById('tokUsed').textContent=fmt(used);
  document.getElementById('infraLabel').textContent=`infra: ${fmt(infra)} · ${pctStr(infra,TOTAL)}`;
  document.getElementById('utilDot').style.background=uc(ratio);
  document.getElementById('overflow').classList.toggle('show',ratio>.88);

  const fg=document.getElementById('ufg');
  fg.style.width=Math.min(ratio*100,100)+'%'; fg.style.background=uc(ratio);
  const pEl=document.getElementById('upct');
  pEl.textContent=(ratio*100).toFixed(1)+'%'; pEl.style.color=uc(ratio);

  // State note
  const last=sc.turns.length?sc.turns[sc.turns.length-1]:null;
  const gen=last?isGen(last):false;
  const note=document.getElementById('stateNote');
  note.className='state-note '+(gen?'generating':'idle');
  note.innerHTML=!last
    ?`<span class="sn-icon">○</span><span>No turns yet — add infrastructure and messages using the controls on the left.</span>`
    :gen
    ?`<span class="sn-icon">▶</span><span>Model is generating — output is <b>NOT in context yet</b>. ${fmt(sc.maxOut)} token output budget reserved. It enters context on the next API call.</span>`
    :`<span class="sn-icon">✓</span><span>All turns complete. Next message triggers a new API call sending all <b>${fmt(used)} tokens</b> of context.</span>`;

  // Build bar
  const bar=document.getElementById('linbar'); bar.innerHTML='';

  // Whether any turn is active in bar
  const barHasTurn=state.HT!=null&&state.HT>=0;
  if(barHasTurn) bar.classList.add('turn-active'); else bar.classList.remove('turn-active');

  // Infra segments
  let cumPct=0;
  for(const[k,v] of Object.entries(sc.infra)){
    if(!v) continue;
    const seg=document.createElement('div');
    seg.className='lseg'+(state.HK===k?' hl':'');
    const w=(v/TOTAL)*100;
    seg.style.cssText=`width:${w}%;background:${T[k]?.color||'#888'}`;
    const lbl=document.createElement('div'); lbl.className='ll'; lbl.textContent=T[k]?.name||k; seg.appendChild(lbl);
    seg.addEventListener('click',()=>selectKey(k));
    seg.addEventListener('mousemove',e=>showTip(e,{key:k,tokens:v}));
    seg.addEventListener('mouseleave',hideTip);
    bar.appendChild(seg);
    cumPct+=w;
  }

  // Infra divider
  const divider=document.createElement('div');
  divider.className='linbar-divider';
  divider.style.left=cumPct+'%';
  bar.appendChild(divider);

  // Track turn boundaries to draw bracket
  let convStart=cumPct;
  let bracketStart=convStart, bracketEnd=convStart;

  // Conv segments
  sc.turns.forEach((turn,ti)=>{
    const isLast=ti===sc.turns.length-1;
    const chunks=turnChunks(turn,isLast);
    const isSelected=state.HT===ti;
    let turnStartPct=cumPct;

    chunks.forEach(c=>{
      if(c.gen) return;
      const k=c.key, v=c.tokens;
      const w=(v/TOTAL)*100;
      const seg=document.createElement('div');
      seg.className='lseg'+(state.HK===k?' hl':'');
      if(barHasTurn&&isSelected) seg.classList.add('in-turn');
      seg.style.cssText=`width:${w}%;background:${T[k]?.color||'#888'}`;
      const lbl=document.createElement('div'); lbl.className='ll'; lbl.textContent=T[k]?.name||k; seg.appendChild(lbl);
      seg.addEventListener('click',e=>{e.stopPropagation();selectKey(k)});
      seg.addEventListener('mousemove',e=>showTip(e,{key:k,tokens:v}));
      seg.addEventListener('mouseleave',hideTip);
      bar.appendChild(seg);
      cumPct+=w;
    });

    if(isSelected){ bracketStart=turnStartPct; bracketEnd=cumPct; }
  });

  // Output budget
  const out=document.createElement('div');
  out.className='lseg-out'; out.style.cssText=`width:${(sc.maxOut/TOTAL)*100}%;flex-shrink:0`;
  const ol=document.createElement('div'); ol.className='ll2';
  if(sc.maxOut/TOTAL>.03) ol.textContent='output budget';
  out.appendChild(ol);
  out.addEventListener('click',()=>selectKey('output_budget'));
  out.addEventListener('mousemove',e=>showTip(e,{key:'output_budget',tokens:sc.maxOut}));
  out.addEventListener('mouseleave',hideTip);
  bar.appendChild(out);

  // Free
  const free=TOTAL-used-sc.maxOut;
  if(free>0){
    const fs=document.createElement('div'); fs.className='lseg-free';
    const sp=document.createElement('span'); sp.textContent=fmt(free)+' free'; fs.appendChild(sp);
    bar.appendChild(fs);
  }

  // Turn selection bracket
  if(state.HT!=null&&state.HT>=0){
    const bkt=document.createElement('div'); bkt.className='turn-bracket';
    bkt.style.left=bracketStart+'%'; bkt.style.width=(bracketEnd-bracketStart)+'%';
    bar.appendChild(bkt);
  }

  // Ticks
  const tr=document.getElementById('lticks'); tr.innerHTML='';
  [0,25,50,75,100].forEach(p=>{
    const t=document.createElement('div'); t.className='ltick'; t.style.left=p+'%';
    t.textContent=p===0?'0':p===100?fmt(TOTAL):fmt(TOTAL*p/100); tr.appendChild(t);
  });
}
