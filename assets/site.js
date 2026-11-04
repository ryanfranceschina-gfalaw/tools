(function(){
var b=document.body,btn=document.querySelector('.menu-btn');
if(btn)btn.addEventListener('click',function(){var o=b.classList.toggle('nav-open');btn.setAttribute('aria-expanded',o);btn.textContent=o?'Close':'Menu'});
document.querySelectorAll('.nav button').forEach(function(x){x.addEventListener('click',function(e){e.stopPropagation();var li=x.parentNode,o=!li.classList.contains('open');document.querySelectorAll('.nav li.open').forEach(function(l){if(l!==li)l.classList.remove('open')});li.classList.toggle('open',o);x.setAttribute('aria-expanded',o)})});
document.addEventListener('click',function(){document.querySelectorAll('.nav li.open').forEach(function(l){l.classList.remove('open')})});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){document.querySelectorAll('.nav li.open').forEach(function(l){l.classList.remove('open')});b.classList.remove('nav-open')}});
function fit(f){try{var d=f.contentDocument;if(!d||!d.documentElement)return;var h=Math.max(d.documentElement.scrollHeight,d.body?d.body.scrollHeight:0);if(h>20&&Math.abs(h-f.offsetHeight)>2)f.style.height=h+'px'}catch(e){}}
document.querySelectorAll('iframe.emb.auto').forEach(function(f){
 function hook(){fit(f);try{var d=f.contentDocument;if(window.ResizeObserver&&d.body){new ResizeObserver(function(){fit(f)}).observe(d.body)}new MutationObserver(function(){fit(f)}).observe(d.documentElement,{subtree:true,childList:true,attributes:true});d.addEventListener('click',function(){setTimeout(function(){fit(f)},60)},true)}catch(e){}var n=0,t=setInterval(function(){fit(f);if(++n>20)clearInterval(t)},500)}
 if(f.contentDocument&&f.contentDocument.readyState==='complete'&&f.contentDocument.URL!=='about:blank')hook();
 f.addEventListener('load',hook)});
window.addEventListener('resize',function(){document.querySelectorAll('iframe.emb.auto').forEach(fit)});
})();
