const RING_RADIUS = 3;
const RING_TUBE = 0.25;

const spawn = { x: 0, y: 1.5, z: 0, yaw: 0 };
const missionPad = { x: 0, z: 16, radius: 3, color: 0x10b981 };

const waypoints = [
    { x: 0, y: 4, z: 4 },
    { x: 0, y: 5, z: 8 },
    { x: 0, y: 6, z: 12 },
];

export const conditionalCanyon = {
    id: 'conditional-canyon',
    difficulty: 'intermediate',
    order: 5,
    defaultTheme: 'daylight',
    spawn,
    bounds: { halfSize: 40, ceiling: 35 },
    ground: { size: 100, divisions: 40 },
    // Metric test pavilion: ruled walls/floor, height rulers and a marked helipad.
    environment: { type: 'pavilion' },
    landingPad: { radius: 2.5, color: 0x10b981, helipad: true },
    missionPad,
    palette: {
        pillar: 0xf59e0b,
        hazard: 0xf43f5e,
        tower: 0x7c2d12,
        ring: 0xF4BB44,
        decor: 0x92400e,
    },
    obstacles: [
        { x: -10, z: 8, radius: 2.2, height: 18, kind: 'tower' },
        { x: 10, z: 8, radius: 2.2, height: 18, kind: 'tower' },
        { x: -12, z: 16, radius: 1.4, height: 10, kind: 'hazard' },
        { x: 12, z: 16, radius: 1.4, height: 10, kind: 'hazard' },
    ],
    rings: waypoints.map((point) => ({
        ...point,
        yaw: 0,
        radius: RING_RADIUS,
        tube: RING_TUBE,
        gate: true,
    })),
    decor: [
        { type: 'box', x: -22, y: 9, z: 8, width: 8, height: 18, depth: 16 },
        { type: 'box', x: 22, y: 9, z: 8, width: 8, height: 18, depth: 16 },
        { type: 'box', x: -24, y: 6, z: 22, width: 8, height: 12, depth: 8 },
        { type: 'box', x: 24, y: 6, z: 22, width: 8, height: 12, depth: 8 },
    ],
    objectives: { type: 'gates' },
    pythonMission: {
        example: 'conditionals',
        focus: 'conditionals',
        titleKey: 'python.mission.conditional-canyon.title',
        objectiveKey: 'python.mission.conditional-canyon.objective',
        hintKeys: [
            'python.mission.conditional-canyon.hint.1',
            'python.mission.conditional-canyon.hint.2',
            'python.mission.conditional-canyon.hint.3',
            'python.mission.conditional-canyon.hint.4',
        ],
        landingPad: missionPad,
        lesson: {
            introKey: 'python.lesson.conditional-canyon.intro',
            objectiveKeys: [
                'python.lesson.conditional-canyon.objective.1',
                'python.lesson.conditional-canyon.objective.2',
                'python.lesson.conditional-canyon.objective.3',
            ],
            syntaxKey: 'python.lesson.conditional-canyon.syntax',
            syntaxCaptionKey: 'python.lesson.conditional-canyon.syntaxCaption',
            vocabularyKeys: [
                'python.lesson.conditional-canyon.vocab.1',
                'python.lesson.conditional-canyon.vocab.2',
                'python.lesson.conditional-canyon.vocab.3',
            ],
            quiz: {
                questionKey: 'python.lesson.conditional-canyon.quiz.question',
                optionKeys: [
                    'python.lesson.conditional-canyon.quiz.option.1',
                    'python.lesson.conditional-canyon.quiz.option.2',
                    'python.lesson.conditional-canyon.quiz.option.3',
                ],
                answerIndex: 0,
                explanationKey: 'python.lesson.conditional-canyon.quiz.explanation',
            },
        },
    },
};
