// "Numb Sky": slow, soaring B-minor rock ballad built around an expressive lead solo
// (bends, pre-bends, releases, slides, delayed vibrato), with clean delay-chorus arpeggios, organ, bass, drums.
const { Song, n, chord, voicing } = require('./lib');
const { guitarLine, produce, FX } = require('./studio');
const BPM = 66;
const s = new Song({ bpm: BPM, seed: 5 });
const { BEAT } = s;
const LEAD = 0, CLEAN = 1, ORGAN = 2, BASS = 3, STR = 4;
s.inst(LEAD, 29, { vol: 110, rev: 0 });  // overdriven guitar
s.inst(CLEAN, 27, { vol: 100, rev: 0 }); // clean electric
s.inst(ORGAN, 16, { vol: 80, pan: 58, rev: 70, expr: 0 });
s.inst(BASS, 33, { vol: 105, rev: 15 });
s.inst(STR, 49, { vol: 70, pan: 70, rev: 80, expr: 0 });
s.drums({ vol: 104, rev: 60 });

const intro = ['Bm', 'G', 'D', 'A'];
const verse = ['Bm', 'G', 'D', 'A', 'Bm', 'G', 'Em', 'F#'];
const outro = ['Bm', 'G', 'D', 'Bm'];
const form = [...intro, ...verse, ...verse, ...outro]; // 24 bars
const P1 = 4, P2 = 12, OUT = 20, END = 24;

// ---- the solo
const part1 = [
  [['E4', 1, 1, { b: 2, v: .3 }], ['D4', 2, .5], ['B3', 2.5, 1.5, { v: .35 }]],
  [['D4', 0, .5], ['E4', .5, .5], ['F#4', 1, 2, { v: .4 }], ['E4', 3, .5], ['D4', 3.5, .5]],
  [['A4', 0, 1.5, { b: 2, v: .3 }], ['A4', 1.5, .5], ['F#4', 2, 2, { v: .35 }]],
  [['E4', 0, 1, { b: 2, r: true }], ['C#4', 1, 1], ['E4', 2, 2, { v: .35 }]],
  [['F#4', 0, .5], ['A4', .5, .5], ['B4', 1, 2, { v: .4, sl: 2 }], ['A4', 3, .5], ['F#4', 3.5, .5]],
  [['G4', 0, 2, { b: 2, v: .35 }], ['F#4', 2, .5], ['E4', 2.5, .5], ['D4', 3, 1, { v: .3 }]],
  [['E4', 0, .5], ['G4', .5, .5], ['A4', 1, 1.5, { b: 2, v: .3 }], ['G4', 2.5, .5], ['E4', 3, 1, { v: .3 }]],
  [['E4', 0, .5], ['F#4', .5, 1.5, { v: .35 }], ['A#4', 2, 1, { v: .3 }], ['C#5', 3, 1, { sl: 2 }]],
];
const part2 = [
  [['D5', 0, 1, { b: 2, v: .35 }], ['D5', 1, .25], ['B4', 1.25, .25], ['A4', 1.5, .5], ['B4', 2, 2, { v: .45 }]],
  [['E5', 0, .5], ['F#5', .5, .5], ['G5', 1, 1.5, { v: .4 }], ['F#5', 2.5, .25], ['E5', 2.75, .25], ['D5', 3, 1, { v: .3 }]],
  [['A5', 0, 2, { b: 2, bd: .45, v: .45 }], ['A5', 2, .5], ['F#5', 2.5, .5], ['E5', 3, .5], ['D5', 3.5, .5]],
  [['E5', 0, .25], ['C#5', .25, .25], ['B4', .5, .25], ['A4', .75, .25], ['C#5', 1, .25], ['E5', 1.25, .25], ['A5', 1.5, .25], ['B5', 1.75, .25], ['C#6', 2, 2, { v: .5, sl: 1 }]],
  [['E5', 0, 1.5, { pb: 2 }], ['D5', 1.5, .5], ['B4', 2, .5], ['D5', 2.5, .5], ['E5', 3, 1, { b: 2 }]],
  [['B5', 0, .5], ['A5', .5, .5], ['G5', 1, .5], ['F#5', 1.5, .5], ['E5', 2, .5], ['D5', 2.5, .5], ['E5', 3, 1, { b: 2, v: .3 }]],
  [['A5', 0, 4, { b: 2, bt: .15, bd: .7, v: .55, vel: 112 }]],   // the big held bend
  [['A#5', 0, .5], ['C#6', .5, 1.5, { v: .5 }], ['B5', 2, .5], ['A#5', 2.5, .5], ['F#5', 3, 1, { v: .4 }]],
];
const ending = [
  [['D5', 0, 1, { b: 2, r: true }], ['B4', 1, .5], ['A4', 1.5, .5], ['F#4', 2, 2, { v: .4 }]],
  [['E4', 0, 1, { b: 2, v: .3 }], ['D4', 1, 1], ['B3', 2, 2, { v: .35 }]],
  [['A4', 0, 2, { b: 2, v: .4 }], ['F#4', 2, 2, { v: .35 }]],
  [['B4', 0, 6, { v: .45, sl: 2 }]],
];
guitarLine(s, LEAD, [...part1, ...part2, ...ending], P1, { vel: 100 });
s.cc(LEAD, s.t(P2 + 6), 11, 127);

// ---- band
form.forEach((c, bar) => {
  const ch = chord(c), root = ch.root, t0 = s.t(bar), D = 9;
  const last = bar === END - 1;
  const loud = bar >= P2 && bar < OUT;
  // clean arpeggio (8ths), gentler under the solo
  const v = voicing(c, n('D3'), 3).concat(voicing(c, n('B3'), 2));
  const pat = [0, 1, 2, 3, 4, 3, 2, 1];
  if (!last) pat.forEach((k, i) => s.note(CLEAN, v[k], s.t(bar, i / 2) + s.hum(8), BEAT * 1.2, (bar < P1 ? 84 : loud ? 70 : 62) + (i === 0 ? 8 : 0) + s.hum(5)));
  else v.forEach((p, i) => s.note(CLEAN, p, t0 + i * 40, BEAT * 6, 70));
  // organ + strings pads
  voicing(c, n('F#3'), 3).forEach((p) => s.note(ORGAN, p, t0, last ? BEAT * 6 : s.BAR, 80));
  if (bar >= P2) voicing(c, n('D4'), 3).forEach((p) => s.note(STR, p, t0, last ? BEAT * 6 : s.BAR, 80));
  // bass
  const bp = 35 + ((root - 11 + 12) % 12); // B1..A#2
  if (bar >= 2) {
    if (last) s.note(BASS, bp, t0, BEAT * 6, 100);
    else { s.note(BASS, bp, t0, BEAT * 1.9, 100); s.note(BASS, bp, s.t(bar, 2), BEAT * 1.4, 90); s.note(BASS, bp + (loud ? 12 : 7), s.t(bar, 3.5), BEAT * .45, 80); }
  }
  // drums (from bar 3), fill into sections, crashes on arrivals
  if (bar < 2) return;
  if (bar === 3) { [2, 2.5, 3, 3.25, 3.5, 3.75].forEach((st, k) => s.note(D, [47, 47, 45, 45, 43, 43][k], s.t(bar, st), BEAT / 2, 70 + k * 7)); }
  if (last) { s.note(D, 49, t0, BEAT * 6, 100); s.note(D, 36, t0, BEAT, 110); return; }
  s.note(D, 36, t0, BEAT, 108); s.note(D, 36, s.t(bar, 2.5), BEAT / 2, 90); if (loud) s.note(D, 36, s.t(bar, 1.75), BEAT / 4, 70);
  if (bar !== 3) [1, 3].forEach((b) => s.note(D, 38, s.t(bar, b), BEAT / 2, 104));
  for (let k = 0; k < 8; k++) s.note(D, loud ? 51 : 42, s.t(bar, k / 2) + s.hum(5), BEAT / 2, (k % 2 ? 56 : 74) + s.hum(6));
  if ([P1, P2, P2 + 6, OUT].includes(bar)) s.note(D, 49, t0, BEAT * 4, 104);
  if ([P2 - 1, P2 + 5, OUT - 1].includes(bar)) [3, 3.25, 3.5, 3.75].forEach((st, k) => s.note(D, [48, 47, 45, 43][k], s.t(bar, st), BEAT / 4, 86 + k * 6));
});
s.ramp(ORGAN, 11, 0, s.t(2), 0, 90);
s.ramp(STR, 11, s.t(P2), s.t(P2 + 2), 0, 85);
s.ramp(ORGAN, 11, s.t(END - 1), s.t(END + 1), 90, 0);
s.ramp(STR, 11, s.t(END - 1), s.t(END + 1), 85, 0);
for (let k = 0; k <= 4; k++) s.setTempo(s.t(END - 2, k), BPM - k * 1.5);

produce(s, 'numb-sky', {
  lead: { chs: [LEAD], fx: FX.lead(BPM), lufs: -17 },
  clean: { chs: [CLEAN], fx: FX.clean(BPM), lufs: -22 },
  band: { chs: [ORGAN, BASS, STR, 9], fsReverb: true, lufs: -19.5 },
}, { lufs: -14, tail: 7, keep: [['lead', 'numb-sky-solo']] });
