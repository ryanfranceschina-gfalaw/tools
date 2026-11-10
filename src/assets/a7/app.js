/* a7: page script. All user text is set with textContent, never parsed as HTML or links. */
(function () {
  'use strict';
  var API = 'https://script.google.com/macros/s/AKfycbx7QdvF6l8zROPvs_mUMLNjsfdeWccA5raj18UgX2HFuCvBD_RLukyVZxk2RUOzCkxTmw/exec';
  var RULES = '2026-11-10b';
  var MAX = 280, MAXR = 100;
  var me = document.currentScript;
  var BASE = me ? me.src.replace(/assets\/a7\/app\.js.*$/, '') : '/';
  var FOUNDERS = [['washington', 'George Washington'], ['franklin', 'Benjamin Franklin'], ['jefferson', 'Thomas Jefferson'],
    ['adams', 'John Adams'], ['hamilton', 'Alexander Hamilton'], ['jay', 'John Jay'], ['madison', 'James Madison']];
  var ICONS = [['bell', 'Liberty Bell'], ['gavel', 'Gavel'], ['quill', 'Quill'], ['scales', 'Scales'], ['star', 'Lone Star'],
    ['torch', 'Torch'], ['scroll', 'Scroll'], ['megaphone', 'Megaphone'], ['shield', 'Shield'], ['key', 'Key'], ['anchor', 'Anchor'],
    ['compass', 'Compass'], ['crown', 'Crown'], ['horseshoe', 'Horseshoe'], ['mountain', 'Mountain'], ['sun', 'Sun'], ['moon', 'Moon'],
    ['bolt', 'Lightning'], ['book', 'Book'], ['mug', 'Coffee'], ['hat', 'Cowboy Hat'], ['tree', 'Pine'], ['rocket', 'Rocket'],
    ['dice', 'Dice'], ['note', 'Music'], ['heart', 'Heart'], ['globe', 'Globe'], ['flag', 'Flag'], ['lighthouse', 'Lighthouse'],
    ['flame', 'Flame'], ['cactus', 'Cactus'], ['hourglass', 'Hourglass'], ['rook', 'Rook'], ['paw', 'Paw'], ['fish', 'Fish'],
    ['owl', 'Owl'], ['longhorn', 'Longhorn'], ['lantern', 'Lantern']];
  var COLORS = [['green', '#1a331c'], ['navy', '#16243f'], ['maroon', '#3d1418'], ['slate', '#2b3036'], ['black', '#0f0f10'], ['teal', '#14403f']];
  var avMap = {}, colMap = {};
  FOUNDERS.forEach(function (a) { avMap[a[0]] = [a[1], 'img/founders/' + a[0] + '.jpg', 1]; });
  ICONS.forEach(function (a) { avMap[a[0]] = [a[1], 'a7/av/' + a[0] + '.svg', 0]; });
  COLORS.forEach(function (c) { colMap[c[0]] = c[1]; });
  function avParse(k) {
    var p = String(k || '').split('.'), a = avMap[p[0]];
    if (!a || p.length > 2 || (p[1] && !colMap[p[1]]) || (a[2] && p[1])) return { a: avMap.star, bg: colMap.green };
    return { a: a, bg: a[2] ? '' : colMap[p[1] || 'green'] };
  }
  function setAv(img, k) { var v = avParse(k); img.src = BASE + 'assets/' + v.a[1]; img.style.backgroundColor = v.bg; }
  var T0 = Date.now();
  var $ = function (id) { return document.getElementById(id); };

  // ---- storage (falls back to memory) ----
  var mem = {};
  function sget(k) { try { var v = localStorage.getItem(k); return v === null ? mem[k] : v; } catch (e) { return mem[k]; } }
  function sset(k, v) { mem[k] = v; try { localStorage.setItem(k, v); } catch (e) {} }
  function jget(k, d) { try { return JSON.parse(sget(k) || '') || d; } catch (e) { return d; } }

  if (!sget('gfa_a7')) { $('fsp-lock').hidden = false; return; }
  $('fsp-app').hidden = false;

  var ID = sget('gfa_fsp_id');
  if (!/^[a-f0-9]{32}$/.test(ID || '')) {
    var b = new Uint8Array(16); (window.crypto || window.msCrypto).getRandomValues(b);
    ID = Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    sset('gfa_fsp_id', ID);
  }
  var ME = jget('gfa_fsp_me', null);
  var VOTES = jget('gfa_fsp_votes', {});
  var MINE = jget('gfa_a7_mine', []);
  var MODE = 'open';

  function avAlt(k) { return avParse(k).a[0]; }

  // ---- SHA-256 (sync, for the small proof of work) ----
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
  function send(body, tries) {
    tries = tries || 0;
    return freshTicket().then(function (tk) {
      var age = Date.now() - tk.at, el = Date.now() - T0;
      var need = Math.max(4600 - age, 4600 - el, 0);
      return wait(need).then(function () {
        TK = null;
        body.id = ID; body.t = tk.t; body.pow = tk.pow; body.el = Date.now() - T0; body.website = $('fsp-site').value;
        return fetch(API, { method: 'POST', body: JSON.stringify(body) }).then(function (r) { return r.json(); });
      });
    }).then(function (d) {
      getTicket().catch(function () {});
      if (!d.ok && d.retry && tries < 1) return wait(800).then(function () { return send(body, tries + 1); });
      return d;
    });
  }

  // ---- mode ----
  function setMode(m) {
    MODE = m;
    var note = $('fsp-mode');
    if (m === 'open') { note.hidden = true; }
    else { note.hidden = false; note.textContent = m === 'readonly' ? 'Posting and voting are paused right now. You can still read.' : 'The platform is closed right now. Check back later.'; }
    showForms();
  }
  function showForms() {
    var open = MODE === 'open';
    $('fsp-join').hidden = !open || loginMode || (!!ME && ME.rules === RULES && !editing);
    $('fsp-login').hidden = !open || !loginMode || !!ME;
    $('fsp-pwform').hidden = !open || !pwMode || !ME;
    $('fsp-compose').hidden = !open || !ME || ME.rules !== RULES || editing || pwMode;
    $('fsp-pwwrap').hidden = !!ME; $('fsp-tologin-wrap').hidden = !!ME;
    $('fsp-setpw').textContent = ME && ME.hasPw ? 'Change password' : 'Set password';
    if (ME && !$('fsp-name').value) {
      $('fsp-name').value = ME.name; $('fsp-name').disabled = true;
      if (!pick) setPick(ME.av);
    }
    if (ME) { setAv($('fsp-meav'), ME.av); $('fsp-meav').alt = avAlt(ME.av); $('fsp-mename').textContent = ME.name; if (ME.v) $('fsp-mename').appendChild(badge()); }
  }

  // ---- join ----
  var pick = '', editing = false, loginMode = false, pwMode = false;
  var grid = $('fsp-avgrid'), pcol = 'green';
  function mark() {
    grid.querySelectorAll('.fsp-av').forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.k === pick)); });
    $('fsp-cols').querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.c === pcol)); });
  }
  function avBtn(k, label) {
    var bt = document.createElement('button'); bt.type = 'button'; bt.className = 'fsp-av'; bt.dataset.k = k; bt.dataset.base = k.split('.')[0];
    bt.setAttribute('aria-pressed', 'false'); bt.title = label;
    var im = document.createElement('img'); setAv(im, k); im.alt = label; im.width = 64; im.height = 64; im.loading = 'lazy';
    bt.appendChild(im);
    bt.addEventListener('click', function () { pick = bt.dataset.k; mark(); });
    return bt;
  }
  function paintIcons() {
    grid.querySelectorAll('.fsp-av.icon').forEach(function (bt) {
      var k = bt.dataset.base + (pcol === 'green' ? '' : '.' + pcol);
      if (pick && pick.split('.')[0] === bt.dataset.base) pick = k;
      bt.dataset.k = k; setAv(bt.firstChild, k);
    });
    mark();
  }
  grid.appendChild(el('p', 'fsp-avh', 'Founders'));
  FOUNDERS.forEach(function (a) { grid.appendChild(avBtn(a[0], a[1])); });
  var ch = el('div', 'fsp-avh'); ch.appendChild(el('span', null, 'Icons'));
  var cols = el('span', 'fsp-cols'); cols.id = 'fsp-cols';
  COLORS.forEach(function (c) {
    var b = el('button', 'fsp-col'); b.type = 'button'; b.dataset.c = c[0]; b.title = c[0]; b.setAttribute('aria-label', c[0] + ' background');
    b.style.backgroundColor = c[1]; b.addEventListener('click', function () { pcol = c[0]; paintIcons(); });
    cols.appendChild(b);
  });
  ch.appendChild(cols); grid.appendChild(ch);
  ICONS.forEach(function (a) { var bt = avBtn(a[0], a[1]); bt.classList.add('icon'); grid.appendChild(bt); });
  function setPick(k) {
    pick = k; var p = String(k || '').split('.');
    if (avMap[p[0]] && !avMap[p[0]][2]) { pcol = p[1] || 'green'; paintIcons(); } else mark();
  }
  $('fsp-edit').addEventListener('click', function () {
    editing = true; $('fsp-name').value = ME.name; $('fsp-name').disabled = true; setPick(ME.av);
    showForms();
  });
  $('fsp-join').addEventListener('submit', function (e) {
    e.preventDefault();
    var err = $('fsp-jerr'); err.textContent = '';
    var name = $('fsp-name').value.trim();
    if (!ME && !/^[A-Za-z0-9][A-Za-z0-9 _.\-]{1,18}[A-Za-z0-9]$/.test(name)) { err.textContent = 'Usernames are 3 to 20 letters, numbers, spaces, dots, dashes or underscores.'; return; }
    if (!pick) { err.textContent = 'Pick a profile picture.'; return; }
    if (!$('fsp-adult').checked || !$('fsp-secret').checked || !$('fsp-agree').checked) { err.textContent = 'Check all three boxes to join: 18 or older, keep the secret, and The Only Rule.'; return; }
    var btn = $('fsp-jbtn'); btn.disabled = true; btn.textContent = 'Joining...';
    var pw = ME ? '' : $('fsp-pw').value;
    if (pw && (pw.length < 8 || pw.length > 100)) { err.textContent = 'Passwords are 8 to 100 characters.'; return; }
    send({ a: 'join', name: name, av: pick, adult: true, secret: true, rules: RULES, pw: pw || undefined, claim: $('fsp-claimwrap').hidden ? undefined : $('fsp-claim').value.trim() }).then(function (d) {
      if (!d.ok || !d.user) { err.textContent = d.error || 'Please try again.'; if (d.claim) { $('fsp-claimwrap').hidden = false; $('fsp-claim').focus(); } return; }
      ME = { name: d.user.name, av: d.user.av, rules: d.user.rules, hasPw: !!d.user.hasPw, v: !!d.user.v };
      sset('gfa_fsp_me', JSON.stringify(ME)); editing = false; $('fsp-claimwrap').hidden = true; $('fsp-name').disabled = false;
      showForms(); load();
    }).catch(function () { err.textContent = 'Could not reach the platform. Try again.'; })
      .finally(function () { btn.disabled = false; btn.textContent = 'Join'; });
  });

  // ---- sign in, password, sign out ----
  $('fsp-tologin').addEventListener('click', function () { loginMode = true; showForms(); $('fsp-lname').focus(); });
  $('fsp-tojoin').addEventListener('click', function () { loginMode = false; showForms(); });
  $('fsp-login').addEventListener('submit', function (e) {
    e.preventDefault();
    var err = $('fsp-lerr'), btn = $('fsp-lbtn'); err.textContent = '';
    var nm = $('fsp-lname').value.trim(), pw = $('fsp-lpw').value;
    if (!nm || pw.length < 8) { err.textContent = 'Wrong username or password.'; return; }
    btn.disabled = true; btn.textContent = 'Signing in...';
    send({ a: 'login', name: nm, pw: pw }).then(function (d) {
      if (!d.ok || !d.user) { err.textContent = d.error || 'Please try again.'; return; }
      ME = { name: d.user.name, av: d.user.av, rules: d.user.rules, hasPw: !!d.user.hasPw, v: !!d.user.v };
      sset('gfa_fsp_me', JSON.stringify(ME));
      MINE = d.mine || []; sset('gfa_a7_mine', JSON.stringify(MINE));
      VOTES = d.votes || {}; sset('gfa_fsp_votes', JSON.stringify(VOTES));
      $('fsp-lpw').value = ''; loginMode = false;
      $('fsp-name').value = ''; showForms(); load();
    }).catch(function () { err.textContent = 'Could not reach the platform. Try again.'; })
      .finally(function () { btn.disabled = false; btn.textContent = 'Sign in'; });
  });
  $('fsp-setpw').addEventListener('click', function () {
    pwMode = true; $('fsp-pwtitle').textContent = ME.hasPw ? 'Change your password' : 'Set a password';
    $('fsp-oldwrap').hidden = !ME.hasPw; showForms(); $(ME.hasPw ? 'fsp-old' : 'fsp-new').focus();
  });
  $('fsp-pwcancel').addEventListener('click', function () { pwMode = false; $('fsp-old').value = ''; $('fsp-new').value = ''; showForms(); });
  $('fsp-pwform').addEventListener('submit', function (e) {
    e.preventDefault();
    var err = $('fsp-pwerr'), btn = $('fsp-pwbtn'); err.textContent = '';
    var nw = $('fsp-new').value;
    if (nw.length < 8 || nw.length > 100) { err.textContent = 'Passwords are 8 to 100 characters.'; return; }
    btn.disabled = true; btn.textContent = 'Saving...';
    send({ a: 'setpw', old: $('fsp-old').value, pw: nw }).then(function (d) {
      if (!d.ok || !d.user) { err.textContent = d.error || 'Please try again.'; return; }
      ME.hasPw = true; sset('gfa_fsp_me', JSON.stringify(ME));
      $('fsp-old').value = ''; $('fsp-new').value = ''; pwMode = false; showForms();
    }).catch(function () { err.textContent = 'Could not reach the platform. Try again.'; })
      .finally(function () { btn.disabled = false; btn.textContent = 'Save password'; });
  });
  var outArmed = 0;
  $('fsp-out').addEventListener('click', function () {
    var b = $('fsp-out');
    if (!outArmed) {
      b.textContent = ME && ME.hasPw ? 'Tap again to sign out' : 'No password set: tap again and this username is gone for good';
      outArmed = setTimeout(function () { outArmed = 0; b.textContent = 'Sign out'; }, 5000); return;
    }
    clearTimeout(outArmed);
    ['gfa_fsp_id', 'gfa_fsp_me', 'gfa_a7_mine', 'gfa_fsp_votes'].forEach(function (k) { mem[k] = null; try { localStorage.removeItem(k); } catch (x) {} });
    location.hash = ''; location.reload();
  });

  // ---- compose ----
  function cp(s) { return Array.from(s.replace(/\s+/g, ' ').trim()).length; }
  $('fsp-text').addEventListener('input', function () {
    var n = cp(this.value), c = $('fsp-count');
    c.textContent = String(MAX - n); c.classList.toggle('over', n > MAX);
  });
  $('fsp-text').addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('fsp-compose').requestSubmit(); } });
  $('fsp-compose').addEventListener('submit', function (e) {
    e.preventDefault();
    var err = $('fsp-perr'); err.textContent = '';
    var x = $('fsp-text').value.replace(/\s+/g, ' ').trim(), n = Array.from(x).length;
    if (!n) { err.textContent = 'Write something first.'; return; }
    if (n > MAX) { err.textContent = 'Posts are ' + MAX + ' characters or fewer.'; return; }
    var btn = $('fsp-pbtn'); btn.disabled = true; btn.textContent = 'Posting...';
    send({ a: 'post', text: x }).then(function (d) {
      if (!d.ok) {
        err.textContent = d.error || 'Please try again.';
        if (d.rules) { ME.rules = ''; sset('gfa_fsp_me', JSON.stringify(ME)); showForms(); }
        return;
      }
      if (d.id) { MINE.push(d.id); if (MINE.length > 500) MINE = MINE.slice(-500); sset('gfa_a7_mine', JSON.stringify(MINE)); }
      $('fsp-text').value = ''; $('fsp-count').textContent = String(MAX);
      load();
    }).catch(function () { err.textContent = 'Could not reach the platform. Try again.'; })
      .finally(function () { btn.disabled = false; btn.textContent = 'Post'; });
  });

  // ---- feed ----
  function ago(iso) {
    var s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + 'm';
    if (s < 86400) return Math.floor(s / 3600) + 'h'; if (s < 604800) return Math.floor(s / 86400) + 'd';
    return new Date(iso).toLocaleDateString();
  }
  function el(tag, cls, txt) { var x = document.createElement(tag); if (cls) x.className = cls; if (txt != null) x.textContent = txt; return x; }
  function voteBtn(p, v) {
    var bt = el('button', 'fsp-vote ' + (v > 0 ? 'up' : 'dn')); bt.type = 'button';
    var mine = VOTES[p.id];
    bt.setAttribute('aria-pressed', String(mine === v));
    bt.setAttribute('aria-label', (v > 0 ? 'Thumbs up' : 'Thumbs down') + ', ' + (v > 0 ? p.up : p.dn));
    bt.appendChild(el('span', 'ic', v > 0 ? '👍' : '👎'));
    var n = el('span', 'n', String(v > 0 ? p.up : p.dn)); bt.appendChild(n);
    bt.disabled = !!mine || MODE !== 'open';
    bt.addEventListener('click', function () {
      if (!ME || ME.rules !== RULES) { $('fsp-join').scrollIntoView({ behavior: 'smooth' }); return; }
      if (VOTES[p.id]) return;
      VOTES[p.id] = v; sset('gfa_fsp_votes', JSON.stringify(VOTES));
      n.textContent = String(Number(n.textContent) + 1); bt.setAttribute('aria-pressed', 'true');
      bt.parentNode.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
      send({ a: 'vote', pid: p.id, v: v }).then(function (d) {
        if (!d.ok && !d.voted) { delete VOTES[p.id]; sset('gfa_fsp_votes', JSON.stringify(VOTES)); load(); }
      }).catch(function () { delete VOTES[p.id]; sset('gfa_fsp_votes', JSON.stringify(VOTES)); load(); });
    });
    return bt;
  }
  function delBtn(p, li) {
    var bt = el('button', 'fsp-del', 'Delete'); bt.type = 'button';
    var armed = 0;
    bt.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!armed) { armed = setTimeout(function () { armed = 0; bt.textContent = 'Delete'; bt.classList.remove('arm'); }, 4000); bt.textContent = 'Tap again to delete'; bt.classList.add('arm'); return; }
      clearTimeout(armed); bt.disabled = true; bt.textContent = 'Deleting...';
      send({ a: 'del', pid: p.id }).then(function (d) {
        if (d.ok) { li.parentNode && li.parentNode.removeChild(li); MINE = MINE.filter(function (x) { return x !== p.id; }); sset('gfa_a7_mine', JSON.stringify(MINE)); if (curId() === p.id) location.hash = ''; load(); }
        else { bt.disabled = false; armed = 0; bt.classList.remove('arm'); bt.textContent = d.error || 'Try again'; }
      }).catch(function () { bt.disabled = false; armed = 0; bt.classList.remove('arm'); bt.textContent = 'Try again'; });
    });
    return bt;
  }
  // ---- data and views (X style: tap a post to open it with its replies) ----
  var DATA = { posts: [], byId: {}, kids: {} };
  var DRAFTS = {};
  function index(d) {
    var byId = {}, kids = {};
    (d.posts || []).forEach(function (p) { byId[p.id] = p; });
    (d.replies || []).forEach(function (r) { byId[r.id] = r; (kids[r.p] = kids[r.p] || []).push(r); });
    Object.keys(kids).forEach(function (k) { kids[k].sort(function (a, b) { return a.at < b.at ? -1 : 1; }); });
    DATA = { posts: d.posts || [], byId: byId, kids: kids };
  }
  function nKids(id) { return (DATA.kids[id] || []).length; }
  function curId() { var m = /^#p=(P[A-F0-9]{11})$/.exec(location.hash); return m ? m[1] : ''; }
  function open(id, focus) {
    if (curId() === id) { draw(focus); return; }
    pendingFocus = !!focus; location.hash = 'p=' + id;
  }
  var pendingFocus = false;
  window.addEventListener('hashchange', function () { draw(pendingFocus); pendingFocus = false; window.scrollTo(0, $('fsp').offsetTop - 80); });

  function replyBtn(p) {
    var bt = el('button', 'fsp-rep'); bt.type = 'button';
    bt.setAttribute('aria-label', 'Reply, ' + nKids(p.id) + ' replies');
    bt.appendChild(el('span', 'ic', '💬'));
    bt.appendChild(el('span', 'n', String(nKids(p.id) || '')));
    bt.addEventListener('click', function (e) { e.stopPropagation(); open(p.id, true); });
    return bt;
  }
  function badge() {
    var b = el('span', 'fsp-ver'); b.title = 'Verified'; b.setAttribute('aria-label', 'Verified');
    b.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path fill="#C9A54B" d="M12 1.5l2.6 2.1 3.3-.4 1 3.2 2.9 1.6-.7 3.3 1.8 2.8-2.4 2.3-.2 3.3-3.3.6L14.9 23 12 21.4 9.1 23l-2-2.6-3.3-.6-.2-3.3-2.4-2.3 1.8-2.8-.7-3.3 2.9-1.6 1-3.2 3.3.4z"/><path d="M7.5 12.3l3 3 6-6.2" fill="none" stroke="#0d1a11" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    return b;
  }
  function card(p, opts) {
    opts = opts || {};
    var li = el(opts.tag || 'li', 'fsp-post' + (opts.cls ? ' ' + opts.cls : ''));
    var im = document.createElement('img'); setAv(im, p.av); im.alt = ''; im.width = 44; im.height = 44; im.loading = 'lazy'; im.className = 'fsp-pav';
    li.appendChild(im);
    var bd = el('div', 'fsp-pb');
    var hd = el('div', 'fsp-ph'); hd.appendChild(el('b', null, p.u)); if (p.v) hd.appendChild(badge()); hd.appendChild(el('time', null, ago(p.at)));
    hd.lastChild.setAttribute('datetime', p.at);
    bd.appendChild(hd);
    if (opts.replyTo) bd.appendChild(el('div', 'fsp-rto', 'Replying to ' + opts.replyTo));
    bd.appendChild(el('p', 'fsp-tx', p.x));
    var vb = el('div', 'fsp-vb');
    vb.appendChild(replyBtn(p)); vb.appendChild(voteBtn(p, 1)); vb.appendChild(voteBtn(p, -1));
    if (MINE.indexOf(p.id) > -1 && MODE === 'open') vb.appendChild(delBtn(p, li));
    vb.addEventListener('click', function (e) { e.stopPropagation(); });
    bd.appendChild(vb); li.appendChild(bd);
    if (!opts.focus) {
      li.classList.add('tap'); li.tabIndex = 0; li.setAttribute('role', 'link');
      li.addEventListener('click', function () { open(p.id); });
      li.addEventListener('keydown', function (e) { if (e.key === 'Enter') open(p.id); });
    }
    return li;
  }
  function replyBox(p) {
    var f = el('form', 'fsp-card fsp-compose fsp-rbox'); f.noValidate = true;
    var lab = el('div', 'fsp-rto', 'Replying to ' + p.u);
    var ta = el('textarea'); ta.rows = 2; ta.maxLength = 160; ta.placeholder = 'Post your reply'; ta.setAttribute('aria-label', 'Your reply');
    ta.value = DRAFTS[p.id] || '';
    var row = el('div', 'fsp-row'), cnt = el('span', 'fsp-count', String(MAXR - cp(ta.value)));
    var bt = el('button', 'btn sm', 'Reply'); bt.type = 'submit';
    var err = el('p', 'fsp-err'); err.setAttribute('role', 'alert');
    row.appendChild(cnt); row.appendChild(bt);
    f.appendChild(lab); f.appendChild(ta); f.appendChild(row); f.appendChild(err);
    ta.addEventListener('input', function () { DRAFTS[p.id] = ta.value; var n = cp(ta.value); cnt.textContent = String(MAXR - n); cnt.classList.toggle('over', n > MAXR); });
    ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); f.requestSubmit(); } });
    f.addEventListener('submit', function (e) {
      e.preventDefault(); err.textContent = '';
      var x = ta.value.replace(/\s+/g, ' ').trim(), n = Array.from(x).length;
      if (!n) { err.textContent = 'Write something first.'; return; }
      if (n > MAXR) { err.textContent = 'Replies are ' + MAXR + ' characters or fewer.'; return; }
      bt.disabled = true; bt.textContent = 'Replying...';
      send({ a: 'post', text: x, parent: p.id }).then(function (d) {
        if (!d.ok) {
          err.textContent = d.error || 'Please try again.';
          if (d.rules) { ME.rules = ''; sset('gfa_fsp_me', JSON.stringify(ME)); location.hash = ''; showForms(); }
          return;
        }
        if (d.id) { MINE.push(d.id); if (MINE.length > 500) MINE = MINE.slice(-500); sset('gfa_a7_mine', JSON.stringify(MINE)); }
        delete DRAFTS[p.id]; load();
      }).catch(function () { err.textContent = 'Could not reach the platform. Try again.'; })
        .finally(function () { bt.disabled = false; bt.textContent = 'Reply'; });
    });
    return f;
  }
  function draw(focus) {
    var id = curId(), det = $('fsp-detail'), feedOn = !id;
    $('fsp-feed').hidden = !feedOn; $('fsp-headrow').hidden = !feedOn;
    showForms(); if (!feedOn) $('fsp-compose').hidden = true;
    det.hidden = feedOn; det.textContent = '';
    if (feedOn) {
      var ol = $('fsp-feed'); ol.textContent = '';
      if (!DATA.posts.length) { ol.appendChild(el('li', 'fsp-empty', 'Nothing here yet. Be the first.')); return; }
      DATA.posts.forEach(function (p) { ol.appendChild(card(p)); });
      return;
    }
    var back = el('button', 'fsp-back', '← Back'); back.type = 'button';
    back.addEventListener('click', function () { if (history.length > 1) history.back(); else location.hash = ''; });
    det.appendChild(back);
    var p = DATA.byId[id];
    if (!p) { det.appendChild(el('p', 'fsp-empty', 'This post is unavailable. It may have been deleted.')); return; }
    var chain = [], c = p;
    while (c && c.p && DATA.byId[c.p]) { c = DATA.byId[c.p]; chain.unshift(c); }
    var th = el('ol', 'fsp-feed fsp-thread');
    chain.forEach(function (a, i) { th.appendChild(card(a, { cls: 'anc', replyTo: i ? chain[i - 1].u : '' })); });
    var parentName = chain.length ? chain[chain.length - 1].u : '';
    th.appendChild(card(p, { cls: 'focus', focus: true, replyTo: parentName }));
    det.appendChild(th);
    var canPost = MODE === 'open' && ME && ME.rules === RULES;
    if (canPost) det.appendChild(replyBox(p));
    else if (MODE === 'open') { var j = el('p', 'fsp-note', 'Join above to reply.'); det.appendChild(j); }
    var ks = DATA.kids[id] || [];
    var rl = el('ol', 'fsp-feed fsp-replies');
    if (!ks.length) rl.appendChild(el('li', 'fsp-empty', 'No replies yet.'));
    ks.forEach(function (r) { rl.appendChild(card(r, { replyTo: p.u })); });
    det.appendChild(rl);
    if (focus && canPost) { var t = det.querySelector('.fsp-rbox textarea'); if (t) t.focus(); }
  }
  function walls() {
    var inside = !!ME;
    $('fsp-board').hidden = !inside;
  }
  function load() {
    walls();
    if (!ME) return Promise.resolve();
    return fetch(API, { method: 'POST', body: JSON.stringify({ a: 'feed', id: ID }) }).then(function (r) { return r.json(); }).then(function (d) {
      if (d.mode) setMode(d.mode);
      if (d.members) {   // this browser is not a member (or was signed out elsewhere): back to the gate
        ME = null; ['gfa_fsp_me', 'gfa_a7_mine', 'gfa_fsp_votes'].forEach(function (k) { mem[k] = null; try { localStorage.removeItem(k); } catch (x) {} });
        MINE = []; VOTES = {}; $('fsp-name').value = ''; $('fsp-name').disabled = false; showForms(); walls(); return;
      }
      if (d.ok && d.me) { ME = { name: d.me.name, av: d.me.av, rules: d.me.rules, hasPw: !!d.me.hasPw, v: !!d.me.v }; sset('gfa_fsp_me', JSON.stringify(ME)); }
      if (d.ok) { index(d); draw(); }
    }).catch(function () {
      var ol = $('fsp-feed'); ol.textContent = ''; ol.appendChild(el('li', 'fsp-empty', 'Could not load posts. Try Refresh.'));
    });
  }
  $('fsp-refresh').addEventListener('click', load);

  if (API.indexOf('https://') !== 0) {
    $('fsp-feed').textContent = ''; $('fsp-feed').appendChild(el('li', 'fsp-empty', 'Coming soon.'));
    $('fsp-join').hidden = true; return;
  }
  showForms(); load(); getTicket().catch(function () {});
  setInterval(function () { var a = document.activeElement; if (ME && !document.hidden && !(a && a.tagName === 'TEXTAREA')) load(); }, 45000);
})();
