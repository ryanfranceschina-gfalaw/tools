/* GFA LAW Daily Game: one shared streak across a weekly rotation of games. The streak counts consecutive days played, win or lose.
   Sun Inkwell, Mon Inkwell, Tue Who Said It?, Wed Inkwell, Thu Timeline, Fri Inkwell, Sat Who Said It?.
   The leaderboard server (Google Apps Script) uses the same schedule and puzzle files to check results. */
(function(){
var W=window,D=document,box=D.getElementById('dg');if(!box)return;
var LB=box.getAttribute('data-lb')||'',START=Date.UTC(2026,10,5);
var SCHED=['inkwell','inkwell','whosaid','inkwell','timeline','inkwell','whosaid'];
var NAMES={inkwell:'Inkwell',whosaid:'Who Said It?',timeline:'Timeline'};
var QUILL='<svg class="dg-quill" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 3C12 4 7 9 5 17l-1 4 2-2c1-3 3-5 6-6l-2-1c3-1 6-3 8-6l-2 0c2-1 3-2 4-3z" fill="#e7cd86"/><path d="M5 19l1.5-1.5" stroke="#0e1d11" stroke-width="1.2"/></svg>';
function $(i){return D.getElementById(i)}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function ls(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem(k)||'null');localStorage.setItem(k,JSON.stringify(v))}catch(e){return null}}
function wd(day){return ((4+day)%7+7)%7}            /* day 0 = Thursday, Nov 5, 2026 */
function game(day){return SCHED[wd(day)]}
function idx(day){var g=game(day),n=0;for(var d=0;d<day;d++)if(game(d)===g)n++;return n}
function how(short,long){return '<p class="dg-how">'+short+' <button type="button" class="dg-rules" aria-expanded="false" onclick="var n=this.parentNode.nextElementSibling;n.hidden=!n.hidden;this.setAttribute(\'aria-expanded\',String(!n.hidden))">How to play</button></p><p class="dg-long" hidden>'+long+'</p>'}
function quills(spent,max){var h='';for(var i=0;i<max;i++)h+=QUILL.replace('class="dg-quill"','class="dg-quill'+(i>=max-spent?' spent':'')+'"');return '<span class="dg-ink"><span>Ink left</span><span class="dg-pips">'+h+'</span></span>'}
function shuffled(a,seed){a=a.slice();for(var i=a.length-1;i>0;i--){seed=(seed*9301+49297)%233280;var j=Math.floor(seed/233280*(i+1));var t=a[i];a[i]=a[j];a[j]=t}return a}

/* ---------- player record (this browser) ---------- */
function rec(v){
  if(v!==undefined)return ls('gfa_daily',v);
  var r=ls('gfa_daily');
  if(!r){var t=ls('gfa_trivia')||{};r={streak:t.streak||0,best:t.best||0,played:t.played||0,wins:t.wins||0,lastWin:t.lastWin,last:t.last};ls('gfa_daily',r)}
  return r;
}
function pid(){try{var x=localStorage.getItem('gfa_pid');if(!x){x=(Date.now().toString(36)+Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2)).replace(/[^a-z0-9]/g,'').slice(0,32);localStorage.setItem('gfa_pid',x)}return x}catch(e){return ''}}
function pname(v){try{if(v!==undefined)localStorage.setItem('gfa_lbname',v);return localStorage.getItem('gfa_lbname')||''}catch(e){return ''}}
function stats(){var s=rec();return '<div class="stats"><span class="stat">Streak <b>'+(s.streak||0)+'</b></span><span class="stat">Best <b>'+(s.best||0)+'</b></span><span class="stat">Played <b>'+(s.played||0)+'</b></span><span class="stat">Won <b>'+(s.wins||0)+'</b></span></div>'}

var DAY,G,P,NUM;
function start(){
  var T;try{var o={};new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(new Date()).forEach(function(x){o[x.type]=+x.value});T={y:o.year,m:o.month,d:o.day}}catch(e){var n=new Date();T={y:n.getFullYear(),m:n.getMonth()+1,d:n.getDate()}}
  DAY=Math.round((Date.UTC(T.y,T.m-1,T.d)-START)/864e5);G=game(DAY);NUM=DAY+1;
  var s=rec();if(s.streak&&s.last!==DAY&&s.last!==DAY-1){s.streak=0;rec(s)}   /* a missed day ends the streak */
  fetch('/assets/fun/'+G+'.json').then(function(r){return r.json()}).then(function(bank){
    P=bank[idx(DAY)%bank.length];
    var head='<div class="dg-head"><p class="dg-num">Daily Game #'+NUM+'</p><h2 class="dg-title">'+NAMES[G]+'</h2><p class="dg-week">'+week()+'</p></div>';
    var s=rec();
    if(s.last===DAY&&s.res){box.innerHTML=head+'<div id="dg-play"></div>';done(s.res,true);return}
    box.innerHTML=head+'<div id="dg-play"></div>';
    ({inkwell:inkwell,whosaid:whosaid,timeline:timeline})[G]($('dg-play'));
  }).catch(function(){box.innerHTML='<p>The daily game could not load right now. Please try again later.</p>'});
}
function week(){var L=['S','M','T','W','T','F','S'],t=wd(DAY);return L.map(function(l,i){return '<span'+(i===t?' class="on"':'')+' title="'+['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][i]+': '+NAMES[SCHED[i]]+'">'+l+'</span>'}).join('')}

/* ---------- finishing: streak, share, leaderboard ---------- */
function finish(won,share,data,summary){
  var s=rec();
  if(s.last!==DAY){s.streak=(s.last===DAY-1?(s.streak||0):0)+1;s.best=Math.max(s.best||0,s.streak);s.last=DAY;s.played=(s.played||0)+1;   /* playing, win or lose, keeps the streak */
    if(won){s.wins=(s.wins||0)+1;s.lastWin=DAY}
    s.res={won:won,share:share,data:data,sum:summary};rec(s);
    if(W.gtag)gtag('event','daily_game',{game:G,won:won,streak:s.streak||0,best_streak:s.best||0,day_number:NUM});
    if(won&&W.GFA&&GFA.find)GFA.find('trivia');
    post();
  }
  done(s.res,false);
}
function done(res,returning){
  var el=$('dg-done');if(!el){el=D.createElement('div');el.id='dg-done';$('dg-play').appendChild(el)}
  el.innerHTML=(returning?'<div class="fb '+(res.won?'ok':'no')+'"><b>You already played today.</b> '+esc(res.sum||'')+'</div>':'')+stats()+
    '<div class="btns" style="margin-top:0"><button class="btn sm" type="button" id="dg-sh">Share your result</button></div>'+
    '<p class="sm" style="margin-top:14px">Tomorrow&rsquo;s game: <b>'+NAMES[game(DAY+1)]+'</b> unlocks at midnight Central time.</p><div class="lb" id="dg-lb"></div>';
  var sh=$('dg-sh');sh.onclick=function(){var t=res.share+'\ngfalaw.us/daily-game';if(navigator.share)navigator.share({text:t}).catch(function(){});else if(navigator.clipboard)navigator.clipboard.writeText(t).then(function(){sh.textContent='Copied'},function(){})};
  board();
}
function lbOn(){return LB.indexOf('https://')===0}
function list(a,k){if(!a||!a.length)return'<p class="sm">No one yet. Be the first.</p>';return'<ol class="lbl">'+a.map(function(x){return'<li><span>'+esc(x.n)+'</span><b>'+(+x[k]||0)+'</b></li>'}).join('')+'</ol>'}
function board(){
  var el=$('dg-lb');if(!el||!lbOn())return;
  var nm=pname(),form=nm?'<p class="sm">Playing as <b>'+esc(nm)+'</b>. <a href="#" id="dg-ch">Change name</a></p>':
    '<form id="dg-f" class="lbf"><label for="dg-n">Put your streak on the leaderboard: pick a display name</label><div><input id="dg-n" maxlength="60" required autocomplete="nickname" placeholder="Your name or a nickname"><button class="btn sm" type="submit">Join</button></div><p class="sm">You only do this once; this browser remembers you. Your display name is public and is stored with your streak in a Google Sheet owned by GFA LAW. See our <a href="/privacy-policy">privacy policy</a>.</p></form>';
  el.innerHTML='<h3>Leaderboard</h3>'+form+'<div id="dg-lbl"><p class="sm">Loading the leaderboard...</p></div>';
  var f=$('dg-f');if(f)f.onsubmit=function(e){e.preventDefault();var v=$('dg-n').value.trim();if(!v)return;pname(v);post(true)};
  var ch=$('dg-ch');if(ch)ch.onclick=function(e){e.preventDefault();pname('');board()};
  fetch(LB).then(function(r){return r.json()}).then(function(d){if(!d.ok)return;
    $('dg-lbl').innerHTML='<div class="lbg"><div><p class="eyebrow">Current streaks</p>'+list(d.current,'s')+'</div><div><p class="eyebrow">All-time best</p>'+list(d.allTime,'b')+'</div></div>'}).catch(function(){$('dg-lbl').innerHTML='<p class="sm">The leaderboard is taking a break. Your streak is still saved here.</p>'});
}
function post(refresh){
  var s=rec(),nm=pname();if(!nm||!lbOn()||s.last!==DAY||!s.res)return refresh&&board();
  fetch(LB,{method:'POST',body:JSON.stringify({type:'daily',id:pid(),name:nm,day:DAY,game:G,data:s.res.data})}).then(function(){board()}).catch(function(){board()});
}

/* ---------- Inkwell ---------- */
function inkwell(el){
  var MAX=6,rows=[],cur='',over=false,keys={},DICT=null,CL=['miss','near','hit'],ans=P.w;
  fetch('/assets/fun/words5.txt').then(function(r){return r.text()}).then(function(t){DICT={};for(var i=0;i<t.length;i+=5)DICT[t.substr(i,5)]=1;DICT[ans]=1}).catch(function(){});
  el.innerHTML=how('Guess the founding word in six tries.','Every answer is a five-letter word from the Declaration of Independence, the Constitution or the Bill of Rights. Type a word and press Enter. Green means the right letter in the right spot; gold means the letter is in the word but somewhere else. Each guess uses one of six quills of ink.')+'<div class="dg-bar" id="iw-ink"></div><div class="iw-wrap"><div class="iw-left"><div class="iw-rows" id="iw-rows"></div><p class="dg-msg" id="iw-msg" aria-live="polite"></p></div><div class="iw-kb" id="iw-kb"></div></div>';
  function score(g){var r=[0,0,0,0,0],left={},i;for(i=0;i<5;i++){if(g[i]===ans[i])r[i]=2;else left[ans[i]]=(left[ans[i]]||0)+1}for(i=0;i<5;i++)if(!r[i]&&left[g[i]]){r[i]=1;left[g[i]]--}return r}
  function drawRows(flip){var h='';for(var r=0;r<MAX;r++){var g=rows[r],c2='';for(var c=0;c<5;c++){var ch='',cls='iw-c';
      if(g){ch=g.w[c];cls+=' '+CL[g.s[c]]+(flip&&r===rows.length-1?' flip':'')}else if(r===rows.length&&!over){ch=cur[c]||'';if(ch)cls+=' full'}
      c2+='<div class="'+cls+'"'+(flip&&r===rows.length-1?' style="animation-delay:'+(c*90)+'ms"':'')+'>'+ch+'</div>'}h+='<div class="iw-row" id="iw-r'+r+'">'+c2+'</div>'}
    $('iw-rows').innerHTML=h;$('iw-ink').innerHTML=quills(rows.length,MAX)}
  function drawKb(){$('iw-kb').innerHTML=['qwertyuiop','asdfghjkl','+zxcvbnm-'].map(function(row){return '<div class="iw-kr">'+row.split('').map(function(k){
      if(k==='+')return '<button type="button" class="iw-k wide" data-k="enter">Enter</button>';if(k==='-')return '<button type="button" class="iw-k wide" data-k="back" aria-label="Delete">&#9003;</button>';
      return '<button type="button" class="iw-k'+(keys[k]!==undefined?' '+CL[keys[k]]:'')+'" data-k="'+k+'">'+k+'</button>'}).join('')+'</div>'}).join('');
    el.querySelectorAll('.iw-k').forEach(function(b){b.onclick=function(){press(b.dataset.k)}})}
  function bad(t){$('iw-msg').textContent=t;var r=$('iw-r'+rows.length);if(r){r.classList.add('shake');setTimeout(function(){r.classList.remove('shake')},420)}}
  function press(k){if(over)return;if(k==='enter')return submit();if(k==='back'){cur=cur.slice(0,-1);return drawRows()}if(/^[a-z]$/.test(k)&&cur.length<5){cur+=k;drawRows()}}
  function submit(){if(cur.length<5)return bad('Not enough letters.');if(DICT&&!DICT[cur])return bad('Not in the word list.');
    var s=score(cur);rows.push({w:cur,s:s});for(var i=0;i<5;i++){var ch=cur[i];keys[ch]=Math.max(keys[ch]===undefined?-1:keys[ch],s[i])}
    var won=cur===ans;cur='';$('iw-msg').textContent='';if(won||rows.length>=MAX)over=true;drawRows(true);setTimeout(drawKb,500);
    if(over)setTimeout(function(){end(won)},700)}
  function end(won){D.removeEventListener('keydown',kd);var n=rows.length;
    var grid=rows.map(function(r){return r.s.map(function(x){return ['⬛','🟨','🟩'][x]}).join('')}).join('\n');
    $('iw-kb').innerHTML='<div class="dg-reveal"><div class="dg-word">'+ans.toUpperCase()+'</div><blockquote>&ldquo;'+esc(P.q)+'&rdquo;</blockquote><cite>'+esc(P.c)+'</cite></div>';
    $('iw-msg').textContent=won?(n<=2?'Brilliant.':n<=4?'Well written.':'Just in time.'):'Out of ink.';
    finish(won,'GFA LAW Daily Game #'+NUM+': Inkwell '+(won?n:'X')+'/6\n'+grid,{g:rows.map(function(r){return r.w})},won?'You found '+ans.toUpperCase()+' in '+n+'.':'The word was '+ans.toUpperCase()+'.')}
  function kd(e){if(e.ctrlKey||e.metaKey||e.altKey)return;var t=e.target;if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'))return;if(t&&t.tagName==='BUTTON'&&(e.key==='Enter'||e.key===' '))return;
    if(e.key==='Enter'){e.preventDefault();press('enter')}else if(e.key==='Backspace')press('back');else if(/^[a-zA-Z]$/.test(e.key))press(e.key.toLowerCase())}
  D.addEventListener('keydown',kd);drawRows();drawKb();
}

/* ---------- Who Said It? ---------- */
function whosaid(el){
  var ink=3,doneQ={},log=[],m=[],selQ=null,selF=null,over=false;
  var oq=shuffled([0,1,2,3],DAY*7+3),of=shuffled([0,1,2,3],DAY*13+5);
  el.innerHTML=how('Match each quote to the founder who wrote it.','Tap a quotation, then tap the founder you think wrote it. Every quote is checked against the founder&rsquo;s own papers. A wrong match spills one of three quills of ink.')+'<div class="dg-bar" id="ws-ink"></div>'+
    '<div class="ws-qs">'+oq.map(function(i){var q=P.q[i],f=P.f.filter(function(x){return x[0]===q.a})[0];return '<button type="button" class="ws-q" data-i="'+i+'"><span class="ws-mark" aria-hidden="true">&ldquo;</span><span class="ws-t">'+esc(q.t)+'</span><span class="ws-who">'+f[2]+'</span><span class="ws-src">'+esc(q.s)+'</span></button>'}).join('')+'</div>'+
    '<div class="ws-fs">'+of.map(function(i){var f=P.f[i];return '<button type="button" class="ws-f" data-k="'+f[0]+'"><img src="/assets/img/founders/faces/'+f[1]+'.jpg" alt="" width="64" height="64" loading="lazy"><b>'+f[2]+'</b><small>'+f[3]+'</small></button>'}).join('')+'</div><p class="dg-msg" id="ws-msg" aria-live="polite"></p>';
  function inkd(){$('ws-ink').innerHTML=quills(3-ink,3)}inkd();
  el.querySelectorAll('.ws-q').forEach(function(b){b.onclick=function(){if(over||b.classList.contains('done'))return;selQ=b;el.querySelectorAll('.ws-q').forEach(function(x){x.classList.toggle('sel',x===b)});check()}});
  el.querySelectorAll('.ws-f').forEach(function(b){b.onclick=function(){if(over||b.classList.contains('used'))return;selF=b;el.querySelectorAll('.ws-f').forEach(function(x){x.classList.toggle('sel',x===b)});check()}});
  function check(){if(!selQ||!selF)return;var i=+selQ.dataset.i,q=P.q[i],k=selF.dataset.k,msg=$('ws-msg');m.push([i,k]);
    if(q.a===k){selQ.classList.add('done');selF.classList.add('used');doneQ[i]=1;log.push(1);msg.textContent='Correct.'}
    else{ink--;log.push(0);inkd();var b=selQ;b.classList.add('shake');setTimeout(function(){b.classList.remove('shake')},420);msg.textContent=ink?'Not this founder. '+ink+(ink===1?' quill':' quills')+' of ink left.':'Out of ink.'}
    el.querySelectorAll('.sel').forEach(function(x){x.classList.remove('sel')});selQ=selF=null;
    var n=Object.keys(doneQ).length;if(n===4)end(true);else if(!ink)end(false)}
  function end(won){over=true;el.querySelectorAll('.ws-q:not(.done)').forEach(function(b){b.classList.add('reveal')});
    $('ws-msg').textContent=won?(ink===3?'Huzzah! A perfect hand.':'Well matched.'):'Out of ink. The answers are shown above.';
    var grid=log.map(function(x){return x?'🟩':'🟥'}).join('');
    finish(won,'GFA LAW Daily Game #'+NUM+': Who Said It?\n'+grid,{m:m},won?'You matched all four founders.':'You ran out of ink on Who Said It?.')}
}

/* ---------- Timeline ---------- */
function timeline(el){
  var MAX=4,ord=P.s.slice(),lock=[0,0,0,0,0],rows=[],tries=[],over=false,drag=null,LBL=['1st','2nd','3rd','4th','5th'];
  el.innerHTML=how(esc(P.n)+': put the five events in order, earliest first.','Drag a card along the timeline and the others slide over to make room, or use the arrows. Press Lock it in to check: cards in the right spot turn green and stay put. Each wrong try spills one of four quills of ink.')+'<div class="dg-bar" id="tl-ink"></div>'+
    '<div class="tl-ends" aria-hidden="true"><span>&larr; Earliest</span><span>Latest &rarr;</span></div><div class="tl-scroll" id="tl-sc"><div class="tl-track" id="tl-tr"></div></div><p class="tl-hint">Swipe the timeline sideways to see all five.</p>'+
    '<div class="btns" style="justify-content:center"><button class="btn" type="button" id="tl-go">Lock it in</button></div><p class="dg-msg" id="tl-msg" aria-live="polite"></p>';
  function free(i){return !over&&!lock[i]}
  function prev(i){for(var j=i-1;j>=0;j--)if(!lock[j])return j;return -1}
  function next(i){for(var j=i+1;j<5;j++)if(!lock[j])return j;return -1}
  function shift(base,a,b){var U=[],k;for(k=0;k<5;k++)if(!lock[k])U.push(k);var seq=U.map(function(p){return base[p]}),x=seq.splice(U.indexOf(a),1)[0];seq.splice(U.indexOf(b),0,x);var o=base.slice();U.forEach(function(p,n){o[p]=seq[n]});return o}
  function draw(){var last=rows.length?rows[rows.length-1]:null,sp=rows.filter(function(r){return r.indexOf(0)>-1}).length;
    $('tl-ink').innerHTML=quills(sp,MAX);
    $('tl-tr').innerHTML='<div class="tl-rail" aria-hidden="true"></div>'+ord.map(function(e,i){var L=lock[i],cls='tl-ev'+(L?' ok show':'')+(over?' over show':'')+(!over&&!L&&last&&last[i]===0?' miss':''),mv=free(i);
      return '<div class="tl-slot'+(L?' okslot':'')+'" data-i="'+i+'"><div class="'+cls+'" data-i="'+i+'"><span class="tl-grip" aria-hidden="true">&#8942;&#8942;&#8942;</span><div class="tl-t">'+esc(P.e[e].t)+'<div class="tl-d">'+esc(P.e[e].d)+'</div></div><div class="tl-mv"><button type="button" aria-label="Move earlier" data-i="'+i+'" data-m="-1"'+(mv&&prev(i)>-1?'':' disabled')+'>&larr;</button><button type="button" aria-label="Move later" data-i="'+i+'" data-m="1"'+(mv&&next(i)>-1?'':' disabled')+'>&rarr;</button></div></div><span class="tl-num">'+LBL[i]+'</span></div>'}).join('');
    el.querySelectorAll('.tl-mv button').forEach(function(b){b.onclick=function(){var i=+b.dataset.i,m=+b.dataset.m,j=m<0?prev(i):next(i);if(j<0)return;ord=shift(ord,i,j);draw();var nb=el.querySelector('.tl-mv button[data-i="'+j+'"][data-m="'+m+'"]');if(nb&&!nb.disabled)nb.focus()}});
    el.querySelectorAll('.tl-ev').forEach(function(c){c.addEventListener('pointerdown',down)})}
  function down(e){var c=e.currentTarget,i=+c.dataset.i;if(e.target.closest('button')||!free(i)||e.button>0)return;e.preventDefault();
    var r=c.getBoundingClientRect(),g=c.cloneNode(true);g.classList.add('tl-ghost');g.style.width=r.width+'px';g.style.height=r.height+'px';g.style.left=r.left+'px';g.style.top=r.top+'px';D.body.appendChild(g);c.classList.add('lift');
    drag={i0:i,i:i,base:ord.slice(),g:g,dx:e.clientX-r.left,dy:e.clientY-r.top,x:e.clientX,raf:0};W.addEventListener('pointermove',move);W.addEventListener('pointerup',up);W.addEventListener('pointercancel',up)}
  function move(e){if(!drag)return;drag.x=e.clientX;drag.g.style.left=(e.clientX-drag.dx)+'px';drag.g.style.top=(e.clientY-drag.dy)+'px';var t=-1;
    el.querySelectorAll('.tl-slot').forEach(function(s){var r=s.getBoundingClientRect();if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top-80&&e.clientY<=r.bottom+80)t=+s.dataset.i});
    if(t>-1&&free(t)&&t!==drag.i){ord=shift(drag.base,drag.i0,t);drag.i=t;draw();el.querySelector('.tl-ev[data-i="'+t+'"]').classList.add('lift')}
    if(!drag.raf)drag.raf=requestAnimationFrame(edge)}
  function edge(){if(!drag)return;drag.raf=0;var sc=$('tl-sc'),r=sc.getBoundingClientRect(),v=drag.x<r.left+40?-8:drag.x>r.right-40?8:0;if(v){sc.scrollLeft+=v;drag.raf=requestAnimationFrame(edge)}}
  function up(){if(!drag)return;var d=drag;drag=null;W.removeEventListener('pointermove',move);W.removeEventListener('pointerup',up);W.removeEventListener('pointercancel',up);d.g.remove();draw()}
  $('tl-go').onclick=function(){if(over)return;tries.push(ord.slice());var row=ord.map(function(e,i){return e===i?1:0});rows.push(row);row.forEach(function(r,i){if(r)lock[i]=1});
    var n=row.reduce(function(a,b){return a+b},0);
    if(n===5||rows.length>=MAX){over=true;$('tl-go').hidden=true;var won=n===5;ord=[0,1,2,3,4];lock=[1,1,1,1,1];draw();
      $('tl-msg').textContent=won?(rows.length===1?'First try. Remarkable.':'In good order.'):'Out of ink. The correct order is shown above.';
      var grid=rows.map(function(r){return r.map(function(x){return x?'🟩':'⬜'}).join('')}).join('\n');
      finish(won,'GFA LAW Daily Game #'+NUM+': Timeline '+(won?rows.length:'X')+'/4\n'+grid,{t:tries},won?'You put the timeline in order in '+rows.length+'.':'The timeline got the better of you.');return}
    $('tl-msg').textContent=n+(n===1?' event is':' events are')+' in the right place.';draw()};
  draw();
}

if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',start);else start();
})();
