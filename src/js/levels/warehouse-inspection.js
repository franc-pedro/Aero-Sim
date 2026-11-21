import { createRng } from './rng.js';

const RING_RADIUS = 3;
const RING_TUBE = 0.25;

const spawn = { x: 0, y: 1.5, z: -32, yaw: 0 };
const dockPad = { radius: 2.5, helipad: true };
const codeA = { x: -24, z: -2, radius: 2.5, color: 0xf59e0b, detectHeight: 3 };
const codeB = { x: 24, z: -2, radius: 2.5, color: 0x38bdf8, detectHeight: 3 };

// Industrial warehouse: four pallet racks form aisles A, B and C. The survey
// mission flies aisle B (z = -2), reads the two box-code pads at its ends and
// returns to the loading dock. Gate heights sit at 200 cm.
const gates = [
    { x: -18, y: 2, z: -2, yaw: Math.PI / 2 },
    { x: 0, y: 2, z: -2, yaw: Math.PI / 2 },
    { x: 18, y: 2, z: -2, yaw: Math.PI / 2 },
];

const shelfRows = [-14, -6, 2, 10];

export const warehouseInspection = {
    id: 'warehouse-inspection',
    difficulty: 'advanced',
    order: 103,
    defaultTheme: 'daylight',
    spawn,
    bounds: { halfSize: 40, ceiling: 35 },
    ground: { size: 100, divisions: 50 },
    environment: { type: 'pavilion' },
    landingPad: dockPad,
    missionPad: codeA,
    pads: [codeB],
    palette: {
        pillar: 0x0ea5e9,
        hazard: 0xf43f5e,
        tower: 0xf59e0b,
        ring: 0xfbbf24,
        decor: 0x475569,
        accent: 0x22d3ee,
    },
    rings: gates.map((gate) => ({
        ...gate,
        radius: RING_RADIUS,
        tube: RING_TUBE,
        gate: true,
    })),
    decor: [
        // Aisle racking (four rows, two units each, gap at x = 0 for forklifts)
        { type: 'shelf', x: -13, z: -14, length: 20, depth: 6, height: 8, bays: 4, levels: 3, seed: 11 },
        { type: 'shelf', x: 13, z: -14, length: 20, depth: 6, height: 8, bays: 4, levels: 3, seed: 23 },
        { type: 'shelf', x: -13, z: -6, length: 20, depth: 6, height: 8, bays: 4, levels: 3, seed: 37 },
        { type: 'shelf', x: 13, z: -6, length: 20, depth: 6, height: 8, bays: 4, levels: 3, seed: 41 },
        { type: 'shelf', x: -13, z: 2, length: 20, depth: 6, height: 8, bays: 4, levels: 3, seed: 53 },
        { type: 'shelf', x: 13, z: 2, length: 20, depth: 6, height: 8, bays: 4, levels: 3, seed: 67 },
        { type: 'shelf', x: -13, z: 10, length: 20, depth: 6, height: 8, bays: 4, levels: 3, seed: 79 },
        { type: 'shelf', x: 13, z: 10, length: 20, depth: 6, height: 8, bays: 4, levels: 3, seed: 83 },
        // Pallet stacks waiting near the dock
        { type: 'box', x: -14, y: 0.6, z: -24, width: 2.4, height: 1.2, depth: 2.4 },
        { type: 'box', x: -11.2, y: 0.5, z: -24.4, width: 1.8, height: 1, depth: 1.8 },
        { type: 'box', x: 14, y: 0.6, z: -24, width: 2.4, height: 1.2, depth: 2.4 },
        { type: 'box', x: 11.2, y: 0.5, z: -24.4, width: 1.8, height: 1, depth: 1.8 },
    ],
    objectives: { type: 'gates' },
    pythonMission: {
        example: 'warehouse',
        focus: 'capstone',
        titleKey: 'python.mission.warehouse-inspection.title',
        objectiveKey: 'python.mission.warehouse-inspection.objective',
        hintKeys: [
            'python.mission.warehouse-inspection.hint.1',
            'python.mission.warehouse-inspection.hint.2',
            'python.mission.warehouse-inspection.hint.3',
            'python.mission.warehouse-inspection.hint.4',
        ],
        landingPad: { x: spawn.x, z: spawn.z, radius: dockPad.radius },
        lesson: {
            introKey: 'python.lesson.warehouse-inspection.intro',
            objectiveKeys: [
                'python.lesson.warehouse-inspection.objective.1',
                'python.lesson.warehouse-inspection.objective.2',
            ],
            syntaxKey: 'python.lesson.warehouse-inspection.syntax',
            syntaxCaptionKey: 'python.lesson.warehouse-inspection.syntaxCaption',
            vocabularyKeys: [
                'python.lesson.warehouse-inspection.vocab.1',
                'python.lesson.warehouse-inspection.vocab.2',
            ],
            quiz: {
                questionKey: 'python.lesson.warehouse-inspection.quiz.question',
                optionKeys: [
                    'python.lesson.warehouse-inspection.quiz.option.1',
                    'python.lesson.warehouse-inspection.quiz.option.2',
                    'python.lesson.warehouse-inspection.quiz.option.3',
                ],
                answerIndex: 0,
                explanationKey: 'python.lesson.warehouse-inspection.quiz.explanation',
            },
        },
    },
};
