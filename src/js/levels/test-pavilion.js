import { createRng } from './rng.js';

const RING_RADIUS = 4;
const RING_TUBE = 0.25;
const CIRCUIT_RADIUS = 18;

// The Test Pavilion is the showcase of the metric arena: a marked helipad at
// the centre and five glowing gates forming a closed circuit around it, with
// seeded obstacle poles scattered between the circuit and the walls.
const rings = [0, 1, 2, 3, 4].map((index) => {
    const angle = Math.PI / 2 + (index * 2 * Math.PI) / 5;
    return {
        x: Math.round(Math.cos(angle) * CIRCUIT_RADIUS * 10) / 10,
        z: Math.round(Math.sin(angle) * CIRCUIT_RADIUS * 10) / 10,
        y: 2.5 + index * 0.5,
        yaw: angle + Math.PI / 2, // face along the circuit tangent
        radius: RING_RADIUS,
        tube: RING_TUBE,
        gate: true,
    };
});

function generateObstacles() {
    const rng = createRng(0x51a7e);
    const obstacles = [];

    for (let i = 0; i < 14; i++) {
        const height = 4 + rng() * 12;
        const radius = 1.2 + rng() * 1.6;
        let x = 0;
        let z = 0;

        for (let attempt = 0; attempt < 100; attempt++) {
            x = (rng() - 0.5) * 56;
            z = (rng() - 0.5) * 56;

            const nearSpawn = Math.hypot(x, z) < radius + 6;
            const nearRing = rings.some(
                (ring) => Math.hypot(x - ring.x, z - ring.z) < RING_RADIUS + 8
            );
            const nearWall = Math.max(Math.abs(x), Math.abs(z)) > 27;
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

export const testPavilion = {
    id: 'test-pavilion',
    difficulty: 'beginner',
    order: 99,
    defaultTheme: 'daylight',
    spawn: { x: 0, y: 1.5, z: 0, yaw: 0 },
    bounds: { halfSize: 30, ceiling: 25 },
    ground: { size: 80, divisions: 40 },
    // Metric test pavilion: ruled walls/floor, height rulers and an "H" pad.
    environment: { type: 'pavilion' },
    landingPad: { radius: 2.5, helipad: true },
    palette: {
        pillar: 0x3b82f6,
        hazard: 0xf43f5e,
        tower: 0xD7A94B,
        ring: 0xFFBF00,
        decor: 0x64748b,
        accent: 0x22d3ee,
    },
    obstacles: generateObstacles(),
    rings,
    decor: [
        { type: 'box', x: -24, y: 0.75, z: -18, width: 2.5, height: 1.5, depth: 2.5 },
        { type: 'box', x: -21.5, y: 0.55, z: -17.5, width: 1.6, height: 1.1, depth: 1.6 },
        { type: 'box', x: 24, y: 0.9, z: 16, width: 3, height: 1.8, depth: 3 },
        { type: 'box', x: 20.8, y: 0.5, z: 18, width: 1.8, height: 1, depth: 1.8 },
    ],
    objectives: { type: 'gates' },
};
