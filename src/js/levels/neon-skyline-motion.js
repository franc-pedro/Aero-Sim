import {
    buildSkylineGates,
    skylineDecor,
} from './neon-skyline.js';

const spawn = { x: 0, y: 1.5, z: 0, yaw: 0 };

// Same compact course as Neon Skyline, with three oscillating arches timed to
// the course: a wide street gateway that sweeps vertically, a lateral arch
// around gate 4 and a combined arch over the low blocks at gate 8. Gates sit
// at the centre of the moving arches' openings, so aligning with the gate
// means the pass is clear: it is a timing challenge, not luck.
export const neonSkylineMotion = {
    id: 'neon-skyline-motion',
    difficulty: 'advanced',
    order: 115,
    defaultTheme: 'night',
    spawn,
    bounds: { halfSize: 75, ceiling: 60 },
    // 1 m grid cells: 160 size / 160 divisions.
    ground: { size: 160, divisions: 160 },
    palette: {
        pillar: 0x334155,
        hazard: 0xf43f5e,
        tower: 0x475569,
        ring: 0x67e8f9,
        decor: 0x1e293b,
    },
    rings: buildSkylineGates(),
    landingPad: { x: 0, z: 72, radius: 5 },
    obstacles: [],
    decor: [
        ...skylineDecor,

        // --- Moving arches ---
        // Street gateway before gate 2: sweeps vertically; duck low or time
        // the rise.
        { type: 'arch', x: 0, z: 13, span: 24, height: 10, thickness: 1.6, motion: { vertical: 4, period: 10, phase: 0.8 } },
        // Around gate 4: sweeps sideways across the gate.
        { type: 'arch', x: 3, z: 30, span: 12, height: 20, motion: { lateral: 2.5, period: 8, phase: 1.7 } },
        // Over the low blocks at gate 8: vertical + lateral combined.
        { type: 'arch', x: 2, z: 58, span: 10, height: 22, motion: { vertical: 2.5, lateral: 2, period: 12, phase: 3.1 } },
    ],
    objectives: { type: 'gates' },
};
