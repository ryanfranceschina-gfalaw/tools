/* a7: group chat. All member text is set with textContent, never parsed as HTML or links. */
(function () {
  'use strict';
  var API = 'https://script.google.com/macros/s/AKfycbx7QdvF6l8zROPvs_mUMLNjsfdeWccA5raj18UgX2HFuCvBD_RLukyVZxk2RUOzCkxTmw/exec';
  var RULES = '2026-11-10c';
  var MAX = 280;
  var POLL = 4000;
  var me = document.currentScript;
  var BASE = me ? me.src.replace(/assets\/a7\/app\.js.*$/, '') : '/';
  var REACTS = ['👍', '👎', '❤️', '😂', '😮', '😢', '🔥', '💯', '🙏', '🇺🇸', '🤠', '🎉'];
  var T0 = Date.now();
  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, txt) { var x = document.createElement(tag); if (cls) x.className = cls; if (txt != null) x.textContent = txt; return x; }

  // ---- storage (falls back to memory) ----
  var mem = {};
  function sget(k) { try { var v = localStorage.getItem(k); return v === null ? mem[k] : v; } catch (e) { return mem[k]; } }
  function sset(k, v) { mem[k] = v; try { localStorage.setItem(k, v); } catch (e) {} }
  function sdel(k) { mem[k] = null; try { localStorage.removeItem(k); } catch (e) {} }
  function jget(k, d) { try { return JSON.parse(sget(k) || '') || d; } catch (e) { return d; } }

  if (!sget('gfa_a7')) { $('fsp-lock').hidden = false; return; }
  $('fsp-app').hidden = false;
  document.documentElement.classList.add('gc-page');

  var ID = sget('gfa_fsp_id');
  if (!/^[a-f0-9]{32}$/.test(ID || '')) {
    var rb = new Uint8Array(16); (window.crypto || window.msCrypto).getRandomValues(rb);
    ID = Array.prototype.map.call(rb, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    sset('gfa_fsp_id', ID);
  }
  var ME = jget('gfa_fsp_me', null);
  var MINE = jget('gfa_a7_mine', []);
  var MODE = 'open';
  function saveMe() { if (ME) sset('gfa_fsp_me', JSON.stringify(ME)); }
  function meFrom(u) { return { name: u.name, av: u.av, rules: u.rules, hasPw: !!u.hasPw, v: !!u.v }; }

  // ---- pictures ----
  var FOUNDERS = [['washington', 'George Washington'], ['franklin', 'Benjamin Franklin'], ['jefferson', 'Thomas Jefferson'],
    ['adams', 'John Adams'], ['hamilton', 'Alexander Hamilton'], ['jay', 'John Jay'], ['madison', 'James Madison']];
  var SPECIALS = [['lasereyes', 'Laser Eyes', 'a7/pfp/lasereyes.jpg'], ['sadie', 'Sadie', 'a7/pfp/sadie.jpg']];
  var EXCL = { sadie: 'sadiegirl216' };   // pictures only one member may pick
  function ukOf(n) { return String(n || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
  function canUse(k) { var o = EXCL[k]; return !o || ukOf(ME ? ME.name : $('j-name').value) === o; }
  var ICONS = [['bell', 'Liberty Bell'], ['gavel', 'Gavel'], ['quill', 'Quill'], ['scales', 'Scales'], ['star', 'Lone Star'],
    ['torch', 'Torch'], ['scroll', 'Scroll'], ['megaphone', 'Megaphone'], ['shield', 'Shield'], ['key', 'Key'], ['anchor', 'Anchor'],
    ['compass', 'Compass'], ['crown', 'Crown'], ['horseshoe', 'Horseshoe'], ['mountain', 'Mountain'], ['sun', 'Sun'], ['moon', 'Moon'],
    ['bolt', 'Lightning'], ['book', 'Book'], ['mug', 'Coffee'], ['hat', 'Cowboy Hat'], ['tree', 'Pine'], ['rocket', 'Rocket'],
    ['dice', 'Dice'], ['note', 'Music'], ['heart', 'Heart'], ['globe', 'Globe'], ['flag', 'Flag'], ['lighthouse', 'Lighthouse'],
    ['flame', 'Flame'], ['cactus', 'Cactus'], ['hourglass', 'Hourglass'], ['rook', 'Rook'], ['paw', 'Paw'], ['fish', 'Fish'],
    ['owl', 'Owl'], ['longhorn', 'Longhorn'], ['lantern', 'Lantern']];
  var DARK = [['green', '#1a331c'], ['navy', '#16243f'], ['maroon', '#3d1418'], ['slate', '#2b3036'], ['black', '#0f0f10'], ['teal', '#14403f']];
  var BRIGHT = [['red', '#d6453d'], ['orange', '#e8832a'], ['yellow', '#d9a514'], ['lime', '#4f9e33'], ['sky', '#2e9bd6'], ['blue', '#2f5fd0'], ['purple', '#7b4bc4'], ['pink', '#d24b8e']];
  var colMap = {}, brightSet = {};
  DARK.forEach(function (c) { colMap[c[0]] = c[1]; });
  BRIGHT.forEach(function (c) { colMap[c[0]] = c[1]; brightSet[c[0]] = 1; });
  var avMap = {};
  FOUNDERS.forEach(function (a) { avMap[a[0]] = { n: a[1], src: 'img/founders/' + a[0] + '.jpg', photo: 1 }; });
  SPECIALS.forEach(function (a) { avMap[a[0]] = { n: a[1], src: a[2], photo: 1 }; });
  ICONS.forEach(function (a) { avMap[a[0]] = { n: a[1], icon: 1 }; });
  function avInfo(k) {
    var p = String(k || '').split('.'), a = avMap[p[0]];
    if (!a || p.length > 2 || (p[1] && (!colMap[p[1]] || a.photo))) { p = ['star']; a = avMap.star; }
    if (a.photo) return { src: BASE + 'assets/' + a.src, bg: '', n: a.n, icon: 0 };
    var c = p[1] || 'green';
    return { src: BASE + 'assets/a7/' + (brightSet[c] ? 'avw/' : 'av/') + p[0] + '.svg', bg: colMap[c], n: a.n, icon: 1 };
  }
  function setAv(img, k) { var v = avInfo(k); img.src = v.src; img.style.backgroundColor = v.bg; img.classList.toggle('ico', !!v.icon); img.alt = ''; }

  function picker(host) {
    var state = { pick: '', theme: 'founders', dark: 'green', bright: 'red' };
    var tabs = el('div', 'gc-ptabs'), grid = el('div', 'gc-pgrid'), sw = el('div', 'gc-swatches');
    var THEMES = [['founders', 'Founders'], ['classic', 'Classic'], ['color', 'Colorful'], ['special', 'Specials']];
    THEMES.forEach(function (t) {
      var b = el('button', '', t[1]); b.type = 'button'; b.dataset.t = t[0];
      b.addEventListener('click', function () { state.theme = t[0]; draw(); });
      tabs.appendChild(b);
    });
    host.appendChild(tabs); host.appendChild(sw); host.appendChild(grid);
    function cell(k, label) {
      var b = el('button', 'gc-pcell'); b.type = 'button'; b.title = label; b.setAttribute('aria-label', label);
      b.setAttribute('aria-pressed', String(state.pick === k));
      var im = document.createElement('img'); setAv(im, k); im.width = 64; im.height = 64; im.loading = 'lazy';
      b.appendChild(im);
      b.addEventListener('click', function () { state.pick = k; draw(); });
      return b;
    }
    function draw() {
      tabs.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.t === state.theme); });
      grid.textContent = ''; sw.textContent = '';
      var t = state.theme;
      if (t === 'classic' || t === 'color') {
        var set = t === 'classic' ? DARK : BRIGHT, cur = t === 'classic' ? state.dark : state.bright;
        set.forEach(function (c) {
          var b = el('button', 'gc-sw'); b.type = 'button'; b.style.backgroundColor = c[1]; b.setAttribute('aria-label', c[0] + ' background');
          b.setAttribute('aria-pressed', String(c[0] === cur));
          b.addEventListener('click', function () {
            if (t === 'classic') state.dark = c[0]; else state.bright = c[0];
            var p = state.pick.split('.'); if (avMap[p[0]] && avMap[p[0]].icon) state.pick = p[0] + (c[0] === 'green' ? '' : '.' + c[0]);
            draw();
          });
          sw.appendChild(b);
        });
        ICONS.forEach(function (a) { var k = a[0] + (cur === 'green' ? '' : '.' + cur); grid.appendChild(cell(k, a[1])); });
      } else if (t === 'founders') FOUNDERS.forEach(function (a) { grid.appendChild(cell(a[0], a[1])); });
      else SPECIALS.forEach(function (a) { if (canUse(a[0])) grid.appendChild(cell(a[0], a[1])); });
    }
    return {
      redraw: function () { if (state.pick && !canUse(state.pick)) state.pick = ''; draw(); },
      get: function () { return state.pick; },
      set: function (k) {
        state.pick = k || ''; var p = String(k || '').split('.'), a = avMap[p[0]];
        if (a && a.icon) { var c = p[1] || 'green'; if (brightSet[c]) { state.theme = 'color'; state.bright = c; } else { state.theme = 'classic'; state.dark = c; } }
        else if (k && SPECIALS.some(function (s) { return s[0] === k; })) state.theme = 'special';
        else state.theme = 'founders';
        draw();
      }
    };
  }

  // ---- SHA-256 for the proof of work ----
  var K = [], H0 = [];
  (function () {
    function frac(x) { return ((x - Math.floor(x)) * 4294967296) | 0; }
    var n = 2, c = 0;
    while (c < 64) { var p = true; for (var f = 2; f * f <= n; f++) if (n % f === 0) { p = false; break; }
      if (p) { if (c < 8) H0[c] = frac(Math.pow(n, 1 / 2)); K[c] = frac(Math.pow(n, 1 / 3)); c++; } n++; }
  })();
  function utf8(s) { return unescape(encodeURIComponent(s)); }
  function sha256hex(str) {
    var s = utf8(str), l = s.length, words = [], i, j;
    for (i = 0; i < l; i++) words[i >> 2] |= (s.charCodeAt(i) & 255) << (24 - (i % 4) * 8);
    words[l >> 2] |= 0x80 << (24 - (l % 4) * 8);
    var nw = ((l + 8) >> 6 << 4) + 16; for (i = words.length; i < nw; i++) words[i] = words[i] | 0;
    words[nw - 1] = l * 8;
    var h = H0.slice(), w = new Array(64);
    for (i = 0; i < nw; i += 16) {
      var a = h[0], b2 = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
      for (j = 0; j < 64; j++) {
        if (j < 16) w[j] = words[i + j] | 0;
        else { var x = w[j - 15], y = w[j - 2];
          w[j] = (((x >>> 7 | x << 25) ^ (x >>> 18 | x << 14) ^ (x >>> 3)) + w[j - 7] + ((y >>> 17 | y << 15) ^ (y >>> 19 | y << 13) ^ (y >>> 10)) + w[j - 16]) | 0; }
        var t1 = (hh + ((e >>> 6 | e << 26) ^ (e >>> 11 | e << 21) ^ (e >>> 25 | e << 7)) + ((e & f) ^ (~e & g)) + K[j] + w[j]) | 0;
        var t2 = (((a >>> 2 | a << 30) ^ (a >>> 13 | a << 19) ^ (a >>> 22 | a << 10)) + ((a & b2) ^ (a & c) ^ (b2 & c))) | 0;
        hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b2; b2 = a; a = (t1 + t2) | 0;
      }
      h[0] = (h[0] + a) | 0; h[1] = (h[1] + b2) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0;
      h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + g) | 0; h[7] = (h[7] + hh) | 0;
    }
    return h.map(function (v) { return ('0000000' + (v >>> 0).toString(16)).slice(-8); }).join('');
  }


  // ---- tickets: fetched ahead of time so they are aged and solved when needed ----
  var TK = null, tkWait = null;
  function getTicket() {
    if (tkWait) return tkWait;
    tkWait = fetch(API + '?a=t', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) {
      if (d.mode) setMode(d.mode);
      if (!d.t) throw new Error('closed');
      var pre = d.pow || '0000', n = 0;
      return new Promise(function (res) {
        (function chunk() {
          var end = n + 4000;
          for (; n < end; n++) if (sha256hex(d.t + ':' + n).indexOf(pre) === 0) { TK = { t: d.t, pow: String(n), at: Date.now() }; return res(TK); }
          setTimeout(chunk, 0);
        })();
      });
    }).finally(function () { tkWait = null; });
    return tkWait;
  }
  function freshTicket() {
    if (TK && Date.now() - TK.at < 14 * 60 * 1000) return Promise.resolve(TK);
    TK = null; return getTicket();
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  var queue = Promise.resolve();
  function send(body) {   // one request at a time, each with its own fresh ticket
    var run = function () { return sendNow(body, 0); };
    var p = queue.then(run, run);
    queue = p.catch(function () {});
    return p;
  }
  function sendNow(body, tries) {
    return freshTicket().then(function (tk) {
      var need = Math.max(1700 - (Date.now() - tk.at), 4600 - (Date.now() - T0), 0);
      return wait(need).then(function () {
        TK = null;
        body.id = ID; body.t = tk.t; body.pow = tk.pow; body.el = Date.now() - T0;
        body.website = $('j-site').value || $('c-site').value;
        return fetch(API, { method: 'POST', body: JSON.stringify(body) }).then(function (r) { return r.json(); });
      });
    }).then(function (d) {
      getTicket().catch(function () {});
      if (!d.ok && d.retry && tries < 1) return wait(800).then(function () { return sendNow(body, tries + 1); });
      return d;
    });
  }

  // ---- screens ----
  function setMode(m) {
    MODE = m;
    var n = $('c-mode');
    if (m === 'open') n.hidden = true;
    else { n.hidden = false; n.textContent = m === 'readonly' ? 'The chat is read-only right now. You can still read.' : 'The chat is closed right now. Check back later.'; }
    $('c-form').hidden = m !== 'open';
    var bm = $('b-mode'); bm.hidden = n.hidden; bm.textContent = n.textContent.replace('chat is', 'group chat is');
    $('b-form').hidden = m !== 'open';
  }
  // same data, two presentations: the post-and-reply board on desktop, the group chat on phones
  // Computers (mouse or trackpad) get the board, phones and tablets get the chat, whatever the window size.
  // A member can override it from the menu; the choice is remembered on that device.
  var MQD = window.matchMedia('(hover: hover) and (pointer: fine)'), MQW = window.matchMedia('(min-width: 600px)');
  function wantBoard() { var v = sget('gfa_a7_view'); if (v === 'board') return true; if (v === 'chat') return false; return MQD.matches && MQW.matches; }
  var BOARD = wantBoard();
  function onMQ() { var b = wantBoard(); if (b === BOARD) return; BOARD = b; screen(); render(true); if (!BOARD) toBottom(); viewLabel(); }
  [MQD, MQW].forEach(function (q) { if (q.addEventListener) q.addEventListener('change', onMQ); else q.addListener(onMQ); });
  function viewLabel() { var b = $('c-view'); if (b) b.textContent = BOARD ? 'Switch to chat view' : 'Switch to board view'; }
  $('c-view').addEventListener('click', function (e) {
    e.stopPropagation(); menuOpen(false);
    sset('gfa_a7_view', BOARD ? 'chat' : 'board'); onMQ(); window.scrollTo(0, 0);
  });
  viewLabel();
  function errEl() { return BOARD ? $('b-err') : $('c-err'); }
  function screen() {
    var inChat = !!ME && ME.hasPw && ME.rules === RULES;
    $('gate').hidden = !!ME;
    $('rack').hidden = !ME || inChat;
    $('chat').hidden = !inChat || BOARD;
    $('board').hidden = !inChat || !BOARD;
    var home = BOARD ? $('b-mewrap') : document.querySelector('.gc-top');
    if ($('c-me').parentNode !== home) { home.appendChild($('c-me')); home.appendChild($('c-menu')); }
    if (ME && !inChat) { $('rack-pw').hidden = !!ME.hasPw; $('rack-rules').hidden = ME.rules === RULES; }
    if (ME) {
      setAv($('c-meav'), ME.av); setAv($('b-meav'), ME.av);
      var w = $('c-mename'); w.textContent = ME.name; if (ME.v) w.appendChild(badge());
    }
    document.documentElement.classList.toggle('gc-in', inChat && !BOARD);
  }

  // ---- gate: join and sign in ----
  var joinPick = picker(document.querySelector('[data-picker=join]'));
  joinPick.set('');
  $('j-name').addEventListener('input', function () {
    if (ukOf($('j-name').value) === EXCL.sadie && !joinPick.get()) joinPick.set('sadie'); else joinPick.redraw();
  });
  document.querySelectorAll('.gc-tabs button').forEach(function (b) {
    b.addEventListener('click', function () { $('join').hidden = b.dataset.to !== 'join'; $('login').hidden = b.dataset.to !== 'login'; });
  });
  function busy(btn, on, label) { btn.disabled = on; if (label) btn.textContent = label; }
  $('join').addEventListener('submit', function (e) {
    e.preventDefault();
    var err = $('j-err'), btn = $('j-btn'); err.textContent = '';
    var name = $('j-name').value.trim(), pw = $('j-pw').value, av = joinPick.get();
    if (!/^[A-Za-z0-9][A-Za-z0-9 _.\-]{1,18}[A-Za-z0-9]$/.test(name)) { err.textContent = 'Usernames are 3 to 20 letters, numbers, spaces, dots, dashes or underscores.'; return; }
    if (pw.length < 8 || pw.length > 100) { err.textContent = 'Pick a password of 8 to 100 characters.'; return; }
    if (!av) { err.textContent = 'Pick a profile picture.'; return; }
    if (!$('j-adult').checked || !$('j-secret').checked || !$('j-agree').checked) { err.textContent = 'Check all three boxes to join.'; return; }
    busy(btn, true, 'Joining...');
    var claim = $('j-claimwrap').hidden ? undefined : $('j-claim').value.trim();
    send({ a: 'join', name: name, av: av, adult: true, secret: true, rules: RULES, pw: pw, claim: claim }).then(function (d) {
      if (!d.ok || !d.user) {
        err.textContent = d.error || 'Please try again.';
        if (d.claim) { $('j-claimwrap').hidden = false; $('j-claim').focus(); }
        return;
      }
      ME = meFrom(d.user); saveMe(); $('j-pw').value = ''; screen(); start();
    }).catch(function () { err.textContent = 'Could not reach the chat. Try again.'; })
      .finally(function () { busy(btn, false, 'Join the chat'); });
  });
  $('login').addEventListener('submit', function (e) {
    e.preventDefault();
    var err = $('l-err'), btn = $('l-btn'); err.textContent = '';
    var nm = $('l-name').value.trim(), pw = $('l-pw').value;
    if (!nm || pw.length < 8) { err.textContent = 'Wrong username or password.'; return; }
    busy(btn, true, 'Signing in...');
    send({ a: 'login', name: nm, pw: pw }).then(function (d) {
      if (!d.ok || !d.user) { err.textContent = d.error || 'Please try again.'; return; }
      ME = meFrom(d.user); saveMe();
      MINE = d.mine || []; sset('gfa_a7_mine', JSON.stringify(MINE));
      $('l-pw').value = ''; screen(); start();
    }).catch(function () { err.textContent = 'Could not reach the chat. Try again.'; })
      .finally(function () { busy(btn, false, 'Sign in'); });
  });
  // existing members: set a password and/or confirm the current rules
  $('rack').addEventListener('submit', function (e) {
    e.preventDefault();
    var err = $('r-err'), btn = $('r-btn'); err.textContent = '';
    var needPw = !ME.hasPw, needRules = ME.rules !== RULES, pw = $('r-pw').value;
    if (needPw && (pw.length < 8 || pw.length > 100)) { err.textContent = 'Pick a password of 8 to 100 characters.'; return; }
    if (needRules && (!$('r-adult').checked || !$('r-secret').checked || !$('r-agree').checked)) { err.textContent = 'Check all three boxes to continue.'; return; }
    busy(btn, true, 'Saving...');
    var p = Promise.resolve({ ok: true, user: ME });
    if (needPw) p = p.then(function () { return send({ a: 'setpw', pw: pw }); });
    if (needRules) p = p.then(function (d) { if (!d.ok) return d; return send({ a: 'join', av: ME.av, adult: true, secret: true, rules: RULES }); });
    p.then(function (d) {
      if (!d.ok || !d.user) { err.textContent = d.error || 'Please try again.'; return; }
      ME = meFrom(d.user); saveMe(); $('r-pw').value = ''; screen(); start();
    }).catch(function () { err.textContent = 'Could not reach the chat. Try again.'; })
      .finally(function () { busy(btn, false, 'Continue to the chat'); });
  });

  // ---- account menu and panels ----
  var editPick = picker(document.querySelector('[data-picker=edit]'));
  var menu = $('c-menu');
  function menuOpen(on) { menu.hidden = !on; $('c-me').setAttribute('aria-expanded', String(on)); }
  $('c-me').addEventListener('click', function (e) { e.stopPropagation(); menuOpen(menu.hidden); });
  document.addEventListener('click', function (e) { if (!menu.hidden && !menu.contains(e.target)) menuOpen(false); });
  function panel(which) {
    menuOpen(false);
    ['name', 'pic', 'pw'].forEach(function (k) { $('p-' + k).hidden = k !== which; });
    $('s-title').textContent = { name: 'Change your name', pic: 'Change your picture', pw: 'Change your password' }[which];
    if (which === 'name') { $('n-name').value = ME.name; $('n-err').textContent = ''; }
    if (which === 'pic') { editPick.set(ME.av); $('pc-err').textContent = ''; }
    if (which === 'pw') { $('pw-old').value = ''; $('pw-new').value = ''; $('pw-err').textContent = ''; }
    $('sheet').hidden = false;
    var f = $('p-' + which).querySelector('input'); if (f) f.focus();
  }
  function closeSheet() { $('sheet').hidden = true; }
  menu.querySelectorAll('[data-panel]').forEach(function (b) { b.addEventListener('click', function () { panel(b.dataset.panel); }); });
  $('s-x').addEventListener('click', closeSheet);
  $('sheet').addEventListener('click', function (e) { if (e.target === $('sheet')) closeSheet(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeSheet(); menuOpen(false); } });
  function sheetForm(id, errId, build, done) {
    $(id).addEventListener('submit', function (e) {
      e.preventDefault();
      var err = $(errId), btn = $(id).querySelector('button[type=submit]'), label = btn.textContent; err.textContent = '';
      var body = build(err); if (!body) return;
      busy(btn, true, 'Saving...');
      send(body).then(function (d) {
        if (!d.ok || !d.user) { err.textContent = d.error || 'Please try again.'; return; }
        ME = meFrom(d.user); saveMe(); screen(); closeSheet(); if (done) done(); load(true);
      }).catch(function () { err.textContent = 'Could not reach the chat. Try again.'; })
        .finally(function () { busy(btn, false, label); });
    });
  }
  sheetForm('p-name', 'n-err', function (err) {
    var n = $('n-name').value.trim();
    if (!/^[A-Za-z0-9][A-Za-z0-9 _.\-]{1,18}[A-Za-z0-9]$/.test(n)) { err.textContent = 'Usernames are 3 to 20 letters, numbers, spaces, dots, dashes or underscores.'; return null; }
    return { a: 'rename', name: n };
  });
  sheetForm('p-pic', 'pc-err', function (err) {
    if (!editPick.get()) { err.textContent = 'Pick a profile picture.'; return null; }
    return { a: 'avatar', av: editPick.get() };
  });
  sheetForm('p-pw', 'pw-err', function (err) {
    var n = $('pw-new').value;
    if (n.length < 8 || n.length > 100) { err.textContent = 'Passwords are 8 to 100 characters.'; return null; }
    return { a: 'setpw', old: $('pw-old').value, pw: n };
  });
  var outArmed = 0;
  $('c-out').addEventListener('click', function (e) {
    e.stopPropagation();
    var b = $('c-out');
    if (!outArmed) { b.textContent = 'Tap again to sign out'; outArmed = setTimeout(function () { outArmed = 0; b.textContent = 'Sign out'; }, 5000); return; }
    clearTimeout(outArmed);
    ['gfa_fsp_id', 'gfa_fsp_me', 'gfa_a7_mine', 'gfa_fsp_votes'].forEach(sdel);
    location.reload();
  });

  // ---- chat ----
  var list = $('c-list'), MSGS = [], MY = {}, SIG = '', replyTo = null, pending = [], openActs = null;
  function badge() {
    var b = el('span', 'gc-ver'); b.title = 'Verified'; b.setAttribute('aria-label', 'Verified');
    b.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="#C9A54B" d="M12 1.5l2.6 2.1 3.3-.4 1 3.2 2.9 1.6-.7 3.3 1.8 2.8-2.4 2.3-.2 3.3-3.3.6L14.9 23 12 21.4 9.1 23l-2-2.6-3.3-.6-.2-3.3-2.4-2.3 1.8-2.8-.7-3.3 2.9-1.6 1-3.2 3.3.4z"/><path d="M7.5 12.3l3 3 6-6.2" fill="none" stroke="#0d1a11" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    return b;
  }
  function hhmm(d) { return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
  function dayLabel(d) {
    var t = new Date(), y = new Date(); y.setDate(t.getDate() - 1);
    if (d.toDateString() === t.toDateString()) return 'Today';
    if (d.toDateString() === y.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: d.getFullYear() === t.getFullYear() ? undefined : 'numeric' });
  }
  function nearBottom() { return list.scrollHeight - list.scrollTop - list.clientHeight < 80; }
  function toBottom() { list.scrollTop = list.scrollHeight; $('c-new').hidden = true; }
  $('c-new').addEventListener('click', toBottom);
  list.addEventListener('scroll', function () { if (nearBottom()) $('c-new').hidden = true; });

  function isMine(m) { return MINE.indexOf(m.id) > -1 || (ME && m.u === ME.name); }
  function bubble(m, grouped, mine) {
    var row = el('div', 'gc-msg' + (mine ? ' me' : '') + (grouped ? ' grp' : '') + (m.pend ? ' pend' : ''));
    row.dataset.id = m.id;
    if (!mine) {
      var im = document.createElement('img'); im.className = 'gc-av'; im.width = 34; im.height = 34; im.loading = 'lazy';
      if (!grouped) setAv(im, m.av); else im.style.visibility = 'hidden';
      row.appendChild(im);
    }
    var col = el('div', 'gc-col');
    if (!grouped && !mine) { var nm = el('div', 'gc-name', m.u); if (m.v) nm.appendChild(badge()); col.appendChild(nm); }
    var b = el('div', 'gc-bub');
    if (m.q) {
      var q = el('div', 'gc-quote');
      if (m.q.gone) q.appendChild(el('i', null, 'Original message unavailable'));
      else { q.appendChild(el('b', null, m.q.u)); q.appendChild(el('span', null, m.q.x)); }
      if (m.p && !m.q.gone) q.addEventListener('click', function (e) { e.stopPropagation(); jump(m.p); });
      b.appendChild(q);
    }
    b.appendChild(el('div', 'gc-tx', m.x));
    var t = el('time', 'gc-time', m.pend ? 'Sending...' : hhmm(new Date(m.at))); t.setAttribute('datetime', m.at);
    b.appendChild(t);
    col.appendChild(b);
    if (m.re) {
      var rr = el('div', 'gc-reacts');
      REACTS.forEach(function (e) {
        if (!m.re[e]) return;
        var on = (MY[m.id] || []).indexOf(e) > -1;
        var c = el('button', 'gc-rc' + (on ? ' on' : '')); c.type = 'button';
        c.appendChild(el('span', null, e)); c.appendChild(el('b', null, String(m.re[e])));
        c.setAttribute('aria-label', e + ' ' + m.re[e] + (on ? ', you reacted' : ''));
        c.addEventListener('click', function (ev) { ev.stopPropagation(); react(m, e); });
        rr.appendChild(c);
      });
      col.appendChild(rr);
    }
    row.appendChild(col);
    if (!m.pend) {
      b.tabIndex = 0;
      // press and hold (phones) opens the reaction picker; a tap or click works too
      var lp = 0, held = false, sx = 0, sy = 0;
      var stopHold = function () { clearTimeout(lp); b.classList.remove('press'); };
      b.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse') return;
        held = false; sx = e.clientX; sy = e.clientY; b.classList.add('press');
        lp = setTimeout(function () {
          held = true; b.classList.remove('press');
          try { if (navigator.vibrate) navigator.vibrate(12); } catch (z) {}
          if (!(openActs && openActs.row === row)) toggleActs(row, m, mine);
          // swallow the click the finger lift makes, wherever it lands, so the menu stays open
          var swallow = function (ev) { ev.stopPropagation(); ev.preventDefault(); window.removeEventListener('click', swallow, true); };
          window.addEventListener('click', swallow, true);
          setTimeout(function () { window.removeEventListener('click', swallow, true); }, 1000);
        }, 420);
      });
      b.addEventListener('pointermove', function (e) { if (Math.abs(e.clientX - sx) > 10 || Math.abs(e.clientY - sy) > 10) stopHold(); });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) { b.addEventListener(t, stopHold); });
      b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleActs(row, m, mine);
      });
      b.addEventListener('keydown', function (e) { if (e.key === 'Enter') toggleActs(row, m, mine); });
    }
    return row;
  }
  function toggleActs(row, m, mine) {
    var had = openActs && openActs.row === row;
    closeActs();
    if (had || MODE !== 'open') return;
    var bar = el('div', 'gc-acts');
    REACTS.forEach(function (e) {
      var b = el('button', 'gc-emo' + ((MY[m.id] || []).indexOf(e) > -1 ? ' on' : ''), e); b.type = 'button'; b.setAttribute('aria-label', 'React ' + e);
      b.addEventListener('click', function (ev) { ev.stopPropagation(); closeActs(); react(m, e); });
      bar.appendChild(b);
    });
    var cpb = el('button', 'gc-act', 'Copy'); cpb.type = 'button';
    cpb.addEventListener('click', function (ev) {
      ev.stopPropagation();
      var done = function () { cpb.textContent = 'Copied'; setTimeout(closeActs, 700); };
      try { navigator.clipboard.writeText(m.x).then(done, done); } catch (z) { done(); }
    });
    bar.appendChild(cpb);
    var rp = el('button', 'gc-act', 'Reply'); rp.type = 'button';
    rp.addEventListener('click', function (ev) { ev.stopPropagation(); closeActs(); startReply(m); });
    bar.appendChild(rp);
    if (mine && MINE.indexOf(m.id) > -1) {
      var dl = el('button', 'gc-act del', 'Delete'); dl.type = 'button'; var armed = 0;
      dl.addEventListener('click', function (ev) {
        ev.stopPropagation();
        if (!armed) { armed = 1; dl.textContent = 'Tap again to delete'; return; }
        closeActs(); del(m);
      });
      bar.appendChild(dl);
    }
    row.querySelector('.gc-col').appendChild(bar);
    openActs = { row: row, bar: bar };
    var lr = list.getBoundingClientRect(), br = bar.getBoundingClientRect();
    if (br.bottom > lr.bottom - 6) list.scrollTop += br.bottom - lr.bottom + 12;
  }
  function closeActs() { if (openActs) { openActs.bar.remove(); openActs = null; } }
  document.addEventListener('click', closeActs);
  function jump(id) {
    var t = list.querySelector('[data-id="' + id + '"]');
    if (!t) return;
    t.scrollIntoView({ block: 'center', behavior: 'smooth' });
    t.classList.add('flash'); setTimeout(function () { t.classList.remove('flash'); }, 1400);
  }
  function render(force) {
    var sig = JSON.stringify([MSGS, MY, pending.length, ME && ME.name, BOARD, location.hash]);
    if (!force && sig === SIG) return;
    SIG = sig;
    if (BOARD) return renderBoard();
    var stick = nearBottom(), top = list.scrollTop, hadOpen = openActs ? openActs.row.dataset.id : '';
    closeActs();
    var all = MSGS.concat(pending);
    list.textContent = '';
    if (!all.length) { list.appendChild(el('p', 'gc-empty', 'No messages yet. Say something.')); return; }
    var lastDay = '', prev = null;
    all.forEach(function (m) {
      var d = new Date(m.at), day = d.toDateString();
      if (day !== lastDay) { list.appendChild(el('div', 'gc-day', dayLabel(d))); lastDay = day; prev = null; }
      var mine = isMine(m);
      var grouped = prev && prev.u === m.u && (d - new Date(prev.at)) < 5 * 60 * 1000 && !m.q;
      list.appendChild(bubble(m, grouped, mine));
      prev = m;
    });
    if (stick) toBottom(); else { list.scrollTop = top; if (all.length) $('c-new').hidden = false; }
    if (hadOpen) { var r = list.querySelector('[data-id="' + hadOpen + '"]'); if (r) r.querySelector('.gc-bub').click(); }
  }

  // ---- composer ----
  var ta = $('c-text');
  function cp(s) { return Array.from(s.replace(/\s+/g, ' ').trim()).length; }
  function grow() { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 140) + 'px'; }
  ta.addEventListener('input', function () {
    grow();
    var n = cp(ta.value), c = $('c-count');
    c.textContent = n > MAX - 40 ? String(MAX - n) : ''; c.classList.toggle('over', n > MAX);
    sset('gfa_a7_draft', ta.value);
  });
  var desktop = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
  ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && desktop) { e.preventDefault(); $('c-form').requestSubmit(); } });
  function startReply(m) {
    replyTo = m; $('c-replybar').hidden = false; $('c-replyto').textContent = 'Replying to ' + m.u; $('c-replytx').textContent = m.x;
    ta.focus();
  }
  function stopReply() { replyTo = null; $('c-replybar').hidden = true; }
  $('c-replyx').addEventListener('click', stopReply);
  // shared by both presentations: send one message (optionally a reply)
  function postText(box, parent, err, after) {
    err.textContent = '';
    var x = box.value.replace(/\s+/g, ' ').trim(), n = Array.from(x).length;
    if (!n) return false;
    if (n > MAX) { err.textContent = 'Messages are ' + MAX + ' characters or fewer.'; return false; }
    var tmp = { id: 'tmp' + Date.now(), at: new Date().toISOString(), u: ME.name, av: ME.av, x: x, pend: 1, v: ME.v ? 1 : 0 };
    var body = { a: 'post', text: x };
    if (parent) { body.parent = parent.id; tmp.p = parent.id; tmp.q = { u: parent.u, x: parent.x }; }
    pending.push(tmp); box.value = ''; box.dispatchEvent(new Event('input')); sdel('gfa_a7_draft');
    render(true); if (!BOARD) toBottom();
    send(body).then(function (d) {
      pending = pending.filter(function (p) { return p !== tmp; });
      if (!d.ok) {
        err.textContent = d.error || 'Not sent. Try again.';
        if (!box.value) { box.value = x; box.dispatchEvent(new Event('input')); }
        if (d.rules) { ME.rules = ''; saveMe(); screen(); }
        render(true); return;
      }
      if (d.id) { MINE.push(d.id); if (MINE.length > 2000) MINE = MINE.slice(-2000); sset('gfa_a7_mine', JSON.stringify(MINE)); }
      load(true).then(function () { if (after) after(); });
    }).catch(function () {
      pending = pending.filter(function (p) { return p !== tmp; });
      err.textContent = 'Not sent. Check your connection.'; if (!box.value) { box.value = x; box.dispatchEvent(new Event('input')); } render(true);
    });
    return true;
  }
  $('c-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (postText(ta, replyTo, $('c-err'), function () { if (!BOARD) toBottom(); })) stopReply();
  });
  function react(m, e) {
    var mine = MY[m.id] || (MY[m.id] = []), i = mine.indexOf(e), re = m.re || (m.re = {});
    if (i > -1) { mine.splice(i, 1); re[e] = (re[e] || 1) - 1; if (!re[e]) delete re[e]; } else { mine.push(e); re[e] = (re[e] || 0) + 1; }
    render(true);
    send({ a: 'react', pid: m.id, e: e }).then(function (d) { if (!d.ok) errEl().textContent = d.error || 'Try again.'; load(true); })
      .catch(function () { load(true); });
  }
  function del(m) {
    MSGS = MSGS.filter(function (x) { return x.id !== m.id; }); render(true);
    send({ a: 'del', pid: m.id }).then(function (d) {
      if (d.ok) { MINE = MINE.filter(function (x) { return x !== m.id; }); sset('gfa_a7_mine', JSON.stringify(MINE)); }
      else errEl().textContent = d.error || 'Try again.';
      load(true);
    }).catch(function () { load(true); });
  }

  // ---- desktop: the board (posts newest first; click a post to see its replies) ----
  var blist = $('b-list'), bta = $('b-text'), bOpen = '';
  function ago(iso) {
    var s = (Date.now() - new Date(iso)) / 1000;
    if (s < 60) return 'now'; if (s < 3600) return Math.floor(s / 60) + 'm'; if (s < 86400) return Math.floor(s / 3600) + 'h';
    var d = new Date(iso); return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
  }
  function threadId() { var m = /^#p=(P[A-F0-9]{11})$/.exec(location.hash); return m ? m[1] : ''; }
  window.addEventListener('hashchange', function () { if (BOARD) { bOpen = ''; render(true); window.scrollTo(0, 0); } });
  function card(m, kids, big) {
    var li = el('article', 'gb-post' + (big ? ' big' : '') + (m.pend ? ' pend' : '')); li.dataset.id = m.id;
    var im = document.createElement('img'); im.className = 'gb-av'; im.width = 46; im.height = 46; setAv(im, m.av); li.appendChild(im);
    var bd = el('div', 'gb-body');
    var hd = el('div', 'gb-head'), nm = el('b', null, m.u); hd.appendChild(nm); if (m.v) hd.appendChild(badge());
    var t = el('time', null, m.pend ? 'posting...' : ago(m.at)); t.setAttribute('datetime', m.at); t.title = new Date(m.at).toLocaleString(); hd.appendChild(t);
    bd.appendChild(hd);
    if (m.q && !big) {
      var rt = el('div', 'gb-rto'); rt.appendChild(document.createTextNode('Replying to '));
      rt.appendChild(el('span', null, m.q.gone ? 'a removed post' : m.q.u)); bd.appendChild(rt);
    }
    bd.appendChild(el('p', 'gb-tx', m.x));
    if (!m.pend) {
      var ac = el('div', 'gb-acts');
      var rb = el('button', 'gb-a', ''); rb.type = 'button'; rb.setAttribute('aria-label', 'Replies');
      rb.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M4 5h16v11H9l-5 4z"/></svg>';
      rb.appendChild(el('span', null, kids ? String(kids) : ''));
      rb.addEventListener('click', function (e) { e.stopPropagation(); location.hash = 'p=' + m.id; });
      ac.appendChild(rb);
      REACTS.forEach(function (em) {
        if (!m.re || !m.re[em]) return;
        var on = (MY[m.id] || []).indexOf(em) > -1;
        var c = el('button', 'gc-rc' + (on ? ' on' : '')); c.type = 'button';
        c.appendChild(el('span', null, em)); c.appendChild(el('b', null, String(m.re[em])));
        c.addEventListener('click', function (e) { e.stopPropagation(); react(m, em); });
        ac.appendChild(c);
      });
      if (MODE === 'open') {
        var add = el('button', 'gb-a gb-add', '+'); add.type = 'button'; add.title = 'React'; add.setAttribute('aria-label', 'Add a reaction');
        add.addEventListener('click', function (e) { e.stopPropagation(); bOpen = bOpen === m.id ? '' : m.id; render(true); });
        ac.appendChild(add);
      }
      if (isMine(m) && MINE.indexOf(m.id) > -1) {
        var dl = el('button', 'gb-a gb-del', 'Delete'); dl.type = 'button'; var armed = 0;
        dl.addEventListener('click', function (e) {
          e.stopPropagation();
          if (!armed) { armed = 1; dl.textContent = 'Click again to delete'; return; }
          if (threadId() === m.id) location.hash = m.p ? 'p=' + m.p : '';
          del(m);
        });
        ac.appendChild(dl);
      }
      bd.appendChild(ac);
      if (bOpen === m.id) {
        var pk = el('div', 'gb-pick');
        REACTS.forEach(function (em) {
          var b = el('button', 'gc-emo' + ((MY[m.id] || []).indexOf(em) > -1 ? ' on' : ''), em); b.type = 'button';
          b.addEventListener('click', function (e) { e.stopPropagation(); bOpen = ''; react(m, em); });
          pk.appendChild(b);
        });
        bd.appendChild(pk);
      }
      if (!big) { li.tabIndex = 0; li.addEventListener('click', function () { location.hash = 'p=' + m.id; });
        li.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target === li) location.hash = 'p=' + m.id; }); }
    }
    li.appendChild(bd);
    return li;
  }
  function renderBoard() {
    var all = MSGS.concat(pending), byId = {}, kids = {};
    all.forEach(function (m) { byId[m.id] = m; if (m.p) kids[m.p] = (kids[m.p] || 0) + 1; });
    var tid = threadId(), focus = $('b-focus');
    blist.textContent = ''; focus.textContent = '';
    $('b-back').hidden = !tid;
    if (tid) {
      var m = byId[tid];
      if (!m) { focus.appendChild(el('p', 'gc-empty', 'This post is gone, or it is too old to show here.')); $('b-form').hidden = true; return; }
      if (m.p) {
        var par = byId[m.p];
        if (par) { var pc = card(par, kids[par.id]); pc.classList.add('parent'); focus.appendChild(pc); }
        else focus.appendChild(el('p', 'gb-rto', 'Replying to a post that is no longer shown.'));
      }
      focus.appendChild(card(m, kids[m.id], true));
      $('b-form').hidden = MODE !== 'open'; bta.placeholder = 'Post your reply'; $('b-send').textContent = 'Reply';
      var reps = all.filter(function (x) { return x.p === tid; });
      if (!reps.length) blist.appendChild(el('p', 'gc-empty', 'No replies yet.'));
      reps.forEach(function (x) { blist.appendChild(card(x, kids[x.id])); });
    } else {
      $('b-form').hidden = MODE !== 'open'; bta.placeholder = "What's happening?"; $('b-send').textContent = 'Post';
      var tops = all.filter(function (x) { return !x.p; }).reverse();
      if (!tops.length) blist.appendChild(el('p', 'gc-empty', 'No posts yet. Say something.'));
      tops.forEach(function (x) { blist.appendChild(card(x, kids[x.id])); });
    }
  }
  var navs = 0;
  window.addEventListener('hashchange', function () { navs = threadId() ? navs + 1 : 0; });
  $('b-back').addEventListener('click', function () { if (navs > 0) history.back(); else location.hash = ''; });
  document.addEventListener('click', function (e) { if (bOpen && !e.target.closest('.gb-pick')) { bOpen = ''; if (BOARD) render(true); } });
  bta.addEventListener('input', function () {
    bta.style.height = 'auto'; bta.style.height = Math.min(bta.scrollHeight, 220) + 'px';
    var n = cp(bta.value), c = $('b-count'); c.textContent = n ? String(MAX - n) : ''; c.classList.toggle('over', n > MAX);
  });
  bta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); $('b-form').requestSubmit(); } });
  $('b-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var tid = threadId(), par = null;
    if (tid) MSGS.concat(pending).forEach(function (m) { if (m.id === tid) par = m; });
    postText(bta, par, $('b-err'));
  });

  // ---- loading ----
  var loading = null, timer = 0;
  function load(force) {
    if (!ME) return Promise.resolve();
    if (loading && !force) return loading;
    loading = fetch(API, { method: 'POST', body: JSON.stringify({ a: 'feed', id: ID }) }).then(function (r) { return r.json(); }).then(function (d) {
      if (d.mode) setMode(d.mode);
      if (d.members) {   // this browser is not a member (or was signed out): back to the gate
        ME = null; ['gfa_fsp_me', 'gfa_a7_mine'].forEach(sdel); MINE = []; screen(); return;
      }
      if (d.ok && d.me) { ME = meFrom(d.me); saveMe(); screen(); }
      if (d.ok) { MSGS = d.msgs || []; MY = d.my || {}; render(); }
    }).catch(function () { if (!MSGS.length && !BOARD) { list.textContent = ''; list.appendChild(el('p', 'gc-empty', 'Could not load the chat. Retrying...')); } })
      .finally(function () { loading = null; });
    return loading;
  }
  function start() {
    if (!ME || !ME.hasPw || ME.rules !== RULES) return;
    var dr = sget('gfa_a7_draft'); if (dr && !ta.value) { ta.value = dr; grow(); }
    load(true).then(toBottom);
    clearInterval(timer);
    timer = setInterval(function () { if (!document.hidden) load(); }, POLL);
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden && ME) load(); });

  // ---- phone fit: keep the chat exactly the size of the visible screen, keyboard included ----
  (function () {
    var vp = window.visualViewport, root = document.documentElement, chat = $('chat');
    function fit() {
      var h = vp ? vp.height : window.innerHeight, top = vp ? vp.offsetTop : 0;
      root.style.setProperty('--gc-vh', Math.round(h) + 'px');
      root.style.setProperty('--gc-kbpad', '0px');
      root.classList.toggle('gc-kb', !!vp && window.innerHeight - h > 120);
      if (window.matchMedia('(max-width:899px)').matches) chat.style.transform = top ? 'translateY(' + Math.round(top) + 'px)' : '';
      else chat.style.transform = '';
      if (stuck) list.scrollTop = list.scrollHeight;
    }
    var stuck = true;
    list.addEventListener('scroll', function () { stuck = nearBottom(); }, { passive: true });
    if (vp) { vp.addEventListener('resize', fit); vp.addEventListener('scroll', fit); }
    window.addEventListener('resize', fit); window.addEventListener('orientationchange', function () { setTimeout(fit, 250); });
    ta.addEventListener('focus', function () { setTimeout(fit, 60); setTimeout(fit, 350); });
    ta.addEventListener('blur', function () { setTimeout(fit, 120); });
    fit();
  })();

  screen();
  getTicket().catch(function () {});
  if (ME) { load(true).then(function () { screen(); start(); }); }
})();
