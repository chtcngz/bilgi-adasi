#!/usr/bin/env python3
"""Cuts the Arabic readings out of the owner's recordings → app/sound/ (the Sesler page, …/bilgi-adasi/sound/).

The recordings are sound-samples/original/Elifle Animasyonlu Elifba <n>.mp3 (Turkish narration, songs and Arabic readings,
with music under the voice). sound-samples/kesimler.json lists every reading to keep: its id (the file name), its name, its
writing, its Turkish reading, its kind (kategori), for the readings of one letter the letter (harf: 0 elif … 27 ye as in
islands/elif-ba/data.js, or 'hemze') and its hareke (h: 0-2), which set it beside the game's clip of the same reading on the
page, and where it is (dosya: the recording's number, bas/son: start and end in seconds). The times were found by transcribing the recordings with Whisper (large-v3-turbo) and cutting at the quiet gaps
around each reading; correct a cut by changing its times in kesimler.json and running this again.

Every reading is cleaned before it is written:
- the music is taken out by spectral gating (noisereduce), with the music heard alone near the reading (the frames around
  it where nobody speaks) as the noise to remove, and what is left far below the voice is faded away (a soft expander);
- the cut ends where the voice has really died away: when nothing is said right after the reading, the end runs on into
  the voice's decay (at most 0.25 s, never into the next words); when words follow straight on, the cut stays and the
  end is faded out over 90 ms;
- a 15 ms fade in, 40 ms of silence before and 150 ms after, so a phone neither clips the start nor cuts the tail;
- every reading has the same loudness (the voiced part at -18 dBFS RMS, peaks under -1 dBFS).

Writes app/sound/ses/<id>.mp3 (mono, 64 kb/s) and app/sound/liste.js (window.sesListesi). Then bump SES_V in app/sound/sayfa.js and
liste.js?v= in app/sound/index.html, so no browser plays the old clips from its cache.
Needs ffmpeg and: pip install numpy scipy noisereduce
    python3 tools/ses_kes.py            # cuts every reading
"""
import json, os, subprocess

import numpy as np
import noisereduce
from scipy.ndimage import median_filter, uniform_filter1d

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, 'sound-samples', 'original', 'Elifle Animasyonlu Elifba {}.mp3')
LIST = os.path.join(ROOT, 'sound-samples', 'kesimler.json')
OUT = os.path.join(ROOT, 'app', 'sound')
SR = 44100
HOP = SR // 100          # 10 ms frames


def load(n):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', SOURCE.format(n), '-ac', '1', '-ar', str(SR),
                          '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def frames_db(y):
    n = len(y) // HOP
    return 20 * np.log10(np.sqrt((y[:n * HOP].reshape(-1, HOP) ** 2).mean(1)) + 1e-9)


def runs_of(on, gap=0, shortest=0):
    """[start, end) frame runs where `on` is true; runs closer than `gap` frames are joined, shorter ones dropped."""
    runs, k = [], 0
    while k < len(on):
        if on[k]:
            j = k
            while j < len(on) and on[j]:
                j += 1
            if runs and k - runs[-1][1] < gap:
                runs[-1][1] = j
            else:
                runs.append([k, j])
            k = j
        else:
            k += 1
    return [r for r in runs if r[1] - r[0] >= shortest]


def speech(x):
    """Where someone speaks: frames well above the music around them (3 s median)."""
    db = uniform_filter1d(frames_db(x), 3)
    floor = np.minimum(median_filter(db, size=301, mode='nearest'), np.percentile(db, 60))
    runs = runs_of(db > np.maximum(floor + 9, -50), gap=6, shortest=10)
    mask = np.zeros(len(db), bool)
    for a, b in runs:
        mask[a:b] = True
    return mask, runs


def clean(item, x, mask, runs):
    a, b = item['bas'], item['son']
    fa, fb = int(a * 100), int(b * 100)
    own = [r for r in runs if r[1] > fa and r[0] < fb]
    later = [r[0] for r in runs if r[0] >= fb and r not in own]
    cont_start = bool(own) and min(r[0] for r in own) < fa - 3     # words run straight into the reading
    cont_end = bool(own) and max(r[1] for r in own) > fb + 3       # words follow straight on
    hi = b if cont_end else max(b, min(b + 0.4, (min(later) / 100 if later else len(x) / SR) - 0.06))

    # the music alone near the reading is the noise to take out
    quiet = np.convolve(mask.astype(float), np.ones(31), 'same') == 0
    for span in (5, 12, 30):
        near = np.where(quiet[max(0, int((a - span) * 100)):int((b + span) * 100)])[0] + max(0, int((a - span) * 100))
        if len(near) >= 60:
            break
    noise = np.concatenate([x[k * HOP:(k + 1) * HOP] for k in near]) if len(near) else x[:SR // 2]
    c0, c1 = max(0, int((a - 0.5) * SR)), min(len(x), int((hi + 0.5) * SR))
    y = noisereduce.reduce_noise(y=x[c0:c1], sr=SR, y_noise=noise, stationary=True, prop_decrease=0.85,
                                 n_std_thresh_stationary=1.5)
    seg = y[int(a * SR) - c0:int(hi * SR) - c0]

    # soft expander: what stays far below the voice fades away
    e = frames_db(seg)
    g = uniform_filter1d(np.clip((e - (e.max() - 50)) / 12, 0, 1), 3)
    seg = seg * np.interp(np.arange(len(seg)), np.arange(len(g)) * HOP + HOP / 2, g)

    # the voice: loud frames (gaps under 120 ms joined) that touch the chosen cut, then its decay
    e = frames_db(seg)
    peak = e.max()
    loud = runs_of(e > peak - 36, gap=12)
    ca, cb = 2, int((b - a) * 100) - 2
    keep = [r for r in loud if r[1] > ca and r[0] < cb] or loud
    s, t = keep[0][0], keep[-1][1]
    if cont_start:
        s = 0
    else:
        while s > 0 and keep[0][0] - s < 5 and e[s - 1] > peak - 50:
            s -= 1
    if cont_end:
        t = max(t, min(len(e), cb + 2))
    else:
        # never past the chosen end into a word that follows closely; from there on only the decay, which
        # stops where the level rises again (the next word starting)
        t = start = min(t, cb + 2)
        low = e[t - 1]
        while t < len(e) and t - start < 25 and e[t] > peak - 52 and e[t] < low + 3:
            low = min(low, e[t])
            t += 1
    seg = seg[max(0, s * HOP - SR // 100):min(len(seg), t * HOP + SR // 50)]

    fade_in, fade_out = int(0.015 * SR), min(int((0.09 if cont_end else 0.06) * SR), len(seg) // 3)
    seg[:fade_in] *= 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, fade_in))
    seg[-fade_out:] *= 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, fade_out))

    e = frames_db(seg)
    voiced = np.concatenate([seg[k * HOP:(k + 1) * HOP] for k in np.where(e > e.max() - 20)[0]])
    seg = seg * 10 ** (-18 / 20) / max(np.sqrt(np.mean(voiced ** 2)), 1e-6)
    seg = seg * min(1, 10 ** (-1 / 20) / np.abs(seg).max())
    return np.concatenate([np.zeros(int(0.04 * SR)), seg, np.zeros(int(0.15 * SR))]).astype(np.float32)


def write_mp3(y, target):
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-',
                    '-c:a', 'libmp3lame', '-b:a', '64k', '-map_metadata', '-1', target], input=y.tobytes(), check=True)


def main():
    data = json.load(open(LIST, encoding='utf-8'))
    ids = [s['id'] for s in data['sesler']]
    assert len(ids) == len(set(ids)), 'an id is used twice'
    kinds = {k['id'] for k in data['kategoriler']}
    for item in data['sesler']:
        assert item['kat'] in kinds, item['id'] + ': unknown kategori'
        assert item['son'] > item['bas'], item['id'] + ': empty cut'
    os.makedirs(os.path.join(OUT, 'ses'), exist_ok=True)
    for n in sorted({s['dosya'] for s in data['sesler']}):
        x = load(n)
        mask, runs = speech(x)
        for item in (s for s in data['sesler'] if s['dosya'] == n):
            write_mp3(clean(item, x, mask, runs), os.path.join(OUT, 'ses', item['id'] + '.mp3'))
    # drop the files of readings no longer listed
    for name in os.listdir(os.path.join(OUT, 'ses')):
        if name.endswith('.mp3') and name[:-4] not in ids:
            os.remove(os.path.join(OUT, 'ses', name))
    with open(os.path.join(OUT, 'liste.js'), 'w', encoding='utf-8') as f:
        f.write('// Generated by tools/ses_kes.py from sound-samples/kesimler.json: do not edit by hand.\n')
        f.write('window.sesListesi = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print(len(ids), 'readings →', os.path.relpath(OUT, ROOT))


if __name__ == '__main__':
    main()
