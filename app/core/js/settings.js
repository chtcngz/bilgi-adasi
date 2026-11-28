// Settings: edit or delete the player, sound options and progress resets.
// The Pages workflow writes the version into <meta name="surum"> when it publishes.
const versionText = (() => {
  const stamp = document.querySelector('meta[name=surum]')?.content || '';
  const text = stamp && !stamp.startsWith('__') ? 'Sürüm ' + stamp : 'Geliştirme sürümü';
  for (const element of document.querySelectorAll('.app-version')) element.textContent = text;
  return text;
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
    $('edit-code').textContent = codeText(activeProfile.kod);
    $('copy-code').innerHTML = '<span aria-hidden="true">📋</span> Kopyala';
  }
  $('copy-code').onclick = async () => {
    const text = codeText(activeProfile.kod);
    let done = false;
    try { await navigator.clipboard.writeText(text); done = true; } catch {}
    if (!done) {
      // Older browsers: select the code so it can be copied by hand.
      const range = document.createRange();
      range.selectNodeContents($('edit-code'));
      getSelection().removeAllRanges();
      getSelection().addRange(range);
      try { done = document.execCommand('copy'); } catch {}
    }
    playCue(done ? 'correct' : 'retry');
    $('copy-code').textContent = done ? '✓ Kopyalandı' : 'Seçildi, kopyala';
  };
  function refreshView() {
    if (!$('catalog').hidden || (!$('elif-view').hidden && !availableForPlayer($('elif-card')))) {
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
    akvaryum.refresh();
    fillPlayer();
    playCue('correct');
    $('edit-note').textContent = stored ? '✓ Kaydedildi' : 'Değişiklik yalnızca bu oturumda saklanabildi.';
  };
  // Deleting asks for a typed word, so a child tapping around cannot do it by accident.
  const confirmWord = 'SİL';
  const confirmed = () => $('delete-confirm').value.trim().toLocaleUpperCase('tr-TR') === confirmWord;
  // Deleting takes the player off this device only; the box deletes them everywhere (every device and the cloud).
  function syncEverywhere() {
    const everywhere = $('delete-everywhere').checked;
    $('delete-here-note').hidden = everywhere;
    $('delete-all-note').hidden = !everywhere;
    $('delete-player').textContent = everywhere ? 'Her yerden sil' : 'Sil';
  }
  function disarmDelete() {
    $('delete-confirm').value = '';
    $('delete-player').disabled = true;
    $('delete-everywhere').checked = false;
    syncEverywhere();
  }
  $('delete-everywhere').onchange = syncEverywhere;
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
    // The cloud copy changes now, not a few seconds later, so the admin page drops the player from this device too.
    // Only here, the player's own document stays (their progress on the other devices, the code); everywhere, it goes.
    bulut.oyuncuSilindi(profile, $('delete-everywhere').checked);
    removePlayer(profile);
    window.speechSynthesis?.cancel();
    activeProfile = null;
    for (const view of ['catalog', 'elif-view', 'game-tools', 'settings-button', 'aquarium-button']) $(view).hidden = true;
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
    input.onchange = () => { elifVoice.setMode(input.value); $('elif-voice-credit').textContent = elifVoice.credit(); elifVoice.sample(); };
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
  const describe = stageLabel;
  function drawResetMap() {
    const done = progress.completed;
    $('carpim-summary').textContent = '⭐ ' + done + ' / ' + total + ' yıldız · ' + (done >= total ? 'Hepsi tamamlandı' :
      islandName(islandOf(done)) + ' (' + (islandOf(done) + 1) + ' / ' + ISLANDS + ')');
    // One row per island of the nine tables, then a row for the two mixed islands ([stage index, button text]).
    const rows = secondsPerRound.map((seconds, r) =>
      [seconds + ' sn', islandNames[r], islandStages(r).map(index => [index, index % TABLES + 2])]);
    rows.push(['Karma', islandNames.slice(secondsPerRound.length).join(', '), mixedSeconds.map((seconds, k) => [tableStages + k, seconds + ' sn'])]);
    $('reset-map').replaceChildren(...rows.map(([name, small, stages]) => {
      const row = document.createElement('div');
      row.className = 'reset-row';
      const label = document.createElement('span');
      label.innerHTML = '<b>' + name + '</b><small>' + small + '</small>';
      const dots = document.createElement('div');
      dots.className = 'reset-dots';
      stages.forEach(([index, text]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = text;
        button.className = (index < done ? 'done' : index === done ? 'next' : 'locked') + (index >= tableStages ? ' wide' : '');
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
      ? describe(resetAt) + ' ve sonrası sıfırlanır: ' + lost + ' yıldız ve bu tabloların istatistikleri silinir.'
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
    stage = index;
    save();
    render();
    kesifHaritasi.yenile();
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
      (summary.tenvin ? ' · 🐬 ' + summary.tenvin + ' / 28 tenvin' : '') +
      (summary.sedde ? ' · 🐙 ' + summary.sedde + ' / 28 şedde' : '') +
      (summary.tamam ? ' · 🌧️ Harf Yağmuru tamamlandı (rekor ' + summary.rekor + ')' : summary.rekor ? ' · 🌧️ Harf Yağmuru rekoru ' + summary.rekor : '') +
      (summary.balon?.tamam ? ' · 🎈 Hece Balonları tamamlandı (rekor ' + summary.balon.rekor + ')' :
        summary.balon?.rekor ? ' · 🎈 Hece Balonları rekoru ' + summary.balon.rekor : '') +
      (summary.sekil?.tamam ? ' · ☔ Şekil Yağmuru tamamlandı (rekor ' + summary.sekil.rekor + ')' :
        summary.sekil?.rekor ? ' · ☔ Şekil Yağmuru rekoru ' + summary.sekil.rekor : '') +
      (summary.cezmbalon?.tamam ? ' · 🎐 Cezm Balonları tamamlandı (rekor ' + summary.cezmbalon.rekor + ')' :
        summary.cezmbalon?.rekor ? ' · 🎐 Cezm Balonları rekoru ' + summary.cezmbalon.rekor : '') +
      (summary.tenvinbalon?.tamam ? ' · 🪁 Tenvin Balonları tamamlandı (rekor ' + summary.tenvinbalon.rekor + ')' :
        summary.tenvinbalon?.rekor ? ' · 🪁 Tenvin Balonları rekoru ' + summary.tenvinbalon.rekor : '') +
      (summary.seddebalon?.tamam ? ' · 🎏 Şedde Balonları tamamlandı (rekor ' + summary.seddebalon.rekor + ')' :
        summary.seddebalon?.rekor ? ' · 🎏 Şedde Balonları rekoru ' + summary.seddebalon.rekor : '') +
      (summary.oyunlar || []).map(g => g.rekor ? ' · ' + g.icon + ' ' + g.name + (g.oynanan ? ' ' + g.oynanan + ' adacıkta bitti' : '') + ' (rekor ' + g.rekor + ')' : '').join('') +
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
    // a bay whose questions are not written yet has no progress to show
    const open = quizzes.filter(kod => availableForPlayer($(kod + '-card')) && window.soruAdalari[kod].hazir);
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
    // The device's kimlik (core/js/bulut-ayar.js), the one the admin page lists it under; none before its first send.
    const kimlik = cihazKimligi(bulut.durum().uid);
    dialog.querySelector('.app-version').textContent = versionText + (kimlik ? ' · Cihaz ' + kimlik : '');
    dialog.showModal();
  };
  $('close-settings').onclick = () => dialog.close();
})();
