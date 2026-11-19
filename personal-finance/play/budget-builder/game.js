/* Budget Builder: Personal Finance, Module 2 (Income and Budgeting). The module's applied task, "Build Your First Budget".
   Steps follow the course document: 1 take-home income, 2 split with 50/30/20 as a guide (savings moved first),
   3 compare real spending to the guide, 4 one specific action for next month, then the document's three self-check
   questions and a budget card the learner keeps on the device. In lesson mode the module's quiz questions come next and
   the pass needs both: 2 of 3 right and the task attempted. Words and coin values are in content.js. */
(function(){
'use strict';
const CSS = `
.g-bud .steps{display:flex;gap:6px;margin:0 0 18px;flex-wrap:wrap}
.g-bud .steps span{font-size:.76rem;font-weight:650;color:var(--ink-3);padding:5px 10px;border-radius:999px;border:1px solid var(--line)}
.g-bud .steps span.on{color:var(--paper);background:var(--ink);border-color:var(--ink)}
.g-bud .steps span.done{color:var(--up);border-color:color-mix(in srgb,var(--up) 45%,transparent)}
.g-bud .stg{animation:budIn .38s cubic-bezier(.2,.9,.2,1)}
@keyframes budIn{from{opacity:0;transform:translateY(12px)}}
.g-bud .hh{font-family:var(--display);font-weight:700;font-size:clamp(1.25rem,4.2vw,1.55rem);letter-spacing:-.018em;line-height:1.15;margin:0 0 6px;text-wrap:balance}
.g-bud .pp{color:var(--ink-2);margin:0 0 16px;max-width:62ch}
.g-bud .nav{display:flex;gap:10px;justify-content:space-between;align-items:center;margin-top:20px;flex-wrap:wrap}
.g-bud .banner{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;padding:10px 14px;border:1px dashed var(--line-2);border-radius:12px;margin:0 0 16px;font-size:.9rem;color:var(--ink-2)}
.g-bud .banner b{color:var(--ink)}
.g-bud .payday{position:relative;height:230px;border-radius:14px;overflow:hidden;background:var(--paper-hi);border:1px solid var(--line-2);display:flex;align-items:flex-end;justify-content:center;margin:4px 0 16px}
.g-bud .payday::after{content:"";position:absolute;inset:5px;border:1px solid var(--line);border-radius:10px;pointer-events:none}
.g-bud .env{position:relative;z-index:2;width:170px;margin-bottom:6px;text-align:center}
.g-bud .env img{width:140px;height:140px;margin:0 auto;display:block;transition:transform .25s}
.g-bud .env.pulse img{animation:budPulse .45s}
@keyframes budPulse{40%{transform:scale(1.1)}}
.g-bud .env b{display:block;font-family:var(--money);font-weight:400;font-size:2rem;line-height:1;color:var(--gold);text-shadow:var(--glow-gold);margin:-6px 0 4px}
.g-bud .env small{color:var(--ink-3);font-size:.8rem}
.g-bud .bill{position:absolute;left:0;top:0;width:74px;height:34px;border-radius:4px;background:repeating-linear-gradient(115deg,transparent 0 3px,color-mix(in srgb,var(--up) 22%,transparent) 3px 4px),linear-gradient(180deg,color-mix(in srgb,var(--up) 22%,var(--paper-hi)),color-mix(in srgb,var(--up) 38%,var(--paper-hi)));border:1px solid color-mix(in srgb,var(--up) 60%,transparent);box-shadow:inset 0 0 0 3px var(--paper-hi),inset 0 0 0 4px color-mix(in srgb,var(--up) 45%,transparent),0 4px 10px rgba(0,0,0,.18);display:grid;place-items:center;font-family:var(--money);color:var(--up);font-size:15px;z-index:1;will-change:transform}
.g-bud .presets{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 0}
.g-bud .incomerow{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:end}
.g-bud .incomerow .sz-input{font-family:var(--money);font-size:1.5rem;padding:9px 13px}
.g-bud .remain{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:12px 14px;border-radius:12px;border:1.5px solid var(--line-2);background:var(--paper-hi);margin:0 0 14px;transition:border-color .2s,background .2s;position:sticky;top:0;z-index:3}
.g-bud .remain b{font-family:var(--money);font-weight:400;font-size:1.45rem;line-height:1}
.g-bud .remain span{color:var(--ink-2);font-size:.92rem}
.g-bud .remain.over{border-color:var(--down);background:color-mix(in srgb,var(--down) 7%,var(--paper-hi))}
.g-bud .remain.over b{color:var(--down)}
.g-bud .remain.zero{border-color:var(--up);background:color-mix(in srgb,var(--up) 8%,var(--paper-hi))}
.g-bud .remain.zero b{color:var(--up);text-shadow:var(--glow-up)}
.g-bud .pots{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.g-bud .pot{display:flex;flex-direction:column;align-items:center;text-align:center;gap:4px;min-width:0}
.g-bud .pot h4{margin:0;font-family:var(--display);font-weight:700;font-size:1rem;letter-spacing:-.01em;line-height:1.1;min-height:2.2em;display:flex;align-items:flex-end;justify-content:center}
.g-bud .pot svg{width:100%;max-width:150px;height:auto;touch-action:none;cursor:ns-resize;overflow:visible}
.g-bud .pot svg:focus-visible{outline:2px solid var(--up);outline-offset:4px;border-radius:12px}
.g-bud .pot .amt{font-family:var(--money);font-size:1.3rem;line-height:1}
.g-bud .pot .pct{font-size:.8rem;color:var(--ink-2)}
.g-bud .pot .delta{font-size:.74rem;font-weight:650;padding:2px 7px;border-radius:999px;border:1px solid var(--line-2);color:var(--ink-2);white-space:nowrap}
.g-bud .pot .delta.hi{border-color:color-mix(in srgb,var(--pf) 70%,transparent);color:var(--gold)}
.g-bud .pot .delta.lo{border-color:color-mix(in srgb,var(--down) 60%,transparent);color:var(--down)}
.g-bud .pot .delta.ok{border-color:color-mix(in srgb,var(--up) 60%,transparent);color:var(--up)}
.g-bud .pm{display:flex;gap:6px;align-items:center;justify-content:center;margin-top:2px}
.g-bud .pm button{width:36px;height:36px;border-radius:50%;border:1.5px solid var(--line-2);font-size:1.25rem;line-height:1;background:var(--paper-hi);font-weight:600}
.g-bud .pm button:hover{border-color:var(--ink)}
.g-bud .pm button:active{transform:scale(.92)}
.g-bud .pot .sz-range{height:30px}
.g-bud .quick{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0 0}
.g-bud .items{display:grid;gap:12px;margin-top:16px}
.g-bud .items h5{margin:0 0 6px;font-size:.85rem;color:var(--ink-2);font-weight:600}
.g-bud .items .sz-chip{padding:7px 12px;font-size:.86rem}
.g-bud .cmp{display:grid;gap:14px}
.g-bud .cmprow{display:grid;grid-template-columns:96px 1fr;gap:8px 14px;align-items:center}
.g-bud .cmprow .nm{font-weight:650}
.g-bud .cmprow .bars{display:grid;gap:4px}
.g-bud .cmprow .bar{position:relative;height:16px;border-radius:4px;background:var(--paper-lo);overflow:hidden}
.g-bud .cmprow .bar i{position:absolute;inset:0 auto 0 0;border-radius:4px;transition:width .9s cubic-bezier(.2,.9,.2,1)}
.g-bud .cmprow .bar.guide i{background:transparent;border:1.5px dashed var(--ink-3)}
.g-bud .cmprow .bar small{position:absolute;right:6px;top:0;line-height:16px;font-size:.72rem;color:var(--ink-2);font-weight:650}
.g-bud .cmprow .verdict{grid-column:1/-1;font-size:.9rem;color:var(--ink-2);margin:0}
.g-bud .insight{font-family:var(--display);font-weight:600;font-size:1.05rem;line-height:1.35;margin:18px 0 0;padding:14px 16px;border-radius:12px;background:var(--paper-hi);border:1px solid var(--line-2)}
.g-bud .adjust{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
.g-bud .tmpl{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 0}
.g-bud .tmpl button{font-size:.85rem;padding:7px 12px;border-radius:999px;border:1px dashed var(--line-2);color:var(--ink-2);text-align:left}
.g-bud .tmpl button:hover{border-color:var(--ink);color:var(--ink)}
.g-bud textarea.sz-input{min-height:84px;resize:vertical;line-height:1.4}
.g-bud .split3{display:flex;height:12px;border-radius:6px;overflow:hidden;margin-top:6px;border:1px solid var(--line)}
.g-bud .split3 i{display:block;height:100%}
.g-bud .check{display:grid;gap:10px;margin-top:6px}
.g-bud .q{display:grid;grid-template-columns:1fr auto;gap:10px 14px;align-items:center;padding:13px 14px;border:1.5px solid var(--line-2);border-radius:12px;background:var(--paper-hi);transition:border-color .2s,background .2s}
.g-bud .q p{margin:0;font-size:.98rem;line-height:1.35}
.g-bud .q .yn{display:flex;gap:6px}
.g-bud .q .yn button{min-height:38px;padding:0 14px;border-radius:999px;border:1.5px solid var(--line-2);font-weight:650;font-size:.9rem;background:var(--paper)}
.g-bud .q .yn button:hover:not(:disabled){border-color:var(--ink)}
.g-bud .q .yn button.on.y{background:var(--up);border-color:var(--up);color:var(--paper)}
.g-bud .q .yn button.on.n{background:var(--ink-2);border-color:var(--ink-2);color:var(--paper)}
.g-bud .q.yes{border-color:var(--up);background:color-mix(in srgb,var(--up) 7%,var(--paper-hi))}
.g-bud .q .tip{grid-column:1/-1;font-size:.88rem;color:var(--ink-2);display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.g-bud .q .tip button{font-weight:650;color:var(--ink);text-decoration:underline;text-underline-offset:3px}
@media(max-width:520px){.g-bud .q{grid-template-columns:1fr}}
.g-bud .cert{position:relative;overflow:hidden;border-radius:16px;background:var(--paper-hi);border:1px solid var(--line-2);padding:24px 22px 20px;box-shadow:var(--shadow);isolation:isolate}
.g-bud .cert::before{content:"";position:absolute;inset:6px;border:1px solid var(--line-2);border-radius:11px;pointer-events:none;z-index:2}
.g-bud .cert::after{content:"";position:absolute;inset:10px;border:1px solid var(--line);border-radius:8px;pointer-events:none;z-index:2}
.g-bud .cert canvas.ros{position:absolute;right:-110px;top:-110px;width:320px;height:320px;opacity:.6;pointer-events:none;z-index:0}
.g-bud .cert canvas.ros2{position:absolute;left:-70px;bottom:-70px;width:180px;height:180px;opacity:.45;pointer-events:none;z-index:0}
.g-bud .cert .wm{position:absolute;right:26px;bottom:20px;height:96px;opacity:.09;filter:grayscale(1) contrast(1.3);pointer-events:none;z-index:0}
.g-bud .cert > .in{position:relative;z-index:1}
.g-bud .cert .top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px}
.g-bud .cert .issuer{font-size:.72rem;letter-spacing:.06em;color:var(--ink-3);font-weight:650}
.g-bud .cert .ttl{font-family:var(--display);font-weight:800;font-size:clamp(1.5rem,5.5vw,2rem);letter-spacing:-.025em;line-height:1;margin:4px 0 0}
.g-bud .cert .sub{font-size:.8rem;color:var(--ink-2);margin-top:5px}
.g-bud .cert .ser{font-family:var(--money);color:var(--down);display:flex;align-items:flex-end;gap:1px;line-height:1;white-space:nowrap}
.g-bud .cert .ser i{font-style:normal}
.g-bud .cert .big{font-family:var(--money);font-size:clamp(2rem,9vw,2.9rem);line-height:1;color:var(--gold);text-shadow:var(--glow-gold)}
.g-bud .cert .bigl{font-size:.78rem;color:var(--ink-3);margin-top:2px}
.g-bud .cert dl{display:grid;grid-template-columns:auto 1fr;gap:6px 14px;margin:14px 0 0;font-size:.95rem}
.g-bud .cert dt{color:var(--ink-3);font-size:.82rem;padding-top:2px}
.g-bud .cert dd{margin:0;font-weight:600;min-width:0;overflow-wrap:anywhere}
.g-bud .cert dt.w{grid-column:1/-1;margin-top:4px}
.g-bud .cert dd.w{grid-column:1/-1}
@media (min-width:600px){.g-bud .cert dt.w{grid-column:auto;margin-top:0}.g-bud .cert dd.w{grid-column:auto}}
.g-bud .cert dd.soft{font-weight:500;color:var(--ink-2);font-size:.92rem;line-height:1.4}
.g-bud .cert dd .m{font-family:var(--money);font-weight:400;font-size:1.05rem}
.g-bud .cert .foot{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:16px;padding-top:10px;border-top:1px dashed var(--line-2);font-size:.78rem;color:var(--ink-3)}
.g-bud .cert.printing > .in{animation:budPrint 1.15s cubic-bezier(.4,0,.2,1) both}
.g-bud .cert.printing .head{position:absolute;left:0;right:0;height:3px;top:0;z-index:3;background:linear-gradient(90deg,transparent,var(--gold),transparent);box-shadow:0 0 14px var(--gold);animation:budHead 1.15s cubic-bezier(.4,0,.2,1) both}
@keyframes budPrint{from{clip-path:inset(0 0 100% 0)}to{clip-path:inset(0 0 0 0)}}
@keyframes budHead{from{top:0;opacity:1}90%{opacity:1}to{top:100%;opacity:0}}
.g-bud .done{display:grid;gap:10px}
.g-bud .done .line{display:flex;align-items:center;gap:10px;font-weight:650;color:var(--up)}
@media (max-width:420px){.g-bud .pot h4{font-size:.88rem}.g-bud .pot .amt{font-size:1.1rem}.g-bud .pm button{width:32px;height:32px}.g-bud .cmprow{grid-template-columns:76px 1fr}}
`;
function injectCSS(){ if(document.getElementById('css-g-bud')) return; const s=document.createElement('style'); s.id='css-g-bud'; s.textContent=CSS; document.head.append(s); }
const STORE='stonkzz-budget-card';
const store={ get(){ try{ return JSON.parse(localStorage.getItem(STORE)||'null'); }catch(e){ return null; } }, set(v){ try{ localStorage.setItem(STORE, JSON.stringify(v)); }catch(e){} } };
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const month=()=>{ try{ return new Date().toLocaleDateString('en-IN',{month:'long',year:'numeric'}); }catch(e){ return ''; } };
const serialHTML=s=>String(s||'').split('').map((ch,i)=>ch===' '?'<i style="width:5px"></i>':`<i style="font-size:${10+i*1.05}px">${ch}</i>`).join('');
const COLORS={ savings:'var(--up)', needs:'var(--sm)', wants:'var(--pf)' };
const ORDER=['savings','needs','wants'];

function potSVG(key, guidePct, C, fill){
  const NS='http://www.w3.org/2000/svg';
  const id='bud'+key+(Math.random()*1e6|0);
  const body='M47 22 L47 30 C 22 38, 9 63, 11 93 C 13 125, 35 149, 60 151 C 85 149, 107 125, 109 93 C 111 63, 98 38, 73 30 L73 22 Z';
  const svg=document.createElementNS(NS,'svg');
  svg.setAttribute('viewBox','0 0 120 158'); svg.setAttribute('role','slider'); svg.setAttribute('tabindex','0');
  svg.setAttribute('aria-label', fill(C.potAria,{name:C.pots[key].name}));
  svg.innerHTML = `
    <defs>
      <clipPath id="${id}c"><path d="${body}"/></clipPath>
      <pattern id="${id}h" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><line x1="0" y1="0" x2="0" y2="5" stroke="var(--paper-hi)" stroke-opacity=".38" stroke-width="1.2"/></pattern>
    </defs>
    <path d="${body}" fill="var(--paper-lo)"/>
    <g clip-path="url(#${id}c)">
      <g class="liq" style="transform:translateY(130px)">
        <path class="wave" fill="${COLORS[key]}" fill-opacity=".9" d=""/>
        <rect x="0" y="6" width="120" height="160" fill="${COLORS[key]}" fill-opacity=".9"/>
        <rect x="0" y="0" width="120" height="166" fill="url(#${id}h)"/>
      </g>
    </g>
    <path d="M14 74 L22 66 L30 74 L38 66 L46 74 L54 66 L62 74 L70 66 L78 74 L86 66 L94 74 L102 66 L108 72" fill="none" stroke="var(--ink-3)" stroke-width="1.1" opacity=".55"/>
    <path d="M12 104 H108" stroke="var(--ink-3)" stroke-width="1" opacity=".4"/>
    <g class="ghost"><line x1="4" x2="116" y1="0" y2="0" stroke="var(--gold)" stroke-width="1.6" stroke-dasharray="4 3"/><text x="116" y="-4" text-anchor="end" font-size="9" font-weight="700" fill="var(--gold)" font-family="Anek Latin, sans-serif">${fill(C.guideTag,{n:guidePct})}</text></g>
    <path d="${body}" fill="none" stroke="var(--ink)" stroke-width="2.2"/>
    <rect x="40" y="13" width="40" height="10" rx="3" fill="var(--paper-hi)" stroke="var(--ink)" stroke-width="2.2"/>
  `;
  const TOP=26, BOT=151, H=BOT-TOP;
  svg.querySelector('.ghost').setAttribute('transform',`translate(0 ${BOT-H*guidePct/100})`);
  const liq=svg.querySelector('.liq'), wave=svg.querySelector('.wave');
  let level=0, shown=0, phase=Math.random()*6;
  svg.setLevel = l => { level=Math.max(0,Math.min(1,l)); };
  svg.tick = dt => {
    shown += (level-shown)*Math.min(1, dt*10); phase += dt*2.4;
    liq.style.transform = `translateY(${BOT - H*shown}px)`;
    let d='M0 6'; for(let x=0;x<=120;x+=6){ d+=` L${x} ${(Math.sin(x/14+phase)*1.6 + (shown>0.002?0:4)).toFixed(2)}`; } d+=' L120 8 L0 8 Z';
    wave.setAttribute('d', d);
  };
  svg.levelFromY = clientY => { const r=svg.getBoundingClientRect(); const yv=(clientY-r.top)/r.height*158; return (BOT-yv)/H; };
  return svg;
}

let live=null;
SZ.on('theme', ()=>{ if(live) live.redraw(); });

SZ.register({
  id:'budget-builder', course:'pf', module:2, title:'Budget Builder', kind:'Builder', badge:'budgeteer', version:'1.1.0',
  mount(root, api){
    injectCSS();
    const {h}=api; const inr=api.fmt.inr; const lesson=api.mode==='lesson';
    const G=api.data, C=G.copy, SET=G.settings, GUIDE=SET.guide, COIN=SET.coins;
    const fill=(s,o)=>String(s).replace(/\{(\w+)\}/g,(m,k)=>o[k]!=null?o[k]:m);
    const saved=store.get();
    const S={ income:saved?.income||SET.startIncome, amt:{ savings:0, needs:0, wants:0 }, items:{ needs:new Set(saved?.needsItems||[]), wants:new Set(saved?.wantsItems||[]) }, adjust:saved?.adjust||null, action:'', moveFirst:0, paid:false, balancedOnce:false, savingsOnce:false, adjustPaid:false, planPaid:false, check:[null,null,null], issued:false, stage:-1, serial:saved?.serial||('SZ '+String(100000+Math.floor(Math.random()*899999))) };
    const el=h('div',{class:'g-bud'}); root.append(el);
    const stepFor=inc=>inc<=60000?500: inc<=200000?1000: 5000;
    const pct=k=>S.income ? S.amt[k]/S.income*100 : 0;
    const total=()=>S.amt.savings+S.amt.needs+S.amt.wants;
    const remaining=()=>S.income-total();
    const toTop=()=>{ const st=document.querySelector('.sz-stage'); if(st) st.scrollTo({top:0,behavior:reduced()?'auto':'smooth'}); };
    let steps=null, stageBox=null, loopId=0;

    function showStart(){
      el.innerHTML='';
      api.intro(el,{ eyebrow:C.lessonEyebrow, title:C.startTitle, text:C.startLede, start:C.start,
        steps:[{ title:C.stepBuild, text:C.stepBuildText }], onStart:startBuilder });
    }
    function startBuilder(){
      el.innerHTML='';
      steps=h('div',{class:'steps',role:'list','aria-label':'Steps'}, C.steps.map((l,i)=>h('span',{role:'listitem'}, (i+1)+'  '+l)));
      stageBox=h('div'); el.append(steps, stageBox); go(0);
    }
    function go(i){
      S.stage=i; [...steps.children].forEach((s,j)=>{ s.classList.toggle('on',j===i); s.classList.toggle('done',j<i); if(j===i) s.setAttribute('aria-current','step'); else s.removeAttribute('aria-current'); });
      stageBox.innerHTML=''; const st=h('div',{class:'stg'}); stageBox.append(st); [stIncome,stSplit,stCompare,stPlan,stCard][i](st); toTop();
      api.progress(i, 5, { part:'task', step:C.steps[i] });
    }

    /* ---------- 1 income ---------- */
    function stIncome(st){
      if(saved) st.append(h('div',{class:'banner'}, h('span',{}, h('b',{},C.lastCard), fill(C.lastCardText,{when:saved.issued||C.lastCardEarlier})), h('button',{class:'sz-btn ghost',type:'button',onclick:()=>{ S.income=saved.income; S.amt={savings:saved.savings,needs:saved.needs,wants:saved.wants}; S.paid=true; go(1); }},C.jumpToSplit)));
      st.append(h('h3',{class:'hh'},C.incomeTitle), h('p',{class:'pp'},C.incomeText));
      const input=h('input',{class:'sz-input',id:'bud-income',type:'number',inputmode:'numeric',min:'1000',step:'500',value:String(S.income),'aria-label':C.incomeAria});
      const big=h('b',{}, inr(S.income));
      const env=h('div',{class:'env'}, h('img',{class:'ink-art',src:api.asset('cards/envelope.webp'),alt:C.envelopeAlt}), big, h('small',{},C.takeHome));
      const stage=h('div',{class:'payday'}, env);
      input.addEventListener('input',()=>{ const v=Math.round(+input.value||0); if(v>=0){ S.income=Math.min(v,10000000); big.textContent=inr(S.income); } });
      const presets=h('div',{class:'presets'}, SET.presets.map(v=>h('button',{class:'sz-chip',type:'button',onclick:()=>{ input.value=v; S.income=v; big.textContent=inr(v); api.sfx('click'); }}, inr(v))));
      const pay=h('button',{class:'sz-btn gold big',type:'button',id:'bud-pay'},C.payday);
      pay.onclick=()=>{
        if(S.income<1000){ api.shake(input); api.toast(C.incomeTooLow); return; }
        pay.disabled=true; payday(stage, env, big, ()=>{ if(!S.paid){ S.paid=true; api.earn(COIN.payday, env); } api.later(()=>go(1), 650); });
      };
      st.append(stage, h('div',{class:'incomerow'}, h('div',{class:'sz-field'}, h('label',{for:'bud-income'},C.incomeLabel), input), pay), presets);
    }
    function payday(stage, env, big, done){
      api.sfx('cash');
      const W=stage.clientWidth, H=stage.clientHeight; const n=reduced()?0:16; const target={x:W/2-37, y:H-120};
      for(let i=0;i<n;i++){ const b=h('div',{class:'bill'},'₹'); stage.append(b); const sx=Math.random()*(W-74), r0=(Math.random()-.5)*80, r1=(Math.random()-.5)*20; const d=900+Math.random()*500;
        b.animate([{transform:`translate(${sx}px,-50px) rotate(${r0}deg)`,opacity:1},{transform:`translate(${(sx+target.x)/2+(Math.random()-.5)*60}px,${H*.4}px) rotate(${r0/2}deg)`,opacity:1,offset:.55},{transform:`translate(${target.x}px,${target.y}px) rotate(${r1}deg) scale(.6)`,opacity:0}],{duration:d,delay:i*70,easing:'cubic-bezier(.45,.05,.6,1)',fill:'both'}).onfinish=()=>{ b.remove(); api.sfx('tick'); };
      }
      api.later(()=>{ env.classList.remove('pulse'); void env.offsetWidth; env.classList.add('pulse'); api.countUp(big, 0, S.income, 700, inr); api.sfx('coin'); api.later(done, 700); }, n? 900+n*70 : 100);
    }

    /* ---------- 2 split ---------- */
    let potEls={};
    function stSplit(st){
      st.append(h('h3',{class:'hh'},C.splitTitle), h('p',{class:'pp'},C.splitText));
      const remain=h('div',{class:'remain',role:'status','aria-live':'polite'}, h('div',{}, h('span',{class:'lab'},C.stillNeedsJob), h('br'), h('b',{},inr(S.income))), h('span',{class:'tot'},''));
      st.append(remain);
      const pots=h('div',{class:'pots'}); potEls={};
      ORDER.forEach(key=>{
        const P=C.pots[key];
        const svg=potSVG(key, GUIDE[key], C, fill);
        const amt=h('div',{class:'amt'},'₹0'), pc=h('div',{class:'pct'},'0%'), dl=h('div',{class:'delta'},'');
        const range=h('input',{class:'sz-range',type:'range',min:'0',max:String(S.income),step:String(stepFor(S.income)),value:String(S.amt[key]),'aria-label':fill(C.amountAria,{name:P.name})});
        const minus=h('button',{type:'button','aria-label':fill(C.less,{name:P.short})},'−'), plus=h('button',{type:'button','aria-label':fill(C.more,{name:P.short})},'+');
        const col=h('div',{class:'pot'}, h('h4',{},P.name), svg, amt, pc, dl, h('div',{class:'pm'},minus,plus), range);
        pots.append(col); potEls[key]={svg,amt,pc,dl,range,col};
        const step=()=>stepFor(S.income);
        minus.onclick=()=>{ setAmt(key, S.amt[key]-step()); api.sfx('tock'); };
        plus.onclick=()=>{ setAmt(key, S.amt[key]+step()); api.sfx('tick'); };
        range.addEventListener('input',()=>setAmt(key,+range.value));
        let drag=false;
        svg.addEventListener('pointerdown',e=>{ drag=true; try{ svg.setPointerCapture(e.pointerId); }catch(err){} setAmt(key, Math.round(svg.levelFromY(e.clientY)*S.income/step())*step()); api.sfx('pop'); });
        svg.addEventListener('pointermove',e=>{ if(!drag) return; setAmt(key, Math.round(svg.levelFromY(e.clientY)*S.income/step())*step()); });
        const up=()=>{ drag=false; }; svg.addEventListener('pointerup',up); svg.addEventListener('pointercancel',up);
        svg.addEventListener('keydown',e=>{ if(e.key==='ArrowUp'||e.key==='ArrowRight'){ e.preventDefault(); setAmt(key,S.amt[key]+step()); api.sfx('tick'); } if(e.key==='ArrowDown'||e.key==='ArrowLeft'){ e.preventDefault(); setAmt(key,S.amt[key]-step()); api.sfx('tock'); } });
      });
      st.append(pots);
      st.append(h('div',{class:'quick'},
        h('button',{class:'sz-btn ghost',type:'button',onclick:()=>{ useGuide(); api.sfx('whoosh'); }},C.fromGuide),
        h('button',{class:'sz-btn ghost',type:'button',onclick:()=>{ ORDER.forEach(k=>setAmt(k,0)); api.sfx('fall'); }},C.emptyPots)));
      const items=h('div',{class:'items'});
      ['needs','wants'].forEach(k=>{ items.append(h('div',{}, h('h5',{}, k==='needs'?C.itemsNeeds:C.itemsWants), h('div',{class:'sz-row',style:'gap:6px'}, C.items[k].map(it=>{ const b=h('button',{class:'sz-chip'+(S.items[k].has(it)?' on':''),type:'button','aria-pressed':String(S.items[k].has(it))},it); b.onclick=()=>{ if(S.items[k].has(it)) S.items[k].delete(it); else S.items[k].add(it); b.classList.toggle('on'); b.setAttribute('aria-pressed',String(S.items[k].has(it))); api.sfx('click'); }; return b; })))); });
      st.append(items);
      const next=h('button',{class:'sz-btn',type:'button',id:'bud-next2'},C.toCompare);
      next.onclick=()=>{ const r=remaining(); if(r!==0||total()===0){ api.shake(remain); api.sfx('wrong'); api.toast(r>=0? fill(C.unassigned,{left:inr(r||S.income)}) : fill(C.overplanned,{over:inr(-r)})); return; } go(2); };
      st.append(h('div',{class:'nav'}, h('button',{class:'sz-btn ghost',type:'button',onclick:()=>go(0)},C.back), next));
      function render(){
        const r=remaining();
        remain.classList.toggle('over',r<0); remain.classList.toggle('zero',r===0);
        remain.querySelector('.lab').textContent = r>0?C.stillNeedsJob: r<0?C.moreThanEarn:C.everyRupee;
        remain.querySelector('b').textContent = r===0? inr(S.income) : inr(Math.abs(r));
        remain.querySelector('.tot').textContent = r===0 ? fill(C.balancedNote,{n:Math.round(pct('savings'))}) : fill(C.plannedNote,{income:inr(S.income),planned:inr(total())});
        ORDER.forEach(key=>{ const e=potEls[key]; if(!e) return; const v=S.amt[key], pc=pct(key); e.amt.textContent=inr(v); e.pc.textContent=fill(C.ofIncome,{n:Math.round(pc)}); e.range.value=v; e.range.style.setProperty('--p',(S.income? v/S.income*100:0)+'%'); e.svg.setLevel(S.income? v/S.income : 0); e.svg.setAttribute('aria-valuenow',String(v)); e.svg.setAttribute('aria-valuetext',inr(v)+', '+Math.round(pc)+'%');
          const d=Math.round(pc-GUIDE[key]); let cls='', txt='';
          if(v===0){ txt=C.empty; } else if(Math.abs(d)<=2){ cls='ok'; txt=C.onGuide; } else if(key==='savings'){ cls=d<0?'lo':'ok'; txt=fill(C.vsGuide,{d:(d>0?'+':'')+d}); } else { cls=d>0?'hi':''; txt=fill(C.vsGuide,{d:(d>0?'+':'')+d}); }
          e.dl.className='delta '+cls; e.dl.textContent=txt; });
      }
      S.render=render; render();
      const my=++loopId; let last=performance.now();
      api.raf(t=>{ const dt=Math.min(.05,(t-last)/1000); last=t; ORDER.forEach(k=>potEls[k]&&potEls[k].svg.tick(dt)); return S.stage===1 && my===loopId; });
    }
    function useGuide(){ const s=stepFor(S.income); const sv=Math.round(S.income*GUIDE.savings/100/s)*s, nd=Math.round(S.income*GUIDE.needs/100/s)*s; setAmt('savings',sv); setAmt('needs',nd); setAmt('wants',S.income-sv-nd); }
    function setAmt(k, v){
      v=Math.max(0, Math.min(S.income, Math.round(v)));
      if(v===S.amt[k]) return;
      S.amt[k]=v; if(S.render && S.stage===1) S.render();
      const r=remaining();
      if(r===0 && total()>0 && !S.balancedOnce){ S.balancedOnce=true; api.later(()=>{ api.stamp(C.stampBalanced,'good'); api.earn(COIN.balanced, potEls.needs? potEls.needs.amt : el); },120); }
      if(pct('savings')>=GUIDE.savings && !S.savingsOnce && r>=0){ S.savingsOnce=true; api.later(()=>{ api.floater(C.paidFirst, potEls.savings?potEls.savings.amt:el, 'up'); api.earn(COIN.paidFirst, potEls.savings? potEls.savings.amt : el, {silent:true}); },60); }
    }

    /* ---------- 3 compare ---------- */
    function stCompare(st){
      st.append(h('h3',{class:'hh'},C.compareTitle), h('p',{class:'pp'},C.compareText));
      const cmp=h('div',{class:'cmp'}); st.append(cmp);
      const bars=[];
      ORDER.forEach(key=>{ const you=pct(key), g=GUIDE[key], d=Math.round(you-g);
        let v='';
        if(key==='savings') v = d<-2 ? fill(C.savingsUnder,{d:Math.abs(d)}) : C.savingsOk;
        if(key==='needs') v = d>2 ? fill(C.needsOver,{d}) : d<-2 ? fill(C.needsUnder,{d:Math.abs(d)}) : C.needsOn;
        if(key==='wants') v = d>2 ? fill(C.wantsOver,{d}) : C.wantsOk;
        const youBar=h('div',{class:'bar'}, h('i',{style:`width:0;background:${COLORS[key]}`}), h('small',{}, fill(C.you,{n:Math.round(you)})));
        const gBar=h('div',{class:'bar guide'}, h('i',{style:'width:0'}), h('small',{}, fill(C.guideBar,{n:g})));
        bars.push([youBar.firstChild, Math.min(100,you)],[gBar.firstChild,g]);
        cmp.append(h('div',{class:'cmprow'}, h('div',{class:'nm'},C.pots[key].short), h('div',{class:'bars'},youBar,gBar), h('p',{class:'verdict'},v)));
      });
      api.later(()=>{ bars.forEach(([b,w])=>b.style.width=w+'%'); api.sfx('rise'); }, 80);
      st.append(h('p',{class:'insight'},C.insight));
      st.append(h('h3',{class:'hh',style:'margin-top:22px;font-size:1.15rem'},C.adjustTitle));
      const adj=h('div',{class:'adjust'});
      ['savings','wants','needs'].forEach(k=>{ const b=h('button',{class:'sz-chip'+(S.adjust===k?' on':''),type:'button','aria-pressed':String(S.adjust===k),'data-k':k},C.adjust[k]); b.onclick=()=>{ S.adjust=k; [...adj.children].forEach(c=>{ c.classList.toggle('on',c===b); c.setAttribute('aria-pressed',String(c===b)); }); api.sfx('pop'); if(!S.adjustPaid){ S.adjustPaid=true; api.earn(COIN.adjust,b); } next.disabled=false; }; adj.append(b); });
      st.append(adj);
      const next=h('button',{class:'sz-btn',type:'button',id:'bud-next3',disabled:!S.adjust},C.toPlan);
      next.onclick=()=>go(3);
      st.append(h('div',{class:'nav'}, h('button',{class:'sz-btn ghost',type:'button',onclick:()=>go(1)},C.backToSplit), next));
    }

    /* ---------- 4 plan ---------- */
    function stPlan(st){
      if(!S.moveFirst) S.moveFirst=S.amt.savings;
      st.append(h('h3',{class:'hh'},C.planTitle), h('p',{class:'pp'},C.planText));
      const mf=h('input',{class:'sz-input',id:'bud-move',type:'number',inputmode:'numeric',min:'0',step:'500',value:String(S.moveFirst||''),style:'font-family:var(--money);font-size:1.3rem'});
      const ta=h('textarea',{class:'sz-input',id:'bud-action',maxlength:'160',placeholder:C.actionPlaceholder}); ta.value=S.action;
      const tmpl=h('div',{class:'tmpl'});
      const amtNow=()=>inr(+mf.value||S.amt.savings);
      const templates=()=>[ fill(C.tmplMove,{amt:amtNow()}), C.tmplCut, S.adjust==='wants'? fill(C.tmplEatOut,{amt:inr(Math.round(S.amt.wants*.5/500)*500)}) : fill(C.tmplAuto,{amt:amtNow()}) ];
      const drawT=()=>{ tmpl.innerHTML=''; templates().forEach(t=>tmpl.append(h('button',{type:'button',onclick:()=>{ ta.value=t; S.action=t; check(); api.sfx('click'); }},t))); };
      drawT(); mf.addEventListener('input',()=>{ S.moveFirst=Math.max(0,Math.round(+mf.value||0)); drawT(); check(); });
      ta.addEventListener('input',()=>{ S.action=ta.value; check(); });
      const issue=h('button',{class:'sz-btn gold big',type:'button',id:'bud-issue',disabled:true},C.issue);
      function check(){ const ok=S.action.trim().length>=8 && S.moveFirst>0; issue.disabled=!ok; if(ok && !S.planPaid){ S.planPaid=true; api.earn(COIN.plan, issue); } }
      st.append(
        h('div',{class:'sz-field'}, h('label',{for:'bud-move'},C.moveFirstLabel), mf),
        h('div',{class:'sz-field',style:'margin-top:14px'}, h('label',{for:'bud-action'},C.actionLabel), ta), tmpl,
        h('div',{class:'nav'}, h('button',{class:'sz-btn ghost',type:'button',onclick:()=>go(2)},C.back), issue));
      check();
      issue.onclick=()=>go(4);
    }

    /* ---------- 5 card + self-check ---------- */
    function certCard(o){
      const ros=h('canvas',{class:'ros','aria-hidden':'true'}), ros2=h('canvas',{class:'ros2','aria-hidden':'true'});
      const dl=h('dl');
      o.rows.forEach(([k,v])=>{ const dt=h('dt',{},k); const dd=h('dd'); let wide=false; if(v && v.nodeType){ dd.append(v); wide=v.classList.contains('split3'); } else { dd.innerHTML=v; if(String(v).replace(/<[^>]+>/g,'').length>46){ dd.classList.add('soft'); wide=true; } } if(wide){ dt.classList.add('w'); dd.classList.add('w'); } dl.append(dt, dd); });
      const card=h('div',{class:'cert',role:'group','aria-label':o.title},
        ros, ros2, h('img',{class:'wm',src:api.asset('brand/logomark.webp'),alt:''}),
        h('div',{class:'in'},
          h('div',{class:'top'}, h('div',{style:'min-width:0'}, h('div',{class:'issuer'},C.issuerLine), h('div',{class:'ttl'},o.title), h('div',{class:'sub'},o.issuer)), h('div',{class:'ser',title:C.serialTitle,html:serialHTML(S.serial)})),
          h('div',{}, h('div',{class:'big'},o.big), h('div',{class:'bigl'},o.bigLabel)),
          dl, h('div',{class:'foot'}, h('span',{}, o.foot), h('span',{}, fill(C.issued,{when:o.issued})))));
      const draw=()=>{ const c=api.colors(); try{ api.rosette(ros,{accent:c.up}); api.rosette(ros2,{n:24,layers:[{R:1,r:.3,d:.66,color:c.gold,a:.55,turns:11},{R:.6,r:.16,d:.4,color:c.up,a:.5,turns:9}]}); }catch(e){} };
      requestAnimationFrame(draw); card.redraw=draw;
      return card;
    }
    function stCard(st){
      const issued=month();
      const split=h('div',{class:'split3'}, ORDER.map(k=>h('i',{style:`width:${pct(k)}%;background:${COLORS[k]}`})));
      const listed=[...S.items.needs].concat([...S.items.wants]);
      const card=certCard({ title:C.cardTitle, issuer:C.cardIssuer, big:inr(S.income), bigLabel:C.cardBigLabel, foot:C.cardFoot, issued,
        rows:[
          [C.rowSavings, `<span class="m">${inr(S.amt.savings)}</span> · ${Math.round(pct('savings'))}%`],
          [C.rowNeeds, `<span class="m">${inr(S.amt.needs)}</span> · ${Math.round(pct('needs'))}%`],
          [C.rowWants, `<span class="m">${inr(S.amt.wants)}</span> · ${Math.round(pct('wants'))}%`],
          [C.rowSplit, split],
          listed.length?[C.rowIncludes, esc(listed.join(', '))]:null,
          [C.rowMoveFirst, `<span class="m">${inr(S.moveFirst)}</span> ${C.moveFirstNext}`],
          [C.rowAction, esc(S.action.trim())],
          [C.rowEmergency, esc(fill(C.emergencyText,{needs:inr(S.amt.needs)}))]
        ].filter(Boolean) });
      live={ redraw:()=>card.redraw() };
      st.append(h('h3',{class:'hh'},C.cardStageTitle), h('p',{class:'pp'},C.cardStageText), card);
      if(!S.issued){ S.issued=true; store.set({ income:S.income, savings:S.amt.savings, needs:S.amt.needs, wants:S.amt.wants, needsItems:[...S.items.needs], wantsItems:[...S.items.wants], adjust:S.adjust, action:S.action.trim(), moveFirst:S.moveFirst, issued, serial:S.serial });
        const head=h('div',{class:'head'}); card.append(head); card.classList.add('printing'); api.sfx('whoosh');
        api.later(()=>{ card.classList.remove('printing'); head.remove(); api.stamp(C.issuedStamp,'gold',{at:card}); api.confetti(card, 56); api.later(()=>api.sfx('bell'), 240); api.earn(COIN.card, card); }, reduced()?50:1180); }
      st.append(h('h3',{class:'hh',style:'margin-top:26px'},C.selfCheckTitle), h('p',{class:'pp'},C.selfCheckText));
      const fin=h('button',{class:'sz-btn big',type:'button',id:'bud-finish',disabled:S.check.some(r=>r===null)},C.finishTask);
      const wrap=h('div',{class:'check'}); const paid=[false,false,false];
      C.selfCheck.forEach((item,i)=>{
        const row=h('div',{class:'q'+(S.check[i]===true?' yes':'')});
        const y=h('button',{class:'y'+(S.check[i]===true?' on':''),type:'button'},C.yes), n=h('button',{class:'n'+(S.check[i]===false?' on':''),type:'button'},C.notYet);
        const tip=h('div',{class:'tip',hidden:S.check[i]!==false}, h('span',{},item.tip), h('button',{type:'button',onclick:()=>go(item.back)}, item.backLabel));
        y.onclick=()=>{ S.check[i]=true; y.classList.add('on'); n.classList.remove('on'); row.classList.add('yes'); tip.hidden=true; if(!paid[i]){ paid[i]=true; api.earn(COIN.selfCheck, y); } api.sfx('pop'); api.haptic('light'); fin.disabled=S.check.some(r=>r===null); };
        n.onclick=()=>{ S.check[i]=false; n.classList.add('on'); y.classList.remove('on'); row.classList.remove('yes'); tip.hidden=false; api.sfx('click'); fin.disabled=S.check.some(r=>r===null); };
        row.append(h('p',{},item.q), h('div',{class:'yn'}, y, n), tip); wrap.append(row);
      });
      st.append(wrap);
      fin.onclick=finishTask;
      st.append(h('div',{class:'nav'}, h('button',{class:'sz-btn ghost',type:'button',onclick:()=>go(1)},C.editBudget), fin));
    }
    function esc(s){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

    /* ---------- finishing ---------- */
    function finishTask(){
      const balanced = remaining()===0 && total()>0;
      const saving = pct('savings')>=GUIDE.savings;
      const acted = S.action.trim().length>=8 && S.moveFirst>0;
      const yes = S.check.filter(x=>x===true).length;
      const badge = balanced && saving && acted;
      const task={ done:balanced && acted, income:S.income, savingsPct:Math.round(pct('savings')), needsPct:Math.round(pct('needs')), wantsPct:Math.round(pct('wants')), moveFirst:S.moveFirst, selfCheckYes:yes };
      api.record({ item:'budget-task', part:'task', correct:task.done, choice:task });
      const stats=[[C.statTakeHome,inr(S.income)],[C.statSavings,Math.round(pct('savings'))+'%']];
      if(lesson && api.hasQuiz()){
        steps.remove(); stageBox=null; el.innerHTML=''; live=null;
        const summary=h('div',{class:'done'}, h('div',{class:'line'}, '✓ '+C.taskDoneLine), h('div',{class:'split3',style:'height:14px'}, ORDER.map(k=>h('i',{style:`width:${pct(k)}%;background:${COLORS[k]}`}))));
        api.lessonEnd(el,{ copy:{ checkEyebrow:C.checkEyebrow, checkTitle:C.checkTitle, checkText:C.checkText }, summary, taskDone:task.done, badge,
          titles:{ pass:C.passTitle, fail:C.failTitle }, stats, details:{ task } });
        return;
      }
      api.finish({ score:(balanced?1:0)+(saving?1:0)+(acted?1:0)+yes, max:6, passed:balanced && acted, badge,
        title: badge?C.playTitleBadge : balanced?C.playTitleBalanced : C.playTitleDraft, text:C.playText,
        stats:stats.concat([[C.statSelfCheck,yes+' / 3']]), details:{ task } });
    }

    /* test hooks: window.__auto() fills each step with the 50/30/20 guide and moves on */
    window.__auto=()=>{
      if(S.stage===0){ const b=document.getElementById('bud-pay'); if(b && !b.disabled){ b.click(); return 2600; } return false; }
      if(S.stage===1){ if(remaining()!==0||total()===0){ useGuide(); return 300; } document.getElementById('bud-next2').click(); return 600; }
      if(S.stage===2){ const n=document.getElementById('bud-next3'); if(n.disabled){ el.querySelector('.adjust .sz-chip').click(); return 300; } n.click(); return 600; }
      if(S.stage===3){ const t=el.querySelector('.tmpl button'); const i=document.getElementById('bud-issue'); if(i.disabled){ t.click(); return 300; } i.click(); return 1800; }
      if(S.stage===4){ const y=[...el.querySelectorAll('.q .y:not(.on)')][0]; if(y){ y.click(); return 200; } const f=document.getElementById('bud-finish'); if(f && !f.disabled){ S.stage=5; f.click(); return 600; } }
      return false;
    };
    showStart();
    return { unmount(){ live=null; } };
  }
});
})();
