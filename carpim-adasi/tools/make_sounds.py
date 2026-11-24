"""Synthesize the game's sound cues into carpim-adasi/dist/assets/audio.

Run from the repository root:  python3 carpim-adasi/tools/make_sounds.py
Only numpy is needed. Every cue is generated, so tweaking a sound means
editing its recipe below and running the script again.
"""
import pathlib
import wave

import numpy as np

RATE = 32000
OUT = pathlib.Path(__file__).resolve().parent.parent / 'dist' / 'assets' / 'audio'
rng = np.random.default_rng(7)


def note(name):
    names = {'C': -9, 'D': -7, 'E': -5, 'F': -4, 'G': -2, 'A': 0, 'B': 2}
    step = names[name[0]] + (1 if '#' in name else 0)
    octave = int(name[-1])
    return 440 * 2 ** ((step + (octave - 4) * 12) / 12)


def silence(seconds):
    return np.zeros(int(RATE * seconds))


def timeline(seconds):
    return np.arange(int(RATE * seconds)) / RATE


def envelope(t, attack, decay):
    rise = np.clip(t / attack, 0, 1) if attack else 1
    return rise * np.exp(-t / decay)


def marimba(freq, seconds=0.9, bright=1.0):
    """Struck bar: a warm fundamental with the bar's inharmonic overtones."""
    t = timeline(seconds)
    tone = np.sin(2 * np.pi * freq * t) * envelope(t, 0.002, 0.32)
    tone += 0.35 * bright * np.sin(2 * np.pi * freq * 3.93 * t) * envelope(t, 0.001, 0.05)
    tone += 0.12 * bright * np.sin(2 * np.pi * freq * 9.2 * t) * envelope(t, 0.001, 0.015)
    return tone


def bell(freq, seconds=1.2, decay=0.45):
    t = timeline(seconds)
    partials = [(1, 1, 1), (2.0, 0.45, 0.7), (2.76, 0.3, 0.5), (5.4, 0.16, 0.25), (8.93, 0.07, 0.12)]
    tone = sum(level * np.sin(2 * np.pi * freq * ratio * t) * envelope(t, 0.001, decay * span)
               for ratio, level, span in partials)
    return tone


def pluck(freq, seconds=0.8, softness=0.5):
    """Karplus-Strong string: soft and round, good for gentle feedback."""
    n = int(RATE * seconds)
    period = int(RATE / freq)
    buffer = rng.uniform(-1, 1, period)
    out = np.empty(n)
    for i in range(n):
        out[i] = buffer[i % period]
        buffer[i % period] = (softness * buffer[i % period] +
                              (1 - softness) * buffer[(i + 1) % period]) * 0.996
    return out


def lowpass(signal, cutoff):
    """One-pole lowpass; cutoff may be a number or an array (a sweep)."""
    cutoff = np.broadcast_to(np.asarray(cutoff, float), signal.shape)
    alpha = 1 - np.exp(-2 * np.pi * cutoff / RATE)
    out = np.empty_like(signal)
    level = 0.0
    for i, (sample, a) in enumerate(zip(signal, alpha)):
        level += a * (sample - level)
        out[i] = level
    return out


def glide(start, end, seconds, shape='sine', curve=1.0):
    t = timeline(seconds)
    freq = start + (end - start) * (t / seconds) ** curve
    phase = 2 * np.pi * np.cumsum(freq) / RATE
    if shape == 'triangle':
        return 2 / np.pi * np.arcsin(np.sin(phase))
    return np.sin(phase)


def reverb(signal, mix=0.22, size=1.0, tail=0.8):
    """Small Schroeder room so the cues sound like they belong to one place."""
    padded = np.concatenate([signal, silence(tail)])
    wet = np.zeros_like(padded)
    for delay_ms, gain in [(29.7, .78), (37.1, .76), (41.1, .74), (43.7, .72)]:
        delay = int(RATE * delay_ms * size / 1000)
        comb = padded.copy()
        for i in range(delay, len(comb)):
            comb[i] += gain * comb[i - delay]
        wet += comb
    wet /= 4
    for delay_ms in (5.0, 1.7):
        delay = int(RATE * delay_ms / 1000)
        out = np.zeros_like(wet)
        for i in range(len(wet)):
            previous = out[i - delay] if i >= delay else 0
            earlier = wet[i - delay] if i >= delay else 0
            out[i] = -0.7 * wet[i] + earlier + 0.7 * previous
        wet = out
    return padded * (1 - mix) + lowpass(wet, 5200) * mix


def mix(length, *parts):
    """Place (offset_seconds, signal, gain) parts on one track."""
    track = silence(length)
    for offset, part, gain in parts:
        start = int(RATE * offset)
        end = min(len(track), start + len(part))
        piece = part[:end - start].copy()
        ramp = min(len(piece), int(RATE * 0.25))
        piece[-ramp:] *= np.linspace(1, 0, ramp) ** 2  # no clicks where a part ends
        track[start:end] += gain * piece
    return track


def finish(signal, peak, fade=0.03):
    signal = signal - np.mean(signal)
    signal = signal / np.max(np.abs(signal))
    # Drop the tail once it is quieter than -60 dB.
    trimmed = np.trim_zeros(np.where(np.abs(signal) < 1e-3, 0, signal), 'b')
    signal = signal[:len(trimmed) + 1]
    ramp = min(len(signal), int(RATE * fade))
    signal[-ramp:] *= np.linspace(1, 0, ramp)
    signal[:32] *= np.linspace(0, 1, 32)
    return signal / np.max(np.abs(signal)) * peak


def sparkle(count, start, spread, low=1800, high=4200, gain=0.12):
    parts = []
    for i in range(count):
        freq = low * (high / low) ** (i / max(1, count - 1))
        offset = start + i * spread + rng.uniform(0, spread * 0.4)
        parts.append((offset, bell(freq, 0.5, 0.25), gain * rng.uniform(0.6, 1)))
    return parts


def save(name, signal):
    data = (np.clip(signal, -1, 1) * 32767).astype('<i2')
    with wave.open(str(OUT / (name + '.wav')), 'wb') as file:
        file.setnchannels(1)
        file.setsampwidth(2)
        file.setframerate(RATE)
        file.writeframes(data.tobytes())
    print(f'{name:10s} {len(data) / RATE:5.2f} s')


def wood(freq, seconds=0.12, noise=0.4, decay=0.025):
    t = timeline(seconds)
    body = np.sin(2 * np.pi * freq * t) * envelope(t, 0.0005, decay)
    body += 0.5 * np.sin(2 * np.pi * freq * 2.71 * t) * envelope(t, 0.0005, decay * 0.5)
    click = lowpass(rng.uniform(-1, 1, len(t)), 3500) * envelope(t, 0, 0.004)
    return body + noise * click


cues = {}

def soft_mallet(freq, decay=0.06, bend=0.0, seconds=0.45):
    """A felt mallet on a soft bar: rounded attack, no click, a hint of overtone.

    `bend` slides the pitch by that fraction over the first 40 ms, which reads
    as a friendly "bloop" (positive bends up, negative down).
    """
    t = timeline(seconds)
    slide = 1 + bend * (1 - np.exp(-t / 0.012)) - bend
    phase = 2 * np.pi * np.cumsum(freq * slide) / RATE
    attack = np.where(t < 0.005, np.sin(np.pi / 2 * t / 0.005) ** 2, 1)
    tone = np.sin(phase) * np.exp(-t / decay)
    tone += 0.12 * np.sin(2 * phase) * np.exp(-t / (decay * 0.4))
    return lowpass(lowpass(tone * attack, 2600), 3200)


# The earlier tap drew this much noise; drawing it keeps the later cues' randomness unchanged.
rng.uniform(-1, 1, int(RATE * 0.07))

# Menus and buttons: a soft, low "bloop", like a drop in a calm bay.
cues['tap'] = finish(reverb(soft_mallet(note('E5'), 0.05, -0.04), 0.12, 0.7, 0.2), 0.2)

# Number keys: the same felt mallet a little higher, bending gently up.
cues['key'] = finish(reverb(soft_mallet(note('G5'), 0.055, 0.03), 0.12, 0.7, 0.2), 0.24)

# Erase: lower and bending down, so it feels like taking back.
cues['erase'] = finish(reverb(soft_mallet(note('C5'), 0.06, -0.06), 0.12, 0.7, 0.2), 0.22)

# Countdown: woodblock ticks climbing in pitch as time runs out.
for left, freq in [(3, 980), (2, 1170), (1, 1400)]:
    tick = wood(freq, 0.16, 0.55, 0.03)
    if left == 1:
        tick += 0.35 * bell(freq * 2, 0.16, 0.12)
    cues['tick-' + str(left)] = finish(reverb(tick, 0.18, 0.7, 0.25), 0.5 + 0.08 * (3 - left))

# Correct: two bright marimba notes, a fifth apart, with a sparkle on top.
cues['correct'] = finish(reverb(mix(1.2,
    (0.00, marimba(note('C6'), 0.8), 0.9),
    (0.09, marimba(note('G6'), 0.9), 1.0),
    (0.09, marimba(note('C5'), 0.6, 0.4), 0.35),
    *sparkle(4, 0.16, 0.045, 2600, 4800, 0.09),
), 0.24, 1.0, 0.7), 0.8)

# Island complete: rising arpeggio that lands on a ringing major chord.
arpeggio = ['C5', 'E5', 'G5', 'C6', 'E6']
cues['island'] = finish(reverb(mix(2.6,
    *[(i * 0.085, marimba(note(n), 0.9), 0.85) for i, n in enumerate(arpeggio)],
    (0.48, bell(note('C6'), 2.1, 0.7), 0.45),
    (0.48, bell(note('E6'), 2.1, 0.7), 0.35),
    (0.48, bell(note('G6'), 2.1, 0.7), 0.35),
    (0.48, marimba(note('C4'), 1.2, 0.3), 0.6),
    (0.48, marimba(note('G4'), 1.2, 0.3), 0.4),
    *sparkle(9, 0.55, 0.06, 2000, 5200, 0.1),
), 0.3, 1.2, 1.0), 0.85)

# Every island in every round: a longer fanfare.
fanfare = [('G4', 0.0), ('C5', 0.12), ('E5', 0.24), ('G5', 0.36), ('E5', 0.52), ('G5', 0.62)]
victory_parts = [(at, marimba(note(n), 0.8), 0.85) for n, at in fanfare]
for n in ['C5', 'E5', 'G5', 'C6', 'E6']:
    victory_parts.append((0.82, bell(note(n), 2.9, 0.9), 0.3))
victory_parts += [(0.82, marimba(note('C4'), 1.6, 0.3), 0.7),
                  (0.82, marimba(note('C6'), 1.2), 0.8)]
victory_parts += sparkle(14, 0.9, 0.07, 1800, 6000, 0.1)
cues['victory'] = finish(reverb(mix(3.6, *victory_parts), 0.32, 1.3, 1.3), 0.85)

# Wrong answer or timeout: a soft, friendly "oh-oh" rather than a buzzer.
t = timeline(0.5)
wobble = 1 + 0.012 * np.sin(2 * np.pi * 6 * t)
oh = lambda f: np.sin(2 * np.pi * np.cumsum(f * wobble) / RATE) * envelope(t, 0.012, 0.16)
cues['retry'] = finish(reverb(mix(1.3,
    (0.00, oh(note('E5')), 0.55),
    (0.00, lowpass(lowpass(pluck(note('E4'), 0.6, 0.6), 1400), 1600), 0.5),
    (0.22, oh(note('C5')), 0.6),
    (0.22, lowpass(lowpass(pluck(note('C4'), 0.7, 0.6), 1300), 1500), 0.55),
    (0.44, lowpass(lowpass(pluck(note('A3'), 0.8, 0.5), 1100), 1300), 0.6),
), 0.22, 1.0, 0.7), 0.62)

# A quick gentle boop for a wrong tile in Elif Ba.
cues['oops'] = finish(reverb(mix(0.5,
    (0.0, glide(520, 380, 0.22, 'triangle') * envelope(timeline(0.22), 0.004, 0.08), 0.8),
), 0.15, 0.8, 0.3), 0.42)

# Setting sail on an island: a sea whoosh rising into two bell notes.
n = int(RATE * 0.55)
sweep = np.linspace(400, 3800, n) ** 1.0
wave_noise = lowpass(rng.uniform(-1, 1, n), sweep) * np.sin(np.linspace(0, np.pi, n)) ** 2
cues['start'] = finish(reverb(mix(1.3,
    (0.00, wave_noise, 1.2),
    (0.40, bell(note('G5'), 0.9, 0.5), 0.35),
    (0.52, bell(note('D6'), 0.9, 0.5), 0.35),
    (0.40, marimba(note('G4'), 0.6, 0.3), 0.4),
), 0.25, 1.0, 0.6), 0.6)

OUT.mkdir(parents=True, exist_ok=True)
for name, signal in cues.items():
    save(name, signal)
