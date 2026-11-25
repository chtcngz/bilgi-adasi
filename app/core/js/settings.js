// Settings: edit or delete the player, sound options and progress resets.
// The Pages workflow writes the version into <meta name="surum"> when it publishes.
(() => {
  const stamp = document.querySelector('meta[name=surum]')?.content || '';
  const text = stamp && !stamp.startsWith('__') ? 'Sürüm ' + stamp : 'Geliştirme sürümü';
  for (const element of document.querySelectorAll('.app-version')) element.textContent = text;
})();
(() => {
  const dialog = $('settings');
  const tabs = ['player', 'sound', 'progress'];
  let tab = 'player';
  let resetAt = null;
  fillGrades($('edit-grades'));
  fillAvatars($('edit-icons'));

  function showTab(name, focus) {
    tab = name;
    for (const other of tabs) {
      const button = $('tab-' + other);
      const active = other === name;
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
      $('panel-' + other).hidden = !active;
    }
    if (focus) $('tab-' + name).focus();
  }
  for (const name of tabs) $('tab-' + name).onclick = () => showTab(name);
  dialog.querySelector('.set-tabs').addEventListener('keydown', e => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    showTab(tabs[(tabs.indexOf(tab) + step + tabs.length) % tabs.length], true);
  });

  // A destructive button asks once more before acting.
  function confirmTwice(button, armedLabel, action) {
    let timer;
    const label = button.textContent;
    const disarm = () => { clearTimeout(timer); delete button.dataset.armed; button.textContent = label; };
    button.onclick = () => {
      if (button.dataset.armed) { disarm(); action(); return; }
      button.dataset.armed = 'true';
      button.textContent = armedLabel;
      timer = setTimeout(disarm, 4000);
    };
    return disarm;
  }

  /* ---------- Player ---------- */
  function fillPlayer() {
    const form = $('edit-player');
    $('edit-face').textContent = activeProfile.icon;
    $('edit-title').textContent = activeProfile.name;
    $('edit-name').value = activeProfile.name;
    form.elements.grade.value = activeProfile.grade;
    form.elements.avatar.value = activeProfile.icon;
    $('edit-note').textContent = '';
  }
  function refreshView() {
    const hidesGame = (view, card) => !$(view).hidden && !availableForPlayer($(card));
    if (!$('catalog').hidden || hidesGame('island-view', 'multiplication-card') || hidesGame('elif-view', 'elif-card') ||
      Object.keys(window.soruAdalari).some(kod => hidesGame(kod + '-view', kod + '-card'))) {
      window.speechSynthesis?.cancel();
      showCatalog();
    }
  }
  $('edit-name').oninput = () => $('edit-name').setCustomValidity('');
  $('edit-player').onsubmit = e => {
    e.preventDefault();
    const name = $('edit-name').value.trim();
    if (!name) {
      $('edit-name').setCustomValidity('Oyuncunun adını yaz.');
      $('edit-name').reportValidity();
      return;
    }
    const form = $('edit-player');
    Object.assign(activeProfile, { name, grade: form.elements.grade.value, icon: form.elements.avatar.value });
    const stored = saveProfiles();
    showPlayerButton();
    refreshView();
    fillPlayer();
    playCue('correct');
    $('edit-note').textContent = stored ? '✓ Kaydedildi' : 'Değişiklik yalnızca bu oturumda saklanabildi.';
  };
  // Deleting asks for a typed word, so a child tapping around cannot do it by accident.
  const confirmWord = 'SİL';
  const confirmed = () => $('delete-confirm').value.trim().toLocaleUpperCase('tr-TR') === confirmWord;
  function disarmDelete() {
    $('delete-confirm').value = '';
    $('delete-player').disabled = true;
  }
  $('delete-confirm').oninput = () => { $('delete-player').disabled = !confirmed(); };
  // The field sits inside the edit form: Enter there deletes (once the word is right) instead of saving.
  $('delete-confirm').onkeydown = e => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (confirmed()) $('delete-player').click();
  };
  $('delete-player').onclick = () => {
    if (!confirmed()) return;
    const profile = activeProfile;
    profiles.splice(profiles.indexOf(profile), 1);
    sessionProgress.delete(profile.id);
    try {
      // Every key of this player ends in its id (carpim-adasi-oyuncu-, elif-ba-v2-, elif-ba-hiz-, din-bilgisi- …).
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.endsWith('-' + profile.id)) keys.push(key);
      }
      for (const key of keys) localStorage.removeItem(key);
    } catch {}
    saveProfiles();
    // The cloud copy changes now, not a few seconds later, so the admin page drops the player too.
    bulut.oyuncuSilindi(profile.id);
    window.speechSynthesis?.cancel();
    activeProfile = null;
    for (const view of ['catalog', 'island-view', 'elif-view', 'game-tools', 'settings-button']) $(view).hidden = true;
    for (const kod of Object.keys(window.soruAdalari)) $(kod + '-view').hidden = true;
    $('player').textContent = 'Oyuncu seç';
    $('player').title = '';
    disarmDelete();
    dialog.close();
    openProfiles();
  };

  /* ---------- Sound ---------- */
  const syncSound = () => { $('sound-switch').checked = playCue.isOn(); };
  function syncVoice() {
    const box = $('elif-voice');
    box.hidden = !elifVoice.hasRecordings() || !availableForPlayer($('elif-card'));
    for (const input of box.querySelectorAll('input')) input.checked = input.value === elifVoice.mode();
    $('elif-voice-credit').textContent = elifVoice.credit();
  }
  for (const input of $('elif-voice').querySelectorAll('input')) {
    input.onchange = () => { elifVoice.setMode(input.value); elifVoice.chant(1, 0); };
  }
  $('sound-switch').onchange = () => playCue.setEnabled($('sound-switch').checked);
  document.addEventListener('soundchange', syncSound);
  for (const button of dialog.querySelectorAll('[data-try]')) {
    button.onclick = () => {
      if (!playCue.isOn()) playCue.setEnabled(true);
      playCue(button.dataset.try);
    };
  }

  /* ---------- Progress ---------- */
  function lastResettable() { return Math.min(progress.completed, total - 1); }
  function describe(index) {
    return 'Tur ' + (Math.floor(index / islands.length) + 1) + ' · ' + islands[index % islands.length] +
      ' (' + (index % islands.length + 2) + ' tablosu)';
  }
  function drawResetMap() {
    const done = progress.completed;
    $('carpim-summary').textContent = '⭐ ' + done + ' / ' + total + ' yıldız · Tur ' + (round() + 1) + ' / ' + secondsPerRound.length;
    $('reset-map').replaceChildren(...secondsPerRound.map((seconds, r) => {
      const row = document.createElement('div');
      row.className = 'reset-row';
      const label = document.createElement('span');
      label.innerHTML = '<b>Tur ' + (r + 1) + '</b><small>' + seconds + ' sn</small>';
      const dots = document.createElement('div');
      dots.className = 'reset-dots';
      islands.forEach((island, i) => {
        const index = r * islands.length + i;
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = i + 2;
        button.className = index < done ? 'done' : index === done ? 'next' : 'locked';
        if (resetAt !== null && index >= resetAt && index <= Math.max(done - 1, resetAt)) button.classList.add('drop');
        if (index === resetAt) button.classList.add('chosen');
        button.disabled = index > lastResettable();
        button.title = describe(index) + (index < done ? ' · tamamlandı' : index === done ? ' · sıradaki' : ' · kilitli');
        button.setAttribute('aria-label', button.title);
        button.setAttribute('aria-pressed', String(index === resetAt));
        button.onclick = () => { resetAt = index; disarmReset(); drawResetMap(); };
        dots.append(button);
      });
      row.append(label, dots);
      return row;
    }));
    const lost = resetAt === null ? 0 : done - resetAt;
    $('reset-info').textContent = resetAt === null ? '' : lost > 0
      ? describe(resetAt) + ' ve sonrası sıfırlanır: ' + lost + ' yıldız ve bu adaların istatistikleri silinir.'
      : describe(resetAt) + ' için denemeler ve istatistikler silinir. Yıldız kaybetmezsin.';
    $('reset-go').disabled = resetAt === null;
  }
  const disarmReset = confirmTwice($('reset-go'), 'Emin misin? Evet, sıfırla', () => {
    const index = resetAt;
    for (const records of [progress.reports, progress.stats]) {
      for (const key of Object.keys(records)) if (Number(key) >= index) delete records[key];
    }
    progress.completed = index;
    delete progress.attempt;
    selected = index % islands.length;
    save();
    render();
    resetAt = null;
    drawResetMap();
    playCue('start');
    $('reset-info').textContent = '✓ Sıfırlandı. ' + describe(index) + ' seni bekliyor.';
  });
  function drawElif() {
    const summary = window.elifBaSummary(activeProfile.id);
    $('elif-summary').textContent = '🐚 ' + summary.harf + ' / 28 harf · 🦪 ' + summary.hareke + ' / 28 hareke' +
      (summary.bitisik ? ' · 🪸 ' + summary.bitisik + ' / 28 bitişik yazılış' : '') +
      (summary.cezm ? ' · ⭐ ' + summary.cezm + ' / 28 cezm' : '') +
      (summary.tamam ? ' · 🌧️ Harf Yağmuru tamamlandı (rekor ' + summary.rekor + ')' : summary.rekor ? ' · 🌧️ Harf Yağmuru rekoru ' + summary.rekor : '') +
      (summary.balon?.tamam ? ' · 🎈 Hece Balonları tamamlandı (rekor ' + summary.balon.rekor + ')' :
        summary.balon?.rekor ? ' · 🎈 Hece Balonları rekoru ' + summary.balon.rekor : '') +
      (summary.sekil?.tamam ? ' · ☔ Şekil Yağmuru tamamlandı (rekor ' + summary.sekil.rekor + ')' :
        summary.sekil?.rekor ? ' · ☔ Şekil Yağmuru rekoru ' + summary.sekil.rekor : '') +
      (summary.cezmbalon?.tamam ? ' · 🎐 Cezm Balonları tamamlandı (rekor ' + summary.cezmbalon.rekor + ')' :
        summary.cezmbalon?.rekor ? ' · 🎐 Cezm Balonları rekoru ' + summary.cezmbalon.rekor : '') +
      (summary.kopru?.gecilen ? ' · 🌉 ' + summary.kopru.gecilen + ' / ' + summary.kopru.koy + ' Cam Köprü geçildi' + (summary.kopru.rekor ? ' (rekor ' + summary.kopru.rekor + ')' : '') :
        summary.kopru?.rekor ? ' · 🌉 Cam Köprü rekoru ' + summary.kopru.rekor : '');
    $('elif-reset').disabled = !summary.any;
  }
  const disarmElif = confirmTwice($('elif-reset'), 'Emin misin? Evet, sıfırla', () => {
    window.resetElifBa?.(activeProfile.id);
    drawElif();
    playCue('start');
  });
  // Question islands (Din Bilgisi, Fen Bilimleri): stars, learned questions and the mock exam.
  const quizzes = Object.keys(window.soruAdalari);
  function drawQuiz(kod) {
    const summary = window.soruAdalari[kod].summary(activeProfile.id);
    $(kod + '-summary').textContent = '📗 ' + summary.ogrenilen + ' / ' + summary.soru + ' soru öğrenildi · ⭐ ' + summary.yildiz +
      ' / ' + summary.toplam + ' · Deneme: ' + (summary.deneme === null ? 'henüz yok' : 'en iyi ' + summary.deneme + ' / 20');
    // One row per unit, so a parent can see what is learned and what is left.
    $(kod + '-units').replaceChildren(...summary.duraklar.map(stop => {
      const row = document.createElement('li');
      const done = stop.ogrenilen === stop.soru;
      row.innerHTML = '<span aria-hidden="true">' + stop.simge + '</span><span><b></b><small></small></span>' +
        '<span class="soru-meter" aria-hidden="true"><i></i></span><em></em>';
      row.querySelector('b').textContent = stop.unite;
      row.querySelector('small').textContent = stop.ad + ' · ' + '★'.repeat(stop.yildiz) + '☆'.repeat(3 - stop.yildiz);
      row.querySelector('i').style.width = stop.ogrenilen / stop.soru * 100 + '%';
      row.querySelector('em').textContent = done ? '✅ ' + stop.soru : stop.ogrenilen + ' / ' + stop.soru;
      return row;
    }));
    $(kod + '-reset').disabled = !summary.any;
  }
  const disarmQuiz = quizzes.map(kod => confirmTwice($(kod + '-reset'), 'Emin misin? Evet, sıfırla', () => {
    window.soruAdalari[kod].reset(activeProfile.id);
    drawQuiz(kod);
    playCue('start');
  }));
  function fillProgress() {
    const carpim = availableForPlayer($('multiplication-card'));
    const elif = availableForPlayer($('elif-card'));
    const open = quizzes.filter(kod => availableForPlayer($(kod + '-card')));
    $('carpim-progress').hidden = !carpim;
    $('elif-progress').hidden = !elif;
    for (const kod of quizzes) $(kod + '-progress').hidden = !open.includes(kod);
    $('no-progress').hidden = carpim || elif || open.length > 0;
    resetAt = null;
    if (carpim) drawResetMap();
    if (elif) drawElif();
    for (const kod of open) drawQuiz(kod);
  }

  $('settings-button').onclick = () => {
    if (!activeProfile) return;
    disarmDelete(); disarmReset(); disarmElif();
    for (const disarm of disarmQuiz) disarm();
    fillPlayer();
    syncSound();
    syncVoice();
    fillProgress();
    showTab(tab);
    dialog.showModal();
  };
  $('close-settings').onclick = () => dialog.close();
})();
