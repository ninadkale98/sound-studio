// Tiny composition engine: note helpers, chord voicings, humanizing, SMF writer, FluidSynth render + mastering.
const fs = require('fs');
const { execFileSync } = require('child_process');
const path = require('path');

const PPQ = 480;
// instrument library (GM SoundFont); override with the SOUNDFONT environment variable
const SF2 = process.env.SOUNDFONT || path.join(process.env.HOME, 'soundfonts/GeneralUser-GS.sf2');
const NAMES = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
const n = (s) => { if (typeof s === 'number') return s; const m = s.match(/^([A-G][#b]?)(-?\d)$/); return 12 * (+m[2] + 1) + NAMES[m[1]]; };
const QUAL = { '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], sus4: [0, 5, 7], sus2: [0, 2, 7], add9: [0, 4, 7, 14], 6: [0, 4, 7, 9], m6: [0, 3, 7, 9] };
// "F#m7" -> { root: 6, ivs: [0,3,7,10] }; optional slash bass "C/E"
function chord(name) {
  const [main, slash] = name.split('/');
  const m = main.match(/^([A-G][#b]?)(.*)$/);
  return { root: NAMES[m[1]], ivs: QUAL[m[2]], bass: slash ? NAMES[slash] : NAMES[m[1]] };
}
// pitch of pitch-class pc at or above midi note `floor`
const above = (pc, floor) => { let p = floor - ((floor % 12) - pc + 12) % 12; if (p < floor) p += 12; return p; };
// close voicing of chord starting at/above `floor`
const voicing = (name, floor, count) => {
  const c = chord(name); const pcs = c.ivs.map((i) => (c.root + i) % 12);
  const out = []; let f = floor; let k = 0;
  while (out.length < (count || pcs.length)) { const p = above(pcs[k % pcs.length], f); out.push(p); f = p + 1; k++; }
  return out;
};

// Real open-position guitar shapes (low → high string), fallback to generated voicing.
const GTR = {
  G: ['G2', 'B2', 'D3', 'G3', 'B3', 'G4'], C: ['C3', 'E3', 'G3', 'C4', 'E4'], D: ['D3', 'A3', 'D4', 'F#4'],
  Em: ['E2', 'B2', 'E3', 'G3', 'B3', 'E4'], Am: ['A2', 'E3', 'A3', 'C4', 'E4'], 'D/F#': ['F#2', 'A2', 'D3', 'A3', 'D4', 'F#4'],
  Cadd9: ['C3', 'E3', 'G3', 'D4', 'G4'], Dsus4: ['D3', 'A3', 'D4', 'G4'], E: ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4'],
  A: ['A2', 'E3', 'A3', 'C#4', 'E4'], F: ['F2', 'C3', 'F3', 'A3', 'C4', 'F4'], Bm: ['B2', 'F#3', 'B3', 'D4', 'F#4'],
  'G/B': ['B2', 'D3', 'G3', 'B3', 'G4'], Em7: ['E2', 'B2', 'E3', 'G3', 'D4', 'E4'],
};
const guitarShape = (name) => (GTR[name] || voicing(name, n('E2'), 5)).map(n);

class Song {
  constructor({ bpm = 120, seed = 1, beatsPerBar = 4 } = {}) {
    this.ev = {}; this.notes = []; this.tempo = [[0, bpm]]; this.bpb = beatsPerBar; this.seed = seed;
    this.BEAT = PPQ; this.BAR = PPQ * beatsPerBar;
  }
  rnd() { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; return this.seed / 4294967296; }
  hum(a) { return Math.round((this.rnd() * 2 - 1) * a); }
  t(bar, beat = 0) { return Math.round(bar * this.BAR + beat * this.BEAT); }
  push(ch, t, bytes) { (this.ev[ch] ||= []).push({ t: Math.max(0, Math.round(t)), bytes }); }
  inst(ch, program, { vol = 100, pan = 64, rev = 50, cho = 0, expr = 127 } = {}) {
    this.push(ch, 0, [0xC0 | ch, program]); this.cc(ch, 0, 7, vol); this.cc(ch, 0, 10, pan); this.cc(ch, 0, 91, rev); this.cc(ch, 0, 93, cho); this.cc(ch, 0, 11, expr);
  }
  drums({ vol = 100, rev = 30, kit = 0 } = {}) { this.push(9, 0, [0xC9, kit]); this.cc(9, 0, 7, vol); this.cc(9, 0, 91, rev); }
  cc(ch, t, c, v) { this.push(ch, t, [0xB0 | ch, c, Math.max(0, Math.min(127, Math.round(v)))]); }
  ramp(ch, c, t0, t1, v0, v1, steps = 24) { for (let i = 0; i <= steps; i++) this.cc(ch, t0 + (t1 - t0) * i / steps, c, v0 + (v1 - v0) * i / steps); }
  note(ch, pitch, t, dur, vel) { this.notes.push({ ch, p: n(pitch), t: Math.max(0, Math.round(t)), d: Math.max(20, Math.round(dur)), v: Math.max(1, Math.min(127, Math.round(vel))) }); }
  // strum a list of pitches: down = low→high, up = high→low (fewer strings)
  strum(ch, pitches, t, dur, vel, { dir = 'down', spread = 14, strings } = {}) {
    let ps = [...pitches]; if (dir === 'up') ps = ps.slice(-(strings || 4)).reverse();
    ps.forEach((p, i) => this.note(ch, p, t + i * spread + this.hum(3), dur - i * spread, vel * (dir === 'down' ? 1 - i * 0.03 : 0.85 - i * 0.05) + this.hum(4)));
  }
  setTempo(t, bpm) { this.tempo.push([t, bpm]); }
  // pitch bend in semitones (channel must have its bend range set with bendRange)
  bendRange(ch, semis) { this.range = this.range || {}; this.range[ch] = semis; [[101, 0], [100, 0], [6, semis], [38, 0], [101, 127], [100, 127]].forEach(([c, v]) => this.cc(ch, 0, c, v)); }
  bend(ch, t, semis) { const r = (this.range && this.range[ch]) || 2; const v = Math.max(0, Math.min(16383, Math.round(8192 + semis / r * 8192))); this.push(ch, t, [0xE0 | ch, v & 127, v >> 7]); }
  ticksPerSec(t) { let bpm = this.tempo[0][1]; for (const [tt, b] of this.tempo) if (tt <= t) bpm = b; return PPQ * bpm / 60; }
  lengthSec() {
    const lastTick = Math.max(...this.notes.map((x) => x.t + x.d));
    let sec = 0, prevT = 0, bpm = this.tempo[0][1];
    for (const [t, b] of [...this.tempo].sort((a, b) => a[0] - b[0])) { if (t > lastTick) break; sec += (t - prevT) / PPQ * 60 / bpm; prevT = t; bpm = b; }
    return sec + (lastTick - prevT) / PPQ * 60 / bpm;
  }
  write(file, chs = null) {
    const keep = (c) => !chs || chs.includes(+c);
    const saved = this.ev; this.ev = {}; for (const c of Object.keys(saved)) if (keep(c)) this.ev[c] = saved[c].map((e) => ({ ...e }));
    try { this._write(file, this.notes.filter((x) => keep(x.ch)).map((x) => ({ ...x }))); } finally { this.ev = saved; }
  }
  _write(file, notes) {
    // trim overlapping notes of the same pitch/channel so a release never cuts a new attack
    const byKey = {};
    for (const x of notes) (byKey[x.ch + ':' + x.p] ||= []).push(x);
    for (const list of Object.values(byKey)) { list.sort((a, b) => a.t - b.t); for (let i = 0; i < list.length - 1; i++) { const gap = list[i + 1].t - list[i].t; if (list[i].d > gap - 6) list[i].d = Math.max(10, gap - 6); } }
    for (const x of notes) { this.push(x.ch, x.t, [0x90 | x.ch, x.p, x.v]); this.push(x.ch, x.t + x.d, [0x80 | x.ch, x.p, 0]); }
    const vlq = (v) => { const b = [v & 0x7f]; while ((v >>= 7)) b.unshift((v & 0x7f) | 0x80); return b; };
    const chunk = (id, d) => Buffer.concat([Buffer.from(id), Buffer.from([(d.length >>> 24) & 255, (d.length >>> 16) & 255, (d.length >>> 8) & 255, d.length & 255]), Buffer.from(d)]);
    const order = (b) => (b[0] === 0xff ? 0 : (b[0] & 0xf0) === 0xC0 ? 1 : (b[0] & 0xf0) === 0xB0 || (b[0] & 0xf0) === 0xE0 ? 2 : (b[0] & 0xf0) === 0x80 ? 3 : 4);
    const track = (events) => { events.sort((a, b) => a.t - b.t || order(a.bytes) - order(b.bytes)); let last = 0; const out = []; for (const e of events) { out.push(...vlq(e.t - last), ...e.bytes); last = e.t; } out.push(0, 0xff, 0x2f, 0); return out; };
    const meta = this.tempo.map(([t, bpm]) => { const us = Math.round(60e6 / bpm); return { t, bytes: [0xff, 0x51, 3, (us >> 16) & 255, (us >> 8) & 255, us & 255] }; });
    meta.push({ t: 0, bytes: [0xff, 0x58, 4, this.bpb, 2, 24, 8] });
    const all = [track(meta), ...Object.keys(this.ev).map((c) => track(this.ev[c]))];
    fs.writeFileSync(file, Buffer.concat([chunk('MThd', [0, 1, 0, all.length, PPQ >> 8, PPQ & 255]), ...all.map((d) => chunk('MTrk', d))]));
  }
  // render with FluidSynth, then two-pass loudness-normalize to `lufs` and export wav + mp3
  render(name, { lufs = -14, room = 0.6, level = 0.55, tail = 3, gain = 0.5 } = {}) {
    const dir = __dirname, mid = path.join(dir, name + '.mid'), raw = path.join(dir, name + '.raw.wav');
    this.write(mid);
    execFileSync('fluidsynth', ['-ni', '-q', '-F', raw, '-r', '44100', '-g', String(gain), '-o', `synth.reverb.room-size=${room}`, '-o', 'synth.reverb.damp=0.4', '-o', 'synth.reverb.width=0.9', '-o', `synth.reverb.level=${level}`, '-o', 'synth.chorus.active=0', SF2, mid]);
    const sec = this.lengthSec();
    const end = (sec + tail).toFixed(2), fadeSt = (sec + tail - 1.5).toFixed(2);
    const pre = `atrim=0:${end},afade=t=out:st=${fadeSt}:d=1.5,highpass=f=30`;
    let js; try { js = JSON.parse(require('child_process').spawnSync('ffmpeg', ['-hide_banner', '-i', raw, '-af', `${pre},loudnorm=I=${lufs}:TP=-1.5:LRA=11:print_format=json`, '-f', 'null', '-']).stderr.toString().match(/\{[\s\S]*\}/)[0]); } catch (e) { js = null; }
    const ln = js ? `loudnorm=I=${lufs}:TP=-1.5:LRA=11:measured_I=${js.input_i}:measured_TP=${js.input_tp}:measured_LRA=${js.input_lra}:measured_thresh=${js.input_thresh}:offset=${js.target_offset}:linear=true` : `loudnorm=I=${lufs}:TP=-1.5`;
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-af', `${pre},${ln},alimiter=limit=0.89:level=false`, '-ar', '44100', path.join(dir, name + '.wav')]);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(dir, name + '.wav'), '-c:a', 'libmp3lame', '-b:a', '256k', path.join(dir, name + '.mp3')]);
    fs.unlinkSync(raw);
    console.log(`${name}: ${end}s`);
  }
}

module.exports = { Song, n, chord, voicing, above, guitarShape, NAMES, SF2 };
