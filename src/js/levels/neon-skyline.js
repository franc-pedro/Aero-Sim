const RING_RADIUS = 3.5;
const RING_TUBE = 0.25;

const spawn = { x: 0, y: 1.5, z: 0, yaw: 0 };

// Gates weave down the street canyon, pass under the flyover, thread the
// rooftop arch and finish with a descent to the landing pad.
const waypoints = [
    { x: 0, y: 6, z: 22 },
    { x: -4, y: 7, z: 37 },
    { x: 0, y: 7.5, z: 59 },   // under the bridge
    { x: 4, y: 9, z: 68 },
    { x: 6, y: 10, z: 84 },
    { x: 24, y: 16, z: 100 },  // through the arch
    { x: 16, y: 13, z: 114 },
    { x: 0, y: 12, z: 128 },
    { x: -8, y: 10, z: 142 },
    { x: 0, y: 7, z: 156 },
];

function buildGates() {
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

export const neonSkyline = {
    id: 'neon-skyline',
    difficulty: 'advanced',
    order: 110,
    defaultTheme: 'night',
    spawn,
    bounds: { halfSize: 200, ceiling: 150 },
    ground: { size: 440, divisions: 88 },
    palette: {
        pillar: 0x334155,
        hazard: 0xf43f5e,
        tower: 0x475569,
        ring: 0x67e8f9,
        decor: 0x1e293b,
    },
    rings: buildGates(),
    landingPad: { x: 0, z: 168, radius: 5 },
    obstacles: [],
    decor: [
        // --- Street canyon rows (flank the course) ---
        { type: 'building', x: -16, z: 14, width: 15, depth: 16, height: 40, seed: 11 },
        { type: 'building', x: 16, z: 12, width: 16, depth: 18, height: 52, seed: 23, beacon: true },
        { type: 'building', x: -16, z: 44, width: 14, depth: 16, height: 30, seed: 31, windowColor: '#fbbf24' },
        { type: 'building', x: 17, z: 44, width: 15, depth: 17, height: 44, seed: 43 },
        { type: 'building', x: -15, z: 74, width: 16, depth: 18, height: 58, seed: 57, beacon: true },
        { type: 'building', x: 16, z: 74, width: 14, depth: 16, height: 36, seed: 61, windowColor: '#fbbf24' },

        // --- Bridge supports (the span rests on these) ---
        { type: 'building', x: -26, z: 59, width: 10, depth: 10, height: 17, seed: 71, roofProps: false },
        { type: 'building', x: 26, z: 59, width: 10, depth: 10, height: 17, seed: 73, roofProps: false },

        // --- Flyover across the street ---
        { type: 'bridge', x: 0, z: 59, y: 13.5, length: 66, width: 5 },

        // --- Arch gateway between two blocks ---
        { type: 'building', x: 6, z: 100, width: 10, depth: 10, height: 26, seed: 83 },
        { type: 'building', x: 42, z: 100, width: 10, depth: 10, height: 24, seed: 89, windowColor: '#fbbf24' },
        { type: 'arch', x: 24, z: 100, span: 20, height: 22 },

        // --- Low blocks for the rooftop section ---
        { type: 'building', x: 6, z: 112, width: 12, depth: 12, height: 10, seed: 97, roofProps: false },
        { type: 'building', x: -8, z: 124, width: 10, depth: 10, height: 9, seed: 101, roofProps: false },
        { type: 'building', x: 8, z: 138, width: 12, depth: 12, height: 11, seed: 103, roofProps: false },
        { type: 'building', x: -10, z: 152, width: 10, depth: 10, height: 8, seed: 107, roofProps: false },

        // --- Off-course towers for depth ---
        { type: 'building', x: -48, z: 30, width: 14, depth: 14, height: 66, seed: 113, beacon: true },
        { type: 'building', x: 46, z: 26, width: 14, depth: 14, height: 74, seed: 127, windowColor: '#fbbf24' },
        { type: 'building', x: -44, z: 96, width: 14, depth: 14, height: 62, seed: 131, windowColor: '#fbbf24' },
        { type: 'building', x: 48, z: 128, width: 14, depth: 14, height: 70, seed: 137, beacon: true },

        // --- Street markings ---
        { type: 'roadmark', x: 0, z: 50, length: 88 },
        { type: 'roadmark', x: 24, z: 92, length: 16 },

        // --- Distant skyline silhouettes (solid boxes far outside the course) ---
        { type: 'box', x: -190, y: 40, z: 20, width: 20, height: 80, depth: 20 },
        { type: 'box', x: 195, y: 32, z: 60, width: 22, height: 64, depth: 22 },
        { type: 'box', x: -195, y: 36, z: 130, width: 18, height: 72, depth: 18 },
        { type: 'box', x: 190, y: 44, z: 150, width: 20, height: 88, depth: 20 },
    ],
    objectives: { type: 'gates' },
};
