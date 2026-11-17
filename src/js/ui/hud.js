import { droneState, gamepadState } from '../core/state.js';
import { t } from '../i18n/index.js';
import { initFPVHUD, refreshFPVHUD, updateFPVHUD } from './fpv-hud.js';

const STICKS_INTERVAL = 1 / 30;
const AXES_INTERVAL_MS = 1000 / 30;

let sticksAccumulator = 1;
let lastAxesUpdate = 0;
let lastAxes = null;

function setText(id, text) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
}

export function initAxesBars() {
    initFPVHUD();

    const axesBarContainer = document.getElementById('axes-bar-container');
    if (!axesBarContainer) return;

    axesBarContainer.innerHTML = '';
    for (let i = 0; i < 8; i++) {
        axesBarContainer.innerHTML += `
            <div class="fpv-axis-cell">
                <div class="fpv-axis-track">
                    <div id="axis-bar-${i}" class="fpv-axis-bar"></div>
                </div>
                <span id="axis-label-${i}" class="fpv-axis-label">A${i}</span>
            </div>
        `;
    }
}

export function updateAxesBars(axes, force = false) {
    lastAxes = axes;

    const now = performance.now();
    if (!force && now - lastAxesUpdate < AXES_INTERVAL_MS) return;
    lastAxesUpdate = now;

    for (let i = 0; i < 8; i++) {
        const bar = document.getElementById(`axis-bar-${i}`);
        const lbl = document.getElementById(`axis-label-${i}`);
        if (!bar || !lbl) continue;

        if (i < axes.length) {
            const v = Math.max(-1, Math.min(1, axes[i]));
            const pct = Math.abs(v) * 50;
            bar.style.width = `${pct}%`;
            bar.style.marginLeft = v >= 0 ? '50%' : `${50 - pct}%`;
            const isActivePitch = (gamepadState.selectedPitchAxis === 'auto'
                ? gamepadState.detectedPitchAxisIndex === i
                : Number(gamepadState.selectedPitchAxis) === i);
            bar.className = `fpv-axis-bar ${isActivePitch ? 'fpv-axis-bar-active' : ''}`;
            lbl.className = `fpv-axis-label ${isActivePitch ? 'fpv-axis-label-active' : ''}`;
        } else {
            bar.style.width = '0%';
            lbl.className = 'fpv-axis-label';
        }
    }

    const rawEl = document.getElementById('raw-axes-readout');
    if (rawEl) {
        const idx = gamepadState.detectedPitchAxisIndex;
        const text = axes[idx] !== undefined
            ? t('hud.rawAxisValue', { channel: idx, value: axes[idx].toFixed(2) })
            : t('hud.rawAxisNoValue', { channel: idx });
        if (rawEl.textContent !== text) rawEl.textContent = text;
    }
}

// --- HUD Telemetry Update (throttled) ---
export function updateHUD(dt) {
    sticksAccumulator += dt;

    updateFPVHUD(dt);

    const updateSticks = sticksAccumulator >= STICKS_INTERVAL;
    if (!updateSticks) return;

    sticksAccumulator = 0;

    const normThrottle = (droneState.throttle / 50) - 1; // -1 to +1
    setText('debug-pitch', droneState.pitch.toFixed(2));
    setText('debug-roll', droneState.roll.toFixed(2));
    setText('debug-yaw', droneState.yaw.toFixed(2));
    setText('debug-thr', normThrottle.toFixed(2));

    const maxStickOffset = 16; // pixels within 46px stick circle
    const leftDot = document.getElementById('stick-left-dot');
    const rightDot = document.getElementById('stick-right-dot');
    if (leftDot) {
        leftDot.style.transform = `translate(${(-droneState.yaw * maxStickOffset).toFixed(1)}px, ${(-normThrottle * maxStickOffset).toFixed(1)}px)`;
    }
    if (rightDot) {
        rightDot.style.transform = `translate(${(droneState.roll * maxStickOffset).toFixed(1)}px, ${(-droneState.pitch * maxStickOffset).toFixed(1)}px)`;
    }
}

export function refreshHUD() {
    sticksAccumulator = 1;
    refreshFPVHUD();
    updateHUD(1);

    if (lastAxes) {
        updateAxesBars(lastAxes, true);
    }
}
