import { createRng } from './rng.js';

const RING_RADIUS = 4;
const RING_TUBE = 0.4;

// The training course keeps the original idea: pillars scattered across the
// grid and five gates leading away from the spawn. The layout is seeded so it
// is identical on every reload.
const ringPositions = [
    { x: -50, y: 9.0, z: -30 },
    { x: -25, y: 10.5, z: -60 },
    { x: 0, y: 12.0, z: -90 },
    { x: 25, y: 9.5, z: -120 },
    { x: 50, y: 11.0, z: -150 },
];

function generateObstacles() {
    const rng = createRng(0xa3701);
    const obstacles = [];

    for (let i = 0; i < 30; i++) {
        const height = 5 + rng() * 15;
        const radius = 1.5 + rng() * 2;
        let x = 0;
        let z = 0;

        for (let attempt = 0; attempt < 100; attempt++) {
            x = (rng() - 0.5) * 300;
            z = (rng() - 0.5) * 300;

            const nearSpawn = Math.abs(x) < 15 && Math.abs(z) < 15;
            const nearRing = ringPositions.some(
                (ring) => Math.hypot(x - ring.x, z - ring.z) < RING_RADIUS + 10
            );
            if (!nearSpawn && !nearRing) break;
        }

        obstacles.push({
            x,
            z,
            radius,
            height,
            kind: i % 5 === 0 ? 'hazard' : 'pillar',
        });
    }

    return obstacles;
}

export const trainingCourse = {
    id: 'training-course',
    name: 'Training Course',
    difficulty: 'Beginner',
    order: 1,
    description: 'Pillars and five floating gates over the training grid.',
    defaultTheme: 'daylight',
    spawn: { x: 0, y: 1.5, z: 0, yaw: 0 },
    bounds: { halfSize: 180, ceiling: 150 },
    ground: { size: 400, divisions: 80 },
    obstacles: generateObstacles(),
    rings: ringPositions.map((ring) => ({
        ...ring,
        yaw: Math.PI / 4,
        radius: RING_RADIUS,
        tube: RING_TUBE,
        gate: true,
    })),
    objectives: { type: 'gates' },
};
