const RING_RADIUS = 3;
const RING_TUBE = 0.25;

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
    difficulty: 'beginner',
    order: 0,
    defaultTheme: 'daylight',
    spawn,
    bounds: { halfSize: 40, ceiling: 30 },
    ground: { size: 100, divisions: 40 },
    landingPad: { radius: 2.5 },
    missionPad,
    palette: {
        pillar: 0x3b82f6,
        hazard: 0xf43f5e,
        tower: 0xD7A94B,
        ring: 0xFFBF00,
        decor: 0xD22B2B,
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
        example: 'playground',
        focus: 'sequence',
        titleKey: 'python.mission.python-playground.title',
        objectiveKey: 'python.mission.python-playground.objective',
        hintKeys: [
            'python.mission.python-playground.hint.1',
            'python.mission.python-playground.hint.2',
            'python.mission.python-playground.hint.3',
            'python.mission.python-playground.hint.4',
        ],
        landingPad: missionPad,
        lesson: {
            introKey: 'python.lesson.python-playground.intro',
            objectiveKeys: [
                'python.lesson.python-playground.objective.1',
                'python.lesson.python-playground.objective.2',
            ],
            syntaxKey: 'python.lesson.python-playground.syntax',
            syntaxCaptionKey: 'python.lesson.python-playground.syntaxCaption',
            vocabularyKeys: [
                'python.lesson.python-playground.vocab.1',
                'python.lesson.python-playground.vocab.2',
            ],
            quiz: {
                questionKey: 'python.lesson.python-playground.quiz.question',
                optionKeys: [
                    'python.lesson.python-playground.quiz.option.1',
                    'python.lesson.python-playground.quiz.option.2',
                    'python.lesson.python-playground.quiz.option.3',
                ],
                answerIndex: 0,
                explanationKey: 'python.lesson.python-playground.quiz.explanation',
            },
        },
    },
};
