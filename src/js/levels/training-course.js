import { createRng } from './rng.js';

const RING_RADIUS = 4;
const RING_TUBE = 0.25;

// The training course keeps the original idea: a compact arena with poles
// scattered across the grid and five gates weaving away from the spawn. The
// layout is seeded so it is identical on every reload.
const ringPositions = [
    { x: 0, y: 2.5, z: -12 },
    { x: -9, y: 3, z: -22 },
    { x: 0, y: 3.5, z: -32 },
    { x: 9, y: 3, z: -42 },
    { x: 0, y: 2.5, z: -52 },
];

function buildRings() {
    return ringPositions.map((ring, index) => {
        const previous = index === 0 ? { x: 0, z: 0 } : ringPositions[index - 1];
        const yaw = Math.atan2(ring.x - previous.x, ring.z - previous.z);
        return { ...ring, yaw, radius: RING_RADIUS, tube: RING_TUBE, gate: true };
    });
}

function generateObstacles() {
    const rng = createRng(0xa3701);
    const obstacles = [];

    for (let i = 0; i < 40; i++) {
        const height = 6 + rng() * 10;
        const radius = 0.9 + rng() * 1.3;
        let x = 0;
        let z = 0;

        for (let attempt = 0; attempt < 100; attempt++) {
            x = (rng() - 0.5) * 96;
            z = (rng() - 0.5) * 96;

            const nearSpawn = Math.abs(x) < 8 && Math.abs(z) < 8;
            const nearRing = ringPositions.some(
                (ring) => Math.hypot(x - ring.x, z - ring.z) < RING_RADIUS + 8
            );
            const nearWall = Math.max(Math.abs(x), Math.abs(z)) > 50;
            if (!nearSpawn && !nearRing && !nearWall) break;
        }

        obstacles.push({
            x,
            z,
            radius,
            height,
            kind: i % 3 === 0 ? 'decor' : i % 3 === 1 ? 'tower' : 'pillar',
        });
    }

    return obstacles;
}

export const trainingCourse = {
    id: 'training-course',
    difficulty: 'beginner',
    order: 100,
    defaultTheme: 'daylight',
    spawn: { x: 0, y: 1.5, z: 0, yaw: 0 },
    bounds: { halfSize: 55, ceiling: 35 },
    // 1 m grid cells: 120 size / 120 divisions.
    ground: { size: 120, divisions: 120 },
    // Temporary Phase 4 pilot: semi-transparent glass walls on the flight
    // bounds. Remove this line to restore the open arena.
    environment: { glassWalls: true },
    obstacles: generateObstacles(),
    rings: buildRings(),
    objectives: { type: 'gates' },
};
