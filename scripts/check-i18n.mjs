import en from '../src/js/i18n/en.js';
import ptPT from '../src/js/i18n/pt-PT.js';
import { LEVELS } from '../src/js/levels/index.js';

const CATALOGS = [['en', en], ['pt-PT', ptPT]];
const errors = [];
const checkedKeys = new Set();

function requireKey(key) {
    checkedKeys.add(key);
    for (const [locale, catalog] of CATALOGS) {
        if (typeof catalog[key] !== 'string' || catalog[key].length === 0) {
            errors.push(`[${locale}] missing translation key: ${key}`);
        }
    }
}

for (const level of LEVELS) {
    if ('name' in level || 'description' in level || 'i18n' in level) {
        errors.push(`[level:${level.id}] display text or legacy i18n block found in level definition`);
    }

    requireKey(`level.${level.id}.name`);
    requireKey(`level.${level.id}.description`);
    requireKey(`level.difficulty.${level.difficulty}`);

    const mission = level.pythonMission;
    if (!mission) continue;

    if ('title' in mission || 'objective' in mission || 'hints' in mission) {
        errors.push(`[mission:${level.id}] localized text found in mission definition`);
    }

    if (mission.focus) {
        requireKey(`python.focus.${mission.focus}`);
    }

    if (typeof mission.titleKey !== 'string' || mission.titleKey.length === 0) {
        errors.push(`[mission:${level.id}] missing titleKey`);
    } else {
        requireKey(mission.titleKey);
    }

    if (typeof mission.objectiveKey !== 'string' || mission.objectiveKey.length === 0) {
        errors.push(`[mission:${level.id}] missing objectiveKey`);
    } else {
        requireKey(mission.objectiveKey);
    }

    if (!Array.isArray(mission.hintKeys) || mission.hintKeys.length === 0) {
        errors.push(`[mission:${level.id}] missing hintKeys`);
    } else {
        mission.hintKeys.forEach((key, index) => {
            if (typeof key !== 'string' || key.length === 0) {
                errors.push(`[mission:${level.id}] invalid hint key at index ${index}`);
                return;
            }
            requireKey(key);
        });
    }

    const lesson = mission.lesson;
    if (lesson) {
        if (typeof lesson.introKey !== 'string' || lesson.introKey.length === 0) {
            errors.push(`[lesson:${level.id}] missing introKey`);
        } else {
            requireKey(lesson.introKey);
        }

        if (!Array.isArray(lesson.objectiveKeys) || lesson.objectiveKeys.length === 0) {
            errors.push(`[lesson:${level.id}] missing objectiveKeys`);
        } else {
            lesson.objectiveKeys.forEach((key, index) => {
                if (typeof key !== 'string' || key.length === 0) {
                    errors.push(`[lesson:${level.id}] invalid objective key at index ${index}`);
                    return;
                }
                requireKey(key);
            });
        }

        if (typeof lesson.syntaxKey !== 'string' || lesson.syntaxKey.length === 0) {
            errors.push(`[lesson:${level.id}] missing syntaxKey`);
        } else {
            requireKey(lesson.syntaxKey);
        }

        if (typeof lesson.syntaxCaptionKey !== 'string' || lesson.syntaxCaptionKey.length === 0) {
            errors.push(`[lesson:${level.id}] missing syntaxCaptionKey`);
        } else {
            requireKey(lesson.syntaxCaptionKey);
        }

        if (!Array.isArray(lesson.vocabularyKeys) || lesson.vocabularyKeys.length === 0) {
            errors.push(`[lesson:${level.id}] missing vocabularyKeys`);
        } else {
            lesson.vocabularyKeys.forEach((key, index) => {
                if (typeof key !== 'string' || key.length === 0) {
                    errors.push(`[lesson:${level.id}] invalid vocabulary key at index ${index}`);
                    return;
                }
                requireKey(key);
            });
        }

        const quiz = lesson.quiz;
        if (!quiz) {
            errors.push(`[lesson:${level.id}] missing quiz`);
        } else {
            if (typeof quiz.questionKey !== 'string' || quiz.questionKey.length === 0) {
                errors.push(`[lesson:${level.id}] missing quiz questionKey`);
            } else {
                requireKey(quiz.questionKey);
            }

            if (!Array.isArray(quiz.optionKeys) || quiz.optionKeys.length < 2) {
                errors.push(`[lesson:${level.id}] quiz needs at least two optionKeys`);
            } else {
                quiz.optionKeys.forEach((key, index) => {
                    if (typeof key !== 'string' || key.length === 0) {
                        errors.push(`[lesson:${level.id}] invalid quiz option key at index ${index}`);
                        return;
                    }
                    requireKey(key);
                });
                if (
                    !Number.isInteger(quiz.answerIndex)
                    || quiz.answerIndex < 0
                    || quiz.answerIndex >= quiz.optionKeys.length
                ) {
                    errors.push(`[lesson:${level.id}] quiz answerIndex is out of range`);
                }
            }

            if (typeof quiz.explanationKey !== 'string' || quiz.explanationKey.length === 0) {
                errors.push(`[lesson:${level.id}] missing quiz explanationKey`);
            } else {
                requireKey(quiz.explanationKey);
            }
        }
    }
}

const enKeys = Object.keys(en);
const ptKeys = Object.keys(ptPT);

for (const key of enKeys) {
    if (!(key in ptPT)) errors.push(`[pt-PT] catalog is missing key present in en: ${key}`);
}
for (const key of ptKeys) {
    if (!(key in en)) errors.push(`[en] catalog is missing key present in pt-PT: ${key}`);
}

if (errors.length > 0) {
    console.error(`[i18n] ${errors.length} problem(s) found:`);
    errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
}

console.log(`[i18n] ${LEVELS.length} levels checked, ${checkedKeys.size} required keys present in ${CATALOGS.length} catalogs.`);
