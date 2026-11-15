import { t } from '../i18n/index.js';
import { functionForge } from './function-forge.js';
import { loopLagoon } from './loop-lagoon.js';
import { obstacleAlley } from './obstacle-alley.js';
import { pythonPlayground } from './python-playground.js';
import { ringGauntlet } from './ring-gauntlet.js';
import { trainingCourse } from './training-course.js';
import { variableValley } from './variable-valley.js';
import { conditionalCanyon } from './conditional-canyon.js';
import { sensorSummit } from './sensor-summit.js';

export const LEVELS = [
    pythonPlayground,
    loopLagoon,
    functionForge,
    obstacleAlley,
    variableValley,
    conditionalCanyon,
    sensorSummit,
    trainingCourse,
    ringGauntlet,
].sort((a, b) => a.order - b.order);
export const DEFAULT_LEVEL_ID = LEVELS[0].id;

export function getLevel(id) {
    return LEVELS.find((level) => level.id === id) || null;
}

export function listLevels() {
    return LEVELS;
}

export function getLevelForPreset(preset) {
    return LEVELS.find((level) => level.pythonMission?.example === preset) || null;
}

export function getLevelText(def) {
    if (!def) return { name: '', difficulty: '', description: '' };

    const base = `level.${def.id}`;
    return {
        name: t(`${base}.name`),
        difficulty: t(`level.difficulty.${def.difficulty}`),
        description: t(`${base}.description`),
    };
}
