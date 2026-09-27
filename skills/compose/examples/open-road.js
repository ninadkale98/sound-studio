// "Open Road": acoustic travel track in G major. Fingerpicked nylon intro, strummed steel guitars,
// whistled melody, glockenspiel, shaker/tambourine/claps, upright-style bass.
const { Song, n, chord, guitarShape } = require('./lib');
const s = new Song({ bpm: 108, seed: 42 });
const { BEAT } = s;

const PICK = 0, STRUM = 1, STRUM2 = 2, WHISTLE = 3, GLOCK = 4, BASS = 5, PAD = 6;
s.inst(PICK, 24, { vol: 100, pan: 52, rev: 45 });   // nylon guitar
s.inst(STRUM, 25, { vol: 92, pan: 36, rev: 40 });   // steel guitar, left
s.inst(STRUM2, 25, { vol: 84, pan: 94, rev: 40 });  // steel guitar double, right
s.inst(WHISTLE, 78, { vol: 88, pan: 64, rev: 70 }); // whistle
s.inst(GLOCK, 9, { vol: 64, pan: 76, rev: 70 });    // glockenspiel
s.inst(BASS, 32, { vol: 100, pan: 64, rev: 15 });   // acoustic bass
s.inst(PAD, 49, { vol: 70, pan: 64, rev: 80, expr: 0 }); // soft strings bed
s.drums({ vol: 100, rev: 35 });

// ---- form
const V = ['G', 'D', 'Em', 'C', 'G', 'D', 'C', 'D'];
const CHO = ['C', 'G', 'D', 'Em', 'C', 'G', 'D', 'D'];
const sections = [
  ['intro', ['G', 'D', 'Em', 'C']],
  ['verse', V], ['chorus', CHO],
  ['break', ['Em', 'C', 'G', 'D']],
  ['chorus2', CHO],
  ['outro', ['C', 'G', 'D', 'G']],
];
const bars = []; sections.forEach(([sec, chs]) => chs.forEach((c, i) => bars.push({ sec, c, i })));
const start = {}; bars.forEach((b, k) => { if (!(b.sec in start)) start[b.sec] = k; });
const LAST = bars.length - 1;

// ---- melodies  [pitch, startBeat, beats]
const VERSE_MEL = [
  [['B4', 0, .5], ['D5', .5, .5], ['D5', 1, 1], ['B4', 2, .5], ['A4', 2.5, .5], ['G4', 3, 1]],
  [['A4', 0, .5], ['F#4', .5, .5], ['A4', 1, 1.5], ['D5', 2.5, 1.5]],
  [['B4', 0, .5], ['G4', .5, .5], ['B4', 1, 1], ['E5', 2, 1], ['D5', 3, 1]],
  [['C5', 0, 1.5], ['B4', 1.5, .5], ['A4', 2, 2]],
  [['B4', 0, .5], ['D5', .5, .5], ['D5', 1, 1], ['B4', 2, .5], ['A4', 2.5, .5], ['G4', 3, 1]],
  [['A4', 0, .5], ['F#4', .5, .5], ['A4', 1, .5], ['B4', 1.5, .5], ['D5', 2, 2]],
  [['E5', 0, 1], ['D5', 1, .5], ['C5', 1.5, .5], ['B4', 2, 1], ['A4', 3, 1]],
  [['A4', 0, 1.5], ['B4', 1.5, .5], ['A4', 2, 2]],
];
const CHO_MEL = [
  [['E5', 0, 1], ['G5', 1, 1], ['E5', 2, .5], ['D5', 2.5, .5], ['C5', 3, 1]],
  [['D5', 0, 1.5], ['B4', 1.5, .5], ['D5', 2, 2]],
  [['F#5', 0, 1], ['A5', 1, 1], ['F#5', 2, .5], ['E5', 2.5, .5], ['D5', 3, 1]],
  [['E5', 0, 2], ['B4', 2, 1], ['D5', 3, 1]],
  [['E5', 0, 1], ['G5', 1, 1], ['E5', 2, .5], ['D5', 2.5, .5], ['C5', 3, 1]],
  [['D5', 0, 1], ['B4', 1, .5], ['D5', 1.5, .5], ['G5', 2, 2]],
  [['F#5', 0, .5], ['G5', .5, .5], ['A5', 1, 1], ['G5', 2, 1], ['F#5', 3, 1]],
  [['E5', 0, 1], ['F#5', 1, 1], ['D5', 2, 2]],
];
const playMel = (ch, mel, bar0, vel, shift = 0, humA = 8) => mel.forEach((notes, i) => notes.forEach(([p, st, d]) =>
  s.note(ch, n(p) + shift, s.t(bar0 + i, st) + s.hum(humA), d * BEAT - 20, vel + s.hum(5) + (st === 0 ? 5 : 0))));

playMel(WHISTLE, VERSE_MEL, start.verse, 84);
playMel(WHISTLE, CHO_MEL, start.chorus, 92);
playMel(GLOCK, CHO_MEL, start.chorus, 70, 12, 3);
playMel(WHISTLE, CHO_MEL, start.chorus2, 94);
playMel(GLOCK, CHO_MEL, start.chorus2, 74, 12, 3);
// break: nylon plays the first half of the verse melody an octave down-ish, whistle rests
playMel(PICK, VERSE_MEL.slice(0, 4), start.break, 84);

// ---- per-bar parts
bars.forEach(({ sec, c, i }, bar) => {
  const shape = guitarShape(c);
  const ch = chord(c);
  const root = ch.root;
  const t0 = s.t(bar);
  const full = sec === 'chorus' || sec === 'chorus2';
  const last = bar === LAST;

  // Fingerpicking (Travis): intro, verse (quiet under strums), break, outro
  if (['intro', 'verse', 'break', 'outro'].includes(sec) && !last) {
    const bassA = shape[0], bassB = shape[Math.min(2, shape.length - 1)] ;
    const top = shape.slice(-3);
    const pat = [[bassA, 0], [top[1], .5], [bassB, 1], [top[2], 1.5], [bassA, 2], [top[0], 2.5], [bassB, 3], [top[2], 3.5]];
    const base = sec === 'verse' ? 52 : sec === 'break' ? 50 : 70;
    pat.forEach(([p, st], k) => s.note(PICK, p, s.t(bar, st) + s.hum(10), BEAT * 1.5, base + (k % 2 ? -8 : 4) + s.hum(5)));
  }

  // Strumming: verse (muted-ish, short), chorus (open, ringing), outro
  if (['verse', 'chorus', 'chorus2', 'outro'].includes(sec) && !last) {
    // D . D U . U D U
    const pattern = [[0, 'down', 1], [1, 'down', .8], [1.5, 'up', .6], [2.5, 'up', .7], [3, 'down', .85], [3.5, 'up', .6]];
    const ring = full ? BEAT * 1.0 : BEAT * 0.45;
    const vel = full ? 96 : sec === 'outro' ? 80 : 74;
    pattern.forEach(([st, dir, acc]) => {
      s.strum(STRUM, shape, s.t(bar, st) + s.hum(8), ring, vel * acc, { dir, spread: dir === 'down' ? 16 : 11 });
      if (full) s.strum(STRUM2, shape.map((p) => p), s.t(bar, st) + 9 + s.hum(8), ring, vel * acc * 0.9, { dir, spread: dir === 'down' ? 13 : 10 });
    });
  }
  if (last) {
    s.strum(STRUM, shape, t0, BEAT * 8, 100, { spread: 45 });
    s.strum(STRUM2, shape, t0 + 20, BEAT * 8, 90, { spread: 52 });
    s.strum(PICK, shape, t0 + 10, BEAT * 8, 80, { spread: 60 });
    s.note(BASS, root + 36, t0, BEAT * 6, 100);
    s.note(GLOCK, 'G6', t0 + 240, BEAT * 4, 70); s.note(GLOCK, 'D6', t0 + 120, BEAT * 4, 60); s.note(GLOCK, 'B6', t0 + 360, BEAT * 4, 60);
    return;
  }

  // Bass: root on 1, fifth on 3, walk into the next chord
  if (sec !== 'intro' && sec !== 'break') {
    const r = 40 + ((root - 4 + 12) % 12); // E2..D#3 range
    const next = bars[bar + 1] ? chord(bars[bar + 1].c).root : root;
    const nr = 40 + ((next - 4 + 12) % 12);
    s.note(BASS, r, t0 + s.hum(4), BEAT * 1.4, 100);
    s.note(BASS, r + 7, s.t(bar, 2) + s.hum(4), BEAT * 0.9, 88);
    s.note(BASS, nr + (nr > r ? -1 : 1), s.t(bar, 3.5) + s.hum(4), BEAT * 0.45, 80);
    if (full) s.note(BASS, r, s.t(bar, 1.5), BEAT * 0.4, 76);
  }
  if (sec === 'break') s.note(BASS, 40 + ((root - 4 + 12) % 12), t0, BEAT * 3.5, 84);

  // String bed under choruses
  if (full || sec === 'break') {
    const oct = full ? 60 : 55;
    const pcs = ch.ivs.slice(0, 3).map((iv) => (root + iv) % 12);
    pcs.forEach((pc) => { let p = oct - (oct % 12) + pc; if (p < oct - 2) p += 12; s.note(PAD, p, t0, s.BAR, 80); });
  }

  // Percussion
  const D = 9;
  const shaker = sec !== 'intro';
  if (shaker) for (let k = 0; k < 16; k++) s.note(D, 82, s.t(bar, k / 4) + s.hum(6), 60, (k % 4 === 2 ? 70 : k % 2 ? 42 : 55) + s.hum(6) - (sec === 'break' ? 15 : 0));
  if (sec === 'verse' || sec === 'outro') {
    s.note(D, 36, t0, BEAT, 84); s.note(D, 36, s.t(bar, 2.5), BEAT / 2, 66);
    s.note(D, 37, s.t(bar, 1), BEAT / 2, 66 + s.hum(4)); s.note(D, 37, s.t(bar, 3), BEAT / 2, 70 + s.hum(4));
  }
  if (full) {
    s.note(D, 36, t0, BEAT, 100); s.note(D, 36, s.t(bar, 1.5), BEAT / 2, 70); s.note(D, 36, s.t(bar, 2.5), BEAT / 2, 86);
    [1, 3].forEach((b) => { s.note(D, 39, s.t(bar, b) + s.hum(5), BEAT / 2, 86 + s.hum(5)); s.note(D, 39, s.t(bar, b) + 14, BEAT / 2, 60); s.note(D, 38, s.t(bar, b), BEAT / 2, 58); });
    for (let k = 0; k < 4; k++) s.note(D, 54, s.t(bar, k + .5) + s.hum(5), BEAT / 2, 62 + s.hum(6));
    if (i === 0) s.note(D, 49, t0, BEAT * 4, i === 0 && sec === 'chorus' ? 88 : 80);
  }
  if (sec === 'break' && i === 3) for (let k = 0; k < 4; k++) s.note(D, 39, s.t(bar, 2 + k * .5), BEAT / 2, 60 + k * 10); // clap pickup
});

s.ramp(PAD, 11, s.t(start.chorus), s.t(start.chorus + 1), 0, 80);
s.ramp(PAD, 11, s.t(start.break), s.t(start.break) + 60, 80, 55, 4);
s.ramp(PAD, 11, s.t(start.chorus2), s.t(start.chorus2 + 1), 55, 92);
s.ramp(PAD, 11, s.t(start.outro), s.t(start.outro + 1), 92, 0);
// gentle ritardando into the last chord
for (let k = 0; k <= 4; k++) s.setTempo(s.t(LAST - 1, k), 108 - k * 4);

s.render('open-road', { lufs: -14, room: 0.55, level: 0.5, tail: 3.5 });
