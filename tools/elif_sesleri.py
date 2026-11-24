"""Fetch and prepare the recorded voices for Elif Ba Adası.

Run from the repository root:  python3 tools/elif_sesleri.py
Needs ffmpeg and numpy. Two open sources are used:

* Syllables (be, bi, bu ... 84 of them): the "Pelafalan Huruf Hijaiyah" data set
  on Hugging Face (Reinjin), read by students of Pondok Tahfidz Yanbuul Qur'an,
  Kudus; Academic Free License 3.0. One reader is used throughout so the island
  has one voice; the better of the reader's two takes of each syllable is kept.
* Letter names (elif, be, te ...): the Internet Archive item elifba_tektek_harfler,
  28 names read the Turkish Elif-Ba way (no licence stated; used by the project
  owner's decision). With --harf-kaynagi lingualibre: Lingua Libre volunteers
  reading single Arabic letters on Wikimedia Commons, licence read from Commons.

Downloads are kept in tools/.ses-onbellek (ignored by git). Every
clip is trimmed of silence, levelled and saved as a small mono MP3 under
app/assets/audio/elif-ba/ (harf/NN.mp3 and hece/NN-H.mp3, NN = letter index with
00 = Elif, H = 0 üstün, 1 esre, 2 ötre). app/assets/audio/elif-ba/kayitlar.js tells the
game which clips exist; anything missing is read by the device's Turkish voice.
KAYNAKLAR.md lists every source and licence, as the licences require.

    --yalniz hece|harf     only refresh one of the two parts
    --klasor KLASOR        use your own recordings instead (a teacher's voice):
                           NN.wav for letter names, NN-H.wav for syllables
    --kaynak "..."         credit line for --klasor
"""
import argparse
import hashlib
import html
import io
import json
import pathlib
import re
import subprocess
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
import wave
import zipfile

import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'app' / 'assets' / 'audio' / 'elif-ba'
CACHE = ROOT / 'tools' / '.ses-onbellek'
STATE = OUT / 'kaynak.json'
LETTERS = 'ابتثجحخدذرزسشصضطظعغفقكلمنوهي'
NAMES = ['Elif', 'Be', 'Te', 'Se', 'Cim', 'Ha', 'Hı', 'Dal', 'Zel', 'Ra', 'Ze', 'Sin', 'Şın', 'Sad',
         'Dad', 'Tı', 'Zı', 'Ayn', 'Gayn', 'Fe', 'Kaf', 'Kef', 'Lâm', 'Mim', 'Nun', 'Vav', 'He', 'Ye']
HAREKE = ['üstün', 'esre', 'ötre']
UA = 'bilgi-adasi/0.2 (Elif Ba educational game; one-off download of a few clips)'

# Lingua Libre: one voice for as many letters as possible, the second fills the gaps.
SPEAKERS = ['AlNatiq', 'Zinou2go']
# Hugging Face syllables. Fadli has the cleanest complete set; his ع with ötre measures
# like an "i", so the three ع syllables come from Hamzah_MTS, whose vowels measure right.
SYLLABLES_URL = 'https://huggingface.co/datasets/Reinjin/Pelafalan_Huruf_Hijaiyah/resolve/main/dataset.zip'
SYLLABLES_PAGE = 'https://huggingface.co/datasets/Reinjin/Pelafalan_Huruf_Hijaiyah'
SYLLABLE_VOICE = 'Fadli'
SYLLABLE_VOICE_FOR = {17: 'Hamzah_MTS'}
# The data set orders ... ن ه و ي; the game follows the Elif-Ba order ... ن و ه ي.
DATASET_TO_GAME = {25: 26, 26: 25}


def get(url, binary=False):
    while True:
        try:
            request = urllib.request.Request(url, headers={'User-Agent': UA})
            with urllib.request.urlopen(request, timeout=300) as response:
                data = response.read()
            return data if binary else json.loads(data)
        except urllib.error.HTTPError as error:
            if error.code not in (429, 503):
                raise
            wait = int(error.headers.get('retry-after') or 60) + 5
            print(f'  server asks to wait {wait} s ...', flush=True)
            time.sleep(wait)


def prepare(source, target):
    """Trim silence at both ends, level the loudness and save as mono MP3."""
    trim = ('silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.04,'
            'areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse,'
            'loudnorm=I=-18:TP=-2:LRA=7,afade=t=in:d=0.01')
    target.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(source), '-af', trim, '-ac', '1', '-ar', '44100',
                    '-c:a', 'libmp3lame', '-b:a', '80k', str(target)], check=True)


def clarity(data):
    """Loud speech against a quiet background, in dB; a clipped take scores lower."""
    with wave.open(io.BytesIO(data)) as w:
        width, channels = w.getsampwidth(), w.getnchannels()
        x = np.frombuffer(w.readframes(w.getnframes()), {1: np.uint8, 2: np.int16, 4: np.int32}[width]).astype(float)
        rate = w.getframerate()
    x = (x - 128) / 128 if width == 1 else x / 2 ** (8 * width - 1)
    if channels > 1:
        x = x.reshape(-1, channels).mean(1)
    size = int(rate * 0.02)
    frames = x[:len(x) // size * size].reshape(-1, size)
    level = 20 * np.log10(np.sqrt((frames ** 2).mean(1)) + 1e-9)
    return np.percentile(level, 95) - np.percentile(level, 10) - 400 * (np.abs(x) > 0.99).mean()


def load_state():
    if STATE.exists():
        return json.loads(STATE.read_text(encoding='utf-8'))
    return {'harf': {}, 'hece': {}, 'sources': {}}


def save_state(state):
    STATE.write_text(json.dumps(state, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    harf = ',\n'.join(f"    {i}: 'assets/audio/elif-ba/harf/{int(i):02d}.mp3'" for i in sorted(state['harf'], key=int))
    hece = ',\n'.join(f"    '{k}': 'assets/audio/elif-ba/hece/{int(k.split('-')[0]):02d}-{k.split('-')[1]}.mp3'"
                      for k in sorted(state['hece'], key=lambda k: tuple(map(int, k.split('-')))))
    credit = ' '.join(source['credit'] for source in state['sources'].values())
    (OUT / 'kayitlar.js').write_text(
        '// Recorded voice clips for Elif Ba, written by tools/elif_sesleri.py; anything missing\n'
        "// is read by the device's Turkish voice instead. Sources and licences: KAYNAKLAR.md\n"
        'window.elifRecordings = {\n  harf: {\n' + harf + '\n  },\n  hece: {\n' + hece + '\n  },\n  credit: ' +
        json.dumps(credit, ensure_ascii=False) + '\n};\n', encoding='utf-8')
    notes = ['# Elif Ba ses kayıtları: kaynaklar', '',
             'Oyundaki kayıtlarda yalnızca baştaki ve sondaki sessizlik kırpıldı ve ses düzeyi eşitlendi',
             '(`tools/elif_sesleri.py`). Kaydı olmayan harf ve heceleri cihazın Türkçe sesi okur.']
    for source in state['sources'].values():
        notes += ['', '## ' + source['title'], ''] + source['notes']
    (OUT / 'KAYNAKLAR.md').write_text('\n'.join(notes) + '\n', encoding='utf-8')


def syllables(state):
    CACHE.mkdir(parents=True, exist_ok=True)
    archive = CACHE / 'pelafalan_huruf_hijaiyah.zip'
    if not archive.exists():
        print('Downloading the syllable data set (about 240 MB) ...', flush=True)
        archive.write_bytes(get(SYLLABLES_URL, binary=True))
    takes = {}
    with zipfile.ZipFile(archive) as z:
        for name in z.namelist():
            match = re.match(r'(\d+)\. (\w+?)_(fathah|kasroh|dommah)/(.+?)_\2_\3(?:_\d+)?\.wav$', name)
            if not match:
                continue
            number = int(match.group(1)) - 1
            letter = DATASET_TO_GAME.get(number // 3, number // 3)
            if match.group(4) == SYLLABLE_VOICE_FOR.get(letter, SYLLABLE_VOICE):
                takes.setdefault((letter, number % 3), []).append(name)
        state['hece'] = {}
        with tempfile.TemporaryDirectory() as folder:
            for (letter, hareke), names in sorted(takes.items()):
                best = max(names, key=lambda n: clarity(z.read(n)))
                raw = pathlib.Path(folder) / 'take.wav'
                raw.write_bytes(z.read(best))
                prepare(raw, OUT / 'hece' / f'{letter:02d}-{hareke}.mp3')
                state['hece'][f'{letter}-{hareke}'] = best.split('/')[-1]
    readers = sorted({SYLLABLE_VOICE, *SYLLABLE_VOICE_FOR.values()})
    state['sources']['hece'] = {
        'title': 'Heceler (üstün, esre, ötre)',
        'credit': 'Heceler: Pelafalan Huruf Hijaiyah veri seti, Pondok Tahfidz Yanbuul Qur’an Kudus öğrencileri '
                  '(Reinjin), AFL-3.0.',
        'notes': [
            f'84 hece, Hugging Face’teki [Pelafalan Huruf Hijaiyah]({SYLLABLES_PAGE}) veri setinden alındı. Veri seti',
            'Endonezya’nın Kudus şehrindeki Pondok Tahfidz Yanbuul Qur’an hafızlık okulunun MTs/MA öğrencilerinin',
            'okuyuşlarından oluşuyor ve [Academic Free License 3.0](https://opensource.org/license/afl-3-0-php)',
            'ile yayımlanıyor (veri setini hazırlayan: Reinjin).', '',
            'Oyunda tek bir ses duyulsun diye her hece aynı öğrencinin iki okuyuşundan daha temiz olanından alındı: '
            + ', '.join(readers) + '. ع harfinin üç hecesi Hamzah_MTS’ten, diğerleri Fadli’den.', '',
            '| Harf | Üstün | Esre | Ötre |', '|---|---|---|---|'] + [
            f'| {LETTERS[i]} {NAMES[i]} | ' + ' | '.join(f"`{state['hece'].get(f'{i}-{h}', '—')}`" for h in range(3)) + ' |'
            for i in range(28)]}
    print(len(state['hece']), 'syllables written')


def commons_title(speaker, letter):
    return f'File:LL-Q13955 (ara)-{speaker}-{letter}.wav'


def file_info(titles):
    """Licence, author and download address of each Commons file that exists."""
    found = {}
    for start in range(0, len(titles), 50):
        query = urllib.parse.urlencode({
            'action': 'query', 'format': 'json', 'prop': 'imageinfo', 'iiprop': 'url|extmetadata',
            'iiextmetadatafilter': 'LicenseShortName|Artist|LicenseUrl', 'titles': '|'.join(titles[start:start + 50])})
        data = get('https://commons.wikimedia.org/w/api.php?' + query)
        for page in data['query']['pages'].values():
            if 'imageinfo' not in page:
                continue
            info = page['imageinfo'][0]
            meta = info.get('extmetadata', {})
            artist = re.sub('<[^>]+>', '', html.unescape(meta.get('Artist', {}).get('value', ''))).strip()
            found[page['title']] = {
                'url': info['url'], 'page': info['descriptionurl'],
                'license': meta.get('LicenseShortName', {}).get('value', ''),
                'license_url': meta.get('LicenseUrl', {}).get('value', ''), 'artist': artist}
        time.sleep(2)
    return found


def letter_names(state):
    titles = [commons_title(s, l) for s in SPEAKERS for l in LETTERS]
    print('Looking up', len(titles), 'Commons files ...', flush=True)
    info = file_info(titles)
    chosen = {}
    for i, letter in enumerate(LETTERS):
        for speaker in SPEAKERS:
            title = commons_title(speaker, letter)
            if title in info:
                chosen[i] = (speaker, title, info[title])
                break
    CACHE.mkdir(parents=True, exist_ok=True)
    state['harf'] = {}
    rows = []
    for i, (speaker, title, meta) in sorted(chosen.items()):
        raw = CACHE / (hashlib.md5(title.encode()).hexdigest() + '.wav')
        if not raw.exists():
            print(f'  downloading {NAMES[i]} ({speaker})', flush=True)
            raw.write_bytes(get(meta['url'], binary=True))
            time.sleep(3)
        prepare(raw, OUT / 'harf' / f'{i:02d}.mp3')
        state['harf'][str(i)] = title[5:]
        rows.append(f"| {LETTERS[i]} {NAMES[i]} | {meta['artist'] or speaker} | "
                    f"[{meta['license']}]({meta['license_url']}) | [{title[5:]}]({meta['page']}) |")
        save_state(state)  # a long download can be resumed
    missing = [NAMES[i] for i in range(28) if i not in chosen]
    licences = sorted({meta['license'] for _, _, meta in chosen.values()})
    speakers = sorted({speaker for speaker, _, _ in chosen.values()})
    state['sources']['harf'] = {
        'title': 'Harf adları',
        'credit': 'Harf adları: Lingua Libre gönüllüleri (' + ', '.join(speakers) + '), ' + ', '.join(licences) + '.',
        'notes': ['Harf adları [Lingua Libre](https://lingualibre.org) projesinde ana dili Arapça olan gönüllülerin',
                  'tek tek okuduğu harflerden alındı; dosyalar Wikimedia Commons’ta aşağıdaki lisanslarla yayımlanıyor.',
                  '', '| Harf | Okuyan | Lisans | Kaynak |', '|---|---|---|---|'] + rows +
                 ([ '', 'Kaydı bulunamayan harfler: ' + ', '.join(missing) + '.'] if missing else [])}
    print(len(rows), 'letter names written; missing:', ', '.join(missing) or 'none')


ARCHIVE_ITEM = 'elifba_tektek_harfler'
# 28 letter names read the Turkish Elif-Ba way, one voice. The item lists ه before و.
ARCHIVE_FILES = ['01_elif', '02_ba', '03_ta', '04_se', '05_cim', '06_ha', '07_hi', '08_dal', '09_zal', '10_ra',
                 '11_ze', '12_sin', '13_shin', '14_sad', '15_dad', '16_ta', '17_za', '18_ayn', '19_gayn', '20_fe',
                 '21_gaf', '22_kef', '23_lam', '24_mim', '25_nun', '27_vav', '26_he', '28_ya']


def letter_names_archive(state):
    """Letter names from the Internet Archive item elifba_tektek_harfler."""
    meta = get(f'https://archive.org/metadata/{ARCHIVE_ITEM}')['metadata']
    CACHE.mkdir(parents=True, exist_ok=True)
    state['harf'] = {}
    for i, stem in enumerate(ARCHIVE_FILES):
        raw = CACHE / f'{ARCHIVE_ITEM}-{stem}.mp3'
        if not raw.exists():
            print(f'  downloading {NAMES[i]}', flush=True)
            raw.write_bytes(get(f'https://archive.org/download/{ARCHIVE_ITEM}/{stem}.mp3', binary=True))
        prepare(raw, OUT / 'harf' / f'{i:02d}.mp3')
        state['harf'][str(i)] = stem + '.mp3'
    page = f'https://archive.org/details/{ARCHIVE_ITEM}'
    state['sources']['harf'] = {
        'title': 'Harf adları',
        'credit': 'Harf adları: Internet Archive, “' + meta.get('title', ARCHIVE_ITEM) + '”.',
        'notes': [f'28 harfin Türkçe Elif-Ba usulüyle okunan adları Internet Archive’daki [{meta.get("title", ARCHIVE_ITEM)}]({page})',
                  f'kaydından alındı (yükleyen: Sesli Tefsir, {meta.get("publicdate", "")[:10]}). Kayıtta bir lisans belirtilmemiş;',
                  'oyunda kullanılması proje sahibinin kararıdır. Hak sahibi isterse kayıtlar kaldırılır ve harf adlarını',
                  'cihazın Türkçe sesi okur.', '', '| Harf | Dosya |', '|---|---|'] +
                 [f'| {LETTERS[i]} {NAMES[i]} | [{stem}.mp3](https://archive.org/download/{ARCHIVE_ITEM}/{stem}.mp3) |'
                  for i, stem in enumerate(ARCHIVE_FILES)]}
    print(len(state['harf']), 'letter names written')


def own_folder(state, folder, credit):
    state['harf'], state['hece'] = {}, {}
    for path in sorted(pathlib.Path(folder).iterdir()):
        match = re.fullmatch(r'(\d\d)(?:-([012]))?', path.stem)
        if not match or int(match.group(1)) > 27:
            continue
        i = int(match.group(1))
        if match.group(2) is None:
            prepare(path, OUT / 'harf' / f'{i:02d}.mp3')
            state['harf'][str(i)] = path.name
        else:
            prepare(path, OUT / 'hece' / f'{i:02d}-{match.group(2)}.mp3')
            state['hece'][f'{i}-{match.group(2)}'] = path.name
    state['sources'] = {'kendi': {'title': 'Kendi kayıtlarımız', 'credit': credit, 'notes': [credit]}}
    print(len(state['harf']), 'letter names and', len(state['hece']), 'syllables written from', folder)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--yalniz', choices=['hece', 'harf'], help='refresh only syllables or only letter names')
    parser.add_argument('--harf-kaynagi', choices=['arsiv', 'lingualibre'], default='arsiv',
                        help='letter names from the Internet Archive set (Turkish names) or Lingua Libre')
    parser.add_argument('--klasor', help='folder with your own recordings: NN.wav and NN-H.wav')
    parser.add_argument('--kaynak', default='Sesler: kendi kaydımız.', help='credit line for --klasor')
    args = parser.parse_args()
    state = load_state()
    if args.klasor:
        own_folder(state, args.klasor, args.kaynak)
    else:
        if args.yalniz in (None, 'hece'):
            syllables(state)
            save_state(state)
        if args.yalniz in (None, 'harf'):
            letter_names_archive(state) if args.harf_kaynagi == 'arsiv' else letter_names(state)
    save_state(state)
