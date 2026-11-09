(function(){
var d=document,b=d.body;
/* mobile menu */
var mb=d.querySelector('.menu-btn');
if(mb)mb.addEventListener('click',function(){var o=b.classList.toggle('nav-open');mb.setAttribute('aria-expanded',o)});
/* dropdowns */
d.querySelectorAll('.nav button[aria-haspopup]').forEach(function(x){x.addEventListener('click',function(e){e.stopPropagation();var li=x.parentNode,o=!li.classList.contains('open');d.querySelectorAll('.nav li.open').forEach(function(l){if(l!==li){l.classList.remove('open');l.querySelector('button').setAttribute('aria-expanded','false')}});li.classList.toggle('open',o);x.setAttribute('aria-expanded',o)})});
d.addEventListener('click',function(e){if(!e.target.closest('.nav'))d.querySelectorAll('.nav li.open').forEach(function(l){l.classList.remove('open')})});
d.addEventListener('keydown',function(e){if(e.key==='Escape'){d.querySelectorAll('.nav li.open').forEach(function(l){l.classList.remove('open')});b.classList.remove('nav-open')}});
/* same-origin iframes size to their content */
function fit(f){try{var x=f.contentDocument;if(!x||!x.body)return;var h=Math.max(x.documentElement.scrollHeight,x.body.scrollHeight);if(h>20&&Math.abs(h-f.offsetHeight)>2)f.style.height=h+'px'}catch(e){}}
d.querySelectorAll('iframe.emb.auto').forEach(function(f){function hook(){fit(f);try{var x=f.contentDocument;if(window.ResizeObserver)new ResizeObserver(function(){fit(f)}).observe(x.body);new MutationObserver(function(){fit(f)}).observe(x.documentElement,{subtree:true,childList:true,attributes:true});x.addEventListener('click',function(){setTimeout(function(){fit(f)},60)},true)}catch(e){}var n=0,t=setInterval(function(){fit(f);if(++n>24)clearInterval(t)},500)}f.addEventListener('load',hook);if(f.contentDocument&&f.contentDocument.readyState==='complete'&&f.contentDocument.URL!=='about:blank')hook()});
window.addEventListener('resize',function(){d.querySelectorAll('iframe.emb.auto').forEach(fit)});
/* reveal */
if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});d.querySelectorAll('.rv').forEach(function(el){io.observe(el)})}else d.querySelectorAll('.rv').forEach(function(el){el.classList.add('in')});
/* filters: <div data-filter="x"> chips with data-val, items with data-tags, optional input.search */
d.querySelectorAll('[data-filter]').forEach(function(box){
 var key=box.getAttribute('data-filter'),items=d.querySelectorAll('[data-in="'+key+'"]'),chips=box.querySelectorAll('.chip'),q=d.querySelector('input[data-search="'+key+'"]'),cnt=d.querySelector('[data-count="'+key+'"]'),cur='All';
 function run(){var s=q?q.value.trim().toLowerCase():'',n=0;items.forEach(function(it){var ok=(cur==='All'||(it.getAttribute('data-tags')||'').split('|').indexOf(cur)>-1)&&(!s||it.textContent.toLowerCase().indexOf(s)>-1);it.hidden=!ok;if(ok)n++});if(cnt)cnt.textContent=n+(n===1?' item':' items')}
 chips.forEach(function(c){c.addEventListener('click',function(){cur=c.getAttribute('data-val');chips.forEach(function(o){o.setAttribute('aria-pressed',o===c)});run()})});
 if(q)q.addEventListener('input',run);run()});
/* payment gating */
d.querySelectorAll('.pay').forEach(function(p){var ks=p.querySelectorAll('input[type=checkbox]'),btn=p.querySelector('.pay-btn');function u(){var ok=[].every.call(ks,function(k){return k.checked});btn.setAttribute('aria-disabled',!ok);btn.tabIndex=ok?0:-1}ks.forEach(function(k){k.addEventListener('change',u)});u()});
/* copy link */
d.querySelectorAll('[data-copy]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();var u=location.href;(navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(function(){a.textContent='Link copied'}).catch(function(){prompt('Copy this link:',u)})})});
/* analytics: count calls, emails and case review clicks */
d.addEventListener('click',function(e){var a=e.target.closest('a');if(!a||typeof gtag!=='function')return;var h=a.getAttribute('href')||'',ev=null,lab=(a.textContent||'').trim().slice(0,60);
 if(h.indexOf('tel:')===0)ev='call_click';else if(h.indexOf('sms:')===0)ev='text_click';else if(h.indexOf('mailto:')===0)ev='email_click';else if(/mycase\.com\/contact_us/.test(h))ev='case_review_form';else if(/restore-my-rights/.test(h))ev='restore_rights_click';else if(/lawpay\.com/.test(h))ev='payment_click';else if(/etsy\.com/.test(h))ev='merch_click';
 if(ev)gtag('event',ev,{link_text:lab,link_url:h,page_path:location.pathname})});
})();

// click-to-play YouTube: nothing loads from YouTube until the visitor presses play
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('button.vid');if(!b||b.dataset.on)return;b.dataset.on='1';var f=document.createElement('iframe');f.src='https://www.youtube-nocookie.com/embed/'+b.dataset.yt+'?autoplay=1&rel=0';f.title=b.getAttribute('aria-label');f.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';f.allowFullscreen=true;b.appendChild(f);if(window.gtag)gtag('event','video_play',{video_id:b.dataset.yt});});
