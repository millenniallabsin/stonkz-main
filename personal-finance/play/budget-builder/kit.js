/* Stonkzz games kit v1
   One game per page. Load order: kit.js, content.js, game.js. The game calls SZ.register({...}) and gets an
   `api` object in mount(root, api). The kit draws the frame (header + stage), handles sound, haptics, coins,
   stamps, the results card, and every message to and from the host app (React Native WebView or a web iframe).
   See HANDOVER.md for the message contract. */
(function(){
'use strict';
const SZ = window.SZ = window.SZ || {};
SZ.version = '1.2.0';
const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];
const h = (tag, attrs={}, ...kids) => { const el=document.createElement(tag); for(const k in attrs){ const v=attrs[k]; if(v==null||v===false) continue; if(k==='class') el.className=v; else if(k==='html') el.innerHTML=v; else if(k.startsWith('on')) el.addEventListener(k.slice(2),v); else el.setAttribute(k,v===true?'':v);} for(const c of kids.flat()){ if(c==null||c===false) continue; el.append(c.nodeType?c:document.createTextNode(c)); } return el; };
SZ.h = h; SZ.$ = $; SZ.$$ = $$;

/* ---------- formatting ---------- */
const inr = n => (n<0?'-':'') + '₹' + Math.round(Math.abs(n)).toLocaleString('en-IN');
/* website copy: the score is points, never rupees */
const pts = n => { const v=Math.round(Math.abs(n)); return v + (v===1?' point':' points'); };
const lakh = n => { const a=Math.abs(n); if(a>=1e7) return '₹'+(n/1e7).toFixed(a>=1e8?1:2).replace(/\.?0+$/,'')+' cr'; if(a>=1e5) return '₹'+(n/1e5).toFixed(a>=1e6?1:2).replace(/\.?0+$/,'')+' lakh'; return inr(n); };
const pct = (n,d=0) => (n).toFixed(d)+'%';
SZ.fmt = { inr, lakh, pct };
const shuffle = a => { a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.random()*(i+1)|0; [a[i],a[j]]=[a[j],a[i]]; } return a; };
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
SZ.util = { shuffle, clamp, fvSip:(m,annual,years)=>{const r=annual/1200,n=years*12; return r===0?m*n:m*((Math.pow(1+r,n)-1)/r)*(1+r);} };
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
/* Game time stands still while the start guide is on screen: performance.now() and api.raf() run on a clock that
   skips the held time, so every countdown a game starts behind the guide begins only when the learner presses Start. */
const realNow = performance.now.bind(performance); let heldTotal=0, heldAt=null;
try{ performance.now = () => { const n=realNow(); return n - heldTotal - (heldAt!=null ? n-heldAt : 0); }; }catch(e){}
SZ.realNow = realNow;

/* ---------- config from the host app ----------
   Sources, later wins: defaults < window.STONKZZ_INIT (injected before load) < URL query < an `init` message. */
const DEFAULTS = { mode:'lesson', theme:'light', sound:true, haptics:true, lang:'en', chrome:'full', debug:false, hostOrigin:'*', learner:null, attempt:null };
function parseVal(v){ if(v==='true'||v==='1') return true; if(v==='false'||v==='0') return false; return v; }
function readConfig(){
  const c=Object.assign({}, DEFAULTS, (typeof window.STONKZZ_INIT==='object' && window.STONKZZ_INIT)||{});
  const q=new URLSearchParams(location.search);
  for(const [k,v] of q){ if(k in DEFAULTS) c[k]=parseVal(v); }
  if(c.mode!=='play') c.mode='lesson';
  return c;
}
SZ.config = readConfig();

/* ---------- bridge ---------- */
const sessionId = (crypto.randomUUID ? crypto.randomUUID() : 'S'+Date.now().toString(36)+Math.random().toString(36).slice(2,8));
const hasRN = () => !!(window.ReactNativeWebView && window.ReactNativeWebView.postMessage);
const hasParent = () => { try{ return window.parent && window.parent!==window; }catch(e){ return true; } };
SZ.inHost = () => hasRN() || hasParent();
function send(type, payload={}){
  const msg = Object.assign({ source:'stonkzz-game', v:1, type, game:SZ.def?SZ.def.id:null, session:sessionId, mode:SZ.config.mode, at:new Date().toISOString() }, payload);
  try{ if(hasRN()) window.ReactNativeWebView.postMessage(JSON.stringify(msg)); else if(hasParent()) window.parent.postMessage(msg, SZ.config.hostOrigin||'*'); }catch(e){}
  try{ window.dispatchEvent(new CustomEvent('stonkzz:event',{detail:msg})); }catch(e){}
  if(SZ.config.debug) console.log('[stonkzz] →', type, payload);
  return msg;
}
SZ.send = send;
function receive(m, origin){
  if(typeof m==='string'){ try{ m=JSON.parse(m); }catch(e){ return; } }
  if(!m || typeof m!=='object' || m.target!=='stonkzz-game') return;
  if(origin && SZ.config.hostOrigin && SZ.config.hostOrigin!=='*' && origin!==SZ.config.hostOrigin) return;
  if(SZ.config.debug) console.log('[stonkzz] ←', m.type, m);
  switch(m.type){
    case 'init': { const before=JSON.stringify([SZ.config.mode]); Object.assign(SZ.config, m.config||{}); if(SZ.config.mode!=='play') SZ.config.mode='lesson'; applyConfig(); if(JSON.stringify([SZ.config.mode])!==before || m.restart) restart(); break; }
    case 'pause': pause('host'); break;
    case 'resume': resume('host'); break;
    case 'restart': restart(); break;
    case 'sound': setSound(!!m.on); break;
    case 'theme': SZ.config.theme=m.theme; applyTheme(); break;
  }
}
window.addEventListener('message', e=>receive(e.data, e.origin));
document.addEventListener('message', e=>receive(e.data));   /* React Native WebView on Android */
window.StonkzzGame = { receive:m=>receive(m), version:SZ.version, get config(){ return Object.assign({},SZ.config); }, get session(){ return sessionId; } };
window.addEventListener('error', e=>{ send('error',{ message:String(e.message||e.error||'error') }); });

/* ---------- local save (best score and sound), per game ---------- */
const store = { best:null, plays:0, sound:null };
function storeKey(){ return 'stonkzz-game:'+(SZ.def?SZ.def.id:'x'); }
function loadStore(){ try{ const s=localStorage.getItem(storeKey()); if(s) Object.assign(store, JSON.parse(s)); }catch(e){} if(SZ.config.best && typeof SZ.config.best==='object') store.best=SZ.config.best; }
function saveStore(){ try{ localStorage.setItem(storeKey(), JSON.stringify(store)); }catch(e){} }

/* ---------- events ---------- */
const handlers={};
function emit(ev, data){ (handlers[ev]||[]).forEach(f=>{ try{ f(data); }catch(e){ console.error(e); } }); }
SZ.on = (ev,f)=>{ (handlers[ev]=handlers[ev]||[]).push(f); return ()=>SZ.off(ev,f); };
SZ.off = (ev,f)=>{ const a=handlers[ev]; if(a){ const i=a.indexOf(f); if(i>=0) a.splice(i,1); } };
SZ.emit = emit;

/* ---------- theme ---------- */
SZ.isUV = () => document.documentElement.getAttribute('data-theme')==='dark';
function resolvedTheme(){ const t=SZ.config.theme; if(t==='dark'||t==='light') return t; return matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'; }
function applyTheme(){ const t=resolvedTheme(); if(document.documentElement.getAttribute('data-theme')!==t){ document.documentElement.setAttribute('data-theme', t); paperTexture(); emit('theme',{uv:t==='dark'}); } }
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ()=>{ if(SZ.config.theme==='auto') applyTheme(); });
function applyConfig(){ document.documentElement.setAttribute('data-chrome', SZ.config.chrome||'full'); document.documentElement.lang = SZ.config.lang||'en'; applyTheme(); if(SZ.config.sound===false || SZ.config.sound===true) setSound(SZ.config.sound, true); }
SZ.colors = function(){ const cs=getComputedStyle(document.documentElement); const g=n=>cs.getPropertyValue(n).trim(); return { paper:g('--paper'), paperHi:g('--paper-hi'), ink:g('--ink'), ink2:g('--ink-2'), ink3:g('--ink-3'), line:g('--line'), line2:g('--line-2'), up:g('--up'), down:g('--down'), gold:g('--gold'), foil:g('--foil'), pf:g('--pf'), sm:g('--sm'), uv:SZ.isUV() }; };

/* ---------- words the kit itself shows (games keep theirs in content.js) ---------- */
const KIT_STRINGS = { en:{ close:'Close', soundOn:'Sound on', soundOff:'Sound off', earned:'Score', earnedLong:'Points scored this round', bestNote:'new best', tryAgain:'Try again', continue:'Continue', playAgain:'Play again', done:'Done', passed:'Passed', notYet:'Not passed yet', cleared:'Module cleared', goodAttempt:'Good attempt', newMedal:'New medal: ', medal:'Medal: ', noHost:'In the app, this button takes the learner back.', final:'Final assessment', module:'Module ', paused:'Paused' } };
SZ.t = (k) => { const L=SZ.config.lang||'en'; const extra=(window.STONKZZ_CONTENT&&window.STONKZZ_CONTENT.kitStrings)||{}; return (extra[L]&&extra[L][k]) || (KIT_STRINGS[L]&&KIT_STRINGS[L][k]) || KIT_STRINGS.en[k] || k; };

/* ---------- sound: tiny WebAudio synth, no files ---------- */
let soundOn = true;
let actx=null, master=null;
function audio(){ if(!soundOn || SZ.paused) return null; if(!actx){ try{ actx=new (window.AudioContext||window.webkitAudioContext)(); master=actx.createGain(); master.gain.value=.55; master.connect(actx.destination); }catch(e){ return null; } } if(actx.state==='suspended') actx.resume(); return actx; }
function tone(f, d, type='sine', g=.2, when=0, f2=null){ const a=audio(); if(!a) return; const t=a.currentTime+when; const o=a.createOscillator(), v=a.createGain(); o.type=type; o.frequency.setValueAtTime(f,t); if(f2) o.frequency.exponentialRampToValueAtTime(f2,t+d); v.gain.setValueAtTime(0,t); v.gain.linearRampToValueAtTime(g,t+.006); v.gain.exponentialRampToValueAtTime(.0001,t+d); o.connect(v); v.connect(master); o.start(t); o.stop(t+d+.02); }
function noise(d, g=.2, when=0, filt='lowpass', f1=800, f2=null, q=1){ const a=audio(); if(!a) return; const t=a.currentTime+when; const len=Math.max(1,a.sampleRate*d|0); const b=a.createBuffer(1,len,a.sampleRate); const ch=b.getChannelData(0); for(let i=0;i<len;i++) ch[i]=(Math.random()*2-1)*(1-i/len); const s=a.createBufferSource(); s.buffer=b; const fl=a.createBiquadFilter(); fl.type=filt; fl.frequency.setValueAtTime(f1,t); if(f2) fl.frequency.exponentialRampToValueAtTime(f2,t+d); fl.Q.value=q; const v=a.createGain(); v.gain.setValueAtTime(g,t); v.gain.exponentialRampToValueAtTime(.0001,t+d); s.connect(fl); fl.connect(v); v.connect(master); s.start(t); }
let coinPitch=0, coinT=0;
const SFX = {
  coin(){ const now=performance.now(); coinPitch = now-coinT<350 ? Math.min(coinPitch+1,8) : 0; coinT=now; const k=Math.pow(2,coinPitch/12); tone(1318*k,.07,'triangle',.12); tone(1975*k,.16,'triangle',.09,.05); },
  stamp(){ noise(.09,.5,0,'lowpass',900); tone(95,.16,'sine',.5,0,55); },
  whoosh(){ noise(.24,.16,0,'bandpass',500,2600,.8); },
  swipeL(){ noise(.2,.14,0,'bandpass',1800,500,.9); },
  wrong(){ tone(233,.11,'square',.06); tone(175,.2,'square',.06,.09); },
  tick(){ tone(2100,.018,'square',.035); },
  tock(){ tone(1400,.022,'square',.03); },
  alarm(){ tone(880,.07,'square',.05); tone(880,.07,'square',.05,.12); },
  pop(){ tone(520,.09,'sine',.18,0,980); },
  click(){ tone(1600,.02,'triangle',.06); },
  rise(){ tone(300,.35,'sawtooth',.04,0,900); tone(450,.35,'triangle',.06,0,1350); },
  fall(){ tone(700,.45,'sawtooth',.045,0,140); },
  cash(){ tone(2093,.5,'sine',.12); tone(2637,.45,'sine',.07,.02); noise(.18,.12,.04,'highpass',4000); },
  win(){ [523,659,784,1046].forEach((f,i)=>tone(f,.28,'triangle',.12,i*.09)); tone(1568,.6,'sine',.06,.38); },
  lose(){ [392,330,262].forEach((f,i)=>tone(f,.3,'triangle',.09,i*.12)); },
  star(){ tone(1046,.14,'triangle',.12); tone(1568,.22,'sine',.08,.05); noise(.06,.2,0,'lowpass',700); },
  bell(){ tone(1760,.9,'sine',.1); tone(2217,.7,'sine',.05,.01); },
  thud(){ tone(70,.25,'sine',.55,0,40); noise(.12,.25,0,'lowpass',300); },
  flip(){ noise(.12,.12,0,'bandpass',2400,900,1.2); }
};
SZ.sfx = name => { try{ (SFX[name]||SFX.click)(); }catch(e){} };
const ICON = {
  close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  sound:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 010 7"/><path d="M18.5 5.5a9 9 0 010 13"/></svg>',
  mute:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H3v6h3l5 4z"/><path d="M22 9l-6 6M16 9l6 6"/></svg>'
};
SZ.icon = ICON;
function setSound(on, fromConfig){ soundOn=!!on; if(!fromConfig){ store.sound=soundOn; saveStore(); } const b=$('#sz-sound'); if(b){ b.setAttribute('aria-pressed', String(!soundOn)); b.setAttribute('aria-label', soundOn?SZ.t('soundOn'):SZ.t('soundOff')); b.innerHTML=ICON[soundOn?'sound':'mute']; } }
SZ.setSound = setSound;

/* ---------- haptics: the app vibrates (iPhone web views cannot), the browser falls back to navigator.vibrate ---------- */
SZ.haptic = p => { if(SZ.config.haptics===false) return; try{
  if(SZ.inHost()){ const style = Array.isArray(p) ? (p.length>=3?'error':'medium') : (typeof p==='string' ? p : (p<=12?'light':'medium')); send('haptic',{ style }); return; }
  if(navigator.vibrate) navigator.vibrate(typeof p==='string' ? ({light:10,medium:18,heavy:30,success:[10,40,18],warning:[20,40,20],error:[25,40,25]}[p]||12) : p);
}catch(e){} };

/* ---------- people + badges ---------- */
SZ.asset = p => 'assets/'+p;
SZ.people = {
  priya:{ name:'Priya', age:25, img:'people/priya.webp' },
  karthik:{ name:'Karthik', age:35, img:'people/karthik.webp' },
  ravi:{ name:'Ravi', age:30, img:'people/ravi.webp' },
  meena:{ name:'Meena', age:58, img:'people/meena.webp' },
  uncle:{ name:'Uncle Mohan', age:63, img:'people/uncle.webp' },
  arjun:{ name:'Arjun', age:28, img:'people/arjun.webp' }
};
SZ.badgeArt = b => SZ.asset(SZ.isUV() ? b.img.replace(/\.webp$/,'-night.webp') : b.img);
SZ.badges = {
  'sorted':{ name:'Sorted', how:'Sort a whole round without a miss', img:'medals/sorted.webp' },
  'calibrated':{ name:'Calibrated', how:'Land every Idli Index guess within 10 percent', img:'medals/calibrated.webp' },
  'compounder':{ name:'Compounder', how:'Guess Karthik’s catch-up SIP within 15 percent', img:'medals/compounder.webp' },
  'allocator':{ name:'Allocator', how:'Build the right mix for both Ravi and Meena', img:'medals/allocator.webp' },
  'never-minimum':{ name:'Never Paid Minimum', how:'Clear the bill in full and spot the interest trap', img:'medals/never-minimum.webp' },
  'calm':{ name:'Decided While Calm', how:'Hold your written rule through a year of headlines', img:'medals/calm.webp' },
  'zero-rejections':{ name:'Zero Rejections', how:'Open the account with no wrong step', img:'medals/zero-rejections.webp' },
  'context':{ name:'Context Matters', how:'Name every candle, including the Hanging Man', img:'medals/context.webp' },
  'wedge':{ name:'Wedge from Triangle', how:'Name every chart pattern', img:'medals/wedge.webp' },
  'waited':{ name:'Waited for the Close', how:'Skip the trap and take the real breakout', img:'medals/waited.webp' },
  'survivor':{ name:'Survivor', how:'Size, target and recover without a slip', img:'medals/survivor.webp' },
  'budgeteer':{ name:'Budgeteer', how:'Build a balanced budget that pays you first', img:'medals/budgeteer.webp' },
  'covered':{ name:'Covered', how:'Choose protection the smart way and sort every card', img:'medals/covered.webp' },
  'above-board':{ name:'Above Board', how:'Sort every card on the right side of the legal line', img:'medals/above-board.webp' },
  'banyan':{ name:'Banyan', how:'Pick the line that beats inflation and land the ₹500 guess', img:'medals/banyan.webp' },
  'spread':{ name:'Spread', how:'Spot every basket that only looks diversified', img:'medals/spread.webp' },
  'on-track':{ name:'On Track', how:'Land every goal\u2019s monthly amount within 15 percent', img:'medals/on-track.webp' },
  'know-your-number':{ name:'Know Your Number', how:'Land every FIRE number within 15 percent', img:'medals/know-your-number.webp' },
  'year-well-lived':{ name:'Year Well Lived', how:'Clear the Personal Finance final', img:'medals/year-well-lived.webp' },
  'bull-and-bear':{ name:'Bull and Bear', how:'Sort every card without a miss', img:'medals/bull-and-bear.webp' },
  'whos-who':{ name:'Who\u2019s Who', how:'Name every market participant', img:'medals/whos-who.webp' },
  'moat':{ name:'Moat', how:'Spot every lasting advantage', img:'medals/moat.webp' },
  'statements':{ name:'Three Statements', how:'File every line in the right statement', img:'medals/statements.webp' },
  'fair-value':{ name:'Fair Value', how:'Land every valuation within 15 percent', img:'medals/fair-value.webp' },
  'trend-reader':{ name:'Trend Reader', how:'Read every chart right', img:'medals/trend-reader.webp' },
  'indicator':{ name:'Signal, Not Noise', how:'Read every indicator right', img:'medals/indicator.webp' },
  'steady':{ name:'Steady Hands', how:'Spot every bias talking', img:'medals/steady.webp' },
  'has-a-system':{ name:'Has a System', how:'Build the rule with every piece in place', img:'medals/has-a-system.webp' },
  'bull-run':{ name:'Bull Run', how:'Clear the Stock Market final', img:'medals/bull-run.webp' }
};
/* 3D models ship as base64 inside assets/3d/<name>.glb.js so every host serves them (some refuse .glb).
   SZ.glb('idli') resolves to a blob URL that three.js GLTFLoader can load. */
const glbCache={};
SZ.glb = function(name){
  if(glbCache[name]) return glbCache[name];
  const toURL=()=>{ const b64=(window.SZ_GLB||{})[name]; if(!b64) return null; const bin=atob(b64); const u8=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i); return URL.createObjectURL(new Blob([u8],{type:'model/gltf-binary'})); };
  return glbCache[name]=new Promise(res=>{ const ready=toURL(); if(ready) return res(ready); const sc=document.createElement('script'); sc.src=SZ.asset('3d/'+name+'.glb.js'); sc.onload=()=>res(toURL()); sc.onerror=()=>{ sc.remove(); res(null); }; document.head.append(sc); });
};
SZ.COURSES = { pf:{ id:'pf', name:'Personal Finance Mastery', short:'Personal Finance', color:'--pf' }, sm:{ id:'sm', name:'A to Z of the Stock Market', short:'Stock Market', color:'--sm' } };
SZ.content = function(course){ const C=window.STONKZZ_CONTENT||{}; if(C.course && (!course || C.course.id===course || C.course.modules)) return C.course; const D=window.SZ_CONTENT||{}; return D[course]||null; };
const STAR_PATH='M12 1.8l2.6 6.3 6.8.5-5.2 4.4 1.6 6.6L12 16l-5.8 3.6 1.6-6.6L2.6 8.6l6.8-.5z';
SZ.starsHTML = (n, max=3) => `<span class="stars" aria-label="${n} of ${max} stars">${Array.from({length:max},(_,i)=>`<svg viewBox="0 0 24 24" class="${i<n?'on':'off'}"><path d="${STAR_PATH}" stroke-width="1.4" stroke-linejoin="round"/></svg>`).join('')}</span>`;

/* ---------- guilloche rosette + paper texture ---------- */
SZ.rosette = function(canvas, o={}){
  const dpr=Math.min(2, window.devicePixelRatio||1); const w=canvas.clientWidth||canvas.width, hh=canvas.clientHeight||canvas.height;
  canvas.width=w*dpr; canvas.height=hh*dpr; const g=canvas.getContext('2d'); g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,w,hh);
  const c=SZ.colors(); const cx=o.cx??w/2, cy=o.cy??hh/2; const S=o.size??Math.min(w,hh)/2*.96;
  const layers = o.layers || [ {R:1, r:.27, d:.62, color:c.ink, a:.32, n:o.n||36}, {R:.78, r:.13, d:.5, color:o.accent||c.up, a:.38, n:(o.n||36)+12}, {R:.5, r:.09, d:.42, color:c.gold, a:.42, n:28} ];
  g.lineWidth=o.lw??.6;
  for(const L of layers){
    g.strokeStyle=L.color; g.globalAlpha=L.a; g.beginPath();
    const R=L.R*S, r=L.r*S, d=L.d*S; const k=(R-r)/r; const steps=1800;
    const turns = L.turns || 10; const N=steps*turns/4|0;
    for(let i=0;i<=N;i++){ const t=i/N*Math.PI*2*turns; const x=cx+(R-r)*Math.cos(t)+d*Math.cos(k*t); const y=cy+(R-r)*Math.sin(t)-d*Math.sin(k*t); i?g.lineTo(x,y):g.moveTo(x,y); }
    g.stroke();
  }
  g.globalAlpha=1;
};
function paperTexture(){
  const c=SZ.colors(); const cv=document.createElement('canvas'); const W=520,H=520; cv.width=W; cv.height=H; const g=cv.getContext('2d');
  g.strokeStyle=c.ink; g.globalAlpha=c.uv?.07:.06; g.lineWidth=.7;
  for(let row=0; row<40; row++){ g.beginPath(); for(let x=0;x<=W;x+=4){ const y=row*13 + Math.sin(x/W*Math.PI*4 + row*.45)*5 + Math.sin(x/W*Math.PI*2)*3; x?g.lineTo(x,y):g.moveTo(x,y); } g.stroke(); }
  document.documentElement.style.setProperty('--tex', `url(${cv.toDataURL('image/png')})`);
}

/* ---------- charts (engraved style, theme-aware) ---------- */
function fitCanvas(cv, aspect){ const dpr=Math.min(2,window.devicePixelRatio||1); const w=cv.clientWidth||cv.parentElement.clientWidth||600; const hh=aspect?w/aspect:(cv.clientHeight||300); cv.style.height=hh+'px'; cv.width=w*dpr; cv.height=hh*dpr; const g=cv.getContext('2d'); g.setTransform(dpr,0,0,dpr,0,0); return {g,w,h:hh}; }
SZ.fitCanvas = fitCanvas;
SZ.chart = {
  candles(cv, cs, o={}){
    const {g,w,h}=fitCanvas(cv, o.aspect||2.2); const c=SZ.colors(); g.clearRect(0,0,w,h);
    const all=cs.flat().concat(o.level?[o.level.price]:[]).concat(o.entry?[o.entry.price]:[]);
    let lo=o.lo??Math.min(...all), hi=o.hi??Math.max(...all); const pad=(hi-lo)*.12||4; if(o.lo==null) lo-=pad; if(o.hi==null) hi+=pad;
    const L=44, R=14, T=16, B=20; const y=v=>T+(1-(v-lo)/(hi-lo))*(h-T-B); const slots=o.slots||Math.max(6,cs.length+1); const sw=(w-L-R)/slots; const bw=Math.max(5,Math.min(28,sw*.52));
    g.font='500 11px "Anek Latin", system-ui, sans-serif'; g.textBaseline='middle';
    for(let i=0;i<=4;i++){ const v=lo+(hi-lo)*i/4, yy=y(v); g.strokeStyle=c.line; g.lineWidth=1; g.beginPath(); g.moveTo(L,yy); g.lineTo(w-R,yy); g.stroke(); if(o.axis!==false){ g.fillStyle=c.ink3; g.fillText('₹'+Math.round(v), 6, yy); } }
    if(o.level){ const yy=y(o.level.price); g.save(); g.setLineDash([6,5]); g.strokeStyle=c.gold; g.lineWidth=1.5; if(c.uv){g.shadowColor=c.gold;g.shadowBlur=8;} g.beginPath(); g.moveTo(L,yy); g.lineTo(w-R,yy); g.stroke(); g.restore(); g.fillStyle=c.gold; g.textAlign='right'; g.fillText(o.level.label||('₹'+o.level.price), w-R-4, yy-10); g.textAlign='left'; }
    if(o.entry){ const yy=y(o.entry.price); g.save(); g.setLineDash([2,4]); g.strokeStyle=c.ink; g.lineWidth=1.2; g.beginPath(); g.moveTo(L,yy); g.lineTo(w-R,yy); g.stroke(); g.restore(); g.fillStyle=c.ink; g.fillText(o.entry.label||('Bought ₹'+o.entry.price), L+4, yy-10); }
    cs.forEach((k,i)=>{ const [op,hi_,lo_,cl]=k; const x=L+sw*(i+.5); const up=cl>=op; const col=up?c.up:c.down; g.strokeStyle=col; g.fillStyle=col; g.lineWidth=1.6;
      if(c.uv){ g.shadowColor=col; g.shadowBlur=10; } else g.shadowBlur=0;
      g.beginPath(); g.moveTo(x,y(hi_)); g.lineTo(x,y(Math.max(op,cl))); g.moveTo(x,y(Math.min(op,cl))); g.lineTo(x,y(lo_)); g.stroke();
      const top=y(Math.max(op,cl)), bh=Math.max(2,Math.abs(y(op)-y(cl)));
      if(up){ g.strokeRect(x-bw/2,top,bw,bh); g.save(); g.beginPath(); g.rect(x-bw/2,top,bw,bh); g.clip(); g.lineWidth=.8; g.globalAlpha=.55; for(let yy=top-bw; yy<top+bh+bw; yy+=3.2){ g.beginPath(); g.moveTo(x-bw/2,yy); g.lineTo(x+bw/2,yy+bw*.35); g.stroke(); } g.restore(); }
      else { g.fillRect(x-bw/2,top,bw,bh); }
      g.shadowBlur=0;
      if(o.live && i===cs.length-1){ g.save(); g.globalAlpha=c.uv?.07:.06; g.fillStyle=c.ink; g.fillRect(x-sw/2+2,T,sw-4,h-T-B); g.restore(); }
      if(o.highlight===i){ g.save(); g.setLineDash([4,4]); g.strokeStyle=c.gold; g.lineWidth=1.5; g.strokeRect(x-bw/2-9,y(hi_)-9,bw+18,y(lo_)-y(hi_)+18); g.restore(); }
    });
    return { y, x:i=>L+sw*(i+.5), lo, hi };
  },
  line(cv, pts, o={}){
    const {g,w,h}=fitCanvas(cv, o.aspect||2.4); const c=SZ.colors(); g.clearRect(0,0,w,h);
    const ref=o.ref||pts; let lo=o.lo??Math.min(...ref), hi=o.hi??Math.max(...ref); const pad=(hi-lo)*.1||4; if(o.lo==null) lo-=pad; if(o.hi==null) hi+=pad;
    const L=44,R=14,T=16,B=20; const total=o.total||pts.length; const x=i=>L+i*(w-L-R)/Math.max(1,total-1); const y=v=>T+(1-(v-lo)/(hi-lo))*(h-T-B);
    g.font='500 11px "Anek Latin", system-ui, sans-serif'; g.textBaseline='middle';
    for(let i=0;i<=4;i++){ const v=lo+(hi-lo)*i/4, yy=y(v); g.strokeStyle=c.line; g.lineWidth=1; g.beginPath(); g.moveTo(L,yy); g.lineTo(w-R,yy); g.stroke(); if(o.axis!==false){ g.fillStyle=c.ink3; g.fillText((o.prefix??'₹')+Math.round(v), 6, yy); } }
    if(pts.length<2) return {x,y};
    const col=o.color||c.up;
    if(o.fill!==false){ g.save(); g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(x(i),y(p)):g.moveTo(x(i),y(p))); g.lineTo(x(pts.length-1),h-B); g.lineTo(x(0),h-B); g.closePath(); g.clip(); g.strokeStyle=col; g.globalAlpha=.35; g.lineWidth=.8; for(let k=-h; k<w; k+=5){ g.beginPath(); g.moveTo(k,h); g.lineTo(k+h*.6,0); g.stroke(); } g.restore(); }
    g.save(); if(c.uv){ g.shadowColor=col; g.shadowBlur=12; } g.strokeStyle=col; g.lineWidth=2.4; g.lineJoin='round'; g.lineCap='round'; g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(x(i),y(p)):g.moveTo(x(i),y(p))); g.stroke(); g.restore();
    if(o.dot!==false){ const i=pts.length-1; g.fillStyle=c.gold; g.beginPath(); g.arc(x(i),y(pts[i]),4.5,0,Math.PI*2); g.fill(); }
    return {x,y,lo,hi};
  }
};

/* ---------- fx: coins, floaters, stamps, confetti ---------- */
function fxLayer(){ let fx=$('#fx'); if(!fx){ fx=h('div',{id:'fx','aria-hidden':'true'}); document.body.append(fx); } return fx; }
function pointOf(src){ if(!src) return {x:innerWidth/2,y:innerHeight/2}; if(src.nodeType===1 && src.getBoundingClientRect){ const r=src.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}; } if(src.clientX!=null) return {x:src.clientX,y:src.clientY}; if(src.currentTarget && src.currentTarget.getBoundingClientRect) return pointOf(src.currentTarget); if(src.x!=null) return {x:src.x,y:src.y}; return {x:innerWidth/2,y:innerHeight/2}; }
SZ.floater = function(text, src, tone){ const p=pointOf(src); const el=h('div',{class:'floater'},text); if(tone==='bad'){el.style.color='var(--down)';el.style.textShadow='none';} if(tone==='up'){el.style.color='var(--up)';} fxLayer().append(el); el.animate([{transform:`translate(${p.x}px,${p.y}px) translate(-50%,-50%) scale(.6)`,opacity:0},{transform:`translate(${p.x}px,${p.y-26}px) translate(-50%,-50%) scale(1.1)`,opacity:1,offset:.25},{transform:`translate(${p.x}px,${p.y-70}px) translate(-50%,-50%) scale(1)`,opacity:0}],{duration:1100,easing:'cubic-bezier(.2,.8,.2,1)'}).onfinish=()=>el.remove(); };
let earnedTotal=0, displayed=0, capAnim=null, pending=0;
function counter(){ return $('#sz-earned'); }
function rollTo(target){ const box=counter(); const el=box&&box.querySelector('b'); if(!el) return; cancelAnimationFrame(capAnim); const from=displayed, t0=performance.now(), dur=520; const step=t=>{ const p=Math.max(0,Math.min(1,(t-t0)/dur)), e=1-Math.pow(1-p,3); displayed=from+(target-from)*e; el.textContent=pts(displayed); if(p<1) capAnim=requestAnimationFrame(step); else displayed=target; }; capAnim=requestAnimationFrame(step); box.classList.remove('bump'); void box.offsetWidth; box.classList.add('bump'); }
function resetCounter(){ earnedTotal=0; displayed=0; pending=0; const b=counter(); if(b) b.querySelector('b').textContent=pts(0); }
SZ.earn = function(amount, src, opts={}){
  amount = amount>0 ? 1 : 0; if(!amount) return; earnedTotal+=amount; if(current) current.sess.earned+=amount;
  emit('earn',{amount});
  const p=pointOf(src); if(!opts.silent) SZ.floater('+'+pts(amount), p);
  const target=counter(); const visible = target && target.offsetParent!==null;
  if(!visible||reduced()){ rollTo(earnedTotal); SZ.sfx('coin'); return; }
  const tr=target.getBoundingClientRect(); const tx=tr.right-24, ty=tr.top+tr.height/2;
  const n=Math.min(9, 2+Math.floor(amount/600)); pending+=amount;
  for(let i=0;i<n;i++){ const coin=h('div',{class:'coin'},'★'); fxLayer().append(coin); const sx=p.x+(Math.random()-.5)*40, sy=p.y+(Math.random()-.5)*30; const mx=sx+(tx-sx)*.3+(Math.random()-.5)*160, my=Math.min(sy,ty)-80-Math.random()*120; const d=620+i*55;
    coin.animate([{transform:`translate(${sx}px,${sy}px) scale(.3)`,opacity:0},{transform:`translate(${(sx+mx)/2}px,${my}px) scale(1.15) rotateY(180deg)`,opacity:1,offset:.45},{transform:`translate(${tx}px,${ty}px) scale(.55) rotateY(360deg)`,opacity:1}],{duration:d,delay:i*45,easing:'cubic-bezier(.45,.05,.55,.95)',fill:'both'}).onfinish=()=>{ coin.remove(); SZ.sfx('coin'); pending=Math.max(0, pending-amount/n); rollTo(Math.max(0, earnedTotal-pending)); };
  }
  SZ.haptic(12);
};
SZ.stamp = function(text, tone='good', opts={}){ /* a printed label (serial-number style), not a rubber stamp */
  const el=h('div',{class:'stamp'+(tone==='bad'?' bad':tone==='gold'?' gold':'')},text); if(opts.at){ const p=pointOf(opts.at); el.style.left=p.x+'px'; el.style.top=p.y+'px'; } fxLayer().append(el); SZ.sfx('stamp'); SZ.haptic('medium');
  el.animate([{transform:'translate(-50%,-30%) scale(.92)',opacity:0},{transform:'translate(-50%,-50%) scale(1)',opacity:1,offset:.2},{transform:'translate(-50%,-50%) scale(1)',opacity:1,offset:.78},{transform:'translate(-50%,-62%) scale(1)',opacity:0}],{duration:opts.dur||1150,easing:'cubic-bezier(.2,.8,.2,1)'}).onfinish=()=>el.remove(); };
SZ.confetti = function(src, n=46){ if(reduced()) return; const p=pointOf(src); const c=SZ.colors(); const cols=[c.up,c.gold,c.pf,c.sm,c.foil]; for(let i=0;i<n;i++){ const el=h('div',{class:'confetto'}); el.style.background=cols[i%cols.length]; el.style.opacity=.92; fxLayer().append(el); const ang=Math.random()*Math.PI*2, sp=140+Math.random()*260; const dx=Math.cos(ang)*sp, dy=Math.sin(ang)*sp-180; const rot=Math.random()*720-360;
  el.animate([{transform:`translate(${p.x}px,${p.y}px) rotate(0) scale(.6)`},{transform:`translate(${p.x+dx*.7}px,${p.y+dy*.7}px) rotate(${rot*.6}deg) rotateX(${rot}deg) scale(1)`,offset:.4},{transform:`translate(${p.x+dx}px,${p.y+dy+380}px) rotate(${rot}deg) rotateX(${rot*2}deg) scale(.9)`,opacity:0}],{duration:1500+Math.random()*900,easing:'cubic-bezier(.15,.6,.4,1)'}).onfinish=()=>el.remove(); } };
SZ.shake = el => { if(!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); };
SZ.toast = function(text, ms=2200){ $$('.sz-toast').forEach(t=>t.remove()); const t=h('div',{class:'sz-toast',role:'status'},text); document.body.append(t); setTimeout(()=>t.remove(), ms); };
SZ.countUp = function(el, from, to, ms=900, fmt=inr){ const t0=performance.now(); const step=t=>{ const p=Math.max(0,Math.min(1,(t-t0)/ms)), e=1-Math.pow(1-p,3); el.textContent=fmt(from+(to-from)*e); if(p<1) requestAnimationFrame(step); }; requestAnimationFrame(step); };

/* ---------- pause / resume ---------- */
SZ.paused=false; let pausedBy=null;
function pause(by){ if(SZ.paused) return; SZ.paused=true; pausedBy=by; try{ actx&&actx.suspend(); }catch(e){} emit('pause'); }
function resume(by){ if(!SZ.paused) return; if(pausedBy==='host' && by!=='host') return; SZ.paused=false; pausedBy=null; try{ actx&&soundOn&&actx.resume(); }catch(e){} emit('resume'); }
document.addEventListener('visibilitychange', ()=>{ if(document.hidden) pause('page'); else resume('page'); });

/* ---------- option letters inside the course's explanations follow the shuffle ----------
   The docs write "A and D confuse..." against their own lettering. After shuffling, those letters are remapped
   to what the learner sees. A lone capital A is an article unless a verb, conjunction or punctuation follows it. */
const VERBS="and|or|is|isn't|are|aren't|was|wasn't|would|wouldn't|could|can|can't|might|will|won't|also|only|both|wrongly|simply|does|doesn't|did|has|have|had";
const RE_A=new RegExp("\\bA\\b(?=\\s*[,.;:)/]|\\s+[-–]|\\s+(?:"+VERBS+")\\b|\\s+[a-z]+(?<!ss|us|is)s\\b|\\s+[a-z]+ly\\b)","g");
SZ.remapLetters = function(t, map){ if(!t) return t; return t.replace(RE_A,'\u0000A').replace(/\b([BCD])\b/g,'\u0000$1').replace(/\u0000([ABCD])/g,(m,L)=>map[L]||L); };
function contextBlock(q){
  if(!q.context) return null;
  const lines=String(q.context).split('\n').map(s=>s.trim()).filter(Boolean);
  const rows=lines.filter(l=>/^[A-Z][^:]{1,44}:\s*\S/.test(l) && l.length<70);
  const wrap=h('div',{class:'ck-ctx'});
  if(rows.length>=3){
    lines.filter(l=>!rows.includes(l)).forEach(l=>wrap.append(h('p',{},l)));
    const t=h('div',{class:'ck-sheet'}); rows.forEach(r=>{ const i=r.indexOf(':'); t.append(h('div',{}, h('span',{},r.slice(0,i)), h('b',{},r.slice(i+1).trim()))); }); wrap.append(t);
  } else wrap.append(h('p',{},q.context));
  return wrap;
}

/* ---------- Quick check: the module's own quiz questions, one at a time ----------
   Every game ends with this round. It carries all of the module's quiz questions, so the game can replace the quiz.
   api.check(container, { questions, eyebrow, coins, lastLabel }) resolves { correct, total, answers, missed }. */
function check(host, o, api){
  return new Promise(resolve=>{
    const qs=(o.questions||[]).slice(); const n=qs.length; const coinsPer=o.coins??400;
    const C=Object.assign({ eyebrow:'Quick check', of:'Question {n} of {total}', right:'Right.', wrong:'Not quite. The answer is {L}.', whyMissed:'Why your pick missed', next:'Next question', last:'See my result', hint:'Pick one answer.' }, (window.STONKZZ_CONTENT&&window.STONKZZ_CONTENT.checkCopy)||{}, o.copy||{});
    const fill=(s,v)=>String(s).replace(/\{(\w+)\}/g,(m,k)=>v[k]!=null?v[k]:m);
    const st={ qi:0, correct:0, streak:0, best:0, answers:[], missed:[], phase:'pick', t0:0, map:{}, opts:[] };
    const el=h('div',{class:'sz-check'}); host.append(el);
    const sStreak=h('b',{},'0');
    const title=h('b',{});
    el.append(h('div',{class:'ck-head'}, h('div',{class:'ck-t'}, h('small',{}, o.eyebrow||C.eyebrow), title), h('div',{class:'sz-stat'}, h('small',{},'Streak'), sStreak)));
    const segs=h('div',{class:'ck-segs','aria-hidden':'true'}, qs.map(()=>h('i'))); el.append(segs);
    const body=h('div',{class:'ck-body'}); el.append(body);
    let btns=[], fb=null, nextBtn=null;
    function render(){
      const q=qs[st.qi]; st.phase='pick'; st.t0=performance.now();
      st.opts=shuffle(q.options.map((t,i)=>({t,i}))); st.map={}; st.opts.forEach((x,k)=>{ st.map['ABCD'[x.i]]='ABCD'[k]; });
      title.textContent=fill(C.of,{n:st.qi+1,total:n});
      [...segs.children].forEach((s,i)=>s.classList.toggle('now',i===st.qi));
      body.innerHTML=''; body.scrollTop=0;
      const card=h('div',{class:'ck-q'}); const cb=contextBlock(q); if(cb) card.append(cb);
      card.append(h('p',{class:'ck-stem'}, q.stem||q.prompt)); body.append(card);
      const list=h('div',{class:'ck-opts',role:'group','aria-label':'Answers'});
      btns=st.opts.map((x,k)=>{ const b=h('button',{class:'ck-opt',onclick:()=>choose(k)}, h('span',{class:'k'},'ABCD'[k]), h('span',{class:'t'},x.t)); list.append(b); return b; });
      body.append(list); fb=null;
      const sc=body.closest('.sz-stage'); if(sc && !el.closest('.fit')) el.scrollIntoView({block:'start',behavior:reduced()?'auto':'smooth'});
    }
    function choose(k){
      if(st.phase!=='pick') return; st.phase='shown'; api.started();
      const q=qs[st.qi]; const x=st.opts[k]; const ok=x.i===q.answer; const ci=st.opts.findIndex(y=>y.i===q.answer); const L='ABCD'[ci];
      btns.forEach((b,i)=>{ b.disabled=true; b.classList.toggle('ok',i===ci); b.classList.toggle('no',i===k&&!ok); b.classList.toggle('dim',i!==ci&&i!==k); });
      segs.children[st.qi].className = ok?'ok':'no';
      const ms=Math.round(performance.now()-st.t0);
      st.answers.push(api.record({ item:q.id, part:'check', correct:ok, choice:'ABCD'[x.i], expected:'ABCD'[q.answer], ms }));
      api.progress(st.qi+1, n, { part:'check', right:st.correct+(ok?1:0) });
      if(ok){ st.correct++; st.streak++; st.best=Math.max(st.best,st.streak); const gain=coinsPer*(st.streak>=3?2:1); SZ.sfx('rise'); api.haptic('success'); api.earn(gain, btns[k]); if(st.streak===3) api.later(()=>SZ.stamp('x2','gold'),200); }
      else { st.streak=0; st.missed.push(st.qi+1); SZ.sfx('wrong'); api.haptic('error'); SZ.shake(btns[k]); }
      sStreak.textContent=String(st.streak);
      fb=h('div',{class:'ck-fb '+(ok?'good':'bad'),role:'status'});
      fb.append(h('h4',{}, ok?C.right:fill(C.wrong,{L})));
      if(q.explanation) fb.append(h('p',{}, SZ.remapLetters(q.explanation, st.map)));
      if(!ok){ const why=(q.wrongWhy&&q.wrongWhy[String(x.i)]) || (!q.wrongWhy || !Object.keys(q.wrongWhy).length ? q.whyNot : ''); if(why) fb.append(h('div',{class:'miss'}, h('b',{},C.whyMissed), SZ.remapLetters(why, st.map))); }
      const last=st.qi===n-1;
      nextBtn=h('button',{class:'sz-btn',onclick:next}, last?(o.lastLabel||C.last):C.next);
      fb.append(nextBtn); body.append(fb);
      api.later(()=>{ fb.scrollIntoView({block:'nearest',behavior:reduced()?'auto':'smooth'}); nextBtn.focus({preventScroll:true}); }, 250);
    }
    function next(){ if(st.phase!=='shown') return; SZ.sfx('click'); if(st.qi<n-1){ st.qi++; render(); return; } st.phase='end'; document.removeEventListener('keydown',keyH); resolve({ correct:st.correct, total:n, answers:st.answers, missed:st.missed, best:st.best }); }
    const keyH=e=>{ if(api.session.dead||$('.result')){ return; } const k=e.key.toLowerCase(); const m={'1':0,'2':1,'3':2,'4':3,a:0,b:1,c:2,d:3};
      if(st.phase==='pick' && k in m && m[k]<btns.length && !e.metaKey && !e.ctrlKey){ choose(m[k]); e.preventDefault(); }
      else if(e.key==='Enter' && st.phase==='shown'){ next(); e.preventDefault(); } };
    document.addEventListener('keydown',keyH); (api.session.offs=api.session.offs||[]).push(()=>document.removeEventListener('keydown',keyH));
    if(!n){ resolve({correct:0,total:0,answers:[],missed:[],best:0}); return; }
    render();
  });
}
/* Pass or fail by the course's own rule for this module, with its own result message. */
function quizResult(res, extra={}){
  const Q=(window.STONKZZ_CONTENT&&window.STONKZZ_CONTENT.quiz)||{};
  const need=Q.passNeeded ?? Math.ceil((res.total||0)*.6);
  const passed=(res.correct>=need) && (extra.taskDone!==false || !Q.taskRequired);
  let text = passed ? (Q.passMessage||'') : (Q.failMessage||'');
  if(text.includes('[flag weak areas]')) text=text.replace('[flag weak areas]', res.missed&&res.missed.length ? 'the topics behind question'+(res.missed.length>1?'s ':' ')+res.missed.join(res.missed.length>2?', ':' and ').replace(/, (\d+)$/,' and $1') : 'the topics you found hardest');
  return { score:res.correct, max:res.total, passed, passNeeded:need, passMark:res.total?need/res.total:.6, text };
}
/* A standard panel for intros and in-between screens, so every game opens the same way. */
function panel(host, o){
  const go=h('div',{class:'go'});
  const p=h('div',{class:'sz-panel'},
    o.eyebrow?h('div',{class:'eyebrow'},o.eyebrow):null, o.title?h('h2',{},o.title):null, o.text?h('p',{},o.text):null,
    o.steps?h('ol',{class:'pn-steps'}, o.steps.map((s,i)=>h('li',{}, h('span',{class:'n'},String(i+1)), h('div',{}, h('b',{},s.title), s.text?h('span',{},s.text):null)))):null,
    o.body||null, go);
  (o.buttons||[]).forEach(b=>go.append(h('button',{class:'sz-btn '+(b.kind||''),onclick:e=>{ SZ.sfx(b.sfx||'click'); b.onClick&&b.onClick(e); }}, b.label)));
  host.append(p); const f=go.querySelector('button'); if(f) setTimeout(()=>f.focus({preventScroll:true}),50);
  return p;
}
SZ.panel = panel;

/* ---------- Lesson intro and closing check: every game opens and closes the same way ----------
   api.intro(host, { eyebrow, title, text, steps, body, start, onStart }) shows the start panel. In lesson mode it adds the
   quick-check step on its own, with the module's pass rule. api.lessonEnd(host, {...}) shows the check intro, runs the
   module's quiz questions and finishes the game by the course's own pass rule. */
const LESSON_COPY = { start:'Start', stepCheck:'Answer {n} quick questions', stepCheckText:'From the module. Get {need} of {total} right to pass.', checkEyebrow:'Last part', checkTitle:'Now, {n} quick questions', checkText:'These are the module quiz. Get {need} of {total} right to pass. Each answer shows you why.', checkGo:'Start the questions', statCheck:'Questions right', passTitle:'Module {m} cleared', failTitle:'Almost there', taskTitle:'Task not finished yet' };
const fillT=(s,v)=>String(s==null?'':s).replace(/\{(\w+)\}/g,(m,k)=>v[k]!=null?v[k]:m);
function lessonCopy(o){ return Object.assign({}, LESSON_COPY, (window.STONKZZ_CONTENT&&window.STONKZZ_CONTENT.checkCopy)||{}, (o&&o.copy)||{}); }
function hasQuiz(){ const Q=window.STONKZZ_CONTENT&&window.STONKZZ_CONTENT.quiz; return !!(Q&&Q.questions&&Q.questions.length); }
function intro(host, o, api){
  const C=lessonCopy(o); const Q=api.quiz; const steps=(o.steps||[]).slice();
  if(o.onStart && o.direct!==false) return guideStart(o, api);
  if(api.mode==='lesson' && hasQuiz()) steps.push({ title:fillT(C.stepCheck,{n:Q.total||Q.questions.length}), text:fillT(C.stepCheckText,{need:Q.passNeeded,total:Q.total||Q.questions.length}) });
  return panel(host,{ eyebrow:o.eyebrow, title:o.title, text:o.text, steps, body:o.body, buttons:[{ label:o.start||C.start, kind:'gold', sfx:'cash', onClick:()=>{ api.started(); o.onStart&&o.onStart(); } }].concat(o.buttons||[]) });
}
/* ---------- Direct start ----------
   The game opens straight on its first playable screen, frozen. A short guide points at the real controls for a few
   seconds each, then the screen blurs and a Start button appears. Start unfreezes the game and its clocks.
   api.guide({ eyebrow, title, text, start, steps, onStart }) or api.intro(host, { ..., onStart }) both do this.
   steps come from content.js (game.guide): [{ target:'css selector', text:'what to do', gesture:'tap'|'swipe'|'drag'|'point' }]. */
const GUIDE_COPY = { skip:'Skip', next:'Next', start:'Start', again:'Show me again', howTo:'How to play', check:'Then {n} quick questions from the module. Get {need} right to pass.' };
function guideCopy(){ return Object.assign({}, GUIDE_COPY, (window.STONKZZ_CONTENT&&window.STONKZZ_CONTENT.guideCopy)||{}); }
function hold(sess){ if(sess.held) return; sess.held=true; sess.heldQ=[]; heldAt=realNow(); SZ.paused=true; SZ.holding=true; document.documentElement.classList.add('sz-holding'); }
function release(sess){ if(!sess.held) return; sess.held=false; if(heldAt!=null){ heldTotal+=realNow()-heldAt; heldAt=null; } SZ.paused=false; SZ.holding=false; document.documentElement.classList.remove('sz-holding'); const q=sess.heldQ||[]; sess.heldQ=[]; q.forEach(f=>{ try{ f(); }catch(e){ console.error(e); } }); emit('go'); }
function guideStart(o, api){
  const sess=api.session, G=guideCopy(), C=lessonCopy(o), Q=api.quiz;
  hold(sess);
  try{ o.onStart&&o.onStart(); }catch(e){ console.error(e); }
  const n=Q?(Q.total||(Q.questions||[]).length):0;
  const check = api.mode==='lesson' && hasQuiz() && o.check!==false ? fillT(G.check,{n,need:Q.passNeeded}) : null;
  const data=(api.data&&api.data.guide)||null;
  const steps = o.guide || data || (o.steps||[]).map(s=>({ text:s.title+(s.text?'. '+s.text:'') }));
  const go=()=>{ release(sess); api.started(); o.onGo&&o.onGo(); };
  const show=()=>{ if(sess.dead) return; coach({ steps, eyebrow:o.eyebrow, title:o.title, goal:o.text, check, start:o.start||C.start||G.start }, go, sess); };
  requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(show, 120)));
}
SZ.guideStart = guideStart;
function coach(o, onGo, sess){
  const G=guideCopy();
  $$('.sz-coach').forEach(x=>x.remove());
  const steps=(o.steps||[]).filter(s=>s&&s.text);
  const spot=h('div',{class:'cm-spot'}), hand=h('div',{class:'cm-hand'}, h('i'));
  const bar=h('i'), tipN=h('small',{}), tipText=h('p',{});
  const nextB=h('button',{class:'cm-next',type:'button'}, G.next);
  const skip=h('button',{class:'cm-skip',type:'button'}, G.skip);
  const tip=h('div',{class:'cm-tip',role:'status','aria-live':'polite'}, h('div',{class:'cm-bar'}, bar), tipN, tipText, h('div',{class:'cm-foot'}, skip, nextB));
  const goBtn=h('button',{class:'sz-btn big cm-go',type:'button'}, o.start||G.start);
  const again=h('button',{class:'cm-again',type:'button'}, G.again);
  const ready=h('div',{class:'cm-ready'}, o.eyebrow?h('div',{class:'eyebrow'},o.eyebrow):null, o.title?h('h2',{},o.title):null, o.goal?h('p',{},o.goal):null, o.check?h('p',{class:'cm-check'},o.check):null, h('div',{class:'go'}, goBtn), steps.length?again:null);
  const wrap=h('div',{class:'sz-coach',role:'dialog','aria-modal':'true','aria-label':o.title||G.howTo}, h('div',{class:'cm-veil'}), spot, hand, tip, ready);
  document.body.append(wrap);
  let i=-1, timer=null, target=null, closed=false;
  const keys=e=>{ if(closed) return; if(e.key==='Enter'||e.key===' '){ e.preventDefault(); e.stopPropagation(); (wrap.classList.contains('ready')?goBtn:nextB).click(); return; } if(e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); toReady(); return; } if(e.key!=='Tab'){ e.stopPropagation(); e.preventDefault(); } };
  document.addEventListener('keydown', keys, true);
  const find=sel=>{ if(!sel) return null; if(sel.nodeType) return sel; try{ return $$(sel).find(x=>{ const r=x.getBoundingClientRect(); return r.width>2 && r.height>2; })||null; }catch(e){ return null; } };
  function place(){
    if(closed) return; const st=steps[i]; if(!st) return;
    const vw=innerWidth, vh=innerHeight; const pad=st.pad??8;
    let r = target ? target.getBoundingClientRect() : null;
    if(r){ spot.style.cssText=`left:${r.left-pad}px;top:${r.top-pad}px;width:${r.width+pad*2}px;height:${r.height+pad*2}px`; spot.classList.add('on'); wrap.classList.add('has-spot'); }
    else { spot.classList.remove('on'); wrap.classList.remove('has-spot'); }
    hand.className='cm-hand'+(r && st.gesture!=='none' ? ' on '+(st.gesture||'tap') : '');
    if(r){ const pt=(st.gesture||'tap')==='point'; hand.style.left=(r.left+r.width*(st.hx??(pt?.88:.5)))+'px'; hand.style.top=(r.top+r.height*(st.hy??(pt?.8:.5)))+'px'; }
    const tw=Math.min(340, vw-32); tip.style.width=tw+'px';
    const th=tip.offsetHeight||110;
    let x = r ? r.left+r.width/2-tw/2 : vw/2-tw/2; x=Math.max(16, Math.min(vw-16-tw, x));
    let y; if(!r) y=vh/2-th/2; else if(r.bottom+pad+14+th < vh-12) y=r.bottom+pad+14; else if(r.top-pad-14-th > 12) y=r.top-pad-14-th; else y=Math.max(12, vh-th-24);
    tip.style.left=x+'px'; tip.style.top=y+'px';
  }
  function step(k){
    cancelAnimationFrame(timer); if(closed) return;
    if(k>=steps.length) return toReady();
    i=k; const st=steps[i]; target=find(st.target);
    if(target && target.scrollIntoView){ const r=target.getBoundingClientRect(); if(r.top<0||r.bottom>innerHeight) target.scrollIntoView({block:'center',behavior:'auto'}); }
    tipText.textContent=st.text; tipN.textContent=fillT('{n} / {total}',{n:i+1,total:steps.length});
    nextB.textContent = i===steps.length-1 ? (G.done||'Got it') : G.next;
    wrap.classList.remove('ready'); wrap.classList.add('guiding');
    tip.classList.remove('in'); void tip.offsetWidth; tip.classList.add('in');
    place();
    /* the step clock runs on frames, capped per frame, so a slow device never skips a hint */
    const ms=st.ms||3400, mine=i; let acc=0, last=realNow(); bar.style.transition='none'; bar.style.transform='scaleX(0)';
    const tick=()=>{ const now=realNow(); if(closed || i!==mine || wrap.classList.contains('ready')) return; acc+=Math.min(50, now-last); last=now; bar.style.transform=`scaleX(${Math.min(1,acc/ms)})`; if(acc>=ms) step(i+1); else timer=requestAnimationFrame(tick); };
    timer=requestAnimationFrame(tick);
  }
  function toReady(){ cancelAnimationFrame(timer); i=steps.length; target=null; spot.classList.remove('on'); hand.className='cm-hand'; wrap.classList.remove('guiding','has-spot'); wrap.classList.add('ready'); setTimeout(()=>goBtn.focus({preventScroll:true}),60); }
  function close(){ if(closed) return; closed=true; cancelAnimationFrame(timer); if(window.__guide && window.__guide.wrap===wrap) window.__guide=null; document.removeEventListener('keydown', keys, true); removeEventListener('resize', place); wrap.classList.add('out'); setTimeout(()=>wrap.remove(), 260); }
  nextB.onclick=e=>{ e.stopPropagation(); SZ.sfx('click'); step(i+1); };
  skip.onclick=e=>{ e.stopPropagation(); SZ.sfx('click'); toReady(); };
  again.onclick=e=>{ e.stopPropagation(); SZ.sfx('click'); step(0); };
  wrap.addEventListener('click', e=>{ if(wrap.classList.contains('guiding') && !e.target.closest('button')) step(i+1); });
  goBtn.onclick=e=>{ e.stopPropagation(); SZ.sfx('cash'); SZ.haptic('light'); close(); onGo(); };
  addEventListener('resize', place);
  const kill=()=>{ if(sess && sess.dead){ close(); return true; } return false; };
  const watch=setInterval(()=>{ if(kill()||closed) clearInterval(watch); }, 500);
  window.__guide={ wrap, skip:()=>toReady(), start:()=>goBtn.click(), step:()=>i, steps:steps.length };
  if(steps.length) step(0); else toReady();
}
SZ.coach = coach;
function lessonEnd(host, o, api, def){
  const C=lessonCopy(o); const Q=api.quiz;
  host.innerHTML='';
  const n=Q.total||Q.questions.length;
  panel(host,{ eyebrow:C.checkEyebrow, title:fillT(C.checkTitle,{n}), text:fillT(C.checkText,{need:Q.passNeeded,total:n}), body:o.summary||null,
    buttons:[{ label:C.checkGo, onClick:()=>{ host.innerHTML=''; check(host,{ questions:Q.questions },api).then(res=>{
      const r=quizResult(res,{ taskDone:o.taskDone });
      const T=o.titles||{};
      const title = r.passed ? ((o.perfect && res.correct===res.total && T.perfect) || T.pass || fillT(C.passTitle,{m:def.module})) : (o.taskDone===false && Q.taskRequired ? (T.task||C.taskTitle) : (T.fail||C.failTitle));
      api.finish({ score:r.score, max:r.max, passed:r.passed, passMark:r.passMark, badge:!!o.badge, delay:o.delay??400, extra:o.extra||null, title, text:r.text,
        stats:[[C.statCheck, `${res.correct}/${res.total}`]].concat(o.stats||[]),
        details:Object.assign({ check:{ right:res.correct, total:res.total, passNeeded:r.passNeeded, missed:res.missed } }, o.details||{}) });
    }); } }] });
}

/* ---------- Sort it: swipe each card into one of two piles ----------
   api.sort(host, { rounds, settings, copy }) plays every round, then an unscored second look at the misses, and resolves
   { total, right, best, fastest, missed, roundRight, rounds }. A round is { key, name, left, right, leftHint, rightHint,
   cards:[{ id, text, answer:'left'|'right', why, art }] }; art is an image name in assets/cards/ and is optional. */
const SORT_COPY = { roundOf:'Round {n} of {total}', deckLabel:'Deck', cardsLeft:'Cards', streak:'Streak', coins:'Coins', swipe:'Swipe the top card left or right.', outOfTime:'Out of time', notQuite:'Not quite', itIs:'It goes in {pile}.', missedMsg:'Not quite. Nothing lost. Read why, then it goes to the right pile.', timeoutMsg:'Time ran out. Read why, then it goes to the right pile.', streakReset:'Streak reset. ', gotIt:'Got it', secondLookTitle:'Second look', secondLookOne:'1 card to look at again', secondLookMany:'{n} cards to look at again', secondLookLede:'The cards you missed, once more. No timer, no score. Just get them right.', secondLookGo:'Look again', skipSecondLook:'Skip', roundDone:'{right} of {total} right first time', nextRound:'Next round', cards:'{n} cards', reviewTitle:'Cards to remember' };
function sortTexture(){ const cv=document.createElement('canvas'); cv.width=560; cv.height=720; const c=SZ.colors(); SZ.rosette(cv,{cx:280,cy:300,size:300,lw:.55,layers:[{R:1,r:.29,d:.66,color:c.ink,a:.07,turns:14},{R:.7,r:.15,d:.5,color:c.up,a:.09,turns:11}]}); return cv.toDataURL('image/png'); }
SZ.deckBlock = function(r, o={}){
  const C=Object.assign({}, SORT_COPY, o.copy||{}); const tag=o.onclick?'button':'div';
  return h(tag,{class:'sz-deck','aria-pressed':o.pressed==null?null:String(o.pressed),onclick:o.onclick||null},
    h('b',{}, r.name), h('span',{class:'n'}, fillT(C.cards,{n:r.cards.length})),
    h('div',{class:'pair'}, h('span',{}, h('b',{},'← '+r.left), r.leftHint||''), h('span',{}, h('b',{},r.right+' →'), r.rightHint||'')));
};
SZ.sortReview = function(missed, title){ if(!missed||!missed.length) return null; return h('div',{class:'sz-review'}, h('h4',{},title||SORT_COPY.reviewTitle), missed.map(c=>h('div',{class:'it'}, h('b',{},c.text), h('span',{}, h('i',{}, (c.answer==='left'?c._round.left:c._round.right)+'. '), c.why)))); };
function sorter(host, o, api){
  return new Promise(resolve=>{
    const C=Object.assign({}, SORT_COPY, o.copy||{});
    const SET=Object.assign({ secondsPerCard:8, coinsPerCard:500, streakDouble:3, streakTriple:6, secondLook:true }, o.settings||{});
    const cardMs = SET.secondsPerCard ? 1000*SET.secondsPerCard : 0;
    const el=h('div',{class:'sz-sort'+(o.className?' '+o.className:'')}); host.append(el);
    const setTex=()=>el.style.setProperty('--sort-tex', `url(${sortTexture()})`); setTex(); const offTheme=api.on('theme', setTex);
    const R={ rounds:o.rounds, ri:0, total:o.rounds.reduce((s,r)=>s+r.cards.length,0), done:0, right:0, streak:0, best:0, earned:0, fastest:Infinity, missed:[], roundRight:[] };
    let S=null, view=null, over=false;
    const later=(f,ms)=>api.later(()=>{ if(!over) f(); },ms);
    function clear(){ el.innerHTML=''; view=null; S=null; }
    function finish(){ if(over) return; over=true; document.removeEventListener('keydown',keyH); offTheme&&offTheme(); el.remove(); window.__sort=null; resolve(R); }
    function showBetween(){
      clear(); view='panel';
      const prev=R.rounds[R.ri-1], next=R.rounds[R.ri];
      panel(el,{ eyebrow:fillT(C.roundOf,{n:R.ri,total:R.rounds.length})+' · '+prev.name, text:fillT(C.roundDone,{right:R.roundRight[R.ri-1], total:prev.cards.length}),
        body:h('div',{}, h('div',{class:'sz-tally'}, `${R.roundRight[R.ri-1]} / ${prev.cards.length}`), h('div',{class:'eyebrow',style:'margin:16px 0 8px'}, fillT(C.roundOf,{n:R.ri+1,total:R.rounds.length})), SZ.deckBlock(next,{copy:C})),
        buttons:[{ label:C.nextRound, onClick:()=>playRound(R.ri) }] });
    }
    function showSecondLookOffer(){
      clear(); view='panel';
      panel(el,{ eyebrow:C.secondLookTitle, title:R.missed.length===1?C.secondLookOne:fillT(C.secondLookMany,{n:R.missed.length}), text:C.secondLookLede,
        buttons:[{ label:C.secondLookGo, onClick:()=>playSecondLook(0) },{ label:C.skipSecondLook, kind:'ghost', onClick:finish }] });
    }
    function buildTable(r, label){
      clear(); view='play';
      const sLeft=h('b',{},'0'), sStreak=h('b',{},'0'), sMult=h('b',{class:'up'},'x1');
      const bar=h('div',{class:'bar'}, h('div',{class:'rnd'}, h('small',{},label), h('b',{}, r.name)),
        h('div',{class:'sz-stat'},h('small',{},C.cardsLeft),sLeft), h('div',{class:'sz-stat'},h('small',{},C.streak),sStreak), h('div',{class:'sz-stat'},h('small',{},C.coins),sMult));
      const progI=h('i'); const prog=h('div',{class:'prog',role:'progressbar','aria-label':'Progress'}, progI);
      const pileL=h('div',{class:'pile l'},h('span',{class:'lab'},r.left),h('span',{class:'cnt'},'0')), pileR=h('div',{class:'pile r'},h('span',{class:'lab'},r.right),h('span',{class:'cnt'},'0'));
      const stack=h('div',{class:'stack'}); const arena=h('div',{class:'arena'+(o.line?' line':'')}, pileL, stack, pileR);
      const bL=h('button',{class:'sz-btn ghost',onclick:()=>answer('left')},'← '+r.left), bR=h('button',{class:'sz-btn ghost',onclick:()=>answer('right')},r.right+' →');
      const msg=h('p',{class:'msg',role:'status'}, C.swipe);
      el.append(bar, prog, arena, h('div',{class:'btns'},bL,bR), msg);
      return { sLeft, sStreak, sMult, progI, pileL, pileR, stack, arena, msg };
    }
    function playRound(ri){
      R.ri=ri; const r=R.rounds[ri];
      const label = R.rounds.length>1 ? fillT(C.roundOf,{n:ri+1,total:R.rounds.length}) : (o.label||C.deckLabel);
      const T=buildTable(r, label);
      S={ r, T, q:shuffle(r.cards), idx:0, right:0, busy:false, counts:{left:0,right:0}, t0:0, elapsed:0, dragging:false, second:false, hinted:ri===0 && o.hint!==false };
      fillStack(); hud(); beginTimer();
    }
    function playSecondLook(gi){
      const groups=R.rounds.map(r=>({ r, cards:R.missed.filter(c=>c._round===r) })).filter(g=>g.cards.length);
      const g=groups[gi]; if(!g) return finish();
      const T=buildTable(g.r, C.secondLookTitle+(groups.length>1?' · '+(gi+1)+'/'+groups.length:''));
      S={ r:g.r, T, q:g.cards.slice(), idx:0, right:0, busy:false, counts:{left:0,right:0}, t0:0, elapsed:0, dragging:false, second:true, hinted:false, gi, groups:groups.length };
      fillStack(); hud(); beginTimer();
    }
    function fillStack(){ S.T.stack.innerHTML=''; for(let k=0;k<Math.min(3,S.q.length);k++) S.T.stack.append(makeCard(S.q[k],k)); layoutStack(); }
    function makeCard(c,k){
      const r = S.second ? c._round : S.r; const no=r.cards.findIndex(x=>x.id===c.id)+1;
      const timer=h('div',{class:'timer'+(S.second||!cardMs?' off':'')},h('i'));
      const front=h('div',{class:'face front'+(c.art?'':' noart')}, h('div',{}, timer, h('div',{class:'corner'}, h('span',{},String(no).padStart(2,'0')), h('small',{},r.name.toUpperCase()))),
        c.art ? h('div',{class:'art'}, h('img',{class:'ink-art',src:SZ.asset('cards/'+c.art+'.webp'),alt:'',draggable:'false'})) : h('div',{class:'art'}),
        h('div',{class:'txt'},c.text), h('div',{class:'serialn'}, h('span',{},String(r.key||'').toUpperCase()+' '+String(no*7919%1000000).padStart(6,'0')), h('span',{},'₹')));
      const gotIt=h('button',{class:'sz-btn ghost',tabindex:'-1',onclick:e=>{ e.stopPropagation(); if(card._cont) card._cont(); }}, C.gotIt);
      const back=h('div',{class:'face back'}, h('div',{class:'verdict'},C.notQuite), h('h4',{},fillT(C.itIs,{pile:c.answer==='left'?r.left:r.right})), h('p',{},c.why), h('div',{class:'item'},c.text), gotIt);
      const card=h('div',{class:'nc'+(k?' under':''),tabindex:k?'-1':'0','aria-label':c.text}, h('div',{class:'inner'},front,back));
      card._c=c; card._r=r; card._timer=timer.firstChild; card._got=gotIt;
      return card;
    }
    function layoutStack(){ const st=S.T.stack; [...st.children].forEach((c,k)=>{ c.classList.toggle('under',k>0); c.style.zIndex=String(10-k); if(!c._dragging) c.style.transform=`translateY(${k*9}px) scale(${1-k*.045})`; c.style.transition='transform .3s cubic-bezier(.2,.9,.3,1.1)'; c.tabIndex=k?-1:0; }); const top=st.firstElementChild; if(top){ bindDrag(top); if(S.hinted && !top._hint){ top._hint=true; S.T.arena.append(h('div',{class:'hint'}, '← '+S.r.left, h('span',{style:'opacity:.5'},'·'), S.r.right+' →')); } } }
    function mult(){ return R.streak>=SET.streakTriple?3:R.streak>=SET.streakDouble?2:1; }
    function hud(){ const left=S.q.length-S.idx; S.T.sLeft.textContent=String(left); S.T.sStreak.textContent=String(R.streak); S.T.sMult.textContent=S.second?'-':'x'+mult();
      S.T.progI.style.width=((S.second ? S.idx/S.q.length : R.done/R.total)*100)+'%'; }
    function beginTimer(){ const top=S.T.stack.firstElementChild; if(!top) return; S.t0=null; S.elapsed=0; if(S.second||!cardMs) return; let lastSec=99; const mine=S;
      api.raf(t=>{ if(over || S!==mine || S.T.stack.firstElementChild!==top) return false; if(S.t0==null) S.t0=t; if(S.dragging||S.busy||SZ.paused){ S.t0=t-S.elapsed; return true; }
        S.elapsed=t-S.t0; const left=Math.max(0,cardMs-S.elapsed); const bar=top._timer; bar.style.transform=`scaleX(${left/cardMs})`; bar.classList.toggle('low',left<2000);
        const sec=Math.ceil(left/1000); if(sec<=3 && sec!==lastSec && left>0){ lastSec=sec; SZ.sfx('tick'); }
        if(left<=0){ answer('timeout'); return false; } return true; }); }
    function bindDrag(card){
      if(card._bound) return; card._bound=true;
      let x0=0,y0=0,dx=0,dy=0,samples=[],down=false;
      card.addEventListener('pointerdown',e=>{ if(!S||S.busy||card!==S.T.stack.firstElementChild) return; down=true; card._dragging=true; S.dragging=true; x0=e.clientX; y0=e.clientY; dx=dy=0; samples=[[e.clientX,performance.now()]]; try{ card.setPointerCapture(e.pointerId); }catch(err){} card.style.transition='none'; SZ.sfx('click'); });
      card.addEventListener('pointermove',e=>{ if(!down) return; dx=e.clientX-x0; dy=e.clientY-y0; samples.push([e.clientX,performance.now()]); if(samples.length>6) samples.shift();
        card.style.transform=`translate(${dx}px,${dy*.25}px) rotate(${dx/14}deg)`; const lean=Math.abs(dx)>40; S.T.pileL.classList.toggle('hot',lean&&dx<0); S.T.pileR.classList.toggle('hot',lean&&dx>0); });
      const up=()=>{ if(!down) return; down=false; card._dragging=false; if(!S) return; S.dragging=false; S.T.pileL.classList.remove('hot'); S.T.pileR.classList.remove('hot');
        const a=samples[0], b=samples[samples.length-1]; const vx=b&&a&&b[1]>a[1]?(b[0]-a[0])/(b[1]-a[1]):0;
        const w=S.T.arena.clientWidth; if(Math.abs(dx)>Math.min(100,w*.22) || (Math.abs(vx)>.5 && Math.sign(vx)===Math.sign(dx) && Math.abs(dx)>20)) answer(dx<0?'left':'right',{vx,dx,dy});
        else { card.style.transition='transform .5s cubic-bezier(.2,1.6,.35,1)'; card.style.transform='translate(0,0) rotate(0)'; } };
      card.addEventListener('pointerup',up); card.addEventListener('pointercancel',up);
    }
    function flyTo(card, side, from, cb){
      const w=S.T.arena.clientWidth; const dir=side==='left'?-1:1; const fx=from?from.dx:0, fy=from?from.dy*.25:0; const rot0=fx/14;
      const v=from?Math.max(.8,Math.min(3,Math.abs(from.vx))):1.2; const dur=reduced()?1:Math.max(180,420/v);
      card.animate([{transform:`translate(${fx}px,${fy}px) rotate(${rot0}deg)`},{transform:`translate(${dir*(w*.75)}px,${fy+40}px) rotate(${dir*28}deg) scale(.6)`,opacity:0}],{duration:dur,easing:'cubic-bezier(.3,.6,.4,1)',fill:'forwards'});
      later(cb, dur+20);
    }
    function answer(side, drag){
      if(!S || S.busy || view!=='play') return; const card=S.T.stack.firstElementChild; if(!card) return; S.busy=true;
      const c=card._c, r=card._r; const T=S.T; const pile=c.answer==='left'?T.pileL:T.pileR; const pileName=c.answer==='left'?r.left:r.right;
      const took=performance.now()-S.t0; const ok = side===c.answer;
      const hn=T.arena.querySelector('.hint'); if(hn) hn.remove(); S.hinted=false;
      if(!S.second){
        R.done++; api.record({ item:c.id, part:'sort', round:r.key, text:c.text, choice: side==='timeout'?null:(side==='left'?r.left:r.right), expected:pileName, correct:ok, timedOut:side==='timeout', ms:Math.round(took) });
        api.progress(R.done, R.total, { part:'sort', round:r.key, right:R.right+(ok?1:0) });
      }
      if(ok){
        if(!S.second){ R.streak++; R.best=Math.max(R.best,R.streak); R.right++; S.right++; R.fastest=Math.min(R.fastest,took); }
        const gain = S.second ? 0 : SET.coinsPerCard*mult(); R.earned+=gain;
        SZ.sfx(side==='left'?'swipeL':'whoosh'); api.haptic('light');
        flyTo(card, side, drag, ()=>{ bumpPile(pile, c.answer); if(gain) api.earn(gain, pile); next(card); });
        T.msg.className='msg good'; T.msg.textContent=`${pileName}. ${c.why}`;
        if(!S.second){ if(R.streak===SET.streakDouble) later(()=>SZ.stamp('x2','gold'),120); else if(R.streak===SET.streakTriple) later(()=>SZ.stamp('x3','gold'),120); }
      } else {
        const wasStreak=R.streak; if(!S.second){ R.streak=0; R.missed.push(Object.assign({}, c, { _round:r })); }
        SZ.sfx('wrong'); api.haptic('error');
        if(drag){ card.style.transition='transform .35s cubic-bezier(.2,1.4,.35,1)'; card.style.transform='translate(0,0) rotate(0)'; }
        card.querySelector('.verdict').textContent = side==='timeout' ? C.outOfTime : C.notQuite;
        later(()=>{ card.classList.add('flip'); SZ.sfx('flip'); card._got.tabIndex=0; card._got.focus({preventScroll:true}); }, drag?220:0);
        T.msg.className='msg bad'; T.msg.textContent=(wasStreak>=SET.streakDouble&&!S.second?C.streakReset:'')+(side==='timeout'?C.timeoutMsg:C.missedMsg);
        let went=false; const cont=()=>{ if(went) return; went=true; card._cont=null; card.classList.remove('flip'); card.style.transition='none'; flyTo(card, c.answer, null, ()=>{ bumpPile(pile, c.answer); next(card); }); };
        card._cont=cont; card.addEventListener('click', ()=>{ if(card.classList.contains('flip')) cont(); });
        later(cont, o.readMs||6000);
      }
      hud();
    }
    function bumpPile(pile, side){ pile.querySelector('.cnt').textContent=String(++S.counts[side]); pile.classList.remove('pop'); void pile.offsetWidth; pile.classList.add('pop'); }
    function next(card){
      card.remove(); S.idx++;
      const nc=S.q[S.idx+2]; if(nc) S.T.stack.append(makeCard(nc,3));
      S.busy=false; hud();
      if(!S.T.stack.firstElementChild) return endRound();
      layoutStack(); beginTimer();
    }
    function endRound(){
      if(S.second) return (S.gi+1<S.groups) ? later(()=>playSecondLook(S.gi+1), 300) : later(finish, 250);
      R.roundRight[R.ri]=S.right;
      if(R.ri+1<R.rounds.length){ R.ri++; return later(showBetween, 350); }
      if(R.right===R.total){ SZ.stamp(o.perfectStamp||'SORTED','good'); SZ.confetti(S.T.stack); return later(finish, 1000); }
      if(SET.secondLook && R.missed.length) return later(showSecondLookOffer, 350);
      later(finish, 250);
    }
    const keyH=e=>{ if(over||api.session.dead||document.querySelector('.result')||view!=='play') return; if(e.key==='ArrowLeft'){ answer('left'); e.preventDefault(); } else if(e.key==='ArrowRight'){ answer('right'); e.preventDefault(); } };
    document.addEventListener('keydown',keyH); (api.session.offs=api.session.offs||[]).push(()=>{ over=true; document.removeEventListener('keydown',keyH); });
    /* test hooks */
    window.__sort={ get S(){return S;}, R, answer, right:()=>S&&S.T.stack.firstElementChild?S.T.stack.firstElementChild._c.answer:null, gotIt:()=>{ const c=S&&S.T.stack.firstElementChild; if(c&&c._cont) c._cont(); } };
    playRound(0);
  });
}

/* ---------- Pick it: one card at a time, tap the right answer ----------
   api.pick(host, { items:[{ id, text, sub, art, chart, options:[..], answer:index, why }], settings:{ secondsPerItem, coinsPer }, copy })
   resolves { right, total, best, missed }. art is an image in assets/cards/; chart is a function(canvas) that draws on it. */
const PICK_COPY = { itemOf:'{n} of {total}', right:'Right', notQuite:'Not quite', itIs:'It is: {a}.', next:'Next', finish:'See my result', streak:'Streak', coins:'Coins', outOfTime:'Out of time' };
/* a plain price line for pick cards: { line:[prices], level:optional horizontal price } */
function drawLine(cv, spec){ const {g,w,h:hh}=fitCanvas(cv); const c=SZ.colors(); const L=spec.line||[]; if(!L.length) return; const lv=spec.level;
  let lo=Math.min(...L, lv??Infinity), hi=Math.max(...L, lv??-Infinity); const pad=(hi-lo)*.12||1; lo-=pad; hi+=pad;
  const X=i=>8+(w-16)*i/(L.length-1), Y=v=>8+(hh-16)*(1-(v-lo)/(hi-lo));
  g.strokeStyle=c.line; g.lineWidth=1; for(let k=1;k<4;k++){ g.beginPath(); g.moveTo(8,hh*k/4); g.lineTo(w-8,hh*k/4); g.stroke(); }
  if(lv!=null){ g.save(); g.setLineDash([6,5]); g.strokeStyle=c.down; g.lineWidth=1.5; g.beginPath(); g.moveTo(8,Y(lv)); g.lineTo(w-8,Y(lv)); g.stroke(); g.restore(); g.fillStyle=c.down; g.font='600 11px '+getComputedStyle(document.documentElement).getPropertyValue('--ui'); g.fillText('₹'+lv, 10, Y(lv)-6); }
  g.strokeStyle=c.ink; g.lineWidth=2.2; g.lineJoin='round'; g.beginPath(); L.forEach((v,i)=>i?g.lineTo(X(i),Y(v)):g.moveTo(X(i),Y(v))); g.stroke();
  g.fillStyle=c.up; g.beginPath(); g.arc(X(L.length-1),Y(L[L.length-1]),4,0,Math.PI*2); g.fill(); }
SZ.drawLine = drawLine;
function picker(host, o, api){
  return new Promise(resolve=>{
    const C=Object.assign({}, PICK_COPY, o.copy||{}); const SET=Object.assign({ secondsPerItem:0, coinsPer:500 }, o.settings||{});
    const items=o.shuffle===false?o.items.slice():shuffle(o.items); const R={ right:0, total:items.length, best:0, streak:0, missed:[] };
    const el=h('div',{class:'sz-pick'}); host.append(el);
    const sN=h('b',{},'1 / '+items.length), sS=h('b',{},'0');
    const progI=h('i'); el.append(h('div',{class:'bar'}, h('div',{class:'sz-stat'},h('small',{},o.label||'Card'),sN), h('div',{class:'sz-stat'},h('small',{},C.streak),sS)), h('div',{class:'prog'},progI));
    const card=h('div',{class:'pk-card'}); const opts=h('div',{class:'pk-opts'}); const fb=h('div',{class:'pk-fb',role:'status','aria-live':'polite'});
    el.append(card, opts, fb);
    let k=0, busy=false;
    function show(){
      const it=items[k]; busy=false; sN.textContent=(k+1)+' / '+items.length; progI.style.width=(k/items.length*100)+'%';
      card.innerHTML=''; fb.innerHTML=''; fb.className='pk-fb';
      if(it.art) card.append(h('img',{class:'ink-art',src:SZ.asset('cards/'+it.art+'.webp'),alt:''}));
      if(it.chart){ const cv=h('canvas',{class:'pk-chart'}); card.append(cv); requestAnimationFrame(()=>typeof it.chart==='function'?it.chart(cv):drawLine(cv,it.chart)); }
      if(it.kicker) card.append(h('small',{class:'kicker'}, it.kicker));
      card.append(h('b',{class:'pk-text'}, it.text)); if(it.sub) card.append(h('span',{class:'pk-sub'}, it.sub));
      card.classList.remove('in'); void card.offsetWidth; card.classList.add('in');
      opts.innerHTML=''; opts.className='pk-opts n'+it.options.length;
      it.options.forEach((t,i)=>opts.append(h('button',{class:'sz-btn ghost pk-opt',type:'button',onclick:e=>answer(i,e.currentTarget)}, t)));
      window.__pick={ right:()=>it.answer };
    }
    function answer(i, btn){
      if(busy) return; busy=true; const it=items[k]; const ok=i===it.answer;
      api.record({ id:it.id, correct:ok, choice:i, answer:it.answer });
      $$('.pk-opt',opts).forEach((b,j)=>{ b.disabled=true; if(j===it.answer) b.classList.add('right'); else if(j===i) b.classList.add('wrong'); });
      if(ok){ R.right++; R.streak++; R.best=Math.max(R.best,R.streak); api.earn(SET.coinsPer*(R.streak>=3?2:1), btn); SZ.sfx('rise'); api.haptic('success'); if(R.streak===3) api.later(()=>SZ.stamp('x2','gold'),150); }
      else { R.streak=0; R.missed.push(it); SZ.sfx('wrong'); api.haptic('warning'); SZ.shake(card); }
      sS.textContent=String(R.streak);
      fb.className='pk-fb on '+(ok?'good':'bad');
      fb.append(h('b',{}, ok?C.right:C.notQuite), h('span',{}, (ok?'':fillT(C.itIs,{a:it.options[it.answer]})+' ')+(it.why||'')));
      const last=k===items.length-1;
      fb.append(h('button',{class:'sz-btn',type:'button',onclick:()=>{ SZ.sfx('click'); if(last){ progI.style.width='100%'; el.remove(); resolve(R); } else { k++; show(); } }}, last?C.finish:C.next));
      api.progress(k+1, items.length);
    }
    show();
  });
}
SZ.pick = picker;


/* ---------- Ready-made game shapes, driven entirely by content.js ----------
   A new game can be one line: SZ.register({ ..., mount:(root,api)=>SZ.shapes.sort(root,api) }).
   sort: rounds of two-pile cards. pick: one card at a time, tap the answer. rail: guess a number on the line.
   final: a rapid round, then applied questions, scored by marks. All open with the direct-start guide and, in lesson
   mode, end with the module's own quiz and pass rule. */
SZ.pickReview = function(missed, title){ if(!missed||!missed.length) return null; return h('div',{class:'sz-review'}, h('h4',{},title||'Cards to remember'), missed.map(c=>h('div',{class:'it'}, h('b',{},c.text), h('span',{}, h('i',{}, c.options[c.answer]+'. '), c.why||'')))); };
function shapeEnd(el, api, score, max, o){
  if(api.mode==='lesson' && hasQuiz()) return api.lessonEnd(el,{ copy:o.copy, perfect:o.perfect, badge:o.perfect, taskDone:true,
    summary:h('div',{}, h('div',{class:'sz-tally'}, `${score} / ${max}`, o.unit?h('small',{}, o.unit):null)),
    titles:o.titles||{}, stats:o.stats||[], extra:o.extra||null, details:Object.assign({ activity:{ score, max } }, o.details||{}) });
  return api.finish({ score, max, badge:o.perfect, title:o.title, text:o.text, stats:o.stats, extra:o.extra, details:o.details });
}
const FMT = { inr:v=>inr(v), lakh:v=>lakh(v), pct:v=>(Math.round(v*10)/10)+'%', x:v=>(Math.round(v*10)/10)+'x', num:v=>Math.round(v).toLocaleString('en-IN'), yrs:v=>Math.round(v)+' yrs' };
SZ.shapes = {
  sort(root, api){
    const G=api.data, C=G.copy||{}; const el=h('div',{class:'g-sh fitcol'}); root.append(el);
    api.intro(el,{ eyebrow:C.eyebrow, title:C.title, text:C.text, start:C.start, copy:C, onStart:()=>{ el.innerHTML='';
      api.sort(el,{ rounds:G.rounds, settings:G.settings, copy:C }).then(R=>shapeEnd(el, api, R.right, R.total, { copy:C, perfect:R.right===R.total, unit:C.unit||'right first time', titles:C.titles, title:C.resultTitle,
        stats:[[C.statRight||'Right first time',`${R.right}/${R.total}`],[C.statStreak||'Best streak',String(R.best)]], extra:SZ.sortReview(R.missed, C.reviewTitle), details:{ cards:{ right:R.right, total:R.total } } })); } });
  },
  pick(root, api){
    const G=api.data, C=G.copy||{}; const el=h('div',{class:'g-sh fitcol'}); root.append(el);
    api.intro(el,{ eyebrow:C.eyebrow, title:C.title, text:C.text, start:C.start, copy:C, onStart:()=>{ el.innerHTML='';
      api.pick(el,{ items:G.items, settings:G.settings, copy:C, label:C.label, shuffle:G.shuffle }).then(R=>shapeEnd(el, api, R.right, R.total, { copy:C, perfect:R.right===R.total, unit:C.unit||'right', titles:C.titles, title:C.resultTitle,
        stats:[[C.statRight||'Right',`${R.right}/${R.total}`],[C.statStreak||'Best streak',String(R.best)]], extra:SZ.pickReview(R.missed, C.reviewTitle), details:{ items:{ right:R.right, total:R.total } } })); } });
  },
  rail(root, api){
    const G=api.data, C=G.copy||{}, SET=Object.assign({ tolerance:.15, coinsPer:1000 }, G.settings||{});
    const el=h('div',{class:'g-sh g-rl'}); root.append(el);
    const total=G.rounds.length; let k=0, hits=0, rail=null;
    const sN=h('b',{},'1 / '+total), sH=h('b',{},'0');
    const hud=h('div',{class:'sz-hud'}, h('div',{class:'sz-stat'}, h('small',{}, C.roundLabel||'Round'), sN), h('div',{class:'sz-stat'}, h('small',{}, C.hitsLabel||('Within '+Math.round(SET.tolerance*100)+'%')), sH));
    const card=h('div',{class:'sz-card rl-card'}), val=h('div',{class:'rl-val','aria-live':'polite'}), railHost=h('div',{class:'rl-rail'});
    const lock=h('button',{class:'sz-btn big rl-lock',type:'button'}, C.lock||'Lock my guess'); const fb=h('div',{class:'pk-fb rl-fb',role:'status'});
    el.append(hud, card, val, railHost, h('div',{class:'go'}, lock), fb);
    function show(){
      const r=G.rounds[k]; const f=FMT[r.fmt]||FMT.inr; sN.textContent=(k+1)+' / '+total;
      card.innerHTML=''; if(r.art) card.append(h('img',{class:'ink-art',src:SZ.asset('cards/'+r.art+'.webp'),alt:''}));
      if(r.kicker) card.append(h('small',{class:'kicker'}, r.kicker)); card.append(h('b',{class:'rl-q'}, r.prompt));
      if(r.givens) card.append(h('div',{class:'rl-givens'}, r.givens.map(([a,b])=>h('div',{}, h('small',{},a), h('b',{},b)))));
      railHost.innerHTML=''; rail=api.rail({ lo:r.lo, hi:r.hi, fmt:f, short:FMT[r.short]||f, label:r.prompt, onChange:v=>{ val.textContent=f(v); }, onEnter:()=>lock.click(), start:r.start??.5 });
      window.__railq={ answer:()=>r.answer, set:v=>{ rail.set(v); val.textContent=f(v); } };
      railHost.append(rail.el); rail.unlock(); val.textContent=f(rail.value()); lock.hidden=false; lock.disabled=false; fb.className='pk-fb rl-fb'; fb.innerHTML='';
      card.classList.remove('in'); void card.offsetWidth; card.classList.add('in');
    }
    lock.onclick=()=>{ const r=G.rounds[k]; rail.lock(); lock.hidden=true; const g=rail.value(); const hit=Math.abs(g-r.answer)/Math.abs(r.answer)<=(r.tolerance??SET.tolerance);
      if(hit){ hits++; api.earn(SET.coinsPer, lock); SZ.sfx('rise'); api.haptic('success'); } else { SZ.sfx('fall'); api.haptic('warning'); }
      sH.textContent=String(hits); api.record({ id:r.id, correct:hit, guess:Math.round(g), answer:r.answer }); api.progress(k+1,total); rail.reveal(r.answer, hit);
      api.later(()=>{ fb.className='pk-fb rl-fb on '+(hit?'good':'bad'); const last=k===total-1;
        fb.append(h('b',{}, hit?(C.hit||'Close enough'):(C.miss||'Off the mark')), h('span',{}, r.why||''), h('button',{class:'sz-btn',type:'button',onclick:()=>{ SZ.sfx('click'); if(last) end(); else { k++; show(); } }}, last?(C.finish||'See my result'):(C.next||'Next')));
        fb.scrollIntoView({block:'nearest',behavior:'smooth'}); }, 1000); };
    function end(){ el.innerHTML=''; shapeEnd(el, api, hits, total, { copy:C, perfect:hits===total, unit:C.unit||('within '+Math.round(SET.tolerance*100)+'%'), titles:C.titles, title:C.resultTitle, stats:[[C.statHits||'Close guesses',`${hits}/${total}`]] }); }
    api.intro(el,{ eyebrow:C.eyebrow, title:C.title, text:C.text, start:C.start, copy:C, onStart:show });
  },
  final(root, api, def){
    const G=api.data, C=G.copy||{}, F=G.final; const el=h('div',{class:'g-sh fitcol'}); root.append(el);
    const A=F.partA, B=F.partB, marks=q=>q.marks||1, totalMarks=A.concat(B).reduce((s,q)=>s+marks(q),0), passMarks=Math.ceil(totalMarks*(F.passShare||.6));
    const items=A.map(q=>({ id:q.id, kicker:q.topic||'', text:q.stem||q.prompt, options:q.options, answer:q.answer, why:q.explanation, marks:marks(q) }));
    api.intro(el,{ eyebrow:C.eyebrow, title:C.title, text:C.text, start:C.start, copy:C, check:false, onStart:()=>{ el.innerHTML='';
      api.pick(el,{ items, settings:{ coinsPer:300 }, copy:Object.assign({}, C, { finish:C.toPartB||'On to Part B' }), label:C.partALabel||'Part A', shuffle:false }).then(RA=>{
        const aMarks=items.filter(it=>!RA.missed.includes(it)).reduce((s,it)=>s+it.marks,0);
        el.innerHTML='';
        panel(el,{ eyebrow:C.partBEyebrow||'Part B · Applied', title:fillT(C.partBTitle||'{n} real situations',{n:B.length}), text:fillT(C.partBText||'Part A: {a} of {at} marks. These are worth more. Read each one, then answer.',{a:aMarks,at:items.reduce((s,it)=>s+it.marks,0)}),
          buttons:[{ label:C.partBGo||'Start Part B', onClick:()=>{ el.innerHTML=''; check(el,{ questions:B, eyebrow:C.partBEyebrow||'Part B · Applied' }, api).then(RB=>{
            const bMarks=B.filter((q,i)=>!RB.missed.includes(i+1)).reduce((s,q)=>s+marks(q),0); const got=aMarks+bMarks; const share=got/totalMarks;
            const RM=F.resultMessages||{}; const band = share>=(F.passShare||.6) ? 'pass' : share>=(F.borderShare||.5) ? 'borderline' : 'fail';
            const msg=(RM[band]&&RM[band].text)||''; const passed=band==='pass';
            api.finish({ score:got, max:totalMarks, passed, passMark:passMarks/totalMarks, badge:passed, delay:400, title: passed?(C.passTitle||'Course complete'):band==='borderline'?(C.borderTitle||'Nearly there'):(C.failTitle||'Not yet'), text:msg,
              stats:[[C.statA||'Part A',`${aMarks}/${items.reduce((s,it)=>s+it.marks,0)}`],[C.statB||'Part B',`${bMarks}/${B.reduce((s,q)=>s+marks(q),0)}`],[C.statTotal||'Total',`${got}/${totalMarks}`]],
              details:{ final:{ partA:aMarks, partB:bMarks, total:got, max:totalMarks, passMarks, band } } });
          }); } }] });
      }); } });
  }
};

/* ---------- Guess rail: drag a coin to a guess, then the true value slides in ----------
   const rail = api.rail({ lo, hi, fmt, short, label, onChange }); host.append(rail.el);
   rail.setRange(lo, hi, fmt, short) for a new round, rail.value(), rail.set(v), rail.lock(), rail.unlock(),
   rail.reveal(answer, hit) animates the truth pin and the gap between guess and truth. */
function rail(o){
  const STEPS=1000; let lo=o.lo, hi=o.hi, fmt=o.fmt||(v=>inr(v)), short=o.short||fmt; let pos=500, locked=true, lastTick=-1;
  const ticks=h('div',{class:'ticks'}); for(let k=0;k<=20;k++){ ticks.append(h('i',{class:k%5===0?'maj':'',style:`left:${k*5}%`})); }
  const labels=h('div',{class:'labels'}); const gap=h('div',{class:'gap'});
  const pinG=h('div',{class:'pin guess'}, h('div',{class:'stem'}), h('div',{class:'head'}));
  const truthFlag=h('div',{class:'flag'}); const pinT=h('div',{class:'pin truth',hidden:true}, truthFlag, h('div',{class:'stem'}), h('div',{class:'head'}));
  const el=h('div',{class:'sz-rail locked',role:'slider',tabindex:'0','aria-label':o.label||'Your guess','aria-valuemin':'0','aria-valuemax':String(STEPS)}, h('div',{class:'track'}), gap, ticks, labels, pinG, pinT);
  const valAt=p=>lo+(hi-lo)*(p/STEPS); const posOf=v=>clamp((v-lo)/(hi-lo)*STEPS,0,STEPS);
  function setPos(p, sound){ p=Math.round(clamp(p,0,STEPS)); pos=p; pinG.style.left=(p/STEPS*100)+'%'; const v=valAt(p); el.setAttribute('aria-valuenow',String(p)); el.setAttribute('aria-valuetext',fmt(v)); const b=Math.floor(p/25); if(sound && b!==lastTick){ lastTick=b; SZ.sfx('tick'); } o.onChange&&o.onChange(v); }
  const fromEvent=e=>{ const r=el.getBoundingClientRect(); return (e.clientX-r.left)/r.width*STEPS; };
  let dragging=false;
  el.addEventListener('pointerdown',e=>{ if(locked) return; dragging=true; el.classList.add('drag'); try{ el.setPointerCapture(e.pointerId); }catch(err){} setPos(fromEvent(e),true); });
  el.addEventListener('pointermove',e=>{ if(dragging) setPos(fromEvent(e),true); });
  const end=()=>{ dragging=false; el.classList.remove('drag'); }; el.addEventListener('pointerup',end); el.addEventListener('pointercancel',end);
  el.addEventListener('keydown',e=>{ if(locked) return; const st={ArrowLeft:-10,ArrowDown:-10,ArrowRight:10,ArrowUp:10,PageDown:-100,PageUp:100,Home:-STEPS,End:STEPS}[e.key]; if(st!=null){ e.preventDefault(); setPos(pos+st,true); } else if(e.key==='Enter'&&o.onEnter){ e.preventDefault(); o.onEnter(); } });
  const api={ el,
    setRange(l,hh,f,s,start){ lo=l; hi=hh; if(f) fmt=f; short=s||f||short; labels.innerHTML=''; [0,.25,.5,.75,1].forEach(q=>labels.append(h('span',{style:`left:${q*100}%`}, short(lo+(hi-lo)*q)))); pinT.hidden=true; pinT.classList.remove('drop'); gap.className='gap'; gap.style.width='0'; setPos(STEPS*(start??.5),false); },
    value:()=>valAt(pos), set:v=>setPos(posOf(v),false), setFrac:f=>setPos(f*STEPS,false),
    lock(){ locked=true; el.classList.add('locked'); }, unlock(){ locked=false; el.classList.remove('locked'); },
    truthPin:pinT,
    reveal(ans, hit){ const gp=pos, tp=posOf(ans); truthFlag.textContent=fmt(ans); truthFlag.style.transform = tp<120?'translateX(-18%)':tp>880?'translateX(-82%)':'';
      pinT.style.transition='none'; pinT.style.left=(gp/STEPS*100)+'%'; pinT.hidden=false; pinT.classList.remove('drop'); void pinT.offsetWidth; pinT.classList.add('drop'); pinT.style.transition='';
      setTimeout(()=>{ pinT.style.left=(tp/STEPS*100)+'%'; SZ.sfx('rise'); },420);
      const l=Math.min(gp,tp), w=Math.abs(tp-gp); gap.style.left=(gp/STEPS*100)+'%'; gap.style.width='0';
      setTimeout(()=>{ gap.classList.toggle('hit',!!hit); gap.classList.add('on'); gap.style.left=(l/STEPS*100)+'%'; gap.style.width=(w/STEPS*100)+'%'; },440); }
  };
  api.setRange(lo,hi,fmt,short,o.start);
  return api;
}
SZ.rail = rail;

/* ---------- one game per page ---------- */
let current=null; /* {sess, inst} */
function makeApi(def, sess){
  const timers=sess.timers;
  const api = {
    mode:SZ.config.mode, config:SZ.config, t:SZ.t, data:(window.STONKZZ_CONTENT&&window.STONKZZ_CONTENT.game)||null,
    earn:(a,src,o)=>SZ.earn(a,src,o), sfx:SZ.sfx, haptic:SZ.haptic, stamp:SZ.stamp, confetti:SZ.confetti, shake:SZ.shake, toast:SZ.toast, floater:SZ.floater, countUp:SZ.countUp,
    fmt:SZ.fmt, util:SZ.util, shuffle, clamp, h, $, $$, chart:SZ.chart, colors:SZ.colors, people:SZ.people, asset:SZ.asset, content:SZ.content(def.course), rosette:SZ.rosette,
    best:()=>store.best, capital:()=>earnedTotal, session:sess, paused:()=>SZ.paused,
    later:(f,ms)=>{ if(sess.held){ sess.heldQ.push(()=>api.later(f,ms)); return -1; } const t=setTimeout(()=>{ if(!sess.dead) f(); },ms); timers.push(['t',t]); return t; },
    every:(f,ms)=>{ if(sess.held){ sess.heldQ.push(()=>api.every(f,ms)); return -1; } const t=setInterval(()=>{ if(!sess.dead) f(); },ms); timers.push(['i',t]); return t; },
    raf:f=>{ const loop=()=>{ if(sess.dead) return; if(f(performance.now())!==false) sess.rafId=requestAnimationFrame(loop); }; sess.rafId=requestAnimationFrame(loop); },
    clear:()=>{ timers.forEach(([k,t])=>k==='t'?clearTimeout(t):clearInterval(t)); timers.length=0; cancelAnimationFrame(sess.rafId); },
    on:(ev,f)=>{ const off=SZ.on(ev,(d)=>{ if(!sess.dead) f(d); }); (sess.offs=sess.offs||[]).push(off); return off; },
    /* reporting to the app */
    started:()=>{ if(!sess.started){ sess.started=true; sess.t0=Date.now(); send('start',{}); } },
    progress:(done,total,extra={})=>{ send('progress',Object.assign({done,total},extra)); },
    record:(a)=>{ const item=Object.assign({ correct:false }, a); sess.answers.push(item); send('answer', item); return item; },
    /* the module quiz: questions, pass rule and messages from content.js */
    quiz:(window.STONKZZ_CONTENT&&window.STONKZZ_CONTENT.quiz)||null,
    check:(el,o={})=>check(el, Object.assign({ questions:((window.STONKZZ_CONTENT&&window.STONKZZ_CONTENT.quiz)||{}).questions||[] }, o), api),
    quizResult:(res,extra)=>quizResult(res,extra),
    panel:(el,o)=>panel(el,o),
    hasQuiz:()=>hasQuiz(),
    intro:(el,o)=>intro(el,o,api),
    guide:(o)=>guideStart(o,api),
    held:()=>!!sess.held,
    pick:(el,o)=>picker(el,o,api),
    lessonEnd:(el,o)=>lessonEnd(el,o,api,def),
    sort:(el,o)=>sorter(el,o,api),
    rail:o=>rail(o),
    finish:o=>finish(def, sess, o),
    /* done(): what the early games call at the end of their activity. In lesson mode with a quiz, it shows the activity
       score, then runs the module's quick questions and finishes by the course's pass rule; otherwise it finishes as before. */
    done:o=>{ if(api.mode==='lesson' && hasQuiz()){ const root=$('.game-root'); return lessonEnd(root,{ badge:!!o.badge, summary:h('div',{}, h('div',{class:'sz-tally'}, `${o.score??0} / ${o.max??0}`), o.title?h('p',{style:'margin:6px 0 0;color:var(--ink-2)'}, o.title):null), stats:(o.stats||[]).slice(0,2), extra:o.extra||null, details:Object.assign({ activity:{ score:o.score??0, max:o.max??0 } }, o.details||{}) }, api, def); } return finish(def, sess, o); },
    restart:()=>restart(),
    close:()=>exit('close')
  };
  return api;
}
function mount(){
  const def=SZ.def; const root=$('.game-root'); root.innerHTML='';
  $$('.result').forEach(r=>r.remove());
  resetCounter();
  const sess={ id:def.id, earned:0, timers:[], dead:false, t0:Date.now(), answers:[], started:false };
  current={ sess, inst:null };
  store.plays=(store.plays||0)+1; saveStore();
  $('.sz-stage').scrollTop=0;
  const api=makeApi(def, sess); window.__szApi=api; /* test hook */
  try{ current.inst = def.mount(root, api) || {}; }catch(e){ console.error(e); root.append(h('p',{class:'sz-msg bad'},'This game hit an error: '+e.message)); send('error',{message:String(e.message)}); }
}
function teardown(){ if(!current) return; const {sess,inst}=current; sess.dead=true; (sess.offs||[]).forEach(f=>f()); sess.timers.forEach(([k,t])=>k==='t'?clearTimeout(t):clearInterval(t)); cancelAnimationFrame(sess.rafId); try{ inst&&inst.unmount&&inst.unmount(); }catch(e){} $$('.result').forEach(r=>r.remove()); $$('#fx > *').forEach(n=>n.remove()); current=null; }
function restart(){ if(!SZ.def) return; teardown(); mount(); send('restart',{}); }
SZ.restart = restart;
function exit(reason, extra={}){ send('exit', Object.assign({ reason }, extra)); if(!SZ.inHost()) SZ.toast(SZ.t('noHost')); }
SZ.exit = exit;

/* ---------- finish / results ---------- */
function starsFor(score,max){ if(!max) return 1; const r=score/max; return r>=.9?3:r>=.6?2:1; }
function finish(def, sess, o){
  if(sess.dead || sess.finished) return; sess.finished=true;
  const score=o.score??0, max=o.max??0; const passMark=o.passMark??def.passMark??.6;
  const stars=o.stars??starsFor(score,max); const passed=o.passed??(max? score/max>=passMark : true);
  const earned=o.earned??sess.earned;
  const badgeId = o.badge ? (typeof o.badge==='string'?o.badge:def.badge) : null;
  const prev=store.best; const isBest=!prev || score>(prev.score||0) || stars>(prev.stars||0);
  store.best = { score:Math.max(score,prev?.score||0), max, stars:Math.max(stars,prev?.stars||0), earned:Math.max(earned,prev?.earned||0), badge:!!(badgeId||prev?.badge), at:new Date().toISOString() };
  const newBadge = badgeId && !(prev&&prev.badge);
  saveStore();
  send('complete', { course:def.course, module:def.module, score, max, percent:max?Math.round(score/max*100):null, passed, passMark, stars, earned, badge:badgeId, durationMs:Date.now()-sess.t0, answers:sess.answers, best:store.best, details:o.details||null });
  setTimeout(()=>showResult(def, sess, {score,max,stars,passed,earned,badgeId,newBadge,isBest,...o}), o.delay??500);
}
function showResult(def, sess, r){
  if(!current || current.sess!==sess) return;
  const lesson = SZ.config.mode==='lesson';
  const b = r.badgeId && SZ.badges[r.badgeId];
  const card=h('div',{class:'card'});
  const ros=h('canvas',{class:'rosette'}); card.append(ros);
  const stars=h('div',{class:'bigstars',html:Array.from({length:3},(_,i)=>`<svg viewBox="0 0 24 24" class="${i<r.stars?'on':'off'}"><path d="${STAR_PATH}" fill="${i<r.stars?'var(--foil)':'none'}" stroke="${i<r.stars?'var(--foil-lo)':'var(--ink-3)'}" stroke-width="1.2" stroke-linejoin="round"/></svg>`).join('')});
  card.append(stars);
  if(lesson && r.max) card.append(h('div',{class:'verdict'+(r.passed?' pass':'')}, r.passed?SZ.t('passed'):SZ.t('notYet')));
  card.append(h('h3',{},r.title || (r.passed?SZ.t('cleared'):SZ.t('goodAttempt'))));
  const earnedEl=h('div',{class:'earned'},'+0 points'); card.append(h('div',{}, earnedEl, h('span',{class:'earned-l'}, SZ.t('earnedLong') + (r.isBest && r.earned>0 && store.plays>1 ? ' · '+SZ.t('bestNote') : ''))));
  if(r.text) card.append(h('p',{},r.text));
  if(r.stats && r.stats.length) card.append(h('div',{class:'stats'}, r.stats.map(([k,v])=>h('div',{class:'sz-stat'},h('small',{},k),h('b',{},String(v))))));
  if(b){ card.append(h('div',{class:'medal'}, h('div',{class:'win'}, h('img',{src:SZ.badgeArt(b),alt:b.name})))); card.append(h('div',{class:'medal-name'}, (r.newBadge?SZ.t('newMedal'):SZ.t('medal'))+b.name)); card.append(h('div',{class:'medal-how'}, b.how)); }
  if(r.extra) card.append(h('div',{class:'extra'}, r.extra));
  const again=h('button',{class:'sz-btn ghost',onclick:()=>{ SZ.sfx('click'); restart(); }}, lesson?SZ.t('tryAgain'):SZ.t('playAgain'));
  const go=h('button',{class:'sz-btn',onclick:()=>{ SZ.sfx('click'); exit(lesson?'continue':'done', { passed:r.passed, score:r.score, max:r.max }); }}, lesson?SZ.t('continue'):SZ.t('done'));
  if(lesson && !r.passed){ again.classList.remove('ghost'); go.classList.add('ghost'); card.append(h('div',{class:'btns'}, go, again)); }
  else card.append(h('div',{class:'btns'}, again, go));
  const wrap=h('div',{class:'result',role:'dialog','aria-label':r.title||'Result'}, card);
  document.body.append(wrap);
  requestAnimationFrame(()=>SZ.rosette(ros,{accent:SZ.colors()[def.course]}));
  r.passed ? SZ.sfx('win') : SZ.sfx('lose');
  SZ.haptic(r.passed?'success':'warning');
  $$('svg', stars).forEach((s,i)=>setTimeout(()=>{ s.classList.add('in'); if(i<r.stars){ SZ.sfx('star'); } }, 350+i*260));
  setTimeout(()=>SZ.countUp(earnedEl,0,r.earned,900,v=>'+'+pts(v)), 300);
  if(r.stars===3) setTimeout(()=>SZ.confetti(stars, 60), 1100);
  if(b) setTimeout(()=>SZ.sfx('bell'), 1300);
  (lesson && !r.passed ? again : go).focus({preventScroll:true});
}

/* ---------- frame + boot ---------- */
SZ.register = function(def){
  if(!def || !def.id) throw new Error('game needs id');
  if(SZ.def) return; SZ.def=def;
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
};
function boot(){
  const def=SZ.def; loadStore();
  if(typeof store.sound==='boolean' && !(new URLSearchParams(location.search).has('sound')) && !(window.STONKZZ_INIT&&'sound' in window.STONKZZ_INIT)) SZ.config.sound=store.sound;
  const course=SZ.COURSES[def.course]||{short:'',color:'--ink'};
  const modLabel = def.module==='final' ? SZ.t('final') : SZ.t('module')+def.module;
  document.title = def.title+' · Stonkzz School';
  const app=h('div',{class:'sz-app'},
    h('header',{class:'sz-top'},
      h('button',{class:'iconbtn sz-close','aria-label':SZ.t('close'),html:ICON.close,onclick:()=>{ SZ.sfx('click'); exit('close'); }}),
      h('div',{class:'meta'}, h('div',{class:'crs'}, h('span',{class:'dot',style:`background:var(${course.color})`}), course.short+' · '+modLabel), h('h1',{}, def.title)),
      h('div',{class:'sz-earned',id:'sz-earned','aria-live':'polite'}, h('small',{},SZ.t('earned')), h('b',{},pts(0))),
      h('button',{class:'iconbtn',id:'sz-sound',onclick:()=>{ setSound(!soundOn); if(soundOn) SZ.sfx('pop'); }})
    ),
    h('main',{class:'sz-stage'+(def.fit?' fit':'')}, h('div',{class:'game-root'}))
  );
  document.body.prepend(app);
  fxLayer();
  applyConfig(); setSound(SZ.config.sound!==false, true); paperTexture();
  document.addEventListener('pointerdown',()=>audio(),{once:true});
  document.addEventListener('keydown',e=>{ if(e.key==='Escape' && !$('.result')) { /* the app owns back navigation */ } });
  mount();
  send('ready', { course:def.course, module:def.module, title:def.title, version:SZ.version, kitVersion:SZ.version, gameVersion:def.version||'1.0.0', config:{ mode:SZ.config.mode, theme:SZ.config.theme, lang:SZ.config.lang, sound:soundOn, chrome:SZ.config.chrome } });
}
})();
