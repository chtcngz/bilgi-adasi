#!/usr/bin/env python3
"""Şedde clips of Elif Ba: app/assets/audio/elif-ba/sedde/NN-H.mp3 and seddesiz/NN-H.mp3.

Diyanet's Elifba has no recording of each letter's şedde syllable, so every one is made of two Diyanet clips
the game already has, in the same man's voice: the letter's cezm syllable (cezm/NN.mp3, بِسْ "bis") and the
letter with its hareke (hece/NN-H.mp3, سَ "se"). Played one after the other they sound like two words: "bis"
holds its last sound and lets it fade, "se" starts it again, and a stop letter's cezm syllable ends in an echo
vowel (qalqala: "kad-ə"). So the two are joined inside the doubled letter, the way a şedde is read: one long
letter, not broken (Diyanet: "sesi bölmeden"):

- a stop (hemze, b, t, c, d, ḍ, ṭ, q, k): the cezm syllable up to the end of its vowel, its echo left out, one
  long closure, then the second syllable from just before its release;
- any other letter: the cezm syllable is cut inside its last sound, the second syllable inside its first, and the
  two are crossfaded there at the same loudness, so the sound goes on unbroken. m and n are held longer (gunne).

Şeddesiz (بِسَ "bise", what the şedde is told apart from) is made the same way with the letter said once, short,
so the two differ only in the length of the letter. The times below were measured on the clips' spectrograms.

Needs numpy and ffmpeg. Run from the repository root:  python3 tools/sedde_sesleri.py
It rewrites the 168 clips and their entries in kaynak.json.
"""
import hashlib
import json
import pathlib
import subprocess

import numpy as np

SR = 44100
ROOT = pathlib.Path(__file__).resolve().parent.parent
AUDIO = ROOT / 'app/assets/audio/elif-ba'

STOP, FRIC, SON, NASAL = 'stop', 'fric', 'son', 'nasal'
KIND = {0: STOP, 1: STOP, 2: STOP, 4: STOP, 7: STOP, 14: STOP, 15: STOP, 20: STOP, 21: STOP,
        3: FRIC, 5: FRIC, 6: FRIC, 8: FRIC, 10: FRIC, 11: FRIC, 12: FRIC, 13: FRIC, 16: FRIC, 18: FRIC, 19: FRIC, 26: FRIC,
        9: SON, 17: SON, 22: SON, 25: SON, 27: SON, 23: NASAL, 24: NASAL}

# The cezm syllable (cezm/NN.mp3): v = where its vowel ends; for a stop r = where the closure is released (the
# echo begins; None: no release heard), for any other letter d = where its last sound starts to fade.
CEZM = {
    0: dict(v=0.544, r=None), 1: dict(v=0.440, r=0.510), 2: dict(v=0.455, r=0.600), 4: dict(v=0.520, r=0.575),
    7: dict(v=0.365, r=0.390), 14: dict(v=0.605, r=None), 15: dict(v=0.517, r=0.655), 20: dict(v=0.433, r=0.570),
    21: dict(v=0.500, r=0.650),
    3: dict(v=0.469, d=1.000), 5: dict(v=0.449, d=0.783), 6: dict(v=0.509, d=0.850), 8: dict(v=0.758, d=1.050),
    10: dict(v=0.793, d=1.030), 11: dict(v=0.404, d=0.750), 12: dict(v=0.584, d=0.860), 13: dict(v=0.374, d=0.690),
    16: dict(v=0.484, d=0.890), 18: dict(v=0.520, d=0.800), 19: dict(v=0.519, d=0.760), 26: dict(v=0.649, d=0.900),
    9: dict(v=0.620, d=0.660), 17: dict(v=0.480, d=0.750), 22: dict(v=0.620, d=0.850), 23: dict(v=0.470, d=0.830),
    24: dict(v=0.440, d=0.690), 25: dict(v=0.480, d=0.860), 27: dict(v=0.600, d=0.900),
}
# The letter with its hareke (hece/NN-H.mp3): s = where its first sound is steady (a stop: where the clip's
# sound starts), v = where the vowel starts, and for a stop b = the release (burst).
HECE = {
    '00-0': dict(s=0.000, v=0.220, b=0.215), '00-1': dict(s=0.080, v=0.090, b=0.085), '00-2': dict(s=0.100, v=0.110, b=0.105),
    '01-0': dict(s=0.035, v=0.215, b=0.200), '01-1': dict(s=0.000, v=0.145, b=0.140), '01-2': dict(s=0.030, v=0.165, b=0.155),
    '02-0': dict(s=0.015, v=0.165, b=0.105), '02-1': dict(s=0.075, v=0.234, b=0.140), '02-2': dict(s=0.000, v=0.090, b=0.010),
    '04-0': dict(s=0.080, v=0.254, b=0.215), '04-1': dict(s=0.000, v=0.090, b=0.065), '04-2': dict(s=0.045, v=0.190, b=0.145),
    '07-0': dict(s=0.000, v=0.469, b=0.449), '07-1': dict(s=0.095, v=0.324, b=0.289), '07-2': dict(s=0.040, v=0.244, b=0.234),
    '14-0': dict(s=0.050, v=0.185, b=0.120), '14-1': dict(s=0.065, v=0.180, b=0.100), '14-2': dict(s=0.125, v=0.165, b=0.135),
    '15-0': dict(s=0.110, v=0.170, b=0.110), '15-1': dict(s=0.055, v=0.190, b=0.180), '15-2': dict(s=0.090, v=0.210, b=0.200),
    '20-0': dict(s=0.045, v=0.100, b=0.045), '20-1': dict(s=0.065, v=0.120, b=0.065), '20-2': dict(s=0.040, v=0.110, b=0.040),
    '21-0': dict(s=0.035, v=0.135, b=0.035), '21-1': dict(s=0.045, v=0.190, b=0.070), '21-2': dict(s=0.005, v=0.145, b=0.005),
    '03-0': dict(s=0.150, v=0.290), '03-1': dict(s=0.050, v=0.220), '03-2': dict(s=0.045, v=0.270),
    '05-0': dict(s=0.240, v=0.390), '05-1': dict(s=0.090, v=0.140), '05-2': dict(s=0.150, v=0.200),
    '06-0': dict(s=0.105, v=0.260), '06-1': dict(s=0.105, v=0.280), '06-2': dict(s=0.105, v=0.300),
    '08-0': dict(s=0.080, v=0.240), '08-1': dict(s=0.160, v=0.340), '08-2': dict(s=0.070, v=0.230),
    '10-0': dict(s=0.205, v=0.370), '10-1': dict(s=0.125, v=0.220), '10-2': dict(s=0.080, v=0.250),
    '11-0': dict(s=0.070, v=0.250), '11-1': dict(s=0.100, v=0.290), '11-2': dict(s=0.110, v=0.320),
    '12-0': dict(s=0.135, v=0.310), '12-1': dict(s=0.140, v=0.310), '12-2': dict(s=0.135, v=0.270),
    '13-0': dict(s=0.080, v=0.300), '13-1': dict(s=0.140, v=0.440), '13-2': dict(s=0.095, v=0.430),
    '16-0': dict(s=0.115, v=0.160), '16-1': dict(s=0.125, v=0.540), '16-2': dict(s=0.100, v=0.440),
    '18-0': dict(s=0.230, v=0.320), '18-1': dict(s=0.060, v=0.360), '18-2': dict(s=0.080, v=0.210),
    '19-0': dict(s=0.120, v=0.310), '19-1': dict(s=0.080, v=0.230), '19-2': dict(s=0.120, v=0.250),
    '26-0': dict(s=0.080, v=0.200), '26-1': dict(s=0.105, v=0.170), '26-2': dict(s=0.040, v=0.150),
    '09-0': dict(s=0.020, v=0.160), '09-1': dict(s=0.150, v=0.340), '09-2': dict(s=0.115, v=0.240),
    '17-0': dict(s=0.155, v=0.300), '17-1': dict(s=0.130, v=0.260), '17-2': dict(s=0.110, v=0.300),
    '22-0': dict(s=0.075, v=0.165), '22-1': dict(s=0.060, v=0.230), '22-2': dict(s=0.095, v=0.160),
    '23-0': dict(s=0.070, v=0.150), '23-1': dict(s=0.195, v=0.280), '23-2': dict(s=0.085, v=0.120),
    '24-0': dict(s=0.090, v=0.255), '24-1': dict(s=0.095, v=0.310), '24-2': dict(s=0.100, v=0.190),
    '25-0': dict(s=0.110, v=0.200), '25-1': dict(s=0.155, v=0.250), '25-2': dict(s=0.050, v=0.100),
    '27-0': dict(s=0.055, v=0.110), '27-1': dict(s=0.025, v=0.180), '27-2': dict(s=0.025, v=0.120),
}
# How long the doubled letter is held (s): a stop's closure, any other letter from the end of the first vowel to
# the start of the second. Diyanet's own şedde words (sedde-ornek) hold it about 0.35-0.45 s, m and n longer.
LENGTH = {
    'sedde': {STOP: 0.28, FRIC: 0.34, SON: 0.30, NASAL: 0.45},
    'seddesiz': {STOP: 0.07, FRIC: 0.12, SON: 0.10, NASAL: 0.10},
}
HEMZE_CLOSURE = {'sedde': 0.22, 'seddesiz': 0.06}


def load(rel):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(AUDIO / rel), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def save(x, rel):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f64le', '-ar', str(SR), '-ac', '1', '-i', '-',
                    '-ac', '2', '-c:a', 'libmp3lame', '-b:a', '64k', str(AUDIO / rel)], input=x.astype(np.float64).tobytes(), check=True)


n = lambda t: int(round(t * SR))
rms = lambda x: float(np.sqrt(np.mean(x ** 2)) + 1e-9)


def ramp(length, up=True):
    r = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, max(length, 1)))
    return r if up else r[::-1]


def sound_edges(x, below_db=32):
    """Start and end of the clip's sound: 10 ms RMS within below_db of its loudest 10 ms."""
    w = n(0.01)
    frames = x[:len(x) // w * w].reshape(-1, w)
    level = 20 * np.log10(np.sqrt((frames ** 2).mean(1)) + 1e-9)
    loud = np.where(level > level.max() - below_db)[0]
    return loud[0] * w / SR, (loud[-1] + 1) * w / SR


def vowel_end(x, v):
    """Where the last vowel has died away: 24 dB under its level (the room noise after it is left out)."""
    w = n(0.01)
    level = 20 * np.log10(np.sqrt((x[:len(x) // w * w].reshape(-1, w) ** 2).mean(1)) + 1e-9)
    k = int(v * 100)
    ref = np.median(level[k:k + 10])
    quiet = np.where(level[k + 5:] < ref - 24)[0]
    return (k + 5 + quiet[0]) / 100 if len(quiet) else len(x) / SR


def vowel_level(x, start, length=0.12):
    return rms(x[n(start):n(start + length)])


def aligned(x, at, ref, reach=0.006, last=None):
    """Where near `at` x best continues `ref` (normalized correlation within ±reach s, not after `last`), so
    voiced sounds add up."""
    m = len(ref)
    top = len(x) - m if last is None else min(len(x) - m, last)
    at = min(max(at, 0), top)
    best, score = at, -np.inf
    for k in range(max(0, at - n(reach)), min(top, at + n(reach)) + 1):
        c = np.dot(x[k:k + m], ref) / (np.linalg.norm(x[k:k + m]) * np.linalg.norm(ref) + 1e-9)
        if c > score:
            best, score = k, c
    return best


def lengthen(seg, total):
    """A steady sound made `total` samples long: a stretch of it is said again (from two thirds of the way, back
    up to a third), joined with a short aligned crossfade, so its start and end are left as they were."""
    out = seg.copy()
    for _ in range(40):
        x = min(n(0.03), len(out) // 8)
        if len(out) >= total or x < n(0.005):
            break
        cut = 2 * len(out) // 3
        back = max(min(total - len(out) + x, len(out) // 3), 2 * x)
        k = aligned(out, cut - back, out[cut - x:cut], last=cut - 2 * x)
        out = np.concatenate([out[:cut - x], out[cut - x:cut] * np.sqrt(ramp(x, up=False)) + out[k:k + x] * np.sqrt(ramp(x)),
                              out[k + x:]])
    return out


def join_stop(c1, a1, c2, a2, closure):
    """The vowel, one closure of `closure` s, then the second syllable from its release."""
    keep = 0.02 if a1['r'] is None else min(0.02, a1['r'] - a1['v'] - 0.012)
    head = c1[:n(a1['v'] + keep)].copy()
    fade = n(0.015)
    head[-fade:] *= ramp(fade, up=False)
    before = closure - keep  # of the closure, what the second clip gives (its silence or voice before the release)
    start = a2['b'] - before
    tail = c2[max(0, n(start)):].copy()
    if start < 0:
        tail = np.concatenate([np.zeros(n(-start)), tail])
    tail[:n(0.01)] *= ramp(n(0.01))
    return head, tail, len(head)


def join_held(c1, a1, c2, a2, length, xfade):
    """The first clip's last sound crossfaded into the second's first sound, at the same loudness: unbroken."""
    v1, d1, s2, v2 = a1['v'], a1['d'], a2['s'], a2['v']
    have1 = max(0.0, d1 - v1 - 0.01)
    # the second clip gives up to half, never from before its letter is steady; the first gives the rest
    b = min((length + xfade) / 2, v2 - s2)
    a = length + xfade - b
    if a > have1:
        if have1 >= 0.1:  # the first clip's last sound is long: say part of it again
            keep = n(v1 + 0.02)
            longer = lengthen(c1[keep:n(d1)], n(d1 - v1 - 0.02 + a - have1 + 0.01))
            c1 = np.concatenate([c1[:keep], longer, c1[n(d1):]])
        else:  # it is short (r): the second clip's letter is said longer instead
            a = max(have1, xfade)
            b = length + xfade - a
            longer = lengthen(c2[n(s2):n(v2)], n(b + 0.01))
            c2 = np.concatenate([c2[:n(s2)], longer, c2[n(v2):]])
            v2 = s2 + len(longer) / SR
            b = min(b, v2 - s2)
    x = min(n(xfade), n(b))
    head = c1[:n(v1 + a)].copy()
    ref = head[-x:]
    best = aligned(c2, n(v2 - b), ref, last=n(v2) - x)
    best = max(best, n(s2))
    tail = c2[best:].copy()
    # loudness: the second clip starts at the first one's level and reaches its own at its vowel
    g = np.clip(rms(ref) / rms(tail[:x]), 0.25, 4.0)
    to_vowel = max(n(v2) - best, x + 1)
    env = np.ones(len(tail))
    env[:to_vowel] = np.geomspace(g, 1.0, to_vowel)
    tail *= env
    head[-x:] = head[-x:] * np.sqrt(ramp(x, up=False)) + tail[:x] * np.sqrt(ramp(x))
    return head, tail[x:], len(head)


def build(i, h, which):
    kind = KIND[i]
    c1 = load('cezm/%02d.mp3' % i)
    c2 = load('hece/%02d-%d.mp3' % (i, h))
    a1, a2 = CEZM[i], HECE['%02d-%d' % (i, h)]
    # the second syllable as loud as the first (their vowels)
    c2 = c2 * np.clip(vowel_level(c1, a1['v'] - 0.14) / vowel_level(c2, a2['v'] + 0.02), 0.6, 1.6)
    if kind == STOP:
        closure = HEMZE_CLOSURE[which] if i == 0 else LENGTH[which][STOP]
        head, tail, _ = join_stop(c1, a1, c2, a2, closure)
    else:
        xfade = 0.05 if kind == FRIC else 0.04
        if which == 'seddesiz':
            xfade = 0.03
        head, tail, _ = join_held(c1, a1, c2, a2, LENGTH[which][kind], xfade)
    s1_start, _ = sound_edges(c1)
    s2_end = vowel_end(c2, a2['v'])
    head = head[max(0, n(s1_start - 0.03)):]
    head[:n(0.01)] *= ramp(n(0.01))
    cut = len(tail) - max(0, len(c2) - n(s2_end + 0.08))
    tail = tail[:max(cut, n(0.1))]
    tail[-n(0.06):] *= ramp(n(0.06), up=False)
    out = np.concatenate([head, tail])
    peak = np.abs(out).max()
    if peak > 0.98:
        out *= 0.98 / peak
    return out


def main():
    sources = json.loads((AUDIO / 'kaynak.json').read_text())
    rec = sources['recordings']
    for i in range(28):
        for h in range(3):
            key = '%02d-%d' % (i, h)
            for which in ('sedde', 'seddesiz'):
                rel = '%s/%s.mp3' % (which, key)
                save(build(i, h, which), rel)
                entry = rec[rel]
                entry['derivedFrom'] = [rec['cezm/%02d.mp3' % i]['archiveFile'], rec['hece/%s.mp3' % key]['archiveFile']]
                entry['processing'] = (
                    'joined inside the doubled letter (tools/sedde_sesleri.py): the cezm syllable up to its vowel, '
                    + ('the letter said once, short' if which == 'seddesiz' else 'the letter held long, unbroken')
                    + ', then the letter with its hareke; a stop keeps one closure and leaves out the cezm syllable\'s echo')
                entry['sha256'] = hashlib.sha256((AUDIO / rel).read_bytes()).hexdigest()
            print(key, end=' ', flush=True)
    (AUDIO / 'kaynak.json').write_text(json.dumps(sources, ensure_ascii=False, indent=1) + '\n')
    print()


if __name__ == '__main__':
    main()
