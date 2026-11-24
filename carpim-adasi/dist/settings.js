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
    if (!$('catalog').hidden || hidesGame('island-view', 'multiplication-card') || hidesGame('elif-view', 'elif-card')) {
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
  const disarmDelete = confirmTwice($('delete-player'), 'Emin misin? Evet, sil', () => {
    const profile = activeProfile;
    profiles.splice(profiles.indexOf(profile), 1);
    sessionProgress.delete(profile.id);
    try {
      localStorage.removeItem(progressKey(profile));
      localStorage.removeItem('elif-ba-' + profile.id);
      localStorage.removeItem('elif-ba-v2-' + profile.id);
    } catch {}
    saveProfiles();
    window.speechSynthesis?.cancel();
    activeProfile = null;
    for (const view of ['catalog', 'island-view', 'elif-view', 'game-tools', 'settings-button']) $(view).hidden = true;
    $('player').textContent = 'Oyuncu seç';
    $('player').title = '';
    dialog.close();
    openProfiles();
  });

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
    $('elif-summary').textContent = '🐚 ' + summary.harf + ' / 28 harf · 🦪 ' + summary.hareke + ' / 28 hareke';
    $('elif-reset').disabled = !summary.any;
  }
  const disarmElif = confirmTwice($('elif-reset'), 'Emin misin? Evet, sıfırla', () => {
    window.resetElifBa?.(activeProfile.id);
    drawElif();
    playCue('start');
  });
  function fillProgress() {
    const carpim = availableForPlayer($('multiplication-card'));
    const elif = availableForPlayer($('elif-card'));
    $('carpim-progress').hidden = !carpim;
    $('elif-progress').hidden = !elif;
    $('no-progress').hidden = carpim || elif;
    resetAt = null;
    if (carpim) drawResetMap();
    if (elif) drawElif();
  }

  $('settings-button').onclick = () => {
    if (!activeProfile) return;
    disarmDelete(); disarmReset(); disarmElif();
    fillPlayer();
    syncSound();
    syncVoice();
    fillProgress();
    showTab(tab);
    dialog.showModal();
  };
  $('close-settings').onclick = () => dialog.close();
})();
