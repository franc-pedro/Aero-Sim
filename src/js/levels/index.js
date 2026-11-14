import { getLocale } from '../i18n/index.js';
import { ringGauntlet } from './ring-gauntlet.js';
import { trainingCourse } from './training-course.js';

export const LEVELS = [trainingCourse, ringGauntlet].sort((a, b) => a.order - b.order);
export const DEFAULT_LEVEL_ID = LEVELS[0].id;

export function getLevel(id) {
    return LEVELS.find((level) => level.id === id) || null;
}

export function listLevels() {
    return LEVELS;
}

export function getLevelText(def) {
    if (!def) return { name: '', difficulty: '', description: '' };

    const localized = def.i18n?.[getLocale()] || {};
    return {
        name: localized.name ?? def.name,
        difficulty: localized.difficulty ?? def.difficulty,
        description: localized.description ?? def.description,
    };
}
