import { listLevels } from '../levels/index.js';

export function initLevelUI({ onSelect }) {
    const select = document.getElementById('level-select');
    if (!select) return;

    select.innerHTML = listLevels()
        .map((level) => `<option value="${level.id}">${level.name} — ${level.difficulty}</option>`)
        .join('');

    select.addEventListener('change', () => {
        onSelect(select.value);
    });
}

export function setLevelInfo(def) {
    const select = document.getElementById('level-select');
    if (select && select.value !== def.id) {
        select.value = def.id;
    }

    const name = document.getElementById('level-name');
    if (name) name.textContent = def.name;

    const counter = document.getElementById('gate-counter');
    if (counter) {
        const total = (def.rings || []).filter((ring) => ring.gate !== false).length;
        counter.textContent = total > 0 ? `0/${total}` : '—';
    }
}
