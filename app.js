(() => {
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const views=['home','manual','hostLobby','join','waiting','countdown','playerQuestion','tapScreen','missScreen','hostRace','result'];
const show=id=>views.forEach(v=>$('#'+v).classList.toggle('hidden',v!==id));
const debug=new URLSearchParams(location.search).get('debug')==='true'; if(debug) $('#debug').classList.remove('hidden');
const log=(...x)=>{console.log(...x);if(debug){$('#debug').textContent+=x.map(v=>typeof v==='string'?v:JSON.stringify(v)).join(' ')+'\n';$('#debug').scrollTop=99999}};
const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const QUESTIONS=[
 {q:'🍎 이것은 무엇입니까?',c:['사과','우유','책','학교'],a:0},
 {q:'저는 학교___ 갑니다.',c:['를','에','은','와'],a:1},
 {q:'“크다”의 반대말은?',c:['작다','길다','빠르다','좋다'],a:0},
 {q:'아침에 하는 인사는?',c:['안녕하세요','잘 자요','미안합니다','축하합니다'],a:0},
 {q:'🍚 밥을 ___ .',c:['먹어요','마셔요','입어요','타요'],a:0},
 {q:'버스를 ___ 학교에 가요.',c:['타고','먹고','쓰고','읽고'],a:0},
 {q:'오늘은 월요일입니다. 내일은?',c:['일요일','화요일','수요일','금요일'],a:1},
 {q:'☕ 목이 말라요. 무엇을 해요?',c:['물을 마셔요','책을 읽어요','옷을 입어요','잠을 자요'],a:0},
 {q:'“감사합니다”와 뜻이 가장 가까운 말은?',c:['고맙습니다','괜찮습니다','어서 오세요','안녕히 주무세요'],a:0},
 {q:'친구___ 같이 공부해요.',c:['와','를','에','에서'],a:0}
];
const TARGET_TAPS=220,MAX_PLAYERS=4,TEAM_LIMIT=2,ANSWER_MS=8500,TAP_MS=3000,SYNC_MS=150;
const animals={A:'🐲',B:'🐯'};
let role=null,peer=null,hostConn=null,room=null,selectedTeam=null;
let playerId=(crypto.randomUUID&&crypto.randomUUID())||Math.random().toString(36).slice(2);
let localTaps=0,pendingTaps=0,tapEnabled=false,syncTimer=null,myAnswered=false,currentToken=0;
const host={conns:new Map(),players:new Map(),phase:'lobby',qIndex:0,taps:{A:0,B:0},winner:null,roundToken:0,timer:null};
function code(){return Math.random().toString(36).slice(2,8).toUpperCase()}
function send(conn,msg){try{if(conn&&conn.open)conn.send(msg)}catch(e){log('send err',e.message)}}
function broadcast(msg){host.conns.forEach(c=>send(c,msg))}
function counts(){let A=0,B=0;host.players.forEach(p=>p.team==='A'?A++:B++);return{A,B}}
function publicState(){return{type:'state',phase:host.phase,qIndex:host.qIndex,taps:host.taps,winner:host.winner,players:[...host.players.values()].map(p=>({id:p.id,name:p.name,team:p.team})),roundToken:host.roundToken}}
function bState(){broadcast(publicState());renderHostLobby();renderRace()}
function joinUrl(){const u=new URL(location.href);u.search='';u.searchParams.set('room',room);return u.toString()}
function renderHostLobby(){if(role!=='host')return;const cs=counts();$('#aCount').textContent=cs.A+'/2';$('#bCount').textContent=cs.B+'/2';$('#aPlayers').innerHTML='';$('#bPlayers').innerHTML='';host.players.forEach(p=>{const d=document.createElement('div');d.className='person';d.innerHTML=`<span>${esc(p.name)}</span><span class="ok">READY</span>`;$('#'+(p.team==='A'?'aPlayers':'bPlayers')).append(d)});$('#startGame').disabled=host.players.size<2;$('#hostStatus').textContent=`참가자 ${host.players.size}/${MAX_PLAYERS} · ${host.players.size>=2?'시작할 수 있습니다.':'최소 2명이 필요합니다.'}`}
function createHost(){role='host';room=code();show('hostLobby');$('#roomCode').textContent=room;$('#qr').innerHTML='';new QRCode($('#qr'),{text:joinUrl(),width:220,height:220,correctLevel:QRCode.CorrectLevel.M});peer=new Peer('krace-'+room.toLowerCase());peer.on('open',()=>{log('host peer open',peer.id);renderHostLobby()});peer.on('connection',conn=>{conn.on('open',()=>{host.conns.set(conn.peer,conn);send(conn,publicState());log('connection',conn.peer)});conn.on('data',m=>onHostMsg(conn,m));conn.on('close',()=>disconnect(conn));conn.on('error',e=>log('conn error',e.type||e.message))});peer.on('error',e=>{log('peer error',e.type||e.message);alert('실시간 연결 오류: '+(e.type||'unknown'))})}
function disconnect(conn){host.conns.delete(conn.peer);for(const [id,p] of host.players){if(p.peer===conn.peer)host.players.delete(id)}bState()}
function onHostMsg(conn,m){if(!m||!m.type)return;
 if(m.type==='join'){
  if(host.phase!=='lobby')return send(conn,{type:'joinResult',ok:false,msg:'이미 게임이 시작되었습니다.'});
  const name=String(m.name||'').trim().slice(0,12),team=m.team,cs=counts();
  if(!name||!['A','B'].includes(team))return send(conn,{type:'joinResult',ok:false,msg:'이름과 팀을 확인하세요.'});
  if(host.players.size>=MAX_PLAYERS)return send(conn,{type:'joinResult',ok:false,msg:'방이 가득 찼습니다.'});
  if(cs[team]>=TEAM_LIMIT)return send(conn,{type:'joinResult',ok:false,msg:'선택한 팀이 가득 찼습니다.'});
  if([...host.players.values()].some(p=>p.name.toLowerCase()===name.toLowerCase()))return send(conn,{type:'joinResult',ok:false,msg:'이미 사용 중인 닉네임입니다.'});
  host.players.set(m.playerId,{id:m.playerId,name,team,peer:conn.peer});send(conn,{type:'joinResult',ok:true,team,name});bState();return;
 }
 if(m.type==='tap'&&host.phase==='tap'&&m.token===host.roundToken){
   const p=host.players.get(m.playerId);const delta=Math.max(0,Math.min(30,Number(m.delta)||0));
   if(p&&delta){host.taps[p.team]+=delta;if(host.taps[p.team]>=TARGET_TAPS&&!host.winner){host.winner=p.team;finishGame()}else bState()}
 }
}
function startGame(){if(host.players.size<2)return;clearTimeout(host.timer);host.taps={A:0,B:0};host.winner=null;host.qIndex=0;host.phase='countdown';host.roundToken++;show('hostRace');broadcast({type:'countdown',at:Date.now()+400});$('#hQuestion').textContent='3 · 2 · 1 준비!';host.timer=setTimeout(beginQuestion,3400)}
function beginQuestion(){if(host.winner)return;if(host.qIndex>=QUESTIONS.length){finishByDistance();return}host.phase='question';host.roundToken++;const q=QUESTIONS[host.qIndex];broadcast({type:'question',qIndex:host.qIndex,q,token:host.roundToken,endsAt:Date.now()+ANSWER_MS});renderRace();host.timer=setTimeout(()=>{if(host.phase!=='question'||host.winner)return;host.phase='tap';broadcast({type:'tapStart',token:host.roundToken,endsAt:Date.now()+TAP_MS});renderRace();host.timer=setTimeout(()=>{if(host.phase!=='tap'||host.winner)return;host.qIndex++;beginQuestion()},TAP_MS+450)},ANSWER_MS)}
function finishByDistance(){host.winner=host.taps.A===host.taps.B?'DRAW':(host.taps.A>host.taps.B?'A':'B');finishGame()}
function finishGame(){clearTimeout(host.timer);host.phase='result';broadcast({type:'result',winner:host.winner,taps:host.taps});renderResult(host.winner,host.taps);show('result')}
function renderRace(){if(role!=='host'||!['question','tap'].includes(host.phase))return;show('hostRace');const q=QUESTIONS[host.qIndex];$('#hRound').textContent=`문제 ${host.qIndex+1} / ${QUESTIONS.length} · ${host.phase==='tap'?'정답자 TAP 시간!':'문제를 풀고 있어요'}`;$('#hQuestion').textContent=q?q.q:'';['A','B'].forEach(t=>{const m=Math.min(100,host.taps[t]/TARGET_TAPS*100);$('#meters'+t).textContent=m.toFixed(1)+'m · '+host.taps[t]+' TAP';const tr=$('#runner'+t).parentElement,max=Math.max(0,tr.clientWidth-135);$('#runner'+t).style.transform=`translateX(${max*m/100}px)`})}
function connectPlayer(roomCode){role='player';room=roomCode.toUpperCase();show('join');$('#joinRoom').textContent=room;peer=new Peer();peer.on('open',()=>{hostConn=peer.connect('krace-'+room.toLowerCase(),{reliable:true});hostConn.on('open',()=>log('connected to host'));hostConn.on('data',onPlayerMsg);hostConn.on('close',()=>{$('#joinMsg').textContent='방장과 연결이 끊겼습니다.';$('#joinMsg').className='bad'});hostConn.on('error',e=>log('player conn error',e.type||e.message))});peer.on('error',e=>{$('#joinMsg').textContent='방을 찾을 수 없습니다. 방 코드를 확인하세요.';$('#joinMsg').className='bad';log('peer',e.type||e.message)})}
function onPlayerMsg(m){if(!m||!m.type)return;log('recv',m.type);if(m.token)currentToken=m.token;
 if(m.type==='state'){updateJoinCounts(m.players);if(m.phase==='result'&&m.winner){renderResult(m.winner,m.taps);show('result')}return}
 if(m.type==='joinResult'){if(!m.ok){$('#joinMsg').textContent=m.msg;$('#joinMsg').className='bad';return}$('#myAnimal').textContent=animals[m.team];$('#myTeam').textContent=(m.team==='A'?'용':'호랑이')+' 팀';$('#myName').textContent=m.name;show('waiting');return}
 if(m.type==='countdown'){runCountdownPlayer(m.at);return}
 if(m.type==='question'){showQuestion(m);return}
 if(m.type==='tapStart'){startTap(m);return}
 if(m.type==='result'){renderResult(m.winner,m.taps);show('result')}
}
function updateJoinCounts(players=[]){const A=players.filter(p=>p.team==='A').length,B=players.filter(p=>p.team==='B').length;$('#joinACount').textContent=A+'/2';$('#joinBCount').textContent=B+'/2';$$('.pick').forEach(b=>{const full=(b.dataset.team==='A'?A:B)>=2;b.disabled=full&&selectedTeam!==b.dataset.team})}
function runCountdownPlayer(at){show('countdown');const tick=()=>{const left=at+3000-Date.now();if(left>0){$('#countText').textContent=Math.max(1,Math.min(3,Math.ceil(left/1000)));requestAnimationFrame(tick)}else $('#countText').textContent='START!'};tick()}
function showQuestion(m){tapEnabled=false;myAnswered=false;localTaps=pendingTaps=0;show('playerQuestion');$('#pRound').textContent=`문제 ${m.qIndex+1} / ${QUESTIONS.length}`;$('#pQuestion').textContent=m.q.q;$('#answerMsg').textContent='';$('#answerMsg').className='answer-msg';$('#pChoices').innerHTML='';m.q.c.forEach((c,i)=>{const b=document.createElement('button');b.className='choice';b.textContent=`${i+1}. ${c}`;b.onclick=()=>{if(myAnswered)return;myAnswered=true;$$('#pChoices .choice').forEach(x=>x.disabled=true);if(i===m.q.a){b.classList.add('correct');b.dataset.correct='1';$('#answerMsg').textContent='⭕ 정답! 잠시 후 TAP!';$('#answerMsg').className='answer-msg ok'}else{b.classList.add('wrong');$('#answerMsg').textContent='❌ 아쉬워요! 다음 문제에 도전!';$('#answerMsg').className='answer-msg bad'}};$('#pChoices').append(b)})}
function startTap(m){const correct=!!$('#pChoices .choice[data-correct="1"]');if(!correct){show('missScreen');return}show('tapScreen');tapEnabled=true;localTaps=pendingTaps=0;$('#tapCount').textContent='0';clearInterval(syncTimer);syncTimer=setInterval(flushTaps,SYNC_MS);const end=m.endsAt;const tick=()=>{const left=Math.max(0,end-Date.now());$('#tapTimer').textContent=(left/1000).toFixed(1)+'초';if(left>0&&tapEnabled)requestAnimationFrame(tick);else{tapEnabled=false;flushTaps();clearInterval(syncTimer);$('#tapTimer').textContent='끝!'}};tick()}
function addTap(e){if(!tapEnabled)return;e.preventDefault();localTaps++;pendingTaps++;$('#tapCount').textContent=localTaps}
function flushTaps(){if(pendingTaps>0&&hostConn&&hostConn.open){send(hostConn,{type:'tap',playerId,delta:pendingTaps,token:currentToken});pendingTaps=0}}
function renderResult(w,taps){const draw=w==='DRAW';$('#winnerTitle').textContent=draw?'무승부!':(w==='A'?'용 팀 승리!':'호랑이 팀 승리!');$('#winnerAnimal').textContent=draw?'🐲 🐯':animals[w];$('#resultText').textContent=`용 팀 ${taps.A} TAP · 호랑이 팀 ${taps.B} TAP`;$('#restart').classList.toggle('hidden',role!=='host')}
$('#makeRoom').onclick=createHost;$('#manualJoin').onclick=()=>show('manual');$('#goManual').onclick=()=>{const c=$('#manualCode').value.trim().toUpperCase();if(c.length>=4){history.replaceState(null,'',location.pathname+'?room='+encodeURIComponent(c));connectPlayer(c)}};
$$('.pick').forEach(b=>b.onclick=()=>{selectedTeam=b.dataset.team;$$('.pick').forEach(x=>x.classList.toggle('selected',x===b));$('#joinBtn').disabled=!$('#nickname').value.trim()});
$('#nickname').oninput=()=>$('#joinBtn').disabled=!($('#nickname').value.trim()&&selectedTeam);
$('#joinBtn').onclick=()=>{const name=$('#nickname').value.trim();if(!name||!selectedTeam)return;send(hostConn,{type:'join',playerId,name,team:selectedTeam})};
$('#startGame').onclick=startGame;$('#tapArea').addEventListener('pointerdown',addTap,{passive:false});
$('#restart').onclick=()=>{if(role!=='host')return;host.phase='lobby';host.taps={A:0,B:0};host.winner=null;host.qIndex=0;bState();show('hostLobby')};
window.addEventListener('resize',renderRace);
const params=new URLSearchParams(location.search),r=params.get('room');if(r)connectPlayer(r);else show('home');
})();