import { ACTIVE_DRONE_MODEL, DRONE_MODEL_SCALE } from './drone-models/config.js';
import { createQuadcopter as createClassicQuadcopter } from './drone-models/classic.js';
import { createQuadcopter as createRealisticQuadcopter } from './drone-models/realistic.js';

const MODEL_BUILDERS = {
    classic: createClassicQuadcopter,
    realistic: createRealisticQuadcopter,
};

// Active model is chosen in drone-models/config.js. Falls back to the
// classic builder for unknown ids so the sim always has a drone.
export function createQuadcopter() {
    const builder = MODEL_BUILDERS[ACTIVE_DRONE_MODEL] || MODEL_BUILDERS.classic;
    const quadcopter = builder();

    if (DRONE_MODEL_SCALE !== 1) {
        quadcopter.group.scale.setScalar(DRONE_MODEL_SCALE);
    }

    return quadcopter;
}
