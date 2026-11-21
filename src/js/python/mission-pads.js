import { droneState } from '../core/state.js';
import { GROUND_HEIGHT } from '../simulation/constants.js';

// Mission pad registry for the Python Lab. Pads come from the level definition
// (ids are assigned in levels/index.js so the 3D markers and this registry
// always agree). Detection mimics the Tello downward camera: a pad is "seen"
// when the drone hovers within its detection cone above it.

let pads = [];

const DEFAULT_DETECT_MARGIN = 0.8; // metres beyond the pad radius
const DEFAULT_DETECT_HEIGHT = 2.0; // metres above the ground

export function setMissionPads(levelDef) {
    pads = [];
    if (!levelDef) return;

    const collected = [
        levelDef.landingPad,
        levelDef.missionPad,
        ...(levelDef.pads || []),
    ].filter(Boolean);

    pads = collected.map((pad, index) => {
        const radius = pad.radius ?? 3;
        return {
            id: pad.id ?? index + 1,
            x: pad.x ?? levelDef.spawn?.x ?? 0,
            z: pad.z ?? levelDef.spawn?.z ?? 0,
            detectRadius: pad.detectRadius ?? radius + DEFAULT_DETECT_MARGIN,
            detectHeight: pad.detectHeight ?? DEFAULT_DETECT_HEIGHT,
        };
    });
}

// Returns the nearest pad currently under the drone, or null when none is seen.
export function detectMissionPad() {
    if (pads.length === 0) return null;

    let best = null;
    let bestDistance = Infinity;

    for (const pad of pads) {
        const distance = Math.hypot(droneState.pos.x - pad.x, droneState.pos.z - pad.z);
        if (distance > pad.detectRadius) continue;
        if (droneState.pos.y > pad.detectHeight) continue;
        if (distance < bestDistance) {
            best = pad;
            bestDistance = distance;
        }
    }

    return best;
}

// Mimics the real Tello: -1 when no mission pad is detected.
export function getMissionPadId() {
    const pad = detectMissionPad();
    return pad ? pad.id : -1;
}

// Distances to the detected pad in centimetres. x/z are signed world offsets
// (positive = east/south of the pad), y is the altitude above the ground.
export function getMissionPadDistanceCm(axis) {
    const pad = detectMissionPad();
    if (!pad) {
        throw new Error(
            'No mission pad detected. Hover slowly above a pad (within about 1 m of it, below 2 m) and try again.'
        );
    }

    if (axis === 'x') return Math.round((droneState.pos.x - pad.x) * 100);
    if (axis === 'z') return Math.round((droneState.pos.z - pad.z) * 100);
    return Math.round((droneState.pos.y - GROUND_HEIGHT) * 100);
}
