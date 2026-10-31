/* دنیای رسا ۲.۰ — games */
(function () {
  'use strict';
  var A = null;
  function app() { return window.RASA_APP; }

  function startSoundQuiz() {
    var a = app(); if (!a) return;
    var pool = a.ANIMALS.filter(function (x) { return x.aud; });
    if (!pool.length) { a.toast('صدایی برای بازی موجود نیست'); return; }
    var animal = pool[Math.floor(Math.random() * pool.length)];
    var opts = a.shuffle([animal].concat(a.pickDistractors(animal, 3)));
    var html = '<div class="quiz-box">' +
      '<div class="quiz-sound">🔊</div>' +
      '<h2 class="m-title" style="text-align:center">این صدای کدام حیوان است؟</h2>' +
      '<div class="quiz-actions">' + opts.map(function (o) {
        return '<button class="quiz-option" data-sq="' + a.esc(o.id) + '">' + a.esc(o.fa) + '</button>';
      }).join('') + '</div>' +
      '<div class="quiz-actions" style="margin-top:4px">' +
        '<button class="btn btn-primary" id="replaySound">🔁 پخش دوباره</button>' +
        '<button class="btn btn-ghost" id="nextSound">سؤال بعدی</button>' +
      '</div>' +
      '<div class="quiz-score" id="sqScore">درست = ۵ امتیاز</div>' +
      '</div>';
    a.openModal(html, function (body) {
      var play = function () { a.playAnimal(animal.id); };
      setTimeout(play, 250);
      body.querySelector('#replaySound').addEventListener('click', play);
      body.querySelector('#nextSound').addEventListener('click', startSoundQuiz);
      body.querySelectorAll('[data-sq]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var ok = btn.getAttribute('data-sq') === animal.id;
          if (ok) {
            btn.classList.add('right');
            a.addPoints(5);
            a.confetti(20);
            var p = a.progress(); p.quizRight = (p.quizRight || 0) + 1; a.saveProgress();
            body.querySelector('#sqScore').textContent = 'آفرین! درست بود — ۵ امتیاز گرفتی 🎉';
            setTimeout(startSoundQuiz, 900);
          } else {
            btn.classList.add('wrong');
            var p2 = a.progress(); p2.quizWrong = (p2.quizWrong || 0) + 1; a.saveProgress();
            setTimeout(function () { btn.classList.remove('wrong'); }, 500);
          }
        });
      });
    });
  }

  function startFpQuiz() {
    var a = app(); if (!a) return;
    var pool = a.ANIMALS.filter(function (x) { return x.fp; });
    var animal = pool[Math.floor(Math.random() * pool.length)];
    var wrong = a.pickDistractors(animal, 3);
    var opts = a.shuffle([animal].concat(wrong));
    var label = (window.RASA_DATA.fpLabels || {})[animal.fp] || 'ردپا';
    a.openModal('<div class="quiz-box">' +
      '<div class="quiz-sound">🐾</div>' +
      '<h2 class="m-title" style="text-align:center">صاحب این ردپا کیست؟</h2>' +
      '<p class="m-sub" style="text-align:center">' + a.esc(label) + '</p>' +
      '<div class="quiz-actions">' + opts.map(function (o) {
        return '<button class="quiz-option" data-fq="' + a.esc(o.id) + '">' + a.esc(o.fa) + '</button>';
      }).join('') + '</div>' +
      '<div class="quiz-actions" style="margin-top:4px"><button class="btn btn-ghost" id="nextFp">ردپای بعدی</button></div>' +
      '<div class="quiz-score">درست = ۵ امتیاز</div></div>', function (body) {
      body.querySelector('#nextFp').addEventListener('click', startFpQuiz);
      body.querySelectorAll('[data-fq]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (btn.getAttribute('data-fq') === animal.id) {
            btn.classList.add('right');
            a.addPoints(5); a.confetti(20);
            setTimeout(startFpQuiz, 800);
          } else {
            btn.classList.add('wrong');
            setTimeout(function () { btn.classList.remove('wrong'); }, 500);
          }
        });
      });
    });
  }

  function startMemory() {
    var a = app(); if (!a) return;
    var pool = a.sample(a.ANIMALS, 6);
    var deck = [];
    pool.forEach(function (x) { deck.push({ id: x.id, a: x }); deck.push({ id: x.id, a: x }); });
    deck = a.shuffle(deck);
    var state = { open: [], done: 0, lock: false };
    var html = '<h2 class="m-title" style="text-align:center">🧠 حافظه حیوانات</h2>' +
      '<p class="m-sub" style="text-align:center">جفت‌ها را پیدا کن — هر برد ۱۰ امتیاز</p>' +
      '<div class="memory-grid" id="memGrid" style="margin-top:12px">' + deck.map(function (c, i) {
        return '<button class="mem-card" data-mem="' + i + '" aria-label="کارت"></button>';
      }).join('') + '</div>' +
      '<div class="quiz-score" id="memScore">۰ از ۶ جفت</div>';
    a.openModal(html, function (body) {
      var cards = body.querySelectorAll('[data-mem]');
      cards.forEach(function (card) {
        card.addEventListener('click', function () {
          if (state.lock || card.classList.contains('done') || card.classList.contains('flip')) return;
          var i = +card.getAttribute('data-mem');
          var item = deck[i];
          card.classList.add('flip');
          card.innerHTML = '<img src="' + a.esc(a.imgOf(item.a)) + '" alt="' + a.esc(item.a.fa) + '">';
          state.open.push({ card: card, i: i });
          if (state.open.length === 2) {
            var [x, y] = state.open;
            state.open = [];
            if (deck[x.i].id === deck[y.i].id) {
              x.card.classList.add('done'); y.card.classList.add('done');
              state.done++;
              body.querySelector('#memScore').textContent = a.fa(state.done) + ' از ۶ جفت';
              a.addPoints(2);
              if (state.done === 6) {
                a.addPoints(8); a.confetti(40);
                setTimeout(function () {
                  a.openModal('<h2 class="m-title">🎉 برنده شدی!</h2><p class="m-sub">همه جفت‌ها را پیدا کردی — ۱۰ امتیاز کامل گرفتی.</p><div class="modal-actions"><button class="btn btn-primary" id="againMem">بازی دوباره</button><button class="btn btn-ghost" id="closeMem">بستن</button></div>', function (b2) {
                    b2.querySelector('#againMem').addEventListener('click', startMemory);
                    b2.querySelector('#closeMem').addEventListener('click', a.closeModal);
                  });
                }, 500);
              }
            } else {
              state.lock = true;
              setTimeout(function () {
                x.card.classList.remove('flip'); x.card.innerHTML = '';
                y.card.classList.remove('flip'); y.card.innerHTML = '';
                state.lock = false;
              }, 650);
            }
          }
        });
      });
    });
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-game]');
    if (!b) return;
    var g = b.getAttribute('data-game');
    if (g === 'sound') startSoundQuiz();
    else if (g === 'fp') startFpQuiz();
    else if (g === 'memory') startMemory();
  });

  window.RASA_GAMES = { sound: startSoundQuiz, fp: startFpQuiz, memory: startMemory };
})();
