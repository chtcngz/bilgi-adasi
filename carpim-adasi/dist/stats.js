const durationFormat = new Intl.NumberFormat('tr-TR', {maximumFractionDigits: 1});
function duration(seconds) {
  const tenths = Math.round(seconds * 10);
  const minutes = Math.floor(tenths / 600);
  const remainder = durationFormat.format((tenths % 600) / 10);
  return (minutes ? minutes + ' dk ' : '') + remainder + ' sn';
}
function stageStats(index) {
  return progress.stats[index] ??= {
    attempts: 0, correct: 0, wrong: 0, timeout: 0, seconds: 0, latest: []
  };
}
function countAnswer(stats, row) {
  stats.seconds += row.seconds;
  if (row.answer === null) stats.timeout++;
  else if (row.answer === row.a * row.b) stats.correct++;
  else stats.wrong++;
}
// Earlier versions kept just the last finished attempt for each stage.
if (!progress.stats) {
  progress.stats = {};
  for (const [index, rows] of Object.entries(progress.reports)) {
    if (!Array.isArray(rows) || !rows.length) continue;
    const stats = stageStats(index);
    stats.attempts = 1;
    stats.latest = rows;
    stats.legacy = true;
    rows.forEach(row => countAnswer(stats, row));
  }
  save();
}
function stageDetail(index, island, stats) {
  const complete = index < progress.completed;
  const status = complete ? 'Tamamlandı' : index > progress.completed ? 'Kilitli' :
    stats?.attempts ? 'Devam ediyor' : 'Sıradaki ada';
  const heading = '<b>' + (island+2) + ' · ' + islands[island] + '</b><small>' + status +
    (stats ? ' · ' + duration(stats.seconds) : '') + '</small>';
  if (!stats) return '<div class="stat-stage empty">' + heading + '</div>';
  const responses = stats.correct + stats.wrong + stats.timeout;
  const rows = stats.latest.map(row => {
    const product = row.a * row.b;
    const outcome = row.answer === null ? 'Süre doldu' : row.answer === product ? 'Doğru' : 'Cevap ' + row.answer;
    return '<li><b>' + row.a + ' × ' + row.b + ' = ' + product + '</b><span>' +
      outcome + ' · ' + duration(row.seconds) + '</span></li>';
  }).join('');
  return '<details class="stat-stage"><summary>' + heading + '</summary><div class="stat-body"><p>' +
    stats.attempts + ' kayıtlı deneme · ' + stats.correct + ' doğru · ' + stats.wrong + ' yanlış · ' +
    stats.timeout + ' süre dolumu</p>' + (responses ? '<p>Soru başına ortalama <b>' +
    duration(stats.seconds / responses) + '</b></p>' : '') +
    '<strong>Son deneme</strong>' + (rows ? '<ol>' + rows + '</ol>' : '<p>Henüz cevap kaydedilmedi.</p>') +
    (stats.legacy ? '<small>Önceki sürümden bu aşamanın yalnızca son denemesi aktarılabildi.</small>' : '') +
    '</div></details>';
}
function showStats() {
  const all = Object.values(progress.stats);
  const totalSeconds = all.reduce((sum, item) => sum + item.seconds, 0);
  const summaries = secondsPerRound.map((seconds, r) => {
    const first = r * islands.length;
    const done = Math.min(islands.length, Math.max(0, progress.completed - first));
    const details = islands.map((_, i) => stageDetail(first+i, i, progress.stats[first+i])).join('');
    const time = islands.reduce((sum, _, i) => sum + (progress.stats[first+i]?.seconds || 0), 0);
    return '<details class="stat-round" ' + (r === round() ? 'open' : '') +
      '><summary><b>Tur ' + (r+1) + ' · ' + seconds + ' sn/soru</b><small>' + done +
      ' / 9 ada tamamlandı · ' + duration(time) + '</small></summary>' + details + '</details>';
  }).join('');
  $('stats-content').innerHTML = '<p class="stat-total"><b>' + progress.completed + ' / ' + total +
    ' aşama tamamlandı</b><br>Kayıtlı cevap süresi · ' + duration(totalSeconds) +
    '</p><p>Süreler, cevaplanan veya süresi dolan sorularda geçirilen zamanı gösterir. Kayıtlar bu tarayıcıda tutulur.</p>' +
    summaries;
  $('stats').showModal();
  $('stats').scrollTop = 0;
}
$('open-stats').onclick = showStats;
$('close-stats').onclick = () => $('stats').close();
