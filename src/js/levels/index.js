import { t } from '../i18n/index.js';
import { functionForge } from './function-forge.js';
import { loopLagoon } from './loop-lagoon.js';
import { obstacleAlley } from './obstacle-alley.js';
import { pythonPlayground } from './python-playground.js';
import { ringGauntlet } from './ring-gauntlet.js';
import { trainingCourse } from './training-course.js';
import { variableValley } from './variable-valley.js';
import { conditionalCanyon } from './conditional-canyon.js';
import { sensorSummit } from './sensor-summit.js';
import { neonSkyline } from './neon-skyline.js';
import { neonSkylineMotion } from './neon-skyline-motion.js';
import { testPavilion } from './test-pavilion.js';
import { racingCircuit } from './racing-circuit.js';
import { warehouseInspection } from './warehouse-inspection.js';

// Arena props (rings, obstacles, pads, decor) are authored at a generous
// hangar scale. They are normalised once, here at load, so the scene builder,
// the collision engine and the Python mission logic all agree on prop sizes.
// Positions, bounds and spawn stay untouched: scripts fly to coordinates.
// A level can opt out with `propScale: 1` or pick its own factor.
const PROP_SCALE = 0.2;
const DECOR_LENGTH_KEYS = ['y', 'width', 'depth', 'height', 'span', 'thickness', 'length', 'deckHeight', 'radius'];

function scaleLengths(source, keys, scale) {
    const scaled = { ...source };
    keys.forEach((key) => {
        if (typeof scaled[key] === 'number') scaled[key] *= scale;
    });
    return scaled;
}

function applyPropScale(def) {
    const scale = def.propScale ?? PROP_SCALE;
    const scaled = { ...def, propScale: scale };

    if (def.rings) {
        scaled.rings = def.rings.map((ring) => scaleLengths(ring, ['radius', 'tube'], scale));
    }
    if (def.obstacles) {
        scaled.obstacles = def.obstacles.map((obstacle) => scaleLengths(obstacle, ['radius', 'height'], scale));
    }
    if (def.landingPad) {
        scaled.landingPad = {
            ...scaleLengths(def.landingPad, ['radius'], scale),
            // Pads are numbered so the 3D marker, the Python API
            // (get_mission_pad_id) and the teacher docs always agree.
            id: def.landingPad.id ?? 1,
        };
    }
    if (def.missionPad) {
        scaled.missionPad = {
            ...scaleLengths(def.missionPad, ['radius'], scale),
            id: def.missionPad.id ?? 2,
        };
    }
    if (def.pads) {
        // Extra code pads continue the numbering (helipad = 1, mission pad = 2).
        scaled.pads = def.pads.map((pad, index) => ({
            ...scaleLengths(pad, ['radius'], scale),
            id: pad.id ?? index + 3,
        }));
    }
    if (def.decor) {
        scaled.decor = def.decor.map((decor) => {
            const item = scaleLengths(decor, DECOR_LENGTH_KEYS, scale);
            if (item.motion) {
                item.motion = scaleLengths(item.motion, ['vertical', 'lateral'], scale);
            }
            return item;
        });
    }
    if (def.pythonMission?.landingPad) {
        scaled.pythonMission = {
            ...def.pythonMission,
            landingPad: scaleLengths(def.pythonMission.landingPad, ['radius'], scale),
        };
    }

    return scaled;
}

export const LEVELS = [
    pythonPlayground,
    loopLagoon,
    functionForge,
    obstacleAlley,
    variableValley,
    conditionalCanyon,
    sensorSummit,
    trainingCourse,
    ringGauntlet,
    testPavilion,
    racingCircuit,
    warehouseInspection,
    neonSkyline,
    neonSkylineMotion,
].map(applyPropScale).sort((a, b) => a.order - b.order);
export const DEFAULT_LEVEL_ID = LEVELS[0].id;

export function getLevel(id) {
    return LEVELS.find((level) => level.id === id) || null;
}

export function listLevels() {
    return LEVELS;
}

export function getLevelForPreset(preset) {
    return LEVELS.find((level) => level.pythonMission?.example === preset) || null;
}

export function getLevelText(def) {
    if (!def) return { name: '', difficulty: '', description: '' };

    const base = `level.${def.id}`;
    return {
        name: t(`${base}.name`),
        difficulty: t(`level.difficulty.${def.difficulty}`),
        description: t(`${base}.description`),
    };
}
