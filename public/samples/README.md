# Samples

Baile funk / funk carioca kit. Drop your own audio here. The repo ships
generated placeholder WAVs so the app and demo mode are audible out of the box.
Replace them with real baile funk one shots and one note instrument samples.
Keep the exact file names and folders below.

Regenerate the placeholders any time with:

    node tools/generate-samples.mjs

## Drums (Tone.Players, baile funk / tamborzao one shots)

    drums/kick.wav   deep surdo style kick (the baile funk boom)
    drums/clap.wav   hand clap
    drums/snare.wav  tight snare
    drums/rim.wav    rim / click
    drums/tam1.wav   tamborzao hit, high pitch
    drums/tam2.wav   tamborzao hit, mid pitch
    drums/tam3.wav   tamborzao hit, low pitch
    drums/perc.wav   high percussion accent (agogo / shaker)

The three tamX hits make up the rolling tamborzao percussion line. Record them
as the same drum tuned to three pitches, or use three different tambor hits.

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
