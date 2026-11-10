(function () {
  var s = document.currentScript, b = s ? s.src.replace(/assets\/seal\.js.*$/, '') : '/';
  var QUICK = 800, P0 = 1000, P1 = 4000;
  function go() {
    var i = document.querySelector('.hero-art .seal-wrap img');
    if (!i) return;
    var n = 0, l = 0;
    var st = i.style;
    st.touchAction = 'manipulation'; st.webkitTapHighlightColor = 'transparent'; st.webkitTouchCallout = 'none';
    st.webkitUserSelect = 'none'; st.userSelect = 'none';
    i.draggable = false;
    i.addEventListener('contextmenu', function (e) { if (n > 0) e.preventDefault(); });
    i.addEventListener('click', function (e) {
      var r = i.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      var t = Date.now(), g = t - l;
      l = t;
      if (!(x > 0.58 && x < 0.83 && y > 0.41 && y < 0.67)) { n = 0; return; }
      if (n < 0) { n = g >= P0 ? 1 : -1; return; }
      if (n === 0) { n = 1; return; }
      if (n < 6) { n = g <= QUICK ? n + 1 : 1; return; }
      if (g < P0) { n = -1; return; }
      if (g > P1) { n = 1; return; }
      n = 0;
      try { localStorage.setItem('gfa_a7', '1'); } catch (z) {}
      i.style.transition = 'filter .4s'; i.style.filter = 'drop-shadow(0 0 22px #E2C67C) brightness(1.25)';
      setTimeout(function () { location.href = b + 'a7/'; }, 450);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
