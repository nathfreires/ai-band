# Samples

Baile funk / funk carioca kit. Drop your own audio here. The repo ships
generated placeholder WAVs so the app and demo mode are audible out of the box.
Replace them with real baile funk one shots and one note instrument samples.
Keep the exact file names and folders below.

Regenerate the placeholders any time with:

    node tools/generate-samples.mjs

## Drums

Drums are not sample based. They are synthesized directly in Tone.js (kick,
clap, and tamborzao percussion) through a distortion plus short reverb bus.
See src/audio/engine.ts. There are no drum files to drop in.

## FX (Tone.Players, one shots)

    fx/riser.wav
    fx/impact.wav
    fx/sweep.wav
    fx/downlifter.wav

## Melodic (Tone.Sampler, one note each, repitched across C minor pentatonic)

    bass/C2.wav      sub bass, single sustained note recorded at C2
    chords/C3.wav    single sustained note recorded at C3
    lead/C4.wav      single sustained note recorded at C4

Tips

- Mono or stereo WAV both work. Trim silence from the start for tight timing.
- For the melodic samples, record one clean held note at the listed pitch.
  Tone.Sampler pitch shifts it to every pentatonic pad.
- You can add more mapped notes per melodic instrument by extending the urls
  map in src/audio/engine.ts.
