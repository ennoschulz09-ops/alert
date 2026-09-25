// Smart Lab – Teil 05: UI-Rendering (draw), Klick-Handler, Push-Setup, Start der App
// Automatisch aus der ursprünglichen einzelnen index.html aufgeteilt.
// Reihenfolge ist wichtig: diese Dateien werden in genau dieser Reihenfolge geladen
// und teilen sich (wie vorher) denselben globalen Scope - nichts wurde inhaltlich veraendert.

function draw(){document.body.classList.toggle('sb',view!='home');document.querySelectorAll('#nv [data-v]').forEach(b=>b.classList.toggle('on',b.dataset.v==view));const q=$('#q').value.toLowerCase(),fv=view=='feed',pv=view=='perf'||view=='dash'||view=='stats';document.querySelectorAll('.tile').forEach(e=>e.classList.toggle('on',e.dataset.v==view));$('#tw').style.display=fv?'none':'';$('#fa').style.display=fv?'':'none';$('#hot').style.display=(fv||pv)?'none':'';$('#sr').style.display=pv?'none':'flex';
 let r=R.filter(x=>x.score>=DM&&CE.includes(x.chain)&&(x.sym.toLowerCase().includes(q)||x.addr.toLowerCase().includes(q))&&(view!='watch'||W.has(x.key))&&(view!='sig'||hit(x))&&(!$('#rk').checked||!x.flags.some(f=>['DÜNNE LIQ','VERKÄUFER','DUMP','MÖGL. HONEYPOT','COPYCAT'].includes(f)||/^RISIKO|MINT|FREEZE|LP RISK|LP UNLOCKED|DEV HÄLT/.test(f))));
 R.forEach(x=>{const f=al2(x);x.al=f?f.ts:0});r.sort((a,b)=>{const x=a[key]??999,y=b[key]??999;return((x>y)-(x<y))*dir});
 $('#k1').textContent=R.filter(x=>x.score>=DM).length+' Chancen';if($('#hk1'))$('#hk1').textContent=R.filter(x=>x.score>=DM).length+' Chancen live';{const s=ptStats();const v=PTC.start+s.real+s.ov-s.os;$('#k6').textContent=sol(v)+' SOL'+usd(v)}$('#k2').textContent=R.filter(hit).length+' aktiv';$('#k3').textContent=W.size+' ★ · Top '+Math.max(0,...R.map(x=>x.score));
 const tb=R.reduce((a,x)=>a+x.b,0),tsl=R.reduce((a,x)=>a+x.s,0),br=tb+tsl?tb/(tb+tsl)*100:50;$('#k4').textContent='Käufer '+br.toFixed(0)+'%';$('#br').style.width=br+'%';
 $('#k5').textContent=STZ.total?Math.round(STZ.wins/STZ.total*100)+'% Trefferquote':'noch keine Daten';
 if(pv){view=='dash'?renderDash():view=='stats'?(renderStats(),$('#cards').insertAdjacentHTML('beforeend',stratHtml()+optimizeHtml()+coachHtml()+`<div class=cd>`+featImpHtml().replace(/^<div class=cd>|<\/div>$/g,'')+walkHtml()+`</div>`+crHtml())):renderPerf();renderFeed();R.forEach(r=>r.nw=false);return}
 $('#hot').innerHTML=[...R].filter(x=>x.score>=DM).sort((a,b)=>b.score-a.score).slice(0,3).map(x=>`<div class=hc><small>🔥 Top Score</small><br><b>${X(x.sym)}</b> <span class=chn>${CHN[x.chain]}</span> <span class=sc style="background:hsl(${x.score*1.2},85%,58%)">${x.score}</span><br><small>${F(x.mc)} · 5m ${x.c5.toFixed(0)}%</small>${coachP(x)}${al2(x)?'<br><small style="color:var(--g)">🔔 '+tm(al2(x).ts)+' · bei '+F(al2(x).mc)+'</small>':''}<br>${sp(x)}<button class=ca data-c="${X(x.addr)}"><code>${X(x.addr)}</code><span>⧉ kopieren</span></button></div>`).join('');
 $('#sr').innerHTML=[['score','Score'],['al','Neue Alarme']].map(([k,n])=>`<button data-k="${k}" class="${k==key?'on':''}">${n}${k==key?(dir<0?' ▼':' ▲'):''}</button>`).join('');
 $('#chn').innerHTML=CHAINS.map(c=>`<button data-ch="${c}" class="${CE.includes(c)?'on':''}">${CHN[c]} <span style="opacity:.6">${R.filter(x=>x.chain==c).length}</span></button>`).join('');
 $('#cards').innerHTML=r.slice(0,60).map(CP?cardC:card).join('')||`<div class=em>${R.length?'Gerade keine Tokens mit Score ≥ '+DM+' ('+R.length+' gescannt, alle darunter). Das ist normal, der Filter ist streng.':'Warte auf Live-Daten …'}</div>`;
 renderFeed();R.forEach(r=>r.nw=false)}
document.onclick=e=>{if(e.target.id=='mo'||e.target.closest('[data-m]')){$('#mo').style.display='none';return}
 if(e.target.dataset.sz){ptSetSize(+e.target.dataset.sz);return}
 if(e.target.id=='cpb'){CP=!CP;sv('cp',CP);draw();return}
 if(e.target.id=='ptr'&&confirm('Simulation zurücksetzen? Alle Testtrades werden gelöscht.')){PT={open:{},done:[],rs:Date.now()};sv('pt',PT)}{const pt=e.target.closest('[data-pt]');if(pt&&!e.target.closest('a')){const k=pt.dataset.pt;PTX.has(k)?PTX.delete(k):PTX.add(k)}}const vt=e.target.closest('[data-v]');if(vt){if(vt.dataset.v=='set'){view='scan';const dd=document.querySelector('details');if(dd){dd.open=true;setTimeout(()=>dd.scrollIntoView({behavior:'smooth'}),50)}}else view=vt.dataset.v}const d=(e.target.closest('[data-c],[data-s],[data-z],[data-k],[data-p],[data-ch]')||e.target).dataset;if(d.k){dir=d.k==key?-dir:(d.k=='age'?1:-1);key=d.k}
 if(d.s){W.has(d.s)?W.delete(d.s):W.add(d.s);sv('w',[...W])}
 if(d.z){SNZ[d.z]?delete SNZ[d.z]:SNZ[d.z]=Date.now()+432e5;sv('snz',SNZ)}
 if(d.ch){CE.includes(d.ch)?CE=CE.filter(c=>c!=d.ch):CE.push(d.ch);if(!CE.length)CE=[...CHAINS];sv('ce',CE)}
 if(d.p){Object.assign(C,PR[d.p]);sv('c',C);document.querySelectorAll('[data-cf]').forEach(i=>i.value=C[i.dataset.cf])}if(d.c){cp(d.c);const u='https://axiom.trade/t/'+encodeURIComponent(d.c);if(!window.open(u,'_blank'))location.href=u;return}draw()};
$('#q').oninput=$('#rk').oninput=draw;
$('#fq').oninput=renderFeed;
$('#nb').onclick=async()=>{if(!('Notification' in window))return alert('Benachrichtigungen werden hier nicht unterstützt (iPhone: erst zum Home-Bildschirm hinzufügen).');
 $('#nb').textContent=(await Notification.requestPermission())=='granted'?'🔔 aktiv':'🔕 blockiert'};
if('Notification' in window&&Notification.permission=='granted')$('#nb').textContent='🔔 aktiv';
function b64ToArr(b64){const p='='.repeat((4-b64.length%4)%4),s=(b64+p).replace(/-/g,'+').replace(/_/g,'/'),raw=atob(s),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out}
async function setupServerPush(){
 if(!C.workerUrl||!C.vapidKey)return alert('Bitte zuerst unter „⚙ Filter & Einstellungen" die Worker-URL und den VAPID Public Key eintragen (siehe worker.js-Anleitung).');
 if(!('serviceWorker' in navigator)||!('PushManager' in window))return alert('Push wird auf diesem Gerät/Browser nicht unterstützt (iPhone: App erst zum Home-Bildschirm hinzufügen, iOS 16.4+).');
 try{
  const perm=await Notification.requestPermission();if(perm!=='granted')return alert('Benachrichtigungen wurden nicht erlaubt.');
  const reg=await navigator.serviceWorker.ready;
  let sub=await reg.pushManager.getSubscription();
  if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64ToArr(C.vapidKey)});
  const url=C.workerUrl.replace(/\/$/,'');
  await fetch(url+'/subscribe',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(sub)});
  await fetch(url+'/config',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({liq:C.liq,vol:C.vol,mmin:C.mmin,mmax:C.mmax,ratio:C.ratio,score:C.score})});
  $('#spb').textContent='☁ Push aktiv';$('#spb').classList.add('on');
  alert('Server-Push eingerichtet. Du bekommst jetzt Alarme über den Worker, auch wenn die App/Safari komplett geschlossen ist.')
 }catch(e){alert('Fehler beim Einrichten: '+(e.message||e))}}
$('#spb').onclick=setupServerPush;
document.addEventListener('touchstart',()=>{LT=Date.now()},{passive:true});
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
updSol();setInterval(()=>{updSol();draw()},6e4);
(async function lp(){try{await scan()}catch(e){bad++;apiw()}nxt=Date.now()+Math.min(600*(1+bad*2),6e4);setTimeout(lp,nxt-Date.now())})();
setInterval(()=>{const stale=bad||(LS&&Date.now()-LS>15e3);$('#cd').textContent=bad?'Verbindung langsam …':stale?'Letzter Scan vor '+Math.round((Date.now()-LS)/1e3)+' s ⚠':'Scan jede Sekunde';$('#dt').className='dot'+(stale?' e':'');if($('#hbd'))$('#hbd').textContent=stale?'● VERBINDUNG PRÜFEN':'● BOT AKTIV'},1000);
