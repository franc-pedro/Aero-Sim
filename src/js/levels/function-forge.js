const RING_RADIUS = 3;
const RING_TUBE = 0.25;

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
    difficulty: 'intermediate',
    order: 2,
    defaultTheme: 'night',
    spawn,
    bounds: { halfSize: 30, ceiling: 40 },
    ground: { size: 80, divisions: 32 },
    landingPad: { radius: 2.5, color: 0x10b981 },
    palette: {
        pillar: 0x6366f1,
        hazard: 0xf43f5e,
        tower: 0x1189A7,
        ring: 0x691745,
        decor: 0xA77A11,
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
        titleKey: 'python.mission.function-forge.title',
        objectiveKey: 'python.mission.function-forge.objective',
        hintKeys: [
            'python.mission.function-forge.hint.1',
            'python.mission.function-forge.hint.2',
            'python.mission.function-forge.hint.3',
            'python.mission.function-forge.hint.4',
        ],
        landingPad: { x: 0, z: 0, radius: 3 },
        lesson: {
            introKey: 'python.lesson.function-forge.intro',
            objectiveKeys: [
                'python.lesson.function-forge.objective.1',
                'python.lesson.function-forge.objective.2',
            ],
            syntaxKey: 'python.lesson.function-forge.syntax',
            syntaxCaptionKey: 'python.lesson.function-forge.syntaxCaption',
            vocabularyKeys: [
                'python.lesson.function-forge.vocab.1',
                'python.lesson.function-forge.vocab.2',
            ],
            quiz: {
                questionKey: 'python.lesson.function-forge.quiz.question',
                optionKeys: [
                    'python.lesson.function-forge.quiz.option.1',
                    'python.lesson.function-forge.quiz.option.2',
                    'python.lesson.function-forge.quiz.option.3',
                ],
                answerIndex: 0,
                explanationKey: 'python.lesson.function-forge.quiz.explanation',
            },
        },
    },
};
