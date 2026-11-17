const RING_RADIUS = 4;
const RING_TUBE = 0.25;

const spawn = { x: 0, y: 1.5, z: 0, yaw: 0 };

// Gate waypoints zig-zag forward through the arena, climbing gently.
const waypoints = [
    { x: 0, y: 8, z: 25 },
    { x: -20, y: 10, z: 45 },
    { x: 20, y: 12, z: 65 },
    { x: -20, y: 14, z: 85 },
    { x: 20, y: 16, z: 105 },
    { x: -18, y: 19, z: 125 },
    { x: 0, y: 22, z: 145 },
    { x: 0, y: 26, z: 165 },
];

function buildRings() {
    return waypoints.map((point, index) => {
        const previous = index === 0 ? spawn : waypoints[index - 1];
        const directionX = point.x - previous.x;
        const directionZ = point.z - previous.z;
        const yaw = Math.atan2(directionX, directionZ);

        return {
            ...point,
            yaw,
            radius: RING_RADIUS,
            tube: RING_TUBE,
            gate: true,
        };
    });
}

export const ringGauntlet = {
    id: 'ring-gauntlet',
    difficulty: 'intermediate',
    order: 101,
    defaultTheme: 'night',
    spawn,
    bounds: { halfSize: 200, ceiling: 150 },
    ground: { size: 440, divisions: 88 },
    palette: {
        pillar: 0x7c3aed,
        hazard: 0xf97316,
        tower: 0x475569,
        ring: 0xf59e0b,
        decor: 0x334155,
    },
    obstacles: [
        { x: -58, z: 40, radius: 3.5, height: 24, kind: 'tower' },
        { x: 58, z: 40, radius: 3.5, height: 20, kind: 'tower' },
        { x: -60, z: 80, radius: 3.0, height: 30, kind: 'tower' },
        { x: 60, z: 80, radius: 4.0, height: 26, kind: 'hazard' },
        { x: -58, z: 120, radius: 3.5, height: 22, kind: 'tower' },
        { x: 58, z: 120, radius: 3.0, height: 32, kind: 'tower' },
        { x: -45, z: 158, radius: 2.5, height: 18, kind: 'hazard' },
        { x: 45, z: 158, radius: 2.5, height: 18, kind: 'hazard' },
    ],
    rings: buildRings(),
    decor: [
        { type: 'box', x: -210, y: 35, z: 30, width: 18, height: 70, depth: 18 },
        { type: 'box', x: 210, y: 30, z: 30, width: 18, height: 60, depth: 18 },
        { type: 'box', x: -210, y: 40, z: 120, width: 18, height: 80, depth: 18 },
        { type: 'box', x: 210, y: 35, z: 120, width: 18, height: 70, depth: 18 },
    ],
    objectives: { type: 'gates' },
};
