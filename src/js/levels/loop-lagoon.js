const RING_RADIUS = 3;
const RING_TUBE = 0.35;

const spawn = { x: 0, y: 1.5, z: 0, yaw: 0 };

// Gates sit at the midpoint of each side of a 6 x 6 m square. The student
// flies one side at a time and returns to the launch pad at the end.
const gates = [
    { x: 0, y: 4, z: 3, yaw: 0 },
    { x: -3, y: 4, z: 6, yaw: -Math.PI / 2 },
    { x: -6, y: 4, z: 3, yaw: Math.PI },
    { x: -3, y: 4, z: 0, yaw: Math.PI / 2 },
];

export const loopLagoon = {
    id: 'loop-lagoon',
    difficulty: 'beginner',
    order: 1,
    defaultTheme: 'daylight',
    spawn,
    bounds: { halfSize: 30, ceiling: 30 },
    ground: { size: 80, divisions: 32 },
    landingPad: { radius: 2.5, color: 0x10b981 },
    palette: {
        pillar: 0x3b82f6,
        hazard: 0xf43f5e,
        tower: 0x334155,
        ring: 0xf59e0b,
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
        titleKey: 'python.mission.loop-lagoon.title',
        objectiveKey: 'python.mission.loop-lagoon.objective',
        hintKeys: [
            'python.mission.loop-lagoon.hint.1',
            'python.mission.loop-lagoon.hint.2',
            'python.mission.loop-lagoon.hint.3',
            'python.mission.loop-lagoon.hint.4',
        ],
        landingPad: { x: 0, z: 0, radius: 3 },
        lesson: {
            introKey: 'python.lesson.loop-lagoon.intro',
            objectiveKeys: [
                'python.lesson.loop-lagoon.objective.1',
                'python.lesson.loop-lagoon.objective.2',
            ],
            syntaxKey: 'python.lesson.loop-lagoon.syntax',
            syntaxCaptionKey: 'python.lesson.loop-lagoon.syntaxCaption',
            vocabularyKeys: [
                'python.lesson.loop-lagoon.vocab.1',
                'python.lesson.loop-lagoon.vocab.2',
            ],
            quiz: {
                questionKey: 'python.lesson.loop-lagoon.quiz.question',
                optionKeys: [
                    'python.lesson.loop-lagoon.quiz.option.1',
                    'python.lesson.loop-lagoon.quiz.option.2',
                    'python.lesson.loop-lagoon.quiz.option.3',
                ],
                answerIndex: 0,
                explanationKey: 'python.lesson.loop-lagoon.quiz.explanation',
            },
        },
    },
};
