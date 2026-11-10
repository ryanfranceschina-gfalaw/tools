/* a7: page script. All user text is set with textContent, never parsed as HTML or links. */
(function () {
  'use strict';
  var API = 'https://script.google.com/macros/s/AKfycbx7QdvF6l8zROPvs_mUMLNjsfdeWccA5raj18UgX2HFuCvBD_RLukyVZxk2RUOzCkxTmw/exec';
  var RULES = '2026-11-10b';
  var MAX = 67;
  var me = document.currentScript;
  var BASE = me ? me.src.replace(/assets\/a7\/app\.js.*$/, '') : '/';
  var AV = [
    ['washington', 'George Washington', 'img/founders/washington.jpg'], ['franklin', 'Benjamin Franklin', 'img/founders/franklin.jpg'],
    ['jefferson', 'Thomas Jefferson', 'img/founders/jefferson.jpg'], ['adams', 'John Adams', 'img/founders/adams.jpg'],
    ['hamilton', 'Alexander Hamilton', 'img/founders/hamilton.jpg'], ['jay', 'John Jay', 'img/founders/jay.jpg'],
    ['madison', 'James Madison', 'img/founders/madison.jpg'], ['bell', 'Liberty Bell', 'a7/av/bell.svg'],
    ['gavel', 'Gavel', 'a7/av/gavel.svg'], ['quill', 'Quill', 'a7/av/quill.svg'], ['scales', 'Scales', 'a7/av/scales.svg'],
    ['star', 'Lone Star', 'a7/av/star.svg'], ['torch', 'Torch', 'a7/av/torch.svg'], ['scroll', 'Scroll', 'a7/av/scroll.svg'],
    ['megaphone', 'Megaphone', 'a7/av/megaphone.svg']];
  var avMap = {}; AV.forEach(function (a) { avMap[a[0]] = a; });
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

  function avSrc(k) { var a = avMap[k] || avMap.star; return BASE + 'assets/' + a[2]; }
  function avAlt(k) { return (avMap[k] || avMap.star)[1]; }

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
    $('fsp-join').hidden = !open || (!!ME && ME.rules === RULES && !editing);
    $('fsp-compose').hidden = !open || !ME || ME.rules !== RULES || editing;
    if (ME && !$('fsp-name').value) {
      $('fsp-name').value = ME.name; $('fsp-name').disabled = true;
      if (!pick) { pick = ME.av; grid.querySelectorAll('.fsp-av').forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.k === pick)); }); }
    }
    if (ME) { $('fsp-meav').src = avSrc(ME.av); $('fsp-meav').alt = avAlt(ME.av); $('fsp-mename').textContent = ME.name; }
  }

  // ---- join ----
  var pick = '', editing = false;
  var grid = $('fsp-avgrid');
  AV.forEach(function (a) {
    var bt = document.createElement('button'); bt.type = 'button'; bt.className = 'fsp-av'; bt.dataset.k = a[0];
    bt.setAttribute('aria-pressed', 'false'); bt.title = a[1];
    var im = document.createElement('img'); im.src = avSrc(a[0]); im.alt = a[1]; im.width = 64; im.height = 64; im.loading = 'lazy';
    bt.appendChild(im);
    bt.addEventListener('click', function () {
      pick = a[0];
      grid.querySelectorAll('.fsp-av').forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.k === pick)); });
    });
    grid.appendChild(bt);
  });
  $('fsp-edit').addEventListener('click', function () {
    editing = true; $('fsp-name').value = ME.name; $('fsp-name').disabled = true; pick = ME.av;
    grid.querySelectorAll('.fsp-av').forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.k === pick)); });
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
    send({ a: 'join', name: name, av: pick, adult: true, secret: true, rules: RULES }).then(function (d) {
      if (!d.ok || !d.user) { err.textContent = d.error || 'Please try again.'; return; }
      ME = { name: d.user.name, av: d.user.av, rules: d.user.rules };
      sset('gfa_fsp_me', JSON.stringify(ME)); editing = false; $('fsp-name').disabled = false;
      showForms(); load();
    }).catch(function () { err.textContent = 'Could not reach the platform. Try again.'; })
      .finally(function () { btn.disabled = false; btn.textContent = 'Join'; });
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
    bt.addEventListener('click', function () {
      if (!armed) { armed = setTimeout(function () { armed = 0; bt.textContent = 'Delete'; bt.classList.remove('arm'); }, 4000); bt.textContent = 'Tap again to delete'; bt.classList.add('arm'); return; }
      clearTimeout(armed); bt.disabled = true; bt.textContent = 'Deleting...';
      send({ a: 'del', pid: p.id }).then(function (d) {
        if (d.ok) { li.parentNode && li.parentNode.removeChild(li); MINE = MINE.filter(function (x) { return x !== p.id; }); sset('gfa_a7_mine', JSON.stringify(MINE)); }
        else { bt.disabled = false; armed = 0; bt.classList.remove('arm'); bt.textContent = d.error || 'Try again'; }
      }).catch(function () { bt.disabled = false; armed = 0; bt.classList.remove('arm'); bt.textContent = 'Try again'; });
    });
    return bt;
  }
  function render(posts) {
    var ol = $('fsp-feed'); ol.textContent = '';
    if (!posts.length) { ol.appendChild(el('li', 'fsp-empty', 'Nothing here yet. Be the first.')); return; }
    posts.forEach(function (p) {
      var li = el('li', 'fsp-post');
      var im = document.createElement('img'); im.src = avSrc(p.av); im.alt = ''; im.width = 44; im.height = 44; im.loading = 'lazy'; im.className = 'fsp-pav';
      li.appendChild(im);
      var bd = el('div', 'fsp-pb');
      var hd = el('div', 'fsp-ph'); hd.appendChild(el('b', null, p.u)); hd.appendChild(el('time', null, ago(p.at)));
      hd.lastChild.setAttribute('datetime', p.at);
      bd.appendChild(hd);
      bd.appendChild(el('p', 'fsp-tx', p.x));
      var vb = el('div', 'fsp-vb'); vb.appendChild(voteBtn(p, 1)); vb.appendChild(voteBtn(p, -1));
      if (MINE.indexOf(p.id) > -1 && MODE === 'open') vb.appendChild(delBtn(p, li));
      bd.appendChild(vb); li.appendChild(bd); ol.appendChild(li);
    });
  }
  function load() {
    return fetch(API + '?a=feed', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) {
      if (d.mode) setMode(d.mode);
      if (d.ok) render(d.posts || []);
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
  setInterval(function () { if (!document.hidden) load(); }, 45000);
})();
