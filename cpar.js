/* CPAR321 點心系（-cs1109）：課文內容中英逐句並讀
   繁／简頁並讀英文、英文頁並讀繁體中文；每一句主要內容後面接上另一種語言的對應句（.cps，灰色小字自成一行）。
   適用兩種 App 架構：
   ・點心系（真理點心、心靈快餐、舊約導讀）：課文頁 #lesson，另一語言直接讀 data/<語言>-NN.json 同一課；
   ・屬靈父母手冊：章節／八週課程／福音工具頁，用另一語言的 content.<語言>.json 同一套版型再畫一次取得對照。
   兩邊依區塊代號（.blk 的 data-l + data-b）一一配對；區塊內依句子單位（.sent）分組，另一語言切句後按長度比例對齊
   （1:1、1:2、2:1、1:3、3:1、2:2、1:0、0:1）。並讀句不是 .sent，所以朗讀、畫線、領受、小智都只作用在主要內容。
   設定存 localStorage cpar321（'1' 或 ''，所有 321 App 共用）。ES5 寫法（給 WPS／舊 WebView）。 */
(function () {
  if (window.CPAR321) return;
  var MODE = (typeof CONTENT !== 'undefined' && typeof vChapter === 'function') ? 'book'
    : ((typeof getLesson === 'function' && typeof vRead === 'function') ? 'snack' : '');
  if (!MODE || typeof setApp !== 'function') return;

  function LN() { try { return L(); } catch (e) { return 'zh'; } }
  function EN() { return LN() === 'en'; }
  function ALT() { return EN() ? 'zh' : 'en'; }
  function ALT_LANG() { return EN() ? 'zh-Hant' : 'en'; }
  var STR = {
    zh: { btn: '中英並讀', on: '開', off: '關', loading: '英文內容載入中…', fail: '英文內容載入失敗，請檢查網路' },
    zs: { btn: '中英并读', on: '开', off: '关', loading: '英文内容载入中…', fail: '英文内容载入失败，请检查网络' },
    en: { btn: 'Chinese parallel', on: 'On', off: 'Off', loading: 'Loading the Chinese text…', fail: 'Couldn’t load the Chinese text — check your connection' }
  };
  function TT(k) { return (STR[LN()] || STR.zh)[k]; }
  function isOn() { try { return localStorage.getItem('cpar321') === '1'; } catch (e) { return false; } }
  function setOn(v) { try { localStorage.setItem('cpar321', v ? '1' : ''); } catch (e) { } }
  function each(a, f) { for (var i = 0; i < a.length; i++) f(a[i], i); }
  function arr(nl) { return Array.prototype.slice.call(nl || []); }
  function hasCls(e, c) { return !!(e && e.className && (' ' + String(e.className) + ' ').indexOf(' ' + c + ' ') >= 0); }
  function closest(e, sel, stop) { while (e && e !== stop && e.nodeType === 1) { if (matches(e, sel)) return e; e = e.parentNode; } return null; }
  function matches(e, sel) { var f = e.matches || e.msMatchesSelector || e.webkitMatchesSelector; return f ? f.call(e, sel) : false; }

  /* ── 切句與對齊 ── */
  var PUNCT = /[\s.,;:!?'"()\[\]{}\-–—…·•、，。！？；：「」『』“”‘’（）《》〈〉【】〔〕／\/]/g;
  function splitSents(t, zh) {
    t = String(t || '').replace(/\*\*/g, '').replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, ''); if (!t) return [];
    var re = zh ? /[^。！？；!?]+(?:[。！？；!?]+[」』”’）)】〕]*)?|[。！？；!?]+/g : /[^.!?;]+(?:[.!?;]+["”’)\]]*)?(?=\s|$)|[^.!?;]+$|[.!?;]+/g;
    var out = (t.match(re) || [t]), merged = [];
    each(out, function (x) {
      x = x.replace(/^\s+|\s+$/g, ''); if (!x) return;
      if (merged.length && x.replace(PUNCT, '').length < (zh ? 3 : 6)) merged[merged.length - 1] += (zh ? '' : ' ') + x;
      else merged.push(x);
    });
    return merged;
  }
  function plen(t, zh) { return Math.max(1, zh ? String(t).replace(PUNCT, '').length : String(t).replace(/\s+/g, ' ').length); }
  function align(ma, al) {
    var mz = !EN(), az = EN(), M = [], A2 = [], i, j, sm = 0, sa = 0;
    each(ma, function (t) { var v = plen(t, mz); M.push(v); sm += v; });
    each(al, function (t) { var v = plen(t, az); A2.push(v); sa += v; });
    var r = sa / sm, m = M.length, n = A2.length, INF = 1e9, C = [], B = [];
    for (i = 0; i <= m; i++) { var row = [], br = []; for (j = 0; j <= n; j++) { row.push(INF); br.push(null); } C.push(row); B.push(br); }
    C[0][0] = 0;
    var moves = [[1, 1, 0], [1, 2, .9], [2, 1, .9], [1, 3, 2], [3, 1, 2], [2, 2, 2.2], [1, 0, 3.5], [0, 1, 3.5]];
    for (i = 0; i <= m; i++) for (j = 0; j <= n; j++) {
      if (C[i][j] >= INF) continue;
      for (var q = 0; q < moves.length; q++) {
        var mv = moves[q], a = i + mv[0], b = j + mv[1]; if (a > m || b > n) continue;
        var x = 0, y = 0, k; for (k = i; k < a; k++) x += M[k]; for (k = j; k < b; k++) y += A2[k];
        var dv = (y - r * x) / Math.sqrt(3 * (r * x + y) + 1), c = C[i][j] + mv[2] + dv * dv / 2;   // 長度差近似常態分布（Gale–Church）
        if (c < C[a][b]) { C[a][b] = c; B[a][b] = [i, j]; }
      }
    }
    var groups = []; i = m; j = n;
    while (i > 0 || j > 0) { var p = B[i][j]; if (!p) break; groups.unshift([p[0], i, p[1], j]); i = p[0]; j = p[1]; }
    return groups;                                      // [主起, 主迄, 譯起, 譯迄]
  }
  function mkSpan(t) { var d = document.createElement('span'); d.className = 'cps'; d.setAttribute('lang', ALT_LANG()); d.textContent = t; return d; }
  function after(ref, node) { if (ref.nextSibling) ref.parentNode.insertBefore(node, ref.nextSibling); else ref.parentNode.appendChild(node); }

  /* 一組主要句子單位（.sent）配一段另一語言文字 */
  function pairRun(units, altText, host) {
    var alts = splitSents(altText, EN()); if (!alts.length) return 0;
    if (!units.length) { host.appendChild(mkSpan(alts.join(EN() ? '' : ' '))); return 1; }
    var texts = []; each(units, function (u) { texts.push(u.textContent || ''); });
    var groups = units.length === 1 ? [[0, 1, 0, alts.length]] : align(texts, alts), ins = [];
    each(groups, function (g) {
      var t = alts.slice(g[2], g[3]).join(EN() ? '' : ' '); if (!t) return;
      var at = g[1] > g[0] ? g[1] - 1 : Math.max(0, g[0] - 1);
      if (ins.length && ins[ins.length - 1][0] === at) ins[ins.length - 1][1] += (EN() ? '' : ' ') + t; else ins.push([at, t]);
    });
    for (var k = ins.length - 1; k >= 0; k--) after(units[ins[k][0]], mkSpan(ins[k][1]));
    return ins.length;
  }
  /* 區塊內的句子依「同一個父元素、中間沒有節號」分組（例：經文每一節、表格每一格、標題與內文） */
  function runsOf(blk) {
    var runs = [], cur = null, prev = null;
    each(arr(blk.querySelectorAll('.sent')), function (s) {
      if (closest(s, '.cps', blk)) return;
      var brk = !prev || s.parentNode !== prev.parentNode;
      if (!brk) { var n = s.previousSibling; while (n && n !== prev) { if (n.nodeType === 1 && hasCls(n, 'vn')) { brk = true; break; } n = n.previousSibling; } }
      if (brk) { cur = []; runs.push(cur); }
      cur.push(s); prev = s;
    });
    return runs;
  }
  function pairBlk(blk, alts) {
    alts = (alts || []).filter(function (t) { return t && /[A-Za-z一-鿿]/.test(t); });
    if (!alts.length) return 0;
    var runs = runsOf(blk), n = 0;
    var mainTxt = (blk.textContent || '').replace(/\s+/g, ''), altTxt = alts.join('').replace(/\s+/g, '').replace(/\*\*/g, '');
    if (mainTxt === altTxt) return 0;
    if (runs.length === alts.length) { each(runs, function (r, i) { n += pairRun(r, alts[i], blk); }); return n; }
    var all = []; each(runs, function (r) { all = all.concat(r); });
    return pairRun(all, alts.join(EN() ? '' : ' '), blk);
  }
  function clear(root) { each(arr((root || document).querySelectorAll('.cps')), function (e) { e.parentNode.removeChild(e); }); }
  function blkKey(b) { return (b.getAttribute('data-l') || '') + '|' + (b.getAttribute('data-b') || ''); }
  function mainBlks(root) { return arr(root.querySelectorAll('.blk[data-b]')).filter(function (b) { return !closest(b.parentNode, '.blk', root); }); }

  /* ── 介面 ── */
  function css() {
    if (document.getElementById('cparCss')) return;
    var st = document.createElement('style'); st.id = 'cparCss';
    st.textContent = '.cps{display:block;margin:2px 0 8px;padding:1px 0 1px 9px;border-left:3px solid rgba(128,128,128,.45);font-size:.88em;line-height:1.65;opacity:.72;font-weight:400;font-style:normal;letter-spacing:0;text-transform:none;text-align:left;text-indent:0;cursor:auto;white-space:normal}'
      + 'h1 .cps,h2 .cps,h3 .cps,h4 .cps,b .cps,summary .cps{font-weight:600}h1 .cps{font-size:.58em}h2 .cps{font-size:.7em}td .cps,th .cps{margin:2px 0 4px}.decl .cps{opacity:.85}'
      + '.cparbtn.on{border-color:var(--gold,#c9962b)!important;color:var(--gold-d,var(--gold,#a87a1c))!important}'
      + '.cparbar{display:flex;justify-content:flex-end;margin:6px 0 10px}.cparbar .cparbtn{border:1px solid var(--line,#ddd);background:var(--surface,var(--card,#fff));color:inherit;border-radius:999px;padding:6px 14px;font:inherit;font-size:.86em;font-weight:600;cursor:pointer}'
      + '.cpar-st{font-size:.82em;opacity:.75;margin:0 0 8px;text-align:right}';
    document.head.appendChild(st);
  }
  function btnLabel() { return '🌐 ' + TT('btn') + (EN() ? ': ' : '：') +(isOn() ? TT('on') : TT('off')); }
  function paintBtns() { each(arr(document.querySelectorAll('.cparbtn')), function (b) { b.textContent = btnLabel(); b.className = b.className.replace(/\s*\bon\b/g, '') + (isOn() ? ' on' : ''); b.setAttribute('aria-pressed', isOn() ? 'true' : 'false'); }); }
  function mkBtn(cls) { var b = document.createElement('button'); b.type = 'button'; b.className = cls + ' cparbtn'; b.onclick = function (e) { if (e && e.stopPropagation) e.stopPropagation(); API.toggle(); }; return b; }
  function status(root, msg) {
    var s = document.querySelector('.cpar-st');
    if (!msg) { if (s) s.parentNode.removeChild(s); return; }
    if (!s) { s = document.createElement('div'); s.className = 'cpar-st'; var b = document.querySelector('.cparbtn'); var host = b ? (closest(b, '.cparbar,.l-acts', root) || b) : null; if (host) after(host, s); else root.insertBefore(s, root.firstChild); }
    s.textContent = msg;
  }
  var seq = 0;

  /* ── 點心系：課文頁 ── */
  if (MODE === 'snack') {
    var altLesson = function (n, cb) {
      var al = ALT(), k = chunkOf(n), key = al + k;
      var pick = function (a) { if (a) for (var i = 0; i < a.length; i++) if (a[i].n === n) return a[i]; return null; };
      if (CH[key]) { cb(pick(CH[key]), true); return; }
      getJSON('data/' + al + '-' + pad2(k) + '.json', function (d) { if (d) CH[key] = d; cb(pick(d), false); });
    };
    var altMap = function (x) {
      var m = {}, i, pr;
      m.t = [x.t];
      var vs = []; each(x.v || [], function (v) { if (v[2]) vs.push(v[2]); }); m.v = vs;
      each(x.b || [], function (p, i2) { m['b' + i2] = [p]; });
      each(x.a || [], function (a, i2) { m['ah' + i2] = [a[0]]; m['ad' + i2] = [a[1]]; });
      each(x.q || [], function (q, i2) { m['q' + i2] = [q]; });
      if (x.pr) { pr = String(x.pr).split('\n'); for (i = 0; i < pr.length; i++) m['p' + i] = [pr[i]]; }
      if (x.dc) m.d = [x.dc];
      return m;
    };
    var applySnack = function (root, x) {
      clear(root); var m = altMap(x), n = 0;
      each(mainBlks(root), function (b) { var k = b.getAttribute('data-b'); if (m[k]) n += pairBlk(b, m[k]); });
      var rf = root.querySelector('.l-ref'); if (rf && x.ref && x.ref !== rf.textContent) { rf.appendChild(mkSpan(x.ref)); n++; }
      var sub = root.querySelector('.ap-sub'); if (sub && x.ah && x.ah !== sub.textContent) { sub.appendChild(mkSpan(x.ah)); n++; }
      return n;
    };
    var decorate = function () {
      var root = document.getElementById('lesson'); if (!root || !window.LCUR || !LCUR.n || !root.querySelector('.blk')) return;
      css();
      if (!root.querySelector('.cparbtn')) { var acts = root.querySelector('.l-acts'), b = mkBtn('pill'); if (acts) acts.appendChild(b); else { var bar = document.createElement('div'); bar.className = 'cparbar'; bar.appendChild(mkBtn('')); root.insertBefore(bar, root.firstChild); } }
      paintBtns();
      if (!isOn()) { clear(root); status(root, ''); return; }
      var n = LCUR.n, my = ++seq;
      altLesson(n, function (x, sync) {
        if (my !== seq || document.getElementById('lesson') !== root || !window.LCUR || LCUR.n !== n) return;
        status(root, x ? '' : TT('fail'));
        if (x) applySnack(root, x);
      });
      if (my === seq && root.querySelector('.cps') == null && !CH[ALT() + chunkOf(n)]) status(root, TT('loading'));
    };
    var origSet = window.setApp;
    window.setApp = function () { var r = origSet.apply(this, arguments); try { decorate(); } catch (e) { } return r; };
    var API = window.CPAR321 = {
      toggle: function () { setOn(!isOn()); var y = window.scrollY; decorate(); try { window.scrollTo(0, y); } catch (e) { } },
      refresh: decorate, _split: splitSents, _align: align
    };
    return;
  }

  /* ── 屬靈父母手冊：章節／課程／工具頁 ── */
  var route = function () { try { return R.page || parseHash(); } catch (e) { return parseHash(); } };
  var isContent = function (p) { return p && (p.t === 'ch' || p.t === 'course' || (p.t === 'tool' && (p.id === 'gospel' || p.id === 'promise'))); };
  var routeKey = function (p) { return LN() + '|' + p.t + '|' + (p.id || ''); };
  var runView = function (p) {
    if (p.t === 'ch') vChapter(p.id);
    else if (p.t === 'course') { if (p.id) window.vLesson(+p.id); else window.vCourse(); }
    else if (p.t === 'tool') vTool(p.id);
  };
  var withVerses = function (c) {
    if (c && !c.verses) { var t; c.verses = []; for (t = 0; t < c.intro.length; t++) c.verses = c.verses.concat(c.intro[t].verses); for (t = 0; t < c.stages.length; t++) c.verses = c.verses.concat(c.stages[t].verses); c.verses = c.verses.concat(c.extraVerses || []); }
    return c;
  };
  var busy = false;
  /* 用另一語言的內容資料，把同一個畫面再畫一次，攔下 HTML（不寫進畫面） */
  var altHtml = function (p) {
    var al = ALT(), alt = CONTENT[al]; if (!alt) return null;
    var cap = null, setNow = window.setApp, oldC = C, oldCur = window.LCUR, oldLast = S.lastCh, oldLang = S.lang, oldSave = window.save, oldPaint = window.paintHl;
    busy = true; window.setApp = function (h) { cap = h; }; window.save = function () { }; window.paintHl = function () { };
    try { S.lang = al; C = withVerses(alt); runView(p); } catch (e) { cap = null; }
    finally { S.lang = oldLang; C = oldC; window.setApp = setNow; window.save = oldSave; window.paintHl = oldPaint; busy = false; try { LCUR = oldCur; } catch (e2) { } S.lastCh = oldLast; }
    return cap;
  };
  var ensureAlt = function (cb) {
    var al = ALT();
    var fin = function () { cb(!!CONTENT[al]); };
    var content = function () { if (CONTENT[al]) fin(); else if (typeof loadContent === 'function') loadContent(al, fin); else fin(); };
    if (typeof loadPack === 'function') loadPack(al, content); else content();
  };
  var OUT_SEL = 'h1,h2,h3,h4,h5,p,li,td,th,dt,dd,summary,blockquote,q,cite';
  var outside = function (root) {
    var out = [];
    each(arr(root.querySelectorAll(OUT_SEL)), function (e) {
      if (closest(e, '.blk,.cps,button,.pghead,nav,.cparbar,.cpar-st,.ch-nav,.checks,.fld,.toc-stage,.cbar', root)) return;
      if (e.querySelector('.blk,input,textarea,select')) return;
      var p = e.parentNode; while (p && p !== root) { if (p.nodeType === 1 && matches(p, OUT_SEL)) return; p = p.parentNode; }
      out.push(e);
    });
    return out;
  };
  var sig = function (e) { return e.tagName + '.' + String(e.className || '').split(/\s+/).sort().join('.'); };
  var lcs = function (a, b) {
    var n = a.length, m = b.length, i, j, Lt = [];
    for (i = 0; i <= n; i++) { var row = []; for (j = 0; j <= m; j++) row.push(0); Lt.push(row); }
    for (i = n - 1; i >= 0; i--) for (j = m - 1; j >= 0; j--) Lt[i][j] = a[i] === b[j] ? Lt[i + 1][j + 1] + 1 : Math.max(Lt[i + 1][j], Lt[i][j + 1]);
    var pairs = []; i = 0; j = 0;
    while (i < n && j < m) { if (a[i] === b[j]) { pairs.push([i, j]); i++; j++; } else if (Lt[i + 1][j] >= Lt[i][j + 1]) i++; else j++; }
    return pairs;
  };
  var ownText = function (e) {
    var c = e.cloneNode(true); each(arr(c.querySelectorAll('button,svg,input,.cps')), function (k) { k.parentNode.removeChild(k); }); each(arr(c.querySelectorAll('br')), function (k) { k.parentNode.replaceChild(document.createTextNode(' '), k); });
    return (c.textContent || '').replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
  };
  var applyBook = function (root, html) {
    clear(root); if (!html) return 0;
    var box = document.createElement('div'); box.innerHTML = html;
    var amap = {}, n = 0;
    each(mainBlks(box), function (b) { var g = []; each(runsOf(b), function (r) { var t = ''; each(r, function (s) { t += (t && EN() === false ? ' ' : '') + s.textContent; }); g.push(t); }); if (!g.length) g.push(ownText(b)); amap[blkKey(b)] = g; });
    each(mainBlks(root), function (b) { var g = amap[blkKey(b)]; if (g) n += pairBlk(b, g); });
    var A = outside(root), B = outside(box);
    if (A.length && B.length && A.length * B.length < 4e6) {
      each(lcs(A.map(sig), B.map(sig)), function (pr) {
        var me = A[pr[0]], t1 = ownText(me), t2 = ownText(B[pr[1]]);
        if (!t2 || t1 === t2 || !/[A-Za-z一-鿿]/.test(t2)) return;
        if (hasCls(me, 'lbl')) after(me, mkSpan(t2)); else me.appendChild(mkSpan(t2)); n++;
      });
    }
    return n;
  };
  var decorateBook = function () {
    if (busy) return;
    var p = route(); if (!isContent(p)) return;
    var app = document.getElementById('app'), root = app && (app.querySelector('.view') || app); if (!root || !root.querySelector('.blk')) return;
    css();
    if (!root.querySelector('.cparbtn')) {
      var bar = document.createElement('div'); bar.className = 'cparbar'; bar.appendChild(mkBtn(''));
      var anchor = root.querySelector('.ch-head') || root.querySelector('.course-hero') || root.querySelector('.pghead');
      if (anchor) after(anchor, bar); else root.insertBefore(bar, root.firstChild);
    }
    paintBtns();
    if (!isOn()) { clear(root); status(root, ''); return; }
    var key = routeKey(p), my = ++seq;
    var go = function () {
      if (my !== seq || routeKey(route()) !== key || !document.body.contains(root)) return;
      status(root, '');
      try { applyBook(root, altHtml(p)); } catch (e) { }
    };
    if (CONTENT[ALT()] && (ALT() === 'zh' || I18N[ALT()])) setTimeout(go, 0);
    else {
      status(root, TT('loading'));
      ensureAlt(function (ok) { if (ok) go(); else if (my === seq) status(root, TT('fail')); });
    }
  };
  var origSetB = window.setApp;
  window.setApp = function () { var r = origSetB.apply(this, arguments); if (!busy) { try { decorateBook(); } catch (e) { } } return r; };
  var API = window.CPAR321 = {
    toggle: function () { setOn(!isOn()); var y = window.scrollY; decorateBook(); try { window.scrollTo(0, y); } catch (e) { } },
    refresh: decorateBook, _split: splitSents, _align: align
  };
})();
