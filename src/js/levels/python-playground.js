const RING_RADIUS = 3;
const RING_TUBE = 0.35;

const spawn = { x: 0, y: 1.5, z: 0, yaw: 0 };
const missionPad = { x: 0, z: 15, radius: 3, color: 0x10b981 };

// A short straight course keeps the first Python mission achievable with
// 100-400 cm commands and leaves plenty of room for the landing pad.
const waypoints = [
    { x: 0, y: 4, z: 4 },
    { x: 0, y: 5, z: 8 },
    { x: 0, y: 6, z: 12 },
];

function buildRings() {
    return waypoints.map((point) => ({
        ...point,
        yaw: 0,
        radius: RING_RADIUS,
        tube: RING_TUBE,
        gate: true,
    }));
}

export const pythonPlayground = {
    id: 'python-playground',
    name: 'Python Playground',
    difficulty: 'Beginner',
    order: 0,
    description: 'A compact three-gate course designed for the Python Lab.',
    i18n: {
        'pt-PT': {
            name: 'Playground Python',
            difficulty: 'Iniciante',
            description: 'Um percurso compacto de três portais para o Laboratório Python.',
        },
    },
    defaultTheme: 'daylight',
    spawn,
    bounds: { halfSize: 40, ceiling: 30 },
    ground: { size: 100, divisions: 40 },
    landingPad: { radius: 2.5 },
    missionPad,
    palette: {
        pillar: 0x3b82f6,
        hazard: 0xf43f5e,
        tower: 0x334155,
        ring: 0x0ea5e9,
        decor: 0x475569,
    },
    obstacles: [
        { x: -14, z: 8, radius: 2, height: 8, kind: 'tower' },
        { x: 14, z: 8, radius: 2, height: 8, kind: 'tower' },
    ],
    rings: buildRings(),
    decor: [
        { type: 'box', x: -24, y: 3, z: 22, width: 6, height: 6, depth: 6 },
        { type: 'box', x: 24, y: 3, z: 22, width: 6, height: 6, depth: 6 },
    ],
    objectives: { type: 'gates' },
    pythonMission: {
        title: {
            en: 'Playground Circuit',
            pt: 'Circuito do Playground',
        },
        objective: {
            en: 'Take off, fly through all three rings and land on the green pad.',
            pt: 'Descola, atravessa os três anéis e aterra na plataforma verde.',
        },
        hints: [
            {
                en: 'Start with tello.connect() and tello.takeoff().',
                pt: 'Começa com tello.connect() e tello.takeoff().',
            },
            {
                en: 'Climb to the first ring with move_up(300), then move_forward(400).',
                pt: 'Sobe até ao primeiro anel com move_up(300) e depois move_forward(400).',
            },
            {
                en: 'Climb 100 cm before each of the next two rings.',
                pt: 'Sobe 100 cm antes de cada um dos dois anéis seguintes.',
            },
            {
                en: 'After the third ring, move forward 300 cm to the green pad and call tello.land().',
                pt: 'Depois do terceiro anel, avança 300 cm até à plataforma verde e chama tello.land().',
            },
        ],
        landingPad: missionPad,
    },
};
