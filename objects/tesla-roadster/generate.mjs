// Build step for the 2026 Roadster (content/tesla-roadster.json → build.generate): the car builder in
// scripts/kit/cars/ run on this car's spec (spec.mjs). A spec with `aero` gets the kit's aero.mjs: the
// suction fans, the skirts, the air tanks and the ten cold-gas thrusters.
import generateCar from '../../scripts/kit/cars/generate.mjs';
import spec from './spec.mjs';

export default (options = {}) => generateCar({ ...options, spec });
