/* دنیای رسا ۲.۰ — core app */
(function () {
  'use strict';

  var D = window.RASA_DATA || {};
  var X = window.RASA_EXTRA || {};
  var ANIMALS = D.animals || [];
  var CATS = D.cats || [];
  var BY_ID = new Map(ANIMALS.map(function (a) { return [a.id, a]; }));

  var SKEY = 'rasa.baby.v2.settings';
  var PKEY = 'rasa.baby.v2.progress';
  var DEF_SET = { music: false, sfx: true, reduceMotion: false, hints: true };
  var DEF_PROG = { points: 0, unlocked: [], favorites: [], plays: {}, daily: '', quizRight: 0, quizWrong: 0, fpFound: 0 };

  var settings = loadJSON(SKEY, DEF_SET);
  var progress = loadJSON(PKEY, DEF_PROG);
  if (!Array.isArray(progress.unlocked)) progress.unlocked = [];
  if (!Array.isArray(progress.favorites)) progress.favorites = [];

  /* admin overrides (localStorage, written by admin.html) */
  (function applyOverrides() {
    try {
      var ov = JSON.parse(localStorage.getItem('rasa.baby.v2.content') || 'null');
      if (!ov) return;
      if (ov.animals) {
        ANIMALS.forEach(function (a) {
          var o = ov.animals[a.id];
          if (o) Object.keys(o).forEach(function (k) { if (o[k] !== undefined) a[k] = o[k]; });
        });
      }
      if (Array.isArray(ov.locks)) X.locks = ov.locks;
      if (ov.unlockCost) X.unlockCost = ov.unlockCost;
      if (ov.dailyBonus) X.dailyBonus = ov.dailyBonus;
    } catch (e) {}
  })();

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fa(n) { return String(n).replace(/[0-9]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[+d]; }); }
  function loadJSON(k, def) {
    try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v ? Object.assign({}, def, v) : Object.assign({}, def); }
    catch (e) { return Object.assign({}, def); }
  }
  function saveSettings() { try { localStorage.setItem(SKEY, JSON.stringify(settings)); } catch (e) {} }
  function saveProgress() { try { localStorage.setItem(PKEY, JSON.stringify(progress)); } catch (e) {} }
  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function sample(a, n) { return shuffle(a).slice(0, n); }
  function imgOf(a) { return 'assets/images/' + (a.thumb || a.img || '').replace(/^assets\/images\//, ''); }
  function fullImg(a) { return 'assets/images/' + (a.img || '').replace(/^assets\/images\//, ''); }
  function audOf(a) { return a.aud ? a.aud.replace(/^assets\//, 'assets/') : ''; }
  function catLabel(key) { var c = CATS.filter(function (x) { return x.key === key; })[0]; return c ? c.label : key; }
  function points() { return progress.points | 0; }
  function setPoints(v) { progress.points = Math.max(0, v | 0); saveProgress(); paintPoints(true); }
  function addPoints(n) {
    setPoints(points() + n);
    toast('💎 ' + fa(n) + ' امتیاز گرفتی!');
  }
  function spend(n) {
    if (points() < n) { toast('امتیاز کافی نداری — بازی کن و ردپا پیدا کن!'); return false; }
    setPoints(points() - n); return true;
  }
  function paintPoints(bump) {
    var el = $('#pointsVal'); if (!el) return;
    el.textContent = fa(points());
    if (bump) { var c = $('#pointsChip'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
  }
  function isLocked(a) { return (X.locks || []).indexOf(a.id) > -1 && progress.unlocked.indexOf(a.id) === -1; }

  /* ---------------- toast / confetti ---------------- */
  var toastTimer;
  function toast(msg, ms) {
    var el = $('#toast'); if (!el) return;
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.classList.remove('show'); }, ms || 2400);
  }
  function confetti(n) {
    var layer = $('#confetti'); if (!layer) return;
    var colors = ['#0fbf9f', '#ff8a5c', '#4f8dfd', '#ffc94d', '#ef5d6b'];
    for (var i = 0; i < (n || 26); i++) {
      var d = document.createElement('i');
      d.className = 'conf';
      d.style.left = (Math.random() * 100) + 'vw';
      d.style.top = (-10 + Math.random() * 20) + 'px';
      d.style.background = colors[i % colors.length];
      d.style.animationDelay = (Math.random() * 0.4) + 's';
      layer.appendChild(d);
      setTimeout(function (el) { return function () { el.remove(); }; }(d), 2400);
    }
  }

  /* ---------------- modal ---------------- */
  var modal = $('#modal'), modalBody = $('#modal-body');
  function openModal(html, onMount) {
    if (!modal) return;
    modalBody.innerHTML = html;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (onMount) onMount(modalBody);
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    modalBody.innerHTML = '';
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]');
    if (!t) return;
    var act = t.getAttribute('data-act');
    if (act === 'modal-close') { closeModal(); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

  /* ---------------- audio ---------------- */
  var Audio2 = {
    el: null, music: null, currentId: null,
    init: function () {
      this.music = new Audio('assets/audio/music/lullaby.mp3');
      this.music.loop = true; this.music.volume = 0.25;
    },
    playAnimal: function (id) {
      var a = BY_ID.get(id); if (!a || !a.aud) { toast('برای این حیوان صدا ثبت نشده'); return; }
      if (this.el) { this.el.pause(); this.el = null; }
      var el = new Audio(audOf(a));
      el.volume = 0.9;
      this.el = el;
      el.play().catch(function () { toast('صدا پخش نشد'); });
      this.currentId = id;
      document.querySelectorAll('.sound-btn').forEach(function (b) {
        b.classList.toggle('playing', b.getAttribute('data-id') === id);
      });
      el.addEventListener('ended', function () {
        document.querySelectorAll('.sound-btn.playing').forEach(function (b) { b.classList.remove('playing'); });
      });
    },
    toggleMusic: function () {
      if (!this.music) return;
      if (this.music.paused) { this.music.play().catch(function () {}); settings.music = true; }
      else { this.music.pause(); settings.music = false; }
      saveSettings(); syncMusicBtn();
    }
  };
  function syncMusicBtn() { var b = $('#btnMusic'); if (b) b.classList.toggle('off', !settings.music); }

  /* ---------------- data helpers ---------------- */
  function animalsSorted() { return ANIMALS.slice().sort(function (a, b) { return a.id.localeCompare(b.id); }); }
  function pickDistractors(a, n) {
    var pool = ANIMALS.filter(function (x) { return x.id !== a.id; });
    var sameCat = pool.filter(function (x) { return x.cat === a.cat; });
    var out = sample(sameCat, n);
    if (out.length < n) out = out.concat(sample(pool.filter(function (x) { return out.indexOf(x) === -1; }), n - out.length));
    return out;
  }
  function animalCard(a, opts) {
    opts = opts || {};
    var locked = isLocked(a);
    return '' +
      '<a class="acard' + (locked ? ' locked' : '') + '" href="#/animal/' + esc(a.id) + '" data-lock="' + (locked ? '1' : '0') + '">' +
        '<div class="acard-img">' +
          '<img loading="lazy" src="' + esc(imgOf(a)) + '" alt="' + esc(a.fa) + '">' +
          (locked ? '<div class="lock-badge"><span>🔒</span></div><div class="lock-cost">💎 ' + fa(X.unlockCost || 30) + '</div>' : '') +
        '</div>' +
        '<div class="acard-body">' +
          '<p class="acard-name">' + esc(a.fa) + '</p>' +
          '<div class="acard-sub">' + esc(catLabel(a.cat)) + '</div>' +
        '</div>' +
      '</a>';
  }

  /* ---------------- views ---------------- */
  function viewHome() {
    var daily = progress.daily !== today();
    var featured = sample(ANIMALS, 8);
    var html = '' +
      '<section class="hero">' +
        '<span class="hero-badge">🐾 ' + fa(ANIMALS.length) + ' حیوان</span>' +
        '<h1>دنیای رسا ۲.۰</h1>' +
        '<p>صداهای واقعی، ردپاهای جادویی و بازی‌های شاد. هرجا ردپایی دیدی روش بزن تا حیوانش را کشف کنی و امتیاز بگیری!</p>' +
        '<div class="hero-actions">' +
          '<a class="btn btn-primary" href="#/animals">🐾 همه حیوانات</a>' +
          '<a class="btn btn-gold" href="#/locks">🔒 قفل‌ها</a>' +
          (daily ? '<button class="btn btn-ghost" id="dailyBtn">🎁 جایزه روزانه</button>' : '') +
        '</div>' +
        '<div class="hero-art">🦁</div>' +
      '</section>' +
      '<section class="section">' +
        '<div class="quick">' +
          '<a class="qa" href="#/animals"><span class="qa-ico tone-mint">🔊</span><span><strong>صداها</strong><small>صداهای درست حیوانات</small></span></a>' +
          '<a class="qa" href="#/games"><span class="qa-ico tone-sky">🎮</span><span><strong>بازی‌ها</strong><small>کوییز، حافظه و ردپا</small></span></a>' +
          '<a class="qa" href="#/songs"><span class="qa-ico tone-coral">🎵</span><span><strong>آهنگ‌ها</strong><small>ملودی‌های آرام</small></span></a>' +
          '<a class="qa" href="#/videos"><span class="qa-ico tone-gold">🎬</span><span><strong>ویدیوها</strong><small>کلیپ کوتاه حیوانات</small></span></a>' +
        '</div>' +
      '</section>' +
      '<section class="section">' +
        '<div class="section-head"><h2 class="section-title">🐾 پیشنهاد برای تو</h2><a class="section-link" href="#/animals">همه</a></div>' +
        '<div class="grid">' + featured.map(function (a) { return animalCard(a); }).join('') + '</div>' +
      '</section>';
    return html;
  }

  function viewAnimals(state) {
    state = state || {};
    var q = (state.q || '').trim();
    var cat = state.cat || 'all';
    var list = animalsSorted();
    if (cat !== 'all') list = list.filter(function (a) { return a.cat === cat; });
    if (q) list = list.filter(function (a) { return (a.fa + ' ' + a.en).toLowerCase().indexOf(q.toLowerCase()) > -1; });
    var chips = '<div class="chips">' +
      '<button class="chip' + (cat === 'all' ? ' active' : '') + '" data-cat="all">همه</button>' +
      CATS.map(function (c) { return '<button class="chip' + (cat === c.key ? ' active' : '') + '" data-cat="' + esc(c.key) + '">' + esc(c.icon || '') + ' ' + esc(c.label) + '</button>'; }).join('') +
      '</div>';
    return '' +
      '<section class="section">' +
        '<div class="searchbar"><span>🔎</span><input id="q" type="search" placeholder="اسم حیوان را بنویس..." value="' + esc(q) + '" autocomplete="off"></div>' +
        chips +
        '<div class="grid" id="animalGrid">' + (list.length ? list.map(function (a) { return animalCard(a); }).join('') : '<div class="empty"><div class="e-ico">🔍</div>چیزی پیدا نشد</div>') + '</div>' +
      '</section>';
  }

  function viewLocks() {
    var lockedIds = (X.locks || []);
    var locked = lockedIds.map(function (id) { return BY_ID.get(id); }).filter(Boolean);
    var mine = locked.filter(function (a) { return progress.unlocked.indexOf(a.id) > -1; });
    return '' +
      '<section class="section">' +
        '<div class="lock-hero"><span class="lh-ico">🔒</span><div><strong>قفل‌های جایزه‌ای</strong><small>با امتیاز باز کن — هر قفل یک حیوان ویژه یا سورپرایز دارد. امتیاز از بازی‌ها و ردپاها جمع می‌شود.</small></div></div>' +
        '<div class="section-head"><h2 class="section-title">🔓 باز شده‌ها (' + fa(mine.length) + ')</h2></div>' +
        '<div class="grid">' + (mine.length ? mine.map(function (a) { return animalCard(a); }).join('') : '<div class="empty"><div class="e-ico">🗝️</div>هنوز قفلی باز نکردی</div>') + '</div>' +
        '<div class="section-head" style="margin-top:24px"><h2 class="section-title">🔒 قفل‌ها</h2></div>' +
        '<div class="grid">' + locked.filter(function (a) { return progress.unlocked.indexOf(a.id) === -1; }).map(function (a) { return animalCard(a); }).join('') + '</div>' +
        '<div class="lock-hero" style="margin-top:18px"><span class="lh-ico">🎁</span><div><strong>جعبه سورپرایز</strong><small>۲۰ امتیاز بده و یک جایزه تصادفی بگیر (امتیاز یا باز شدن یک قفل).</small></div><button class="btn btn-gold" id="chestBtn" style="margin-inline-start:auto">باز کن</button></div>' +
      '</section>';
  }

  function viewSongs() {
    var songs = X.songs || [];
    return '' +
      '<section class="section">' +
        '<div class="section-head"><h2 class="section-title">🎵 آهنگ‌های آرام</h2></div>' +
        '<div class="song-list">' + songs.map(function (s) {
          return '<div class="song" data-song="' + esc(s.id) + '">' +
            '<span class="s-ico">' + esc(s.emoji || '🎵') + '</span>' +
            '<div class="s-meta"><div class="s-title">' + esc(s.title) + '</div><div class="s-sub">' + esc(s.sub || '') + '</div></div>' +
            '<audio controls preload="none" src="' + esc(s.src) + '"></audio>' +
          '</div>';
        }).join('') + '</div>' +
        '<p class="m-note">این ملودی‌ها اختصاصی برای دنیای رسا ساخته شده‌اند و رایگان هستند.</p>' +
      '</section>';
  }

  function viewVideos() {
    var vids = X.videos || [];
    return '' +
      '<section class="section">' +
        '<div class="section-head"><h2 class="section-title">🎬 ویدیوهای کوتاه</h2></div>' +
        '<div class="vgrid">' + vids.map(function (v) {
          var a = BY_ID.get(v.animalId) || {};
          return '<div class="vcard" data-video="' + esc(v.id) + '">' +
            '<img loading="lazy" src="' + esc(imgOf(a)) + '" alt="' + esc(v.title) + '">' +
            '<div class="v-play">▶️</div><div class="v-title">' + esc(v.title) + '</div></div>';
        }).join('') + '</div>' +
      '</section>';
  }

  function viewGames() {
    return '' +
      '<section class="section">' +
        '<div class="games-grid">' +
          '<div class="game-card"><span class="g-ico">🔊</span><h3>صدای کی بود؟</h3><p>صدای یک حیوان پخش می‌شود؛ از بین ۴ گزینه درست را انتخاب کن. هر پاسخ درست ۵ امتیاز.</p><button class="btn btn-primary" data-game="sound">شروع</button></div>' +
          '<div class="game-card"><span class="g-ico">🐾</span><h3>ردپا را پیدا کن</h3><p>ردپای نشان‌داده‌شده مال کدام حیوان است؟ هر پاسخ درست ۵ امتیاز.</p><button class="btn btn-primary" data-game="fp">شروع</button></div>' +
          '<div class="game-card"><span class="g-ico">🧠</span><h3>حافظه حیوانات</h3><p>کارت‌ها را برگردان و جفت‌ها را پیدا کن. هر برد ۱۰ امتیاز.</p><button class="btn btn-primary" data-game="memory">شروع</button></div>' +
        '</div>' +
      '</section>';
  }

  function viewAnimal(id) {
    var a = BY_ID.get(id);
    if (!a) return '<div class="empty"><div class="e-ico">🐾</div>حیوان پیدا نشد</div>';
    var locked = isLocked(a);
    return '<section class="section">' + animalModalHtml(a, locked) + '</section>';
  }

  function animalModalHtml(a, locked) {
    var facts = [];
    if (a.habitat) facts.push('🏡 ' + a.habitat);
    if (a.diet) facts.push('🍽️ ' + a.diet);
    if (a.size) facts.push('📏 ' + a.size);
    if (a.move) facts.push('🏃 ' + a.move);
    if (a.sound) facts.push('🔊 ' + a.sound);
    return '<div class="m-hero"><img src="' + esc(fullImg(a)) + '" alt="' + esc(a.fa) + '">' +
      '<div><h2 class="m-title">' + esc(a.fa) + '</h2><div class="m-sub">' + esc(a.en || '') + ' — ' + esc(catLabel(a.cat)) + '</div></div></div>' +
      '<div class="m-tags">' + facts.map(function (f) { return '<span class="tag">' + esc(f) + '</span>'; }).join('') + '</div>' +
      (a.fact ? '<div class="m-fact">💡 ' + esc(a.fact) + '</div>' : '') +
      (locked ? '<div class="m-fact">🔒 این حیوان قفل است. با ' + fa(X.unlockCost || 30) + ' امتیاز بازش کن.</div>' : '') +
      '<div class="m-actions">' +
        (a.aud ? '<button class="btn btn-primary sound-btn" data-id="' + esc(a.id) + '">🔊 پخش صدای واقعی</button>' : '<span class="tag">🔇 صدای ثبت‌شده ندارد</span>') +
        (locked ? '<button class="btn btn-gold" data-unlock="' + esc(a.id) + '">🔓 باز کن (' + fa(X.unlockCost || 30) + '💎)</button>' : '') +
        '<button class="btn btn-ghost" data-fav="' + esc(a.id) + '">' + (progress.favorites.indexOf(a.id) > -1 ? '💛 علاقه‌مندی' : '🤍 افزودن') + '</button>' +
        '<a class="btn btn-ghost" href="#/animals">بازگشت</a>' +
      '</div>';
  }

  /* ---------------- router ---------------- */
  var app = $('#app');
  var routeState = { q: '', cat: 'all' };

  function route() {
    var h = location.hash.replace(/^#\/?/, '') || 'home';
    var parts = h.split('/');
    var page = parts[0] || 'home';
    var html = '';
    if (page === 'animals') html = viewAnimals(routeState);
    else if (page === 'locks') html = viewLocks();
    else if (page === 'songs') html = viewSongs();
    else if (page === 'videos') html = viewVideos();
    else if (page === 'games') html = viewGames();
    else if (page === 'animal') html = viewAnimal(parts[1] || '');
    else html = viewHome();
    app.innerHTML = html;
    // tabs
    $$('#tabs a').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-tab') === (page === 'animal' ? 'animals' : page));
    });
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    if (page === 'animals') {
      var q = $('#q');
      if (q) {
        q.addEventListener('input', function () {
          routeState.q = q.value;
          var grid = $('#animalGrid');
          var list = animalsSorted().filter(function (a) {
            var okCat = routeState.cat === 'all' || a.cat === routeState.cat;
            var okQ = !routeState.q || (a.fa + ' ' + a.en).toLowerCase().indexOf(routeState.q.toLowerCase()) > -1;
            return okCat && okQ;
          });
          grid.innerHTML = list.length ? list.map(function (a) { return animalCard(a); }).join('') : '<div class="empty"><div class="e-ico">🔍</div>چیزی پیدا نشد</div>';
        });
      }
      $$('.chip').forEach(function (c) {
        c.addEventListener('click', function () { routeState.cat = c.getAttribute('data-cat'); route(); });
      });
    }
    if (page === 'home') {
      var db = $('#dailyBtn');
      if (db) db.addEventListener('click', claimDaily);
    }
    if (page === 'locks') {
      var cb = $('#chestBtn');
      if (cb) cb.addEventListener('click', openChest);
    }
    if (page === 'animal') {
      var a = BY_ID.get(parts[1]);
      if (a) setTimeout(function () { if (isLocked(a)) toast('این حیوان قفل است 🔒'); }, 300);
    }
  }

  function claimDaily() {
    if (progress.daily === today()) { toast('جایزه امروز را گرفتی — فردا برگرد'); return; }
    progress.daily = today();
    addPoints(X.dailyBonus || 15);
    confetti(30);
    route();
  }

  function openChest() {
    if (!spend(20)) return;
    if (Math.random() < 0.45) {
      var locked = (X.locks || []).filter(function (id) { return progress.unlocked.indexOf(id) === -1; });
      if (locked.length) {
        var pick = locked[Math.floor(Math.random() * locked.length)];
        progress.unlocked.push(pick);
        saveProgress();
        var a = BY_ID.get(pick);
        confetti(40);
        openModal('<h2 class="m-title">🎉 قفل باز شد!</h2><p class="m-sub">' + esc(a ? a.fa : '') + ' به مجموعه‌ات اضافه شد.</p><div class="modal-actions"><button class="btn btn-primary" data-act="modal-close">عالی!</button></div>');
        return;
      }
    }
    var bonus = 10 + Math.floor(Math.random() * 21);
    addPoints(bonus);
    confetti(26);
    toast('🎁 ' + fa(bonus) + ' امتیاز از جعبه!');
  }

  /* ---------------- unlock / fav / sound ---------------- */
  document.addEventListener('click', function (e) {
    var u = e.target.closest('[data-unlock]');
    if (u) {
      var id = u.getAttribute('data-unlock');
      if (progress.unlocked.indexOf(id) > -1) return;
      var cost = X.unlockCost || 30;
      if (!spend(cost)) return;
      progress.unlocked.push(id); saveProgress();
      var a = BY_ID.get(id);
      confetti(34);
      openModal(animalModalHtml(a, false), function (body) {
        body.querySelector('.sound-btn') && body.querySelector('.sound-btn').addEventListener('click', function () { Audio2.playAnimal(id); });
      });
      toast('🔓 باز شد: ' + (a ? a.fa : ''));
      if (location.hash.indexOf('locks') > -1) route();
      return;
    }
    var f = e.target.closest('[data-fav]');
    if (f) {
      var fid = f.getAttribute('data-fav');
      var i = progress.favorites.indexOf(fid);
      if (i > -1) progress.favorites.splice(i, 1); else progress.favorites.push(fid);
      saveProgress(); toast(i > -1 ? 'از علاقه‌مندی‌ها حذف شد' : 'به علاقه‌مندی‌ها اضافه شد');
      route();
      return;
    }
    var s = e.target.closest('.sound-btn');
    if (s) { Audio2.playAnimal(s.getAttribute('data-id')); return; }
    var v = e.target.closest('[data-video]');
    if (v) { playVideo(v.getAttribute('data-video')); return; }
  });

  function playVideo(id) {
    var v = (X.videos || []).filter(function (x) { return x.id === id; })[0];
    if (!v) return;
    openModal('<h2 class="m-title">' + esc(v.title) + '</h2>' +
      '<video src="' + esc(v.src) + '" controls autoplay playsinline style="width:100%;border-radius:18px;margin-top:10px;background:#000"></video>' +
      '<div class="modal-actions"><button class="btn btn-ghost" data-act="modal-close">بستن</button></div>');
  }

  /* ---------------- footprints easter egg ---------------- */
  var fpTimer = null, fpCount = 0;
  var FP_ICONS = ['🐾', '🐾', '🐾', '👣'];
  function spawnFootprint() {
    var layer = $('#fpLayer'); if (!layer) return;
    if (settings.reduceMotion) return;
    var el = document.createElement('button');
    el.className = 'fp';
    el.type = 'button';
    el.textContent = FP_ICONS[Math.floor(Math.random() * FP_ICONS.length)];
    var x = 6 + Math.random() * 86, y = 12 + Math.random() * 76;
    el.style.left = x + 'vw'; el.style.top = y + 'vh';
    el.style.setProperty('--rot', (Math.random() * 70 - 35).toFixed(0) + 'deg');
    var gold = Math.random() < 0.22;
    if (gold) { el.classList.add('gold'); el.innerHTML = '🐾<span class="fp-dot"></span>'; }
    el.addEventListener('click', function (ev) {
      ev.stopPropagation();
      el.remove();
      footprintQuiz(gold);
    });
    layer.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('show'); });
    setTimeout(function () { el.classList.remove('show'); setTimeout(function () { el.remove(); }, 400); }, gold ? 20000 : 14000);
    fpCount++;
  }
  function startFootprints() {
    if (fpTimer) return;
    var every = X.footprintIntervalMs || 11000;
    setTimeout(spawnFootprint, 3200);
    fpTimer = setInterval(spawnFootprint, every);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) spawnFootprint(); });
    // first interaction also drops a footprint (visible tab may start hidden in some browsers)
    var once = function () { spawnFootprint(); window.removeEventListener('scroll', once); window.removeEventListener('click', once); };
    window.addEventListener('scroll', once, { passive: true });
    window.addEventListener('click', once);
    window.__rasaSpawnFP = spawnFootprint; // test hook
  }
  function footprintQuiz(gold) {
    var pool = ANIMALS.filter(function (a) { return true; });
    var a = pool[Math.floor(Math.random() * pool.length)];
    if (gold && points() < 20) {
      openModal('<h2 class="m-title">✨ ردپای طلایی</h2><p class="m-sub">برای باز کردن گنجش ۲۰ امتیاز لازم داری. الان ' + fa(points()) + ' امتیاز داری.</p><div class="modal-actions"><button class="btn btn-ghost" data-act="modal-close">باشه</button></div>');
      return;
    }
    var wrong = pickDistractors(a, 3);
    var opts = shuffle([a].concat(wrong));
    var label = (window.RASA_DATA.fpLabels || {})[a.fp] || 'ردپا';
    openModal('<div class="quiz-box">' +
      '<div class="quiz-sound">' + (a.fp && D.fpLabels && D.fpLabels[a.fp] ? '🐾' : '👣') + '</div>' +
      '<h2 class="m-title" style="text-align:center">این ردپا مال کیه؟</h2>' +
      '<p class="m-sub" style="text-align:center">' + esc(label) + (gold ? ' — جایزه طلایی! 🏆' : '') + '</p>' +
      '<div class="quiz-actions" id="fpOpts">' + opts.map(function (o) {
        return '<button class="quiz-option" data-fp-opt="' + esc(o.id) + '">' + esc(o.fa) + '</button>';
      }).join('') + '</div>' +
      '<div class="quiz-score" id="fpScore">درست بزنی ۵ امتیاز' + (gold ? ' + جایزه ویژه' : '') + ' می‌گیری</div>' +
      '</div>', function (body) {
        body.querySelectorAll('[data-fp-opt]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var ok = btn.getAttribute('data-fp-opt') === a.id;
            if (ok) {
              btn.classList.add('right');
              progress.fpFound = (progress.fpFound || 0) + 1;
              addPoints(5);
              if (gold) { var bonus = 10 + Math.floor(Math.random() * 11); addPoints(bonus); }
              confetti(28);
              var bodyEl = $('#modal-body');
              bodyEl.innerHTML = '<div class="m-hero"><img src="' + esc(imgOf(a)) + '" alt=""><div><h2 class="m-title">آفرین!</h2><div class="m-sub">' + esc(a.fa) + ' درست بود.</div></div></div>' +
                '<div class="m-fact">💡 ' + esc(a.fact || '') + '</div>' +
                '<div class="m-actions">' + (a.aud ? '<button class="btn btn-primary sound-btn" data-id="' + esc(a.id) + '">🔊 صدایش را بشنو</button>' : '') + '<button class="btn btn-ghost" data-act="modal-close">باشه</button></div>';
            } else {
              btn.classList.add('wrong');
              progress.quizWrong = (progress.quizWrong || 0) + 1;
              saveProgress();
              setTimeout(function () { btn.classList.remove('wrong'); }, 500);
            }
          });
        });
      });
  }

  /* ---------------- settings ---------------- */
  function openSettings() {
    openModal('<h2 class="m-title">⚙️ تنظیمات</h2>' +
      '<div class="song-list" style="margin-top:14px">' +
        settingRow('music', '🎵 موسیقی پس‌زمینه', settings.music) +
        settingRow('sfx', '🔊 افکت‌های صوتی', settings.sfx) +
        settingRow('reduceMotion', '🌀 کاهش انیمیشن', settings.reduceMotion) +
        settingRow('hints', '💡 راهنماها', settings.hints) +
      '</div>' +
      '<div class="m-actions" style="margin-top:16px">' +
        '<button class="btn btn-danger" id="resetProg">♻️ ریست پیشرفت</button>' +
        '<a class="btn btn-ghost" href="admin.html">🛠️ پنل مدیریت</a>' +
        '<button class="btn btn-ghost" data-act="modal-close">بستن</button>' +
      '</div>', function (body) {
        body.querySelectorAll('[data-set]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var k = btn.getAttribute('data-set');
            settings[k] = !settings[k];
            saveSettings();
            btn.textContent = settings[k] ? 'روشن' : 'خاموش';
            btn.classList.toggle('btn-primary', settings[k]);
            btn.classList.toggle('btn-ghost', !settings[k]);
            if (k === 'music') { if (settings.music) Audio2.music.play().catch(function(){}); else Audio2.music.pause(); syncMusicBtn(); }
          });
        });
        var rp = body.querySelector('#resetProg');
        if (rp) rp.addEventListener('click', function () {
          if (!confirm('همه امتیازها و قفل‌ها پاک شود؟')) return;
          progress = Object.assign({}, DEF_PROG);
          saveProgress(); paintPoints(true); closeModal(); route(); toast('پیشرفت ریست شد');
        });
      });
  }
  function settingRow(key, label, on) {
    return '<div class="song"><span class="s-ico">' + label.split(' ')[0] + '</span><div class="s-meta"><div class="s-title">' + label.replace(/^\S+\s/, '') + '</div></div>' +
      '<button class="btn btn-sm ' + (on ? 'btn-primary' : 'btn-ghost') + '" data-set="' + key + '">' + (on ? 'روشن' : 'خاموش') + '</button></div>';
  }

  /* ---------------- boot ---------------- */
  function boot() {
    Audio2.init();
    paintPoints(false);
    syncMusicBtn();
    route();
    startFootprints();
    setTimeout(function () { var sp = $('#splash'); if (sp) sp.classList.add('hide'); }, 650);
    $('#btnMusic') && $('#btnMusic').addEventListener('click', function () { Audio2.toggleMusic(); });
    $('#btnSettings') && $('#btnSettings').addEventListener('click', openSettings);
    $('#pointsChip') && $('#pointsChip').addEventListener('click', function () {
      openModal('<h2 class="m-title">💎 امتیازهای تو</h2><div class="m-fact">امتیاز فعلی: <b>' + fa(points()) + '</b><br>ردپاهای پیدا شده: ' + fa(progress.fpFound || 0) + '<br>پاسخ درست: ' + fa(progress.quizRight || 0) + '</div><div class="m-actions"><a class="btn btn-gold" href="#/locks">🔒 خرج کردن برای قفل‌ها</a><button class="btn btn-ghost" data-act="modal-close">بستن</button></div>');
    });
    window.addEventListener('hashchange', route);
    // daily bonus prompt
    if (progress.daily !== today()) setTimeout(function () { toast('🎁 جایزه روزانه‌ات آماده است — از خانه بگیر'); }, 2500);
    // expose for games.js
    window.RASA_APP = {
      addPoints: addPoints, spend: spend, points: points, toast: toast, confetti: confetti,
      openModal: openModal, closeModal: closeModal, esc: esc, fa: fa, shuffle: shuffle, sample: sample,
      ANIMALS: ANIMALS, BY_ID: BY_ID, imgOf: imgOf, fullImg: fullImg, catLabel: catLabel,
      pickDistractors: pickDistractors, playAnimal: Audio2.playAnimal.bind(Audio2),
      progress: function () { return progress; }, saveProgress: saveProgress
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
