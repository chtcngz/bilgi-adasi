// The storage keys keep their first name (from when this was only Çarpım Adası) so saved players stay.
const profileKey = 'carpim-adasi-profiller';
const progressKey = profile => 'carpim-adasi-oyuncu-' + profile.id;
function readRecord(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
const profiles = readRecord(profileKey) || [];
// Oyuncu kodu: eight letters and digits (without the look-alikes 0/O, 1/I/L) that bring the player, with all their
// progress, to another device (core/js/sync.js). Players saved before codes existed get one when the page opens.
const codeLetters = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function newCode() {
  let kod;
  do kod = Array.from(crypto.getRandomValues(new Uint8Array(8)), n => codeLetters[n % codeLetters.length]).join('');
  while (profiles.some(p => p.kod === kod));
  return kod;
}
const codeText = kod => kod ? kod.slice(0, 4) + '-' + kod.slice(4) : '';
const sessionProgress = new Map();
const avatars = [['🐢','Kaplumbağa'], ['🐬','Yunus'], ['🦊','Tilki'], ['🐼','Panda'], ['🐙','Ahtapot'], ['🐧','Penguen']];
function fillAvatars(host) {
for (const [icon, name] of avatars) {
  const label = document.createElement('label');
  const input = document.createElement('input');
  input.type = 'radio';
  input.name = 'avatar';
  input.value = icon;
  input.defaultChecked = icon === avatars[0][0];
  input.setAttribute('aria-label', name);
  const face = document.createElement('span');
  face.textContent = icon;
  label.title = name;
  label.append(input, face);
  host.append(label);
}
}
fillAvatars($('icons'));
const grades = ['Okul öncesi', '1. sınıf', '2. sınıf', '3. sınıf', '4. sınıf'];
function fillGrades(host) {
for (const grade of grades) {
  const label = document.createElement('label');
  const input = document.createElement('input');
  input.type = 'radio';
  input.name = 'grade';
  input.value = grade;
  input.required = true;
  const chip = document.createElement('span');
  chip.textContent = grade;
  label.append(input, chip);
  host.append(label);
}
}
fillGrades($('grade-choices'));
function saveProfiles() {
  try { localStorage.setItem(profileKey, JSON.stringify(profiles)); return true; }
  catch { storageFailed = true; return false; }
}
function showPlayerButton() {
  $('player').textContent = activeProfile.icon + ' ' + activeProfile.name;
  $('player').title = activeProfile.name + ' · Oyuncu değiştir';
}

function choosePlayer(profile) {
  activeProfile = profile;
  progress = sessionProgress.get(profile.id) || readRecord(progressKey(profile)) ||
    { completed: 0, reports: {}, stats: {} };
  sessionProgress.set(profile.id, progress);
  initializeStats();
  stage = Math.min(progress.completed, total - 1);
  deck = []; answers = []; entry = '';
  showPlayerButton();
  $('settings-button').hidden = false;
  $('profiles').close();
  showCatalog();
}

// A page that shows only some bays (app/english/: <body data-koylar="eng1-card">) hides every other bay and card, even for devAll.
const pageCards = document.body.dataset.koylar?.split(' ') || null;
const pageTitle = document.title;
function availableForPlayer(card) {
  if (pageCards && !pageCards.includes(card.id)) return false;
  return devAll() || card.dataset.grades.split('|').includes(activeProfile.grade);
}
// Keşif Limanı: for the 1st to 4th grades, Keşif Haritası with a bay for every subject (core/js/harita.js);
// for preschool, the island cards (Elif Ba Adası).
function showCatalog() {
  const map = kesifHaritasi.goster();
  const cards = Array.from($('game-grid').children);
  for (const card of cards) card.hidden = !availableForPlayer(card);
  $('catalog-grade').textContent = activeProfile.grade;
  $('catalog-greeting').textContent = 'Merhaba ' + activeProfile.name + '! Bugün hangi ' + (map ? 'koyu' : 'adayı') + ' keşfedeceksin?';
  $('elif-view').hidden = true;
  $('empty-catalog').hidden = map || cards.some(card => !card.hidden);
  if (!map) $('game-tools').hidden = true;
  $('catalog').hidden = false;
  document.title = pageTitle;
  akvaryum.refresh();
  $('catalog-title').focus();
}

function drawPlayers() {
  $('players').replaceChildren(...profiles.map((profile, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'player-card' + (profile === activeProfile ? ' current' : '');
    button.dataset.cue = '';
    button.style.setProperty('--i', i);
    const face = document.createElement('span');
    face.className = 'player-face';
    face.setAttribute('aria-hidden', 'true');
    face.textContent = profile.icon;
    const name = document.createElement('strong');
    name.textContent = profile.name;
    const grade = document.createElement('small');
    grade.textContent = profile.grade;
    const text = document.createElement('span');
    text.className = 'player-text';
    text.append(name, grade);
    const arrow = document.createElement('span');
    arrow.className = 'player-go';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '▶';
    button.append(face, text, arrow);
    button.onclick = () => { playCue('start'); choosePlayer(profile); };
    return button;
  }));
}
function openProfiles() {
  drawPlayers();
  $('register').reset();
  $('join').reset();
  showSheet(profiles.length ? 'list' : 'register');
  $('profiles').showModal();
}
// The sheet shows the players ('list'), the new player form ('register') or the code form ('join'). With a form
// open, only the form shows, so the sheet stays short while the keyboard is open.
function showSheet(mode) {
  $('register').hidden = mode !== 'register';
  $('join').hidden = mode !== 'join';
  $('add-player').hidden = mode !== 'list';
  $('join-player').hidden = mode === 'join';
  $('cancel-register').hidden = !profiles.length;
  $('join-note').textContent = '';
  $('profiles').classList.toggle('adding', mode === 'register' && profiles.length > 0);
  $('profiles').classList.toggle('joining', mode === 'join');
  $('profiles').scrollTop = 0;
}
$('add-player').onclick = () => {
  showSheet('register');
  $('player-name').focus({ preventScroll: true });
};
$('cancel-register').onclick = () => { $('register').reset(); showSheet('list'); };
$('join-player').onclick = () => {
  showSheet('join');
  $('join-code').focus({ preventScroll: true });
};
$('cancel-join').onclick = () => { $('join').reset(); showSheet(profiles.length ? 'list' : 'register'); };
$('join-code').oninput = () => { $('join-note').textContent = ''; };
// A code typed on this device: the player comes from the cloud with everything they saved on the other one.
$('join').onsubmit = async e => {
  e.preventDefault();
  const kod = bulut.normalize($('join-code').value);
  const here = profiles.find(p => p.kod === kod);
  if (here) { playCue('start'); choosePlayer(here); return; }
  const button = $('join').querySelector('.primary');
  button.disabled = true;
  $('join-note').textContent = '☁️ Oyuncu getiriliyor…';
  try {
    const found = await bulut.yukle(kod);
    const profile = { id: found.id, name: String(found.name || 'Oyuncu').slice(0, 32), grade: grades.includes(found.grade) ? found.grade : grades[0],
      icon: avatars.some(a => a[0] === found.icon) ? found.icon : avatars[0][0], kod };
    const same = profiles.findIndex(p => p.id === profile.id);
    if (same >= 0) profiles.splice(same, 1, profile); else profiles.push(profile);
    sessionProgress.delete(profile.id);
    saveProfiles();
    playCue('island');
    choosePlayer(profile);
  } catch (error) {
    const reason = String(error.message);
    $('join-note').textContent = '✗ ' + ({
      kod: 'Kod 8 harf ve rakamdan oluşur, örneğin ABCD-EFGH.',
      yok: 'Bu kodla bir oyuncu bulunamadı. Kodu kontrol et.',
      internet: 'İnternet bağlantısı yok. Bağlanınca yeniden dene.',
      izin: 'Bulut bu kodu okumaya izin vermedi. Yöneticiye haber ver.',
      kapali: 'Bu kopyada bulut kapalı.'
    }[reason] || 'Oyuncu getirilemedi. Biraz sonra yeniden dene.');
    playCue('retry');
  }
  button.disabled = false;
};
// Keep open dialogs above the on-screen keyboard (iOS overlays it instead of resizing the page).
if (window.visualViewport) {
  const vv = window.visualViewport;
  const fit = () => {
    const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    document.documentElement.style.setProperty('--kb', kb + 'px');
    document.documentElement.style.setProperty('--vvh', vv.height + 'px');
    const field = document.activeElement;
    if (kb > 0 && field && field.matches('dialog input:not([type=radio]):not([type=checkbox])')) {
      requestAnimationFrame(() => field.scrollIntoView({ block: 'center' }));
    }
  };
  vv.addEventListener('resize', fit);
  vv.addEventListener('scroll', fit);
  fit();
}
$('profiles').addEventListener('cancel', e => { if (!activeProfile) e.preventDefault(); });
$('register').onsubmit = e => {
  e.preventDefault();
  const name = $('player-name').value.trim();
  if (!name) {
    $('player-name').setCustomValidity('Oyuncunun adını yaz.');
    $('player-name').reportValidity();
    return;
  }
  const profile = { id: Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-'),
    name, grade: $('register').elements.grade.value, icon: $('register').elements.avatar.value, kod: newCode() };
  if (!profiles.length) {
    const old = readRecord('carpim-rotasi-v2');
    if (old && Number.isInteger(old.completed) && old.completed >= 0 && old.completed <= total && old.reports) {
      sessionProgress.set(profile.id, old);
    }
  }
  profiles.push(profile);
  playCue('island');
  choosePlayer(profile);
  save();
  saveProfiles();
  if (storageFailed) alert('Oyuncu kaydı yalnızca bu oturumda saklanabildi.');
};
$('player-name').oninput = () => $('player-name').setCustomValidity('');
$('player').onclick = openProfiles;
$('switch-game').onclick = () => { leaveGame(); openProfiles(); };
if (profiles.some(p => !p.kod)) {
  for (const p of profiles) p.kod ||= newCode();
  saveProfiles();
}
openProfiles();
// A player played on another device since: their progress comes from the cloud before they are chosen here.
bulut.tazele(id => !sessionProgress.has(id)).then(updated => {
  if (!updated.length) return;
  for (const found of updated) {
    const p = profiles.find(q => q.id === found.id);
    if (!p) continue;
    if (found.name) p.name = String(found.name).slice(0, 32);
    if (grades.includes(found.grade)) p.grade = found.grade;
    if (avatars.some(a => a[0] === found.icon)) p.icon = found.icon;
  }
  saveProfiles();
  if (activeProfile) showPlayerButton();
  else if ($('profiles').open) drawPlayers();
});
