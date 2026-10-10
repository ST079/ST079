import type { AreaId } from "./layout";
import type { VehicleId } from "./store";

// Sound for the town, all synthesised with the Web Audio API (no audio files):
// an engine that follows the speed through the gears (or, on the bicycle, just
// tyres and chain), road noise, a skid on hard braking, a thud on bumping into
// things, the horn, a bell on arriving somewhere, pigeons taking off, and a
// quiet background of birds, murmur and distant bells.
//
// Browsers only allow audio after the visitor has clicked or pressed a key, so
// nothing plays until then. The on/off choice is remembered in this browser.

type Kind = "car" | "tempo" | "motorbike" | "bicycle";
const KIND: Record<VehicleId, Kind> = {
  hatchback: "car",
  taxi: "car",
  jeep: "car",
  tempo: "tempo",
  motorbike: "motorbike",
  bicycle: "bicycle",
};

interface EngineProfile {
  /** Oscillator shapes: main voice and the one an octave down. */
  wave: OscillatorType;
  sub: OscillatorType;
  /** Pitch at idle and how far it rises at the top of a gear (Hz). */
  idle: number;
  rev: number;
  /** Speeds where each gear ends; an electric motor has one long "gear". */
  gears: number[];
  /** Low-pass cut-off, and how much it opens under throttle. */
  filter: number;
  filterLoad: number;
  /** Loudness at idle, at speed, and the extra under throttle. */
  idleGain: number;
  speedGain: number;
  loadGain: number;
  /** A single cylinder's thump (motorbike): fraction of the pitch, and depth. */
  thump?: { ratio: number; depth: number };
}

const PROFILES: Record<Exclude<Kind, "bicycle">, EngineProfile> = {
  car: {
    wave: "sawtooth",
    sub: "square",
    idle: 34,
    rev: 70,
    gears: [5, 9.5, 13.5, 17],
    filter: 380,
    filterLoad: 700,
    idleGain: 0.05,
    speedGain: 0.04,
    loadGain: 0.05,
  },
  tempo: {
    wave: "triangle",
    sub: "sine",
    idle: 120,
    rev: 520,
    gears: [17],
    filter: 1400,
    filterLoad: 900,
    idleGain: 0.012,
    speedGain: 0.045,
    loadGain: 0.02,
  },
  motorbike: {
    wave: "sawtooth",
    sub: "square",
    idle: 46,
    rev: 120,
    gears: [4.5, 8.5, 12.5, 16, 20],
    filter: 520,
    filterLoad: 1100,
    idleGain: 0.05,
    speedGain: 0.05,
    loadGain: 0.06,
    thump: { ratio: 0.5, depth: 0.55 },
  },
};

const STORAGE_KEY = "st079-sound";
const MASTER = 0.8;

interface Engine {
  main: OscillatorNode;
  sub: OscillatorNode;
  filter: BiquadFilterNode;
  gain: GainNode;
  thump: OscillatorNode;
  thumpDepth: GainNode;
}

class TownSound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private engine: Engine | null = null;
  private road: { gain: GainNode; filter: BiquadFilterNode } | null = null;
  private skid: GainNode | null = null;
  private chain: GainNode | null = null;
  private kind: Kind | null = null;
  private lastSpeed = 0;
  private lastActive: string | null = null;
  private nextBird = 0;
  private nextBell = 0;
  private listeners = new Set<() => void>();
  private enabled = true;
  private loaded = false;

  /** Whether sound is switched on (remembered in this browser). */
  isEnabled = () => {
    if (!this.loaded) {
      this.loaded = true;
      try {
        this.enabled = localStorage.getItem(STORAGE_KEY) !== "off";
      } catch {
        // Storage can be blocked; sound stays on.
      }
    }
    return this.enabled;
  };

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** Turn sound on or off. Turning it on from a click also starts it. */
  setEnabled(on: boolean) {
    this.enabled = on;
    this.loaded = true;
    try {
      localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
    } catch {
      // Not remembered, but still applied.
    }
    if (on) this.start();
    else this.fade(0);
    this.listeners.forEach((l) => l());
  }

  toggle() {
    this.setEnabled(!this.isEnabled());
  }

  /** Start (or resume) audio. Call from a click or key press. */
  start() {
    if (!this.isEnabled() || typeof window === "undefined") return;
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.build(this.ctx);
    }
    void this.ctx.resume();
    this.fade(MASTER);
  }

  /** Pause while the page is hidden; pick up again when it's back. */
  suspend(hidden: boolean) {
    if (!this.ctx) return;
    if (hidden) void this.ctx.suspend();
    else if (this.isEnabled()) void this.ctx.resume();
  }

  /** Tear everything down (leaving the town). */
  stop() {
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
    this.engine = null;
    this.road = null;
    this.skid = null;
    this.chain = null;
    this.kind = null;
  }

  private get live() {
    return this.ctx && this.master && this.ctx.state === "running" && this.isEnabled() ? this.ctx : null;
  }

  private fade(to: number) {
    if (!this.ctx || !this.master) return;
    this.master.gain.setTargetAtTime(to, this.ctx.currentTime, 0.08);
  }

  private build(ctx: AudioContext) {
    const master = ctx.createGain();
    master.gain.value = 0;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -12;
    master.connect(limiter).connect(ctx.destination);
    this.master = master;

    // Two seconds of white noise, reused by everything noisy.
    const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.noise = noise;

    // Engine: a voice and a sub-octave through a low-pass, with an optional
    // thump (amplitude wobble) for the motorbike's single cylinder.
    const main = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    subGain.gain.value = 0.6;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 2;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const thump = ctx.createOscillator();
    thump.type = "square";
    const thumpDepth = ctx.createGain();
    thumpDepth.gain.value = 0;
    thump.connect(thumpDepth).connect(gain.gain);
    main.connect(filter);
    sub.connect(subGain).connect(filter);
    filter.connect(gain).connect(master);
    main.start();
    sub.start();
    thump.start();
    this.engine = { main, sub, filter, gain, thump, thumpDepth };

    // Tyres on the paving.
    const roadFilter = ctx.createBiquadFilter();
    roadFilter.type = "bandpass";
    roadFilter.frequency.value = 400;
    roadFilter.Q.value = 0.7;
    const roadGain = ctx.createGain();
    roadGain.gain.value = 0;
    this.loop(ctx, 1).connect(roadFilter).connect(roadGain).connect(master);
    this.road = { gain: roadGain, filter: roadFilter };

    // A squeal for hard braking, and the bicycle's chain.
    const skidFilter = ctx.createBiquadFilter();
    skidFilter.type = "bandpass";
    skidFilter.frequency.value = 1750;
    skidFilter.Q.value = 9;
    this.skid = ctx.createGain();
    this.skid.gain.value = 0;
    this.loop(ctx, 1.1).connect(skidFilter).connect(this.skid).connect(master);

    const chainFilter = ctx.createBiquadFilter();
    chainFilter.type = "bandpass";
    chainFilter.frequency.value = 3200;
    chainFilter.Q.value = 3;
    this.chain = ctx.createGain();
    this.chain.gain.value = 0;
    this.loop(ctx, 0.9).connect(chainFilter).connect(this.chain).connect(master);

    // A soft background: wind and the murmur of the square.
    const bedFilter = ctx.createBiquadFilter();
    bedFilter.type = "lowpass";
    bedFilter.frequency.value = 420;
    const bed = ctx.createGain();
    bed.gain.value = 0.035;
    this.loop(ctx, 0.97).connect(bedFilter).connect(bed).connect(master);

    this.nextBird = ctx.currentTime + 1.5;
    this.nextBell = ctx.currentTime + 6;
  }

  private loop(ctx: AudioContext, rate: number) {
    const source = ctx.createBufferSource();
    source.buffer = this.noise;
    source.loop = true;
    source.playbackRate.value = rate;
    source.start(0, Math.random() * 1.5);
    return source;
  }

  private setKind(kind: Kind) {
    if (!this.engine || !this.ctx || kind === this.kind) return;
    this.kind = kind;
    const e = this.engine;
    if (kind === "bicycle") {
      e.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      e.thumpDepth.gain.value = 0;
      return;
    }
    const p = PROFILES[kind];
    e.main.type = p.wave;
    e.sub.type = p.sub;
    e.thumpDepth.gain.value = p.thump ? p.thump.depth * p.idleGain : 0;
  }

  /**
   * Called every frame with the car's speed and ride, and where it's parked
   * (for the arrival bell).
   */
  update(speed: number, vehicle: VehicleId, dt: number, active: string | null, area: AreaId | null, inSwayambhu: boolean) {
    const ctx = this.live;
    if (!ctx || !this.engine || !this.road || !this.skid || !this.chain || dt <= 0) return;
    const now = ctx.currentTime;
    const kind = KIND[vehicle];
    this.setKind(kind);

    const s = Math.abs(speed);
    const accel = (s - this.lastSpeed) / dt;
    this.lastSpeed = s;
    const load = Math.max(0, Math.min(1, accel / 10));
    const e = this.engine;

    if (kind !== "bicycle") {
      const p = PROFILES[kind];
      // Which gear, and how far through it: the revs climb, then drop on each shift.
      let g = 0;
      while (g < p.gears.length - 1 && s > p.gears[g]) g++;
      const low = g === 0 ? 0 : p.gears[g - 1];
      const through = Math.max(0, Math.min(1, (s - low) / (p.gears[g] - low)));
      const revs = s < 0.3 ? 0 : 0.28 + 0.72 * through;
      const pitch = p.idle + revs * p.rev;
      e.main.frequency.setTargetAtTime(pitch, now, 0.06);
      e.sub.frequency.setTargetAtTime(pitch / 2, now, 0.06);
      if (p.thump) e.thump.frequency.setTargetAtTime(pitch * p.thump.ratio, now, 0.06);
      e.filter.frequency.setTargetAtTime(p.filter + load * p.filterLoad + s * 25, now, 0.08);
      e.gain.gain.setTargetAtTime(p.idleGain + (Math.min(s, 16) / 16) * p.speedGain + load * p.loadGain, now, 0.08);
    }

    // Tyres: louder and brighter with speed (lighter on the bicycle).
    const tyre = kind === "bicycle" ? 0.03 : 0.07;
    this.road.gain.gain.setTargetAtTime((Math.min(s, 18) / 18) * tyre, now, 0.1);
    this.road.filter.frequency.setTargetAtTime(250 + s * 30, now, 0.1);
    this.chain.gain.setTargetAtTime(kind === "bicycle" ? (Math.min(s, 9) / 9) * 0.02 : 0, now, 0.1);

    // Skid: braking hard at speed (not on the bicycle).
    const skidding = kind !== "bicycle" && accel < -20 && s > 5;
    this.skid.gain.setTargetAtTime(skidding ? 0.05 : 0, now, skidding ? 0.03 : 0.12);

    // A bell on arriving somewhere.
    if (active && active !== this.lastActive) this.arrive(area);
    this.lastActive = active;

    // Birds now and then; bells in the distance (more often, and smaller, at Swayambhu).
    if (now > this.nextBird) {
      this.chirp();
      this.nextBird = now + 2.5 + Math.random() * 6;
    }
    if (now > this.nextBell) {
      if (inSwayambhu) this.bell(1650 + Math.random() * 500, 0.03, 1.4);
      else this.bell(420 + Math.random() * 120, 0.025, 2.6);
      this.nextBell = now + (inSwayambhu ? 5 : 11) + Math.random() * 9;
    }
  }

  /** The horn: a two-tone car horn, a motorbike beep, the tempo's peep, a bicycle bell. */
  horn(vehicle: VehicleId) {
    const ctx = this.live;
    if (!ctx || !this.master) return;
    const kind = KIND[vehicle];
    if (kind === "bicycle") {
      this.bell(2200, 0.09, 0.7);
      setTimeout(() => this.bell(2200, 0.08, 0.7), 140);
      return;
    }
    const tones = kind === "car" ? [415, 523] : kind === "motorbike" ? [620, 784] : [700];
    const now = ctx.currentTime;
    const length = kind === "car" ? 0.38 : 0.24;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0, now);
    out.gain.linearRampToValueAtTime(0.11, now + 0.015);
    out.gain.setValueAtTime(0.11, now + length);
    out.gain.linearRampToValueAtTime(0, now + length + 0.05);
    const shape = ctx.createBiquadFilter();
    shape.type = "bandpass";
    shape.frequency.value = 1100;
    shape.Q.value = 0.8;
    shape.connect(out).connect(this.master);
    for (const f of tones) {
      const o = ctx.createOscillator();
      o.type = "square";
      o.frequency.value = f;
      o.connect(shape);
      o.start(now);
      o.stop(now + length + 0.08);
    }
  }

  /** A soft thud on bumping into something (0..1). */
  bump(strength: number) {
    const ctx = this.live;
    if (!ctx || !this.master || !this.noise) return;
    const now = ctx.currentTime;
    const level = 0.08 + 0.17 * strength;
    const out = ctx.createGain();
    out.gain.setValueAtTime(level, now);
    out.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    out.connect(this.master);
    const low = ctx.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 260;
    const burst = ctx.createBufferSource();
    burst.buffer = this.noise;
    burst.connect(low).connect(out);
    burst.start(now, Math.random());
    burst.stop(now + 0.3);
    const knock = ctx.createOscillator();
    knock.frequency.setValueAtTime(90, now);
    knock.frequency.exponentialRampToValueAtTime(40, now + 0.2);
    knock.connect(out);
    knock.start(now);
    knock.stop(now + 0.3);
  }

  /** Pigeons taking off: a quick flurry of wingbeats. */
  flutter() {
    const ctx = this.live;
    if (!ctx || !this.master || !this.noise) return;
    const now = ctx.currentTime;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 1300;
    band.Q.value = 0.9;
    band.connect(this.master);
    let t = now;
    for (let i = 0; i < 16; i++) {
      t += 0.03 + Math.random() * 0.05;
      const g = ctx.createGain();
      const level = 0.07 * (1 - i / 18);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(level, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
      g.connect(band);
      const flap = ctx.createBufferSource();
      flap.buffer = this.noise;
      flap.connect(g);
      flap.start(t, Math.random() * 1.8);
      flap.stop(t + 0.08);
    }
  }

  /** Arriving: a temple bell in Bhaktapur, a singing bowl at Swayambhunath. */
  private arrive(area: AreaId | null) {
    if (area === "swayambhu") this.bowl();
    else this.bell(520, 0.08, 3.2);
  }

  /** A struck bell: a few inharmonic partials dying away. */
  private bell(f: number, level: number, decay: number) {
    const ctx = this.live;
    if (!ctx || !this.master) return;
    const now = ctx.currentTime;
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.random() * 1.2 - 0.6;
    pan.connect(this.master);
    [1, 2.76, 5.4].forEach((ratio, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f * ratio;
      const g = ctx.createGain();
      const peak = level / (i + 1);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(peak, now + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, now + decay / (i + 1));
      o.connect(g).connect(pan);
      o.start(now);
      o.stop(now + decay + 0.1);
    });
  }

  /** A singing bowl: two close tones beating slowly, a long ring. */
  private bowl() {
    const ctx = this.live;
    if (!ctx || !this.master) return;
    const now = ctx.currentTime;
    for (const [f, level] of [
      [262, 0.07],
      [263.6, 0.07],
      [706, 0.025],
    ] as const) {
      const o = ctx.createOscillator();
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(level, now + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 5);
      o.connect(g).connect(this.master);
      o.start(now);
      o.stop(now + 5.1);
    }
  }

  /** A little bird: two to four quick upward whistles, somewhere left or right. */
  private chirp() {
    const ctx = this.live;
    if (!ctx || !this.master) return;
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.random() * 1.6 - 0.8;
    pan.connect(this.master);
    const base = 2600 + Math.random() * 1400;
    let t = ctx.currentTime;
    const notes = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < notes; i++) {
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(base, t);
      o.frequency.exponentialRampToValueAtTime(base * (1.3 + Math.random() * 0.3), t + 0.06);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.018, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
      o.connect(g).connect(pan);
      o.start(t);
      o.stop(t + 0.09);
      t += 0.1 + Math.random() * 0.06;
    }
  }
}

export const townSound = new TownSound();
