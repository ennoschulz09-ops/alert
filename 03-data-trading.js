// Smart Lab – Teil 03: Datenquellen (DexScreener/GeckoTerminal/RugCheck), Scoring, Paper-Trading-Logik
// Automatisch aus der ursprünglichen einzelnen index.html aufgeteilt.
// Reihenfolge ist wichtig: diese Dateien werden in genau dieser Reihenfolge geladen
// und teilen sich (wie vorher) denselben globalen Scope - nichts wurde inhaltlich veraendert.

// ---- Fallback-Datenquelle: GeckoTerminal ----
// Springt nur ein, wenn DexScreener für eine Chain gerade nicht antwortet (Rate-Limit/Ausfall).
// Wandelt GeckoTerminal-Pool-Daten in dieselbe Form um, die st() von DexScreener erwartet,
// damit Scoring/Anzeige unverändert weiterlaufen. Für Tokens ohne bekannte Pool-Adresse (noch
// nicht über gtPools gesehen) liefert er nichts zurück - das ist ein bewusst stilles Degradieren,
// kein Fehler, damit ein einzelner unbekannter Token nicht den ganzen Scan blockiert.
let GTFAIL=0;
async function gtFallback(chain,addrs){
 const known=addrs.map(a=>({a,p:GTPOOL[chain+':'+a]})).filter(x=>x.p);
 if(!known.length)return[];
 const out=[];
 for(let i=0;i<known.length;i+=30){
  const batch=known.slice(i,i+30);
  try{
   const r=await fetch(GT+'/networks/'+chain+'/pools/multi/'+batch.map(x=>x.p).join(','));
   if(!r.ok){GTFAIL++;continue}
   const j=await r.json();GTFAIL=0;
   for(const d of (j.data||[])){
    try{
     const at=d.attributes||{};
     const poolAddr=(d.id||'').startsWith(chain+'_')?d.id.slice(chain.length+1):d.id;
     const found=batch.find(x=>x.p==poolAddr);if(!found)continue;
     const tx1=(at.transactions&&(at.transactions.h1||at.transactions.m30))||{},
      vol=(at.volume_usd&&(at.volume_usd.h1||at.volume_usd.h24))||0,
      pc=at.price_change_percentage||{},
      liq=+at.reserve_in_usd||0,mc=+at.market_cap_usd||+at.fdv_usd||0;
     out.push({baseToken:{symbol:at.base_token_symbol||at.name||found.a.slice(0,5),address:found.a},
      liquidity:{usd:liq},marketCap:mc,fdv:mc,
      volume:{h1:+vol||0},priceChange:{m5:+pc.m5||0,h1:+pc.h1||0},
      txns:{h1:{buys:+tx1.buys||0,sells:+tx1.sells||0}},
      pairCreatedAt:at.pool_created_at?Date.parse(at.pool_created_at):null,
      dexId:'geckoterminal',url:'',_chain:chain,_src:'gt'})
    }catch(e){}
   }
  }catch(e){GTFAIL++}
 }
 return out}
function beep(kind){if(!C.sound)return;try{const a=new AudioContext();
 if(kind=='x2'){const o1=a.createOscillator();o1.connect(a.destination);o1.frequency.value=880;o1.start();o1.stop(a.currentTime+.12);
  const o2=a.createOscillator();o2.connect(a.destination);o2.frequency.value=1320;o2.start(a.currentTime+.14);o2.stop(a.currentTime+.28)}
 else{const o=a.createOscillator();o.connect(a.destination);o.frequency.value=880;o.start();o.stop(a.currentTime+.15)}}catch(e){}}
const sol=n=>String(+n.toFixed(3)).replace('.',',');
let SOLUSD=null;
async function updSol(){try{const r=await fetch(A+'/tokens/v1/solana/So11111111111111111111111111111111111111112');if(!r.ok)return;const j=await r.json();const arr=Array.isArray(j)?j:[j];const p=arr.map(x=>+x.priceUsd).find(x=>x>0);if(p)SOLUSD=p}catch(e){}}
const usdN=n=>SOLUSD?'$'+(n*SOLUSD).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2}):'…';
const usd=n=>SOLUSD?' ('+usdN(n)+')':'';
function ptStats(){const po=Object.values(PT.open),pd=PT.done,v=t=>(t.size||PTC.size)*(1+bp(t,t.last/t.mc0-1))*(1-PTC.fee-(t.slip||0))/(1+PTC.fee+(t.slip||0)),real=pd.reduce((a,d)=>a+d.sol,0),ov=po.reduce((a,t)=>a+v(t),0),os=po.reduce((a,t)=>a+(t.size||PTC.size),0),gw=pd.filter(d=>d.sol>0),vl=pd.filter(d=>d.sol<=0);
 return{po,pd,v,real,ov,os,free:PTC.start+real-os,gain:gw.reduce((a,d)=>a+d.sol,0),gn:gw.length,loss:vl.reduce((a,d)=>a+d.sol,0),ln:vl.length}}
function renderStats(){const s=ptStats(),tot=s.real+s.ov-s.os,cl=x=>x>=0?'var(--g)':'#ff5d73',sg=n=>(n>=0?'+':'−')+sol(Math.abs(n)),pd=s.pd,N=pd.length,D0=new Date().setHours(0,0,0,0),W=Date.now(),sum=f=>pd.filter(d=>d.t1>=f).reduce((a,d)=>a+d.sol,0),gw=pd.filter(d=>d.sol>0),ls=pd.filter(d=>d.sol<=0),pf=s.loss?s.gain/Math.abs(s.loss):null,hold=N?pd.reduce((a,d)=>a+(d.t1-d.t0),0)/N/6e4:0,bw=[...pd].sort((a,b)=>b.sol-a.sol);
 let mw=0,ml=0,cw=0,cn=0;[...pd].reverse().forEach(d=>{if(d.sol>0){cw++;cn=0}else{cn++;cw=0}mw=Math.max(mw,cw);ml=Math.max(ml,cn)});
 let pk=PTC.start,dd=0;(PT.eq||[]).forEach(e=>{pk=Math.max(pk,e[1]);dd=Math.max(dd,(pk-e[1])/pk)});
 const ex={};pd.forEach(d=>ex[d.why]=(ex[d.why]||0)+1);
 const bk=[[55,64],[65,74],[75,100]].map(([a,b])=>{const g=pd.filter(d=>d.score>=a&&d.score<=b);return g.length?a+'–'+b+': Ø '+sg(g.reduce((x,d)=>x+d.sol,0)/g.length)+' ('+g.length+')':null}).filter(Boolean);
 const bx=(l,v,c)=>`<div><small>${l}</small><span style="color:${c||'inherit'}">${v}</span></div>`;
 $('#cards').innerHTML=`<div class=cd><div class=ch><b>📊 Stats</b><span class=ag>${N} abgeschlossene Trades</span></div><div style="font-size:30px;font-weight:800;margin:6px 0">${sg(tot)} SOL <small>${pc(tot/PTC.start*100)}</small></div><div class=mg>${bx('Realisiert',sg(s.real),cl(s.real))}${bx('Offen',sg(s.ov-s.os),cl(s.ov-s.os))}${bx('Heute',sg(sum(D0)),cl(sum(D0)))}</div><div class=mg style="margin-top:8px">${bx('7 Tage',sg(sum(W-6048e5)),cl(sum(W-6048e5)))}${bx('30 Tage',sg(sum(W-2592e6)),cl(sum(W-2592e6)))}${bx('Max. Drawdown','−'+(dd*100).toFixed(1)+'%','#ff5d73')}</div></div><div class=cd><div class=ch><b>Qualität</b></div><div class=mg>${bx('Trefferquote',N?Math.round(gw.length/N*100)+'%':'—')}${bx('Profit-Faktor',pf?pf.toFixed(2):'—')}${bx('Ø pro Trade',N?sg(s.real/N):'—')}</div><div class=mg style="margin-top:8px">${bx('Ø Gewinn',gw.length?sg(s.gain/gw.length):'—','var(--g)')}${bx('Ø Verlust',ls.length?sg(s.loss/ls.length):'—','#ff5d73')}${bx('Ø Haltedauer',N?Math.round(hold)+' Min':'—')}</div><div class=mg style="margin-top:8px">${bx('Beste Serie',mw+' Siege','var(--g)')}${bx('Schlechteste Serie',ml+' Verluste','#ff5d73')}${bx('Bester / Schlechtester',N?X(bw[0].sym)+' '+sg(bw[0].sol)+' · '+X(bw[N-1].sym)+' '+sg(bw[N-1].sol):'—')}</div></div><div class=cd><div class=ch><b>Ausstiege</b></div><div class=mg>${Object.entries(ex).map(([k,v])=>bx(X(k),v)).join('')||bx('Noch keine','—')}</div>${bk.length?`<small style="display:block;margin-top:10px">Ø Ergebnis nach Score: ${bk.join(' · ')}</small>`:''}<small style="display:block;margin-top:6px">Signale ausgewertet: ${STZ.total} · Treffer ${STZ.wins}</small></div>`}
const PTX=new Set();
function renderDash(){const s=ptStats(),tot=s.real+s.ov-s.os,cl=x=>x>=0?'var(--g)':'#ff5d73',sg=n=>(n>=0?'+':'−')+sol(Math.abs(n)),WY={LOCK:'Gewinn-Sicherung',TP:'Take-Profit',SL:'Stop-Loss',ZEIT:'Zeitausstieg',TRAIL:'Trailing-Stop',MAX:'Max-Gewinn',MOM:'Momentum-Ausstieg',RUG:'Liquidität weg',FLAU:'Kein Momentum'},D0=new Date().setHours(0,0,0,0),W7=Date.now()-6048e5,sum=f=>s.pd.filter(d=>d.t1>=f).reduce((a,d)=>a+d.sol,0),bw=[...s.pd].sort((a,b)=>b.sol-a.sol),eq=[...(PT.eq||[]),[Date.now(),PTC.start+tot]];
 let ch='';if(eq.length>2){const vs=eq.map(e=>e[1]),lo=Math.min(PTC.start,...vs),hi=Math.max(PTC.start,...vs),a=eq[0][0],dt=(eq[eq.length-1][0]-a)||1,Y=v=>(76-(v-lo)/((hi-lo)||1)*70).toFixed(1);
  ch=`<svg viewBox="0 0 300 80" preserveAspectRatio="none" style="width:100%;height:90px;margin:10px 0"><line x1="0" x2="300" y1="${Y(PTC.start)}" y2="${Y(PTC.start)}" style="stroke:#ffffff33" stroke-dasharray="4"/><polyline fill="none" vector-effect="non-scaling-stroke" style="stroke:${cl(tot)};stroke-width:2" points="${eq.map(e=>((e[0]-a)/dt*300).toFixed(1)+','+Y(e[1])).join(' ')}"/></svg>`}
 const rows=[...s.po.map(t=>({id:t.sym+t.t0,t0:t.t0,sym:t.sym,open:1,val:s.v(t),t,sz:t.size||PTC.size,pnl:bp(t,t.last/t.mc0-1)})),...s.pd.slice(0,40).map(d=>({id:d.sym+d.t0,t0:d.t1,sym:d.sym,open:0,val:(d.size||PTC.size)+d.sol,t:d,sz:d.size||PTC.size,pnl:d.pnl,why:WY[d.why]||d.why}))].sort((a,b)=>b.open-a.open||b.t0-a.t0).map(o=>{const pl=o.val-o.sz,t=o.t,x=PTX.has(o.id),pos=Math.max(0,Math.min(100,(o.pnl+PTC.sl)/(PTC.tp+PTC.sl)*100));
  const bar=o.open?`<div style="position:relative;height:8px;border-radius:4px;margin:12px 4px 4px;background:linear-gradient(90deg,#ff5d73,#3a3f55 50%,#22e58f)"><i style="position:absolute;top:-4px;left:calc(${pos}% - 2px);width:4px;height:16px;border-radius:2px;background:#fff"></i></div><small style="display:flex;justify-content:space-between"><span>−${PTC.sl*100}%</span><span>${pc(o.pnl*100)}</span><span>+${PTC.tp*100}%</span></small>`:'';
  const det=x?`<div style="margin-top:8px"><small>Kauf: ${tm(t.t0)} Uhr · ${dl(t.t0)} · MC ${F(t.mc0)}<br>${o.open?'Aktuell':'Verkauf: '+tm(t.t1)+' Uhr'} · MC ${F(o.open?t.last:t.mc1)}${t.score!=null?'<br>Score beim Kauf: '+t.score:''}<br>Dauer: ${Math.max(1,Math.round(((o.open?Date.now():t.t1)-t.t0)/6e4))} Min</small>${t.addr?`<div class=lk><a target=_blank href="https://dexscreener.com/${t.chain}/${X(t.addr)}">Chart</a><a target=_blank href="https://axiom.trade/t/${X(t.addr)}">Axiom</a></div>`:''}</div>`:'';
  return `<div class=cd data-pt="${X(o.id)}"><div class=ch><span class=av>${X(o.sym.slice(0,2).toUpperCase())}</span><b>${x?'▾':'▸'} ${X(o.sym)}</b><span class=ag>Einsatz ${sol(o.sz)} SOL${usd(o.sz)}</span><span class="f ${pl>=0?'B':'W'}">${o.open?'HOLDING':'SOLD'}</span></div><div class=mg><div><small>${o.open?'Holding':'Sold'}</small>${sol(o.val)} SOL<br>${usdN(o.val)}</div><div><small>Ergebnis</small><span style="color:${cl(pl)}">${sg(pl)} SOL<br>${usdN(pl)}</span></div><div><small>${o.open?'Seit Kauf':o.why}</small>${pc(pl/o.sz*100)}</div></div>${bar}${det}</div>`}).join('');
 $('#cards').innerHTML=`<div class=cd><div class=ch><b>📝 Paper-Trading</b><span class=ag>virtuelles Startkapital ${PTC.start} SOL</span></div><div style="display:flex;gap:6px;margin:4px 0 2px;flex-wrap:wrap">${[.1,.2,.3,.4,.5].map(v=>`<button data-sz="${v}" style="flex:1;min-width:50px;padding:8px 0;border-radius:10px;border:1px solid ${v==PTC.size?'var(--g)':'#ffffff22'};background:${v==PTC.size?'#22e58f22':'transparent'};color:${v==PTC.size?'var(--g)':'#fff'};font-weight:700">${v} SOL</button>`).join('')}</div><div style="font-size:34px;font-weight:800;margin:8px 0 2px">${sol(PTC.start+tot)} SOL<br><span style="font-size:15px;color:var(--m)">${usdN(PTC.start+tot)}</span></div><div style="color:${cl(tot)};font-weight:700">${sg(tot)} SOL${usd(tot)} · ${pc(tot/PTC.start*100)} seit Start</div>${ch}<div class=mg><div><small>Gewinn · ${s.gn} Trades</small><span style="color:var(--g)">+${sol(s.gain)}${usd(s.gain)}</span></div><div><small>Verlust · ${s.ln} Trades</small><span style="color:#ff5d73">−${sol(Math.abs(s.loss))}${usd(-Math.abs(s.loss))}</span></div><div><small>Frei / Investiert</small>${sol(s.free)}${usd(s.free)} / ${sol(s.os)}${usd(s.os)}</div></div><div class=mg style="margin-top:8px"><div><small>Heute</small><span style="color:${cl(sum(D0))}">${sg(sum(D0))}</span></div><div><small>7 Tage</small><span style="color:${cl(sum(W7))}">${sg(sum(W7))}</span></div><div><small>Trefferquote</small>${s.pd.length?Math.round(s.gn/s.pd.length*100)+'%':'—'}</div></div><div class=mg style="margin-top:8px"><div><small>Bester Trade</small>${bw.length?X(bw[0].sym)+' '+sg(bw[0].sol):'—'}</div><div><small>Schlechtester</small>${bw.length?X(bw[bw.length-1].sym)+' '+sg(bw[bw.length-1].sol):'—'}</div><div><small>Ø pro Trade</small>${s.pd.length?sg(s.real/s.pd.length):'—'}</div></div><small>Sofortkauf bei jedem Signal mit Score über ${PTC.buy} (Basis-Einsatz ${sol(PTC.size)} SOL, KI skaliert ${SZMIN}×–${SZMAX}× je nach Konfidenz) · Verkauf bei +${PTC.tp*100}% Gewinn oder −${PTC.sl*100}% Verlust · ${PTC.fee*100}% Kosten je Seite · reine Simulation · Trade antippen für Details</small><br><button class=b id=ptr>Zurücksetzen</button></div>${rows||'<div class=em>Noch keine Testtrades. Sobald ein Signal mit Score über '+PTC.buy+' kommt, kauft die Simulation automatisch.</div>'}`}
function botOk(r){const L=PT.done.slice(0,2);
 if(L.length==2&&L.every(d=>d.sol<0)&&Date.now()-L[0].t1<36e5)return'Verlustserie';
 if(PT.done.filter(d=>Date.now()-d.t1<864e5).reduce((a,d)=>a+d.sol,0)<=-PTC.dayLoss)return'Tageslimit';
 if(Object.keys(PT.open).length>=PTC.maxOpen)return'Max. offen';
 if(r.age!=null&&r.age<PTC.minAge)return'zu jung';
 if(r.liq<PTC.minLiq)return'Liquidität';
 if((r.c5||0)>=PTC.maxRun)return'schon gelaufen';if((r.c1||0)>=PTC.maxRun1)return'zu spät (1h)';if(r.liq>0&&r.mc/r.liq>PTC.maxMcLiq)return'dünne Liquidität';
 if(r.flags.some(f=>/^RISIKO|WHALE|MINT|FREEZE|LP RISK|LP UNLOCKED|HONEYPOT|DEV HÄLT|COPYCAT|DÜNNE LIQ|VERKÄUFER|DUMP|RC OFFLINE/.test(f)))return'Rug-Flag';
 if(r.chain=='solana'){const g=r.rug;if(!g||g.score==null)return'Rug-Daten fehlen';if(g.top10!=null&&g.top10>PTC.top10)return'Top-10-Holder';if(g.lpLocked!=null&&g.lpLocked<50)return'LP nicht gesperrt'}
 return''}
function rugOk(r){const fs=r.fs,Lv=QLv();
 const bad=r.flags.find(f=>/MINT|FREEZE|HONEYPOT|VERKÄUFER|DUMP|LIQ-DROP/.test(f)||(Lv==0&&/^RISIKO|WHALE|LP RISK|LP UNLOCKED|DEV HÄLT|COPYCAT|DÜNNE LIQ|RC OFFLINE/.test(f)&&!(fs&&/WHALE|LP RISK|LP UNLOCKED|DÜNNE LIQ/.test(f))));if(bad)return'Rug-Flag '+bad;
 if(r.age!=null&&r.age<(fs?.1:QP('minAge')))return'zu jung';
 if(r.liq<(fs?4e3:QP('minLiq')))return'Liquidität';
 if(!fs&&r.liq>0&&r.mc/r.liq>QP('mcl'))return'dünne Liquidität';
 if(r.chain=='solana'){const g=r.rug;if(!g||g.score==null)return Lv==0?'Rug-Daten fehlen':'';
  if(g.rugged)return'Als Rug markiert';if(g.mint)return'Mint aktiv';if(g.freeze)return'Freeze aktiv';if(g.tf>PTC.tfee)return'Transfer-Steuer';
  if(g.top10!=null&&g.top10>(fs?55:QP('top10')))return'Top-10-Holder';if(!fs&&g.top1!=null&&g.top1>QP('top1'))return'Ein Wallet zu groß';
  if(g.insPct>QP('ins'))return'Insider-Holder';if(g.holders!=null&&g.holders<(fs?30:QP('hold')))return'Zu wenige Holder';
  if(!fs&&Lv==0&&g.lpLocked!=null&&g.lpLocked<50)return'LP nicht gesperrt'}
 return''}
let FSX={},FSC={};const fx=r=>{const x=FSX[r.addr];return x?{rep:x.rep,soc:x.soc,ser:x.cr&&FSC[x.cr]?FSC[x.cr].size-1:0}:{}};
let FSM=new Set(),FSL=[],FSS='',FSN=0,FSB=0,FSD=0;
async function fsFind(){if(!+C.fs||FSB)return;FSB=1;const so=['last_trade_timestamp','last_reply'][FSN++%2],now=Date.now(),add=(m,mc)=>{if(m&&mc>=15e3&&mc<=8e4){FSL.push({chain:'solana',addr:m,t:now});FSM.add(m);return 1}return 0};let n=0;
 try{const r=await fetch('https://frontend-api-v3.pump.fun/coins?offset=0&limit=50&sort='+so+'&order=DESC&includeNsfw=false');if(!r.ok)throw 0;const j=await r.json();(Array.isArray(j)?j:[]).forEach(c=>{if(!c.mint)return;FSX[c.mint]={rep:+c.reply_count||0,soc:['twitter','telegram','website'].filter(k=>c[k]).length,cr:c.creator||''};if(c.creator)(FSC[c.creator]=FSC[c.creator]||new Set()).add(c.mint);if(!c.complete)n+=add(c.mint,+c.usd_market_cap)});if(Object.keys(FSX).length>600)FSX={};if(Object.keys(FSC).length>500)FSC={};FSS='pump.fun ✓ (alle 3 Sek.)'}
 catch(e){if(now-FSD>15e3){FSD=now;try{const j=await J('/latest/dex/search?q=pumpfun');(j.pairs||[]).forEach(p=>{if(p.chainId=='solana'&&p.dexId=='pumpfun')n+=add(p.baseToken.address,p.marketCap||p.fdv||0)});FSS='DexScreener-Suche (pump.fun blockiert)'}catch(x){FSS='keine Quelle erreichbar'}}}
 const m=new Map();FSL.forEach(x=>m.set(x.addr,x));FSL=[...m.values()].filter(x=>now-x.t<3e5).sort((a,b)=>b.t-a.t).slice(0,30);if(FSM.size>400)FSM=new Set(FSL.map(x=>x.addr));FSB=0}
setInterval(fsFind,3e3);fsFind();
function apiw(){let w=document.getElementById('apiw');if(!w){w=document.createElement('div');w.id='apiw';w.style.cssText='display:none;position:fixed;left:8px;right:8px;bottom:8px;z-index:99;padding:10px 12px;border-radius:10px;background:#ff5d73;color:#fff;font-weight:700;text-align:center';w.textContent='⚠ Keine Live-Daten – Datenquelle antwortet nicht';document.body.appendChild(w)}w.style.display=bad>=3?'block':'none'}
function ptExtra(){const pd=PT.done;if(!pd.length)return'';const f=n=>(n>=0?'+':'')+n.toFixed(3),su=x=>x.reduce((a,d)=>a+d.sol,0);
 const rows=[['55–59',55,60],['60–64',60,65],['65+',65,101]].map(([n,a,b])=>{const x=pd.filter(d=>d.score>=a&&d.score<b);return x.length?'<small>Score '+n+': '+x.length+' Trades · '+Math.round(x.filter(d=>d.sol>0).length/x.length*100)+'% Treffer · '+f(su(x))+' SOL</small>':''}).join('<br>');
 const al=pd.filter(d=>d.alt),vg=al.length?'<small>Vergleich ('+al.length+' Trades): Trailing '+f(su(al))+' · Fix 20/20 '+f(al.reduce((a,d)=>a+(d.size||PTC.size)*d.alt.FIX20,0))+' · Fix 30/15 '+f(al.reduce((a,d)=>a+(d.size||PTC.size)*d.alt.FIX30,0))+' SOL</small>':'';
 const tx=ptTime(pd);return '<div style="margin-top:8px"><small><b>Nach Score</b></small><br>'+rows+(vg?'<br><small><b>Ausstiegs-Strategien</b></small><br>'+vg:'')+tx+(PT.sk&&Object.keys(PT.sk).length?'<br><small>Übersprungen: '+Object.entries(PT.sk).map(([a,b])=>a+' '+b).join(' · ')+'</small>':'')+'<br><button class=b id=csvb>⬇ Trades als CSV</button></div>'}
document.addEventListener('click',e=>{if(e.target.id!='csvb')return;const q=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"',H='zeit,symbol,chain,adresse,score,mc_kauf,mc_verkauf,grund,netto,sol,fix20,fix30,hoch,tief',R2=PT.done.map(d=>[new Date(d.t0).toISOString(),d.sym,d.chain,d.addr,d.score,d.mc0,d.mc1,d.why,d.net,d.sol,d.alt&&d.alt.FIX20,d.alt&&d.alt.FIX30,d.hi,d.lo].map(q).join(',')),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([[H].concat(R2).join('\n')],{type:'text/csv'}));a.download='trades.csv';a.click()});
function dsum(){if(!C.tgToken||!C.tgChat)return;const d=new Date(),day=d.toDateString();if(d.getHours()<21||ld('ds','')==day)return;sv('ds',day);const s=ptStats(),T=PT.done.filter(x=>Date.now()-x.t1<864e5),b=[...T].sort((x,y)=>y.sol-x.sol),tot=T.reduce((a,x)=>a+x.sol,0),g=n=>(n>=0?'+':'')+n.toFixed(3);
 fetch('https://api.telegram.org/bot'+C.tgToken+'/sendMessage',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chat_id:C.tgChat,text:`📊 Tagesbilanz\n${T.length} Trades · ${T.filter(x=>x.sol>0).length} Gewinner\nErgebnis ${g(tot)} SOL\n`+(b.length?'Bester: '+b[0].sym+' '+g(b[0].sol)+' · Schlechtester: '+b[b.length-1].sym+' '+g(b[b.length-1].sol)+'\n':'')+'Kapital '+(PTC.start+s.real+s.ov-s.os).toFixed(3)+' SOL'})}).catch(()=>{})}
const TK=t=>t.tk||(t.half?[{p:t.half.p,f:.5}]:[]),bp=(t,pn)=>TK(t).reduce((a,x)=>a+x.f*x.p,0)+(1-TK(t).reduce((a,x)=>a+x.f,0))*pn;
function ptTime(pd){const f=n=>(n>=0?'+':'')+n.toFixed(3),g=(l,a)=>a.length?l+' '+a.length+'× '+Math.round(a.filter(d=>d.sol>0).length/a.length*100)+'% '+f(a.reduce((s,d)=>s+d.sol,0)):'';
 const H=[['0–6',0,6],['6–12',6,12],['12–18',12,18],['18–24',18,24]].map(([n,a,b])=>g(n+' Uhr:',pd.filter(d=>{const h=new Date(d.t0).getHours();return h>=a&&h<b}))).filter(Boolean),D=['So','Mo','Di','Mi','Do','Fr','Sa'].map((n,i)=>g(n,pd.filter(d=>new Date(d.t0).getDay()==i))).filter(Boolean),hl=pd.filter(d=>d.hi!=null),
 hi=hl.length?'<br><small>Ø höchster Stand '+(hl.reduce((a,d)=>a+d.hi,0)/hl.length*100).toFixed(0)+'% · Ø tiefster '+(hl.reduce((a,d)=>a+d.lo,0)/hl.length*100).toFixed(0)+'% · '+hl.filter(d=>d.hi>=.25&&d.sol<0).length+' Trades erreichten ≥+25%, endeten aber im Minus</small>':'';
 return '<br><small><b>Nach Uhrzeit</b></small><br><small>'+H.join(' · ')+'</small><br><small><b>Nach Wochentag</b></small><br><small>'+D.join(' · ')+'</small>'+hi}
async function liveExec(side,r,t,size){if(!+C.live||!C.botUrl||!C.botKey)return;try{const sol=size!=null?size:(t&&t.size!=null?t.size:PTC.size);const res=await fetch(C.botUrl.replace(/\/$/,'')+'/execute',{method:'POST',headers:{'x-key':C.botKey,'content-type':'application/json'},body:JSON.stringify({side,chain:r?r.chain:t.chain,addr:r?r.addr:t.addr,sol,key:r?r.key:undefined})});if(!res.ok)toast('⚠️ Echter Trade fehlgeschlagen: HTTP '+res.status)}catch(e){toast('⚠️ Echter Trade fehlgeschlagen: '+e.message)}}
async function wSync(force){if(!C.botUrl||!C.botKey)return;const ks=Object.keys(PT.open).sort().join(),now=Date.now();if(!force&&ks==wSync.k&&(now-(wSync.t||0)<3e5||!ks))return;wSync.k=ks;wSync.t=now;
 try{await fetch(C.botUrl.replace(/\/$/,'')+'/sync',{method:'POST',headers:{'x-key':C.botKey,'content-type':'application/json'},body:JSON.stringify({open:PT.open,cfg:PTC})})}catch(e){}}
async function wPull(){if(!C.botUrl||!C.botKey)return;try{const r=await fetch(C.botUrl.replace(/\/$/,'')+'/state',{headers:{'x-key':C.botKey}});if(!r.ok)return;const w=await r.json();let ch=0;
 for(const d of w.done||[]){if(PT.done.some(x=>x.addr+x.t0==d.addr+d.t0)||d.t0<(PT.rs||0))continue;PT.done.unshift(d);delete PT.open[d.chain+':'+d.addr];ch=1}
 for(const k in w.open||{}){const t=PT.open[k],o=w.open[k];
  if(!t){if(o.origin=='bot'){PT.open[k]={...o};ch=1}continue} // vom Worker eröffneter Trade -> übernehmen (App verkauft ihn nicht selbst)
  t.peak=Math.max(t.peak||0,o.peak||0);t.lo=Math.min(t.lo||t.mc0,o.lo||t.mc0);if((o.tk||[]).length>(t.tk||[]).length)t.tk=o.tk;t.x=t.x||{};for(const a in o.x||{})if(t.x[a]==null&&o.x[a]!=null)t.x[a]=o.x[a]}
 if(ch){PT.done.sort((a,b)=>b.t1-a.t1);PT.done=PT.done.slice(0,150)}sv('pt',PT);if(ch)draw()}catch(e){}}
setInterval(wPull,2e4);setInterval(wSync,6e4);
function ptBuy(r){const size=sizeFor(r);PT.open[r.key]={sym:r.sym,chain:r.chain,addr:r.addr,mc0:r.mc,last:r.mc,t0:Date.now(),score:r.score,peak:r.mc,liq0:r.liq,f:feat(r),slip:0,size,x:{FIX20:null,FIX30:null}};sv('pt',PT);wSync(1);liveExec('buy',r,null,size)}
function ptConfirm(){const P=PT.pend;if(!P)return;for(const k of Object.keys(P)){const p=P[k];if(Date.now()-p.t<PTC.confirm)continue;delete P[k];const r=R.find(x=>x.key==k),w=!r?'Bestätigung':PT.open[k]?'':(r.mc<p.mc*.95||r.mc>p.mc*1.12||(r.c5||0)<-3)?'Bestätigung':botOk(r)||(ptStats().free<sizeFor(r)-1e-9?'Kein Kapital':'');
 if(w){PT.sk=PT.sk||{};PT.sk[w]=(PT.sk[w]||0)+1;sv('pt',PT)}else if(r&&!PT.open[k])ptBuy(r);else sv('pt',PT)}}
function ptTick(best){let n=0;for(const k of Object.keys(PT.open)){const t=PT.open[k],p=best[k],mc=p?(p.marketCap||p.fdv||0):0;if(mc>0)t.last=mc;const pnl=t.last/t.mc0-1;
  if(t.origin=='bot')continue; // nur Anzeige aktualisieren, Verkauf entscheidet ausschließlich der Worker
  if(mc>0){t.peak=Math.max(t.peak||t.mc0,mc);t.lo=Math.min(t.lo||t.mc0,mc);const X=t.x||(t.x={});for(const a of [['FIX20',.2,.2],['FIX30',.3,.15]])if(X[a[0]]==null){if(pnl>=a[1])X[a[0]]=a[1];else if(pnl<=-a[2])X[a[0]]=pnl}const K=t.tk||(t.tk=TK(t).slice());for(const st of PTC.stages)if(pnl>=st[0]&&!K.some(x=>x.p==st[0]))K.push({p:st[0],f:st[1]})}
  if(mc>0)coachAlt(t,pnl);const lq=p&&p.liquidity?+p.liquidity.usd||0:0,fl=Math.max(PTC.floor,2*(PTC.fee+(t.slip||0))+.03),pk=(t.peak||t.mc0)/t.mc0-1,m5=p&&p.priceChange?+p.priceChange.m5||0:0,trl=pk>=.4?PTC.tr2:PTC.tr,armed=pk>=PTC.arm;let w=null;
  if(mc>0&&pnl>=PTC.tp)w='TP';else if(mc>0&&pnl<=-PTC.sl)w='SL';else if(mc>0&&CO.ex&&pk>=CO.ex.arm&&pnl<=CO.ex.stop)w='LOCK';
  if(!w&&lq>0){t.lqm=Math.max(t.lqm||t.liq0||0,lq);if(lq<t.lqm*(1-PTC.rug)&&pnl<0)w='RUG'}
  if(w){ptClose(k,pnl,w);n++}}return n}
async function ptFast(){const o=Object.values(PT.open);if(!o.length||ptFast.b)return;ptFast.b=1;try{const by={},best={};o.forEach(t=>(by[t.chain]=by[t.chain]||[]).push(t.addr));for(const c in by)for(let i=0;i<by[c].length;i+=30){const ch=by[c].slice(i,i+30);for(const p of await J('/tokens/v1/'+c+'/'+ch.join(','))){if(!ch.includes(p.baseToken.address))continue;const key=c+':'+p.baseToken.address,l=(p.liquidity||{}).usd||0;if(!best[key]||l>((best[key].liquidity||{}).usd||0))best[key]=p}}const n=ptTick(best);sv('pt',PT);if(n)draw()}catch(e){}ptFast.b=0}
setInterval(ptFast,1200);document.addEventListener('visibilitychange',()=>{if(!document.hidden)ptFast()});
function ptClose(k,pnl,why){const t=PT.open[k],sz=t.size||PTC.size,xs=(why=='SL'||why=='MOM'||why=='RUG'||why=='LOCK')?.02:0,nt=q=>(1+q)*(1-PTC.fee-(t.slip||0)-xs)/(1+PTC.fee+(t.slip||0))-1,net=TK(t).reduce((a,x)=>a+x.f*nt(x.p),0)+(1-TK(t).reduce((a,x)=>a+x.f,0))*nt(pnl),alt={};for(const a in (t.x||{}))alt[a]=nt(t.x[a]==null?pnl:t.x[a]);PT.done.unshift({alt,hi:(t.peak||t.mc0)/t.mc0-1,lo:(t.lo||t.mc0)/t.mc0-1,f:t.f,sym:t.sym,chain:t.chain,addr:t.addr,score:t.score,mc0:t.mc0,mc1:t.last,pnl:bp(t,pnl),net,size:sz,sol:sz*net,why,t0:t.t0,t1:Date.now()});PT.done=PT.done.slice(0,150);delete PT.open[k];sv('pt',PT);liveExec('sell',null,t);crTrack(t.addr,sz*net);try{coachLearn(PT.done[0])}catch(e){}}
function ping(r,tag,kind){const NOW=Date.now();FD.unshift({ts:NOW,t:new Date(NOW).toTimeString().slice(0,5),tag,sym:r.sym,addr:r.addr,chain:r.chain,key:r.key,mc:r.mc,score:r.score});FD=FD.slice(0,120);sv('fd',FD);
 if(false&&tag=='🔔 SIGNAL'&&r.score>=PTC.min&&!PT.open[r.key]){const w=botOk(r);if(w){PT.sk=PT.sk||{};PT.sk[w]=(PT.sk[w]||0)+1;sv('pt',PT)}}
 if(false&&tag=='🔔 SIGNAL'&&r.score>=PTC.min&&!PT.open[r.key]&&botOk(r)==''){PT.pend=PT.pend||{};if(!PT.pend[r.key]){PT.pend[r.key]={t:Date.now(),mc:r.mc};sv('pt',PT)}}
 if(tag=='🔔 SIGNAL'&&!TR[r.key]){TR[r.key]={t0:Date.now(),mc0:r.mc,peak:r.mc,chain:r.chain,addr:r.addr,sym:r.sym,score:r.score,fl:r.flags.slice(),m1:null};sv('tr',TR)}
 navigator.vibrate&&navigator.vibrate([200,100,200]);beep(kind);
 if('Notification' in window&&Notification.permission=='granted'){const b='🕐 '+tm(NOW)+' · '+r.sym+' · MC '+F(r.mc)+' · Score '+r.score;
  const f=()=>{try{new Notification(tag,{body:b})}catch(e){}};navigator.serviceWorker?navigator.serviceWorker.ready.then(g=>g.showNotification(tag,{body:b})).catch(f):f()}
 if(C.tgToken&&C.tgChat&&(r.score>=(+C.tgMin||0)||tag.startsWith('⭐'))){const txt='🕐 '+tm(NOW)+' Uhr · '+dl(NOW)+'\n'+tag+' '+r.sym+' ('+CHN[r.chain]+')\nMC '+F(r.mc)+' · Score '+r.score+' · Liq '+F(r.liq)+'\nhttps://dexscreener.com/'+r.chain+'/'+r.addr+'\n'+r.addr;
  fetch('https://api.telegram.org/bot'+C.tgToken+'/sendMessage',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chat_id:C.tgChat,text:txt,reply_markup:{inline_keyboard:[[{text:'Chart',url:'https://dexscreener.com/'+r.chain+'/'+r.addr},{text:'RugCheck',url:'https://rugcheck.xyz/tokens/'+r.addr}]]}})}).catch(()=>{})}}
let LQH={},AD=[],BO=new Set(),FT=0,SPT=0,SVT=0,VPT=0,LT=0,SCANNING=false,VH={},LS=0;
let BWR=null,BWT=ld('bwt',0)||Date.now();
const WINDOW_MS=120000;
