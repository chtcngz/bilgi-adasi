// Balon sorusu (English for Kids): a picture with an empty speech bubble and three English cards under it; the child drags the
// card that the person would say into the bubble. englishBalon.oyna(c) plays a row of such questions:
//   c = { stage, sorular: [q], maskot, sonuc(q, ilkDenemede), bitti() }
//   q = { s: Turkish question, a: [right, wrong, wrong], b: explanation, k: [English, Türkçe],
//         balon: { resim (assets/images/english/soru/<resim>.webp), x, y, w, h (the bubble, in % of the picture) } }
// Tapping a card says its English (the recorded voice when there is one, else the device's en-US voice, slowly). A card dropped
// on or near the bubble snaps into it: the right one stays there (the others fade, stars, the word said again, Sonraki Soru ▶);
// a wrong one shakes and slides back. Pointer Events, so mouse, touch and pen work alike. A question counts as right only when
// the first card dropped was the right one (sonuc); the child tries until it is right.
const englishBalon = (() => {
  const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const RESIM = name => 'assets/images/english/soru/' + name + '.webp?v=2';
  const shuffled = list => { const r = [...list]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const COLOURS = ['#ff8a5c', '#5cb8ff', '#b07cff', '#3fc28a', '#ffb703', '#ff6b9a'];

  /* ---------- the voice ---------- */
  function enUS() {
    const voices = window.speechSynthesis?.getVoices() || [];
    const us = voices.filter(v => /^en[-_]us/i.test(v.lang)), en = voices.filter(v => /^en[-_]/i.test(v.lang));
    const score = v => (/natural|neural|enhanced|premium|siri|google/i.test(v.name) ? 2 : 0);
    return [...us].sort((a, b) => score(b) - score(a))[0] || en[0] || null;
  }
  window.speechSynthesis?.getVoices();
  function say(text) {
    if (typeof ingilizceSes !== 'undefined' && ingilizceSes.kayitli(text)) return ingilizceSes.say(text);
    if (typeof ingilizceSes !== 'undefined') ingilizceSes.stop();
    const speech = window.speechSynthesis;
    if (!speech) return Promise.resolve();
    speech.cancel();
    return new Promise(resolve => {
      const line = new SpeechSynthesisUtterance(text);
      line.lang = 'en-US';
      const voice = enUS();
      if (voice) line.voice = voice;
      line.rate = 0.75;
      line.onend = line.onerror = () => resolve();
      speech.speak(line);
      setTimeout(resolve, 4000);
    });
  }
  const sus = () => { window.speechSynthesis?.cancel(); if (typeof ingilizceSes !== 'undefined') ingilizceSes.stop(); };

  // the question text in two parts: the scene ("Ela okuldan eve geldi. Annesi onu kapıda karşılıyor.") and the question
  // asked of the child, its last sentence ("Annesi ne der?")
  function parcala(text) {
    const m = String(text).match(/^(.*[.!…])\s+([^.!…]+\?)$/);
    return m ? { durum: m[1], soru: m[2] } : { durum: '', soru: String(text) };
  }
  // every copy of a card left on the screen (a drag the browser cut short, a question left in the middle of an animation)
  function temizle() {
    for (const g of document.querySelectorAll('.eb-surukle')) { g.getAnimations().forEach(a => a.cancel()); g.remove(); }
  }

  /* ---------- a row of questions ---------- */
  function oyna(c) {
    const live = { on: true };
    let at = 0, token = 0;
    const cleanups = [];   // a question's pending drag, ended when the next question comes or the round closes
    const next = () => { if (!live.on) return; if (at < c.sorular.length) soru(c.sorular[at++]); else c.bitti(); };
    function soru(q) {
      // a new question starts clean: no copy of an old card, no animation and no drag of the question before
      while (cleanups.length) cleanups.pop()();
      temizle();
      const mine = ++token, stale = () => mine !== token || !live.on;
      let busy = false;
      const total = c.sorular.length, n = at, metin = parcala(q.s);
      const b = q.balon;
      c.stage.innerHTML = '<div class="eb">' +
        '<div class="eb-ust"><span class="eb-maskot" aria-hidden="true">' + esc(c.maskot || '🦊') + '</span>' +
        '<span class="eb-sayi" aria-label="' + n + ' / ' + total + '">' + Array.from({ length: total }, (_, i) => '<i class="' + (i < n - 1 ? 'done' : i === n - 1 ? 'now' : '') + '"></i>').join('') + '</span></div>' +
        // the story in a box of its own, the question under it as its own coral label
        '<div class="eb-metin" id="eng1-prompt" tabindex="-1">' +
        (metin.durum ? '<div class="eb-hikaye"><span class="eb-metin-simge" aria-hidden="true">📖</span><p class="eb-durum">' + esc(metin.durum) + '</p></div>' : '') +
        '<h2 class="eb-soru"><span>' + esc(metin.soru) + '</span></h2></div>' +
        // the picture takes the room left between the story card and the cards (fit(), below), never more
        '<div class="eb-sahne-alan"><div class="eb-sahne"><img src="' + esc(RESIM(b.resim)) + '" alt="" draggable="false">' +
        '<div class="eb-balon" style="left:' + b.x + '%;top:' + b.y + '%;width:' + b.w + '%;height:' + b.h + '%"><span class="eb-soru-isareti" aria-hidden="true">?</span></div></div></div>' +
        '<div class="eb-dip"><div class="eb-kartlar" role="group" aria-label="Şıklar"></div><div class="eb-alt"></div></div></div>';
      const root = c.stage.querySelector('.eb'), zone = root.querySelector('.eb-balon'), cards = root.querySelector('.eb-kartlar'), alt = root.querySelector('.eb-alt');
      // The whole question fits the screen with no scrolling (a drag must never move the page): the picture is as large as the
      // room left by the top row, the story, the question and the cards allows, keeping its shape so the bubble stays on it.
      // The picture does not stretch its own box: the story, the picture and the cards stay close together, and any room
      // left over goes under the cards (balon-sorusu.css), never between them.
      const area = root.querySelector('.eb-sahne-alan'), scene = root.querySelector('.eb-sahne'), img = scene.querySelector('img');
      const others = ['.eb-ust', '.eb-metin', '.eb-dip'].map(sel => root.querySelector(sel));
      const fit = () => {
        const ratio = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1.5;
        const cs = getComputedStyle(root), gap = parseFloat(cs.rowGap) || 0;
        const room = root.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - others.reduce((sum, el) => sum + el.offsetHeight, 0) - gap * 3;
        const w = Math.max(80, Math.min(root.clientWidth, Math.max(60, room) * ratio));
        scene.style.width = Math.floor(w) + 'px';
      };
      const watch = new ResizeObserver(fit);
      for (const el of [root, ...others]) watch.observe(el);
      img.addEventListener('load', fit);
      fit();
      cleanups.push(() => watch.disconnect());
      const mascot = root.querySelector('.eb-maskot');
      let solved = false, first = true;
      const colours = shuffled(COLOURS);
      // the bubble glows in the cards' colours, in their order on the screen (balon-sorusu.css, eb-dongu)
      colours.slice(0, 3).forEach((col, i) => zone.style.setProperty('--r' + (i + 1), col));
      shuffled(q.a).forEach((text, i) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'eb-kart';
        card.lang = 'en';
        card.textContent = text;
        card.style.setProperty('--renk', colours[i]);
        card.setAttribute('aria-label', text + ': dinlemek için dokun, cevap için balona sürükle');
        cards.append(card);
        drag(card, text);
      });

      // the bubble's rectangle on the screen, a little larger, so a card dropped near it still lands
      const near = (x, y) => {
        const r = zone.getBoundingClientRect(), m = Math.max(40, r.width * 0.35);
        return x > r.left - m && x < r.right + m && y > r.top - m && y < r.bottom + m;
      };
      // A drag is followed on the whole window (not only on the card), so the finger leaving the card, a lost pointer capture or
      // a touch the browser hands elsewhere still ends it; only one drag at a time, and none while a card is flying.
      let ending = null;
      function drag(card, text) {
        card.addEventListener('pointerdown', e => {
          if (solved || busy || ending || card.disabled || stale() || (e.pointerType === 'mouse' && e.button !== 0)) return;
          e.preventDefault();
          try { card.setPointerCapture(e.pointerId); } catch {}
          const id = e.pointerId, r = card.getBoundingClientRect();
          const start = { x: e.clientX, y: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top };
          let moved = false, ghost = null;
          const move = ev => {
            if (ev.pointerId !== id) return;
            if (!moved && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 8) return;
            if (!moved) {
              moved = true;
              // a copy follows the finger above everything; the card stays as an empty place
              ghost = card.cloneNode(true);
              ghost.classList.add('eb-surukle');
              Object.assign(ghost.style, { width: r.width + 'px', height: r.height + 'px' });
              c.stage.closest('dialog').append(ghost);
              card.classList.add('eb-bos');
              // while a card is held the bubble stops its colours and glows in the held card's colour
              zone.style.setProperty('--tut', card.style.getPropertyValue('--renk'));
              zone.classList.add('tutuluyor');
            }
            ghost.style.transform = 'translate(' + (ev.clientX - start.dx) + 'px,' + (ev.clientY - start.dy) + 'px) scale(1.08) rotate(-3deg)';
            zone.classList.toggle('yakin', near(ev.clientX, ev.clientY));
          };
          const off = () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
            window.removeEventListener('pointercancel', cancel);
            ending = null;
            zone.classList.remove('yakin', 'tutuluyor');
          };
          const up = ev => {
            if (ev.pointerId !== id) return;
            off();
            if (!moved) return tap(card, text);
            if (near(ev.clientX, ev.clientY)) drop(card, ghost, text); else back(card, ghost);
          };
          // the browser cut the drag short (a scroll, a call, the finger left the screen): the card goes home
          const cancel = ev => { if (ev.pointerId !== id) return; off(); if (moved) back(card, ghost); };
          ending = () => { off(); if (moved) back(card, ghost); };
          window.addEventListener('pointermove', move);
          window.addEventListener('pointerup', up);
          window.addEventListener('pointercancel', cancel);
        });
        // the keyboard: Enter or Space puts the card in the bubble
        card.addEventListener('keydown', e => {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
          if (!solved && !busy && !card.disabled) drop(card, null, text);
        });
        card.addEventListener('click', e => e.preventDefault());
      }
      cleanups.push(() => ending?.());
      function tap(card, text) {
        playCue('tap', { gain: 0.5 });
        card.classList.remove('eb-dokun');
        void card.offsetWidth;
        card.classList.add('eb-dokun');
        say(text);
      }
      // flies a card (or its copy) to a rectangle and resolves when it is there
      function fly(node, from, to, ms) {
        if (calm.matches || !node) return Promise.resolve();
        return node.animate([{ transform: 'translate(' + from.x + 'px,' + from.y + 'px) scale(' + (from.s || 1) + ')' },
          { transform: 'translate(' + to.x + 'px,' + to.y + 'px) scale(' + (to.s || 1) + ')' }], { duration: ms, easing: 'cubic-bezier(.3,1.3,.5,1)', fill: 'forwards' }).finished.catch(() => {});
      }
      // a card dropped away from the bubble slides back to its place
      async function back(card, ghost) {
        busy = true;
        if (ghost) {
          const g = ghost.getBoundingClientRect(), home = card.getBoundingClientRect();
          await fly(ghost, { x: g.left, y: g.top, s: 1.08 }, { x: home.left, y: home.top, s: 1 }, 300);
          ghost.remove();
        }
        card.classList.remove('eb-bos');
        busy = false;
      }
      async function drop(card, ghost, text) {
        busy = true;
        const z = zone.getBoundingClientRect();
        const right = text === q.a[0];
        if (ghost) {
          // the magnet: the copy slides to the middle of the bubble
          const g = ghost.getBoundingClientRect();
          await fly(ghost, { x: g.left, y: g.top, s: 1.08 }, { x: z.left + z.width / 2 - g.width / 2, y: z.top + z.height / 2 - g.height / 2, s: 0.9 }, 220);
        }
        if (stale()) { ghost?.remove(); return; }
        if (right) {
          ghost?.remove();
          card.classList.remove('eb-bos');
          win(card, text);
        } else {
          playCue('retry', { gain: 0.6 });
          if (first) { first = false; c.sonuc(q, false); }
          mascot.classList.remove('mutlu', 'uzgun'); void mascot.offsetWidth; mascot.classList.add('uzgun');
          if (ghost) {
            ghost.classList.add('eb-titre');
            await new Promise(r => setTimeout(r, calm.matches ? 0 : 420));
            if (stale()) { ghost.remove(); return; }
            const g = ghost.getBoundingClientRect(), home = card.getBoundingClientRect();
            await fly(ghost, { x: g.left, y: g.top, s: 0.9 }, { x: home.left, y: home.top, s: 1 }, 380);
            ghost.remove();
            card.classList.remove('eb-bos');
          } else {
            card.classList.remove('eb-titre'); void card.offsetWidth; card.classList.add('eb-titre');
          }
          busy = false;
        }
      }
      function win(card, text) {
        solved = true;
        if (first) c.sonuc(q, true);
        zone.innerHTML = '<span class="eb-cevap" lang="en">' + esc(text) + '</span>';
        zone.classList.add('dogru');
        // the word as large as fits the bubble, but never smaller than 14px: a small bubble gets a white label over it
        const word = zone.querySelector('.eb-cevap'), wide = zone.offsetWidth, high = zone.offsetHeight;
        for (let size = Math.min(30, high * 0.42); size >= 14; size -= 0.5) {
          word.style.fontSize = size + 'px';
          if (word.offsetWidth <= wide * 0.9) break;
        }
        for (const other of cards.children) { other.disabled = true; other.classList.add(other === card ? 'eb-secildi' : 'eb-pasif'); }
        // the answer is in the bubble now: the cards give their place to the explanation and the next button (no scrolling)
        root.classList.add('cozuldu');
        mascot.classList.remove('mutlu', 'uzgun'); void mascot.offsetWidth; mascot.classList.add('mutlu');
        playCue('correct');
        fx.burst(zone, { count: 14, symbols: ['★', '✦', '⭐'], spread: 110 });
        if (typeof fx.confetti === 'function') fx.confetti(c.stage.closest('dialog'), { count: 70, duration: 1800 });
        setTimeout(() => { if (live.on) say(text); }, 450);
        const info = document.createElement('p');
        info.className = 'eb-aciklama';
        info.textContent = '💡 ' + q.b;
        const go = document.createElement('button');
        go.type = 'button';
        go.className = 'primary eb-sonraki';
        go.textContent = at < c.sorular.length ? 'Sonraki Soru ▶' : '🏁 Bitir';
        go.onclick = () => { playCue('tap', { gain: 0.6 }); sus(); next(); };
        alt.append(info, go);
        setTimeout(() => go.focus({ preventScroll: true }), 200);
      }
      root.querySelector('.eb-metin').focus({ preventScroll: true });
    }
    next();
    return () => { live.on = false; token++; while (cleanups.length) cleanups.pop()(); sus(); temizle(); };
  }
  return { oyna, say };
})();
