import * as Tone from "tone";
import type { Instrument } from "../lib/types";
import { PENTATONIC_CHORDS } from "../lib/music";
import { FX_KEYS } from "../lib/instruments";

// Host only audio engine. Phones never instantiate this and never reach the
// destination. Melodic instruments and fx are sample based through a shared
// reverb plus delay bus. Drums are synthesized in Tone.js through a dedicated
// distortion plus short reverb bus so they sound gritty and punchy.
export class AudioEngine {
  private master: Tone.Gain;
  private bus: Tone.Gain;
  private reverb: Tone.Reverb;
  private delay: Tone.FeedbackDelay;
  private analyser: Tone.Analyser;

  // Drum bus and synth voices.
  private drumBus: Tone.Gain;
  private drumDist: Tone.Distortion;
  private drumReverb: Tone.Reverb;
  private kick: Tone.MembraneSynth;
  private tam: Tone.MembraneSynth;
  private clapNoise: Tone.NoiseSynth;
  private clapFilter: Tone.Filter;

  private fx: Tone.Players;
  private bass: Tone.Sampler;
  private chords: Tone.Sampler;
  private lead: Tone.Sampler;

  private loaded = false;

  // Fires the instant a voice is triggered, synced to audio via Tone.Draw.
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

    // Dry path plus sends into the melodic effects bus.
    this.bus = new Tone.Gain(1);
    this.bus.connect(this.master);
    this.bus.connect(this.delay);

    // Shared drum bus: distortion for grit, short reverb for a tight room.
    this.drumReverb = new Tone.Reverb({
      decay: 0.6,
      preDelay: 0.005,
      wet: 0.16,
    }).connect(this.master);
    this.drumDist = new Tone.Distortion({
      distortion: 0.32,
      oversample: "2x",
      wet: 0.5,
    }).connect(this.drumReverb);
    this.drumBus = new Tone.Gain(1).connect(this.drumDist);

    // Deep punchy kick: fast downward pitch envelope, short decay.
    this.kick = new Tone.MembraneSynth({
      pitchDecay: 0.035,
      octaves: 1.7,
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.28, sustain: 0, release: 0.08 },
    }).connect(this.drumBus);
    this.kick.volume.value = 3;

    // Tamborzao: tight woody low-mid membrane hit, the "tu".
    this.tam = new Tone.MembraneSynth({
      pitchDecay: 0.02,
      octaves: 0.5,
      oscillator: { type: "triangle" },
      envelope: { attack: 0.001, decay: 0.13, sustain: 0, release: 0.03 },
    }).connect(this.drumBus);
    this.tam.volume.value = -1;

    // Clap: bandpassed white noise burst with a very fast attack.
    this.clapFilter = new Tone.Filter({
      type: "bandpass",
      frequency: 1800,
      Q: 1.4,
    }).connect(this.drumBus);
    this.clapNoise = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.02 },
    }).connect(this.clapFilter);
    this.clapNoise.volume.value = -4;

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
    // Reverb impulse responses render asynchronously.
    await Promise.all([this.reverb.ready, this.drumReverb.ready]);
    this.loaded = true;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  getWaveform(): Float32Array {
    return this.analyser.getValue() as Float32Array;
  }

  // Synthesized baile funk drum hit at an absolute transport time.
  private triggerDrum(note: string, time: number): void {
    switch (note) {
      case "kick":
        this.kick.triggerAttackRelease(45, "8n", time, 1);
        break;
      case "clap":
        // Layered noise bursts give the clap its characteristic flam.
        this.clapNoise.triggerAttackRelease("16n", time);
        this.clapNoise.triggerAttackRelease("16n", time + 0.012);
        this.clapNoise.triggerAttackRelease("16n", time + 0.024);
        break;
      case "tam1":
        this.tam.triggerAttackRelease(290, "16n", time);
        break;
      case "tam2":
        this.tam.triggerAttackRelease(245, "16n", time);
        break;
      case "tam3":
        this.tam.triggerAttackRelease(205, "16n", time);
        break;
      default:
        // perc / snare / rim and anything else fall back to a tambor hit.
        this.tam.triggerAttackRelease(245, "16n", time);
        break;
    }
  }

  // Trigger a voice at an absolute transport time. The caller is responsible
  // for quantizing time to the 16th note grid.
  trigger(instrument: Instrument, note: string, time: number): void {
    if (!this.loaded) return;
    try {
      switch (instrument) {
        case "drums":
          this.triggerDrum(note, time);
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
    this.kick.dispose();
    this.tam.dispose();
    this.clapNoise.dispose();
    this.clapFilter.dispose();
    this.drumDist.dispose();
    this.drumReverb.dispose();
    this.drumBus.dispose();
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
