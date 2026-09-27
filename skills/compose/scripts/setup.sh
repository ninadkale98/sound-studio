#!/usr/bin/env bash
# One-time setup for sound-studio: FluidSynth (MIDI -> audio), SoX (effects), ffmpeg (mastering/analysis),
# Node.js (the composition engine) and the free GeneralUser GS instrument library.
# Safe to re-run: it only installs what is missing.
set -euo pipefail

SF_DIR="${SOUNDFONT_DIR:-$HOME/soundfonts}"
SF_FILE="$SF_DIR/GeneralUser-GS.sf2"
SF_URL="https://github.com/mrbumpy409/GeneralUser-GS/raw/main/GeneralUser-GS.sf2"

need() { command -v "$1" >/dev/null 2>&1; }

install_pkg() { # $1 = command, $2 = brew formula, $3 = apt package
  if need "$1"; then echo "ok      $1"; return; fi
  if need brew; then echo "install $2 (brew)"; brew install "$2"
  elif need apt-get; then echo "install $3 (apt)"; sudo apt-get install -y "$3"
  else echo "missing $1: install it with your package manager" >&2; exit 1; fi
}

install_pkg fluidsynth fluid-synth fluidsynth
install_pkg sox sox sox
install_pkg ffmpeg ffmpeg ffmpeg
install_pkg node node nodejs

if [ -s "$SF_FILE" ]; then
  echo "ok      soundfont ($SF_FILE)"
else
  echo "download GeneralUser GS soundfont (~32 MB) -> $SF_FILE"
  mkdir -p "$SF_DIR"
  curl -fsSL -o "$SF_FILE" "$SF_URL"
fi

# sanity check: the file must be a SoundFont
if ! file "$SF_FILE" | grep -qi "soundfont"; then
  echo "error: $SF_FILE is not a valid SoundFont" >&2; exit 1
fi
[ "$SF_FILE" != "$HOME/soundfonts/GeneralUser-GS.sf2" ] && echo "note: export SOUNDFONT=\"$SF_FILE\" so the engine finds it"
echo "sound-studio is ready."
