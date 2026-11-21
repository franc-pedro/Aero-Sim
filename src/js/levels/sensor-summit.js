const RING_RADIUS = 3;
const RING_TUBE = 0.25;

const spawn = { x: 0, y: 1.5, z: 0, yaw: 0 };
const missionPad = { x: 0, z: 16, radius: 3, color: 0x10b981 };

const waypoints = [
    { x: 0, y: 4, z: 4 },
    { x: 0, y: 7, z: 8 },
    { x: 0, y: 10, z: 12 },
];

export const sensorSummit = {
    id: 'sensor-summit',
    difficulty: 'intermediate',
    order: 6,
    defaultTheme: 'night',
    spawn,
    bounds: { halfSize: 40, ceiling: 45 },
    ground: { size: 100, divisions: 40 },
    // Metric test pavilion: ruled walls/floor, height rulers and a marked helipad.
    environment: { type: 'pavilion' },
    landingPad: { radius: 2.5, color: 0x10b981, helipad: true },
    missionPad,
    palette: {
        pillar: 0x8b5cf6,
        hazard: 0xf43f5e,
        tower: 0xD9856C,
        ring: 0xF4BB44,
        decor: 0x877C90,
    },
    obstacles: [
        { x: -12, z: 8, radius: 2, height: 22, kind: 'tower' },
        { x: 12, z: 8, radius: 2, height: 22, kind: 'tower' },
        { x: -12, z: 16, radius: 1.3, height: 12, kind: 'hazard' },
        { x: 12, z: 16, radius: 1.3, height: 12, kind: 'hazard' },
    ],
    rings: waypoints.map((point) => ({
        ...point,
        yaw: 0,
        radius: RING_RADIUS,
        tube: RING_TUBE,
        gate: true,
    })),
    decor: [
        { type: 'box', x: -24, y: 13, z: 8, width: 8, height: 26, depth: 12 },
        { type: 'box', x: 24, y: 13, z: 8, width: 8, height: 26, depth: 12 },
        { type: 'box', x: -22, y: 9, z: 24, width: 8, height: 18, depth: 8 },
        { type: 'box', x: 22, y: 9, z: 24, width: 8, height: 18, depth: 8 },
    ],
    objectives: { type: 'gates' },
    pythonMission: {
        example: 'summit',
        focus: 'sensors',
        titleKey: 'python.mission.sensor-summit.title',
        objectiveKey: 'python.mission.sensor-summit.objective',
        hintKeys: [
            'python.mission.sensor-summit.hint.1',
            'python.mission.sensor-summit.hint.2',
            'python.mission.sensor-summit.hint.3',
            'python.mission.sensor-summit.hint.4',
        ],
        landingPad: missionPad,
        lesson: {
            introKey: 'python.lesson.sensor-summit.intro',
            objectiveKeys: [
                'python.lesson.sensor-summit.objective.1',
                'python.lesson.sensor-summit.objective.2',
                'python.lesson.sensor-summit.objective.3',
            ],
            syntaxKey: 'python.lesson.sensor-summit.syntax',
            syntaxCaptionKey: 'python.lesson.sensor-summit.syntaxCaption',
            vocabularyKeys: [
                'python.lesson.sensor-summit.vocab.1',
                'python.lesson.sensor-summit.vocab.2',
                'python.lesson.sensor-summit.vocab.3',
            ],
            quiz: {
                questionKey: 'python.lesson.sensor-summit.quiz.question',
                optionKeys: [
                    'python.lesson.sensor-summit.quiz.option.1',
                    'python.lesson.sensor-summit.quiz.option.2',
                    'python.lesson.sensor-summit.quiz.option.3',
                ],
                answerIndex: 0,
                explanationKey: 'python.lesson.sensor-summit.quiz.explanation',
            },
        },
    },
};
