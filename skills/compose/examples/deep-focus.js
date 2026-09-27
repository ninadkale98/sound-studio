// "Deep Focus": one hour of generative ambient for concentration.
// Soft piano fragments over warm pads, with strings, choir and a low drone drifting in and out over minutes.
// Never loops: chords come from a weighted walk through each key, and every layer follows its own slow envelope.
// Output: deep-focus.mp3 (with a faint brown-noise bed) and deep-focus-music-only.mp3.
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const { Song, SF2 } = require('./lib');
const { lufsOf } = require('./studio');

const MINUTES = 60, BPM = 60;                 // at 60 BPM one beat = one second
const TOTAL = MINUTES * 60;
const s = new Song({ bpm: BPM, seed: 2026 });
const { BEAT } = s;
const r = () => s.rnd();
const pick = (arr) => arr[Math.floor(r() * arr.length)];
const T = (sec) => Math.round(sec * BEAT);   // seconds -> ticks (60 BPM)

const PIANO = 0, PAD = 1, STR = 2, CHOIR = 3, DRONE = 4;
s.inst(PIANO, 0, { vol: 92, pan: 60, rev: 90 });
s.inst(PAD, 89, { vol: 82, pan: 64, rev: 100, expr: 0 });   // warm pad
s.inst(STR, 49, { vol: 76, pan: 70, rev: 110, expr: 0 });   // slow strings
s.inst(CHOIR, 52, { vol: 60, pan: 56, rev: 120, expr: 0 }); // choir aahs
s.inst(DRONE, 89, { vol: 74, pan: 64, rev: 80, expr: 0 });

// ---- key journey (all closely related, so the drift is gentle)
const KEYS = [['D', 2], ['G', 7], ['C', 0], ['G', 7], ['D', 2], ['A', 9], ['D', 2]];
const chapterLen = TOTAL / KEYS.length;
// diatonic chords as scale-degree intervals from the key root, with colour tones
const CH = {
  I: [0, 4, 7, 11, 14], ii: [2, 5, 9, 12, 16], iii: [4, 7, 11, 14], IV: [5, 9, 12, 16, 19],
  V: [7, 12, 14, 17], vi: [9, 12, 16, 19, 23],
};
const MOVES = {
  I: ['IV', 'IV', 'vi', 'vi', 'ii', 'iii'], ii: ['V', 'IV', 'vi', 'I'], iii: ['vi', 'IV', 'IV'],
  IV: ['I', 'I', 'ii', 'vi', 'V'], V: ['I', 'vi', 'IV'], vi: ['IV', 'IV', 'ii', 'I', 'iii'],
};
const SCALE = [0, 2, 4, 7, 9, 11, 14]; // major pentatonic + 7th: soft, no tension

// ---- slow layer envelopes (0..1), each with its own period in minutes
const env = (sec, periodMin, phase) => 0.5 + 0.5 * Math.sin(2 * Math.PI * sec / (periodMin * 60) + phase);
const pianoDensity = (sec) => 0.25 + 0.65 * env(sec, 9, 0.3);
const stringLevel = (sec) => env(sec, 13, 2.1);
const choirLevel = (sec) => Math.max(0, env(sec, 17, 4.0) - 0.45) / 0.55;
const fadeInOut = (sec) => Math.min(1, sec / 25, (TOTAL - sec) / 40);

// ---- generate
let sec = 0, deg = 'I';
while (sec < TOTAL - 20) {
  const [, keyRoot] = KEYS[Math.min(KEYS.length - 1, Math.floor(sec / chapterLen))];
  const len = pick([8, 12, 12, 16]);
  const dur = Math.min(len, TOTAL - sec);
  const ivs = CH[deg];
  const t0 = T(sec);
  const chordPcs = ivs.map((i) => (keyRoot + i) % 12);
  const at = (pc, lo) => { let p = lo - ((lo % 12) - pc + 12) % 12; if (p < lo) p += 12; return p; };

  // pad: close voicing around F#3..D5
  const padNotes = [at(chordPcs[0], 50), at(chordPcs[1], 55), at(chordPcs[2], 60), at(chordPcs[3] ?? chordPcs[0], 64)];
  padNotes.forEach((p) => s.note(PAD, p, t0, T(dur) + 10, 64));
  // drone: chord root, low
  s.note(DRONE, at(chordPcs[0], 38), t0, T(dur) + 10, 60);
  // strings: upper voicing, level follows its envelope
  if (stringLevel(sec) > 0.2) [at(chordPcs[1], 62), at(chordPcs[2], 67), at(chordPcs[0], 71)].forEach((p) => s.note(STR, p, t0, T(dur), 60));
  if (choirLevel(sec) > 0.05) [at(chordPcs[0], 60), at(chordPcs[2], 64)].forEach((p) => s.note(CHOIR, p, t0, T(dur), 54));

  // piano: sustain pedal per chord, then a gesture chosen by density
  s.cc(PIANO, t0 + 20, 64, 127); s.cc(PIANO, T(sec + dur) - 30, 64, 0);
  const dens = pianoDensity(sec);
  const roll = r();
  const baseVel = 34 + Math.round(12 * dens);
  if (roll < 0.15 * (1 - dens)) {
    // rest: let the pads breathe
  } else if (roll < 0.55) {
    // slow broken chord, one note every 1–1.5 s
    const step = pick([1, 1.5, 1.5, 2]);
    const tones = [at(chordPcs[0], 50), at(chordPcs[2], 57), at(chordPcs[1], 62), at(chordPcs[3] ?? chordPcs[2], 66), at(chordPcs[2], 69)];
    const count = Math.min(tones.length, Math.floor(dur / step) - 1);
    for (let k = 0; k < count; k++) s.note(PIANO, tones[k], T(sec + k * step) + s.hum(20), T(4), baseVel + s.hum(5) - k);
  } else {
    // melodic fragment: a few scale notes, unhurried, mostly stepwise
    const n = 2 + Math.floor(r() * (2 + 4 * dens));
    let idx = Math.floor(r() * SCALE.length);
    let t = pick([0.5, 1, 2]);
    s.note(PIANO, at(chordPcs[0], 45), T(sec) + s.hum(10), T(6), baseVel - 6); // soft low anchor
    for (let k = 0; k < n && t < dur - 1.5; k++) {
      idx = Math.max(0, Math.min(SCALE.length - 1, idx + pick([-2, -1, -1, 1, 1, 2, 0])));
      const pc = (keyRoot + SCALE[idx]) % 12;
      s.note(PIANO, at(pc, 64 + (r() < 0.25 ? 7 : 0)), T(sec + t) + s.hum(25), T(3), baseVel + 4 + s.hum(6));
      t += pick([0.75, 1, 1.5, 1.5, 2, 3]);
    }
  }

  // expression: breathing pad, enveloped strings/choir, global fade in/out
  const f = fadeInOut(sec), fEnd = fadeInOut(sec + dur);
  s.ramp(PAD, 11, t0, T(sec + dur) - 5, (74 + 20 * env(sec, 1.3, 0)) * f, (74 + 20 * env(sec + dur, 1.3, 0)) * fEnd, 6);
  s.ramp(DRONE, 11, t0, T(sec + dur) - 5, 80 * f, 80 * fEnd, 4);
  s.ramp(STR, 11, t0, T(sec + dur) - 5, 95 * stringLevel(sec) * f, 95 * stringLevel(sec + dur) * fEnd, 6);
  s.ramp(CHOIR, 11, t0, T(sec + dur) - 5, 70 * choirLevel(sec) * f, 70 * choirLevel(sec + dur) * fEnd, 6);
  s.cc(PIANO, t0, 11, 127 * Math.max(0.3, f));

  sec += dur;
  // at a chapter boundary, land on the new key's I (common-tone pivot keeps it smooth)
  const nextChapter = Math.floor(sec / chapterLen) !== Math.floor((sec - dur) / chapterLen);
  deg = nextChapter ? pick(['I', 'IV', 'vi']) : pick(MOVES[deg]);
}
// final tonic chord ringing out
const endT = T(sec);
[50, 57, 62, 66, 69].forEach((p, k) => s.note(PIANO, p, endT + k * 120, T(10), 40 - k * 2));
[50, 57, 62, 66].forEach((p) => s.note(PAD, p, endT, T(14), 60));
s.ramp(PAD, 11, endT, T(TOTAL + 14), 60, 0, 20);

// ---- render
const dir = path.join(__dirname, 'stems');
fs.mkdirSync(dir, { recursive: true });
const mid = path.join(__dirname, 'deep-focus.mid');
const music = path.join(dir, 'deep-focus.music.wav');
const noise = path.join(dir, 'deep-focus.noise.wav');
s.write(mid);
console.log('notes:', s.notes.length, 'length:', (s.lengthSec() / 60).toFixed(1), 'min');
const remixOnly = process.argv.includes('--remix') && fs.existsSync(music);
if (!remixOnly) execFileSync('fluidsynth', ['-ni', '-q', '-F', music, '-r', '44100', '-g', '0.45', '-o', 'synth.reverb.room-size=0.9', '-o', 'synth.reverb.damp=0.5', '-o', 'synth.reverb.width=1.0', '-o', 'synth.reverb.level=0.8', '-o', 'synth.chorus.active=0', SF2, mid]);
const LEN = TOTAL + 16;
// brown noise bed: two independent channels, darkened, with very slow swells like distant rain
execFileSync('sox', ['-n', '-r', '44100', '-c', '2', '-b', '24', noise, 'synth', String(LEN), 'brownnoise', 'gain', '-8', 'lowpass', '900', 'highpass', '60', 'tremolo', '0.1', '18', 'fade', 't', '20', String(LEN), '30']);

const master = (inputs, name) => {
  const mix = path.join(dir, `${name}.mix.wav`);
  const parts = inputs.flatMap(([file, target]) => ['-v', (0.25 * Math.pow(10, (target - lufsOf(file)) / 20)).toFixed(5), file]);
  execFileSync('sox', inputs.length > 1 ? ['-G', '-m', ...parts, '-b', '24', mix, 'trim', '0', String(LEN)] : ['-G', ...parts, '-b', '24', mix, 'trim', '0', String(LEN)]);
  const pre = `highpass=f=30,afade=t=out:st=${LEN - 8}:d=8`;
  const js = JSON.parse(spawnSync('ffmpeg', ['-hide_banner', '-i', mix, '-af', `${pre},loudnorm=I=-20:TP=-2:LRA=7:print_format=json`, '-f', 'null', '-']).stderr.toString().match(/\{[\s\S]*\}/)[0]);
  const ln = `loudnorm=I=-20:TP=-2:LRA=7:measured_I=${js.input_i}:measured_TP=${js.input_tp}:measured_LRA=${js.input_lra}:measured_thresh=${js.input_thresh}:offset=${js.target_offset}:linear=true`;
  const out = path.join(__dirname, `${name}.mp3`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', mix, '-af', `${pre},${ln},alimiter=limit=0.8:level=false`, '-c:a', 'libmp3lame', '-b:a', '192k', '-metadata', `title=${name === 'deep-focus' ? 'Deep Focus (with rain bed)' : 'Deep Focus (music only)'}`, out]);
  fs.unlinkSync(mix);
  console.log(`${name}.mp3: ${lufsOf(out).toFixed(1)} LUFS`);
};
master([[music, -20], [noise, -32]], 'deep-focus');
if (!remixOnly) master([[music, -20]], 'deep-focus-music-only');
