const RING_RADIUS = 3;
const RING_TUBE = 0.25;

const spawn = { x: 0, y: 1.5, z: 0, yaw: 0 };
const missionPad = { x: -5, z: 18, radius: 3, color: 0x10b981 };

const gates = [
    { x: 0, y: 4, z: 5, yaw: 0 },
    { x: -5, y: 4, z: 10, yaw: -Math.PI / 4 },
    { x: -5, y: 4, z: 15, yaw: 0 },
];

export const obstacleAlley = {
    id: 'obstacle-alley',
    difficulty: 'intermediate',
    order: 3,
    defaultTheme: 'daylight',
    spawn,
    bounds: { halfSize: 30, ceiling: 30 },
    ground: { size: 80, divisions: 32 },
    landingPad: { radius: 2.5, color: 0x10b981 },
    missionPad,
    palette: {
        pillar: 0xf97316,
        hazard: 0xf43f5e,
        tower: 0x334155,
        ring: 0xf59e0b,
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
        titleKey: 'python.mission.obstacle-alley.title',
        objectiveKey: 'python.mission.obstacle-alley.objective',
        hintKeys: [
            'python.mission.obstacle-alley.hint.1',
            'python.mission.obstacle-alley.hint.2',
            'python.mission.obstacle-alley.hint.3',
            'python.mission.obstacle-alley.hint.4',
        ],
        landingPad: missionPad,
        lesson: {
            introKey: 'python.lesson.obstacle-alley.intro',
            objectiveKeys: [
                'python.lesson.obstacle-alley.objective.1',
                'python.lesson.obstacle-alley.objective.2',
            ],
            syntaxKey: 'python.lesson.obstacle-alley.syntax',
            syntaxCaptionKey: 'python.lesson.obstacle-alley.syntaxCaption',
            vocabularyKeys: [
                'python.lesson.obstacle-alley.vocab.1',
                'python.lesson.obstacle-alley.vocab.2',
            ],
            quiz: {
                questionKey: 'python.lesson.obstacle-alley.quiz.question',
                optionKeys: [
                    'python.lesson.obstacle-alley.quiz.option.1',
                    'python.lesson.obstacle-alley.quiz.option.2',
                    'python.lesson.obstacle-alley.quiz.option.3',
                ],
                answerIndex: 0,
                explanationKey: 'python.lesson.obstacle-alley.quiz.explanation',
            },
        },
    },
};
