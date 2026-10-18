// Meshing gears: where the second of a pair goes, and how to turn it so its teeth fall between
// the first one's. Lifted from scripts/watch/movement.mjs (meshPhase), which keeps its own copy.
const TAU = Math.PI * 2;

/** Centre distance of two gears in mesh (same module), in mm. */
export const centreDistance = (module, teethA, teethB) => (module * (teethA + teethB)) / 2;

/**
 * The phase (radians, for gear()/solids.spur) that puts b's teeth between a's where they meet.
 * a and b are { center: [u, v], teeth, module, phase } in the plane's local coordinates
 * (solids.localCentre(axis, at) gives them for a gear on an axis).
 */
export function meshPhase(a, b) {
  const beta = Math.atan2(b.center[1] - a.center[1], b.center[0] - a.center[0]);
  const pitchA = TAU / a.teeth;
  const k = Math.round((beta - (a.phase ?? 0)) / pitchA);
  const thetaA = (a.phase ?? 0) + k * pitchA;
  const rA = (a.module * a.teeth) / 2;
  const rB = (b.module * b.teeth) / 2;
  const u = (thetaA - beta) * rA;
  return beta + Math.PI - u / rB + Math.PI / b.teeth;
}
