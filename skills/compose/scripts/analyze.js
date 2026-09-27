#!/usr/bin/env node
// Quality check for a rendered track, since the model cannot listen.
// Usage: node analyze.js <audio file> [--window 10] [--png out.png]
// Reports: duration, integrated loudness, true peak, clipping, brightness (spectral centroid),
// short-term loudness per window (flags dropouts and jumps), and writes a spectrogram image to view.
const { spawnSync } = require('child_process');
const path = require('path');

const file = process.argv[2];
if (!file) { console.error('usage: node analyze.js <audio file> [--window seconds] [--png out.png]'); process.exit(1); }
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const ff = (args) => spawnSync('ffmpeg', ['-hide_banner', '-nostats', ...args], { maxBuffer: 1 << 30 }).stderr.toString();

const dur = parseFloat(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).stdout.toString());
const win = +arg('--window', dur > 900 ? 60 : 10);

// loudness: integrated, true peak, and short-term values over time
const log = ff(['-v', 'verbose', '-i', file, '-af', 'ebur128=framelog=verbose:peak=true', '-f', 'null', '-']);
const I = ((log.match(/I:\s+(-?[\d.]+) LUFS/g) || []).pop() || '').replace(/I:\s+/, '');
const TP = ((log.match(/Peak:\s+(-?[\d.]+) dBFS/g) || []).pop() || '').replace(/Peak:\s+/, '');
const per = {};
for (const m of log.matchAll(/t:\s*([\d.]+).*?S:\s*(-?[\d.]+|-inf)/g)) {
  const t = +m[1], S = m[2] === '-inf' ? -99 : +m[2];
  if (t < 3) continue; // meter warm-up
  (per[Math.floor(t / win)] ||= []).push(S);
}

// clipping: samples at full scale
const stats = spawnSync('sox', [file, '-n', 'stats'], { maxBuffer: 1 << 26 }).stderr.toString();
const clipped = (stats.match(/Flat factor\s+([\d.]+)/) || [])[1];
const pk = (stats.match(/Pk lev dB\s+(-?[\d.]+)/) || [])[1];

// brightness: mean spectral centroid (lower = darker/warmer)
const cent = [...ff(['-i', file, '-af', 'aspectralstats=measure=centroid,ametadata=print:key=lavfi.aspectralstats.1.centroid', '-f', 'null', '-']).matchAll(/centroid=([\d.]+)/g)].map((m) => +m[1]);
const centroid = cent.length ? cent.reduce((a, b) => a + b, 0) / cent.length : NaN;

// spectrogram image for a visual check of the arrangement
const png = arg('--png', path.join(path.dirname(file), path.basename(file, path.extname(file)) + '.spectrogram.png'));
ff(['-y', '-i', file, '-lavfi', 'showspectrumpic=s=1400x360:legend=1:scale=log', png]);

console.log(`file:        ${file}`);
console.log(`duration:    ${Math.floor(dur / 60)}:${String(Math.floor(dur % 60)).padStart(2, '0')}`);
console.log(`loudness:    ${I || 'n/a'} integrated   true peak: ${TP || 'n/a'}   sample peak: ${pk} dB`);
console.log(`clipping:    flat factor ${clipped} (0 = no runs of clipped samples)`);
console.log(`brightness:  spectral centroid ~${Math.round(centroid)} Hz (dreamy/dark ~600-900, balanced ~1200-1800, bright >2000)`);
console.log(`spectrogram: ${png}`);
console.log(`\nshort-term loudness per ${win}s window (LUFS): start  min  max  avg   flags`);
const avgs = [];
for (const [k, a] of Object.entries(per)) {
  const v = a.filter((x) => x > -99);
  if (!v.length) { console.log(`${String(k * win).padStart(6)}s  silent`); continue; }
  const min = Math.min(...v), max = Math.max(...v), avg = v.reduce((x, y) => x + y, 0) / v.length;
  const prev = avgs[avgs.length - 1];
  const flags = [min < avg - 15 ? 'DROPOUT?' : '', prev !== undefined && Math.abs(avg - prev) > 6 ? 'JUMP' : ''].filter(Boolean).join(' ');
  avgs.push(avg);
  console.log(`${String(k * win).padStart(6)}s  ${min.toFixed(1)}  ${max.toFixed(1)}  ${avg.toFixed(1)}   ${flags}`);
}
console.log('\n(first and last windows include fades; DROPOUT/JUMP elsewhere deserve a closer look)');
