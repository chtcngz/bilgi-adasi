// The storage keys keep their first name (from when this was only Çarpım Adası) so saved players stay.
const profileKey = 'carpim-adasi-profiller';
const progressKey = profile => 'carpim-adasi-oyuncu-' + profile.id;
function readRecord(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
const profiles = readRecord(profileKey) || [];
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
  $('grade').textContent = activeProfile.grade;
}

function choosePlayer(profile) {
  activeProfile = profile;
  progress = sessionProgress.get(profile.id) || readRecord(progressKey(profile)) ||
    { completed: 0, reports: {}, stats: {} };
  sessionProgress.set(profile.id, progress);
  initializeStats();
  selected = Math.min(progress.completed, total - 1) % islands.length;
  deck = []; answers = []; entry = '';
  showPlayerButton();
  $('settings-button').hidden = false;
  $('profiles').close();
  showCatalog();
}

function availableForPlayer(card) {
  return devAll() || card.dataset.grades.split('|').includes(activeProfile.grade);
}
function showCatalog() {
  const cards = Array.from($('game-grid').children);
  for (const card of cards) card.hidden = !availableForPlayer(card);
  $('catalog-grade').textContent = activeProfile.grade;
  $('catalog-greeting').textContent = 'Merhaba ' + activeProfile.name + '! Bugün hangi adayı keşfedeceksin?';
  $('elif-view').hidden = true;
  for (const kod of Object.keys(window.soruAdalari || {})) $(kod + '-view').hidden = true;
  $('empty-catalog').hidden = cards.some(card => !card.hidden);
  $('island-view').hidden = true;
  $('game-tools').hidden = true;
  $('catalog').hidden = false;
  document.title = 'Keşif Limanı · Bilgi Adası';
  akvaryum.refresh();
  $('catalog-title').focus();
}
$('back-to-catalog').onclick = showCatalog;
$('multiplication-card').onclick = () => {
  if (!availableForPlayer($('multiplication-card'))) return;
  $('catalog').hidden = true;
  $('island-view').hidden = false;
  $('game-tools').hidden = false;
  document.title = 'Çarpım Adası · Bilgi Adası';
  render();
  $('play').focus();
};

function openProfiles() {
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
  $('register').reset();
  showRegister(!profiles.length);
  $('profiles').showModal();
}
// When adding a player, show only the form so the sheet stays short while the keyboard is open.
function showRegister(open) {
  $('register').hidden = !open;
  $('add-player').hidden = open || !profiles.length;
  $('cancel-register').hidden = !profiles.length;
  $('profiles').classList.toggle('adding', open && profiles.length > 0);
  $('profiles').scrollTop = 0;
}
$('add-player').onclick = () => {
  showRegister(true);
  $('player-name').focus({ preventScroll: true });
};
$('cancel-register').onclick = () => { $('register').reset(); showRegister(false); };
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
    name, grade: $('register').elements.grade.value, icon: $('register').elements.avatar.value };
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
openProfiles();
