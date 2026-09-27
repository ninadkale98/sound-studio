// "Afterglow": slow dream-pop / slowcore guitar piece in C major, ~4 minutes at 68 BPM.
// Chorused rhythm guitar with tape echo and a big hall, a warm slightly-driven lead singing the "vocal" line,
// round bass, brushed drums mixed low, a faint pad. Bittersweet Fm6 turn in the verse.
const { Song, n, chord, voicing } = require('./lib');
const { guitarLine, produce, FX } = require('./studio');
const BPM = 68;
const s = new Song({ bpm: BPM, seed: 1968 });
const { BEAT } = s;
const RHY = 0, LEAD = 1, BASS = 2, PAD = 3;
s.inst(RHY, 26, { vol: 110, rev: 0 });   // jazz guitar: warm, neck-pickup-like
s.inst(LEAD, 26, { vol: 112, rev: 0 });  // jazz guitar, driven by the amp chain
s.inst(BASS, 33, { vol: 100, rev: 20 });
s.inst(PAD, 89, { vol: 70, pan: 64, rev: 110, expr: 0 });
s.drums({ vol: 92, rev: 70, kit: 40 });  // GS brush kit

const VERSE = ['Cmaj7', 'Am7', 'Fmaj7', 'Fm6', 'Cmaj7', 'Am7', 'Fmaj7', 'Fm6'];
const CHORUS = ['Fmaj7', 'G6', 'Em7', 'Am7', 'Fmaj7', 'G6', 'Cmaj7', 'Cmaj7'];
const SOLO = ['Am7', 'Fmaj7', 'Cmaj7', 'G6', 'Am7', 'Fmaj7', 'Cmaj7', 'G6'];
const sections = [
  ['intro', VERSE], ['verse', [...VERSE, ...VERSE]], ['chorus', CHORUS], ['solo', SOLO],
  ['verse2', VERSE], ['chorus2', CHORUS], ['outro', ['Cmaj7', 'Am7', 'Fmaj7', 'Fm6', 'Cmaj7', 'Am7', 'Fmaj7', 'Fm6', 'Cmaj7', 'Cmaj7', 'Cmaj7', 'Cmaj7']],
];
const bars = []; sections.forEach(([sec, cs]) => cs.forEach((c, i) => bars.push({ sec, i, c })));
const start = {}; bars.forEach((b, k) => { if (!(b.sec in start)) start[b.sec] = k; });
const LAST = bars.length - 1;

// ---- the "vocal" line, played on the lead guitar
const V = [
  [['E4', 1, 1], ['G4', 2, 1], ['B4', 3, 1]],
  [['C5', 0, 2, { v: .25 }], ['B4', 2, .5], ['A4', 2.5, 1.5, { v: .25 }]],
  [['A4', 0, 1], ['C5', 1, 1], ['E5', 2, 2, { v: .3 }]],
  [['D5', 0, 1.5], ['C5', 1.5, .5], ['G#4', 2, 2, { v: .3 }]],
  [['E4', 1, 1], ['G4', 2, .5], ['A4', 2.5, .5], ['B4', 3, 1]],
  [['C5', 0, 1.5], ['E5', 1.5, .5], ['D5', 2, 2, { v: .3 }]],
  [['C5', 0, 1], ['A4', 1, 1], ['G4', 2, 1], ['A4', 3, 1]],
  [['G4', 0, 3.5, { v: .3 }]],
];
const V2 = V.map((b) => b.map((x) => x.slice()));
V2[5] = [['C5', 0, 1], ['E5', 1, 1, { b: 2, r: true }], ['D5', 2, 2, { v: .3 }]];
V2[7] = [['G4', 0, 2, { v: .3 }], ['A4', 2, .5], ['B4', 2.5, .5], ['C5', 3, .5], ['D5', 3.5, .5]];
const C = [
  [['A4', 0, 1], ['C5', 1, 1], ['E5', 2, 1.5, { v: .3 }], ['D5', 3.5, .5]],
  [['D5', 0, 1], ['E5', 1, 1], ['B4', 2, 2, { v: .3 }]],
  [['G5', 0, 2, { sl: 2, v: .35 }], ['E5', 2, 1], ['D5', 3, 1]],
  [['C5', 0, 1.5], ['B4', 1.5, .5], ['A4', 2, 2, { v: .3 }]],
  [['A4', 0, 1], ['C5', 1, 1], ['F5', 2, 1.5, { v: .3 }], ['E5', 3.5, .5]],
  [['D5', 0, 1], ['E5', 1, .5], ['D5', 1.5, .5], ['B4', 2, 2, { v: .3 }]],
  [['G4', 0, 1], ['C5', 1, 1], ['E5', 2, 2, { v: .35 }]],
  [['D5', 0, 1, { b: 2, r: true }], ['C5', 1, 3, { v: .35 }]],
];
const SOLO_LINE = [
  [['D5', 0, 1, { b: 2, v: .3 }], ['C5', 1, .5], ['A4', 1.5, .5], ['G4', 2, 2, { v: .35 }]],
  [['A4', 0, .5], ['C5', .5, .5], ['E5', 1, 2, { v: .35 }], ['C5', 3, 1]],
  [['G5', 0, 1.5, { pb: 2, v: .3 }], ['E5', 1.5, .5], ['D5', 2, 1], ['C5', 3, 1]],
  [['B4', 0, 1], ['D5', 1, 1, { b: 2, r: true }], ['B4', 2, 2, { v: .3 }]],
  [['E5', 0, .5], ['G5', .5, .5], ['A5', 1, 2, { b: 2, v: .4 }], ['G5', 3, 1]],
  [['F5', 0, 1], ['E5', 1, .5], ['C5', 1.5, .5], ['A4', 2, 2, { v: .35 }]],
  [['C5', 0, .5], ['D5', .5, .5], ['E5', 1, .5], ['G5', 1.5, .5], ['E5', 2, 2, { v: .4 }]],
  [['D5', 0, 2, { b: 2, bd: .5, v: .4 }], ['B4', 2, 2, { v: .3 }]],
];
const OUT_LINE = [V[0], V[1], V[2], [['D5', 0, 1.5], ['C5', 1.5, .5], ['G#4', 2, 2, { v: .3 }]], [['G4', 1, 1], ['E4', 2, 2, { v: .3 }]], [], [['A4', 0, 1], ['G4', 1, 1], ['E4', 2, 2]], [], [['G4', 0, 1], ['C5', 1, 1], ['E5', 2, 6, { v: .35 }]]];

guitarLine(s, LEAD, [...V, ...V2, ...C, ...SOLO_LINE, ...V2, ...C, ...OUT_LINE], start.verse, { vel: 82 });

bars.forEach(({ sec, i, c }, bar) => {
  const ch = chord(c), root = ch.root, t0 = s.t(bar), D = 9;
  const chorus = sec === 'chorus' || sec === 'chorus2';
  const last = bar === LAST;
  const lowRoot = 40 + ((root - 4 + 12) % 12);            // E2..D#3
  const v = [lowRoot, ...voicing(c, n('G3'), 4)];         // guitar-ish spread voicing
  // rhythm guitar: slow 8th-note arpeggios; soft strums in the choruses; ring out at the end
  if (last) v.forEach((p, k) => s.note(RHY, p, t0 + k * 55, BEAT * 10, 70 - k * 3));
  else if (chorus) {
    [[0, 'down', 1], [1.5, 'up', .6], [2, 'down', .85], [3.5, 'up', .55]].forEach(([st, dir, a]) =>
      s.strum(RHY, v, s.t(bar, st) + s.hum(10), BEAT * (dir === 'down' ? 1.6 : .5), 74 * a, { dir, spread: dir === 'down' ? 28 : 18 }));
  } else if (sec !== 'outro' || i < 10) {
    const pat = [0, 2, 3, 4, 1, 4, 3, 2];
    const soft = sec === 'intro' && i < 4 ? 0.85 : 1;
    pat.forEach((k, j) => s.note(RHY, v[k], s.t(bar, j / 2) + s.hum(12) + 8, BEAT * 1.4, (62 + (j === 0 ? 10 : j === 4 ? 4 : 0) + s.hum(5)) * soft));
  } else s.strum(RHY, v, t0, BEAT * 4, 60, { spread: 40 });

  // bass: round, simple
  const bp = 36 + ((root - 0 + 12) % 12) - ((root % 12) > 6 ? 12 : 0); // C2..F#2 / G1..B1
  if (!['intro'].includes(sec) && !(sec === 'outro' && i >= 10)) {
    if (last) s.note(BASS, bp, t0, BEAT * 8, 84);
    else if (chorus || sec === 'solo') { s.note(BASS, bp, t0, BEAT * 1.4, 88); s.note(BASS, bp, s.t(bar, 1.5), BEAT * .9, 72); s.note(BASS, bp + 7, s.t(bar, 3), BEAT * .9, 74); }
    else { s.note(BASS, bp, t0, BEAT * 1.9, 84); s.note(BASS, bp, s.t(bar, 2), BEAT * 1.8, 74); }
  } else if (sec === 'outro' && i === 10) s.note(BASS, bp, t0, BEAT * 12, 80);

  // pad: faint bed from the chorus onward
  if (chorus || sec === 'solo' || sec === 'outro' || sec === 'verse2') voicing(c, n('E4'), 3).forEach((p) => s.note(PAD, p, t0, last ? BEAT * 8 : s.BAR, 70));

  // brushed drums, far back
  const drumsOn = (sec === 'verse' && i >= 4) || chorus || sec === 'solo' || sec === 'verse2' || (sec === 'outro' && i < 8);
  if (!drumsOn) return;
  s.note(D, 36, t0, BEAT, chorus ? 70 : 60); s.note(D, 36, s.t(bar, 2.5), BEAT / 2, chorus ? 56 : 46);
  [1, 3].forEach((b) => s.note(D, 38, s.t(bar, b) + s.hum(8), BEAT / 2, (chorus ? 70 : 60) + s.hum(5)));
  for (let k = 0; k < 4; k++) s.note(D, 40, s.t(bar, k) + s.hum(10), BEAT, 34 + s.hum(6)); // brush swirl
  if (chorus || sec === 'solo') for (let k = 0; k < 8; k++) s.note(D, 51, s.t(bar, k / 2) + s.hum(8), BEAT / 2, (k % 2 ? 30 : 42) + s.hum(4));
  if (i === 0 && (chorus || sec === 'solo')) s.note(D, 49, t0, BEAT * 4, 56);
});
s.ramp(PAD, 11, s.t(start.chorus), s.t(start.chorus + 2), 0, 70);
s.ramp(PAD, 11, s.t(start.verse2), s.t(start.verse2) + BEAT * 2, 70, 45, 6);
s.ramp(PAD, 11, s.t(start.chorus2), s.t(start.chorus2 + 1), 45, 75);
s.ramp(PAD, 11, s.t(LAST - 3), s.t(LAST + 2), 75, 0, 30);
for (let k = 0; k <= 8; k++) s.setTempo(s.t(LAST - 3, k * 2), BPM - k * 1.2);

const NAME = process.argv[2] || 'afterglow';
produce(s, NAME, {
  rhythmBody: { chs: [RHY], fx: FX.casBody(600), lufs: -20 },
  rhythmFuzz: { chs: [RHY], fx: FX.casFuzz(600), lufs: -24.5 },
  leadBody: { chs: [LEAD], fx: FX.casBody(600), lufs: -19.5 },
  leadFuzz: { chs: [LEAD], fx: FX.casFuzz(600), lufs: -21.5 },
  band: { chs: [BASS, PAD, 9], fsReverb: true, fx: 'lowpass 7000', lufs: -21.5 },
}, { lufs: -16, tail: 8, post: 'lowpass=f=10000' });
