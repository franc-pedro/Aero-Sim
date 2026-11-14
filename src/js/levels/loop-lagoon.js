const RING_RADIUS = 3;
const RING_TUBE = 0.35;

const spawn = { x: 0, y: 1.5, z: 0, yaw: 0 };

// Gates sit at the midpoint of each side of a 4 x 4 m square. The student
// flies one side at a time and returns to the launch pad at the end.
const gates = [
    { x: 0, y: 4, z: 3, yaw: 0 },
    { x: -3, y: 4, z: 6, yaw: -Math.PI / 2 },
    { x: -6, y: 4, z: 3, yaw: Math.PI },
    { x: -3, y: 4, z: 0, yaw: Math.PI / 2 },
];

export const loopLagoon = {
    id: 'loop-lagoon',
    name: 'Loop Lagoon',
    difficulty: 'Beginner',
    order: 1,
    description: 'Fly a square through four gates and practise for loops.',
    i18n: {
        'pt-PT': {
            name: 'Lagoa dos Ciclos',
            difficulty: 'Iniciante',
            description: 'Voa num quadrado por quatro portais e pratica ciclos for.',
        },
    },
    defaultTheme: 'sunset',
    spawn,
    bounds: { halfSize: 30, ceiling: 30 },
    ground: { size: 80, divisions: 32 },
    landingPad: { radius: 2.5, color: 0x10b981 },
    palette: {
        pillar: 0x3b82f6,
        hazard: 0xf43f5e,
        tower: 0x334155,
        ring: 0xfb923c,
        decor: 0x475569,
    },
    obstacles: [
        { x: -13, z: 6, radius: 1.4, height: 9, kind: 'tower' },
        { x: 10, z: 6, radius: 1.4, height: 9, kind: 'tower' },
    ],
    rings: gates.map((gate) => ({
        ...gate,
        radius: RING_RADIUS,
        tube: RING_TUBE,
        gate: true,
    })),
    decor: [
        { type: 'box', x: -18, y: 4, z: 18, width: 6, height: 8, depth: 6 },
        { type: 'box', x: 18, y: 4, z: 18, width: 6, height: 8, depth: 6 },
    ],
    objectives: { type: 'gates' },
    pythonMission: {
        example: 'loop',
        focus: 'loops',
        title: {
            en: 'Loop Lagoon',
            pt: 'Lagoa dos Ciclos',
        },
        objective: {
            en: 'Fly a complete square through the four gates using a loop, then land on the green pad.',
            pt: 'Voa um quadrado completo pelos quatro portais usando um ciclo e aterra na plataforma verde.',
        },
        hints: [
            {
                en: 'Take off, climb 300 cm and set the speed to 100 cm/s.',
                pt: 'Descola, sobe 300 cm e define a velocidade para 100 cm/s.',
            },
            {
                en: 'Each side of the square is 600 cm long. Use two move_forward(300) calls.',
                pt: 'Cada lado do quadrado tem 600 cm. Usa dois move_forward(300).',
            },
            {
                en: 'Use for _ in range(4) and rotate_clockwise(90) after each side.',
                pt: 'Usa for _ in range(4) e rotate_clockwise(90) depois de cada lado.',
            },
            {
                en: 'After the fourth side you are back over the pad. Call tello.land().',
                pt: 'Depois do quarto lado estás de novo sobre a plataforma. Chama tello.land().',
            },
        ],
        landingPad: { x: 0, z: 0, radius: 3 },
    },
};
