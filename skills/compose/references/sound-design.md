# Sound design reference

## Genre recipes (proven in the examples)

| Style | Tempo | Harmony | Instruments (GM) | Mix and effects | Example |
|---|---|---|---|---|---|
| Cinematic orchestral | 72–84 | i–VI–III–VII in minor | piano 0, slow strings 49, strings 48, cello 42, contrabass 43, horns 60, choir 52, timpani 47, celesta 8, reverse cymbal 119 | FluidSynth hall reverb; crescendo with CC11; ritardando at the end | first piece in the original session |
| Acoustic travel | 100–115 | I–V–vi–IV, chorus on IV | nylon 24 picking, steel 25 strums (doubled, panned L/R), whistle 78, glock 9, acoustic bass 32, shaker 82, tambourine 54, claps 39 | light reverb, bright | `open-road.js` |
| Happy pop demo | 118–124 | I–V–vi–IV | bright piano 1 offbeat chords, marimba 12 hook, finger bass 33 octaves, brass 61 stabs, glock | −14 LUFS, little reverb | `ship-it.js` |
| Playful explainer | 96–104, light swing (offbeat at 0.6) | I–vi–ii–V | pizzicato 45 oom-pah, xylophone 13, clarinet 71, bassoon 70, woodblock 76/77, triangle 81 | dry-ish | `good-morning.js` |
| Upbeat funk | 108–115 | I–vi–IV–V | muted guitar 28 sixteenths (accent the "e" and "a"), clavinet 7, slap bass 36, brass 61, muted trumpet 59 | tight, ghost-note snare | `green-build.js` |
| Soaring rock solo | 64–70 | i–VI–III–VII | overdriven 29 lead via `guitarLine`, clean 27 arps, drawbar organ 16 | `FX.lead` + `FX.clean` | `numb-sky.js` |
| Indian indie rock (Local Train feel) | 84–90 | I–V/3–vi–IV verse; IV–V–I–vi chorus | clean 27 riff with add9/11th colours, distortion 30 doubled hard L/R, overdrive 29 lead | dotted-8th delay on the riff; `FX.swell` bridge | `last-local.js` |
| Dream pop / slowcore | 60–72 | maj7/m7, borrowed iv (Fm6 in C) | jazz guitar 26 (warm, neck-pickup-like) for rhythm and lead, finger bass, GS brush kit (drums program 40), warm pad 89 | parallel `FX.casBody` + `FX.casFuzz`, ~600 ms single echo, overall lowpass ~10 kHz, −16 LUFS | `afterglow.js` |
| Deep focus / ambient | 60 (beatless) | pentatonic-safe maj7 chord walk | piano 0 (soft, pedalled), warm pad 89, slow strings 49, choir 52 | long envelopes, −20 LUFS, optional brown-noise bed | `deep-focus.js` |

## Effect chains in `studio.js` (SoX syntax)

- `FX.lead(bpm)`: compressor for sustain → overdrive 4/12 → mid bump at 900 Hz → three tempo-synced echoes (dotted 8th, quarter, dotted quarter) → hall reverb. A singing rock lead.
- `FX.clean(bpm)`: compressor → presence at 3.5 kHz → two-voice chorus → dotted-8th echoes → lush reverb. Shimmering clean guitar.
- `FX.swell(bpm)`: chorus → long echoes → reverb 95. Ambient washes. Pair with CC11 fades on each note to remove the attack.
- `FX.crunch()`: tight low end, scooped 400 Hz, a lift at 2.2 kHz, small room. Rhythm distortion.
- `FX.dreamRhythm(bpm)` / `FX.warmLead(bpm)`: a softer, darker take on clean and lead.
- `FX.casBody(delayMs)` + `FX.casFuzz(delayMs)`: the dream-pop pair. Render the same channel into both stems and blend the fuzz about 4–5 LU under the body.

Tempo-synced delay: quarter note in ms = 60000 / BPM. A dotted eighth is 0.75× that.

## Researched tone: Cigarettes After Sex

- **Apocalypse** ([ToneMirror](https://www.tonemirror.so/tones/cigarettes-after-sex-apocalypse)): Stratocaster, neck pickup, tone 7, volume 8. Fender '65 Twin Reverb at gain 2, bass 5, mid 5, treble 6, presence 5. Deluxe Memory Man at about 600 ms with one repeat.
- **Greg Gonzalez's rig** ([Equipboard](https://equipboard.com/pros/greg-gonzalez), [Gemtracks](https://www.gemtracks.com/gears/greg-gonzalez-17096/)): Parker Fly or Fender Jaguar, often into an Ampeg SVT (a bass amp, hence the round, dark body), Roland JC-120 stereo chorus, Neunaber Wet or EHX Holy Grail reverb, Boss CE-2W chorus, Boss DD-3 or MXR Carbon Copy delay, EHX Big Muff for grit.
- **Translation used here:** warm guitar sample; a body chain lowpassed around 2.9 kHz with a low-mid bump and JC-style stereo chorus; a parallel Big Muff-style fuzz with scooped mids; one ~600 ms echo; big reverb with high damping; the whole mix rolled off around 10 kHz. The first attempt was a clean, bright chain, which the listener rightly called too sharp. The researched version measured about an octave darker (spectral centroid ~1380 → ~720 Hz).

## Loudness targets

Streaming and social normalize to about −14 LUFS. Soft genres sit better at −16. Background under speech sits at −18 to −20. Focus and ambient at −20 with a narrow loudness range. Keep true peak at or below −1.5 dBFS.
