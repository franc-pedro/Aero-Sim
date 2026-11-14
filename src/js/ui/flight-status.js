import { controlState, droneState } from '../core/state.js';
import { showToast } from '../core/toast.js';
import { formatNumber, t } from '../i18n/index.js';

const NORMAL_BADGE_CLASS = 'text-[10px] theme-accent-text font-bold tracking-wider theme-accent-bg px-2.5 py-0.5 rounded-full';
const CRASH_BADGE_CLASS = 'text-[10px] font-bold tracking-wider bg-rose-600 text-white px-2.5 py-0.5 rounded-full animate-pulse';

export function refreshFlightStatus() {
    const badge = document.getElementById('flight-mode');
    const vignette = document.getElementById('crash-vignette');
    const crashed = droneState.flight.status === 'crashed';

    if (badge) {
        if (crashed) {
            badge.textContent = t('status.crashed');
            badge.className = CRASH_BADGE_CLASS;
        } else {
            badge.textContent = controlState.mode === 'python'
                ? (controlState.pythonRunning ? t('status.pythonAutopilot') : t('status.pythonStandby'))
                : t('status.mode2AltHold');
            badge.className = NORMAL_BADGE_CLASS;
        }
    }

    if (vignette) {
        vignette.classList.toggle('opacity-100', crashed);
        vignette.classList.toggle('opacity-0', !crashed);
    }
}

export function notifyCrash(cause, impactSpeed) {
    controlState.pythonRunning = false;
    refreshFlightStatus();

    const key = cause === 'ring' ? 'toast.crashRing' : 'toast.crashObstacle';
    const safeSpeed = Number.isFinite(impactSpeed) ? impactSpeed : 0;
    showToast(key, 'warning', () => ({ speed: formatNumber(safeSpeed, 1) }));
}
