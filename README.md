# sound-studio

A Claude Code plugin for composing, producing and mastering **original music from code**. Ask Claude for a track and it writes the music as a script, renders it through real instrument samples, runs guitars through amp, echo and reverb chains, mixes and masters it, then checks the result with loudness and spectrum measurements.

What it can make:
- Background beds for product demos and launch videos: happy pop, playful explainer, upbeat funk
- Acoustic guitar tracks (travel, folk) with fingerpicking and strumming
- Electric guitar songs with real bends, vibrato and slides: soaring rock solos, indie rock with dotted-eighth delay, dream pop in the Cigarettes After Sex style
- Cinematic orchestral pieces
- Hour-long generative focus and ambient audio that never loops
- Sound effects tuned to the music and timed to video frames

Everything it makes is original. It won't recreate copyrighted songs, even from sheet music or tabs, but it will match a song's style, tone and feel.

## Install

**From GitHub:**

```
/plugin marketplace add ninadkale98/sound-studio
/plugin install sound-studio@sound-studio
```

**From a local folder** (for trying it out, or a shared drive):

```
/plugin marketplace add /path/to/sound-studio
/plugin install sound-studio@sound-studio
```

Restart Claude Code after installing if the skill doesn't show up.

## First run

The first time, Claude runs `skills/compose/scripts/setup.sh`, which installs whatever is missing:
- **FluidSynth:** plays MIDI through real instrument samples
- **SoX:** amp, echo, chorus and reverb effects
- **ffmpeg:** mastering and analysis
- **Node.js:** runs the composition engine
- **GeneralUser GS:** a free 32 MB instrument library, saved to `~/soundfonts/`

It supports macOS (Homebrew) and Debian or Ubuntu (apt). To use a different SoundFont, set `SOUNDFONT=/path/to/file.sf2`.

## Use

Just ask, or run `/sound-studio:compose`:

- "Make a 45-second happy background track for our product demo, leaving room for voiceover"
- "A 4-minute dreamy electric guitar song, warm and fuzzy, lots of reverb"
- "One hour of deep-focus ambient piano with a soft rain bed"
- "A soaring guitar solo over a slow B-minor ballad"
- "Cut the demo track to exactly 30 seconds and end on a hit"

Tracks and their scripts are saved under `music/<name>/` in your current folder. Ask for changes in plain words ("darker", "more echo", "no drums") and Claude edits the script and re-renders.

## What's inside

```
skills/compose/
  SKILL.md                 workflow Claude follows
  engine/lib.js            composition engine (notes, chords, strums, bends, tempo, MIDI, render)
  engine/studio.js         guitar techniques, per-stem effects chains, mixing, mastering
  examples/                nine finished pieces used as starting templates
  scripts/setup.sh         one-time dependency setup
  scripts/analyze.js       loudness, clipping, brightness and spectrogram checks
  references/              genre recipes, tone research, instrument numbers
```

## Limits

- Claude can't listen. It checks renders by measurement (loudness over time, peaks, clipping, brightness, spectrograms), so give the final track a listen yourself.
- The free instrument library is good but general-purpose. Solo instruments, especially electric guitar, sound good for software but not identical to a real player through a real amp.
- There are no sung vocals.

## License

MIT. See [LICENSE](LICENSE).
