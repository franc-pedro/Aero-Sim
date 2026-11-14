const RING_RADIUS = 3;
const RING_TUBE = 0.35;

const spawn = { x: 0, y: 1.5, z: 0, yaw: 0 };
const missionPad = { x: -5, z: 18, radius: 3, color: 0x10b981 };

const gates = [
    { x: 0, y: 4, z: 5, yaw: 0 },
    { x: -5, y: 4, z: 10, yaw: -Math.PI / 4 },
    { x: -5, y: 4, z: 15, yaw: 0 },
];

export const obstacleAlley = {
    id: 'obstacle-alley',
    name: 'Obstacle Alley',
    difficulty: 'Intermediate',
    order: 3,
    description: 'A zig-zag of gates between towers, with a green landing pad at the end.',
    i18n: {
        'pt-PT': {
            name: 'Corredor de Obstáculos',
            difficulty: 'Intermédio',
            description: 'Um zig-zag de portais entre torres, com uma plataforma verde no final.',
        },
    },
    defaultTheme: 'sunset',
    spawn,
    bounds: { halfSize: 30, ceiling: 30 },
    ground: { size: 80, divisions: 32 },
    landingPad: { radius: 2.5, color: 0x10b981 },
    missionPad,
    palette: {
        pillar: 0xf97316,
        hazard: 0xf43f5e,
        tower: 0x334155,
        ring: 0xfbbf24,
        decor: 0x475569,
    },
    obstacles: [
        { x: 6, z: 7.5, radius: 1.2, height: 10, kind: 'tower' },
        { x: -11, z: 7.5, radius: 1.2, height: 10, kind: 'tower' },
        { x: 6, z: 12.5, radius: 1.2, height: 10, kind: 'tower' },
        { x: -11, z: 12.5, radius: 1.2, height: 10, kind: 'tower' },
        { x: 2, z: 18, radius: 1.0, height: 8, kind: 'hazard' },
        { x: -12, z: 18, radius: 1.0, height: 8, kind: 'hazard' },
    ],
    rings: gates.map((gate) => ({
        ...gate,
        radius: RING_RADIUS,
        tube: RING_TUBE,
        gate: true,
    })),
    decor: [
        { type: 'box', x: -18, y: 4, z: 10, width: 5, height: 8, depth: 5 },
        { type: 'box', x: 18, y: 4, z: 10, width: 5, height: 8, depth: 5 },
    ],
    objectives: { type: 'gates' },
    pythonMission: {
        example: 'obstacles',
        focus: 'obstacles',
        title: {
            en: 'Obstacle Alley',
            pt: 'Corredor de Obstáculos',
        },
        objective: {
            en: 'Fly the zig-zag through the three gates between the towers and land on the green pad.',
            pt: 'Faz o zig-zag pelos três portais entre as torres e aterra na plataforma verde.',
        },
        hints: [
            {
                en: 'Take off, climb 300 cm and fly forward 500 cm to the first gate.',
                pt: 'Descola, sobe 300 cm e avança 500 cm até ao primeiro portal.',
            },
            {
                en: 'After the first gate, rotate_clockwise(45) and fly about 700 cm to the second gate.',
                pt: 'Depois do primeiro portal, usa rotate_clockwise(45) e voa cerca de 700 cm até ao segundo.',
            },
            {
                en: 'Then rotate_counter_clockwise(45) and fly 500 cm to the third gate.',
                pt: 'Depois usa rotate_counter_clockwise(45) e voa 500 cm até ao terceiro.',
            },
            {
                en: 'After the third gate, move forward 300 cm to the green pad and land.',
                pt: 'Depois do terceiro portal, avança 300 cm até à plataforma verde e aterra.',
            },
        ],
        landingPad: missionPad,
    },
};
