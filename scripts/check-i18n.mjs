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
