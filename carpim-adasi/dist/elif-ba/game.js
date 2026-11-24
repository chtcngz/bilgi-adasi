(() => {
  const glyphs = Array.from('ابتثجحخدذرزسشصضطظعغفقكلمنوهي');
  const names = 'Elif Be Te Se Cim Ha Hı Dal Zel Ra Ze Sin Şın Sad Dad Tı Zı Ayn Gayn Fe Kaf Kef Lâm Mim Nun Vav He Ye'.split(' ');
  const coves = ['Kaplumbağa Koyu', 'İnci Koyu', 'Mercan Koyu', 'Yıldız Koyu', 'Yunus Koyu', 'Sedef Koyu', 'Deniz Feneri Koyu'];
  const visits = new Map();
  let cove = 0, pearls, order, turn;
  const dialog = $('elif-game');
  const picker = $('elif-cove');
  coves.forEach((name, i) => picker.add(new Option(name, i)));

  function stopVoice() { window.speechSynthesis?.cancel(); }
  function speak(words, note) {
    stopVoice();
    const unavailable = () => { note.textContent = 'Bu cihazda Türkçe ses kullanılamıyor. Aynı şekli bulabilirsin.'; };
    if (!window.speechSynthesis) return unavailable();
    const voices = speechSynthesis.getVoices();
    const voice = voices.find(item => /^tr\b/i.test(item.lang));
    if (voices.length && !voice) return unavailable();
    const message = new SpeechSynthesisUtterance(words);
    message.lang = 'tr-TR';
    if (voice) message.voice = voice;
    message.rate = 0.82;
    message.onerror = event => {
      if (!['interrupted', 'canceled'].includes(event.error)) unavailable();
    };
    speechSynthesis.speak(message);
  }

  function shuffled(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function letters() { return [0, 1, 2, 3].map(offset => cove * 4 + offset); }
  function tile(index, discover) {
    const button = document.createElement('button');
    button.className = 'elif-tile tone-' + index % 4;
    button.setAttribute('aria-label', names[index]);
    button.innerHTML = '<b lang="ar">' + glyphs[index] + '</b>';
    if (discover) {
      button.innerHTML += '<strong>' + names[index] + '</strong><small aria-hidden="true">' +
        (pearls.has(index) ? '🐚' : '♪') + '</small>';
      button.onclick = () => {
        for (const other of $('elif-cards').children) other.classList.remove('selected');
        button.classList.add('selected');
        $('elif-note').textContent = names[index];
        speak(names[index], $('elif-note'));
      };
    }
    return button;
  }
  function drawCove() {
    picker.value = cove;
    $('elif-shells').textContent = '🐚 ' + pearls.size + ' / 28 deniz kabuğu';
    $('elif-cards').replaceChildren(...letters().map(i => tile(i, true)));
    $('elif-note').textContent = '';
  }
  $('elif-card').onclick = () => {
    if (!availableForPlayer($('elif-card'))) return;
    const key = 'elif-ba-' + activeProfile.id;
    if (!visits.has(key)) {
      const saved = readRecord(key);
      visits.set(key, new Set(Array.isArray(saved) ? saved.filter(i => Number.isInteger(i) && i >= 0 && i < 28) : []));
    }
    pearls = visits.get(key);
    const first = glyphs.findIndex((_, i) => !pearls.has(i));
    cove = first < 0 ? 0 : Math.floor(first / 4);
    $('catalog').hidden = true;
    $('elif-view').hidden = false;
    document.title = 'Elif Ba Adası · Bilgi Adası';
    drawCove();
    $('elif-title').focus();
    window.speechSynthesis?.getVoices();
  };
  picker.onchange = () => { stopVoice(); cove = Number(picker.value); drawCove(); };
  $('elif-back').onclick = () => { stopVoice(); showCatalog(); };
  $('player').addEventListener('click', stopVoice);
  $('elif-close').onclick = () => dialog.close();
  dialog.addEventListener('close', stopVoice);

  function finish() {
    const next = cove < coves.length - 1;
    $('elif-stage').innerHTML = '<div class="elif-prize" aria-hidden="true">🐚</div><h2 id="elif-prompt" tabindex="-1">Dört harfi de buldun!</h2><p>' +
      (pearls.size === 28 ? 'Adadaki 28 deniz kabuğunu da topladın!' : coves[cove] + ' tamamlandı.') +
      '</p><button class="elif-action" id="elif-continue">' + (next ? 'Sonraki koy' : 'Koya dön') + '</button>';
    $('elif-prompt').focus();
    $('elif-continue').onclick = () => { if (next) cove++; drawCove(); dialog.close(); };
  }
  function question() {
    const target = order[turn];
    $('elif-stage').innerHTML = '<p class="elif-step">' + coves[cove] + ' · ' + (turn + 1) +
      ' / 4</p><h2 id="elif-prompt" tabindex="-1">Eşini bul!</h2><button id="elif-listen" aria-label="' +
      names[target] + ' harfini dinle"><b lang="ar">' + glyphs[target] + '</b><span>♪ ' + names[target] +
      '</span></button><div id="elif-choices"></div><p id="elif-response" role="status">Aynı harfe dokun.</p>' +
      '<button id="elif-next" class="elif-action" hidden></button>';
    $('elif-prompt').focus();
    const feedback = $('elif-response');
    $('elif-listen').onclick = () => speak(names[target], feedback);
    const others = shuffled(letters().filter(i => i !== target)).slice(0, 2);
    for (const index of shuffled([target, ...others])) {
      const button = tile(index, false);
      $('elif-choices').append(button);
      button.onclick = () => {
        if (index !== target) {
          button.disabled = true;
          feedback.textContent = 'Bir daha bakalım. Yukarıdaki şeklin eşi hangisi?';
          return;
        }
        for (const item of $('elif-choices').children) item.disabled = true;
        button.classList.add('matched');
        pearls.add(index);
        let notice = '';
        try { localStorage.setItem('elif-ba-' + activeProfile.id, JSON.stringify([...pearls])); }
        catch { notice = ' İlerlemen bu oturumda saklanıyor.'; }
        drawCove();
        feedback.textContent = '🐚 Buldun! ' + names[index] + ' kabuğu senin.' + notice;
        const next = $('elif-next');
        next.hidden = false;
        next.textContent = turn === 3 ? 'Kabuğumu göster' : 'Sıradaki harf';
        next.focus();
        next.onclick = () => { stopVoice(); turn++; if (turn === 4) finish(); else question(); };
      };
    }
    speak(names[target], feedback);
  }
  $('elif-play').onclick = () => {
    order = shuffled(letters());
    turn = 0;
    dialog.showModal();
    question();
  };
})();
