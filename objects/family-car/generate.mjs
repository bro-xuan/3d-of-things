// Build step for the family car (content/family-car.json → build.generate): the car builder in
// scripts/kit/cars/ run on this car's spec (spec.mjs). A spec with an `engine` gets the kit's
// engine.mjs: the inline four, the clutch and gearbox, the propshaft and the live rear axle.
import generateCar from '../../scripts/kit/cars/generate.mjs';
import spec from './spec.mjs';

export default (options = {}) => generateCar({ ...options, spec });
