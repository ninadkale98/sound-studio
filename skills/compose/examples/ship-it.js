// "Ship It": bright, bouncy pop in F major (I–V–vi–IV). Marimba hook, offbeat piano, glock, claps, brass stabs.
const { Song, n, chord } = require('./lib');
const s = new Song({ bpm: 122, seed: 7 });
const { BEAT } = s;
const PIANO = 0, MAR = 1, BASS = 2, GLOCK = 3, STR = 4, BRASS = 5, LEAD = 6;
s.inst(PIANO, 1, { vol: 92, pan: 50, rev: 35 });   // bright piano
s.inst(MAR, 12, { vol: 100, pan: 78, rev: 45 });   // marimba
s.inst(BASS, 33, { vol: 104, pan: 64, rev: 10 });  // finger bass
s.inst(GLOCK, 9, { vol: 60, pan: 90, rev: 60 });   // glockenspiel
s.inst(STR, 48, { vol: 72, pan: 64, rev: 70, expr: 0 });
s.inst(BRASS, 61, { vol: 84, pan: 40, rev: 45 });  // brass section
s.inst(LEAD, 1, { vol: 96, pan: 64, rev: 45 });    // piano lead (melody)
s.drums({ vol: 104, rev: 25 });

const LOOP = ['F', 'C', 'Dm', 'Bb'];
const sections = [['intro', 4], ['verse', 8], ['chorus', 8], ['break', 4], ['chorus2', 8], ['end', 2]];
const bars = []; sections.forEach(([sec, len]) => { for (let i = 0; i < len; i++) bars.push({ sec, i, c: sec === 'end' ? (i === 0 ? 'C' : 'F') : LOOP[i % 4] }); });
const start = {}; bars.forEach((b, k) => { if (!(b.sec in start)) start[b.sec] = k; });

const HOOK = [
  [['F5', 0, .5], ['A5', .5, .5], ['C6', 1, .5], ['A5', 1.5, .5], ['G5', 2, .5], ['A5', 2.5, .5], ['F5', 3, 1]],
  [['E5', 0, .5], ['G5', .5, .5], ['C6', 1, .5], ['G5', 1.5, .5], ['E5', 2, .5], ['G5', 2.5, .5], ['C5', 3, 1]],
  [['D5', 0, .5], ['F5', .5, .5], ['A5', 1, .5], ['F5', 1.5, .5], ['E5', 2, .5], ['F5', 2.5, .5], ['D5', 3, 1]],
  [['D5', 0, .5], ['F5', .5, .5], ['Bb5', 1, .5], ['A5', 1.5, .5], ['G5', 2, .5], ['F5', 2.5, .5], ['C5', 3, .5], ['E5', 3.5, .5]],
];
const CHO = [
  [['A5', 0, 1], ['C6', 1, .5], ['A5', 1.5, .5], ['G5', 2, 1], ['F5', 3, 1]],
  [['G5', 0, 1.5], ['E5', 1.5, .5], ['C5', 2, 2]],
  [['A5', 0, 1], ['C6', 1, .5], ['A5', 1.5, .5], ['G5', 2, .5], ['A5', 2.5, .5], ['F5', 3, 1]],
  [['G5', 0, 1.5], ['F5', 1.5, .5], ['D5', 2, 1], ['E5', 3, 1]],
];
const play = (ch, mel, bar, vel, shift = 0, len = .9) => mel.forEach(([p, st, d]) => s.note(ch, n(p) + shift, s.t(bar, st) + s.hum(6), d * BEAT * len, vel + s.hum(5) + (st % 1 === 0 ? 6 : 0)));

bars.forEach(({ sec, i, c }, bar) => {
  const ch = chord(c), root = ch.root, t0 = s.t(bar);
  const full = sec === 'chorus' || sec === 'chorus2';
  const bassP = 29 + ((root - 5 + 12) % 12); // F1..E2, played an octave up below
  if (sec === 'end') {
    if (i === 0) { // big pickup: C chord stabs
      [0, 1, 2, 2.5, 3, 3.5].forEach((st, k) => { s.note(9, 38, s.t(bar, st), BEAT / 2, 70 + k * 8); });
      [0, 1.5, 3].forEach((st) => [60, 64, 67, 72].forEach((p) => s.note(BRASS, p, s.t(bar, st), BEAT * .4, 100)));
      s.note(BASS, bassP + 12, t0, BEAT * 4, 100);
    } else { // final hit
      [53, 57, 60, 65, 69, 72].forEach((p, k) => { s.note(PIANO, p, t0 + k * 8, BEAT * 6, 100); s.note(BRASS, p, t0, BEAT * 1.5, 108); });
      s.note(MAR, 'F6', t0, BEAT * 3, 100); s.note(GLOCK, 'C7', t0, BEAT * 4, 80); s.note(GLOCK, 'A6', t0 + 60, BEAT * 4, 70);
      s.note(BASS, bassP, t0, BEAT * 4, 110); s.note(9, 49, t0, BEAT * 4, 110); s.note(9, 36, t0, BEAT, 120);
    }
    return;
  }
  // marimba hook: intro, verse, break
  if (sec === 'intro' || sec === 'verse' || sec === 'break') play(MAR, HOOK[i % 4], bar, sec === 'verse' ? 86 : 96);
  if (full) { play(MAR, HOOK[i % 4], bar, 66, 12, .7); play(LEAD, CHO[i % 4], bar, 100); play(GLOCK, CHO[i % 4], bar, 72, 12); }

  // piano: bouncy offbeat chords (verse+), sustained in intro
  const vp = [53, 57, 60, 64, 65, 67, 69, 70, 72].filter((p) => ch.ivs.slice(0, 3).some((iv) => (root + iv) % 12 === p % 12)).slice(0, 4);
  if (sec === 'intro') vp.forEach((p) => s.note(PIANO, p, t0 + s.hum(6), BEAT * 3.8, 62));
  if (sec === 'verse' || full) for (let k = 0; k < 4; k++) vp.forEach((p) => s.note(PIANO, p, s.t(bar, k + .5) + s.hum(5), BEAT * .35, (full ? 80 : 70) + s.hum(4)));

  // bass: octave-bouncing eighths
  if (sec !== 'intro') {
    const pat = sec === 'break' ? [0, 2] : [0, .5, 1, 1.5, 2, 2.5, 3, 3.5];
    pat.forEach((st, k) => s.note(BASS, bassP + 12 + (k % 2 && sec !== 'break' ? 12 : 0), s.t(bar, st) + s.hum(4), BEAT * (sec === 'break' ? 1.8 : .4), (k % 2 ? 80 : 100) + s.hum(4)));
  }
  // strings + brass stabs in the chorus
  if (full) {
    ch.ivs.slice(0, 3).forEach((iv) => s.note(STR, 65 + ((root + iv - 5 + 12) % 12), t0, s.BAR, 80));
    if (i % 2 === 0) [0, 1.5].forEach((st) => vp.forEach((p) => s.note(BRASS, p + 12, s.t(bar, st), BEAT * .35, 96)));
  }

  // drums
  const D = 9;
  if (sec === 'intro') { if (i >= 2) for (let k = 0; k < 8; k++) s.note(D, 42, s.t(bar, k / 2), 60, 50 + (k % 2 ? 0 : 15)); if (i === 3) [2, 2.5, 3, 3.5].forEach((st, k) => s.note(D, 39, s.t(bar, st), 60, 70 + k * 10)); return; }
  if (sec === 'break') { [1, 3].forEach((b) => s.note(D, 39, s.t(bar, b), 60, 90)); if (i === 3) [2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75].forEach((st, k) => s.note(D, 38, s.t(bar, st), 60, 50 + k * 8)); return; }
  s.note(D, 36, t0, BEAT, 110); s.note(D, 36, s.t(bar, 2), BEAT, 104); s.note(D, 36, s.t(bar, 2.5), BEAT / 2, full ? 84 : 0.1);
  [1, 3].forEach((b) => { s.note(D, 38, s.t(bar, b), BEAT / 2, full ? 96 : 84); s.note(D, 39, s.t(bar, b) + 8, BEAT / 2, 86); });
  for (let k = 0; k < 8; k++) s.note(D, full && k % 2 ? 46 : 42, s.t(bar, k / 2) + s.hum(5), BEAT / 2, (k % 2 ? 60 : 78) + s.hum(6));
  if (full) for (let k = 0; k < 4; k++) s.note(D, 54, s.t(bar, k + .5), BEAT / 2, 60);
  if (i === 0) s.note(D, 49, t0, BEAT * 4, 96);
});
s.ramp(STR, 11, s.t(start.chorus), s.t(start.chorus + 1), 0, 90);
s.cc(STR, s.t(start.break), 11, 0);
s.ramp(STR, 11, s.t(start.chorus2), s.t(start.chorus2 + 1), 0, 96);
s.render('ship-it', { lufs: -14, room: 0.45, level: 0.45, tail: 2.5 });
