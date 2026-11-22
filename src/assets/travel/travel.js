/* GFA LAW Gun Travel Guide. Data: /assets/travel/states.json (re-verified weekly). */
(function () {
  'use strict';
  var root = document.getElementById('gtMap');
  if (!root) return;
  var $ = function (id) { return document.getElementById(id); };
  var GRID = {
    AK: [0, 0], ME: [10, 0],
    WI: [5, 1], VT: [9, 1], NH: [10, 1],
    WA: [0, 2], ID: [1, 2], MT: [2, 2], ND: [3, 2], MN: [4, 2], IL: [5, 2], MI: [6, 2], NY: [8, 2], MA: [9, 2],
    OR: [0, 3], NV: [1, 3], WY: [2, 3], SD: [3, 3], IA: [4, 3], IN: [5, 3], OH: [6, 3], PA: [7, 3], NJ: [8, 3], CT: [9, 3], RI: [10, 3],
    CA: [0, 4], UT: [1, 4], CO: [2, 4], NE: [3, 4], MO: [4, 4], KY: [5, 4], WV: [6, 4], VA: [7, 4], MD: [8, 4], DE: [9, 4],
    AZ: [1, 5], NM: [2, 5], KS: [3, 5], AR: [4, 5], TN: [5, 5], NC: [6, 5], SC: [7, 5], DC: [8, 5],
    OK: [3, 6], LA: [4, 6], MS: [5, 6], AL: [6, 6], GA: [7, 6],
    HI: [0, 7], TX: [3, 7], FL: [8, 7]
  };
  var LABEL = {
    permit: ['Your license works', 'permit'],
    pc: ['No permit needed', 'pc'],
    veh: ['Vehicle or open carry only', 'veh'],
    tr: ['Unloaded and locked', 'tr'],
    home: ['Your home state', 'permit']
  };
  var D, S, route = [], mode = 'drive', tiles = {};
  var store = {
    get: function () { try { return JSON.parse(localStorage.getItem('gfa-travel') || '{}'); } catch (e) { return {}; } },
    set: function (o) { try { localStorage.setItem('gfa-travel', JSON.stringify(o)); } catch (e) {} }
  };
  function esc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fdate(iso) {
    if (!iso) return '';
    var p = iso.split('-'), m = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return m[+p[1] - 1] + ' ' + (+p[2]) + ', ' + p[0];
  }
  function you() { return { home: $('gtHome').value, lic: $('gtLic').value, age: +$('gtAge').value }; }

  /* What can this traveler do in state c? */
  function status(c) {
    var d = S[c], u = you(), lic = u.lic !== 'none' ? u.lic : '', why = '';
    if (lic) {
      var ok = false, cond = '';
      if (c === lic) { ok = true; why = 'Your license was issued by ' + d.n + '.'; }
      else if (c === u.home && (c === 'MI' || c === 'WI' || c === 'CO' || c === 'PA')) { ok = false; why = d.n + ' residents need a ' + d.n + ' license to carry there.'; }
      else if (d.h === 'all') { ok = true; why = d.ht; }
      else if (Array.isArray(d.h) && d.h.indexOf(lic) > -1) {
        if (d.hr && lic !== u.home) { ok = false; why = d.n + ' honors a ' + S[lic].n + ' license only if you live in ' + S[lic].n + '.'; }
        else { ok = true; cond = d.hc && d.hc[lic] ? d.hc[lic] : ''; why = d.ht + (cond ? ' Limit for ' + S[lic].n + ': ' + cond + '.' : ''); }
      } else if (d.h === 'none' || Array.isArray(d.h)) { why = d.n + ' does not honor a ' + S[lic].n + ' license.'; }
      if (ok && u.age < 21 && c !== lic) { ok = false; why = 'Most states honor out-of-state licenses only for holders 21 and older.'; }
      if (ok) return { k: 'permit', why: why };
    }
    if (d.pc && u.age >= d.pc.a) return { k: 'pc', why: d.pc.t + (d.pc.w !== 'anyone' ? ' (Who it covers: ' + d.pc.w + '.)' : '') + (why ? ' ' + why : '') };
    if (d.veh === 'loaded') return { k: 'veh', why: (why ? why + ' ' : '') + (d.vt || 'A lawful possessor may keep a handgun in a private vehicle.') };
    if (d.veh === 'home' && lic && lic === u.home) return { k: 'veh', why: d.vt };
    if (c === u.home && !lic) return { k: 'tr', why: 'Your home state requires a license to carry a loaded handgun. ' + (d.vt || '') };
    return { k: 'tr', why: (why ? why + ' ' : '') + (/^Federal safe passage/.test(d.vt || '') ? d.vt : 'Without an honored license, rely on federal safe passage: unloaded, locked, out of reach, and keep moving.' + (d.vt ? ' ' + d.vt : '')) };
  }

  function bfs(a, b) {
    if (a === b) return [a];
    var prev = {}, q = [a], seen = {}; seen[a] = 1;
    while (q.length) {
      var x = q.shift();
      for (var i = 0; i < S[x].adj.length; i++) {
        var y = S[x].adj[i];
        if (seen[y]) continue;
        seen[y] = 1; prev[y] = x;
        if (y === b) { var p = [b]; while (p[0] !== a) p.unshift(prev[p[0]]); return p; }
        q.push(y);
      }
    }
    return null;
  }

  function drawMap() {
    Object.keys(tiles).forEach(function (c) {
      var t = tiles[c], s = status(c), i = route.indexOf(c);
      t.className = 'gt-tile s-' + s.k + (i > -1 ? ' in' : '') + (c === you().home ? ' home' : '');
      t.querySelector('em').textContent = i > -1 ? (i + 1) : '';
      t.setAttribute('aria-pressed', i > -1 ? 'true' : 'false');
      t.setAttribute('aria-label', S[c].n + ': ' + LABEL[s.k][0] + (i > -1 ? ', stop ' + (i + 1) + ' on your route' : ''));
    });
    $('gtChips').innerHTML = route.map(function (c, i) {
      return '<li><button type="button" data-c="' + c + '" title="Remove ' + esc(S[c].n) + '">' + (i + 1) + '. ' + c + ' <span aria-hidden="true">&times;</span></button></li>';
    }).join('');
  }

  function rule(h, t) { return t ? '<div class="gt-r"><h4>' + h + '</h4><p>' + t + '</p></div>' : ''; }
  function card(c, i) {
    var d = S[c], s = status(c), u = you();
    var src = (d.src || []).map(function (x) { return x[1] ? '<a href="' + esc(x[1]) + '" target="_blank" rel="noopener">' + esc(x[0]) + '</a>' : esc(x[0]); }).join(' &middot; ');
    var lic = d.h === 'all' ? 'Honors licenses from every state.' : d.h === 'none' ? 'Honors no out-of-state license.' :
      'Honors: ' + d.h.map(function (x) { return x + (d.hc && d.hc[x] ? '*' : ''); }).join(', ') + (d.hr ? '. Holder must live in the issuing state.' : '.') + (Object.keys(d.hc || {}).length ? ' *Limits apply.' : '');
    var checked = d.v ? '<span class="gt-ck ok">Checked ' + fdate(d.v) + '</span>' : '<span class="gt-ck">In this week&rsquo;s verification queue</span>';
    return '<article class="gt-card s-' + s.k + '"><header><span class="gt-n">' + (i + 1) + '</span><h3>' + esc(d.n) + (c === u.home ? ' <small>home</small>' : '') + '</h3><span class="gt-badge">' + LABEL[s.k][0] + '</span></header>' +
      '<p class="gt-why">' + esc(s.why) + '</p>' +
      '<details><summary>Full rules for ' + esc(d.n) + '</summary>' +
      rule('Permitless carry', d.pc ? esc(d.pc.t) : 'Not available. A license is needed to carry a loaded handgun on your person.') +
      rule('Out-of-state licenses', esc(lic) + (d.ht ? ' ' + esc(d.ht) : '')) +
      rule('In a vehicle', esc(d.vt || (d.veh === 'loaded' ? 'A person who may lawfully possess a handgun may keep it in a private vehicle.' : ''))) +
      rule('Magazines', esc(d.mag || 'No statewide capacity limit.')) +
      rule('Rifles and assault-weapon laws', esc(d.aw || 'No statewide assault-weapon ban. Long guns travel under the same carry and vehicle rules; keep them unloaded when in doubt.')) +
      rule('Telling an officer', esc(d.it || (d.inf ? 'Required.' : 'No general duty to inform; answer truthfully if asked.'))) +
      rule('Stops and off-limits places', esc(d.pl || 'Schools, courthouses, government buildings, airports past security, and posted private property are commonly off limits. Federal rules below also apply.')) +
      rule('Also know', esc(d.x)) +
      '<p class="gt-src">' + checked + (src ? ' Sources: ' + src : '') + '</p></details></article>';
  }
  function drawOut() {
    var o = $('gtOut');
    if (!route.length) {
      o.innerHTML = '<div class="gt-empty"><p class="eyebrow">How it works</p><ol><li>Pick your home state, license and age.</li><li>Choose a destination, or tap states in order.</li><li>Read each stop. Tap a card for the full rules and sources.</li></ol></div>';
      return;
    }
    var worst = route.reduce(function (w, c) { var k = status(c).k, r = { permit: 0, pc: 1, veh: 2, tr: 3 }; return r[k] > r[w] ? k : w; }, 'permit');
    var sum = { permit: 'Good news: you can carry on this whole route as you normally would, following each state\'s rules.', pc: 'You can carry on this route, partly without needing a license. Read each state\'s rules.', veh: 'Heads up: in at least one state you can only keep the gun in your vehicle or carry openly.', tr: 'Heads up: at least one state on this route does not let you carry. Unload and lock it up before you cross.' }[worst];
    o.innerHTML = '<div class="gt-sum s-' + worst + '"><b>' + route.length + ' state' + (route.length > 1 ? 's' : '') + '.</b> ' + sum + '</div>' + route.map(card).join('');
  }
  var MODES = {
    drive: ['Driving', [
      ['Federal safe passage', 'Under 18 U.S.C. 926A, if you may lawfully have the firearm where your trip starts and where it ends, you may drive through other states with it <b>unloaded</b>, and with the firearm and ammunition <b>not readily accessible</b> from the passenger area. No trunk? Use a <b>locked container other than the glove box or console</b>. Courts read this narrowly: stopping overnight or for errands can lose the protection in strict states.'],
      ['Rest stops, gas, food and hotels', 'At each stop, the law of the state you are in applies. In a state that does not honor your license, leave the firearm unloaded and locked in the vehicle. Hotels may ban guns as private property; signs can carry legal force in some states (Texas 30.06 and 30.07, for example).'],
      ['Long guns', 'Rifles and shotguns follow the same rules. Many states require long guns in a vehicle to be unloaded. Short-barreled rifles and shotguns, machine guns and destructive devices need ATF approval (Form 5320.20) before crossing state lines (18 U.S.C. 922(a)(4)).']]],
    fly: ['Flying', [
      ['TSA rules', 'Firearms go in <b>checked baggage only</b>, <b>unloaded</b>, in a <b>locked hard-sided container</b>, and you must <b>declare</b> them at the airline counter each time. Only you keep the key or combination. A firearm with accessible ammunition counts as loaded for TSA penalties.'],
      ['Ammunition and magazines', 'Ammunition must be in a box made for ammunition (fiber, wood, plastic or metal) and is checked only. Magazines, loaded or empty, must be boxed or in the locked case. Each airline sets its own ammunition weight limits.'],
      ['Where you land matters', 'The law at your destination and any layover airport applies when you claim your bag. New York and New Jersey airports have arrested travelers who were legal at home. Check your destination state below.']],
      ['TSA: Transporting Firearms and Ammunition', 'https://www.tsa.gov/travel/transporting-firearms-and-ammunition']],
    train: ['Amtrak', [
      ['Reserve ahead', 'Call 1-800-USA-RAIL at least 6 hours before departure. Firearms can travel only between stations that have checked-baggage service and a ticket office, and never on Amtrak Thruway buses.'],
      ['Packing', 'Unloaded, in a locked hard-sided case no larger than 62 x 17 x 7 inches and 50 pounds; only you hold the key. Ammunition in its original box or a proper ammo box, up to 11 pounds total. Check in at least 30 minutes early and sign the declaration form. Nothing in carry-on.']],
      ['Amtrak: Firearms in Checked Baggage', 'https://www.amtrak.com/firearms-in-checked-baggage']],
    bus: ['Greyhound and FlixBus', [
      ['Not allowed', 'Greyhound and FlixBus do not allow firearms, ammunition, gun parts, gunpowder, or replicas, in carry-on <b>or</b> checked bags. Pepper spray and stun guns are also banned. Ship the firearm through a licensed dealer or pick another way to travel.']],
      ['Greyhound: Permitted and Prohibited Items', 'https://cdn-cf.cms.flixbus.com/drupal-assets/2023-01/Permitted%20and%20Prohibited%20Items%20List%20(JAN%202023)%20-%20Co-branded_GLI%20%20FBI.pdf']],
    transit: ['Local transit', [
      ['City by city', 'Subways, buses and light rail are run by local agencies. Some states ban carry on public transit (New York, New Jersey, Maryland, Illinois and California among them), while others let license holders or permitless carriers ride armed. Check the state cards below and the transit agency\'s rules before you board.'],
      ['Stations and airports', 'An airport train that runs past the security checkpoint is a secured area where firearms are banned everywhere (49 C.F.R. 1540.111).']]]
  };
  function drawMode() {
    var m = MODES[mode];
    $('gtMode').innerHTML = '<h2>' + m[0] + '</h2><div class="gt-mgrid">' + m[1].map(function (x) { return '<article class="lcard"><h3>' + x[0] + '</h3><p>' + x[1] + '</p></article>'; }).join('') + '</div>' +
      (m[2] ? '<p class="sm">Source: <a href="' + m[2][1] + '" target="_blank" rel="noopener">' + m[2][0] + '</a></p>' : '');
  }
  var FED = [
    ['Who can travel armed', 'Federal law bars certain people from having guns anywhere, such as people convicted of felonies or domestic violence misdemeanors (18 U.S.C. 922(g)). A carry license does not change that.'],
    ['School zones', 'Within 1,000 feet of a K-12 school, federal law exempts only licenses issued by <b>that</b> state. Out-of-state license holders and permitless carriers should keep the firearm unloaded and in a locked container or locked rack while passing a school (18 U.S.C. 922(q)(2)(B)).'],
    ['National parks', 'You may carry in a national park if it is legal under the law of the state the park is in (54 U.S.C. 104906). Federal buildings in parks, like visitor centers, are still off limits.'],
    ['Federal buildings and post offices', 'Federal facilities ban firearms (18 U.S.C. 930). Postal Service rules bar firearms on postal property, including parking lots (39 C.F.R. 232.1), though that rule is being challenged in court.'],
    ['Army Corps of Engineers land', 'Many lakes and campgrounds are Corps land, where loaded firearms are generally banned unless you have written permission or are hunting (36 C.F.R. 327.13).'],
    ['Crossing a border', 'Canada and Mexico strictly limit firearms. Bringing a gun or even ammunition into Mexico can mean prison. Do not drive across with one.']
  ];
  function save() { store.set({ h: $('gtHome').value, l: $('gtLic').value, a: $('gtAge').value, r: route, m: mode }); }
  function refresh() { drawMap(); drawOut(); save(); }
  function setRoute(r) { route = r; refresh(); }

  function init(data) {
    D = data; S = D.states;
    var codes = Object.keys(S).sort(function (a, b) { return S[a].n < S[b].n ? -1 : 1; });
    var opts = codes.map(function (c) { return '<option value="' + c + '">' + esc(S[c].n) + '</option>'; }).join('');
    $('gtHome').innerHTML = opts; $('gtLic').innerHTML += opts; $('gtTo').innerHTML += opts;
    $('gtUpd').textContent = fdate(D.updated);
    Object.keys(GRID).forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button'; b.dataset.c = c;
      b.style.gridColumn = GRID[c][0] + 1; b.style.gridRow = GRID[c][1] + 1;
      b.innerHTML = '<span>' + c + '</span><em></em>';
      b.addEventListener('click', function () {
        var i = route.indexOf(c);
        if (i > -1) route.splice(i, 1); else route.push(c);
        refresh();
      });
      root.appendChild(b); tiles[c] = b;
    });
    var p = store.get();
    $('gtHome').value = p.h && S[p.h] ? p.h : 'TX';
    $('gtLic').value = p.l && (p.l === 'none' || S[p.l]) ? p.l : 'TX';
    if (p.a) $('gtAge').value = p.a;
    if (Array.isArray(p.r)) route = p.r.filter(function (c) { return S[c]; });
    if (p.m && MODES[p.m]) mode = p.m;
    document.querySelectorAll('.gt-mode').forEach(function (b) {
      var on = b.dataset.m === mode; b.classList.toggle('on', on); b.setAttribute('aria-selected', on);
      b.addEventListener('click', function () {
        mode = b.dataset.m;
        document.querySelectorAll('.gt-mode').forEach(function (x) { var o = x === b; x.classList.toggle('on', o); x.setAttribute('aria-selected', o); });
        drawMode(); save();
      });
    });
    ['gtHome', 'gtLic', 'gtAge'].forEach(function (id) { $(id).addEventListener('change', refresh); });
    $('gtTo').addEventListener('change', function () {
      var a = $('gtHome').value, b = this.value;
      if (!b) return;
      var r = bfs(a, b);
      if (!r) { route = a === b ? [a] : [a, b]; $('gtHint').textContent = 'Alaska and Hawaii are reached by air or sea: see the Fly tab. We added your home state and destination.'; }
      else { route = r; $('gtHint').textContent = 'We drew the shortest route by state lines. Tap states to add or remove any your trip actually crosses.'; }
      refresh();
      if (window.innerWidth < 900) $('gtOut').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    $('gtChips').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      route.splice(route.indexOf(b.dataset.c), 1); refresh();
    });
    $('gtClear').addEventListener('click', function () { $('gtTo').value = ''; setRoute([]); });
    $('gtFed').innerHTML = '<div class="gt-mgrid">' + FED.map(function (x) { return '<article class="lcard"><h3>' + x[0] + '</h3><p>' + x[1] + '</p></article>'; }).join('') + '</div>';
    drawMode(); refresh();
  }
  fetch('/assets/travel/states.json?v=' + Date.now().toString().slice(0, 6)).then(function (r) { return r.json(); }).then(init).catch(function () {
    $('gtOut').innerHTML = '<p>Sorry, the travel data did not load. Please refresh the page.</p>';
  });
})();
