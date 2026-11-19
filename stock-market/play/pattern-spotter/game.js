/* Pattern Spotter — A to Z of the Stock Market, Module 9 (Spotter). Weeks of price draw live from the module's pivot data;
   name the shape, then watch the construction lines show why. */
(function(){
'use strict';
const CSS = `
.g-ps .chartbox.pulse{animation:psPulse .55s ease-out}
@keyframes psPulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--gold) 55%,transparent)}100%{box-shadow:0 0 0 14px transparent}}
.g-ps .ps-timer{position:absolute;left:0;right:0;bottom:0;height:6px;background:var(--line)}
.g-ps .ps-timer i{display:block;height:100%;width:100%;background:var(--up);transform-origin:left center}
.g-ps .ps-timer.low i{background:var(--down)}
.g-ps .ps-timer.off{opacity:0}
.g-ps .chartbox .tag{font-size:1.25rem;line-height:1;min-width:2.2em;text-align:right}
.g-ps .chartbox .tag.low{animation:psBeat 1s infinite}
@keyframes psBeat{0%,100%{transform:scale(1)}15%{transform:scale(1.18)}}
.g-ps .ps-ctx{font-size:.9rem;color:var(--ink-2);margin:10px 2px 0;min-height:1.4em;max-width:66ch}
.g-ps .ps-opts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px;min-height:134px;align-content:start}
.g-ps .ps-opts .sz-opt{min-height:62px;align-items:center;font-weight:600;font-size:1.02rem;font-variation-settings:"wdth" 104;opacity:0;transform:translateY(8px);animation:psIn .28s ease-out forwards}
.g-ps .ps-opts .sz-opt:nth-child(2){animation-delay:.04s}.g-ps .ps-opts .sz-opt:nth-child(3){animation-delay:.08s}.g-ps .ps-opts .sz-opt:nth-child(4){animation-delay:.12s}
@keyframes psIn{to{opacity:1;transform:none}}
.g-ps .ps-wait{grid-column:1/-1;display:grid;place-items:center;color:var(--ink-3);font-size:.9rem;border:1.5px dashed var(--line-2);border-radius:12px}
.g-ps .ps-next{margin-top:14px}
.g-ps .ps-legend{display:flex;gap:6px;align-items:center;font-size:.8rem;color:var(--ink-3);margin-top:8px}
.g-ps .ps-legend i{display:inline-block;width:22px;border-top:2px dashed var(--gold)}
@media (min-width:700px){.g-ps .ps-opts{grid-template-columns:repeat(4,minmax(0,1fr));min-height:62px}}
`;
function injectCSS(){ if(document.getElementById('css-g-ps')) return; const s=document.createElement('style'); s.id='css-g-ps'; s.textContent=CSS; document.head.appendChild(s); }

/* Pivots from the module doc (SM M9 Q2-Q7), joined with straight lines as the doc specifies.
   Cup and Handle follows the doc's description (decline 140 to 100, rounded bottom to 90 and back to 138, handle to 128, breakout to 152).
   Construction lines: [kind, ...] in original point indices. */
const ROUNDS = [
  { pts:[100,118,133,112,130,153,130,112,122,131,110,90],
    ctx:'Three peaks. Middle one higher. Then a break below the two troughs. Pivots from the course: 100→133→112→153→112→131→90.',
    opts:['Double Top','Head & Shoulders','Cup and Handle','Ascending Triangle'], ans:1,
    why:'Head and Shoulders. Two similar shoulders around a higher head, and the neckline break at the end confirms the reversal.',
    build:[ ['line',3,112,7,112,'ext','Neckline'], ['label',2,133,'Left shoulder'], ['label',5,153,'Head'], ['label',9,131,'Right shoulder'], ['dot',9.9,112] ] },
  { pts:[100,122,140,112,138,120,93],
    ctx:'Two peaks at similar heights, one trough between. Pivots: 100→140→112→138→93.',
    opts:['Head & Shoulders','Double Top','Cup and Handle','Flag'], ans:1,
    why:'Double Top. The M shape, then a break below the middle trough turns an uptrend into a downtrend.',
    build:[ ['line',2,140,4,138,'seg','Two similar peaks'], ['line',3,112,6,112,'seg','Neckline'], ['dot',5.3,112] ] },
  { pts:[140,120,100,94,91,90,92,98,108,120,131,138,133,128,131,140,152],
    ctx:'A decline, a long rounded recovery, a small pullback, a breakout. From the course: 140→100, rounded bottom to 90 and back to 138, handle to 128, breakout to 152.',
    opts:['Double Bottom','Head & Shoulders','Cup and Handle','Rising Wedge'], ans:2,
    why:'Cup and Handle. The rounded U is the cup, the short dip before the breakout is the handle. A continuation pattern, ideally on rising volume.',
    build:[ ['curve',[2,3,4,5,6,7,8,9,10,11],-5,'Cup'], ['line',11,138,16,138,'seg','Rim'], ['bracket',11,14,'Handle'], ['dot',14.78,138] ] },
  { pts:[100,120,140,165,160,155,158,152,156,150,178],
    ctx:'A sharp pole, a brief choppy pause between about 150 and 165, then continuation to 178.',
    opts:['Head & Shoulders','Flag','Cup and Handle','Double Top'], ans:1,
    why:'A Flag. The steep rise is the pole, the tight consolidation is the flag. These usually resolve in the direction of the original move.',
    build:[ ['line',0,100,3,165,'seg','Pole'], ['line',3,165,8,156,'seg',''], ['line',5,155,9,150,'seg','Flag'], ['dot',9.14,154] ] },
  { pts:[100,150,115,150,125,150,135,150,165],
    ctx:'Resistance touched three times at the same level. Each pullback low is higher than the last.',
    opts:['Symmetrical Triangle','Rising Wedge','Ascending Triangle','Descending Triangle'], ans:2,
    why:'Ascending Triangle. Flat ceiling, rising floor. Buyers pay more each time while sellers defend one level, until it gives way.',
    build:[ ['line',1,150,7.6,150,'seg','Flat ceiling'], ['line',2,115,7.6,143,'seg','Rising floor'], ['dot',7,150] ] },
  { pts:[100,130,110,138,122,144,132,147,140,120],
    ctx:'Higher highs and higher lows, but each swing narrower than the last. Then a breakdown.',
    opts:['Ascending Triangle','Rising Wedge','Cup and Handle','Double Top'], ans:1,
    why:'Rising Wedge. Both lines rise and converge. Despite the upward slope it reads bearish, because each push gains less than the one before.',
    build:[ ['line',1,130,7,147,'ext2','Upper line'], ['line',2,110,8,140,'ext2','Lower line'], ['dot',8.5,130] ] }
];
const K = 8, SECS = 12;
function densify(p){ const out=[]; for(let i=0;i<p.length-1;i++){ for(let k=0;k<K;k++) out.push(p[i]+(p[i+1]-p[i])*k/K); } out.push(p[p.length-1]); return out; }

SZ.register({
  id:'pattern-spotter', course:'sm', module:9, title:'Pattern Spotter', kind:'Spotter', badge:'wedge', order:10,
  blurb:'Weeks of price draw live from the course pivots. Name the shape, then see the lines that prove it.',
  mount(root, api){
    injectCSS();
    const {h}=api, inr=api.fmt.inr;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const S = { i:0, streak:0, best:0, earn:0, correct:0, token:0, answered:false };

    const el=h('div',{class:'g-ps'});
    const stRound=h('b',{},'1 / '+ROUNDS.length), stStreak=h('b',{},'0'), stEarn=h('b',{class:'gold'},'0 points');
    const cv=h('canvas',{'aria-label':'Price chart'}); const tag=h('div',{class:'tag'},''); const timer=h('div',{class:'ps-timer off'},h('i'));
    const box=h('div',{class:'chartbox'}, cv, tag, timer);
    const ctx=h('p',{class:'ps-ctx'}); const opts=h('div',{class:'ps-opts',role:'group','aria-label':'Answers'});
    const msg=h('div',{class:'sz-msg','aria-live':'polite'}); const why=h('div',{class:'sz-why',hidden:true});
    const legend=h('div',{class:'ps-legend',hidden:true}, h('i'), 'Gold dashes show how the pattern is built');
    const next=h('button',{class:'sz-btn ps-next',hidden:true},'Next chart');
    el.append(
      h('p',{class:'sz-lede'},'Weeks of price draw live from the module’s pivot data. Name the shape inside twelve seconds. After each answer the construction lines appear, so you see why it is that pattern.'),
      h('div',{class:'sz-hud'}, h('div',{class:'sz-stat'},h('small',{},'Chart'),stRound), h('div',{class:'sz-stat'},h('small',{},'Streak'),stStreak), h('div',{class:'sz-stat'},h('small',{},'Score'),stEarn)),
      box, ctx, legend, opts, msg, why, h('div',{class:'sz-row'},next));
    root.append(el);

    const aspect=()=> box.clientWidth<560 ? 1.45 : 2.3;
    let redraw=()=>{};
    const onResize=()=>{ if(!api.session.dead) redraw(); };
    window.addEventListener('resize', onResize);
    SZ.on('theme', ()=>{ if(!api.session.dead) redraw(); });
    const hud_=()=>{ stRound.textContent=`${S.i+1} / ${ROUNDS.length}`; stStreak.textContent=S.streak; stEarn.textContent=inr(S.earn); };

    function drawChart(r, m, overlay){
      const dense=densify(r.pts); const lo=Math.min(...r.pts)-10, hi=Math.max(...r.pts)+10;
      const sc = api.chart.line(cv, dense.slice(0,Math.max(2,m)), { aspect:aspect(), total:dense.length, ref:dense, lo, hi, dot:m<dense.length || !overlay });
      if(overlay>0) construction(r, sc, overlay);
      return sc;
    }
    function construction(r, sc, p){
      const g=cv.getContext('2d'); const c=api.colors(); const w=cv.clientWidth, H=cv.clientHeight;
      const X=i=>sc.x(i*K), Y=v=>sc.y(v); const n=r.pts.length-1;
      g.save(); g.beginPath(); g.rect(0,0,44+(w-44)*p,H); g.clip();
      g.strokeStyle=c.gold; g.fillStyle=c.gold; g.lineWidth=2; g.setLineDash([7,5]); g.lineCap='round';
      if(c.uv){ g.shadowColor=c.gold; g.shadowBlur=8; }
      const labels=[];
      for(const b of r.build){
        if(b[0]==='line'){ let [,i1,v1,i2,v2,mode,lab]=b; let a1=i1,b1=v1,a2=i2,b2=v2;
          if(mode==='ext'){ a1=0; b1=v1; a2=n; b2=v2; }
          if(mode==='ext2'){ const s=(v2-v1)/(i2-i1); a2=i2+1.2; b2=v2+s*1.2; }
          g.beginPath(); g.moveTo(X(a1),Y(b1)); g.lineTo(X(a2),Y(b2)); g.stroke();
          if(lab) labels.push([ (X(a1)+X(a2))/2, (Y(b1)+Y(b2))/2 + 16, lab ]);
        } else if(b[0]==='curve'){ const [,idx,off,lab]=b; g.beginPath(); idx.forEach((i,k)=>{ const x=X(i), y=Y(r.pts[i]+off); k?g.lineTo(x,y):g.moveTo(x,y); }); g.stroke(); const mid=idx[Math.floor(idx.length/2)-1]; labels.push([X(mid), Y(r.pts[mid]+off)+18, lab]); }
        else if(b[0]==='bracket'){ const [,i1,i2,lab]=b; const top=Math.min(Y(r.pts[i1]),Y(r.pts[i2]))-14; g.beginPath(); g.moveTo(X(i1),top+6); g.lineTo(X(i1),top); g.lineTo(X(i2),top); g.lineTo(X(i2),top+6); g.stroke(); labels.push([(X(i1)+X(i2))/2, top-10, lab]); }
        else if(b[0]==='label'){ const [,i,v,lab]=b; labels.push([X(i), Y(v)-14, lab]); }
        else if(b[0]==='dot'){ const [,i,v]=b; g.save(); g.setLineDash([]); g.beginPath(); g.arc(X(i),Y(v),6,0,Math.PI*2); g.stroke(); g.beginPath(); g.arc(X(i),Y(v),2.2,0,Math.PI*2); g.fill(); g.restore(); }
      }
      g.setLineDash([]); g.shadowBlur=0;
      g.font='600 12px "Anek Latin", system-ui, sans-serif'; g.textAlign='center'; g.textBaseline='middle';
      for(const [x,y,t] of labels){ const tw=g.measureText(t).width+12; const xx=Math.max(44+tw/2, Math.min(w-tw/2-6, x)); const yy=Math.max(12, Math.min(H-28, y)); g.globalAlpha=.9; g.fillStyle=c.paperHi||c.paper; g.fillRect(xx-tw/2, yy-9, tw, 18); g.globalAlpha=1; g.fillStyle=c.ink; g.fillText(t, xx, yy+.5); }
      g.restore();
    }

    function startRound(){
      S.token++; const my=S.token; S.answered=false; const r=ROUNDS[S.i]; hud_();
      ctx.textContent=r.ctx; opts.innerHTML=''; opts.append(h('div',{class:'ps-wait'},'Watch the weeks draw'));
      msg.className='sz-msg'; msg.textContent=''; why.hidden=true; next.hidden=true; legend.hidden=true;
      tag.textContent=''; tag.classList.remove('low'); timer.className='ps-timer off'; timer.firstChild.style.transform='scaleX(1)';
      const dense=densify(r.pts); const D=dense.length; let m=1; S.m=1; S.overlay=0;
      redraw=()=>drawChart(r, S.m, S.overlay);
      drawChart(r, 2, 0);
      const t0=performance.now()+300, dur=reduce?50:(r.pts.length-1)*190; let lastPt=0;
      api.raf(t=>{
        if(my!==S.token) return false;
        const p=Math.max(0,Math.min(1,(t-t0)/dur)); m=Math.max(2,Math.round(1+p*(D-1))); S.m=m;
        drawChart(r, m, 0);
        const pt=Math.floor((m-1)/K); if(pt>lastPt){ lastPt=pt; api.sfx(r.pts[pt]>=r.pts[pt-1]?'tick':'tock'); }
        if(p>=1){ box.classList.remove('pulse'); void box.offsetWidth; box.classList.add('pulse'); api.sfx('pop'); showOpts(r,my); return false; }
      });
    }
    function showOpts(r,my){
      opts.innerHTML='';
      r.opts.forEach((o,i)=>{ const b=h('button',{class:'sz-opt','data-i':i}, h('span',{class:'k'},String(i+1)), h('span',{},o)); b.addEventListener('click',()=>pick(i,b)); opts.append(b); });
      const t0=performance.now(); let last=SECS+1; timer.className='ps-timer'; S.t0=t0; S.left=SECS;
      api.raf(t=>{
        if(my!==S.token||S.answered) return false;
        const left=Math.max(0,SECS-(t-t0)/1000); S.left=left; timer.firstChild.style.transform=`scaleX(${left/SECS})`;
        const sec=Math.ceil(left); if(sec!==last){ last=sec; tag.textContent=sec+'s'; if(sec<=3&&sec>0){ tag.classList.add('low'); timer.classList.add('low'); api.sfx('alarm'); } else if(sec>0&&sec<SECS) api.sfx('tock'); }
        if(left<=0){ pick(-1,null); return false; }
      });
    }
    function pick(i,btn){
      if(S.answered) return; S.answered=true; S.token++; const my=S.token;
      const r=ROUNDS[S.i]; const left=Math.max(0,Math.round(S.left??0)); const ok=i===r.ans;
      timer.classList.add('off'); tag.classList.remove('low');
      [...opts.querySelectorAll('.sz-opt')].forEach((b,j)=>{ b.disabled=true; if(j===r.ans) b.classList.add('ok'); else if(j===i) b.classList.add('no'); else b.classList.add('dim'); });
      if(ok){ S.streak++; S.best=Math.max(S.best,S.streak); S.correct++; const bonus=S.streak>=5?600:S.streak>=3?300:0; const e=1000+left*100+bonus; S.earn+=1; api.earn(e, btn||box);
        msg.className='sz-msg good'; msg.innerHTML=''; msg.append(h('b',{},r.opts[r.ans]+'. '), `+${inr(e)} · ${left}s left`+(bonus?` · streak bonus ${inr(bonus)}`:''));
        if(S.streak===3) api.stamp('3 IN A ROW','gold'); else if(S.streak===5) api.stamp('5 IN A ROW','gold'); else api.sfx('cash'); api.haptic(15);
      } else { S.streak=0; api.sfx('wrong'); api.shake(box); api.haptic([20,40,20]); msg.className='sz-msg bad'; msg.innerHTML=''; msg.append(i<0?'Time. ':'Not quite. ', 'It’s ', h('b',{},r.opts[r.ans]), '.'); }
      why.hidden=false; why.textContent=r.why; legend.hidden=false; hud_();
      // sweep the construction lines in, left to right
      const t0=performance.now(), dur=reduce?10:1100; api.sfx('whoosh');
      api.raf(t=>{ if(my!==S.token) return false; const p=Math.min(1,(t-t0)/dur); S.overlay=1-Math.pow(1-p,2); drawChart(r, S.m, S.overlay); if(p>=1) return false; });
      if(S.i===ROUNDS.length-1 && ROUNDS[S.i-1]) api.later(()=>{ if(!api.session.dead) api.toast('Both rise. One has a flat ceiling, the other converges.'); }, 900);
      next.hidden=false; next.textContent=S.i+1<ROUNDS.length?'Next chart':'See result';
      requestAnimationFrame(()=>{ try{ next.focus({preventScroll:true}); }catch(e){} next.scrollIntoView({behavior:reduce?'auto':'smooth',block:'nearest'}); });
    }
    next.addEventListener('click',()=>{
      api.sfx('click');
      if(S.i+1<ROUNDS.length){ S.i++; startRound(); el.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'}); return; }
      const n=ROUNDS.length, all=S.correct===n;
      api.done({ score:S.correct, max:n, badge:all, title: all?'Every pattern named':`${S.correct} of ${n} patterns named`,
        text:'The last two are placed back to back on purpose. Both rise. One has a flat ceiling and reads bullish, the other converges and reads bearish. Telling them apart is the whole module.',
        stats:[['Named',`${S.correct} / ${n}`],['Best streak',S.best],['Score',inr(S.earn)]] });
    });
    const onKey=e=>{ if(api.session.dead||document.querySelector('.result')) return; if(/^[1-4]$/.test(e.key)&&!S.answered){ const b=opts.querySelector(`.sz-opt[data-i="${+e.key-1}"]`); if(b) b.click(); } };
    window.addEventListener('keydown',onKey);
    SZ._test=SZ._test||{}; SZ._test.patterns={ answer:(right=true)=>{ const r=ROUNDS[S.i]; const b=opts.querySelector(`.sz-opt[data-i="${right?r.ans:(r.ans+1)%4}"]`); b&&b.click(); }, next:()=>next.click(), skipTo:i=>{ S.i=i; startRound(); }, state:()=>({i:S.i,answered:S.answered,correct:S.correct}) };
    api.guide({ eyebrow:"Module 9 \u00b7 TA: Chart Patterns", title:"Name the chart pattern", text:"Watch the price draw a shape, then pick the pattern\u2019s name.", onStart:startRound });
    return { unmount(){ window.removeEventListener('resize',onResize); window.removeEventListener('keydown',onKey); } };
  }
});
})();
