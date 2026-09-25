// Smart Lab – Teil 04: Haupt-Scan-Schleife und Karten-/Feed-Rendering-Helfer
// Automatisch aus der ursprünglichen einzelnen index.html aufgeteilt.
// Reihenfolge ist wichtig: diese Dateien werden in genau dieser Reihenfolge geladen
// und teilen sich (wie vorher) denselben globalen Scope - nichts wurde inhaltlich veraendert.

async function scan(){if(SCANNING)return;SCANNING=true;try{
 let ad=[],bo=new Set(),best={};const fe=Date.now()-FT>(AD.length?8e3:2e3);if(fe)FT=Date.now();
 if(fe)for(const [p,b] of [['/token-profiles/latest/v1',0],['/token-boosts/latest/v1',1],['/token-boosts/top/v1',1]])try{const j=(await J(p)).filter(x=>CHAINS.includes(x.chainId));
  j.forEach(x=>{if(x.links&&x.links.length)LK[x.chainId+':'+x.tokenAddress]=x.links});
  const a=j.map(x=>({chain:x.chainId,addr:x.tokenAddress}));ad.push(...a);if(b)a.forEach(x=>bo.add(x.chain+':'+x.addr))}catch(e){}
  {const seen=new Set();ad=ad.filter(x=>{const k=x.chain+':'+x.addr;if(seen.has(k))return false;seen.add(k);return true})}
 if(fe)try{const g=await gtScan(),sn=new Set(ad.map(x=>x.chain+':'+x.addr));g.forEach(x=>{const k=x.chain+':'+x.addr;if(!sn.has(k)){sn.add(k);ad.push(x)}})}catch(e){}
 if(fe&&ad.length){AD=ad;BO=bo}ad=AD;bo=BO;if(+C.fs){const sn=new Set(ad.map(x=>x.addr));ad=ad.concat(FSL.filter(x=>!sn.has(x.addr)))}
 const byChain={};ad.forEach(x=>{(byChain[x.chain]=byChain[x.chain]||[]).push(x.addr)});
 const trAll=Object.keys(TR);
 const trAlive=trAll.filter(k=>Date.now()-TR[k].t0<3e5);
 trAlive.forEach(k=>{const t=TR[k];byChain[t.chain]=byChain[t.chain]||[];if(!byChain[t.chain].includes(t.addr))byChain[t.chain].push(t.addr)});
 Object.values(PT.open).concat(CO.sh).forEach(t=>{byChain[t.chain]=byChain[t.chain]||[];if(!byChain[t.chain].includes(t.addr))byChain[t.chain].push(t.addr)});
 for(const chain in byChain){const list=byChain[chain];
  for(let i=0;i<list.length;i+=30){const ch=list.slice(i,i+30);
   try{for(const p of await J('/tokens/v1/'+chain+'/'+ch.join(','))){if(!ch.includes(p.baseToken.address))continue;p._chain=chain;const key=chain+':'+p.baseToken.address,l=(p.liquidity||{}).usd||0;if(!best[key]||l>((best[key].liquidity||{}).usd||0))best[key]=p}}
   catch(e){ // DexScreener down/rate-limitiert für diesen Batch -> GeckoTerminal-Fallback statt Datenlücke
    try{for(const p of await gtFallback(chain,ch)){const key=chain+':'+p.baseToken.address;if(!best[key])best[key]=p}}catch(e2){}}}}
 let stzDirty=false;
 ptTick(best);
 {const q=ptStats(),v=PTC.start+q.real+q.ov-q.os;PT.eq=PT.eq||[];const L=PT.eq[PT.eq.length-1];if(!L||Date.now()-L[0]>=3e5)PT.eq.push([Date.now(),+v.toFixed(4)]);PT.eq=PT.eq.slice(-1000)}dsum();ptConfirm();
 sv('pt',PT);
 for(const k of trAll){const t=TR[k],p=best[k],age=Date.now()-t.t0,mc=p?(p.marketCap||p.fdv||0):0;if(p){if(mc>t.peak)t.peak=mc;if(t.m1==null&&age>=1.5e5)t.m1=mc}
  if(age>=3e5){const gain=Math.max(t.peak,mc)/t.mc0-1,win=gain>=.2;STZ.total++;if(win)STZ.wins++;else STZ.losses++;STZH.unshift({sym:t.sym,chain:t.chain,gain,win,score:t.score??null,g1:t.m1!=null?t.m1/t.mc0-1:null,g6:p?(p.marketCap||p.fdv||0)/t.mc0-1:null,fl:t.fl||[],t:Date.now()});STZH=STZH.slice(0,60);delete TR[k];stzDirty=true}}
 if(stzDirty){sv('stz',STZ);sv('stzh',STZH)}sv('tr',TR);
 const spg=Date.now()-SPT>15e3;if(spg)SPT=Date.now();R=Object.values(best).map(p=>st(p,bo));
 {const now=Date.now(),symCount={};R.forEach(r=>{const s=r.sym.toUpperCase();symCount[s]=(symCount[s]||0)+1});
  R.forEach(r=>{if(symCount[r.sym.toUpperCase()]>=3){r.flags.push('COPYCAT');r.score=Math.max(0,r.score-10)}
   const h=LQH[r.key]=LQH[r.key]||[];h.push([now,r.liq]);while(h.length&&now-h[0][0]>3e5)h.shift();
   const mx=Math.max(...h.map(x=>x[1]));if(h.length>=3&&mx>0&&r.liq<mx*.75){r.flags.push('LIQ-DROP');r.score=Math.max(0,r.score-25)}});
  for(const k in LQH)if(!best[k]&&now-LQH[k][LQH[k].length-1][0]>3e5)delete LQH[k]}
 try{coachTick();coachObserve()}catch(e){}
 {const now=Date.now();for(const r of [...R].sort((a,b)=>QPri(b)-QPri(a))){if(r.chain!='solana'||r.score<=QBuy()||PT.open[r.key]||!hitQ(r))continue;
   if(PT.done.some(d=>d.addr==r.addr&&now-d.t1<3e5)||ptStats().free<sizeFor(r)-1e-9)continue;
   if(coachGate(r))continue;ptBuy(r)}}
 R.forEach(r=>{if(r.mc>=5e4&&!(LK[r.key]&&LK[r.key].length))r.flags.push('KEINE SOCIALS')});
 {const spgV=Date.now()-VPT>15e3;if(spgV)VPT=Date.now();
  R.forEach(r=>{const v=VH[r.key]=VH[r.key]||[];
   if(v.length>=3){const avg=v.reduce((a,b)=>a+b,0)/v.length;
    if(avg>0&&r.v1>=avg*2.5&&r.v1>=2000){r.flags.push('VOL-SPIKE');r.score=Math.min(100,r.score+8)}}
   if(spgV){v.push(r.v1);if(v.length>8)v.shift()}})}
 bad=R.length?0:bad+1;apiw();const old=KN;R.forEach(r=>{r.nw=!!old&&!old.has(r.key);if(spg)SP[r.key]=(SP[r.key]||[]).concat(r.mc).slice(-30)});KN=new Set([...(old||[]),...R.map(r=>r.key)]);
 $('#er').textContent=R.length?'':'Keine Live-Daten ('+(LE||'keine Antwort')+'). Öffne die App im Browser (Safari/Chrome) über deinen Hoster, nicht in der Claude-Vorschau. Es werden nie Fake-Daten angezeigt.';
 for(const a in Hh)if(Date.now()-Hh[a].t>1728e5)delete Hh[a];
 for(const k in SM)if(Date.now()-SM[k]>6048e5)delete SM[k];
 const cd=Math.max(1,C.cooldown||30)*6e4;
 for(const k in SNZ)if(SNZ[k]<Date.now())delete SNZ[k];
 const quiet=inQuiet();
 for(const r of R.filter(x=>x.score>=55&&(x.age==null||x.age*60>=(+C.minAge||0)))){
  if(SNZ[r.key])continue;
  if(hit(r)&&(!SM[r.key]||Date.now()-SM[r.key]>cd)){SM[r.key]=Date.now();if(!quiet)ping(r,'🔔 SIGNAL','sig')}
  else if(r.since>=1&&r.liq>=C.liq&&(!SM[r.key+'x2']||Date.now()-SM[r.key+'x2']>cd)){SM[r.key+'x2']=Date.now();if(!quiet)ping(r,'🚀 x2 seit Fund','x2')}}
 const wThresh=Math.max(1,+C.watchPct||15)/100;
 for(const k of W){if(SNZ[k])continue;const live=R.find(x=>x.key==k);if(!live)continue;const base=WV[k];
  if(!base){WV[k]={mc:live.mc,t:Date.now()};continue}
  const chg=live.mc/base.mc-1;
  if(Math.abs(chg)>=wThresh&&(!SM[k+'w']||Date.now()-SM[k+'w']>cd)){SM[k+'w']=Date.now();if(!quiet)ping(live,chg>=0?'⭐ Watchlist +'+Math.round(chg*100)+'%':'⭐ Watchlist '+Math.round(chg*100)+'%','sig');WV[k]={mc:live.mc,t:Date.now()}}}
 sv('snz',SNZ);sv('wv',WV);sv('s2',SM);if(Date.now()-SVT>3e4){SVT=Date.now();sv('h',Hh)}LS=Date.now();$('#ts').textContent=new Date().toTimeString().slice(0,8);if(Date.now()-LT>4e3)draw()
}finally{SCANNING=false}}
const sp=x=>{const v=SP[x.key]||[];if(v.length<2)return '';const lo=Math.min(...v),hi=Math.max(...v),d=hi-lo||1,pts=v.map((y,i)=>(i*60/(v.length-1)).toFixed(1)+','+(18-(y-lo)/d*16).toFixed(1)).join(' ');return `<svg width=60 height=20><polyline fill=none stroke="${v[v.length-1]>=v[0]?'#22e58f':'#ff5470'}" stroke-width=1.6 points="${pts}"/></svg>`};
const chainUrl=(chain,addr)=>chain=='base'?'https://basescan.org/token/'+addr:chain=='bsc'?'https://bscscan.com/token/'+addr:'https://solscan.io/token/'+addr;
const P=v=>`<td class="${v>=0?'up':'dn'}">${v.toFixed(0)}%</td>`;
const ca=a=>a.slice(0,4)+'…'+a.slice(-4),pc=v=>`<span class="${v>=0?'up':'dn'}">${v>=0?'+':''}${v.toFixed(0)}%</span>`;
function cp(a){const ok=()=>{const t=$('#toast');t.textContent='CA kopiert ✓ '+ca(a);t.className='toast on';setTimeout(()=>t.className='toast',1600)};
 const man=()=>{$('#mo').style.display='flex';const i=$('#mi');i.value=a;i.focus();i.select();try{i.setSelectionRange(0,a.length)}catch(x){}};
 let s=false;try{const e=document.createElement('textarea');e.value=a;e.readOnly=true;e.style.cssText='position:fixed;top:0;left:0;font-size:16px;opacity:0';document.body.appendChild(e);e.focus();e.select();e.setSelectionRange(0,a.length);s=document.execCommand('copy');e.remove()}catch(x){}
 if(s)return ok();
 if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(a).then(ok,man);else man()}
const lk=x=>(LK[x.key]||[]).filter(l=>l.url&&l.url.startsWith('https://')).slice(0,5).map(l=>{const k=(l.type||l.label||'').toLowerCase();return `<a target=_blank href="${X(l.url)}">${k=='telegram'?'✈ Telegram':k=='twitter'?'𝕏':k=='discord'?'Discord':'🌐 '+X(l.label||'Web')}</a>`}).join('');
const ln=x=>lk(x)+`<a target=_blank href="https://dexscreener.com/${x.chain}/${X(x.addr)}">Chart</a>`+(x.chain=='solana'?`<a target=_blank href="https://rugcheck.xyz/tokens/${X(x.addr)}">RugCheck</a>`:'');
const card=x=>`<div class="cd ${hit(x)?'hit':''} ${x.nw?'nw':''}"><div class=ch><button data-s="${X(x.key)}" class="${W.has(x.key)?'st':''}">${W.has(x.key)?'★':'☆'}</button><button data-z="${X(x.key)}" title="12h stummschalten" class="${SNZ[x.key]?'st':''}">${SNZ[x.key]?'🔕':'🔔'}</button><b>${X(x.sym)}</b><span class=chn>${CHN[x.chain]||x.chain}</span><span class=sc style="background:hsl(${x.score*1.2},85%,58%)">${x.score}</span>${x.flags.map(f=>`<span class="f ${f=='BOOST'?'B':/^RISIKO|WHALE|MINT|FREEZE|LP RISK|LP UNLOCKED|HONEYPOT|DEV HÄLT|COPYCAT|MULTI-CHAIN/.test(f)?'W':''}">${X(f)}</span>`).join('')}<span class=ag>${x.age==null?'':x.age<1?Math.round(x.age*60)+' min':x.age.toFixed(1)+' h'}</span></div>
<button class=ca data-c="${X(x.addr)}"><code>${X(x.addr)}</code><span>⧉ kopieren</span></button>
<div class=mg><div><small>MCap</small>${F(x.mc)}</div><div><small>Vol 1h</small>${F(x.v1)}</div><div><small>Liq</small>${F(x.liq)}</div><div><small>5m</small>${pc(x.c5)}</div><div><small>1h</small>${pc(x.c1)}</div><div><small>Käufer</small>${(x.ratio*100).toFixed(0)}%</div>${x.rug&&x.rug.score!=null?`<div><small>RugCheck</small>${x.rug.score}</div>`:''}</div>
${al2(x)?`<small style="display:block;color:var(--g);margin-top:8px">🔔 Call um ${tm(al2(x).ts)} Uhr · bei MC ${F(al2(x).mc)}${al2(x).mc?' · seither '+pc((x.mc/al2(x).mc-1)*100):''} · ${ago(al2(x).ts)}</small>`:''}<div class=cf2>${sp(x)}<div class=lk>${ln(x)}</div></div></div>`;
const cardC=x=>`<div class="cd cp ${hit(x)?'hit':''} ${x.nw?'nw':''}" data-c="${X(x.addr)}"><button data-s="${X(x.key)}" class="${W.has(x.key)?'st':''}">${W.has(x.key)?'★':'☆'}</button><b>${X(x.sym)}</b><span class=chn>${CHN[x.chain]||x.chain}</span><span class=sc style="background:hsl(${x.score*1.2},85%,58%)">${x.score}</span>${pc(x.c5)}<span class=ag>${F(x.mc)}</span></div>`;
function renderFeed(){const q=($('#fq')?.value||'').toLowerCase();
 const list=FD.filter(f=>!q||f.sym.toLowerCase().includes(q)||f.addr.toLowerCase().includes(q)||f.tag.toLowerCase().includes(q));
 $('#fd').innerHTML=list.map(f=>{const live=R.find(x=>x.key==f.key);const chg=live?live.mc/f.mc-1:null;
  return `<div class=bub><small>🕐 ${f.ts?tm(f.ts)+' Uhr · '+dl(f.ts)+' · '+ago(f.ts):X(f.t)} · ${X(f.tag)} · ${CHN[f.chain]||''}</small><b>${X(f.sym)}</b> · MC ${F(f.mc)}${f.score!=null?' · Score '+f.score:''}${chg!=null?` · seit Alarm ${pc(chg*100)}`:''}<button class=ca data-c="${X(f.addr)}"><code>${X(f.addr)}</code><span>⧉ kopieren</span></button><div class=lk>${ln(f)}</div></div>`}).join('')||'<div class=em>Noch keine Alarme. Sie erscheinen hier wie in einem Chat.</div>'}
function suggestThreshold(){const h=STZH.filter(x=>x.score!=null);if(h.length<10)return null;
 const steps=[...new Set(h.map(x=>Math.floor(x.score/5)*5))].sort((a,b)=>a-b);
 let best=null;
 for(const b of steps){const arr=h.filter(x=>x.score>=b);if(arr.length<8)continue;const wr=arr.filter(x=>x.win).length/arr.length;
  if(!best||wr>best.wr+.03||(wr>=best.wr-.02&&b>best.b))best={b,wr,n:arr.length}}
 return best}
function renderPerf(){const wr=STZ.total?Math.round(STZ.wins/STZ.total*100):null;const sug=suggestThreshold();
 const openList=Object.values(TR);
 const fs={};STZH.forEach(h=>(h.fl||[]).forEach(f=>{const k=f.replace(/ \d+%$/,'');(fs[k]=fs[k]||{n:0,w:0}).n++;if(h.win)fs[k].w++}));
 const fst=Object.entries(fs).filter(([k,v])=>v.n>=3).sort((a,b)=>b[1].w/b[1].n-a[1].w/a[1].n).map(([k,v])=>X(k)+' '+Math.round(v.w/v.n*100)+'% ('+v.n+')').join(' · ');
 const td=STZH.filter(h=>Date.now()-h.t<864e5),best=td.reduce((m,h)=>!m||h.gain>m.gain?h:m,null);
 const daily='Heute: '+FD.filter(f=>f.ts&&Date.now()-f.ts<864e5&&f.tag.includes('SIGNAL')).length+' Signale · '+td.length+' ausgewertet, '+td.filter(h=>h.win).length+' Treffer'+(best?' · Bester: '+X(best.sym)+' '+pc(best.gain*100):'');
 const pd=PT.done,pw=pd.filter(d=>d.sol>0).length,ps=pd.reduce((a,d)=>a+d.sol,0),po=Object.values(PT.open);
 const pt=`<div class=cd><div class=ch><b>📝 Paper-Trading</b><span class=ag>Ø ${PTC.size} SOL (KI-skaliert) pro Signal mit Score über ${PTC.buy}</span></div><div class=mg><div><small>Ergebnis</small>${ps>=0?'+':''}${ps.toFixed(3)} SOL</div><div><small>Trefferquote</small>${pd.length?Math.round(pw/pd.length*100)+'%':'—'}</div><div><small>Trades</small>${pd.length} (+${po.length} offen)</div></div><small>Sofortkauf bei Score über ${PTC.buy} · Einsatz ${SZMIN}×–${SZMAX}× Basisgröße je nach KI-Konfidenz · Verkauf bei +${PTC.tp*100}% oder −${PTC.sl*100}% · ${PTC.fee*100}% Kosten je Seite · reine Simulation</small>${ptExtra()}${po.slice(0,6).map(t=>`<div><small>⏳ ${X(t.sym)} · offen · ${pc((t.last/t.mc0-1)*100)}</small></div>`).join('')}${pd.slice(0,8).map(d=>`<div><small>${d.sol>=0?'✅':'❌'} ${X(d.sym)} · ${d.why} · ${pc(d.net*100)} · ${d.sol>=0?'+':''}${d.sol.toFixed(3)} SOL</small></div>`).join('')}</div>`;
 const open=openList.map(t=>{const live=R.find(x=>x.key==t.chain+':'+t.addr);const now=live?live.mc:t.peak,chg=now/t.mc0-1;
  return `<div class=cd><div class=ch><b>${X(t.sym)}</b><span class=chn>${CHN[t.chain]}</span><span class=ag>läuft seit ${Math.round((Date.now()-t.t0)/6e4)} Min</span></div><div class=mg><div><small>Start-MCap</small>${F(t.mc0)}</div><div><small>Peak</small>${F(t.peak)}</div><div><small>Aktuell</small>${live?pc(chg*100):'—'}</div></div></div>`}).join('');
 const hist=STZH.slice(0,20).map(h=>`<div class=cd><div class=ch><b>${X(h.sym)}</b><span class=chn>${CHN[h.chain]}</span><span class="f ${h.win?'B':'W'}">${h.win?'TREFFER':'VERFEHLT'}</span><span class=ag>${new Date(h.t).toLocaleDateString('de-DE')}</span></div><div class=mg><div><small>Peak</small>${pc(h.gain*100)}</div><div><small>Nach 2,5 Min</small>${h.g1!=null?pc(h.g1*100):'—'}</div><div><small>Nach 5 Min</small>${h.g6!=null?pc(h.g6*100):'—'}</div></div></div>`).join('');
 $('#cards').innerHTML=`<div class=em style="text-align:left"><b style="font-size:18px">${wr==null?'Noch keine abgeschlossenen Signale':'Trefferquote: '+wr+'% ('+STZ.wins+' von '+STZ.total+')'}</b><br><small>Ein Signal zählt als Treffer, wenn die MarketCap innerhalb von 5 Min nach Alarm um ≥20% über dem Startwert lag.</small><br><small>${daily}</small>${fst?'<br><small>Trefferquote je Flag: '+fst+'</small>':''}${sug&&sug.b!=C.score?`<br><small>💡 Vorschlag: Score-Filter auf ${sug.b} setzen (${Math.round(sug.wr*100)}% Trefferquote bei ${sug.n} Signalen, aktuell ${C.score})</small>`:''}</div>
 ${openList.length?'<div class=em style="text-align:left">🔴 Live verfolgt ('+openList.length+')</div>'+open:''}
 ${hist.length?'<div class=em style="text-align:left">Verlauf</div>'+hist:'<div class=em>Noch keine abgeschlossenen Signale (dauert bis zu 5 Min nach dem ersten Alarm).</div>'}`}
