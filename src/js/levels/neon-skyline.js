const RING_RADIUS = 3.5;
const RING_TUBE = 0.25;

const spawn = { x: 0, y: 1.5, z: 0, yaw: 0 };
const landingPad = { x: 0, z: 72, radius: 5 };
const bounds = { halfSize: 75, ceiling: 60 };

// Gates weave down the street canyon, pass under the flyover, thread the
// street arch and finish with a descent to the landing pad. Altitudes stay
// between 200 and 400 cm so every gate is flyable at Tello scale.
const waypoints = [
    { x: 0, y: 2, z: 10 },
    { x: -3, y: 2.5, z: 17 },
    { x: 0, y: 3, z: 24 },     // under the bridge
    { x: 3, y: 3, z: 30 },     // inside the lateral arch (motion level)
    { x: 4, y: 3.5, z: 38 },
    { x: 12, y: 3, z: 44 },    // through the street arch
    { x: 6, y: 4, z: 50 },
    { x: 2, y: 3.5, z: 58 },   // over the low blocks
    { x: -5, y: 3, z: 64 },
    { x: 0, y: 2, z: 70 },
];

export function buildSkylineGates(waypointList = waypoints) {
    return waypointList.map((point, index) => {
        const previous = index === 0 ? spawn : waypointList[index - 1];
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

// Street lamps along the canyon (solid poles the drone can clip).
function buildStreetLamps() {
    const lamps = [];
    for (let i = 0; i < 12; i++) {
        lamps.push({
            type: 'cylinder',
            x: i % 2 === 0 ? -5 : 5,
            z: 10 + i * 5,
            radius: 0.35,
            height: 7,
            color: 0x1e293b,
        });
    }
    return lamps;
}

export const skylineDecor = [
    // --- Street canyon rows (flank the course) ---
    { type: 'building', x: -9, z: 8, width: 16, depth: 16, height: 40, seed: 11 },
    { type: 'building', x: 9, z: 8, width: 16, depth: 18, height: 52, seed: 23, beacon: true },
    { type: 'building', x: -9, z: 18, width: 14, depth: 16, height: 30, seed: 31, windowColor: '#fbbf24' },
    { type: 'building', x: 9, z: 18, width: 15, depth: 17, height: 44, seed: 43 },
    { type: 'building', x: -9, z: 28, width: 16, depth: 18, height: 58, seed: 57, beacon: true },
    { type: 'building', x: 9, z: 28, width: 14, depth: 16, height: 36, seed: 61, windowColor: '#fbbf24' },
    { type: 'building', x: -9, z: 38, width: 15, depth: 16, height: 44, seed: 71 },
    { type: 'building', x: 9, z: 38, width: 14, depth: 17, height: 30, seed: 73, windowColor: '#fbbf24' },
    { type: 'building', x: -9, z: 48, width: 16, depth: 18, height: 58, seed: 83, beacon: true },
    { type: 'building', x: 9, z: 48, width: 14, depth: 16, height: 42, seed: 89 },
    { type: 'building', x: -9, z: 58, width: 15, depth: 17, height: 34, seed: 97, windowColor: '#fbbf24' },
    { type: 'building', x: 9, z: 58, width: 16, depth: 18, height: 50, seed: 101 },
    { type: 'building', x: -9, z: 68, width: 14, depth: 16, height: 46, seed: 103, beacon: true },
    { type: 'building', x: 9, z: 68, width: 15, depth: 17, height: 38, seed: 107 },

    // --- Flyover across the street (the course passes under it) ---
    { type: 'building', x: -18, z: 24, width: 10, depth: 10, height: 30, seed: 111, roofProps: false },
    { type: 'building', x: 18, z: 24, width: 10, depth: 10, height: 30, seed: 113, roofProps: false },
    { type: 'bridge', x: 0, z: 24, y: 25, length: 80, width: 8 },

    // --- Street arch between two blocks ---
    { type: 'building', x: 5, z: 44, width: 10, depth: 10, height: 24, seed: 121 },
    { type: 'building', x: 20, z: 44, width: 10, depth: 10, height: 22, seed: 127, windowColor: '#fbbf24' },
    { type: 'arch', x: 12, z: 44, span: 16, height: 20 },

    // --- Low blocks for the rooftop section ---
    { type: 'building', x: 5, z: 54, width: 12, depth: 12, height: 8, seed: 131, roofProps: false },
    { type: 'building', x: -8, z: 60, width: 10, depth: 10, height: 9, seed: 137, roofProps: false },
    { type: 'building', x: 7, z: 64, width: 12, depth: 12, height: 10, seed: 139, roofProps: false },

    // --- Off-course towers for depth ---
    { type: 'building', x: -30, z: 15, width: 14, depth: 14, height: 66, seed: 149, beacon: true },
    { type: 'building', x: 30, z: 12, width: 14, depth: 14, height: 74, seed: 151, windowColor: '#fbbf24' },
    { type: 'building', x: -30, z: 45, width: 14, depth: 14, height: 62, seed: 157, windowColor: '#fbbf24' },
    { type: 'building', x: 30, z: 42, width: 14, depth: 14, height: 70, seed: 163, beacon: true },

    // --- Street furniture ---
    ...buildStreetLamps(),
    { type: 'roadmark', x: 0, z: 30, length: 50 },
    { type: 'roadmark', x: 12, z: 40, length: 14 },

    // --- Distant skyline silhouettes (solid boxes far outside the course) ---
    { type: 'box', x: -60, y: 40, z: 15, width: 20, height: 80, depth: 20 },
    { type: 'box', x: 60, y: 32, z: 20, width: 22, height: 64, depth: 22 },
    { type: 'box', x: -62, y: 36, z: 45, width: 18, height: 72, depth: 18 },
    { type: 'box', x: 62, y: 44, z: 50, width: 20, height: 88, depth: 20 },
    { type: 'box', x: 0, y: 30, z: 84, width: 90, height: 60, depth: 16 },
];

export const neonSkyline = {
    id: 'neon-skyline',
    difficulty: 'advanced',
    order: 110,
    defaultTheme: 'night',
    spawn,
    bounds,
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
    landingPad,
    obstacles: [],
    decor: skylineDecor,
    objectives: { type: 'gates' },
};
