import { createRng } from './rng.js';

const RING_RADIUS = 3;
const RING_TUBE = 0.25;

const spawn = { x: 0, y: 1.5, z: 0, yaw: 0 };
const finishPad = { x: 0, z: 38, radius: 2.5, color: 0x10b981 };

// A straight slalom corridor along +Z: gates alternate around the centre line
// and the finish pad waits 38 m out. The corridor is flanked by towers so the
// student learns to thread a course rather than fly a straight line.
const gates = [
    { x: 0, y: 2.5, z: 8, yaw: 0 },
    { x: -3, y: 2.5, z: 16, yaw: 0 },
    { x: 3, y: 2.5, z: 24, yaw: 0 },
    { x: -3, y: 2.5, z: 32, yaw: 0 },
];

function generateObstacles() {
    const rng = createRng(0x77c31);
    const obstacles = [];

    // Fixed tower pairs flanking the corridor at every gate.
    gates.forEach((gate, index) => {
        const side = index % 2 === 0 ? -1 : 1;
        obstacles.push({ x: side * 9, z: gate.z, radius: 1.3, height: 10, kind: 'tower' });
    });

    // Seeded practice poles away from the corridor.
    for (let i = 0; i < 10; i++) {
        const height = 5 + rng() * 12;
        const radius = 1.2 + rng() * 1.6;
        let x = 0;
        let z = 0;

        for (let attempt = 0; attempt < 100; attempt++) {
            x = (rng() < 0.5 ? -1 : 1) * (20 + rng() * 18);
            z = (rng() - 0.5) * 76;
            if (Math.max(Math.abs(x), Math.abs(z)) < 42) break;
        }

        obstacles.push({ x, z, radius, height, kind: i % 2 === 0 ? 'pillar' : 'decor' });
    }

    return obstacles;
}

export const racingCircuit = {
    id: 'racing-circuit',
    difficulty: 'intermediate',
    order: 102,
    defaultTheme: 'daylight',
    spawn,
    bounds: { halfSize: 45, ceiling: 30 },
    ground: { size: 110, divisions: 55 },
    environment: { type: 'pavilion' },
    landingPad: { radius: 2.5, helipad: true },
    missionPad: finishPad,
    palette: {
        pillar: 0x0ea5e9,
        hazard: 0xf43f5e,
        tower: 0xf59e0b,
        ring: 0xfbbf24,
        decor: 0x64748b,
        accent: 0x22d3ee,
    },
    obstacles: generateObstacles(),
    rings: gates.map((gate) => ({
        ...gate,
        radius: RING_RADIUS,
        tube: RING_TUBE,
        gate: true,
    })),
    decor: [
        { type: 'box', x: -36, y: 1.25, z: -30, width: 4, height: 2.5, depth: 4 },
        { type: 'box', x: -33, y: 0.9, z: -27.5, width: 2.4, height: 1.8, depth: 2.4 },
        { type: 'box', x: 36, y: 1.25, z: 28, width: 4, height: 2.5, depth: 4 },
        { type: 'box', x: 33, y: 0.9, z: 25.5, width: 2.4, height: 1.8, depth: 2.4 },
    ],
    objectives: { type: 'gates' },
    pythonMission: {
        example: 'racing',
        focus: 'pads',
        titleKey: 'python.mission.racing-circuit.title',
        objectiveKey: 'python.mission.racing-circuit.objective',
        hintKeys: [
            'python.mission.racing-circuit.hint.1',
            'python.mission.racing-circuit.hint.2',
            'python.mission.racing-circuit.hint.3',
            'python.mission.racing-circuit.hint.4',
        ],
        landingPad: { x: finishPad.x, z: finishPad.z, radius: finishPad.radius },
        lesson: {
            introKey: 'python.lesson.racing-circuit.intro',
            objectiveKeys: [
                'python.lesson.racing-circuit.objective.1',
                'python.lesson.racing-circuit.objective.2',
            ],
            syntaxKey: 'python.lesson.racing-circuit.syntax',
            syntaxCaptionKey: 'python.lesson.racing-circuit.syntaxCaption',
            vocabularyKeys: [
                'python.lesson.racing-circuit.vocab.1',
                'python.lesson.racing-circuit.vocab.2',
            ],
            quiz: {
                questionKey: 'python.lesson.racing-circuit.quiz.question',
                optionKeys: [
                    'python.lesson.racing-circuit.quiz.option.1',
                    'python.lesson.racing-circuit.quiz.option.2',
                    'python.lesson.racing-circuit.quiz.option.3',
                ],
                answerIndex: 1,
                explanationKey: 'python.lesson.racing-circuit.quiz.explanation',
            },
        },
    },
};
