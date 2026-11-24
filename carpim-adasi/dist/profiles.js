const profileKey = 'carpim-adasi-profiller';
const progressKey = profile => 'carpim-adasi-oyuncu-' + profile.id;
function readRecord(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
const profiles = readRecord(profileKey) || [];
const sessionProgress = new Map();
const avatars = [['🐢','Kaplumbağa'], ['🐬','Yunus'], ['🦊','Tilki'], ['🐼','Panda'], ['🐙','Ahtapot'], ['🐧','Penguen']];
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
  $('icons').append(label);
}

function choosePlayer(profile) {
  activeProfile = profile;
  progress = sessionProgress.get(profile.id) || readRecord(progressKey(profile)) ||
    { completed: 0, reports: {}, stats: {} };
  sessionProgress.set(profile.id, progress);
  initializeStats();
  selected = Math.min(progress.completed, total - 1) % islands.length;
  deck = []; answers = []; entry = '';
  $('player').textContent = profile.icon + ' ' + profile.name;
  $('player').title = profile.name + ' · Oyuncu değiştir';
  $('grade').textContent = profile.grade;
  $('profiles').close();
  showCatalog();
}

const multiplicationGrades = ['2. sınıf', '3. sınıf', '4. sınıf'];
function showCatalog() {
  const available = multiplicationGrades.includes(activeProfile.grade);
  $('catalog-grade').textContent = activeProfile.grade;
  $('multiplication-card').hidden = !available;
  $('empty-catalog').hidden = available;
  $('island-view').hidden = true;
  $('game-tools').hidden = true;
  $('catalog').hidden = false;
  document.title = 'Oyun kataloğu · Bilgi Adası';
  $('catalog-title').focus();
}
$('back-to-catalog').onclick = showCatalog;
$('multiplication-card').onclick = () => {
  if (!multiplicationGrades.includes(activeProfile.grade)) return;
  $('catalog').hidden = true;
  $('island-view').hidden = false;
  $('game-tools').hidden = false;
  document.title = 'Çarpım Adası · Bilgi Adası';
  render();
  $('play').focus();
};

function openProfiles() {
  $('players').replaceChildren(...profiles.map(profile => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'player-card';
    button.textContent = profile.icon + '  ' + profile.name + ' · ' + profile.grade;
    button.onclick = () => choosePlayer(profile);
    return button;
  }));
  $('register').reset();
  $('register').hidden = profiles.length > 0;
  $('add-player').hidden = !profiles.length;
  $('profiles').showModal();
}
$('add-player').onclick = () => {
  $('register').hidden = false;
  $('add-player').hidden = true;
  $('player-name').focus();
};
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
    name, grade: $('class-choice').value, icon: $('register').elements.avatar.value };
  if (!profiles.length) {
    const old = readRecord('carpim-rotasi-v2');
    if (old && Number.isInteger(old.completed) && old.completed >= 0 && old.completed <= total && old.reports) {
      sessionProgress.set(profile.id, old);
    }
  }
  profiles.push(profile);
  choosePlayer(profile);
  save();
  try { localStorage.setItem(profileKey, JSON.stringify(profiles)); }
  catch { storageFailed = true; }
  if (storageFailed) alert('Oyuncu kaydı yalnızca bu oturumda saklanabildi.');
};
$('player-name').oninput = () => $('player-name').setCustomValidity('');
$('player').onclick = openProfiles;
$('switch-game').onclick = () => { leaveGame(); openProfiles(); };
$('settings-button').onclick = () => {
  const last = Math.min(progress.completed, total - 1);
  const stages = Array.from({length: last + 1}, (_, index) =>
    new Option('Tur ' + (1 + Math.floor(index / islands.length)) + ' · ' + islands[index % islands.length], index));
  $('reset-stage').replaceChildren(...stages);
  $('reset-stage').value = last;
  $('reset-info').textContent = activeProfile.name + ' için seçilen bölüm ve sonraki bölümlerin ilerlemesi ve istatistikleri silinir.';
  $('settings').showModal();
};
$('reset-form').onsubmit = e => {
  e.preventDefault();
  const index = Number($('reset-stage').value);
  if (!confirm(activeProfile.name + ' için ' + $('reset-stage').selectedOptions[0].text +
    ' ve sonraki bölümler sıfırlansın mı?')) return;
  for (const records of [progress.reports, progress.stats]) {
    for (const key of Object.keys(records)) if (Number(key) >= index) delete records[key];
  }
  progress.completed = index;
  delete progress.attempt;
  selected = index % islands.length;
  save();
  render();
  $('settings').close();
};
$('close-settings').onclick = () => $('settings').close();
openProfiles();
