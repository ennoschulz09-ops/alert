// Smart Lab – Teil 02: KI-Coach: Regeln, Feature-Wichtigkeit, Walk-Forward-Test, Auto-Optimierer, Strategien-Vergleich
// Automatisch aus der ursprünglichen einzelnen index.html aufgeteilt.
// Reihenfolge ist wichtig: diese Dateien werden in genau dieser Reihenfolge geladen
// und teilen sich (wie vorher) denselben globalen Scope - nichts wurde inhaltlich veraendert.

// ---- Ersteller-/Wallet-Tracking ----
let CRW=ld('crw',{});
function crTrack(addr,sol){const cr=(FSX[addr]||{}).cr;if(!cr)return;const c=CRW[cr]=CRW[cr]||{n:0,w:0,sol:0,syms:[]};c.n++;if(sol>0)c.w++;c.sol+=sol;sv('crw',CRW)}
function crHtml(){const rows=Object.entries(CRW).filter(([,c])=>c.n>=2).sort((a,b)=>b[1].sol-a[1].sol);
 if(!rows.length)return`<div class=cd><div class=ch><b>👤 Ersteller-Tracking</b></div><small style="color:var(--m)">Noch keine Ersteller mit 2+ Trades erkannt. Braucht Final-Stretch-Modus (Einstellungen) aktiv, um Ersteller-Adressen zu sehen.</small></div>`;
 return `<div class=cd><div class=ch><b>👤 Ersteller-Tracking</b><span class=ag>nach Gewinn sortiert</span></div>`+
  rows.slice(0,8).map(([cr,c])=>{const wr=Math.round(c.w/c.n*100),tag=c.n>=3&&wr<=30?'⚠️ oft Verlust':c.n>=3&&wr>=70?'✅ oft Gewinn':'';
   return `<div style="display:flex;justify-content:space-between;padding:6px 0;border-top:1px solid #ffffff12"><span>${X(cr.slice(0,4)+'…'+cr.slice(-4))}<br><small style="color:var(--m)">${c.n} Coins · ${wr}% Trefferquote ${tag}</small></span><span style="color:${c.sol>=0?'var(--g)':'#ff5d73'};font-weight:700">${c.sol>=0?'+':'−'}${Math.abs(c.sol).toFixed(3)} SOL</span></div>`}).join('')+`</div>`}

// ---- Feature-Wichtigkeit & Win-Rate-Analyse ----
function corr(xs,ys){const n=xs.length;if(n<8)return null;const mx=xs.reduce((a,v)=>a+v,0)/n,my=ys.reduce((a,v)=>a+v,0)/n;
 let sxy=0,sx=0,sy=0;for(let i=0;i<n;i++){const dx=xs[i]-mx,dy=ys[i]-my;sxy+=dx*dy;sx+=dx*dx;sy+=dy*dy}return(sx&&sy)?sxy/Math.sqrt(sx*sy):null}
function featImpHtml(){const S=smp();if(S.length<10)return`<div class=cd><div class=ch><b>📊 Feature-Wichtigkeit</b></div><small style="color:var(--m)">Sammle noch Daten (${S.length}/10 Trades)</small></div>`;
 const keys=Object.keys(KF),imp=[];for(const k of keys){const xs=[],ys=[];S.forEach(s=>{const v=s.f&&s.f[k];if(v!=null){xs.push(v);ys.push(s.l?0:1)}});const c=corr(xs,ys);if(c!=null)imp.push({k,c,n:xs.length})}
 imp.sort((a,b)=>Math.abs(b.c)-Math.abs(a.c));
 const sb=[[40,55],[55,65],[65,75],[75,101]].map(([a,b])=>{const t=S.filter(s=>s.f&&s.f.score>=a&&s.f.score<b);return{a,b,n:t.length,wr:t.length?Math.round(t.filter(s=>!s.l).length/t.length*100):null}});
 const hb=[['Nacht',0,6],['Morgen',6,12],['Mittag',12,18],['Abend',18,24]].map(([n,a,b])=>{const t=S.filter(s=>s.f&&s.f.hour>=a&&s.f.hour<b);return{n,c:t.length,wr:t.length?Math.round(t.filter(s=>!s.l).length/t.length*100):null}});
 return `<div class=cd><div class=ch><b>📊 Feature-Wichtigkeit</b><span class=ag>Richtwert, kein Beweis</span></div>`+
  imp.slice(0,6).map(x=>`<div style="display:flex;justify-content:space-between;padding:4px 0"><small>${KF[x.k][0]}</small><small style="color:${x.c>0?'var(--g)':'#ff5d73'}">${x.c>0?'↑ höher = mehr Gewinne':'↓ höher = mehr Verluste'} (${(Math.abs(x.c)*100).toFixed(0)}%, n=${x.n})</small></div>`).join('')+
  `<div style="margin-top:8px;padding-top:8px;border-top:1px solid #ffffff12"><small><b>Win-Rate nach Score</b></small><br>${sb.map(b=>b.n?`${b.a}-${b.b<101?b.b:'+'}: ${b.wr}% (${b.n})`:'').filter(Boolean).join(' · ')}</div>`+
  `<div style="margin-top:6px"><small><b>Win-Rate nach Tageszeit</b></small><br>${hb.map(b=>b.c?`${b.n}: ${b.wr}% (${b.c})`:'').filter(Boolean).join(' · ')}</div></div>`}

// ---- KI Walk-Forward-Test ----
let WFC={n:-1,res:null};
function walkForward(){const S=smp().slice().reverse().map(s=>({f:s.f,w:!s.l,t:s.t}));if(S.length<20)return null;if(S.length==WFC.n)return WFC.res;
 const folds=4,size=Math.floor(S.length/folds),res=[];
 for(let i=1;i<folds;i++){const trEnd=size*i,teEnd=i==folds-1?S.length:size*(i+1),train=S.slice(0,trEnd),test=S.slice(trEnd,teEnd);if(test.length<3)continue;
  const ens=mFitBag(train,5),evP=f=>{const x=mF(f);let s=0;for(const sub of ens)s+=mS(sub.b+x.reduce((a,v,j)=>a+v*sub.w[j],0));return s/ens.length};
  const brier=test.reduce((a,s)=>a+(evP(s.f)-(s.w?1:0))**2,0)/test.length,baseWR=train.filter(s=>s.w).length/train.length,baseBrier=test.reduce((a,s)=>a+(baseWR-(s.w?1:0))**2,0)/test.length;
  res.push({fold:i,n:test.length,q:baseBrier?Math.round((1-brier/baseBrier)*100):null})}
 WFC={n:S.length,res};return res}
function walkHtml(){const r=walkForward();if(!r)return`<small style="color:var(--m)">Walk-Forward-Test braucht mind. 20 abgeschlossene Trades.</small>`;
 const ok=r.filter(x=>x.q!=null&&x.q>0).length;
 return `<div style="margin-top:8px;padding-top:8px;border-top:1px solid #ffffff12"><small><b>🔁 Walk-Forward-Test</b> (nur auf jeweils älteren Daten trainiert)</small><br>`+
  r.map(x=>`Fenster ${x.fold}: ${x.q==null?'zu wenig Daten':x.q+'% besser als Zufall'} (${x.n} Trades)`).join('<br>')+
  `<br><small style="color:var(--m)">${ok==r.length?'Modell hält sich in allen Fenstern out-of-sample.':'Nicht in jedem Fenster besser als Zufall — Vorsicht vor Überanpassung.'}</small></div>`}

// ---- Auto-Optimierer für Strategien ----
function optSamples(){const out=[];PT.done.forEach(d=>out.push({score:d.score,c5:d.f?d.f.c5:null,sol:d.sol}));
 STRATS.forEach(S=>ST[S.id].done.forEach(d=>out.push({score:d.score,c5:d.c5,sol:d.sol})));return out}
function optimizeHtml(){const S=optSamples();if(S.length<15)return`<div class=cd><div class=ch><b>🎯 Auto-Optimierer</b></div><small style="color:var(--m)">Sammle noch Daten (${S.length}/15 Trades über alle Strategien)</small></div>`;
 const gscore=[40,50,55,60,65,70,75,80,85].map(th=>{const t=S.filter(s=>s.score>=th);return{th,n:t.length,sol:t.reduce((a,d)=>a+d.sol,0)}}).filter(x=>x.n>=5).sort((a,b)=>b.sol-a.sol);
 const gc5=[20,30,40,60,80,999].map(th=>{const t=S.filter(s=>s.c5==null||s.c5<th);return{th,n:t.length,sol:t.reduce((a,d)=>a+d.sol,0)}}).filter(x=>x.n>=5).sort((a,b)=>b.sol-a.sol);
 const cur=+PTC.buy||70,curSet=S.filter(s=>s.score>=cur),curSol=curSet.reduce((a,d)=>a+d.sol,0);
 return `<div class=cd><div class=ch><b>🎯 Auto-Optimierer</b><span class=ag>rückblickend, kein Garant für die Zukunft</span></div>`+
  `<small>Aktueller Mindest-Score ${cur}: ${curSol>=0?'+':'−'}${Math.abs(curSol).toFixed(3)} SOL (${curSet.length} Trades)</small>`+
  (gscore.length?`<div style="margin-top:6px"><small><b>Beste Mindest-Score-Werte</b></small><br>${gscore.slice(0,3).map(x=>`Score ≥ ${x.th}: ${x.sol>=0?'+':'−'}${Math.abs(x.sol).toFixed(3)} SOL (${x.n} Trades)`).join('<br>')}</div>`:'')+
  (gc5.length?`<div style="margin-top:6px"><small><b>Bester Max. 5-Min-Lauf</b></small><br>${gc5.slice(0,3).map(x=>`unter ${x.th>500?'∞':x.th+'%'}: ${x.sol>=0?'+':'−'}${Math.abs(x.sol).toFixed(3)} SOL (${x.n} Trades)`).join('<br>')}</div>`:'')+
  `</div>`}
const stratCfg=S=>S.cfg||{score:QBuy(),liq:C.liq,vol:C.vol,mmin:C.mmin,mmax:C.mmax,ratio:C.ratio,maxRun:PTC.maxRun,tp:PTC.tp,sl:PTC.sl};
const STSZ=.2,STMAX=5,STCD=3e5,STTO=72e5;
function stratHit(cfg,r){if(r.chain!='solana')return false;if((r.flags||[]).some(f=>/MINT|FREEZE|HONEYPOT|VERKÄUFER|DUMP|LIQ-DROP/.test(f)))return false;
 return r.liq>=cfg.liq&&r.v1>=cfg.vol&&r.mc>=cfg.mmin&&r.mc<=cfg.mmax&&r.ratio>=cfg.ratio&&r.score>=cfg.score&&(r.c5||0)<cfg.maxRun}
function stratClose(id,k,pnl,why){const st=ST[id],t=st.open[k];if(!t)return;const sol=STSZ*pnl;st.done.unshift({sym:t.sym,addr:t.addr,mc0:t.mc0,mc1:t.last,pnl,sol,why,score:t.score,c5:t.c5,t0:t.t0,t1:Date.now()});st.done=st.done.slice(0,100);delete st.open[k];crTrack(t.addr,sol)}
function stratFree(id){const st=ST[id];return st.start+st.done.reduce((a,d)=>a+d.sol,0)-Object.keys(st.open).length*STSZ}
function stratTick(){if(!R.length)return;for(const S of STRATS){const cfg=stratCfg(S),st=ST[S.id];
  for(const k in st.open){const t=st.open[k],r=R.find(x=>x.key==k);if(r)t.last=r.mc;const pnl=t.last/t.mc0-1;
   let why=pnl>=cfg.tp?'TP':pnl<=-cfg.sl?'SL':(Date.now()-t.t0>STTO?'ZEIT':'');if(why)stratClose(S.id,k,pnl,why)}
  if(Object.keys(st.open).length<STMAX&&stratFree(S.id)>=STSZ-1e-9)for(const r of R){if(st.open[r.key])continue;
   if(st.done.some(d=>d.addr==r.addr&&Date.now()-d.t1<STCD))continue;if(!stratHit(cfg,r))continue;
   st.open[r.key]={sym:r.sym,addr:r.addr,chain:r.chain,mc0:r.mc,last:r.mc,t0:Date.now(),score:r.score,c5:r.c5};break}}
 sv('strats',ST)}
setInterval(stratTick,2000);
function sparkline(vals){if(vals.length<2)return'';const lo=Math.min(...vals),hi=Math.max(...vals)||1,pts=vals.map((v,i)=>(i/(vals.length-1)*100).toFixed(1)+','+(30-((v-lo)/((hi-lo)||1))*28).toFixed(1)).join(' ');
 return `<svg viewBox="0 0 100 30" style="width:100%;height:36px;margin:6px 0"><polyline fill="none" stroke="currentColor" stroke-width="2" points="${pts}"/></svg>`}
function stratHtml(){const rows=STRATS.map(S=>{const st=ST[S.id],pnl=st.done.reduce((a,d)=>a+d.sol,0),wins=st.done.filter(d=>d.sol>0).length,wr=st.done.length?Math.round(wins/st.done.length*100):0,eq=[st.start];
  [...st.done].sort((a,b)=>a.t1-b.t1).forEach(d=>eq.push(eq[eq.length-1]+d.sol));return{S,st,pnl,wr,eq}}).sort((a,b)=>b.pnl-a.pnl);
 return `<div class=cd><div class=ch><b>🧪 Strategien-Vergleich</b><span class=ag>gleiche Signale, unabhängiges Kapital, ${STSZ} SOL/Trade</span></div>`+
  rows.map(({S,st,pnl,wr,eq},i)=>`<div style="padding:10px 0;${i?'border-top:1px solid #ffffff12':''}"><div style="display:flex;justify-content:space-between;align-items:center"><b>${i==0&&pnl>0?'🏆 ':''}${X(S.name)}</b><span style="color:${pnl>=0?'var(--g)':'#ff5d73'};font-weight:700">${pnl>=0?'+':'−'}${Math.abs(pnl).toFixed(3)} SOL</span></div><small style="color:var(--m)">${st.done.length} Trades · ${wr}% Trefferquote · ${Object.keys(st.open).length} offen</small>${sparkline(eq)}</div>`).join('')+`</div>`}

function ptSetSize(v){PTC.size=v;sv('ptsize',v);draw()}
const QTG=10,QS={c:0,L:0,t:0};
function QLv(){const n=Date.now();if(n-QS.t<2e3)return QS.L;const h=n-36e5,c=Object.values(PT.open).filter(t=>t.t0>h).length+PT.done.filter(d=>d.t0>h).length;QS.c=c;QS.L=c>=QTG?0:c>=7?1:c>=4?2:3;QS.t=n;return QS.L}
const QP=k=>({minLiq:[PTC.minLiq,12e3,8e3,5e3],minAge:[PTC.minAge,.3,.2,.1],mcl:[PTC.maxMcLiq,40,60,80],top10:[PTC.top10,45,50,55],top1:[PTC.top1,30,35,40],ins:[PTC.ins,25,30,35],hold:[PTC.holdMin,50,40,30],conf:[PTC.confirm,500,400,300],band:[.12,.18,.25,.3]}[k][QLv()]);
const QBuy=()=>{const L=QLv();return L?Math.min(PTC.buy,[0,65,60,55][L]):PTC.buy};
const SZMIN=.4,SZMAX=2.2;
function sizeFor(r){const base=PTC.size;if(!(CO.m&&CO.m.on))return base;const p=mP(CO.m,feat(r)),th=CO.m.th||.3,conf=Math.max(0,Math.min(1,(p-th)/Math.max(.05,1-th))),mult=SZMIN+(SZMAX-SZMIN)*conf;return+(base*mult).toFixed(3)}
const hitQ=r=>{if(hit(r))return true;const L=QLv();return L>0&&r.liq>=[0,8e3,6e3,5e3][L]&&r.v1>=[0,15e3,1e4,8e3][L]&&r.mc>=[0,4e4,3e4,2e4][L]&&r.mc<=C.mmax&&r.ratio>=[0,.53,.5,.48][L]&&r.score>=C.score};
const QPri=r=>r.score+(CO.m&&CO.m.on?65*mP(CO.m,feat(r)):0);
function whyNot(r){try{if(PT.open[r.key])return'✅ gekauft';if(r.score<=QBuy())return'Score '+r.score+' ≤ Mindest '+QBuy();if(!hitQ(r))return'Signal-Filter (MCap/Liq/Vol/Käufer)';const now=Date.now();if(PT.done.some(d=>d.addr==r.addr&&now-d.t1<3e5))return'Cooldown (5 Min)';if(ptStats().free<sizeFor(r)-1e-9)return'Kein freies Kapital';const hw=coachHard(r);if(hw)return'Blockiert: '+hw;const f=feat(r);for(const u of CO.rules)if(u.s=='on'&&rt(u,f))return'KI-Regel: '+rn(u);if(CO.m&&CO.m.on&&mP(CO.m,f)<CO.m.th*[1,1,.6,.35][QLv()])return'KI-Modell: Chance zu niedrig';const p=(CO.pd||{})[r.key];if(p&&Date.now()-p.t<QP('conf'))return'Bestätigung läuft…';return'Bestätigung/Kauf gleich'}catch(e){return'Fehler: '+e.message}}
const coachP=r=>(CO.m&&CO.m.w&&CO.m.n>=12?'<br><small>🧠 KI-Chance '+Math.round(mP(CO.m,feat(r))*100)+'%</small>':'')+'<br><small>🛒 '+whyNot(r)+'</small>';
document.addEventListener('click',async e=>{const id=e.target.id;if(id=='cob'){const j=JSON.stringify({co:CO,pt:PT.done.slice(0,150)});try{await navigator.clipboard.writeText(j);alert('Coach-Daten kopiert. Füge sie in eine Notiz ein, um sie zu sichern.')}catch(x){prompt('Alles markieren und kopieren:',j)}}
 if(id=='coi'){const t=prompt('Gesicherte Coach-Daten einfügen:');if(!t)return;try{const j=JSON.parse(t);if(!j.co)throw 0;CO=Object.assign({rules:[],les:[],sh:[],dn:{}},j.co);const have=new Set(PT.done.map(d=>d.addr+d.t0));(j.pt||[]).forEach(d=>{if(!have.has(d.addr+d.t0))PT.done.push(d)});PT.done.sort((a,b)=>b.t1-a.t1);PT.done=PT.done.slice(0,150);sv('co',CO);sv('pt',PT);coachApply();draw()}catch(x){alert('Die Daten konnten nicht gelesen werden.')}}});
function coachInfo(){const m=CO.m||{},x=CO.xg||{};return coachBil()+`<div style="padding:8px 0;border-top:1px solid #ffffff12"><b>📈 Vorhersage-Modell</b><br><small>${m.on?'aktiv – blockiert Einstiege mit Gewinnchance unter '+Math.round(m.th*100)+'% ('+(m.sn||0)+' geprüft, Qualität '+Math.round(m.q*100)+'%)':m.off?'abgeschaltet – blockierte zu viele Gewinner':m.n>=MDL_MIN_SAMPLES?'lernt weiter: '+(m.realN||0)+'/'+MDL_MIN_REAL+' echte Trades nötig, bevor es Einstiege blockieren darf':'sammelt Daten: '+(m.n||0)+' von '+MDL_MIN_SAMPLES+' Datenpunkten'}</small></div><div style="padding:8px 0;border-top:1px solid #ffffff12"><b>🔒 Ausstiegs-Optimierer</b><br><small>${CO.ex?'aktiv: '+CO.ex.n+' – Stop auf '+(CO.ex.stop*100).toFixed(0)+'% sobald der Trade +'+(CO.ex.arm*100).toFixed(0)+'% erreicht hat':'testet Gewinn-Sicherungen und Take-Profit/Stop-Loss-Werte parallel zu jedem Trade'}${CO.tpsl?'<br>Ziele angepasst: Take-Profit +'+Math.round(CO.tpsl.tp*100)+'% · Stop-Loss −'+Math.round(CO.tpsl.sl*100)+'%':''}${Object.keys(x).length?'<br>Ø Vorteil je Trade: '+Object.entries(x).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k,v])=>k+' '+(v>=0?'+':'')+(v*100).toFixed(1)+'%').join(' · '):''}</small></div>`}
const KF={score:['Score',v=>v.toFixed(0)],mcl:['MCap/Liq',v=>v.toFixed(0)+'×'],c5:['5-Min-Lauf',v=>v.toFixed(0)+'%'],c1:['1-Std-Lauf',v=>v.toFixed(0)+'%'],ratio:['Käuferanteil',v=>(v*100).toFixed(0)+'%'],liq:['Liquidität',F],age:['Alter',v=>v.toFixed(1)+' Std'],top10:['Top-10-Holder',v=>v.toFixed(0)+'%'],top1:['Größter Wallet',v=>v.toFixed(0)+'%'],hour:['Uhrzeit',v=>v.toFixed(0)+' Uhr'],act:['Transaktionen/h',v=>v.toFixed(0)],since:['Anstieg seit Erstsicht',v=>v.toFixed(0)+'%'],rep:['Kommentare',v=>v.toFixed(0)],soc:['Social-Links',v=>v.toFixed(0)+' von 3'],ser:['Weitere Coins des Erstellers',v=>v.toFixed(0)],v1l:['Volumen/Liq',v=>v.toFixed(1)+'×']};
const HY=[['c5','>',20,'Einstieg nach starkem 5-Min-Lauf'],['c1','>',80,'Token war in 1h schon stark gelaufen'],['mcl','>',20,'Dünne Liquidität im Verhältnis zur MCap'],['ratio','<',.58,'Verkäuferdruck (wenig Käufer)'],['top10','>',30,'Hohe Holder-Konzentration'],['top1','>',15,'Ein Wallet dominiert'],['liq','<',2e4,'Wenig Liquidität'],['age','<',1,'Sehr junger Token'],['ser','>',1,'Ersteller startet serienweise Coins'],['soc','<',1,'Keine Social-Links']];
const feat=r=>{const g=r.rug||{},n=x=>x==null||isNaN(x)?null:+(+x).toFixed(3);return{score:r.score,mcl:r.liq>0?n(r.mc/r.liq):null,c5:n(r.c5||0),c1:n(r.c1||0),ratio:n(r.ratio),hour:new Date().getHours(),act:(r.b||0)+(r.s||0),since:n((r.since||0)*100),boost:r.boost?1:0,...fx(r),liq:Math.round(r.liq),age:n(r.age),top10:n(g.top10),top1:n(g.top1),v1l:r.liq>0?n(r.v1/r.liq):null}};
const rt=(u,f)=>{const x=f&&f[u.k];return x!=null&&(u.o=='>'?x>=u.v:x<=u.v)};
const rn=u=>KF[u.k][0]+(u.o=='>'?' ≥ ':' ≤ ')+KF[u.k][1](u.v);
function smp(){return PT.done.filter(d=>d.f).map(d=>({f:d.f,l:d.sol<0,s:d.sol,t:d.t1})).concat((CO.ss||[]).map(x=>({f:x.f,l:!x.w,s:x.s==null?(x.w?.01:-.03):x.s,t:x.t}))).sort((a,b)=>b.t-a.t)}
function ev(u,T){T=T||smp();const h=[[0,0],[0,0]];let n=0,l=0,s=0;T.forEach((d,i)=>{if(!rt(u,d.f))return;n++;s+=d.s;const q=i<T.length/2?0:1;h[q][0]++;if(d.l){l++;h[q][1]++}});return{n,l,s,h,N:T.length,base:T.length?T.filter(d=>d.l).length/T.length:0}}
function coachObserve(){let k=0;const n=Date.now();if(CO.sh.filter(x=>x.u=='obs').length>=30)return;
 for(const r of R){if(k>=3||CO.sh.length>=60)break;if(r.score<PTC.min||r.liq<(r.fs?4e3:1e4)||PT.open[r.key]||CO.dn[r.key]||CO.sh.some(x=>x.key==r.key))continue;
  CO.sh.push({key:r.key,chain:r.chain,addr:r.addr,mc0:r.mc,t0:n,u:'obs',last:r.mc,seen:n,lq:r.liq,f:feat(r)});k++}}
function addRule(k,o,v,why){if(CO.rules.some(u=>u.k==k&&u.o==o))return null;const u={id:'r'+Date.now().toString(36)+k,k,o,v,s:'probe',t:Date.now(),why,b:0,sn:0,sl:0};CO.rules.push(u);return u}
function coachPost(d){const f=d.f||{},c=[],ids=[];
 if(d.why=='RUG')c.push('Liquidität wurde abgezogen (Rug)');
 if(d.hi>=.12)c.push('Gewinn nicht gesichert – Trade stand bei +'+(d.hi*100).toFixed(0)+'%, endete im Minus');
 else if(d.hi<.03&&d.t1-d.t0>6e5)c.push('Kein Momentum – Kurs kam nie in Fahrt');
 for(const[k,o,v,tx]of HY)if(f[k]!=null&&(o=='>'?f[k]>=v:f[k]<=v)){c.push(tx+' ('+KF[k][0]+' '+KF[k][1](f[k])+')');const u=addRule(k,o,v,'Verlust '+d.sym);if(u)ids.push(u.id)}
 CO.les.unshift({t:Date.now(),sym:d.sym,sol:d.sol,why:d.why,c:c.length?c:['Keine klare Ursache erkennbar – normales Marktrisiko'],n:ids.length});CO.les=CO.les.slice(0,30)}
function coachMine(){const T=smp();if(T.length<20)return;const N=T.length,base=T.filter(d=>d.l).length/N;let best=null;
 for(const k in KF){if(k=='score')continue;const vs=T.map(d=>d.f[k]).filter(x=>x!=null).sort((a,b)=>a-b);if(vs.length<10)continue;
  for(const o of['>','<'])for(const q of[.2,.35,.5,.65,.8]){if(CO.rules.some(u=>u.k==k&&u.o==o))continue;const v=+vs[Math.floor(q*(vs.length-1))].toPrecision(2),u={k,o,v},e=ev(u,T);
   if(e.n>=Math.max(6,N*.08)&&e.l/e.n>=.75&&e.l/e.n>=base+.2&&wl(e.l,e.n)>base&&e.s<0&&(!best||e.s<best.e.s))best={u,e}}}
 if(best)addRule(best.u.k,best.u.o,best.u.v,'Muster in '+N+' Trades')}
function coachReview(){for(const u of CO.rules){if(u.s=='off')continue;const e=ev(u),n=e.n,l=e.l,lr=n?l/n:0,ok=e.h.every(h=>h[0]<2||h[1]/h[0]>=.6);
  if(u.s=='probe'&&n>=6&&lr>=.75&&ok&&e.s<0&&wl(l,n)>e.base+.03)u.s='on';
  else if(n>=8&&lr<.5)u.s=u.s=='on'?'off':'drop';
  u.n=n;u.lr=lr}
 CO.rules=CO.rules.filter(u=>u.s!='drop'&&!(u.s=='probe'&&Date.now()-u.t>6048e5&&(u.n||0)<3));
 const pr=CO.rules.filter(u=>u.s=='probe');if(pr.length>8)pr.sort((a,b)=>(a.n||0)-(b.n||0)).slice(0,pr.length-8).forEach(u=>CO.rules.splice(CO.rules.indexOf(u),1))}
function coachLearn(d){if(!d||!d.f)return;if(d.sol<0)coachPost(d);coachMine();coachReview();coachModel();coachExit();coachScore();sv('co',CO)}
const wl=(l,n)=>{if(!n)return 0;const z=1.96,p=l/n;return(p+z*z/(2*n)-z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n)))/(1+z*z/n)};
function coachWait(r){const P=CO.pd=CO.pd||{},n=Date.now(),p=P[r.key];for(const k in P)if(n-P[k].t>18e4)delete P[k];
 if(!p){P[r.key]={t:n,mc:r.mc};return{k:'wait'}}if(n-p.t<QP('conf'))return{k:'wait'};delete P[r.key];
 if(r.mc<p.mc*.95||r.mc>p.mc*(1+QP('band'))||(r.c5||0)<-3){const S=CO.hs=CO.hs||{};S['Bestätigung']=(S['Bestätigung']||0)+1;return{k:'confirm'}}return null}
function coachScore(){const T=PT.done.filter(d=>d.score!=null),mean=x=>x.reduce((a,d)=>a+d.sol,0)/x.length;let best=70,bm=null;
 if(T.length>=25){const all=mean(T);for(const t of[70,75,80,85]){const A=T.filter(d=>d.score>t);if(A.length<12)continue;const h=Math.floor(A.length/2),m=mean(A);if(m>all+.005&&mean(A.slice(0,h))>=all&&mean(A.slice(h))>=all&&(bm==null||m>bm)){bm=m;best=t}}}
 CO.buy=best;PTC.buy=best}
function coachHard(r){const L=PT.done.slice(0,3),fq=fx(r);if(fq.ser>=4)return'Serien-Ersteller';
 if(L.length==3&&L.every(d=>d.sol<0)&&Date.now()-L[0].t1<(QLv()?6e5:18e5))return'Verlustserie';
 if(PT.done.filter(d=>Date.now()-d.t1<864e5).reduce((a,d)=>a+d.sol,0)<=-PTC.dayLoss)return'Tageslimit';
 if(Object.keys(PT.open).length>=PTC.maxOpen)return'Max. offen';
 return rugOk(r)}
function coachBil(){const bl=CO.bl||0,bw=CO.bw||0,hk=Object.entries(CO.hs||{}).sort((a,b)=>b[1]-a[1]).slice(0,3);return `<div style="padding:8px 0"><b>🛡 Coach-Bilanz</b><br><small>${+C.fs?'🎯 Final Stretch: '+FSM.size+' Tokens gesehen · Quelle: '+(FSS||'wartet')+'<br>':''}${(CO.ss||[]).length?'🔬 Labor: '+CO.ss.length+' Kandidaten ausgewertet, '+Math.round(CO.ss.filter(x=>x.w).length/CO.ss.length*100)+'% erreichten das Ziel<br>':''}${bl+bw?'Von '+(bl+bw)+' geblockten Einstiegen wären '+bl+' Verlierer ('+Math.round(bl/(bl+bw)*100)+'%) und '+bw+' Gewinner gewesen':'Noch keine geblockten Einstiege ausgewertet'}${hk.length?'<br>Sicherheits-Filter blockten: '+hk.map(([k,v])=>k+' '+v+'×').join(' · '):''}<br>⚡ Quota-Modus: ${(QLv(),QS.c)}/${QTG} Käufe in der letzten Stunde · Stufe ${QLv()}${QLv()?' (Filter gelockert)':''}<br>Mindest-Score: ${QBuy()}${CO.buy>70?' (vom Coach erhöht)':''} · Einstieg nach ${QP('conf')/1000} Sek. Bestätigung (Kurs darf nicht fallen oder zu weit davonlaufen)</small></div>`}
function coachGate(r){const hw=coachHard(r);if(hw){const H=CO.hd=CO.hd||{},S=CO.hs=CO.hs||{},n=Date.now();if(!H[r.key]||n-H[r.key]>18e5){H[r.key]=n;S[hw]=(S[hw]||0)+1;if(Object.keys(H).length>300)CO.hd={}}return{k:'hard'}}const f=feat(r);for(const u of CO.rules){if(u.s!='on'||!rt(u,f))continue;
  const o0=CO.sh.find(x=>x.key==r.key&&x.u=='obs');if(o0){o0.u=u.id;u.b=(u.b||0)+1}else if(!CO.sh.some(x=>x.key==r.key)&&!CO.dn[r.key]&&CO.sh.length<60){u.b=(u.b||0)+1;CO.sh.push({key:r.key,chain:r.chain,addr:r.addr,mc0:r.mc,t0:Date.now(),u:u.id,last:r.mc,f});sv('co',CO)}return u}
 if(CO.m&&CO.m.on&&mP(CO.m,f)<CO.m.th*[1,1,.6,.35][QLv()]){const o1=CO.sh.find(x=>x.key==r.key&&x.u=='obs');if(o1)o1.u='model';else if(!CO.sh.some(x=>x.key==r.key)&&!CO.dn[r.key]&&CO.sh.length<60){CO.sh.push({key:r.key,chain:r.chain,addr:r.addr,mc0:r.mc,t0:Date.now(),u:'model',last:r.mc,f});sv('co',CO)}return{k:'model'}}return coachWait(r)}
function coachTick(){if(!CO.sh.length)return;const M={};R.forEach(r=>M[r.key]=r);const now=Date.now();let ch=0;
 CO.sh=CO.sh.filter(x=>{const r=M[x.key];if(r){x.last=r.mc;x.seen=now}else if(now-(x.seen||x.t0)>18e4)return false;const p=x.last/x.mc0-1,age=now-x.t0;let loss=null;
  if(r&&x.lq&&r.liq<x.lq*.6)loss=true;else if(p>=PTC.tp)loss=false;else if(p<=-PTC.sl)loss=true;else if(age>72e4)loss=p-.06<0;else return true;
  if(x.u!='obs'){if(loss)CO.bl=(CO.bl||0)+1;else CO.bw=(CO.bw||0)+1}const u=CO.rules.find(y=>y.id==x.u);if(u){u.sn++;if(loss)u.sl++}if(x.f)CO.ss=(CO.ss||[]).concat({f:x.f,w:!loss,t:now,s:+((Math.max(-PTC.sl,Math.min(PTC.tp,p))-.06)*PTC.size).toFixed(4)}).slice(-400);if(x.u=='model'&&CO.m){CO.m.sn=(CO.m.sn||0)+1;if(loss)CO.m.sl=(CO.m.sl||0)+1;if(CO.m.sn>=8&&CO.m.sl/CO.m.sn<.5){CO.m.off=1;CO.m.on=false}}CO.dn[x.key]=now;ch=1;return false});
 for(const k in CO.dn)if(now-CO.dn[k]>18e5)delete CO.dn[k];
 if(ch){if((CO.oc=(CO.oc||0)+1)%5==0){coachMine();coachModel()}coachReview();sv('co',CO)}}
function coachHtml(){const on=CO.rules.filter(u=>u.s=='on'),pb=CO.rules.filter(u=>u.s=='probe'),off=CO.rules.filter(u=>u.s=='off');
 const ru=u=>`<div style="padding:6px 0;border-top:1px solid #ffffff12"><b>${u.s=='on'?'🛡':u.s=='probe'?'👁':'⏸'} ${X(rn(u))}</b> <button class=f data-cr="${u.id}">${u.s=='on'?'ausschalten':'einschalten'}</button><br><small>${u.s=='on'?(u.b||0)+' Einstiege geblockt · ':''}${u.n?u.n+' Fälle, '+Math.round(u.lr*100)+'% Verlust · ':''}Grund: ${X(u.why)}</small></div>`;
 const ls=CO.les.slice(0,4).map(l=>`<div style="padding:6px 0;border-top:1px solid #ffffff12"><small>${tm(l.t)} · <b>${X(l.sym)}</b> ${sol(l.sol)} SOL (${X(l.why)})</small><br>${l.c.map(x=>'• '+X(x)).join('<br>')}</div>`).join('');
 return `<div class=cd><div class=ch><b>🧠 KI-Coach</b><span class=ag>${on.length} aktiv · ${pb.length} in Beobachtung</span></div><small>Analysiert jeden Verlust, legt Regeln an und blockiert Einstiege erst, wenn die Daten die Regel bestätigen (🛡 = blockiert, 👁 = wird geprüft).</small>${coachInfo()}${on.concat(pb,off).map(ru).join('')||'<div class=em>Noch keine Regeln – der Coach lernt ab dem ersten Verlust-Trade.</div>'}${ls?'<div style="margin-top:8px"><small><b>Letzte Verlust-Analysen</b></small></div>'+ls:''}<div style="margin-top:8px"><button class=b id=cob>Coach sichern</button> <button class=b id=coi>Coach laden</button> <button class=b id=cor>Zurücksetzen</button></div></div>`}
document.addEventListener('click',e=>{const c=e.target.closest('[data-cr]');if(c){const u=CO.rules.find(x=>x.id==c.dataset.cr);if(u){u.s=u.s=='on'?'off':'on';sv('co',CO);draw()}}if(e.target.id=='cor'&&confirm('Alle Regeln und Analysen des Coaches löschen?')){CO={rules:[],les:[],sh:[],dn:{}};sv('co',CO);coachApply();draw()}});

const fl=r=>{const f=[];if(r.age!=null&&r.age<.25)f.push('BRANDNEU');if(r.mc&&r.liq/r.mc<.03)f.push('DÜNNE LIQ');if(r.b+r.s>=20&&r.ratio<.4)f.push('VERKÄUFER');if(r.c1<-30)f.push('DUMP');if(r.boost)f.push('BOOST');if(r.b>=10&&r.s==0&&r.v1>1000)f.push('MÖGL. HONEYPOT');return f};
const sc=r=>{let s=Math.min(30,r.v1/Math.max(r.liq,1)*10)+Math.max(0,r.ratio-.5)*80+Math.min(20,Math.max(0,r.c5)*2)+(r.boost?5:0);
 s-=15*r.flags.filter(x=>['DÜNNE LIQ','VERKÄUFER','DUMP'].includes(x)).length;
 if(r.flags.includes('MÖGL. HONEYPOT'))s-=35;
 if(r.age!=null){if(r.age<.05)s-=5;else if(r.age<3)s+=5;else if(r.age>24)s-=5}
 return Math.round(Math.max(0,Math.min(100,s)))};
const hit=r=>(+C.fs&&r.fs)?(r.liq>=4e3&&r.v1>=5e3&&r.mc>=2e4&&r.mc<=7.5e4&&r.ratio>=C.ratio&&r.score>=C.score):(r.liq>=C.liq&&r.v1>=C.vol&&r.mc>=C.mmin&&r.mc<=C.mmax&&r.ratio>=C.ratio&&r.score>=C.score);
const RCT=18e4;
function rcCheck(addr){const c=RC[addr];if(c&&Date.now()-c.t<RCT)return c;
 if(!RCbusy.has(addr)){RCbusy.add(addr);
  fetch('https://api.rugcheck.xyz/v1/tokens/'+addr+'/report').then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}).then(j=>{
   const risks=(j.risks||[]).filter(x=>x&&(x.level=='danger'||x.level=='warn')).map(x=>x.name||x.description||'Risiko');
   const th=j.topHolders||j.top_holders||[];
   let devPct=null;const dev=Array.isArray(th)?th.find(h=>h&&(h.insider||h.isCreator||/creator|dev/i.test(h.owner||h.type||h.address||''))):null;
   if(dev)devPct=dev.pct??dev.percentage??dev.share??null;
   const mp=new Set((j.markets||[]).map(m=>m&&m.pubkey)),T10=Array.isArray(th)?th.filter(h=>h&&!mp.has(h.address)&&!mp.has(h.owner)).slice(0,10).reduce((a,h)=>a+(+(h.pct??h.percentage)||0),0):0;let lpLocked=null;const mk=(j.markets||[])[0];
   if(mk&&mk.lp)lpLocked=mk.lp.lpLockedPct??mk.lp.locked_pct??(mk.lp.lpLocked!=null?(mk.lp.lpLocked?100:0):null);
   const hp=Array.isArray(th)?th.filter(h=>h&&!mp.has(h.address)&&!mp.has(h.owner)):[],p0=h=>+(h.pct??h.percentage)||0,top1=hp.length?Math.max(...hp.map(p0)):null,insPct=hp.filter(h=>h.insider).reduce((a,h)=>a+p0(h),0),tf=+(j.transferFee&&j.transferFee.pct)||0;
   RC[addr]={t:Date.now(),score:j.score_normalised??j.score??null,risks,devPct,lpLocked,top10:T10>0?T10:null,top1,insPct,rugged:j.rugged===true,mint:!!(j.mintAuthority||(j.token&&j.token.mintAuthority)),freeze:!!(j.freezeAuthority||(j.token&&j.token.freezeAuthority)),tf,holders:j.totalHolders!=null?+j.totalHolders:null};sv('rc',RC);draw()
  }).catch(()=>{RC[addr]={t:Date.now()-RCT+3e4,score:null,risks:[],devPct:null,lpLocked:null}}).finally(()=>RCbusy.delete(addr))}
 return c||null}
function rcFlags(rc){const out=new Set();for(const name of rc.risks||[]){if(/holder|concentrat|whale/i.test(name))out.add('WHALE');else if(/mint/i.test(name))out.add('MINT RISK');else if(/freeze/i.test(name))out.add('FREEZE RISK');else if(/liquidity|lp\b/i.test(name))out.add('LP RISK');else out.add('RISIKO')}
 if(rc.devPct!=null&&rc.devPct>=(C.devMax||15))out.add('DEV HÄLT '+Math.round(rc.devPct)+'%');
 if(rc.lpLocked!=null&&rc.lpLocked<50)out.add('LP UNLOCKED');
 return[...out]}
function st(p,bo){const v=p.volume||{},c=p.priceChange||{},t=(p.txns||{}).h1||{},b=t.buys||0,s=t.sells||0,a=p.baseToken.address,chain=p._chain,key=chain+':'+a,mc=p.marketCap||p.fdv||0;
 const h=Hh[key]=Hh[key]||{mc,t:Date.now()};
 const r={sym:p.baseToken.symbol,addr:a,chain,key,url:p.url||'',mc,liq:(p.liquidity||{}).usd||0,v1:v.h1||0,c5:c.m5||0,c1:c.h1||0,b,s,ratio:b+s?b/(b+s):0,boost:bo.has(key),dex:p.dexId||'',age:p.pairCreatedAt?(Date.now()-p.pairCreatedAt)/36e5:null,since:h.mc?mc/h.mc-1:0};
 r.fs=FSM.has(a)||r.dex=='pumpfun';r.flags=fl(r);if(r.fs)r.flags.push('FINAL STRETCH');r.score=sc(r);r.rug=null;
 if(chain=='solana'&&r.score>=45){const rc=rcCheck(a);if(rc){r.rug=rc;if(rc.score==null&&!(rc.risks||[]).length)r.flags.push('RC OFFLINE');if(rc.risks&&rc.risks.length){const rf=rcFlags(rc);r.flags=r.flags.concat(rf);r.score=Math.max(0,r.score-8*Math.min(3,rf.length))}}}
 return r}
const A='https://api.dexscreener.com',J=async p=>{try{const r=await fetch(A+p);if(!r.ok)throw new Error('HTTP '+r.status);return await r.json()}catch(e){LE=e.message||String(e);throw e}};
const GT='https://api.geckoterminal.com/api/v2';
// GTPOOL merkt sich, welche Pool-Adresse zu welchem Token gehört (chain:tokenAddr -> poolAddr).
// Das braucht der Fallback unten, weil GeckoTerminals Kennzahlen (Liquidität, 5m/1h-Änderung,
// Buys/Sells) am Pool hängen, nicht direkt am Token.
let GTPOOL={};
async function gtPools(chain){try{const r=await fetch(GT+'/networks/'+chain+'/new_pools?page=1');if(!r.ok)return[];const j=await r.json();
 return(j.data||[]).map(p=>{const id=p.relationships&&p.relationships.base_token&&p.relationships.base_token.data&&p.relationships.base_token.data.id;if(!id)return null;const addr=id.startsWith(chain+'_')?id.slice(chain.length+1):id;
  const poolId=p.id,poolAddr=poolId&&poolId.startsWith(chain+'_')?poolId.slice(chain.length+1):poolId;if(poolAddr)GTPOOL[chain+':'+addr]=poolAddr;
  return{chain,addr}}).filter(Boolean)}catch(e){return[]}}
let GTT=0;async function gtScan(){if(Date.now()-GTT<6e3)return[];GTT=Date.now();const out=[];for(const c of CHAINS){const a=await gtPools(c);out.push(...a)}return out}
