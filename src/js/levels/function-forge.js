const RING_RADIUS = 3;
const RING_TUBE = 0.35;

const spawn = { x: 0, y: 1.5, z: 0, yaw: 0 };
const LAP_ONE_Y = 4;
const LAP_TWO_Y = 11;

const squareGateOffsets = [
    { x: 0, z: 3, yaw: 0 },
    { x: -3, z: 6, yaw: -Math.PI / 2 },
    { x: -6, z: 3, yaw: Math.PI },
    { x: -3, z: 0, yaw: Math.PI / 2 },
];

const gates = [
    ...squareGateOffsets.map((gate) => ({ ...gate, y: LAP_ONE_Y })),
    ...squareGateOffsets.map((gate) => ({ ...gate, y: LAP_TWO_Y })),
];

export const functionForge = {
    id: 'function-forge',
    name: 'Function Forge',
    difficulty: 'Intermediate',
    order: 2,
    description: 'Repeat the same square at two altitudes with a reusable function.',
    i18n: {
        'pt-PT': {
            name: 'Forja de Funções',
            difficulty: 'Intermédio',
            description: 'Repete o mesmo quadrado a duas altitudes com uma função reutilizável.',
        },
    },
    defaultTheme: 'night',
    spawn,
    bounds: { halfSize: 30, ceiling: 40 },
    ground: { size: 80, divisions: 32 },
    landingPad: { radius: 2.5, color: 0x10b981 },
    palette: {
        pillar: 0x6366f1,
        hazard: 0xf43f5e,
        tower: 0x1e293b,
        ring: 0x22d3ee,
        decor: 0x334155,
    },
    obstacles: [
        { x: -13, z: 6, radius: 1.4, height: 18, kind: 'tower' },
        { x: 10, z: 6, radius: 1.4, height: 18, kind: 'tower' },
    ],
    rings: gates.map((gate) => ({
        ...gate,
        radius: RING_RADIUS,
        tube: RING_TUBE,
        gate: true,
    })),
    decor: [
        { type: 'box', x: -18, y: 10, z: 18, width: 6, height: 20, depth: 6 },
        { type: 'box', x: 18, y: 10, z: 18, width: 6, height: 20, depth: 6 },
    ],
    objectives: { type: 'gates' },
    pythonMission: {
        example: 'functions',
        focus: 'functions',
        title: {
            en: 'Function Forge',
            pt: 'Forja de Funções',
        },
        objective: {
            en: 'Repeat the square at two altitudes using one reusable function, then land on the pad.',
            pt: 'Repete o quadrado a duas altitudes com uma função reutilizável e aterra na plataforma.',
        },
        hints: [
            {
                en: 'Define fly_square() with a loop that flies four 600 cm sides (two move_forward(300)).',
                pt: 'Define fly_square() com um ciclo que percorre quatro lados de 600 cm (dois move_forward(300)).',
            },
            {
                en: 'Call fly_square() once at 4 m.',
                pt: 'Chama fly_square() uma vez a 4 m.',
            },
            {
                en: 'Climb 700 cm with move_up(500) and move_up(200), then call fly_square() again.',
                pt: 'Sobe 700 cm com move_up(500) e move_up(200) e chama fly_square() outra vez.',
            },
            {
                en: 'After the second square you are back over the pad. Land with tello.land().',
                pt: 'Depois do segundo quadrado estás de novo sobre a plataforma. Aterra com tello.land().',
            },
        ],
        landingPad: { x: 0, z: 0, radius: 3 },
    },
};
