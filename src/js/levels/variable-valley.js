const RING_RADIUS = 3;
const RING_TUBE = 0.25;

const spawn = { x: 0, y: 1.5, z: 0, yaw: 0 };
const missionPad = { x: 0, z: 16, radius: 3, color: 0x10b981 };

const waypoints = [
    { x: 0, y: 4, z: 4 },
    { x: 0, y: 5, z: 8 },
    { x: 0, y: 6, z: 12 },
];

export const variableValley = {
    id: 'variable-valley',
    difficulty: 'beginner',
    order: 4,
    defaultTheme: 'daylight',
    spawn,
    bounds: { halfSize: 40, ceiling: 30 },
    ground: { size: 100, divisions: 40 },
    landingPad: { radius: 2.5, color: 0x10b981 },
    missionPad,
    palette: {
        pillar: 0x14b8a6,
        hazard: 0xf43f5e,
        tower: 0x334155,
        ring: 0x6366f1,
        decor: 0x475569,
    },
    obstacles: [
        { x: -14, z: 8, radius: 2, height: 9, kind: 'tower' },
        { x: 14, z: 8, radius: 2, height: 9, kind: 'tower' },
        { x: -10, z: 18, radius: 1.2, height: 6, kind: 'hazard' },
        { x: 10, z: 18, radius: 1.2, height: 6, kind: 'hazard' },
    ],
    rings: waypoints.map((point) => ({
        ...point,
        yaw: 0,
        radius: RING_RADIUS,
        tube: RING_TUBE,
        gate: true,
    })),
    decor: [
        { type: 'box', x: -26, y: 4, z: 10, width: 8, height: 8, depth: 8 },
        { type: 'box', x: 26, y: 4, z: 10, width: 8, height: 8, depth: 8 },
        { type: 'box', x: -22, y: 3, z: 24, width: 6, height: 6, depth: 6 },
        { type: 'box', x: 22, y: 3, z: 24, width: 6, height: 6, depth: 6 },
    ],
    objectives: { type: 'gates' },
    pythonMission: {
        example: 'variables',
        focus: 'variables',
        titleKey: 'python.mission.variable-valley.title',
        objectiveKey: 'python.mission.variable-valley.objective',
        hintKeys: [
            'python.mission.variable-valley.hint.1',
            'python.mission.variable-valley.hint.2',
            'python.mission.variable-valley.hint.3',
            'python.mission.variable-valley.hint.4',
        ],
        landingPad: missionPad,
        lesson: {
            introKey: 'python.lesson.variable-valley.intro',
            objectiveKeys: [
                'python.lesson.variable-valley.objective.1',
                'python.lesson.variable-valley.objective.2',
                'python.lesson.variable-valley.objective.3',
            ],
            syntaxKey: 'python.lesson.variable-valley.syntax',
            syntaxCaptionKey: 'python.lesson.variable-valley.syntaxCaption',
            vocabularyKeys: [
                'python.lesson.variable-valley.vocab.1',
                'python.lesson.variable-valley.vocab.2',
                'python.lesson.variable-valley.vocab.3',
            ],
            quiz: {
                questionKey: 'python.lesson.variable-valley.quiz.question',
                optionKeys: [
                    'python.lesson.variable-valley.quiz.option.1',
                    'python.lesson.variable-valley.quiz.option.2',
                    'python.lesson.variable-valley.quiz.option.3',
                    'python.lesson.variable-valley.quiz.option.4',
                ],
                answerIndex: 0,
                explanationKey: 'python.lesson.variable-valley.quiz.explanation',
            },
        },
    },
};
