// "Last Local": Indian indie-rock in D major. Dotted-eighth delay clean riff, clean melody guitar,
// ambient volume swells, doubled distorted chorus chords, and a singing lead hook with bends.
const { Song, n, chord } = require('./lib');
const { guitarLine, produce, FX } = require('./studio');
const BPM = 86;
const s = new Song({ bpm: BPM, seed: 314 });
const { BEAT } = s;
const RIFF = 0, MELO = 1, SWELL = 2, RHY_L = 3, RHY_R = 4, LEAD = 5, BASS = 6, PAD = 7, PIANO = 8;
s.inst(RIFF, 27, { vol: 110, rev: 0 });
s.inst(MELO, 27, { vol: 110, rev: 0 });
s.inst(SWELL, 27, { vol: 110, rev: 0, expr: 0 });
s.inst(RHY_L, 30, { vol: 100, pan: 8, rev: 0 });   // distortion guitar, hard left
s.inst(RHY_R, 30, { vol: 100, pan: 120, rev: 0 }); // double, hard right
s.inst(LEAD, 29, { vol: 110, rev: 0 });
s.inst(BASS, 34, { vol: 106, rev: 10 });           // picked bass
s.inst(PAD, 89, { vol: 70, pan: 64, rev: 90, expr: 0 }); // warm pad
s.inst(PIANO, 0, { vol: 76, pan: 72, rev: 60 });
s.drums({ vol: 104, rev: 45 });

const VERSE = ['D', 'A/C#', 'Bm', 'G', 'D', 'A/C#', 'Bm', 'G'];
const CHORUS = ['G', 'A', 'D', 'Bm', 'G', 'A', 'D', 'D'];
const sections = [['intro', ['D', 'A/C#', 'Bm', 'G']], ['verse', VERSE], ['chorus', CHORUS], ['bridge', ['Bm', 'G', 'D', 'A']], ['chorus2', CHORUS], ['outro', ['D', 'A/C#', 'Bm', 'G', 'D']]];
const bars = []; sections.forEach(([sec, cs]) => cs.forEach((c, i) => bars.push({ sec, i, c })));
const start = {}; bars.forEach((b, k) => { if (!(b.sec in start)) start[b.sec] = k; });
const LAST = bars.length - 1;

// the signature riff: add9 / 11th colours ring into the delay
const RIFFS = {
  D: ['D4', 'A4', 'E5', 'F#5', 'A4', 'E5', 'D5', 'A4'],
  'A/C#': ['C#4', 'A4', 'E5', 'A4', 'C#5', 'E5', 'A4', 'E5'],
  Bm: ['B3', 'F#4', 'D5', 'A4', 'F#4', 'D5', 'E5', 'D5'],
  G: ['G3', 'D4', 'B4', 'F#5', 'D5', 'B4', 'A4', 'F#4'],
  A: ['A3', 'E4', 'A4', 'C#5', 'E5', 'C#5', 'B4', 'E5'],
};
const VMEL = [
  [['F#5', 0, 1.5], ['E5', 1.5, .5], ['D5', 2, 2]],
  [['E5', 0, 1], ['C#5', 1, 1], ['A4', 2, 2]],
  [['D5', 0, 1.5], ['C#5', 1.5, .5], ['B4', 2, 1], ['A4', 3, 1]],
  [['B4', 0, 3], ['A4', 3, .5], ['B4', 3.5, .5]],
  [['F#5', 0, 1.5], ['A5', 1.5, .5], ['F#5', 2, 2]],
  [['E5', 0, 1], ['F#5', 1, .5], ['E5', 1.5, .5], ['C#5', 2, 2]],
  [['D5', 0, 1], ['E5', 1, 1], ['F#5', 2, 2]],
  [['G5', 0, 2], ['F#5', 2, 1], ['E5', 3, 1]],
];
const HOOK = [
  [['D5', 0, 1], ['B4', 1, .5], ['D5', 1.5, .5], ['E5', 2, 2, { b: 2, v: .35 }]],
  [['E5', 0, 1], ['C#5', 1, .5], ['E5', 1.5, .5], ['A5', 2, 1.5, { v: .35 }], ['F#5', 3.5, .5]],
  [['F#5', 0, 1.5, { v: .35 }], ['E5', 1.5, .5], ['D5', 2, 1], ['A4', 3, 1]],
  [['B4', 0, 1], ['D5', 1, 1, { b: 2, r: true }], ['C#5', 2, 1], ['B4', 3, 1, { v: .3 }]],
  [['D5', 0, 1], ['E5', 1, .5], ['F#5', 1.5, .5], ['G5', 2, 2, { b: 2, v: .4 }]],
  [['A5', 0, 1, { pb: 2 }], ['F#5', 1, .5], ['E5', 1.5, .5], ['C#5', 2, 2, { v: .35 }]],
  [['D5', 0, 3, { v: .45 }], ['E5', 3, .5], ['F#5', 3.5, .5]],
  [['D6', 0, 4, { sl: 3, v: .5, vel: 110 }]],
];
// final chorus: same hook, more ornament in places
const HOOK2 = HOOK.map((b) => b.map((x) => x.slice()));
HOOK2[2] = [['F#5', 0, .5], ['A5', .5, 1, { b: 2, r: true, v: .3 }], ['F#5', 1.5, .5], ['E5', 2, .5], ['D5', 2.5, .5], ['A4', 3, 1, { v: .3 }]];
HOOK2[6] = [['D5', 0, .25], ['E5', .25, .25], ['F#5', .5, .25], ['A5', .75, .25], ['B5', 1, 2, { b: 2, v: .5 }], ['A5', 3, .5], ['F#5', 3.5, .5]];

guitarLine(s, LEAD, HOOK, start.chorus, { vel: 98 });
guitarLine(s, LEAD, HOOK2, start.chorus2, { vel: 102 });

// verse melody on the clean melody guitar (enters second half of verse 1 and in the outro)
VMEL.forEach((notes, i) => notes.forEach(([p, st, d]) => s.note(MELO, p, s.t(start.verse + i, st) + s.hum(8), d * BEAT, 88 + s.hum(5))));

// ambient swells over the bridge: one note every two beats, faded in with expression
const swellNotes = ['F#4', 'D5', 'B4', 'G5', 'A4', 'F#5', 'E5', 'C#5'];
swellNotes.forEach((p, k) => {
  const t = s.t(start.bridge, k * 2);
  s.note(SWELL, p, t, BEAT * 2, 96);
  s.ramp(SWELL, 11, t, t + BEAT * 0.9, 0, 118, 16);
});

bars.forEach(({ sec, i, c }, bar) => {
  const ch = chord(c), root = ch.bass, t0 = s.t(bar), D = 9;
  const chorus = sec === 'chorus' || sec === 'chorus2';
  const last = bar === LAST;
  // riff (everywhere but the bridge), with a gentle accent pattern
  const r = RIFFS[c] || RIFFS[c.split('/')[0]];
  if (sec !== 'bridge') {
    if (last) ['D4', 'A4', 'E5', 'F#5'].forEach((p, k) => s.note(RIFF, p, t0 + k * 60, BEAT * 8, 84));
    else r.forEach((p, k) => s.note(RIFF, p, s.t(bar, k / 2) + s.hum(6), BEAT * .9, (chorus ? 74 : 84) + (k === 0 || k === 3 ? 8 : 0) + s.hum(5)));
  }
  // bass
  const bp = 38 + ((root - 2 + 12) % 12) - ((root - 2 + 12) % 12 > 7 ? 12 : 0);
  if (sec === 'intro' && i < 2) { /* riff alone */ }
  else if (last) s.note(BASS, bp, t0, BEAT * 6, 100);
  else if (chorus) for (let k = 0; k < 8; k++) s.note(BASS, bp, s.t(bar, k / 2) + s.hum(3), BEAT * .42, (k % 2 ? 84 : 100) + s.hum(4));
  else if (sec === 'bridge') s.note(BASS, bp, t0, BEAT * 3.8, 80);
  else { s.note(BASS, bp, t0, BEAT * 1.4, 98); s.note(BASS, bp, s.t(bar, 1.5), BEAT * .9, 84); s.note(BASS, bp + 7, s.t(bar, 3), BEAT * .45, 80); s.note(BASS, bp + 12, s.t(bar, 3.5), BEAT * .45, 78); }
  // distorted power chords, doubled L/R, 8ths in the chorus
  if (chorus) {
    const pr = 40 + ((ch.root - 4 + 12) % 12); // E2..D#3
    for (let k = 0; k < 8; k++) [RHY_L, RHY_R].forEach((c2, j) => [pr, pr + 7, pr + 12].forEach((p) => s.note(c2, p, s.t(bar, k / 2) + j * 9 + s.hum(6), BEAT * (k === 7 && i === 7 ? 3 : .45), (k % 2 ? 84 : 100) + s.hum(5))));
  }
  // pad + piano colour
  if (chorus || sec === 'bridge' || sec === 'outro') [0, 1, 2].forEach((k) => s.note(PAD, 57 + ((ch.root + ch.ivs[k] - 9 + 12) % 12), t0, last ? BEAT * 6 : s.BAR, 76));
  if (sec === 'verse' && i >= 4) [0, 2].forEach((b) => s.note(PIANO, 72 + ((ch.root + ch.ivs[b ? 1 : 0] + 12) % 12), s.t(bar, b + .5), BEAT, 58));

  // drums
  if (sec === 'intro') { if (i === 2) for (let k = 0; k < 8; k++) s.note(D, 42, s.t(bar, k / 2), 60, 50 + (k % 2 ? 0 : 12)); if (i === 3) { for (let k = 0; k < 8; k++) s.note(D, 42, s.t(bar, k / 2), 60, 56 + (k % 2 ? 0 : 12)); [3, 3.25, 3.5, 3.75].forEach((st, k) => s.note(D, 38, s.t(bar, st), BEAT / 4, 60 + k * 10)); } return; }
  if (last) { s.note(D, 49, t0, BEAT * 6, 96); s.note(D, 36, t0, BEAT, 104); return; }
  if (sec === 'bridge') {
    s.note(D, 36, t0, BEAT, 80); for (let b = 0; b < 4; b++) s.note(D, 41, s.t(bar, b), BEAT, 50 + i * 10 + b * 3);
    if (i === 3) for (let k = 0; k < 8; k++) s.note(D, 38, s.t(bar, 2 + k / 4), BEAT / 4, 60 + k * 7);
    return;
  }
  if (sec === 'outro' && i >= 2) { s.note(D, 36, t0, BEAT, 70); for (let k = 0; k < 8; k++) s.note(D, 42, s.t(bar, k / 2), 60, 40); return; }
  const kicks = chorus ? [0, 1.5, 2, 2.5] : [0, 2.5, 3];
  kicks.forEach((st) => s.note(D, 36, s.t(bar, st), BEAT / 2, st === 0 ? 110 : 92));
  [1, 3].forEach((b) => s.note(D, 38, s.t(bar, b) + s.hum(4), BEAT / 2, chorus ? 110 : 96));
  for (let k = 0; k < 8; k++) s.note(D, chorus ? (k % 2 ? 46 : 42) : 42, s.t(bar, k / 2) + s.hum(5), BEAT / 2, (k % 2 ? 60 : 78) + s.hum(6));
  if (chorus && i % 4 === 0) s.note(D, 49, t0, BEAT * 4, 104);
  if (chorus && i === 7) [2, 2.5, 3, 3.25, 3.5, 3.75].forEach((st, k) => s.note(D, [48, 48, 45, 45, 43, 43][k], s.t(bar, st), BEAT / 2, 90 + k * 4));
  if (sec === 'verse' && i === 7) [3, 3.25, 3.5, 3.75].forEach((st, k) => s.note(D, 38, s.t(bar, st), BEAT / 4, 70 + k * 10));
});
s.ramp(PAD, 11, s.t(start.chorus), s.t(start.chorus + 1), 0, 80);
s.ramp(PAD, 11, s.t(LAST - 1), s.t(LAST + 1), 80, 0);
for (let k = 0; k <= 4; k++) s.setTempo(s.t(LAST - 1, k), BPM - k * 2);

produce(s, 'last-local', {
  riff: { chs: [RIFF], fx: FX.clean(BPM), lufs: -19 },
  melody: { chs: [MELO], fx: FX.clean(BPM), lufs: -22 },
  swell: { chs: [SWELL], fx: FX.swell(BPM), lufs: -22 },
  rhythm: { chs: [RHY_L, RHY_R], fx: FX.crunch(), lufs: -21 },
  lead: { chs: [LEAD], fx: FX.lead(BPM), lufs: -17.5 },
  band: { chs: [BASS, PAD, PIANO, 9], fsReverb: true, lufs: -18.5 },
}, { lufs: -14, tail: 7, keep: [['riff', 'last-local-riff']] });
