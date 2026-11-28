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
  const RESIM = name => 'assets/images/english/soru/' + name + '.webp?v=1';
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

  /* ---------- a row of questions ---------- */
  function oyna(c) {
    const live = { on: true };
    let at = 0;
    const next = () => { if (!live.on) return; if (at < c.sorular.length) soru(c.sorular[at++]); else c.bitti(); };
    function soru(q) {
      const total = c.sorular.length, n = at;
      const b = q.balon;
      c.stage.innerHTML = '<div class="eb">' +
        '<div class="eb-ust"><span class="eb-maskot" aria-hidden="true">' + esc(c.maskot || '🦊') + '</span>' +
        '<span class="eb-sayi" aria-label="' + n + ' / ' + total + '">' + Array.from({ length: total }, (_, i) => '<i class="' + (i < n - 1 ? 'done' : i === n - 1 ? 'now' : '') + '"></i>').join('') + '</span></div>' +
        '<h2 class="eb-soru" id="eng1-prompt" tabindex="-1">' + esc(q.s) + '</h2>' +
        '<div class="eb-sahne"><img src="' + esc(RESIM(b.resim)) + '" alt="" draggable="false">' +
        '<div class="eb-balon" style="left:' + b.x + '%;top:' + b.y + '%;width:' + b.w + '%;height:' + b.h + '%"><span class="eb-soru-isareti" aria-hidden="true">?</span></div></div>' +
        '<div class="eb-kartlar" role="group" aria-label="Şıklar"></div><div class="eb-alt"></div></div>';
      const root = c.stage.querySelector('.eb'), zone = root.querySelector('.eb-balon'), cards = root.querySelector('.eb-kartlar'), alt = root.querySelector('.eb-alt');
      const mascot = root.querySelector('.eb-maskot');
      let solved = false, first = true;
      const colours = shuffled(COLOURS);
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
      function drag(card, text) {
        let start = null, moved = false, ghost = null;
        card.addEventListener('pointerdown', e => {
          if (solved || card.disabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
          e.preventDefault();
          card.setPointerCapture(e.pointerId);
          const r = card.getBoundingClientRect();
          start = { x: e.clientX, y: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top, r };
          moved = false;
        });
        card.addEventListener('pointermove', e => {
          if (!start) return;
          if (!moved && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 8) return;
          if (!moved) {
            moved = true;
            // a copy follows the finger above everything; the card stays as an empty place
            ghost = card.cloneNode(true);
            ghost.classList.add('eb-surukle');
            Object.assign(ghost.style, { width: start.r.width + 'px', height: start.r.height + 'px' });
            c.stage.closest('dialog').append(ghost);
            card.classList.add('eb-bos');
          }
          ghost.style.transform = 'translate(' + (e.clientX - start.dx) + 'px,' + (e.clientY - start.dy) + 'px) scale(1.08) rotate(-3deg)';
          zone.classList.toggle('yakin', near(e.clientX, e.clientY));
        });
        const up = e => {
          if (!start) return;
          const s = start;
          start = null;
          zone.classList.remove('yakin');
          if (!moved) { tap(card, text); return; }
          if (near(e.clientX, e.clientY)) drop(card, ghost, text);
          else back(card, ghost, s.r);
          ghost = null;
        };
        card.addEventListener('pointerup', up);
        card.addEventListener('pointercancel', e => { if (start && moved) { back(card, ghost, start.r); ghost = null; } start = null; zone.classList.remove('yakin'); });
        // the keyboard: Enter or Space puts the card in the bubble
        card.addEventListener('keydown', e => {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
          if (!solved && !card.disabled) drop(card, null, text);
        });
        card.addEventListener('click', e => e.preventDefault());
      }
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
      async function drop(card, ghost, text) {
        const z = zone.getBoundingClientRect();
        const right = text === q.a[0];
        if (ghost) {
          // the magnet: the copy slides to the middle of the bubble
          const g = ghost.getBoundingClientRect();
          await fly(ghost, { x: g.left, y: g.top, s: 1.08 }, { x: z.left + z.width / 2 - g.width / 2, y: z.top + z.height / 2 - g.height / 2, s: 0.9 }, 220);
        }
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
            const g = ghost.getBoundingClientRect(), home = card.getBoundingClientRect();
            await fly(ghost, { x: g.left, y: g.top, s: 0.9 }, { x: home.left, y: home.top, s: 1 }, 380);
            ghost.remove();
            card.classList.remove('eb-bos');
          } else {
            card.classList.remove('eb-titre'); void card.offsetWidth; card.classList.add('eb-titre');
          }
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
      root.querySelector('.eb-soru').focus({ preventScroll: true });
    }
    next();
    return () => { live.on = false; sus(); for (const g of document.querySelectorAll('.eb-surukle')) g.remove(); };
  }
  return { oyna, say };
})();
