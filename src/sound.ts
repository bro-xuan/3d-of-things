// The sounds a mechanism makes, synthesised: an escapement's tick (a sharp metallic click,
// alternately a little higher and lower, so it reads as tick-tock), a ratchet's click as it's
// wound, and a cloth shutter firing. Off until the visitor turns them on; the choice is remembered.

const KEY = '3d-of-things:sound';

class Sound {
  private context: AudioContext | null = null;
  private noise: AudioBuffer | null = null;
  private master: GainNode | null = null;
  private listeners = new Set<(on: boolean) => void>();
  on = false;

  constructor() {
    try {
      this.on = localStorage.getItem(KEY) === 'on';
    } catch {
      this.on = false;
    }
  }

  /** Turns sound on or off. Turning it on has to happen in a click or key press (browsers only start audio then). */
  set(on: boolean): void {
    this.on = on;
    try {
      localStorage.setItem(KEY, on ? 'on' : 'off');
    } catch {
      // Private windows can refuse storage; the choice just isn't remembered.
    }
    if (on) void this.ready()?.resume();
    for (const listener of this.listeners) listener(on);
  }

  subscribe(listener: (on: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private ready(): AudioContext | null {
    if (this.context) return this.context;
    const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Context) return null;
    const context = (this.context = new Context());
    this.master = context.createGain();
    this.master.gain.value = 0.55;
    this.master.connect(context.destination);
    // A twentieth of a second of white noise, the raw material of every click.
    const noise = (this.noise = context.createBuffer(1, Math.round(context.sampleRate * 0.05), context.sampleRate));
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return context;
  }

  /** A short burst of noise through a resonant band, dying away fast: the sound of steel on steel (or jewel). */
  private click(frequency: number, gain: number, decay: number, ring = 0): void {
    if (!this.on) return;
    const context = this.ready();
    if (!context || !this.noise || !this.master || context.state !== 'running') return;
    const t = context.currentTime;
    const source = context.createBufferSource();
    source.buffer = this.noise;
    const band = context.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = frequency;
    band.Q.value = 6;
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(gain, t);
    envelope.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    source.connect(band).connect(envelope).connect(this.master);
    source.start(t);
    source.stop(t + decay + 0.01);
    if (ring) {
      // A faint ring after the click, like a small metal part sounding.
      const tone = context.createOscillator();
      tone.frequency.value = ring;
      const toneGain = context.createGain();
      toneGain.gain.setValueAtTime(gain * 0.12, t);
      toneGain.gain.exponentialRampToValueAtTime(0.0001, t + decay * 2.5);
      tone.connect(toneGain).connect(this.master);
      tone.start(t);
      tone.stop(t + decay * 2.5 + 0.01);
    }
  }

  /** An escapement beat: odd and even beats sound a little different, as the two pallets do. */
  tick(beat: number): void {
    const even = beat % 2 === 0;
    this.click(even ? 4200 : 3500, 0.9, 0.022, even ? 5100 : 4300);
  }

  /** A ratchet tooth dropping past the click. */
  ratchet(): void {
    this.click(6200, 0.35, 0.012);
  }

  /** A cloth shutter: a soft snick as each curtain lets go, a duller thud as it is caught at the end of its run. */
  shutter(curtain: 0 | 1, event: 'start' | 'stop'): void {
    if (event === 'start') this.click(curtain === 0 ? 2700 : 2300, curtain === 0 ? 0.6 : 0.3, 0.025);
    else this.click(curtain === 0 ? 1100 : 800, 0.7, 0.05);
  }
}

export const sound = new Sound();
