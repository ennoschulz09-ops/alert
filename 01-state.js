// Smart Lab – Teil 01: Konfiguration, Presets, globaler Zustand, ML-Basisfunktionen
// Automatisch aus der ursprünglichen einzelnen index.html aufgeteilt.
// Reihenfolge ist wichtig: diese Dateien werden in genau dieser Reihenfolge geladen
// und teilen sich (wie vorher) denselben globalen Scope - nichts wurde inhaltlich veraendert.

const $=s=>document.querySelector(s),X=s=>String(s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const F=n=>n>=1e6?'$'+(n/1e6).toFixed(2)+'M':n>=1e3?'$'+(n/1e3).toFixed(1)+'K':'$'+Math.round(n);
const tm=ts=>new Date(ts).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit',second:'2-digit'}),dl=ts=>{const n=new Date(),s0=new Date(n.getFullYear(),n.getMonth(),n.getDate()).getTime();return ts>=s0?'Heute':ts>=s0-864e5?'Gestern':new Date(ts).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'})},ago=ts=>{const m=Math.floor((Date.now()-ts)/6e4);return m<1?'gerade eben':m<60?'vor '+m+' Min':m<1440?'vor '+Math.floor(m/60)+' Std '+m%60+' Min':'vor '+Math.floor(m/1440)+' Tg'};
const al2=x=>FD.find(f=>f.key==x.key&&f.ts);
const ld=(k,d)=>{try{return JSON.parse(localStorage[k])}catch(e){return d}},sv=(k,v)=>{try{localStorage[k]=JSON.stringify(v)}catch(e){}};
const CHAINS=['solana','base','bsc'],CHN={solana:'SOL',base:'BASE',bsc:'BSC'};
const CF=[['liq','Min. Liquidität $'],['vol','Min. Vol 1h $'],['mmin','Min. MCap $'],['mmax','Max. MCap $'],['ratio','Min. Käuferanteil (0-1)'],['score','Min. Score'],['fs','Final-Stretch-Modus (1=an, 0=aus)'],['cooldown','Cooldown (Minuten)'],['watchPct','Watchlist-Alarm ab % Bewegung'],['devMax','Max. Dev-Wallet-Anteil %'],['quietFrom','Ruhe ab Stunde (0-23, leer=aus)'],['quietTo','Ruhe bis Stunde (0-23)'],['sound','Ton (1/0)'],['minAge','Neu-Token-Sperre (Min. nach Launch)'],['tgMin','Telegram ab Score'],['tgToken','Telegram Bot-Token','text'],['tgChat','Telegram Chat-ID','text'],['workerUrl','Cloudflare-Worker-URL (für Server-Push)','text'],['vapidKey','VAPID Public Key (vom Worker)','text'],['botUrl','Bot-Worker-URL (24/7-Betrieb)','text'],['botKey','Bot-Passwort (24/7-Betrieb)','text'],['live','⚠️ ECHTER Handel mit echtem Geld (1=an, 0=aus)']];
const PR={Konservativ:{liq:3e4,vol:5e4,mmin:1e5,mmax:1e7,ratio:.6,score:75},Ausgewogen:{liq:1e4,vol:2e4,mmin:5e4,mmax:5e6,ratio:.55,score:55},Aggressiv:{liq:5e3,vol:1e4,mmin:2e4,mmax:5e6,ratio:.5,score:55}};
const DM=40;
let C={liq:1e4,vol:2e4,mmin:5e4,mmax:5e6,ratio:.55,score:55,cooldown:30,watchPct:15,devMax:15,quietFrom:'',quietTo:'',sound:1,tgToken:'',tgChat:'',workerUrl:'',vapidKey:'',botUrl:'',botKey:'',live:0,tgMin:80,minAge:6,fs:1};Object.assign(C,ld('c',{}));if(+C.score===60)C.score=55;C.score=Math.max(55,+C.score||55);
if(ld('wipe',0)<1){['pt','tr','stz','stzh','rc','h','fd','s2','snz','wv','bwt'].forEach(k=>{try{localStorage.removeItem(k)}catch(e){}});sv('pt',{open:{},done:[],rs:Date.now()});sv('wipe',1)}
const inQuiet=()=>{if(C.quietFrom===''||C.quietTo===''||C.quietFrom==null||C.quietTo==null)return false;const h=new Date().getHours(),f=+C.quietFrom,t=+C.quietTo;return f<t?(h>=f&&h<t):(h>=f||h<t)};
let LK={},view='home',LE='',R=[],FD=ld('fd',[]),SP={},KN=null,bad=0,nxt=0,key='score',dir=-1;
let W=new Set(ld('w',[])),SM=ld('s2',null);if(!SM){SM={};(ld('s',[])||[]).forEach(k=>SM[k]=Date.now())}
let Hh=ld('h',{}),RC=ld('rc',{}),RCbusy=new Set(),CE=ld('ce',null);if(!CE)CE=[...CHAINS];else if(!ld('ce2',0)){CE=[...CHAINS];sv('ce2',1)}
let PT=ld('pt',{open:{},done:[]}),PTC={size:.2,tp:.2,sl:.2,min:55,fee:0,start:2,arm:.2,cap:1.5,tr:.12,tr2:.15,floor:.08,stages:[[.25,1/3],[.6,1/3]],maxOpen:12,maxRun1:120,maxMcLiq:30,confirm:45e3,rug:.3,stagMin:90,stagBand:.1,dayLoss:.5,minAge:.5,minLiq:15e3,maxRun:40,buy:70,top10:40,top1:25,ins:20,holdMin:60,tfee:5};
let TR=ld('tr',{}),STZ=ld('stz',{wins:0,losses:0,total:0}),STZH=ld('stzh',[]);
let WV=ld('wv',{}),CP=false,SNZ=ld('snz',{});
let CO=Object.assign({rules:[],les:[],sh:[],dn:{}},ld('co',{}));
const mF=f=>{const g=(k,d)=>f[k]==null?d:f[k],c=(x,a,b)=>Math.max(a,Math.min(b,x));return[g('score',55)/100,c(Math.log(1+g('mcl',10))/4,0,1.5),c(g('c5',0)/50,-1,2),c(g('c1',0)/200,-1,2),g('ratio',.55),Math.log(1+g('liq',1e4))/12,Math.min(g('age',5),48)/48,g('top10',20)/100,g('top1',8)/50,c(g('v1l',2)/10,0,2),c(Math.log(1+g('act',50))/7,0,1.5),c(g('since',0)/100,-1,2),c(Math.log(1+g('rep',0))/4,0,1.5),g('soc',1)/3,c(g('ser',0)/3,0,2),c((g('c5',0)*12-g('c1',0))/300,-1,2),g('score',55)/100*g('ratio',.55),Math.sin(g('hour',12)/24*6.283),Math.cos(g('hour',12)/24*6.283),c(g('mcl',10)*g('c5',0)/400,-1,2),c(g('v1l',2)*g('ratio',.55)*2,-1,2),g('boost',0),c(g('c1',0)/200*g('ratio',.55),-1,2)]};
const mS=z=>1/(1+Math.exp(-Math.max(-30,Math.min(30,z))));
const mP=(m,f)=>{const x=mF(f);if(m.ens&&m.ens.length){let s=0,c=0;for(const sub of m.ens){if(x.length!=sub.w.length)continue;s+=mS(sub.b+x.reduce((a,v,i)=>a+v*sub.w[i],0));c++}return c?s/c:1}if(x.length!=m.w.length)return 1;return mS(m.b+x.reduce((a,v,i)=>a+v*m.w[i],0))};
function mFit(S,w0,b0){const X=S.map(s=>mF(s.f)),d=X[0].length,n=S.length;let w=w0&&w0.length==d?w0.slice():Array(d).fill(0),b=b0||0,vw=Array(d).fill(0),vb=0;const mom=.9,lr=.4,l2=.04,rw=S.map((s,i)=>.6+.8*(i/(n-1||1)));for(let e=0;e<500;e++){const gw=Array(d).fill(0);let gb=0;for(let i=0;i<n;i++){const er=(mS(b+X[i].reduce((a,v,j)=>a+v*w[j],0))-(S[i].w?1:0))*rw[i];for(let j=0;j<d;j++)gw[j]+=er*X[i][j];gb+=er}for(let j=0;j<d;j++){vw[j]=mom*vw[j]-lr*(gw[j]/n+l2*w[j]);w[j]+=vw[j]}vb=mom*vb-lr*gb/n;b+=vb}return{w,b}}
function mFitBag(S,B,w0,b0){const ms=[];for(let k=0;k<B;k++){const boot=S.map(()=>S[Math.floor(Math.random()*S.length)]);ms.push(mFit(boot,w0,b0))}return ms}
// ---- Trainings-Schwellen fürs Vorhersage-Modell ----
// Vorher (12 Datenpunkte gesamt, 5 Test-Datenpunkte, 3% Verbesserung) war die
// statistische Basis viel zu dünn, um echte Kauf-Entscheidungen zu blockieren -
// bei so kleinen Stichproben ist "besser als Zufall" oft einfach Rauschen.
const MDL_MIN_SAMPLES=40; // gesamt (echte Trades + Labor-Beobachtungen), bevor überhaupt trainiert wird
const MDL_MIN_TEST=15;    // Mindestgröße des Test-Sets für die Out-of-Sample-Prüfung
const MDL_MIN_REAL=20;    // Mindestzahl ECHTER Paper-Trades, bevor das Modell live blockieren darf
const MDL_QUALITY=.90;    // Modell muss den Brier-Score um mind. 10% ggü. der Basisrate verbessern
function coachModel(){const S=PT.done.filter(d=>d.f).map(d=>({f:d.f,w:d.sol>0,t:d.t1})).concat((CO.ss||[]).map(s=>({f:s.f,w:s.w,t:s.t}))),old=CO.m||{};
 const realN=PT.done.filter(d=>d.f).length;
 if(S.length<MDL_MIN_SAMPLES){CO.m=Object.assign(old,{n:S.length,realN,on:false});return}
 S.sort((a,b)=>a.t-b.t);const k=Math.floor(S.length*.65),tr=S.slice(0,k),te=S.slice(k),br=tr.filter(s=>s.w).length/tr.length,
 w0=old.ens&&old.ens[0]?old.ens[0].w:null,b0w=old.ens&&old.ens[0]?old.ens[0].b:0,ens0=mFitBag(tr,9,w0,b0w),
 evP=f=>{const x=mF(f);let s=0;for(const sub of ens0)s+=mS(sub.b+x.reduce((a,v,i)=>a+v*sub.w[i],0));return s/ens0.length},
 bs=te.reduce((a,s)=>a+(evP(s.f)-(s.w?1:0))**2,0)/te.length,b0=te.reduce((a,s)=>a+(br-(s.w?1:0))**2,0)/te.length,
 ens=mFitBag(S,15,w0,b0w),base=S.filter(s=>s.w).length/S.length;
 CO.m={ens,w:ens[0].w,b:ens[0].b,n:S.length,realN,base,th:Math.max(.1,base*.55),q:b0?1-bs/b0:0,
  on:te.length>=MDL_MIN_TEST&&realN>=MDL_MIN_REAL&&bs<b0*MDL_QUALITY&&!old.off,
  off:old.off,sn:old.sn||0,sl:old.sl||0}}
const EXA={BE07:[.07,.01],BE10:[.1,.02],BE15:[.15,.03]};
function coachAlt(t,pnl){const X=t.x||(t.x={}),pk=(t.peak||t.mc0)/t.mc0-1;for(const n in EXA){if(!(n in X))X[n]=null;if(X[n]!=null)continue;if(pnl>=.2)X[n]=.2;else if(pnl<=-.2)X[n]=pnl;else if(pk>=EXA[n][0]&&pnl<=EXA[n][1])X[n]=(1+pnl)*.98-1}for(const n in EXG){if(!(n in X))X[n]=null;if(X[n]!=null)continue;if(pnl>=EXG[n][0])X[n]=EXG[n][0];else if(pnl<=-EXG[n][1])X[n]=pnl}}
function coachExit(){const T=PT.done.filter(d=>d.alt&&d.alt.FIX20!=null&&d.alt.BE10!=null);CO.xg={};if(T.length<20)return;let best=null;const av=x=>x.reduce((s,v)=>s+v,0)/(x.length||1);
 for(const n in EXA){const gs=T.filter(d=>d.alt[n]!=null).map(d=>d.alt[n]-d.alt.FIX20),g=av(gs),h=Math.floor(gs.length/2);CO.xg[n]=g;if(g>.005&&av(gs.slice(0,h))>0&&av(gs.slice(h))>0&&(!best||g>CO.xg[best]))best=n}
 CO.ex=best?{n:best,arm:EXA[best][0],stop:EXA[best][1]}:null;
 const T2=PT.done.filter(d=>d.alt&&d.alt.FIX20!=null&&d.alt.T15S12!=null);let b2=null;
 if(T2.length>=20)for(const n in EXG){const gs=T2.map(d=>d.alt[n]-d.alt.FIX20),g=av(gs),h=Math.floor(gs.length/2);CO.xg[n]=g;if(g>.005&&av(gs.slice(0,h))>0&&av(gs.slice(h))>0&&(!b2||g>CO.xg[b2]))b2=n}
 CO.tpsl=b2?{n:b2,tp:EXG[b2][0],sl:EXG[b2][1]}:null;coachApply()}
const EXG={};[.15,.2,.3].forEach(tp=>[.12,.15,.2].forEach(sl=>{if(!(tp==.2&&sl==.2))EXG['T'+Math.round(tp*100)+'S'+Math.round(sl*100)]=[tp,sl]}));
function coachApply(){PTC.buy=CO.buy||70;PTC.tp=CO.tpsl?CO.tpsl.tp:.2;PTC.sl=CO.tpsl?CO.tpsl.sl:.2}coachApply();PTC.size=ld('ptsize',PTC.size);
const STRATS=[
 {id:'con',name:'Konservativ',cfg:{score:75,liq:3e4,vol:5e4,mmin:1e5,mmax:1e7,ratio:.6,maxRun:25,tp:.2,sl:.15}},
 {id:'aus',name:'Ausgewogen',cfg:{score:55,liq:1e4,vol:2e4,mmin:5e4,mmax:5e6,ratio:.55,maxRun:40,tp:.2,sl:.2}},
 {id:'agg',name:'Aggressiv',cfg:{score:45,liq:5e3,vol:1e4,mmin:2e4,mmax:5e6,ratio:.5,maxRun:60,tp:.25,sl:.25}},
 {id:'akt',name:'Meine App-Einstellung',cfg:null}
];
let ST=ld('strats',{});STRATS.forEach(S=>ST[S.id]=ST[S.id]||{open:{},done:[],start:2});

