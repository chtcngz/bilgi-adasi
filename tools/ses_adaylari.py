"""Build the review-only Elif Ba candidates from the project's girl recordings.

Run from the repository root with Python, NumPy, SciPy and ffmpeg on PATH.
FFMPEG can also point to an ffmpeg executable.
"""
import json
import os
import subprocess
from functools import lru_cache
from pathlib import Path

import numpy as np
from scipy.ndimage import uniform_filter1d

RATE = 24000
FFMPEG = os.environ.get("FFMPEG", "ffmpeg")
VOICE = Path("app/assets/audio/elif-ba/cocuk")
SOUND = Path("app/sound")
items = []


@lru_cache(None)
def read(path):
    raw = subprocess.check_output([FFMPEG, "-v", "error", "-i", str(path),
                                   "-ar", str(RATE), "-ac", "1", "-f", "f32le", "-"])
    x = np.frombuffer(raw, dtype=np.float32).astype(float)
    level = np.sqrt(np.maximum(0, uniform_filter1d(x*x, RATE//100)))
    active = np.flatnonzero(level > max(.001, level.max() * .022))
    return x[max(0, active[0]-120):active[-1]+180]


def clip(kind, letter, vowel=None):
    suffix = "" if vowel is None else f"-{vowel}"
    return read(VOICE / kind / f"{letter:02}{suffix}.mp3")


def syllable(i, h):
    return clip("hece", i, h)


def nasal(i, h):
    return clip("tenvin", i, h)


def join(left, right):
    # Find a matching phase within one voice period at the cut, then crossfade.
    n = min(240, len(left)//3, len(right)//3)
    tail = left[-n:]
    windows = np.lib.stride_tricks.sliding_window_view(right[:n+120], n)
    score = (windows @ tail) / (np.linalg.norm(windows, axis=1) + 1e-9)
    right = right[int(np.argmax(score)):]
    fade = np.linspace(0, 1, n)
    return np.concatenate([left[:-n], tail*(1-fade) + right[:n]*fade, right[n:]])


def write(kind, key, samples, note, h=None):
    suffix = "" if h is None else f"-{h}"
    ident = f"aday-{kind}-{key}{suffix}"
    x = samples.copy()
    x *= min(.86 / max(abs(x)), .12 / np.sqrt(np.mean(x*x)))
    x[:96] *= np.linspace(0, 1, 96)
    x[-360:] *= np.linspace(1, 0, 360)
    x = np.pad(x, (720, 2160))
    subprocess.run([FFMPEG, "-v", "error", "-y", "-f", "f32le", "-ar", str(RATE),
                    "-ac", "1", "-i", "-", "-c:a", "libmp3lame", "-b:a", "96k",
                    str(SOUND / "ses" / (ident + ".mp3"))], input=x.astype("<f4").tobytes(), check=True)
    item = dict(id=ident, kat=kind, harf=key, ad="Kız sesi · yeni örnek", kaynak=note)
    if h is not None:
        item["h"] = h
    items.append(item)


def ms(x):
    return round(RATE*x/1000)


# Keep the original name ending, including the l, d or n, and use a separate
# take of the same Arabic consonant for the onset. Cuts are in trimmed audio.
names = {6:(165,190), 7:(150,57), 8:(186,100), 14:(162,150),
         15:(88,94), 16:(148,84), 17:(170,138), 18:(115,155)}
for i, (out_ms, in_ms) in names.items():
    start = syllable(i, 2 if i == 14 else 0)
    write("harf", i, join(start[:ms(out_ms)], clip("harf", i)[ms(in_ms):]),
          "Aynı harfin hece başlangıcı ve harf adının sonu")
write("harf", 1, read(Path("elifba-ses-onizleme/harf-adlari/02-be.mp3")), "Kızın ayrı Be kaydı")
for i in (5, 10):
    write("harf", i, syllable(i, 0), "Kızın onaylanan üstünlü okuyuşu")


def before_n(x):
    # Locate the sustained loss of high-frequency energy at the final nasal.
    frame = 480
    frames = np.lib.stride_tricks.sliding_window_view(x, frame)[::120]
    power = abs(np.fft.rfft(frames * np.hanning(frame), axis=1))**2
    ratio = 10*np.log10((power[:,24:].sum(1)+1e-12)/(power[:,:24].sum(1)+1e-12))
    lo, hi = int(.38*len(ratio)), int(.83*len(ratio))
    drops = [ratio[t-6:t].mean()-ratio[t:t+6].mean() for t in range(lo,hi)]
    return (lo+int(np.argmax(drops)))*120+frame//2


for i, vowels in ((14,(0,1)), (15,(0,1,2)), (26,(2,))):
    for h in vowels:
        take = nasal(i,h)
        x = take[:before_n(take)]
        if i == 14:
            # The initial closure and release come from the approved ضُ.
            x = join(syllable(14,2)[:ms(130)], x[ms(130):])
        write("harekeli", i, x, "Aynı harfin tenvin kaydından kısa hece"
              if i != 14 else "Onaylı ضُ başlangıcı ve aynı harfin harekesi", h)

for i in (14,15):
    for h in range(3):
        donor = nasal(13,h)
        end = before_n(donor)
        stem = syllable(i,h)
        if i == 14 and h != 2:
            stem = join(syllable(14,2)[:ms(130)], stem[ms(130):])
        write("tenvin", i, join(stem[:int(.82*len(stem))], donor[end-ms(35):]),
              "Aynı harfin hecesi ve onaylı Sad kaydından tenvin sonu", h)

# Each word ends with the approved tanwin of its actual last consonant.
# Shorten the first syllables at their vowel tails for connected reading.
words = [
    ([(21,2),(2,2)], (1,2)), ([(1,1),(0,0)], (6,1)),
    ([(25,1)], (9,2)), ([(20,0),(13,0)], (13,0)),
    ([(4,0),(24,0)], (19,0)), ([(19,0),(22,0)], (21,1)),
    ([(11,0),(21,0)], (24,0)),
]
for index, (parts, last) in enumerate(words):
    pieces = []
    for i,h in parts:
        x = syllable(i,h)
        pieces.append(x[:int(len(x)*.76)])
    if index == 2:  # وِزْرٌ: the medial z is unvowelled.
        pieces.append(syllable(10,0)[:ms(128)])
    pieces.append(nasal(*last))
    x = pieces[0]
    for part in pieces[1:]:
        x = join(x,part)
    write("ornek", index, x, "Kızın onaylanan hece ve tenvin kayıtlarından birleştirildi")

(SOUND / "adaylar.js").write_text("// Generated by tools/ses_adaylari.py\nwindow.sesAdaylari = [\n" +
    ",\n".join("  "+json.dumps(item, ensure_ascii=False) for item in items) + "\n];\n", encoding="utf-8")
