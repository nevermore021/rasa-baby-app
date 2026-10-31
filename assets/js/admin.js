/* دنیای رسا ۲.۰ — admin panel (client-side, no backend) */
(function () {
  'use strict';
  var D = window.RASA_DATA || {};
  var X = window.RASA_EXTRA || {};
  var ANIMALS = D.animals || [];
  var AKEY = 'rasa.baby.v2.admin';
  var CKEY = 'rasa.baby.v2.content';
  var PKEY = 'rasa.baby.v2.progress';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fa(n) { return String(n).replace(/[0-9]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[+d]; }); }
  function toast(msg) {
    var t = $('#toast2'); t.textContent = msg; t.classList.add('show');
    clearTimeout(t._tm); t._tm = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }
  async function sha(text) {
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }
  function loadAdmin() { try { return JSON.parse(localStorage.getItem(AKEY) || '{}'); } catch (e) { return {}; } }
  function saveAdmin(v) { localStorage.setItem(AKEY, JSON.stringify(v)); }
  function loadContent() { try { return JSON.parse(localStorage.getItem(CKEY) || '{}'); } catch (e) { return {}; } }
  function saveContent(v) { localStorage.setItem(CKEY, JSON.stringify(v)); }
  function mergedAnimals() {
    var ov = (loadContent().animals) || {};
    return ANIMALS.map(function (a) {
      var o = ov[a.id] || {};
      return Object.assign({}, a, o);
    });
  }
  function mergedLocks() {
    var c = loadContent();
    return { locks: c.locks || (X.locks || []), unlockCost: c.unlockCost || X.unlockCost || 30,
             dailyBonus: c.dailyBonus || X.dailyBonus || 15 };
  }

  /* ---------- auth ---------- */
  var admin = loadAdmin();
  if (!admin.pass) {
    // first run: default password hash
    sha('rasa2026').then(function (h) { admin.pass = h; saveAdmin(admin); boot(); });
  } else {
    boot();
  }

  function boot() {
    var authed = sessionStorage.getItem('rasa.admin.ok') === '1';
    if (!authed) {
      $('#gateWrap').hidden = false;
      $('#gateBtn').addEventListener('click', tryLogin);
      $('#gatePass').addEventListener('keydown', function (e) { if (e.key === 'Enter') tryLogin(); });
    } else {
      showAdmin();
    }
  }
  async function tryLogin() {
    var v = $('#gatePass').value || '';
    var h = await sha(v);
    if (h === (loadAdmin().pass || '')) {
      sessionStorage.setItem('rasa.admin.ok', '1');
      $('#gateWrap').hidden = true;
      showAdmin();
    } else {
      toast('رمز اشتباه است');
    }
  }
  function showAdmin() {
    $('#adminWrap').hidden = false;
    $('#logoutBtn').addEventListener('click', function () {
      sessionStorage.removeItem('rasa.admin.ok'); location.reload();
    });
    $$('#tabs button').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('#tabs button').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        render(b.getAttribute('data-tab'));
      });
    });
    render('overview');
  }

  /* ---------- tabs ---------- */
  function render(tab) {
    var body = $('#tabBody');
    if (tab === 'overview') body.innerHTML = viewOverview();
    else if (tab === 'animals') { body.innerHTML = viewAnimals(); bindAnimals(); }
    else if (tab === 'locks') { body.innerHTML = viewLocks(); bindLocks(); }
    else if (tab === 'content') body.innerHTML = viewContent();
    else if (tab === 'data') { body.innerHTML = viewData(); bindData(); }
    else if (tab === 'security') { body.innerHTML = viewSecurity(); bindSecurity(); }
  }

  function stats() {
    var prog = {};
    try { prog = JSON.parse(localStorage.getItem(PKEY) || '{}'); } catch (e) {}
    var withAud = ANIMALS.filter(function (a) { return a.aud; }).length;
    var lk = mergedLocks();
    return { animals: ANIMALS.length, withAud: withAud, locks: lk.locks.length,
             points: prog.points | 0, unlocked: (prog.unlocked || []).length,
             fp: prog.fpFound | 0, right: prog.quizRight | 0, wrong: prog.quizWrong | 0 };
  }
  function viewOverview() {
    var s = stats();
    return '<div class="admin-card"><h2 style="font-size:16px;margin:0 0 10px">📊 وضعیت</h2>' +
      '<div class="admin-grid">' +
      stat(s.animals, 'کل حیوانات') + stat(s.withAud, 'با صدای واقعی') +
      stat(fa(s.locks), 'قفل‌ها') + stat('💎 ' + fa(s.points), 'امتیاز بازدیدکننده') +
      stat(fa(s.unlocked), 'قفل باز شده') + stat(fa(s.fp), 'ردپای پیدا شده') +
      '</div><p class="hint" style="margin-top:12px">آمار از حافظه همین مرورگر خوانده می‌شود (سایت استاتیک است).</p></div>' +
      '<div class="admin-card"><h2 style="font-size:16px;margin:0 0 8px">⚡ کارهای سریع</h2>' +
      '<div class="row"><button class="btn btn-primary btn-sm" id="qExport">⬇️ خروجی داده سفارشی</button>' +
      '<button class="btn btn-ghost btn-sm" id="qResetProg">♻️ ریست پیشرفت بازدیدکننده</button></div>' +
      '<p class="hint">برای انتشار تغییرات: از تب «داده» فایل JSON را بگیر و در هاست کنار سایت آپلود کن.</p></div>';
  }
  function stat(v, l) { return '<div class="stat"><b>' + v + '</b><span>' + l + '</span></div>'; }

  function viewAnimals() {
    var list = mergedAnimals();
    return '<div class="admin-card"><div class="row"><input id="aSearch" type="text" placeholder="جستجوی حیوان..."></div>' +
      '<div class="list" id="aList">' + list.map(itemRow).join('') + '</div>' +
      '<p class="hint">روی هر حیوان بزن تا نام/جمله/صدا را ویرایش کنی. حذف صدا = خاموش کردن پخش.</p></div>';
  }
  function itemRow(a) {
    var locked = mergedLocks().locks.indexOf(a.id) > -1;
    return '<div class="item" data-aid="' + esc(a.id) + '">' +
      '<img src="assets/images/' + esc((a.thumb || a.img || '').replace(/^assets\/images\//, '')) + '" alt="">' +
      '<div class="nm">' + esc(a.fa) + '<div class="sub">' + esc(a.en || '') + ' · ' + esc(a.id) + '</div></div>' +
      '<span class="badge ' + (locked ? 'on' : '') + '">' + (locked ? 'قفل' : 'آزاد') + '</span>' +
      '<span class="badge ' + (a.aud ? 'on' : '') + '">' + (a.aud ? '🔊' : '🔇') + '</span>' +
      '</div>';
  }
  function bindAnimals() {
    var search = $('#aSearch');
    if (search) search.addEventListener('input', function () {
      var q = search.value.toLowerCase();
      $$('#aList .item').forEach(function (row) {
        row.style.display = row.textContent.toLowerCase().indexOf(q) > -1 ? '' : 'none';
      });
    });
    $$('#aList .item').forEach(function (row) {
      row.addEventListener('click', function () { editAnimal(row.getAttribute('data-aid')); });
    });
  }
  function editAnimal(id) {
    var a = mergedAnimals().filter(function (x) { return x.id === id; })[0];
    if (!a) return;
    var body = $('#tabBody');
    body.innerHTML = '<div class="admin-card">' +
      '<h2 style="font-size:16px">✏️ ویرایش: ' + esc(a.fa) + '</h2>' +
      '<div class="row"><label>نام فارسی</label><input id="eFa" type="text" value="' + esc(a.fa) + '"></div>' +
      '<div class="row"><label>نام انگلیسی</label><input id="eEn" type="text" value="' + esc(a.en || '') + '"></div>' +
      '<div class="row"><label>جمله آموزشی</label><textarea id="eFact">' + esc(a.fact || '') + '</textarea></div>' +
      '<div class="row"><label>صدا (مسیر)</label><input id="eAud" type="text" value="' + esc(a.aud || '') + '" placeholder="assets/audio/animals/' + esc(a.id) + '.mp3"></div>' +
      '<div class="row"><button class="btn btn-primary btn-sm" id="eSave">ذخیره</button>' +
      '<button class="btn btn-ghost btn-sm" id="eBack">بازگشت</button>' +
      '<button class="btn btn-ghost btn-sm" id="ePlay">🔊 تست صدا</button></div>' +
      '</div>';
    $('#eBack').addEventListener('click', function () { render('animals'); });
    $('#ePlay').addEventListener('click', function () {
      var src = $('#eAud').value.trim(); if (src) new Audio(src).play().catch(function () { toast('پخش نشد'); });
    });
    $('#eSave').addEventListener('click', function () {
      var c = loadContent(); c.animals = c.animals || {};
      c.animals[id] = Object.assign(c.animals[id] || {}, {
        fa: $('#eFa').value.trim(), en: $('#eEn').value.trim(),
        fact: $('#eFact').value.trim(), aud: $('#eAud').value.trim()
      });
      saveContent(c); toast('ذخیره شد (محلی)'); render('animals');
    });
  }

  function viewLocks() {
    var lk = mergedLocks();
    var list = mergedAnimals();
    return '<div class="admin-card"><h2 style="font-size:16px;margin:0 0 8px">🔒 قفل‌ها</h2>' +
      '<div class="row"><label>هزینه باز کردن</label><input id="lkCost" type="number" min="0" value="' + lk.unlockCost + '"></div>' +
      '<div class="row"><label>جایزه روزانه</label><input id="lkDaily" type="number" min="0" value="' + lk.dailyBonus + '"></div>' +
      '<div class="row"><button class="btn btn-primary btn-sm" id="lkSave">ذخیره</button></div>' +
      '<p class="hint">روی هر حیوان بزن تا قفل/آزاد شود.</p>' +
      '<div class="list" id="lkList">' + list.map(function (a) {
        var on = lk.locks.indexOf(a.id) > -1;
        return '<div class="item" data-lkid="' + esc(a.id) + '"><img src="assets/images/' + esc((a.thumb || a.img || '').replace(/^assets\/images\//, '')) + '"><div class="nm">' + esc(a.fa) + '</div><span class="badge ' + (on ? 'on' : '') + '">' + (on ? '🔒 قفل' : 'آزاد') + '</span></div>';
      }).join('') + '</div></div>';
  }
  function bindLocks() {
    $('#lkSave').addEventListener('click', function () {
      var c = loadContent();
      c.unlockCost = +$('#lkCost').value || 30;
      c.dailyBonus = +$('#lkDaily').value || 15;
      saveContent(c); toast('ذخیره شد');
    });
    $$('#lkList .item').forEach(function (row) {
      row.addEventListener('click', function () {
        var id = row.getAttribute('data-lkid');
        var c = loadContent();
        var locks = c.locks || (X.locks || []).slice();
        var i = locks.indexOf(id);
        if (i > -1) locks.splice(i, 1); else locks.push(id);
        c.locks = locks; saveContent(c);
        row.querySelector('.badge').textContent = i > -1 ? 'آزاد' : '🔒 قفل';
        row.querySelector('.badge').classList.toggle('on', i === -1);
      });
    });
  }

  function viewContent() {
    var songs = X.songs || [], vids = X.videos || [];
    return '<div class="admin-card"><h2 style="font-size:16px">🎵 آهنگ‌ها (' + fa(songs.length) + ')</h2>' +
      songs.map(function (s) { return '<div class="item"><span style="font-size:20px">' + esc(s.emoji || '🎵') + '</span><div class="nm">' + esc(s.title) + '<div class="sub">' + esc(s.src) + '</div></div><audio controls preload="none" src="' + esc(s.src) + '"></audio></div>'; }).join('') +
      '</div><div class="admin-card"><h2 style="font-size:16px">🎬 ویدیوها (' + fa(vids.length) + ')</h2>' +
      vids.map(function (v) { return '<div class="item"><span style="font-size:18px">▶️</span><div class="nm">' + esc(v.title) + '<div class="sub">' + esc(v.src) + '</div></div></div>'; }).join('') +
      '</div><p class="hint">برای افزودن محتوای جدید، فایل را در assets آپلود کن و از تب «داده» JSON را ویرایش/جایگزین کن.</p>';
  }

  function viewData() {
    return '<div class="admin-card"><h2 style="font-size:16px">💾 خروجی/ورودی داده</h2>' +
      '<div class="row"><button class="btn btn-primary btn-sm" id="dExport">⬇️ دانلود data.custom.json</button>' +
      '<button class="btn btn-ghost btn-sm" id="dExportFull">⬇️ دانلود کل داده (data.js)</button></div>' +
      '<div class="row"><label>ورود JSON</label><textarea id="dImport" placeholder=\'{"animals":{...},"locks":[...]}\'></textarea></div>' +
      '<div class="row"><button class="btn btn-ghost btn-sm" id="dImportBtn">اعمال از متن</button>' +
      '<label style="min-width:auto"><input type="file" id="dFile" accept=".json"></label></div>' +
      '<div class="row"><button class="btn btn-danger btn-sm" id="dResetContent">♻️ بازگشت به داده اصلی</button></div>' +
      '<p class="hint">این پنل استاتیک است: تغییرات در همین مرورگر ذخیره می‌شوند. برای اعمال برای همه، فایل خروجی را در هاست جای data.js بگذار.</p></div>';
  }
  function bindData() {
    $('#dExport').addEventListener('click', function () {
      var c = loadContent();
      download('data.custom.json', JSON.stringify(c, null, 2));
    });
    $('#dExportFull').addEventListener('click', function () {
      var merged = { animals: mergedAnimals(), cats: D.cats, fpLabels: D.fpLabels, habLabels: D.habLabels,
                     locks: mergedLocks().locks, unlockCost: mergedLocks().unlockCost, songs: X.songs, videos: X.videos };
      download('data.full.json', JSON.stringify(merged, null, 2));
    });
    $('#dImportBtn').addEventListener('click', function () {
      try { var v = JSON.parse($('#dImport').value); saveContent(v); toast('اعمال شد'); render('animals'); }
      catch (e) { toast('JSON نامعتبر'); }
    });
    $('#dFile').addEventListener('change', function (e) {
      var f = e.target.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        try { saveContent(JSON.parse(r.result)); toast('فایل اعمال شد'); render('animals'); }
        catch (err) { toast('فایل نامعتبر'); }
      };
      r.readAsText(f);
    });
    $('#dResetContent').addEventListener('click', function () {
      if (!confirm('داده سفارشی پاک شود؟')) return;
      localStorage.removeItem(CKEY); toast('بازگشت به داده اصلی'); render('overview');
    });
  }
  function download(name, text) {
    var blob = new Blob([text], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  function viewSecurity() {
    return '<div class="admin-card"><h2 style="font-size:16px">🔐 رمز پنل</h2>' +
      '<div class="row"><label>رمز فعلی</label><input id="sOld" type="password"></div>' +
      '<div class="row"><label>رمز جدید</label><input id="sNew" type="password"></div>' +
      '<div class="row"><button class="btn btn-primary btn-sm" id="sSave">تغییر رمز</button></div>' +
      '<p class="hint">رمز فقط برای همین مرورگر ذخیره می‌شود (هش SHA-256). اگر سایت را روی هاست منتشر می‌کنی، دسترسی به admin.html را با رمز وب‌سرور یا IP محدود کن.</p></div>';
  }
  function bindSecurity() {
    $('#sSave').addEventListener('click', async function () {
      var oldH = await sha($('#sOld').value || '');
      if (oldH !== (loadAdmin().pass || '')) { toast('رمز فعلی اشتباه است'); return; }
      var nv = $('#sNew').value || '';
      if (nv.length < 6) { toast('رمز جدید حداقل ۶ کاراکتر'); return; }
      var a = loadAdmin(); a.pass = await sha(nv); saveAdmin(a);
      toast('رمز عوض شد'); $('#sOld').value = ''; $('#sNew').value = '';
    });
  }
})();
