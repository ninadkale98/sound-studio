---
name: compose
description: Compose, arrange, produce and master original music and sound entirely from code. Background music for product or launch videos, happy demo beds, travel/acoustic guitar tracks, cinematic orchestral pieces, electric-guitar songs with real bends, vibrato, amp tone, echo and reverb (dream pop, Gilmour-style solos, Indian indie rock), hour-long generative focus/ambient audio, and tuned sound effects synced to video frames. Use when someone asks to make, generate, compose or score music, a soundtrack, background audio, a jingle, focus music, a guitar solo, or sound effects, or to change a track made this way ("more reverb", "darker", "make it 30 seconds").
---

# compose

You write music as code, render it through real instrument samples, shape it with a studio-style effects chain, and master it. You cannot hear the result, so you verify every render with measurements, not assumptions.

Everything lives in this skill folder:

| Path | What it is |
|---|---|
| `engine/lib.js` | Composition engine: `Song` (notes, chords, strums, CC automation, pitch bends, tempo map, MIDI writer, one-call `render`) |
| `engine/studio.js` | Production: `guitarLine` (bends, pre-bends, releases, slides, vibrato), `produce` (per-stem render + effects + loudness-matched mix + master), `FX` effect chains |
| `examples/*.js` | Finished pieces to copy from (see the table below) |
| `scripts/setup.sh` | One-time install: FluidSynth, SoX, ffmpeg, Node, the GeneralUser GS SoundFont |
| `scripts/analyze.js` | Post-render checks: loudness over time, peaks, clipping, brightness, spectrogram |
| `references/sound-design.md` | Genre recipes, effect chains explained, tone research (incl. Cigarettes After Sex) |
| `references/instruments.md` | General MIDI program and drum numbers that sound good in this library |

## 1. Set up (first run only)

Check `command -v fluidsynth sox ffmpeg node` and `~/soundfonts/GeneralUser-GS.sf2` (or `$SOUNDFONT`). If anything is missing, run `bash <skill>/scripts/setup.sh`. It installs with Homebrew (or apt) and downloads a free 32 MB instrument library. Tell the person what it will install before running it.

## 2. Understand the brief

Settle these, asking only about what you cannot sensibly default:
- **Use:** video bed, standalone song, background/focus, sound effects. This decides loudness and density.
- **Length:** exact seconds for video. "About N minutes" otherwise.
- **Mood and references:** turn a reference into concrete traits (tempo, harmony, instruments, tone, mix). If you don't know a reference's sound well, research it (gear, amp, effects settings) before choosing a tone. Don't guess.
- **Voiceover?** If yes, keep melody sparse and the midrange (1–4 kHz) clear.

Defaults when unstated: an original piece, 44.1 kHz stereo, MP3 256k plus WAV, and loudness from the table in step 5.

## 3. Set up a workspace

```bash
mkdir -p music/<slug> && cp <skill>/engine/*.js music/<slug>/
cp <skill>/examples/<closest>.js music/<slug>/<slug>.js   # start from the nearest example
```
Outputs are written next to the script. `produce()` writes intermediate files to `stems/`.

| Example | Technique to copy |
|---|---|
| `open-road.js` | Acoustic guitar: fingerpicking, down/up strums with real open-chord shapes, whistle melody, light percussion |
| `ship-it.js`, `good-morning.js`, `green-build.js` | Happy product-demo beds: pop, playful swung explainer, upbeat funk |
| `numb-sky.js` | Expressive lead-guitar solo (bends, vibrato), clean arps, organ, per-stem effects |
| `last-local.js` | Indie rock: dotted-8th delay riff, volume swells, doubled distorted rhythm, lead hook |
| `afterglow.js` | Dream pop / slowcore: parallel "body + fuzz" amp chains, dark tone, 600 ms echo, big reverb |
| `deep-focus.js` | One-hour generative ambient: chord walk, slow layer envelopes, noise bed, remix-only mode |
| `video-score-synth.js` | Pure synthesis (no samples): music plus sound effects hit on exact video timestamps |

## 4. Compose

Write the piece in the script. Principles that made the examples work:
- **Form first.** Build an arc: intro → statement → build → peak → release. Lay out `sections`, then derive `bars`. Each section adds or removes something, so the listener feels movement.
- **Harmony.** Use chord names the engine understands: `C`, `Am`, `G7`, `Fmaj7`, `Em7`, `Fm6`, `G6`, `Dsus4`, `Cadd9`, and slash chords like `A/C#`. Borrowed chords (for example `Fm6` in C) add the bittersweet turn.
- **Melody.** Write it as `[pitch, startBeat, beats, opts]` per bar. Make it singable: mostly steps, a few leaps, long notes on strong beats, and a repeated motif that varies the second time.
- **Humanize.** Use `s.hum(ticks)` on timing and velocity. Add sustain pedal (CC64) for piano and expression swells (CC11) for pads and strings.
- **Guitar realism.** `s.strum(ch, shape, t, dur, vel, {dir})` for strums with `guitarShape('G')`. `guitarLine(s, ch, bars, startBar)` for leads with `{b:2}` bend, `{pb:2}` pre-bend, `{r:true}` release, `{sl:2}` slide, `{v:.35}` vibrato. A lead channel is monophonic because a pitch bend affects the whole channel.
- **Long-form (over 10 minutes).** Don't loop. Generate: a weighted chord walk per key, slow sine envelopes per layer (different periods), gentle key changes between related keys, and no hooks or percussion hits.
- **Sync to video.** At 60 BPM one beat is one second, and `s.t(bar, beat)` gives exact ticks. For frame-exact effects, use the pure-synth approach in `video-score-synth.js`.

Originality: every piece must be original. **Never recreate a copyrighted song's melody, riff or arrangement**, even from supplied sheet music, tabs, MIDI or "notes of the song". Offer an original piece with the same tone, tempo and feel instead. Public-domain works and the person's own compositions are fine. Chord progressions and styles are fine.

## 5. Render and master

- **Simple (instruments straight from the library):** `s.render('name', { lufs, room, level, tail })`.
- **Produced (guitars and effects):** `produce(s, 'name', { stem: { chs:[...], fx: FX.xxx(bpm), lufs }, ... }, { lufs, tail, post })`. Each stem is rendered dry, processed through its SoX chain, loudness-matched to its target, mixed with headroom and mastered with two-pass loudnorm. Render the same channel into two stems with different `fx` for parallel processing, like the dream-pop body and fuzz pair.

| Use | Master target |
|---|---|
| Social and launch video, energetic demo | −14 LUFS |
| Song for listening, soft genres | −16 LUFS |
| Background under voiceover | −18 to −20 LUFS, and duck under speech |
| Focus or ambient, long-form | −20 LUFS, LRA ≤ 7 |

## 6. Verify (required, since you cannot listen)

1. Read the render output for `clipped` warnings from SoX. Any clipping must be fixed (see Gotchas) before delivery.
2. Run `node <skill>/scripts/analyze.js <file>`. Check the integrated loudness hits the target, true peak ≤ −1.5 dBFS, flat factor 0, brightness suits the style, and no DROPOUT or JUMP flags outside fades.
3. Open the spectrogram PNG it writes and confirm the arrangement: sections appear where written, the ending is clean, and there are no gaps.
4. For guitar bends and vibrato, zoom in on the dry stem: `ffmpeg -ss <t> -t 7 -i stems/<name>.lead.dry.wav -lavfi "lowpass=f=1400,showspectrumpic=s=1000x500:scale=log:fscale=lin:stop=1400" bend.png`. Bends should show as smooth rises, vibrato as ripples.
5. For long pieces, check loudness minute by minute (analyze.js does this automatically over 15 minutes).

## 7. Deliver

Give file paths (MP3 first), the duration and a short timestamped walkthrough of what happens. Mention what you checked, and say plainly that you checked by measurement, not by ear. Offer 2–4 concrete tweaks ("more fuzz", "cut to 30 s", "no drums"). Ask before deleting large intermediates, or delete only ones the script regenerates, like noise beds. The `stems/` folder can reach gigabytes for long pieces.

## Gotchas (all hit in practice)

- **Clipping in SoX chains:** start chains with `gain -6` to `-10`. After heavy `overdrive`, add another `gain -8`. Mix stems at −12 dB (`produce` already does) and use `sox -G -m`. `-G` fails if the chain also has an explicit `gain` effect, so use it only on the mix.
- **Same-pitch overlaps:** a note-off can cut a new note-on of the same pitch. The engine trims overlaps in `write()`, so let it; don't hand-extend durations past the next onset.
- **Bends:** set with `bendRange` (`guitarLine` sets 3 semitones). Bends past the range clamp.
- **Too sharp or harsh:** use warmer instruments (jazz guitar 26 instead of clean 27), lowpass around 2.5–4.5 kHz for dark styles, reverb HF damping 60–65, and confirm with the brightness centroid.
- **`ebur128` per-frame logs** need `-v verbose`. The first ~0.4 s of any window reads −120 (meter warm-up), which is not a dropout.
- **Render time:** a one-hour piece takes about 6 minutes. Keep the music stem so remixes (noise level, master) skip re-rendering (`--remix` in `deep-focus.js`).
- **FluidSynth reverb:** turn it off for stems that get SoX reverb (produce does), or the tail doubles and gets muddy.
