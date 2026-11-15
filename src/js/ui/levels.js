import { t } from '../i18n/index.js';
import { isLevelComplete, subscribeProgress } from '../python/progress.js';
import { getLevelText, listLevels } from '../levels/index.js';

function createOption(level) {
    const text = getLevelText(level);
    const option = document.createElement('option');
    option.value = level.id;
    option.textContent = `${text.name} — ${text.difficulty}${isLevelComplete(level.id) ? ' ✓' : ''}`;
    return option;
}

function appendGroup(select, levels, labelKey) {
    if (!levels.length) return;

    const group = document.createElement('optgroup');
    group.label = t(labelKey);
    levels.forEach((level) => group.appendChild(createOption(level)));
    select.appendChild(group);
}

function populateLevelOptions(select) {
    const current = select.value;

    select.innerHTML = '';
    const levels = listLevels();
    appendGroup(select, levels.filter((level) => level.pythonMission), 'level.group.python');
    appendGroup(select, levels.filter((level) => !level.pythonMission), 'level.group.manual');

    if (current) select.value = current;
}

export function initLevelUI({ onSelect }) {
    const select = document.getElementById('level-select');
    if (!select) return;

    populateLevelOptions(select);
    select.addEventListener('change', () => {
        onSelect(select.value);
    });

    subscribeProgress(() => {
        populateLevelOptions(select);
    });
}

export function setLevelInfo(def) {
    const select = document.getElementById('level-select');
    if (select) {
        populateLevelOptions(select);
        select.value = def.id;
    }

    const text = getLevelText(def);
    const name = document.getElementById('level-name');
    if (name) name.textContent = text.name;

    const counter = document.getElementById('gate-counter');
    if (counter) {
        const total = (def.rings || []).filter((ring) => ring.gate !== false).length;
        counter.textContent = total > 0 ? `0/${total}` : '—';
    }
}

export function refreshLevelUI(def) {
    const select = document.getElementById('level-select');
    if (select) {
        populateLevelOptions(select);
        if (def) select.value = def.id;
    }

    if (!def) return;

    const name = document.getElementById('level-name');
    if (name) name.textContent = getLevelText(def).name;
}
