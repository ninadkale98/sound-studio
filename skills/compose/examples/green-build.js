// "Green Build": happy funk in D major. Muted clean-guitar 16th chops, clavinet, slap bass, brass riff, muted trumpet lead.
const { Song, n, chord } = require('./lib');
const s = new Song({ bpm: 112, seed: 99 });
const { BEAT } = s;
const GTR = 0, CLAV = 1, BASS = 2, BRASS = 3, TPT = 4, EP = 5, GLOCK = 6;
s.inst(GTR, 28, { vol: 86, pan: 30, rev: 25 });    // electric guitar (muted)
s.inst(CLAV, 7, { vol: 74, pan: 98, rev: 25 });    // clavinet
s.inst(BASS, 36, { vol: 104, pan: 64, rev: 5 });   // slap bass
s.inst(BRASS, 61, { vol: 92, pan: 70, rev: 45 });  // brass section
s.inst(TPT, 59, { vol: 96, pan: 56, rev: 50 });    // muted trumpet
s.inst(EP, 4, { vol: 78, pan: 64, rev: 50 });      // electric piano
s.inst(GLOCK, 9, { vol: 56, pan: 84, rev: 60 });
s.drums({ vol: 104, rev: 20 });

const A = ['D', 'Bm', 'G', 'A', 'D', 'Bm', 'G', 'A'];
const B = ['G', 'A', 'F#m', 'Bm', 'G', 'A', 'D', 'A'];
const sections = [['intro', ['D', 'Bm', 'G', 'A']], ['A', A], ['B', B], ['A2', A], ['end', ['D']]];
const bars = []; sections.forEach(([sec, cs]) => cs.forEach((c, i) => bars.push({ sec, i, c })));

const LEAD = [
  [['F#5', 0, .5], ['A5', .5, .5], ['F#5', 1.25, .25], ['E5', 1.5, .5], ['D5', 2, 1]],
  [['D5', 0, .5], ['F#5', .5, .5], ['D5', 1.25, .25], ['C#5', 1.5, .5], ['B4', 2, 1]],
  [['B4', 0, .5], ['D5', .5, .5], ['G5', 1, .5], ['F#5', 1.5, .5], ['E5', 2, .5], ['D5', 2.5, .5], ['B4', 3, .5]],
  [['C#5', 0, .5], ['E5', .5, .5], ['A5', 1, 1], ['G5', 2, .5], ['F#5', 2.5, .5], ['E5', 3, 1]],
  [['F#5', 0, .5], ['A5', .5, .5], ['F#5', 1.25, .25], ['E5', 1.5, .5], ['D5', 2, 1]],
  [['D5', 0, .5], ['F#5', .5, .5], ['D5', 1.25, .25], ['C#5', 1.5, .5], ['B4', 2, 1]],
  [['B4', 0, .5], ['D5', .5, .5], ['G5', 1, .5], ['A5', 1.5, .5], ['B5', 2, 1]],
  [['A5', 0, .5], ['G5', .5, .5], ['F#5', 1, .5], ['E5', 1.5, .5], ['A5', 2, 2]],
];
const play = (ch, mel, bar, vel, shift = 0, len = .85) => mel.forEach(([p, st, d]) => s.note(ch, n(p) + shift, s.t(bar, st) + s.hum(5), d * BEAT * len, vel + s.hum(5)));
const tones = (c, lo, hi) => { const ch = chord(c); const out = []; for (let p = lo; p <= hi; p++) if (ch.ivs.slice(0, 3).some((iv) => (ch.root + iv) % 12 === p % 12)) out.push(p); return out; };

bars.forEach(({ sec, i, c }, bar) => {
  const ch = chord(c), root = ch.root, t0 = s.t(bar), D = 9;
  const bass = 38 + ((root - 2 + 12) % 12) - ((root - 2 + 12) % 12 > 6 ? 12 : 0); // around D2
  if (sec === 'end') {
    const v = tones('D', 62, 78);
    v.forEach((p) => { s.note(BRASS, p, t0, BEAT * 2.5, 110); s.note(EP, p - 12, t0, BEAT * 4, 90); });
    s.note(BASS, bass, t0, BEAT * 3, 110); s.note(D, 49, t0, BEAT * 4, 110); s.note(D, 36, t0, BEAT, 120); s.note(D, 38, t0, BEAT, 100);
    s.note(GLOCK, 'A6', t0, BEAT * 3, 70); s.note(GLOCK, 'D7', t0 + 80, BEAT * 3, 70);
    return;
  }
  const full = sec !== 'intro';
  // guitar: 16th-note chops, accents on the "e" and "a" (funk), muted in between
  const gv = tones(c, 62, 74).slice(0, 3);
  const accents = [0, .75, 1.5, 2.25, 2.75, 3.5];
  for (let k = 0; k < 16; k++) {
    const st = k / 4, acc = accents.includes(st);
    gv.forEach((p, j) => s.note(GTR, p, s.t(bar, st) + j * 6 + s.hum(4), acc ? BEAT * .2 : BEAT * .08, acc ? 92 : 44 + s.hum(6)));
  }
  // clavinet offbeat stabs
  if (full) [0.5, 1.5, 2.5, 3.5].forEach((st) => tones(c, 55, 67).slice(0, 3).forEach((p) => s.note(CLAV, p, s.t(bar, st) + s.hum(4), BEAT * .18, 82)));
  // slap bass: syncopated with octave pops
  if (full) [[0, 0, 110, .4], [.75, 12, 90, .15], [1, 0, 80, .2], [1.5, 7, 88, .3], [2.5, 0, 100, .3], [3, 12, 96, .15], [3.25, 10, 70, .15], [3.5, 7, 86, .3]]
    .forEach(([st, iv, v, d]) => s.note(BASS, bass + iv, s.t(bar, st) + s.hum(3), BEAT * d, v + s.hum(4)));
  else if (i >= 2) s.note(BASS, bass, t0, BEAT * .5, 90);
  // EP pads under the A sections
  if (sec === 'A' || sec === 'A2') tones(c, 57, 69).slice(0, 3).forEach((p) => s.note(EP, p, t0 + s.hum(6), BEAT * 3.6, 64));
  // melodies
  if (sec === 'A') play(TPT, LEAD[i], bar, 96);
  if (sec === 'A2') { play(TPT, LEAD[i], bar, 102); play(GLOCK, LEAD[i], bar, 66, 12, .6); }
  if (sec === 'B') {
    // brass riff: punchy stabs with a fall-off at the end of each 2 bars
    const hits = i % 2 === 0 ? [[0, .35], [.75, .2], [1.5, .35], [2.5, .2], [3, .6]] : [[0, .35], [.75, .2], [1.5, .3], [2, .3], [2.5, 1.2]];
    hits.forEach(([st, d]) => tones(c, 62, 74).slice(0, 3).forEach((p) => s.note(BRASS, p, s.t(bar, st), BEAT * d, 104)));
    tones(c, 57, 69).slice(0, 3).forEach((p) => s.note(EP, p, t0, BEAT * 3.6, 70));
  }
  // drums
  const hat = full ? 16 : 8;
  for (let k = 0; k < hat; k++) { const st = k * 4 / hat; s.note(D, (full && st % 1 === .5 && k % 8 === 6) ? 46 : 42, s.t(bar, st) + s.hum(4), 60, (st % 1 === 0 ? 76 : st % .5 === 0 ? 62 : 44) + s.hum(6)); }
  if (!full) return;
  [[0, 112], [1.75, 80], [2.5, 96]].forEach(([st, v]) => s.note(D, 36, s.t(bar, st), BEAT / 2, v));
  [1, 3].forEach((b) => s.note(D, 38, s.t(bar, b), BEAT / 2, 100));
  [1.75, 3.75].forEach((b) => s.note(D, 38, s.t(bar, b), BEAT / 4, 36)); // ghost notes
  if (sec === 'B') [1, 3].forEach((b) => s.note(D, 39, s.t(bar, b) + 10, BEAT / 2, 80));
  if (i === 0) s.note(D, 49, t0, BEAT * 4, 96);
  if (i === 7) [3, 3.25, 3.5, 3.75].forEach((st, k) => s.note(D, [50, 48, 47, 45][k], s.t(bar, st), BEAT / 4, 90)); // tom fill
});
s.render('green-build', { lufs: -14, room: 0.4, level: 0.4, tail: 2.5 });
