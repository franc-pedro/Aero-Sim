import { createRng } from './rng.js';

const RING_RADIUS = 4;
const RING_TUBE = 0.25;

const spawn = { x: 0, y: 1.5, z: 0, yaw: 0 };

// Gate waypoints zig-zag forward through the arena, climbing gently from
// 200 cm to 500 cm — a real (and reachable) gauntlet at Tello scale.
const waypoints = [
    { x: 0, y: 2, z: 8 },
    { x: -8, y: 2.4, z: 14 },
    { x: 8, y: 2.8, z: 20 },
    { x: -8, y: 3.2, z: 26 },
    { x: 8, y: 3.6, z: 32 },
    { x: -8, y: 4, z: 38 },
    { x: 0, y: 4.5, z: 44 },
    { x: 0, y: 5, z: 50 },
];

function buildRings() {
    return waypoints.map((point, index) => {
        const previous = index === 0 ? spawn : waypoints[index - 1];
        const yaw = Math.atan2(point.x - previous.x, point.z - previous.z);

        return {
            ...point,
            yaw,
            radius: RING_RADIUS,
            tube: RING_TUBE,
            gate: true,
        };
    });
}

function generateObstacles() {
    const rng = createRng(0x9c2f7);
    const obstacles = [];

    for (let i = 0; i < 16; i++) {
        const height = 15 + rng() * 20;
        const radius = 1.2 + rng() * 1.2;
        let x = 0;
        let z = 0;

        for (let attempt = 0; attempt < 100; attempt++) {
            x = (rng() - 0.5) * 100;
            z = (rng() - 0.5) * 100;

            const nearSpawn = Math.abs(x) < 8 && Math.abs(z) < 8;
            const nearRing = waypoints.some(
                (point) => Math.hypot(x - point.x, z - point.z) < RING_RADIUS + 9
            );
            const nearWall = Math.max(Math.abs(x), Math.abs(z)) > 50;
            if (!nearSpawn && !nearRing && !nearWall) break;
        }

        obstacles.push({
            x,
            z,
            radius,
            height,
            kind: i % 4 === 0 ? 'hazard' : i % 4 === 1 ? 'tower' : 'pillar',
        });
    }

    return obstacles;
}

export const ringGauntlet = {
    id: 'ring-gauntlet',
    difficulty: 'intermediate',
    order: 101,
    defaultTheme: 'night',
    spawn,
    bounds: { halfSize: 55, ceiling: 40 },
    // 1 m grid cells: 120 size / 120 divisions.
    ground: { size: 120, divisions: 120 },
    palette: {
        pillar: 0x7c3aed,
        hazard: 0xf97316,
        tower: 0x475569,
        ring: 0xF4BB44,
        decor: 0x334155,
    },
    obstacles: generateObstacles(),
    rings: buildRings(),
    decor: [
        // Monoliths framing the course (14-16 m tall at world scale).
        { type: 'box', x: -38, y: 35, z: 15, width: 14, height: 70, depth: 14 },
        { type: 'box', x: 38, y: 30, z: 15, width: 14, height: 60, depth: 14 },
        { type: 'box', x: -38, y: 40, z: 42, width: 14, height: 80, depth: 14 },
        { type: 'box', x: 38, y: 35, z: 42, width: 14, height: 70, depth: 14 },
    ],
    objectives: { type: 'gates' },
};
