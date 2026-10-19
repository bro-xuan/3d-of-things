// Charts for the steps of "How it works". Each draws itself into the step's figure and, while the
// step is on, reads the running mechanism every frame, so what it plots moves with the model.
import type { Thing } from '../types';
// Only the types: the charts work from plain numbers and draw before three.js has loaded.
import type { CameraState } from '../viewer/filmcamera';
import type { ReflexState } from '../viewer/reflexcamera';
import type { AeroState } from '../viewer/aerocar';
import type { ArmState } from '../viewer/balancedarm';
import type { ExtinguisherState } from '../viewer/extinguisher';
import type { MechanismState } from '../viewer/rig';
import { armCharts } from './arm';
import type { LockState } from '../viewer/pintumbler';
import { cameraCharts } from './camera';
import { carCharts } from './car';
import { lockCharts } from './lock';
import { extinguisherCharts } from './extinguisher';
import { barsChart, ladderChart, timingChart } from './generic';
import { opticsCharts } from './optics';
import { reflexCharts } from './reflex';
import { roadsterCharts } from './roadster';
import { tapeCharts } from './tape';
import { watchCharts } from './watch';

/** What a chart can read from the viewer, once it's there. */
export interface ChartSource {
  /** What a clock-driven mechanism is doing now, or null (no viewer yet, or nothing clock-driven). */
  state(): MechanismState | null;
  /** What a camera's lens and shutter are set to and doing, or null (no viewer yet, or not a camera). */
  camera(): CameraState | ReflexState | null;
  /** What a car's suction fans and thrusters are doing, or null (no viewer yet, or a car without them). */
  aero(): AeroState | null;
  /** What a balanced arm (a desk lamp) is doing, or null (no viewer yet, or not one). */
  arm?(): ArmState | null;
  /** What a pin tumbler lock's keys, pins and plug are doing, or null (no viewer yet, or not a lock). */
  lock?(): LockState | null;
  /** What an extinguisher's pin, lever and charge are doing, or null (no viewer yet, or not an extinguisher). */
  extinguisher(): ExtinguisherState | null;
  /** How far a part has turned, in radians. */
  angleOf(node: string): number;
  /** Seconds a spinning mechanism has run for, scaled by its speed (a crank turned slowly). */
  time(): number;
  /** Which of a step's `speeds` is chosen. */
  selected(): number;
}

export interface ChartContext {
  source: ChartSource;
  thing: Thing;
  /** Opens a step of the tour (for charts that are maps of it). */
  go(step: number): void;
  /** The step's chart entry when it's an object: settings for a generic chart. */
  spec: Record<string, unknown>;
}

export interface Chart {
  /** Small capitals over the chart, e.g. "One beat, slowed down". */
  title: string;
  /** A line or two in italics under it, saying what to look for. */
  caption: string;
  /** Called every frame while the chart is on screen. */
  update?(): void;
  destroy(): void;
}

export type ChartFactory = (host: HTMLElement, context: ChartContext) => Chart;

const factories: Record<string, ChartFactory> = {
  ...watchCharts,
  ...opticsCharts,
  ...cameraCharts,
  ...reflexCharts,
  ...carCharts,
  ...roadsterCharts,
  ...armCharts,
  ...lockCharts,
  ...tapeCharts,
  ...extinguisherCharts,
  bars: barsChart,
  ladder: ladderChart,
  timing: timingChart,
};

/** Draws the chart a step names (by id, or as `{ type, ... }`) into `host`; null if there's no such chart. */
export function drawChart(entry: string | { type: string }, host: HTMLElement, context: Omit<ChartContext, 'spec'>): Chart | null {
  const [type, spec] = typeof entry === 'string' ? [entry, {}] : [entry.type, entry as Record<string, unknown>];
  const factory = factories[type];
  if (!factory) {
    if (import.meta.env.DEV) console.warn(`${context.thing.slug}: no chart called "${type}"`);
    return null;
  }
  return factory(host, { ...context, spec });
}
