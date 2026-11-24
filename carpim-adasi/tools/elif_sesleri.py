"""Fetch and prepare the recorded letter voices for Elif Ba Adası.

Run from the repository root:  python3 carpim-adasi/tools/elif_sesleri.py
Needs ffmpeg. The recordings come from Lingua Libre (native speakers reading
single Arabic letters) and are stored on Wikimedia Commons; their licence and
author are read from Commons and written next to the clips, because the
licences ask for attribution.

Each source file is downloaded once into carpim-adasi/tools/.ses-onbellek
(ignored by git). Every clip is trimmed of silence, levelled and saved as a
small mono MP3 in dist/elif-ba/ses/harf/NN.mp3 (NN = letter index, 00 = Elif).
dist/elif-ba/ses/kayitlar.js tells the game which clips exist; a letter with
no clip is read by the device's Turkish voice instead.

To use your own recordings (a teacher's voice, say), put WAV/MP3/M4A files
named 00.wav ... 27.wav in a folder and run:
    python3 carpim-adasi/tools/elif_sesleri.py --klasor KLASOR --kaynak "Ses: ..."
"""
import argparse
import hashlib
import html
import json
import pathlib
import re
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'dist' / 'elif-ba' / 'ses'
CACHE = ROOT / 'tools' / '.ses-onbellek'
LETTERS = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي'
NAMES = ['Elif', 'Be', 'Te', 'Se', 'Cim', 'Ha', 'Hı', 'Dal', 'Zel', 'Ra', 'Ze', 'Sin', 'Şın', 'Sad',
         'Dad', 'Tı', 'Zı', 'Ayn', 'Gayn', 'Fe', 'Kaf', 'Kef', 'Lâm', 'Mim', 'Nun', 'Vav', 'He', 'Ye']
UA = 'bilgi-adasi/0.2 (Elif Ba educational game; one-off download of a few clips)'
# One voice for as many letters as possible; the second speaker fills the gaps.
SPEAKERS = ['AlNatiq', 'Zinou2go']


def commons_title(speaker, letter):
    return f'File:LL-Q13955 (ara)-{speaker}-{letter}.wav'


def get(url, binary=False):
    while True:
        try:
            request = urllib.request.Request(url, headers={'User-Agent': UA})
            with urllib.request.urlopen(request, timeout=60) as response:
                data = response.read()
            return data if binary else json.loads(data)
        except urllib.error.HTTPError as error:
            if error.code not in (429, 503):
                raise
            wait = int(error.headers.get('retry-after') or 60) + 5
            print(f'  Wikimedia asks to wait {wait} s ...', flush=True)
            time.sleep(wait)


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


def prepare(source, target):
    """Trim silence at both ends, level the loudness and save as mono MP3."""
    trim = ('silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.04,'
            'areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse,'
            'loudnorm=I=-18:TP=-2:LRA=7,afade=t=in:d=0.01')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(source), '-af', trim, '-ac', '1', '-ar', '44100',
                    '-c:a', 'libmp3lame', '-b:a', '80k', str(target)], check=True)


def write_manifest(clips, credit):
    lines = ',\n'.join(f"    {i}: 'elif-ba/ses/harf/{i:02d}.mp3'" for i in sorted(clips))
    (OUT / 'kayitlar.js').write_text(
        '// Recorded voice clips for Elif Ba, written by tools/elif_sesleri.py; a letter with no clip\n'
        "// is read by the device's Turkish voice instead. Sources and licences: KAYNAKLAR.md\n"
        'window.elifRecordings = {\n  harf: {\n' + lines + '\n  },\n  hece: {},\n  credit: ' +
        json.dumps(credit, ensure_ascii=False) + '\n};\n', encoding='utf-8')


def from_lingua_libre():
    titles = [commons_title(s, l) for s in SPEAKERS for l in LETTERS]
    print('Looking up', len(titles), 'Commons files ...')
    info = file_info(titles)
    chosen = {}
    for i, letter in enumerate(LETTERS):
        for speaker in SPEAKERS:
            title = commons_title(speaker, letter).replace('_', ' ')
            if title in info:
                chosen[i] = (speaker, title, info[title])
                break
    CACHE.mkdir(parents=True, exist_ok=True)
    (OUT / 'harf').mkdir(parents=True, exist_ok=True)
    rows = []
    for i, (speaker, title, meta) in sorted(chosen.items()):
        raw = CACHE / (hashlib.md5(title.encode()).hexdigest() + '.wav')
        if not raw.exists():
            print(f'  downloading {NAMES[i]} ({speaker})', flush=True)
            raw.write_bytes(get(meta['url'], binary=True))
            time.sleep(3)
        prepare(raw, OUT / 'harf' / f'{i:02d}.mp3')
        rows.append((i, speaker, title, meta))
    missing = [NAMES[i] for i in range(28) if i not in chosen]
    speakers = sorted({speaker for _, speaker, _, _ in rows})
    licences = sorted({meta['license'] for *_, meta in rows})
    credit = ('Harf sesleri: Lingua Libre gönüllüleri (' + ', '.join(speakers) + '), ' + ', '.join(licences) +
              '. Kaydı olmayan harfler cihazın Türkçe sesiyle okunur.')
    write_manifest({i for i, *_ in rows}, credit)
    notes = ['# Elif Ba harf sesleri: kaynaklar', '',
             'Harflerin ses kayıtları [Lingua Libre](https://lingualibre.org) projesinde ana dili Arapça olan',
             'gönüllülerin tek tek okuduğu harflerden alındı. Dosyalar Wikimedia Commons’ta, aşağıdaki',
             'lisanslarla yayımlanıyor. Oyundaki sürümlerde yalnızca baştaki ve sondaki sessizlik kırpıldı ve',
             'ses düzeyi eşitlendi (`carpim-adasi/tools/elif_sesleri.py`).', '',
             '| Harf | Okuyan | Lisans | Kaynak |', '|---|---|---|---|']
    for i, speaker, title, meta in rows:
        notes.append(f"| {LETTERS[i]} {NAMES[i]} | {meta['artist'] or speaker} | "
                     f"[{meta['license']}]({meta['license_url']}) | [{title[5:]}]({meta['page']}) |")
    if missing:
        notes += ['', 'Kaydı bulunamayan harfler (cihazın Türkçe sesiyle okunur): ' + ', '.join(missing) + '.']
    (OUT / 'KAYNAKLAR.md').write_text('\n'.join(notes) + '\n', encoding='utf-8')
    print(f'{len(rows)} clips written; missing: {", ".join(missing) or "none"}')


def from_folder(folder, credit):
    (OUT / 'harf').mkdir(parents=True, exist_ok=True)
    clips = set()
    for path in sorted(pathlib.Path(folder).iterdir()):
        if path.stem.isdigit() and 0 <= int(path.stem) < 28:
            prepare(path, OUT / 'harf' / f'{int(path.stem):02d}.mp3')
            clips.add(int(path.stem))
    write_manifest(clips, credit)
    print(f'{len(clips)} clips written from {folder}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--klasor', help='folder with your own recordings named 00 ... 27')
    parser.add_argument('--kaynak', default='Harf sesleri: kendi kaydımız.', help='credit line shown in settings')
    args = parser.parse_args()
    if args.klasor:
        from_folder(args.klasor, args.kaynak)
    else:
        from_lingua_libre()
