// Production helpers: expressive guitar lines, stem rendering with per-stem effects chains, mixing, mastering.
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const { n, SF2 } = require('./lib');

const WORK = path.join(__dirname, 'stems');

// Expressive monophonic guitar line.
// phrase: [[pitch, startBeat, beats, opts], ...] per bar, opts:
//   b: bend up (semitones) after bt beats over bd beats   pb: pre-bent, then released
//   r: release the bend back down at the end               sl: slide in from sl semitones below
//   v: vibrato depth (semitones, peak-to-peak)             vel: velocity
function guitarLine(s, ch, bars, bar0, { vel = 100, rate = 5.4, bendRange = 3 } = {}) {
  s.bendRange(ch, bendRange);
  const evs = [];
  bars.forEach((notes, i) => (notes || []).forEach(([p, st, d, o = {}]) => evs.push({ p: n(p), t: s.t(bar0 + i, st), d: Math.round(d * s.BEAT), o })));
  evs.sort((a, b) => a.t - b.t);
  const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 2);
  evs.forEach((e, k) => {
    const next = evs[k + 1];
    const dur = next ? Math.min(e.d, next.t - e.t) - 4 : e.d;
    const { b = 0, bt = 0.06, bd = 0.32, pb = 0, r = false, sl = 0, v = 0 } = e.o;
    const B = s.BEAT, tps = s.ticksPerSec(e.t);
    const bendStart = bt * B, bendEnd = (bt + bd) * B;
    const relStart = pb ? 0.25 * B : dur * 0.62, relLen = pb ? 0.3 * B : dur * 0.3;
    const vibOn = Math.max(b ? bendEnd + 0.1 * B : 0, Math.min(dur * 0.3, 0.35 * tps));
    const curve = (x) => {
      let y = 0;
      if (sl) y = -sl * (1 - ease(x / (0.14 * B)));
      if (pb) y = pb * (1 - ease((x - relStart) / relLen));
      else if (b) { y = b * ease((x - bendStart) / (bendEnd - bendStart)); if (r) y = b * (1 - ease((x - relStart) / relLen)) * (x < relStart ? ease((x - bendStart) / (bendEnd - bendStart)) : 1); }
      if (v && x > vibOn) {
        const depth = v * Math.min(1, (x - vibOn) / (0.45 * tps));
        const ph = 2 * Math.PI * rate * (x - vibOn) / tps;
        y += b && !r ? -depth * (1 - Math.cos(ph)) / 2 : depth / 2 * Math.sin(ph); // bent notes wobble below the target, like a real bend
      }
      return y;
    };
    for (let x = 0; x <= dur; x += 12) s.bend(ch, e.t + x, curve(x));
    s.note(ch, e.p, e.t, dur, (e.o.vel || vel) + s.hum(5) + (e.o.b || e.o.pb ? 4 : 0));
    if (!next || next.t - (e.t + dur) > 30) s.bend(ch, e.t + dur + 2, 0);
  });
}

const lufsOf = (file) => { const out = spawnSync('ffmpeg', ['-hide_banner', '-i', file, '-af', 'ebur128=framelog=quiet', '-f', 'null', '-']).stderr.toString(); const m = out.match(/I:\s+(-?[\d.]+) LUFS/g); return m ? parseFloat(m[m.length - 1].match(/-?[\d.]+/)[0]) : -70; };

// Render stems -> effects -> loudness-matched mix -> master.
// stems: { name: { chs:[..], fx:'sox effect args', lufs: target, fsReverb: bool } }
function produce(s, name, stems, { lufs = -14, tail = 6, keep = [], post = '' } = {}) {
  fs.mkdirSync(WORK, { recursive: true });
  const parts = [];
  for (const [stem, cfg] of Object.entries(stems)) {
    const mid = path.join(WORK, `${name}.${stem}.mid`), dry = path.join(WORK, `${name}.${stem}.dry.wav`), wet = path.join(WORK, `${name}.${stem}.wav`);
    s.write(mid, cfg.chs);
    const rev = cfg.fsReverb ? ['-o', 'synth.reverb.active=1', '-o', 'synth.reverb.room-size=0.6', '-o', 'synth.reverb.level=0.5', '-o', 'synth.reverb.width=0.9'] : ['-o', 'synth.reverb.active=0'];
    execFileSync('fluidsynth', ['-ni', '-q', '-F', dry, '-r', '44100', '-g', '0.6', ...rev, '-o', 'synth.chorus.active=0', SF2, mid]);
    execFileSync('sox', [dry, '-b', '24', wet, 'pad', '0', String(tail), ...(cfg.fx ? cfg.fx.split(/\s+/) : [])]);
    const gain = 0.25 * Math.pow(10, (cfg.lufs - lufsOf(wet)) / 20); // -12 dB mix headroom, normalized after
    parts.push('-v', gain.toFixed(4), wet);
  }
  const mix = path.join(WORK, `${name}.mix.wav`);
  execFileSync('sox', ['-G', '-m', ...parts, '-b', '24', mix, 'gain', '-n', '-3']);
  const end = (s.lengthSec() + tail).toFixed(2), fade = (s.lengthSec() + tail - 2.5).toFixed(2);
  const pre = `atrim=0:${end},afade=t=out:st=${fade}:d=2.5,highpass=f=30${post ? ',' + post : ''}`;
  const js = JSON.parse(spawnSync('ffmpeg', ['-hide_banner', '-i', mix, '-af', `${pre},loudnorm=I=${lufs}:TP=-1.5:LRA=11:print_format=json`, '-f', 'null', '-']).stderr.toString().match(/\{[\s\S]*\}/)[0]);
  const ln = `loudnorm=I=${lufs}:TP=-1.5:LRA=11:measured_I=${js.input_i}:measured_TP=${js.input_tp}:measured_LRA=${js.input_lra}:measured_thresh=${js.input_thresh}:offset=${js.target_offset}:linear=true`;
  const outWav = path.join(__dirname, name + '.wav');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', mix, '-af', `${pre},${ln},alimiter=limit=0.89:level=false`, '-ar', '44100', outWav]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', outWav, '-c:a', 'libmp3lame', '-b:a', '256k', path.join(__dirname, name + '.mp3')]);
  // optional: export individual stems (dry and wet) as showcase files
  for (const [stem, label] of keep) for (const kind of ['dry', 'wet']) {
    const src = path.join(WORK, `${name}.${stem}${kind === 'dry' ? '.dry' : ''}.wav`);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-af', `atrim=0:${end},afade=t=out:st=${fade}:d=2.5,loudnorm=I=-16:TP=-1.5`, '-c:a', 'libmp3lame', '-b:a', '256k', path.join(__dirname, `${label}-${kind === 'dry' ? 'dry' : 'with-effects'}.mp3`)]);
  }
  console.log(`${name}: ${end}s, final ${lufsOf(outWav).toFixed(1)} LUFS`);
}

// Tempo-synced effect chains (sox syntax)
const beatMs = (bpm) => 60000 / bpm;
const FX = {
  // singing lead: compress for sustain, a touch more drive, mid focus, dotted-8th + quarter delays, big hall
  lead: (bpm) => `gain -10 compand 0.005,0.3 6:-70,-60,-40,-22,-20,-14,0,-8 -4 -90 0.1 overdrive 4 12 highpass 110 lowpass 6800 equalizer 900 1q 2.5 equalizer 2800 1.2q -2 echos 0.85 0.55 ${(beatMs(bpm) * 0.75).toFixed(0)} 0.32 ${(beatMs(bpm) * 1.5).toFixed(0)} 0.2 ${(beatMs(bpm) * 2.25).toFixed(0)} 0.11 reverb 72 45 100 100 30 -1`,
  // shimmering clean: chorus, dotted-8th delay, lush reverb
  clean: (bpm) => `gain -3 compand 0.003,0.2 6:-70,-60,-30,-20,0,-10 -3 -90 0.05 highpass 150 equalizer 3500 1q 2 chorus 0.7 0.6 55 0.4 0.25 2 -t 60 0.32 0.4 2.3 -t echos 0.8 0.5 ${(beatMs(bpm) * 0.75).toFixed(0)} 0.38 ${(beatMs(bpm) * 1.5).toFixed(0)} 0.22 reverb 65 40 100 100 20 -2`,
  // ambient volume swells: huge wash
  swell: (bpm) => `gain -10 highpass 150 chorus 0.6 0.6 50 0.4 0.25 2 -t echos 0.8 0.45 ${(beatMs(bpm) * 0.75).toFixed(0)} 0.45 ${(beatMs(bpm) * 1.5).toFixed(0)} 0.35 ${(beatMs(bpm) * 3).toFixed(0)} 0.25 reverb 95 30 100 100 40 0`,
  // dreamy rhythm guitar: light amp breakup, wide chorus, soft tape-style echo (darkened), big hall
  dreamRhythm: (bpm) => `gain -6 overdrive 3 8 highpass 110 lowpass 5200 chorus 0.7 0.6 55 0.4 0.25 2 -t 70 0.3 0.3 1.8 -t echos 0.8 0.5 ${(beatMs(bpm) * 0.75).toFixed(0)} 0.3 ${(beatMs(bpm) * 1.5).toFixed(0)} 0.16 lowpass 6500 reverb 85 50 100 100 25 -1`,
  // warm tube-amp lead: sustain, gentle grit, dark top end, slight echo, concert-hall reverb
  warmLead: (bpm) => `gain -8 compand 0.005,0.3 6:-70,-60,-40,-24,-20,-15,0,-9 -3 -90 0.1 overdrive 7 6 highpass 140 lowpass 4600 equalizer 700 1q 2 echos 0.85 0.6 ${(beatMs(bpm) * 0.75).toFixed(0)} 0.26 ${(beatMs(bpm) * 1.5).toFixed(0)} 0.12 reverb 82 45 100 100 35 -1`,
  // Cigarettes-After-Sex-style chains (researched: neck pickup + tone rolled off, Ampeg SVT / Twin at low gain,
  // JC-120 stereo chorus, Big Muff for grit, Memory Man ~600 ms single repeat, Neunaber Wet reverb). Used as a parallel pair.
  casBody: (delayMs = 600) => `gain -8 compand 0.01,0.3 6:-70,-60,-40,-26,-20,-16,0,-10 -3 -90 0.1 overdrive 4 20 highpass 80 lowpass 2900 equalizer 220 1q 3 equalizer 2400 1.2q -4 chorus 0.6 0.6 45 0.5 0.3 2 -t 55 0.35 0.45 2.2 -t echos 0.8 0.55 ${delayMs} 0.3 lowpass 3600 reverb 90 65 100 100 30 0`,
  casFuzz: (delayMs = 600) => `gain -4 overdrive 28 35 gain -8 highpass 160 lowpass 2500 equalizer 850 1.1q -6 compand 0.005,0.2 6:-70,-60,-30,-22,0,-12 -3 -90 0.05 echos 0.8 0.55 ${delayMs} 0.3 lowpass 3000 reverb 90 65 100 100 30 0`,
  // rhythm distortion: tight low end, scooped mids, small room
  crunch: () => `gain -8 highpass 90 lowpass 7500 equalizer 400 1q -3 equalizer 2200 1q 2 compand 0.003,0.15 6:-60,-40,-20,-14,0,-8 -3 -90 0.05 reverb 30 50 60 100 5 -6`,
};

module.exports = { guitarLine, produce, FX, lufsOf };
