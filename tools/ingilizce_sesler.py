#!/usr/bin/env python3
"""Records İngilizce Koyu's English lines with a natural voice → app/assets/audio/ingilizce/.

Every line that tools/ingilizce_metinler.js lists (the words and sentences of the questions, the games' lines) is
spoken by Kokoro-82M (Apache-2.0, https://huggingface.co/hexgrad/Kokoro-82M) in the voice af_heart, twice: at the
normal speed (<id>.mp3) and slowly for the 🐢 button (<id>-y.mp3). The answers (the "b" list: what is said after a right
answer, and the answer half of a dialogue) are also spoken in a second voice, am_michael, a little slower (<id>-b.mp3).
<id> is the first 10 hex digits of the line's SHA-1, so a line keeps its file. app/assets/audio/ingilizce/kayitlar.js maps
each line to its id (window.ingilizceKayitlar, and window.ingilizceKayitlarB for the second voice); the game falls back
to the device's voice for a line without a recording.

Needs: pip install kokoro-onnx soundfile, ffmpeg, and from huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX the
files onnx/model.onnx, voices/af_heart.bin and voices/am_michael.bin in one folder:
    python3 tools/ingilizce_sesler.py <model folder>            # records only the lines that have no file yet
    python3 tools/ingilizce_sesler.py <model folder> --hepsi    # records every line again
"""
import hashlib, json, os, subprocess, sys, tempfile

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'app', 'assets', 'audio', 'ingilizce')
VOICE, LANG, NORMAL, SLOW = 'af_heart', 'en-us', 0.92, 0.68
VOICE_B, ANSWER = 'am_michael', 0.86

def ident(text):
    return hashlib.sha1(text.encode('utf-8')).hexdigest()[:10]

def spoken(text):
    # what the voice reads: plain apostrophes, and a full stop after a bare word so it is said whole
    t = text.replace('’', "'").replace('“', '').replace('”', '')
    return t if t[-1:] in '.!?' else t + '.'

def main():
    model, everything = sys.argv[1], '--hepsi' in sys.argv
    voices = os.path.join(tempfile.gettempdir(), 'kokoro-voices.npz')
    np.savez(voices, **{v: np.fromfile(os.path.join(model, v + '.bin'), dtype=np.float32).reshape(-1, 1, 256) for v in (VOICE, VOICE_B)})
    kokoro = Kokoro(os.path.join(model, 'model.onnx'), voices)
    lists = json.loads(subprocess.check_output(['node', os.path.join(ROOT, 'tools', 'ingilizce_metinler.js')]))
    texts, answers = lists['a'], set(lists['b'])
    main = set(texts)
    os.makedirs(OUT, exist_ok=True)
    index, index_b, made = {}, {}, 0
    for n, text in enumerate(sorted(set(texts) | answers)):
        key = ident(text)
        takes = []
        if text in main:
            index[text] = key
            takes += [('', VOICE, NORMAL), ('-y', VOICE, SLOW)]
        if text in answers:
            index_b[text] = key
            takes.append(('-b', VOICE_B, ANSWER))
        for suffix, voice, speed in takes:
            target = os.path.join(OUT, key + suffix + '.mp3')
            if os.path.exists(target) and not everything:
                continue
            audio, rate = kokoro.create(spoken(text), voice=voice, speed=speed, lang=LANG)
            wav = target[:-4] + '.wav'
            sf.write(wav, audio, rate)
            # a short silence trimmed from both ends, mono 48 kbps
            subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', wav, '-af',
                            'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,apad=pad_dur=0.08',
                            '-ac', '1', '-b:a', '48k', target], check=True)
            os.remove(wav)
            made += 1
        if n % 50 == 0:
            print(n, '/', len(texts) + len(answers), text, flush=True)
    # files of lines that are gone
    keep = {k + s + '.mp3' for k in index.values() for s in ('', '-y')} | {k + '-b.mp3' for k in index_b.values()}
    for name in os.listdir(OUT):
        if name.endswith('.mp3') and name not in keep:
            os.remove(os.path.join(OUT, name))
    version = 1
    old = os.path.join(OUT, 'kayitlar.js')
    if os.path.exists(old):
        for line in open(old, encoding='utf-8'):
            if 'ingilizceKayitlarSurum' in line:
                version = int(''.join(ch for ch in line if ch.isdigit()) or 1) + (1 if made else 0)
    with open(old, 'w', encoding='utf-8') as f:
        f.write('// İngilizce Koyu: the recorded English lines (tools/ingilizce_sesler.py). Line → file id in this folder.\n')
        f.write('window.ingilizceKayitlarSurum = %d;\n' % version)
        f.write('window.ingilizceKayitlar = ' + json.dumps(index, ensure_ascii=False, indent=0, sort_keys=True) + ';\n')
        f.write('// the answer voice (am_michael): line → file id, played from <id>-b.mp3\n')
        f.write('window.ingilizceKayitlarB = ' + json.dumps(index_b, ensure_ascii=False, indent=0, sort_keys=True) + ';\n')
    print('lines', len(index), 'answers', len(index_b), 'recorded', made, 'version', version)

main()
