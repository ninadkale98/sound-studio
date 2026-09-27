# Instruments (General MIDI, GeneralUser GS)

Programs are 0-based, as passed to `s.inst(ch, program, opts)`. Channel 9 is always drums; set the kit with `s.drums({ kit })`.

## Melodic programs that sound good

| # | Instrument | Notes |
|---|---|---|
| 0 | Acoustic grand | Pedal with CC64, velocity 30–60 for ambient |
| 1 | Bright piano | Pop chords, cuts through |
| 4 | Electric piano | Warm pads and comping |
| 7 | Clavinet | Funk offbeats, keep short |
| 8 / 9 | Celesta / Glockenspiel | Sparkle an octave above the melody, low velocity |
| 12 / 13 | Marimba / Xylophone | Hooks, playful lines |
| 16 | Drawbar organ | Ballad bed, swell with CC11 |
| 24 | Nylon guitar | Fingerpicking |
| 25 | Steel acoustic | Strums (use `guitarShape`) |
| 26 | Jazz guitar | Warmest electric: dream pop, neck-pickup tones |
| 27 | Clean electric | Shimmering riffs, a bit bright |
| 28 | Muted electric | Funk chops |
| 29 | Overdriven guitar | Leads with `guitarLine` |
| 30 | Distortion guitar | Power chords, double hard L/R |
| 32 / 33 / 34 / 36 | Acoustic / Finger / Picked / Slap bass | |
| 40, 42, 43 | Violin, Cello, Contrabass | |
| 45 | Pizzicato strings | Oom-pah explainer beds |
| 47 | Timpani | Rolls: 32nd notes with rising velocity |
| 48 / 49 | Strings / Slow strings | Pads; slow strings for swells |
| 52 | Choir aahs | Faint, big reverb |
| 59 / 60 / 61 | Muted trumpet / French horn / Brass section | |
| 70 / 71 | Bassoon / Clarinet | |
| 78 | Whistle | Travel and folk melodies |
| 89 | Warm pad | Ambient bed, drones |
| 119 | Reverse cymbal | Place its end on the downbeat you're building to |

## Drum notes (channel 9)

36 kick, 37 side stick, 38 snare, 39 clap, 40 electric snare (brush swirl in the brush kit), 41/43/45/47/48/50 toms low→high, 42 closed hat, 46 open hat, 49 crash, 51 ride, 52 china, 54 tambourine, 69 cabasa, 76/77 woodblock hi/lo, 81 triangle, 82 shaker.

Kits: 0 standard, 40 brush (GS), others per the SoundFont.
