import * as Tone from "tone";
import type { Instrument } from "../lib/types";
import { PENTATONIC_CHORDS } from "../lib/music";
import { DRUM_KEYS, FX_KEYS } from "../lib/instruments";

// Host only audio engine. Phones never instantiate this and never reach the
// destination. Everything is sample based and routed through a shared reverb
// plus delay bus. No oscillators are used for final sounds.
export class AudioEngine {
  private master: Tone.Gain;
  private bus: Tone.Gain;
  private reverb: Tone.Reverb;
  private delay: Tone.FeedbackDelay;
  private analyser: Tone.Analyser;

  private drums: Tone.Players;
  private fx: Tone.Players;
  private bass: Tone.Sampler;
  private chords: Tone.Sampler;
  private lead: Tone.Sampler;

  private loaded = false;

  // Fires the instant a sample is triggered, synced to audio via Tone.Draw.
  public onTrigger: ((instrument: Instrument) => void) | null = null;

  constructor() {
    this.master = new Tone.Gain(0.9).toDestination();
    this.analyser = new Tone.Analyser("waveform", 1024);
    this.master.connect(this.analyser);

    this.reverb = new Tone.Reverb({ decay: 3.2, wet: 0.32 }).connect(this.master);
    this.delay = new Tone.FeedbackDelay({
      delayTime: "8n.",
      feedback: 0.32,
      wet: 0.28,
    }).connect(this.reverb);

    // Dry path plus sends into the effects bus.
    this.bus = new Tone.Gain(1);
    this.bus.connect(this.master);
    this.bus.connect(this.delay);

    const drumUrls = Object.fromEntries(
      DRUM_KEYS.map((k) => [k, `${k}.wav`]),
    );
    this.drums = new Tone.Players({
      urls: drumUrls,
      baseUrl: "/samples/drums/",
    }).connect(this.bus);

    const fxUrls = Object.fromEntries(FX_KEYS.map((k) => [k, `${k}.wav`]));
    this.fx = new Tone.Players({
      urls: fxUrls,
      baseUrl: "/samples/fx/",
    }).connect(this.bus);

    this.bass = new Tone.Sampler({
      urls: { C2: "C2.wav" },
      baseUrl: "/samples/bass/",
    }).connect(this.bus);

    this.chords = new Tone.Sampler({
      urls: { C3: "C3.wav" },
      baseUrl: "/samples/chords/",
    }).connect(this.bus);

    this.lead = new Tone.Sampler({
      urls: { C4: "C4.wav" },
      baseUrl: "/samples/lead/",
    }).connect(this.bus);
  }

  async start(): Promise<void> {
    await Tone.start();
    await Tone.loaded();
    this.loaded = true;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  getWaveform(): Float32Array {
    return this.analyser.getValue() as Float32Array;
  }

  // Trigger a sample at an absolute transport time. The caller is responsible
  // for quantizing time to the 16th note grid.
  trigger(instrument: Instrument, note: string, time: number): void {
    if (!this.loaded) return;
    try {
      switch (instrument) {
        case "drums":
          this.drums.player(note).start(time);
          break;
        case "fx":
          this.fx.player(note).start(time);
          break;
        case "bass":
          this.bass.triggerAttackRelease(note, "8n", time);
          break;
        case "lead":
          this.lead.triggerAttackRelease(note, "16n", time);
          break;
        case "chords": {
          const voicing = PENTATONIC_CHORDS[note] ?? [note];
          this.chords.triggerAttackRelease(voicing, "4n", time);
          break;
        }
      }
    } catch {
      // Unknown sample key. Ignore rather than crash the clock.
      return;
    }
    if (this.onTrigger) {
      Tone.Draw.schedule(() => this.onTrigger?.(instrument), time);
    }
  }

  dispose(): void {
    this.drums.dispose();
    this.fx.dispose();
    this.bass.dispose();
    this.chords.dispose();
    this.lead.dispose();
    this.delay.dispose();
    this.reverb.dispose();
    this.analyser.dispose();
    this.bus.dispose();
    this.master.dispose();
  }
}

let engine: AudioEngine | null = null;

export function getEngine(): AudioEngine {
  if (!engine) engine = new AudioEngine();
  return engine;
}
