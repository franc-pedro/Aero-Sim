import { controlState, droneState } from '../core/state.js';
import { showToast } from '../core/toast.js';

const NORMAL_BADGE_CLASS = 'text-[10px] theme-accent-text font-bold tracking-wider theme-accent-bg px-2.5 py-0.5 rounded-full';
const CRASH_BADGE_CLASS = 'text-[10px] font-bold tracking-wider bg-rose-600 text-white px-2.5 py-0.5 rounded-full animate-pulse';

export function refreshFlightStatus() {
    const badge = document.getElementById('flight-mode');
    const vignette = document.getElementById('crash-vignette');
    const crashed = droneState.flight.status === 'crashed';

    if (badge) {
        if (crashed) {
            badge.textContent = 'CRASHED / R RESET';
            badge.className = CRASH_BADGE_CLASS;
        } else {
            badge.textContent = controlState.mode === 'python'
                ? (controlState.pythonRunning ? 'PYTHON AUTOPILOT' : 'PYTHON STANDBY')
                : 'MODE 2 / ALT HOLD';
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

    const label = cause === 'ring' ? 'Ring frame' : 'Obstacle';
    const speed = Number.isFinite(impactSpeed) ? impactSpeed.toFixed(1) : '0.0';
    showToast(`${label} hit at ${speed} m/s — drone lost. Press R to reset.`, 'warning');
}
