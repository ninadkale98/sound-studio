// "Good Morning": playful, lightly swung explainer tune in C major. Pizzicato strings, xylophone, clarinet, bassoon, woodblock.
const { Song, n, chord } = require('./lib');
const s = new Song({ bpm: 100, seed: 23 });
const { BEAT } = s;
const PIZZ = 0, XYL = 1, CLAR = 2, BSN = 3, GLOCK = 4, STR = 5, PIANO = 6;
s.inst(PIZZ, 45, { vol: 100, pan: 44, rev: 45 });
s.inst(XYL, 13, { vol: 90, pan: 82, rev: 50 });
s.inst(CLAR, 71, { vol: 96, pan: 60, rev: 55 });
s.inst(BSN, 70, { vol: 96, pan: 72, rev: 30 });
s.inst(GLOCK, 9, { vol: 62, pan: 96, rev: 65 });
s.inst(STR, 49, { vol: 70, pan: 64, rev: 75, expr: 0 });
s.inst(PIANO, 0, { vol: 80, pan: 58, rev: 45 });
s.drums({ vol: 96, rev: 30 });

const sw = (beat) => { const b = Math.floor(beat), f = beat - b; return b + (f === .5 ? .6 : f); }; // light swing
const T = (bar, beat) => s.t(bar, sw(beat));

const A = ['C', 'Am', 'Dm', 'G', 'C', 'Am', 'F', 'G'];
const B = ['F', 'G', 'Em', 'Am', 'F', 'G', 'C', 'C'];
const sections = [['intro', ['C', 'G']], ['A', A], ['B', B], ['A2', A], ['end', ['C']]];
const bars = []; sections.forEach(([sec, cs]) => cs.forEach((c, i) => bars.push({ sec, i, c })));
const start = {}; bars.forEach((b, k) => { if (!(b.sec in start)) start[b.sec] = k; });

const MA = [
  [['E5', 0, .5], ['G5', .5, .5], ['C6', 1, .5], ['G5', 2, .5], ['E5', 2.5, .5], ['G5', 3, .5]],
  [['A5', 0, .5], ['G5', .5, .5], ['E5', 1, .5], ['C5', 2, 1], ['E5', 3, .5]],
  [['F5', 0, .5], ['A5', .5, .5], ['D6', 1, .5], ['A5', 2, .5], ['F5', 2.5, .5], ['A5', 3, .5]],
  [['G5', 0, .5], ['F5', .5, .5], ['E5', 1, .5], ['D5', 1.5, .5], ['B4', 2, .5], ['D5', 3, 1]],
  [['E5', 0, .5], ['G5', .5, .5], ['C6', 1, .5], ['G5', 2, .5], ['E5', 2.5, .5], ['G5', 3, .5]],
  [['A5', 0, .5], ['B5', .5, .5], ['C6', 1, 1], ['A5', 2, .5], ['E5', 3, .5]],
  [['F5', 0, .5], ['A5', .5, .5], ['C6', 1, .5], ['A5', 1.5, .5], ['G5', 2, .5], ['F5', 2.5, .5], ['E5', 3, .5]],
  [['D5', 0, .5], ['E5', .5, .5], ['F5', 1, .5], ['G5', 1.5, .5], ['A5', 2, .5], ['B5', 2.5, .5], ['C6', 3, 1]],
];
const MB = [
  [['A4', 0, 1.5], ['C5', 1.5, .5], ['F5', 2, 2]],
  [['D5', 0, 1.5], ['E5', 1.5, .5], ['D5', 2, 1], ['B4', 3, 1]],
  [['G4', 0, 1.5], ['B4', 1.5, .5], ['E5', 2, 2]],
  [['C5', 0, 1.5], ['B4', 1.5, .5], ['A4', 2, 2]],
  [['A4', 0, 1], ['C5', 1, 1], ['F5', 2, 1], ['E5', 3, 1]],
  [['D5', 0, 1], ['E5', 1, .5], ['F5', 1.5, .5], ['G5', 2, 2]],
  [['E5', 0, 4]],
  [],
];
const play = (ch, mel, bar, vel, { shift = 0, len = .8 } = {}) => mel.forEach(([p, st, d]) => s.note(ch, n(p) + shift, T(bar, st) + s.hum(6), d * BEAT * len, vel + s.hum(5)));

bars.forEach(({ sec, i, c }, bar) => {
  const ch = chord(c), root = ch.root, t0 = s.t(bar);
  const D = 9;
  const bass = 36 + ((root - 0 + 12) % 12) - (root > 7 ? 12 : 0); // C2..G2 area
  if (sec === 'end') {
    [48, 55, 60, 64, 67, 72].forEach((p, k) => s.note(PIZZ, p, t0 + k * 22, BEAT, 100 - k * 3));
    s.note(XYL, 'C6', t0 + 140, BEAT, 96); s.note(GLOCK, 'G6', t0 + 140, BEAT * 3, 70); s.note(GLOCK, 'C7', t0 + 200, BEAT * 3, 70);
    s.note(BSN, 36, t0, BEAT, 100); s.note(D, 81, t0 + 140, BEAT * 2, 90); s.note(D, 36, t0, BEAT, 90);
    return;
  }
  // pizzicato "oom-pah": bass note on 1 & 3, chord on 2 & 4 (+ swung pickup)
  const vc = [55, 57, 59, 60, 62, 64, 65, 67].filter((p) => ch.ivs.slice(0, 3).some((iv) => (root + iv) % 12 === p % 12)).slice(0, 3);
  [0, 2].forEach((b) => s.note(PIZZ, bass + 12, T(bar, b) + s.hum(4), BEAT * .6, 92));
  [1, 3].forEach((b) => vc.forEach((p) => s.note(PIZZ, p, T(bar, b) + s.hum(6), BEAT * .5, 80 + s.hum(5))));
  if (sec !== 'intro') s.note(PIZZ, vc[vc.length - 1], T(bar, 3.5), BEAT * .4, 64);

  // bassoon: staccato walking bass (from A section on)
  if (sec !== 'intro') [[0, 0], [1, 7], [2, 12], [3, 7]].forEach(([b, iv]) => s.note(BSN, bass + iv, T(bar, b) + s.hum(5), BEAT * .45, (b === 0 ? 96 : 80) + s.hum(4)));

  // melodies
  if (sec === 'A') play(XYL, MA[i], bar, 96);
  if (sec === 'A2') { play(XYL, MA[i], bar, 100); play(GLOCK, MA[i], bar, 64, { shift: 12 }); play(CLAR, MA[i], bar, 70, { shift: -12, len: .7 }); }
  if (sec === 'B') { play(CLAR, MB[i], bar, 96, { len: .95 }); play(XYL, MB[i].filter(([, st]) => st % 1 === 0), bar, 58, { shift: 12, len: .4 }); }
  if (sec === 'B') vc.forEach((p) => s.note(STR, p, t0, s.BAR, 76));
  if (sec === 'intro') { s.note(XYL, i ? 'B5' : 'E5', T(bar, 3.5), BEAT / 2, 80); s.note(GLOCK, i ? 'D6' : 'C6', T(bar, 3.5), BEAT, 60); }
  if (sec === 'A2' && i % 2 === 1) s.note(PIANO, vc[2] + 12, T(bar, 3.5), BEAT / 2, 60);

  // light percussion: woodblock tick-tock, soft kick, snap-like claps, triangle on section starts
  if (sec === 'intro') { [0, 1, 2, 3].forEach((b) => s.note(D, b % 2 ? 77 : 76, T(bar, b), 60, 70)); return; }
  s.note(D, 36, t0, BEAT, 86); s.note(D, 36, T(bar, 2.5), BEAT / 2, 62);
  [1, 3].forEach((b) => s.note(D, 39, T(bar, b) + s.hum(4), BEAT / 2, 62 + s.hum(5)));
  [0.5, 1.5, 2.5, 3.5].forEach((b) => s.note(D, 76, T(bar, b) + s.hum(4), 60, 44 + s.hum(6)));
  if (i === 0) s.note(D, 81, t0, BEAT * 2, 80);
  if (sec === 'A2') for (let k = 0; k < 8; k++) s.note(D, 69, T(bar, k / 2), 60, 40 + (k % 2 ? 0 : 12));
});
s.ramp(STR, 11, s.t(start.B), s.t(start.B + 1), 0, 84);
s.ramp(STR, 11, s.t(start.A2) - 240, s.t(start.A2), 84, 0);
s.setTempo(s.t(bars.length - 1) - BEAT, 92);
s.render('good-morning', { lufs: -14, room: 0.5, level: 0.5, tail: 2.5 });
