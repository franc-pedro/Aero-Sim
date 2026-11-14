import { getLevelText, listLevels } from '../levels/index.js';

function populateLevelOptions(select) {
    const current = select.value;

    select.innerHTML = '';
    listLevels().forEach((level) => {
        const text = getLevelText(level);
        const option = document.createElement('option');
        option.value = level.id;
        option.textContent = `${text.name} — ${text.difficulty}`;
        select.appendChild(option);
    });

    if (current) select.value = current;
}

export function initLevelUI({ onSelect }) {
    const select = document.getElementById('level-select');
    if (!select) return;

    populateLevelOptions(select);
    select.addEventListener('change', () => {
        onSelect(select.value);
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
