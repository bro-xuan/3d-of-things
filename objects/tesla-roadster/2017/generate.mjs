// Build step for the 2017 Roadster (see content.mjs here): the car builder in scripts/kit/cars/ run on
// its spec (spec.mjs), a plain electric car.
import generateCar from '../../../scripts/kit/cars/generate.mjs';
import spec from './spec.mjs';

export default (options = {}) => generateCar({ ...options, spec });
