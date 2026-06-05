---
description: AI Band project rules. Stack, Firebase, audio law, music theory, and aesthetic conventions.
alwaysApply: true
---

# AI Band project rules

## Stack
- Vite + React 19 + TypeScript.
- Tone.js for all audio.
- Firebase Realtime Database for state sync.
- react-router-dom v6 or newer for routing.
- Functional components and hooks only. No class components.

## Firebase
- Use the modular Firebase SDK v9 or newer (tree shakeable `firebase/app`, `firebase/database`).
- Read all config from `import.meta.env` (Vite env vars prefixed with `VITE_`).
- Never commit API keys or secrets. `.env` is gitignored. Ship `.env.example` only.

## Audio law
- Phones are controllers and NEVER call `toDestination()`. They only write events to Firebase.
- Only the `/host` route produces sound. The audio engine is instantiated on the host alone.

## Music theory and timing
- All melodic notes are locked to the C minor pentatonic scale (C, Eb, F, G, Bb).
- All triggers quantize to `Tone.Transport` 16th notes. Nothing fires off grid.

## Audio synthesis
- Sample based audio only: `Tone.Players` for drums and fx, `Tone.Sampler` for melodic instruments (bass, chords, lead).
- Everything routes through a shared reverb + delay bus.
- No raw oscillators for final sounds.

## Aesthetic (rekordbox / Pioneer DJ)
- Background `#0d0d0f`.
- Primary cyan `#00a0e9` with orange accents.
- Monospace fonts for all numeric readouts (BPM, key, counters).
- Glowing performance pad grids, scrolling waveform visuals.
- Dark theme only.
- No em dashes anywhere in copy or code.
