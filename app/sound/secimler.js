// The owner's choices on the Sesler page (sound/index.html), sent on 28.11.2026: the clips that stay. The page shows them
// in its ✓ Seçilenler tab, marks them "kayıtlı" in the sections and lists every reading without one under 🎙 Seslendirilecekler.
// onay: the game's clips approved (✓), as the page names them (cocuk:<kind>:<key> in elifRecordings.cocuk);
// yeni: the new clips chosen (⇄), ids of sound/liste.js (sound/ses/<id>.mp3). Add a later choice here when the owner sends it.
window.sesSecimleri = {
  solKayit: ['cocuk:hece:14-0', 'cocuk:hece:14-1', 'cocuk:tenvin:14-0', 'cocuk:tenvin:14-2'],
  onay: [
    'cocuk:harf:1', 'cocuk:harf:5', 'cocuk:harf:6', 'cocuk:harf:7', 'cocuk:harf:8', 'cocuk:hece:26-2', 'cocuk:tenvin:14-1',
    'cocuk:harf:0', 'cocuk:harf:hemze', 'cocuk:harf:2', 'cocuk:harf:3', 'cocuk:harf:4', 'cocuk:harf:9',
    'cocuk:harf:11', 'cocuk:harf:12', 'cocuk:harf:13', 'cocuk:harf:19', 'cocuk:harf:20', 'cocuk:harf:21',
    'cocuk:harf:22', 'cocuk:harf:23', 'cocuk:harf:24', 'cocuk:harf:25', 'cocuk:harf:26', 'cocuk:harf:27',
    'cocuk:hece:0-0', 'cocuk:hece:0-1', 'cocuk:hece:0-2', 'cocuk:hece:1-0', 'cocuk:hece:1-1', 'cocuk:hece:1-2',
    'cocuk:hece:2-0', 'cocuk:hece:2-1', 'cocuk:hece:2-2', 'cocuk:hece:3-0', 'cocuk:hece:3-1', 'cocuk:hece:3-2',
    'cocuk:hece:4-0', 'cocuk:hece:4-1', 'cocuk:hece:4-2', 'cocuk:hece:5-0', 'cocuk:hece:5-1', 'cocuk:hece:5-2',
    'cocuk:hece:6-0', 'cocuk:hece:6-1', 'cocuk:hece:6-2', 'cocuk:hece:7-0', 'cocuk:hece:7-1', 'cocuk:hece:7-2',
    'cocuk:hece:8-0', 'cocuk:hece:8-1', 'cocuk:hece:8-2', 'cocuk:hece:9-0', 'cocuk:hece:9-1', 'cocuk:hece:9-2',
    'cocuk:hece:10-0', 'cocuk:hece:10-1', 'cocuk:hece:10-2', 'cocuk:hece:11-0', 'cocuk:hece:11-1', 'cocuk:hece:11-2',
    'cocuk:hece:12-0', 'cocuk:hece:12-1', 'cocuk:hece:12-2', 'cocuk:hece:13-0', 'cocuk:hece:13-1', 'cocuk:hece:13-2',
    'cocuk:hece:14-2', 'cocuk:hece:16-0', 'cocuk:hece:16-1', 'cocuk:hece:16-2', 'cocuk:hece:17-0', 'cocuk:hece:17-1',
    'cocuk:hece:17-2', 'cocuk:hece:18-0', 'cocuk:hece:18-1', 'cocuk:hece:18-2', 'cocuk:hece:19-0', 'cocuk:hece:19-1',
    'cocuk:hece:19-2', 'cocuk:hece:20-0', 'cocuk:hece:20-1', 'cocuk:hece:20-2', 'cocuk:hece:21-0', 'cocuk:hece:21-1',
    'cocuk:hece:21-2', 'cocuk:hece:22-0', 'cocuk:hece:22-1', 'cocuk:hece:22-2', 'cocuk:hece:23-0', 'cocuk:hece:23-1',
    'cocuk:hece:23-2', 'cocuk:hece:24-0', 'cocuk:hece:24-1', 'cocuk:hece:24-2', 'cocuk:hece:25-0', 'cocuk:hece:25-1',
    'cocuk:hece:25-2', 'cocuk:hece:26-0', 'cocuk:hece:26-1', 'cocuk:hece:27-0', 'cocuk:hece:27-1', 'cocuk:hece:27-2',
    'cocuk:tenvin:0-0', 'cocuk:tenvin:0-1', 'cocuk:tenvin:0-2', 'cocuk:tenvin:1-0', 'cocuk:tenvin:1-1',
    'cocuk:tenvin:1-2', 'cocuk:tenvin:2-0', 'cocuk:tenvin:2-1', 'cocuk:tenvin:2-2', 'cocuk:tenvin:3-0',
    'cocuk:tenvin:3-1', 'cocuk:tenvin:3-2', 'cocuk:tenvin:4-0', 'cocuk:tenvin:4-1', 'cocuk:tenvin:4-2',
    'cocuk:tenvin:5-0', 'cocuk:tenvin:5-1', 'cocuk:tenvin:5-2', 'cocuk:tenvin:6-0', 'cocuk:tenvin:6-1',
    'cocuk:tenvin:6-2', 'cocuk:tenvin:7-0', 'cocuk:tenvin:7-1', 'cocuk:tenvin:7-2', 'cocuk:tenvin:8-0',
    'cocuk:tenvin:8-1', 'cocuk:tenvin:8-2', 'cocuk:tenvin:9-0', 'cocuk:tenvin:9-1', 'cocuk:tenvin:9-2',
    'cocuk:tenvin:10-0', 'cocuk:tenvin:10-1', 'cocuk:tenvin:10-2', 'cocuk:tenvin:11-0', 'cocuk:tenvin:11-1',
    'cocuk:tenvin:11-2', 'cocuk:tenvin:12-0', 'cocuk:tenvin:12-1', 'cocuk:tenvin:12-2', 'cocuk:tenvin:13-0',
    'cocuk:tenvin:13-1', 'cocuk:tenvin:13-2', 'cocuk:tenvin:16-0', 'cocuk:tenvin:16-1', 'cocuk:tenvin:16-2',
    'cocuk:tenvin:17-0', 'cocuk:tenvin:17-1', 'cocuk:tenvin:17-2', 'cocuk:tenvin:18-0', 'cocuk:tenvin:18-1',
    'cocuk:tenvin:18-2', 'cocuk:tenvin:19-0', 'cocuk:tenvin:19-1', 'cocuk:tenvin:19-2', 'cocuk:tenvin:20-0',
    'cocuk:tenvin:20-1', 'cocuk:tenvin:20-2', 'cocuk:tenvin:21-0', 'cocuk:tenvin:21-1', 'cocuk:tenvin:21-2',
    'cocuk:tenvin:22-0', 'cocuk:tenvin:22-1', 'cocuk:tenvin:22-2', 'cocuk:tenvin:23-0', 'cocuk:tenvin:23-1',
    'cocuk:tenvin:23-2', 'cocuk:tenvin:24-0', 'cocuk:tenvin:24-1', 'cocuk:tenvin:24-2', 'cocuk:tenvin:25-0',
    'cocuk:tenvin:25-1', 'cocuk:tenvin:25-2', 'cocuk:tenvin:26-0', 'cocuk:tenvin:26-1', 'cocuk:tenvin:26-2',
    'cocuk:tenvin:27-0', 'cocuk:tenvin:27-1', 'cocuk:tenvin:27-2'
  ],
  yeni: [
    'aday-harf-10', 'aday-harf-16-r2',
    'ustun-hemze', 'esre-hemze', 'otre-hemze', 'iki-ustun-hemze', 'iki-esre-hemze', 'iki-otre-hemze'
  ]
};
