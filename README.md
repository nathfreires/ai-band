# AI BAND

Turn a room full of phones into one instrument. Phones are silent controllers.
A single host screen owns the clock and makes all the sound. Everyone plays in
C minor pentatonic, quantized to a shared 16th note grid, in a rekordbox styled
interface.

## How it works

- `/host` owns the `Tone.Transport` clock, subscribes to the room in Firebase,
  quantizes every incoming tap to its grid, plays the sample, and visualizes it
  on a scrolling dual color waveform deck with a big BPM and key readout. It
  shows a QR code linking phones to `/join/:roomId`.
- `/join/:roomId` is the phone controller. Pick an instrument (drums, bass,
  chords, lead, fx). Claiming one locks that slot for everyone else. After
  claiming you see only that instrument's performance pads. Tapping a pad writes
  `{ instrument, note, t }` to Firebase. Phones never produce sound.
- `/host?demo=1` spawns three fake players that auto play, so the whole thing
  works on one screen with no phones.

## Audio law

Only the host calls `toDestination()`. Phones are controllers and never make
noise. All melodic notes are locked to C minor pentatonic. All triggers
quantize to `Tone.Transport` 16th notes. Sound is sample based: `Tone.Players`
for drums and fx, `Tone.Sampler` for melodic instruments, all through a shared
reverb plus delay bus.

## Quick start

See the bottom of this file or run the commands your assistant printed. In
short:

    npm install
    cp .env.example .env        # then fill in your Firebase config
    npm run dev

Open the host on your computer at the printed Network URL, then scan the QR
code with phones on the same network. To try it solo without phones or
Firebase, open `/host?demo=1`.

## Samples

Placeholder WAVs live in `public/samples` so the app is audible immediately.
Replace them with your own. See `public/samples/README.md` for the file list.
Regenerate placeholders with `node tools/generate-samples.mjs`.

## Firebase

Create a Realtime Database project, enable the database, and copy the web app
config into `.env` using the keys in `.env.example`. For a quick local jam you
can set the Realtime Database rules to public read and write, but lock them down
before any real deployment.

    {
      "rules": { ".read": true, ".write": true }
    }
