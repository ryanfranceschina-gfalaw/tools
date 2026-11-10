/* GFA LAW, PLLC: holiday themes, 1791 mode, the case file terminal, the 1791 Hunt and "on this day".
   Everything here is optional decoration: if any of it fails, the site still works. */
(function(){
'use strict';
var d=document,H=d.documentElement,W=window;
var reduce=W.matchMedia&&W.matchMedia('(prefers-reduced-motion: reduce)').matches;
function ls(k,v){try{if(v===undefined){var x=localStorage.getItem(k);return x===null?null:JSON.parse(x)}localStorage.setItem(k,JSON.stringify(v))}catch(e){return null}}
function ss(k,v){try{if(v===undefined)return sessionStorage.getItem(k);sessionStorage.setItem(k,v)}catch(e){return null}}
function ev(n,p){try{if(typeof gtag==='function')gtag('event',n,p||{})}catch(e){}}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function typing(e){var t=e.target;return t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))}
/* today in Central time, as {y,m,d} */
function today(){try{var p=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(new Date()),o={};p.forEach(function(x){o[x.type]=+x.value});return{y:o.year,m:o.month,d:o.day}}catch(e){var n=new Date();return{y:n.getFullYear(),m:n.getMonth()+1,d:n.getDate()}}}
var T=today();
W.GFA=W.GFA||{};GFA.today=T;

/* ---------- toast ---------- */
var tt;
function toast(html,ms){var t=d.querySelector('.toast');if(!t){t=d.createElement('div');t.className='toast';t.setAttribute('role','status');t.setAttribute('aria-live','polite');d.body.appendChild(t)}t.innerHTML=html;requestAnimationFrame(function(){t.classList.add('on')});clearTimeout(tt);tt=setTimeout(function(){t.classList.remove('on')},ms||5200)}
GFA.toast=toast;

/* ---------- holidays ---------- */
function dn(y,m,d){return Date.UTC(y,m-1,d)/864e5}
function nth(y,m,dow,n){var f=new Date(Date.UTC(y,m-1,1)).getUTCDay();return 1+((dow-f+7)%7)+7*(n-1)}
function last(y,m,dow){var ld=new Date(Date.UTC(y,m,0)),l=ld.getUTCDate(),w=ld.getUTCDay();return l-((w-dow+7)%7)}
function easter(y){var a=y%19,b=Math.floor(y/100),c=y%100,dd=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-dd-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1;return dn(y,mo,da)}
function ord(n){var s=['th','st','nd','rd'],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0])}
var IC={
 star:'<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
 flag:'<path d="M4 22V3M4 4h13l-2 4 2 4H4"/>',
 heart:'<path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z"/>',
 snow:'<path d="M12 2v20M4.9 6l14.2 12M19.1 6 4.9 18M9 3.5l3 2.5 3-2.5M9 20.5l3-2.5 3 2.5"/>',
 leaf:'<path d="M5 21c0-9 6-15 16-16-1 10-7 16-16 16zM5 21l8-8"/>',
 scroll:'<path d="M8 3h11v15a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-2h11v2a3 3 0 0 0 3 3M8 3a3 3 0 0 0-3 3v10M11 8h5M11 12h5"/>',
 cannon:'<circle cx="7" cy="17" r="4"/><path d="m9.5 13.5 11-7 1.5 2.5-11 7M7 17h.01"/>',
 ship:'<path d="M3 17h18l-2 4H5zM12 3v14M12 4l6 9h-6M12 6l-5 7h5"/>',
 candle:'<path d="M12 2c1.5 2 1.5 3.5 0 5-1.5-1.5-1.5-3 0-5zM9 9h6v13H9z"/>',
 pumpkin:'<path d="M12 6c-5 0-8 3-8 7.5S7 21 12 21s8-3 8-7.5S17 6 12 6zM12 6V3h2M9 12l1 1M15 12l-1 1M9 16c2 1 4 1 6 0"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
 clover:'<path d="M12 12c-3-3-6-3-6 0s3 3 6 0zM12 12c3-3 3-6 0-6s-3 3 0 6zM12 12c3 3 6 3 6 0s-3-3-6 0zM12 12c-3 3-3 6 0 6s3-3 0-6zM12 12l3 9"/>',
 egg:'<path d="M12 3c-4 0-7 6-7 10.5A7 7 0 0 0 19 13.5C19 9 16 3 12 3z"/>',
 tool:'<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5z"/>'
};
function holidays(y){
 var L=[],add=function(id,s,e,ic,msg,link,lt,fx){L.push({id:id,s:s,e:e,ic:ic,msg:msg,link:link,lt:lt,fx:fx})},one=function(id,m,dd,ic,msg,link,lt,fx){var x=dn(y,m,dd);add(id,x,x,ic,msg,link,lt,fx)};
 var ea=easter(y),th=dn(y,11,nth(y,11,4,4));
 /* single days first: they win over multi-day windows */
 one('mlk',1,nth(y,1,1,3),'scroll','<b>Martin Luther King Jr. Day.</b> Honoring Dr. King and the right of the people peaceably to assemble.','/resources/know-your-rights/your-rights-at-a-protest','Your rights at a protest');
 one('valentine',2,14,'heart','<b>Happy Valentine\'s Day.</b> Show your rights some love today.','/constitution','Read the Pocket Constitution','hearts');
 one('presidents',2,nth(y,2,1,3),'star','<b>Happy Presidents Day.</b> Washington\'s Birthday has been a federal holiday since 1879.','/constitution/article-2','Read Article II','stars');
 one('texind',3,2,'star','<b>Happy Texas Independence Day.</b> On March 2, 1836, Texas declared its independence.',null,null,'stars');
 one('alamo',3,6,'flag','<b>Remember the Alamo.</b> The Alamo fell on March 6, 1836.');
 one('stpat',3,17,'clover','<b>Happy St. Patrick\'s Day.</b> We were already wearing green.',null,null,'confetti');
 one('sanjac',4,21,'star','<b>Happy San Jacinto Day.</b> On April 21, 1836, Texas won its independence at the Battle of San Jacinto.',null,null,'stars');
 one('mothers',5,nth(y,5,0,2),'heart','<b>Happy Mother\'s Day</b> from all of us at GFA LAW.');
 one('memorial',5,last(y,5,1),'flag','<b>Memorial Day.</b> Honoring the men and women who died while serving in the U.S. military.');
 one('flag',6,14,'flag','<b>Happy Flag Day.</b> The Stars and Stripes were adopted on June 14, 1777.');
 one('fathers',6,nth(y,6,0,3),'tool','<b>Happy Father\'s Day</b> from all of us at GFA LAW.');
 one('juneteenth',6,19,'sun','<b>Juneteenth.</b> On June 19, 1865, in Galveston, General Order No. 3 announced freedom for enslaved people in Texas.','/constitution/amendment-13','Read the Thirteenth Amendment');
 one('labor',9,nth(y,9,1,1),'tool','<b>Happy Labor Day</b> from GFA LAW. Enjoy the long weekend.');
 one('patriot',9,11,'candle','<b>We will never forget.</b> Remembering September 11, 2001.');
 one('constitution',9,17,'scroll','<b>Happy Constitution Day.</b> The Constitution was signed on September 17, 1787.','/constitution','Read the Pocket Constitution','confetti');
 one('comeandtake',10,2,'cannon','<b>Come and Take It.</b> On October 2, 1835, Texans at Gonzales fired the first shots of the Texas Revolution.','/resources/know-your-rights/carrying-a-handgun-in-texas','Carrying a handgun in Texas');
 one('columbus',10,nth(y,10,1,2),'ship','<b>Happy Columbus Day.</b> In 1492, Christopher Columbus reached the Americas.');
 one('veterans',11,11,'flag','<b>Happy Veterans Day.</b> Thank you to every veteran who served.',null,null,'stars');
 one('pearl',12,7,'candle','<b>Remembering Pearl Harbor,</b> December 7, 1941.');
 one('billofrights',12,15,'scroll','<b>Happy Bill of Rights Day.</b> The first ten amendments were ratified on December 15, 1791.','/constitution','Read the Bill of Rights','confetti');
 /* windows */
 add('july4',dn(y,7,1),dn(y,7,5),'star','<b>Happy '+ord(y-1776)+' birthday, America.</b> The Declaration of Independence was adopted on July 4, 1776.','/constitution','Read the Pocket Constitution','fireworks');
 add('easter',ea-2,ea,'egg','<b>Happy Easter</b> from all of us at GFA LAW.');
 add('halloween',dn(y,10,25),dn(y,10,31),'pumpkin','<b>Happy Halloween.</b> The scariest thing you can do this season? Answer police questions without a lawyer.','/resources/know-your-rights/police-stops-and-arrests-in-texas','Know what to say','leaves');
 add('thanks',th,th+3,'leaf','<b>Happy Thanksgiving</b> from all of us at GFA LAW. We are thankful for our clients and our rights.',null,null,'leaves');
 add('christmas',dn(y,12,20),dn(y,12,26),'snow','<b>Merry Christmas</b> from all of us at GFA LAW.',null,null,'snow');
 add('newyear',dn(y,12,31),dn(y,12,31),'star','<b>Happy New Year</b> from GFA LAW.',null,null,'fireworks');
 add('newyear',dn(y,1,1),dn(y,1,1),'star','<b>Happy New Year</b> from GFA LAW. Here is to a year of freedom.',null,null,'fireworks');
 return L;
}
GFA.holidays=holidays;
var q=new URLSearchParams(location.search),force=q.get('theme'),hol=null,now=dn(T.y,T.m,T.d),HL=holidays(T.y);
if(force){HL.some(function(h){if(h.id===force){hol=h;return true}})}
else HL.some(function(h){if(now>=h.s&&now<=h.e){hol=h;return true}});
if(hol){
 H.setAttribute('data-hol',hol.id);
 var key='gfa_hol_'+hol.id+'_'+T.y;
 if(force||!ls(key)){
  var r=d.createElement('div');r.className='hol';r.setAttribute('role','region');r.setAttribute('aria-label','Holiday message');
  r.innerHTML='<div class="hol-in"><svg class="hol-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(IC[hol.ic]||IC.star)+'</svg><span>'+hol.msg+'</span>'+(hol.link?'<a href="'+hol.link+'">'+hol.lt+'</a>':'')+'</div><button class="hol-x" type="button" aria-label="Dismiss holiday message">&times;</button>';
  var hd=d.querySelector('.hdr');if(hd&&hd.parentNode)hd.parentNode.insertBefore(r,hd.nextSibling);
  r.querySelector('.hol-x').addEventListener('click',function(){r.remove();ls(key,1)});
 }
 if(hol.fx&&!reduce&&(force||!ss('gfa_fx_'+hol.id))){ss('gfa_fx_'+hol.id,'1');setTimeout(function(){fx(hol.fx)},600)}
}
/* ---------- particles ---------- */
function fx(kind,dur){
 var c=d.createElement('canvas');c.className='fx';c.setAttribute('aria-hidden','true');d.body.appendChild(c);
 var x=c.getContext('2d'),w,h,P=[],t0=performance.now(),D=dur||7000,dpr=Math.min(2,W.devicePixelRatio||1);
 function rs(){w=c.width=innerWidth*dpr;h=c.height=innerHeight*dpr}rs();addEventListener('resize',rs);
 var COL={confetti:['#c9a54b','#f1dfa9','#2d5a33','#ffffff','#e2c67c'],stars:['#b22234','#ffffff','#3c3b6e','#c9a54b'],hearts:['#e0567a','#ffb3c6','#ff8fab'],leaves:['#c0601b','#e8b04a','#8c3b12','#d9822b'],snow:['#ffffff'],fireworks:['#ff4d4d','#ffffff','#4d79ff','#f1dfa9','#7dff9d']}[kind]||['#c9a54b'];
 function rnd(a,b){return a+Math.random()*(b-a)}
 function spawn(){var p={x:rnd(0,w),y:rnd(-h*.2,-10),vx:rnd(-.6,.6)*dpr,vy:rnd(1,2.6)*dpr,r:rnd(3,7)*dpr,a:rnd(0,6.3),va:rnd(-.08,.08),c:COL[Math.floor(Math.random()*COL.length)],life:1};if(kind==='snow'){p.vy=rnd(.6,1.6)*dpr;p.r=rnd(1.5,4)*dpr}P.push(p)}
 function burst(){var cx=rnd(w*.15,w*.85),cy=rnd(h*.12,h*.45),col=COL[Math.floor(Math.random()*COL.length)];for(var i=0;i<46;i++){var an=Math.PI*2*i/46,sp=rnd(1.5,4.2)*dpr;P.push({x:cx,y:cy,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp,r:2.2*dpr,c:col,life:1,fw:1})}}
 var nb=0;
 function star(r){x.beginPath();for(var i=0;i<10;i++){var rr=i%2?r*.45:r,an=i*Math.PI/5-Math.PI/2;x.lineTo(Math.cos(an)*rr,Math.sin(an)*rr)}x.closePath();x.fill()}
 function heart(r){x.beginPath();x.moveTo(0,r*.35);x.bezierCurveTo(-r*1.2,-r*.5,-r*.4,-r*1.3,0,-r*.45);x.bezierCurveTo(r*.4,-r*1.3,r*1.2,-r*.5,0,r*.35);x.fill()}
 function tick(t){var el=t-t0;x.clearRect(0,0,w,h);
  if(kind==='fireworks'){if(el<D-1500&&el>nb){burst();nb=el+rnd(350,800)}}else if(el<D-1800){for(var k=0;k<(kind==='snow'?2:3);k++)if(P.length<260)spawn()}
  for(var i=P.length-1;i>=0;i--){var p=P[i];p.x+=p.vx;p.y+=p.vy;
   if(p.fw){p.vy+=.05*dpr;p.vx*=.985;p.vy*=.985;p.life-=.012}else{p.a+=p.va;if(kind==='snow')p.x+=Math.sin(el/600+p.r)*.4*dpr;if(kind==='leaves')p.x+=Math.sin(el/500+p.r)*1.2*dpr}
   if(p.y>h+20||p.life<=0){P.splice(i,1);continue}
   x.save();x.globalAlpha=Math.max(0,Math.min(1,p.life))*(el>D-1200?Math.max(0,(D-el)/1200):1);x.fillStyle=p.c;x.translate(p.x,p.y);x.rotate(p.a||0);
   if(p.fw||kind==='snow'){x.beginPath();x.arc(0,0,p.r,0,7);x.fill()}else if(kind==='stars')star(p.r*1.3);else if(kind==='hearts')heart(p.r*1.3);else if(kind==='leaves'){x.beginPath();x.ellipse(0,0,p.r*1.4,p.r*.7,0,0,7);x.fill()}else x.fillRect(-p.r/2,-p.r/4,p.r,p.r/2);
   x.restore()}
  if(el<D)requestAnimationFrame(tick);else{c.remove();removeEventListener('resize',rs)}}
 requestAnimationFrame(tick);
}
GFA.fx=function(k){if(!reduce)fx(k)};

/* ---------- the 1791 Hunt ---------- */
var SEALS=[
 {id:'home',hint:'Every journey starts at home. Look near the bottom of the opening section.'},
 {id:'lost',hint:'Get lost. Visit a page that does not exist.'},
 {id:'term',hint:'Open the case file terminal with the ~ key and find the secret file.'},
 {id:'y1791',hint:'Turn back the clock. Type the year the Bill of Rights was ratified, anywhere on the site.'},
 {id:'a2',hint:'Read the right that shall not be infringed in the Pocket Constitution.'},
 {id:'trivia',hint:'Win the GFA LAW Daily Game.'},
 {id:'bills',hint:'Make the call on three bills in the Gun Bill Tracker game.'},
 {id:'kyr',hint:'Visit the library of Know Your Rights guides and look near the bottom.'},
 {id:'video',hint:'Grab some popcorn. The seal is near the bottom of the Videos page.'},
 {id:'billtext',hint:'Read the official text of any bill in the Gun Bill Tracker.'}
];
GFA.SEALS=SEALS;
function got(){var g=ls('gfa_seals');if(!Array.isArray(g))return[];var ok=SEALS.map(function(x){return x.id});return g.filter(function(i){return ok.indexOf(i)>-1})}
GFA.got=got;
var SVG='<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29" fill="#8a1c14"/><circle cx="32" cy="32" r="29" fill="none" stroke="#5c0f0a" stroke-width="3" stroke-dasharray="4 3"/><circle cx="32" cy="32" r="21" fill="none" stroke="#e6b3a0" stroke-width="1.5"/><text x="32" y="38" text-anchor="middle" font-family="Georgia,serif" font-size="15" font-weight="700" fill="#f6dccf">1791</text></svg>';
function find(id){var g=got();if(g.indexOf(id)>-1)return false;g.push(id);ls('gfa_seals',g);ev('seal_found',{seal:id,count:g.length});
 if(g.length>=SEALS.length){toast('<b>All 10 seals found.</b> You have completed the 1791 Hunt. <a href="/1791/certificate">Claim your certificate</a>',12000);if(!reduce)fx('confetti',5000)}
 else toast('<b>You found a 1791 seal.</b> '+g.length+' of '+SEALS.length+' found. <a href="/1791">What is this?</a>',7000);
 d.querySelectorAll('.seal-x[data-seal="'+id+'"]').forEach(function(b){b.classList.add('got');b.setAttribute('aria-label','1791 seal, already found')});
 return true}
GFA.find=find;
function sealBtn(id){var b=d.createElement('button');b.type='button';b.className='seal-x';b.setAttribute('data-seal',id);b.innerHTML=SVG;var has=got().indexOf(id)>-1;b.setAttribute('aria-label',has?'1791 seal, already found':'Hidden 1791 seal');if(has)b.classList.add('got');b.addEventListener('click',function(){find(id)});return b}
GFA.sealBtn=sealBtn;
var path=location.pathname.replace(/\/+$/,'')||'/';
function placeIn(sel,id){var el=d.querySelector(sel);if(!el)return;var w=d.createElement('div');w.className='seal-row';w.appendChild(sealBtn(id));el.appendChild(w)}
if(path==='/'){var hs=d.querySelector('main > section');if(hs){hs.style.position=hs.style.position||'relative';var sp=d.createElement('span');sp.className='seal-spot';sp.appendChild(sealBtn('home'));hs.appendChild(sp)}}
if(path==='/resources/know-your-rights')placeIn('main > section:nth-of-type(2) .wrap','kyr');
if(path==='/videos')placeIn('main > section:last-of-type .wrap','video');
d.querySelectorAll('[data-seal-slot]').forEach(function(s){s.appendChild(sealBtn(s.getAttribute('data-seal-slot')))});

/* ---------- 1791 mode: type 1791 or the Konami code ---------- */
function y1791(on){H.classList.toggle('y1791',on);ss('gfa_1791',on?'1':'');if(on){find('y1791');toast('<b>1791 mode.</b> Welcome to the year the Bill of Rights was ratified. Type 1791 again to return to the present.',7000);ev('mode_1791')}}
if(ss('gfa_1791')==='1')H.classList.add('y1791');
var buf='',KON=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'],kp=0;
d.addEventListener('keydown',function(e){
 if(e.ctrlKey||e.metaKey||e.altKey)return;
 var k=e.key;
 if(!typing(e)){
  if(k==='~'||k==='`'){e.preventDefault();term();return}
  buf=(buf+k).slice(-4);if(buf==='1791'){buf='';y1791(!H.classList.contains('y1791'))}
 }
 kp=(k===KON[kp]||(k&&k.toLowerCase()===KON[kp]))?kp+1:(k===KON[0]?1:0);if(kp===KON.length){kp=0;y1791(!H.classList.contains('y1791'))}
});
GFA.y1791=y1791;

/* ---------- case file terminal ---------- */
var C=null;
function getJSON(u){return fetch(u).then(function(r){if(!r.ok)throw 0;return r.json()})}
GFA.getJSON=getJSON;
var AM=['first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth','eleventh','twelfth','thirteenth','fourteenth','fifteenth','sixteenth','seventeenth','eighteenth','nineteenth','twentieth','twenty-first','twenty-second','twenty-third','twenty-fourth','twenty-fifth','twenty-sixth','twenty-seventh'];
function term(){
 if(d.querySelector('.term')){d.querySelector('.term input').focus();return}
 ev('terminal_open');
 var t=d.createElement('div');t.className='term';t.setAttribute('role','dialog');t.setAttribute('aria-label','Case file terminal');
 t.innerHTML='<button class="term-x" type="button" aria-label="Close terminal">exit</button><div class="term-out" aria-live="polite"></div><form class="term-in"><label for="term-i">gfa@caseFile:~$</label><input id="term-i" autocomplete="off" autocapitalize="off" spellcheck="false"></form>';
 d.body.appendChild(t);
 var out=t.querySelector('.term-out'),inp=t.querySelector('input'),hist=[],hi=0,prev=d.activeElement;
 function p(s,c){var x=d.createElement('div');if(c)x.className=c;x.innerHTML=s;out.appendChild(x);out.scrollTop=out.scrollHeight}
 function close(){t.remove();if(prev&&prev.focus)prev.focus()}
 t.querySelector('.term-x').addEventListener('click',close);
 t.addEventListener('keydown',function(e){if(e.key==='Escape'){e.preventDefault();close()}
  if(e.key==='ArrowUp'&&hist.length){hi=Math.max(0,hi-1);inp.value=hist[hi]||'';e.preventDefault()}
  if(e.key==='ArrowDown'&&hist.length){hi=Math.min(hist.length,hi+1);inp.value=hist[hi]||'';e.preventDefault()}});
 p('<span class="g">GFA LAW, PLLC case file terminal v1.791</span>\n<span class="d">Type <b>help</b> for a list of commands. Press Esc or type exit to close.\nThis is a novelty, not legal advice. To talk to a lawyer, type <b>contact</b>.</span>\n');
 var FILES={'readme.txt':'You found the case file terminal. There is more to find.\nTry: cat secret.txt','secret.txt':'SEAL','motto.txt':'Live free. Know your rights. Call a lawyer.','constitution.txt':'CONST'};
 var CMD={
  help:function(){p('<span class="g">Commands</span>\n  ls                 list files\n  cat &lt;file&gt;         read a file\n  amendment &lt;1-27&gt;   read an amendment\n  rights             what to say to police\n  game               today\'s Daily Game\n  constitution       open the Pocket Constitution\n  bills              open the Gun Bill Tracker\n  hunt               the 1791 Hunt\n  1791               toggle 1791 mode\n  theme &lt;name&gt;       preview a holiday theme (theme list)\n  merch              GFA LAW merch\n  contact            request a case review\n  whoami, date, clear, history, exit')},
  ls:function(){p(Object.keys(FILES).join('    '))},
  cat:function(a){var f=FILES[a];if(!a)return p('usage: cat &lt;file&gt;','e');if(!f)return p('cat: '+esc(a)+': No such file. Try ls.','e');
   if(f==='SEAL'){var w=d.createElement('div');w.innerHTML='CLASSIFIED: you found a 1791 seal. Click it to claim it.\n';w.appendChild(sealBtn('term'));out.appendChild(w);out.scrollTop=out.scrollHeight;return}
   if(f==='CONST'){p('The full text is a little long for a terminal. Opening the Pocket Constitution...');setTimeout(function(){location.href='/constitution'},900);return}
   p(esc(f))},
  amendment:function(a){var n=parseInt(a,10);if(!(n>=1&&n<=27))return p('usage: amendment &lt;1-27&gt;','e');p('<span class="d">Retrieving...</span>');
   getJSON('/assets/fun/constitution.json').then(function(J){var x=J.filter(function(e){return e.id==='amendment-'+n})[0];if(!x)throw 0;var txt=x.text||x.sections.map(function(s){return(s.n?'Section '+s.n+'. ':'')+s.text}).join('\n');p('<span class="g">'+esc(x.title)+'</span> <span class="d">(ratified '+esc(x.ratified||'')+')</span>\n'+esc(txt)+'\n<a href="/constitution/amendment-'+n+'">Share this amendment</a>')}).catch(function(){p('Could not load the text right now.','e')})},
  rights:function(){p('<span class="g">Say it clearly and calmly:</span>\n  "I am going to remain silent. I want a lawyer."\n  "I do not consent to any searches."\n  "Am I free to go?"\nDrivers must show a license when asked. Read more: <a href="/resources/know-your-rights/police-stops-and-arrests-in-texas">Police stops and arrests in Texas</a>')},
  game:function(){location.href='/daily-game'},trivia:function(){location.href='/daily-game'},bills:function(){location.href='/resources/gun-bill-tracker'},constitution:function(){location.href='/constitution'},
  hunt:function(){var g=got();p('1791 Hunt: '+g.length+' of '+SEALS.length+' seals found. <a href="/1791">Read the rules</a>')},
  seals:function(){CMD.hunt()},
  '1791':function(){y1791(!H.classList.contains('y1791'));p(H.classList.contains('y1791')?'Traveling to 1791...':'Returning to the present...')},
  theme:function(a){if(!a||a==='list'){var ids=[];HL.forEach(function(h){if(ids.indexOf(h.id)<0)ids.push(h.id)});return p('themes: '+ids.join(', ')+'\nusage: theme &lt;name&gt;')}location.href=location.pathname+'?theme='+encodeURIComponent(a)},
  merch:function(){location.href='/merch'},contact:function(){location.href='/contact/contact-gfa-law'},
  whoami:function(){p('A free citizen with rights that predate any government. Probably.')},
  date:function(){p(new Date().toString())},
  clear:function(){out.innerHTML=''},history:function(){p(hist.map(function(h,i){return(i+1)+'  '+esc(h)}).join('\n')||'(empty)')},
  exit:close,quit:close,
  sudo:function(){p('Permission denied. Come back with a warrant signed by a neutral magistrate.','e')},
  rm:function(){p('Nice try. We do not destroy records here.','e')},
  hello:function(){p('Hello. You have the right to remain silent, but feel free to type help.')},
  lawyer:function(){p('Invoking your right to counsel... <a href="/contact/contact-gfa-law">Request a case review</a> or call <a href="tel:+12544051726">254-405-1726</a>.')}
 };
 CMD.cd=function(){p('There is only one directory here, and it is free.')};
 t.querySelector('form').addEventListener('submit',function(e){e.preventDefault();var v=inp.value.trim();inp.value='';if(!v)return;hist.push(v);hi=hist.length;p('<span class="g">gfa@caseFile:~$</span> '+esc(v));var a=v.split(/\s+/),c=a.shift().toLowerCase(),arg=a.join(' ');
  if(/^(\d+)(st|nd|rd|th)$/.test(c)||AM.indexOf(c)>-1){var n=AM.indexOf(c)+1||parseInt(c,10);return CMD.amendment(String(n))}
  (CMD[c]||function(){p(esc(c)+': command not found. Type help.','e')})(arg)});
 inp.focus();
}
GFA.term=term;

/* ---------- on this day ---------- */
var otd=d.querySelector('[data-onthisday]');
if(otd){var key=('0'+T.m).slice(-2)+'-'+('0'+T.d).slice(-2);
 getJSON('/assets/fun/onthisday.json').then(function(J){var L=J[key];if(!L||!L.length){otd.remove();return}var e=L[(T.y)%L.length];
  otd.innerHTML='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg><p><b>On this day in '+e.year+':</b> '+esc(e.text)+'</p>';otd.hidden=false}).catch(function(){otd.remove()})}

/* ---------- share buttons ---------- */
d.querySelectorAll('[data-share]').forEach(function(b){b.addEventListener('click',function(){var u=location.href.split('#')[0].split('?')[0],t=b.getAttribute('data-share');ev('share',{item:t});
 if(navigator.share)navigator.share({title:t,url:u}).catch(function(){});else if(navigator.clipboard)navigator.clipboard.writeText(u).then(function(){toast('Link copied. Paste it anywhere to share.')});else prompt('Copy this link:',u)})});

/* ---------- a note for the curious ---------- */
try{console.log('%cGFA LAW, PLLC','font:700 20px Georgia;color:#C9A54B');console.log('Looking around? Good instinct. Try typing 1791 on any page, or press the ~ key.')}catch(e){}
})();
