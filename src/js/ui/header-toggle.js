import { droneState } from '../core/state.js';

const SPEED_THRESHOLD_MPS = 0.3;
const CHECK_INTERVAL_MS = 250;

let initialized = false;

function setCollapsed(collapsed) {
    document.body.classList.toggle('header-collapsed', collapsed);
}

export function initHeaderToggle() {
    if (initialized) return;
    initialized = true;

    document.getElementById('btn-header-hide')?.addEventListener('click', () => setCollapsed(true));
    document.getElementById('header-reveal')?.addEventListener('click', () => setCollapsed(false));

    // Auto-hide: colapsa quando o drone está efetivamente em movimento,
    // independentemente da fonte de input (touch, gamepad, teclado).
    window.setInterval(() => {
        if (!document.body.classList.contains('touch-ui')) return;
        const speedSq = SPEED_THRESHOLD_MPS * SPEED_THRESHOLD_MPS;
        if (droneState.vel.lengthSq() > speedSq) setCollapsed(true);
    }, CHECK_INTERVAL_MS);
}
