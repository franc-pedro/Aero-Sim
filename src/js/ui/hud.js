import { droneState, gamepadState } from '../core/state.js';
import { formatNumber, t } from '../i18n/index.js';

const TELEMETRY_INTERVAL = 1 / 12;
const STICKS_INTERVAL = 1 / 30;
const AXES_INTERVAL_MS = 1000 / 30;

let telemetryAccumulator = 1;
let sticksAccumulator = 1;
let lastAxesUpdate = 0;
let lastAxes = null;

const textCache = new Map();
let batteryDangerState = null;

function setText(id, text) {
    if (textCache.get(id) === text) return;
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    textCache.set(id, text);
}

export function initAxesBars() {
    const axesBarContainer = document.getElementById('axes-bar-container');
    if (!axesBarContainer) return;

    axesBarContainer.innerHTML = '';
    for (let i = 0; i < 8; i++) {
        axesBarContainer.innerHTML += `
            <div class="flex flex-col items-center gap-0.5">
                <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex items-center">
                    <div id="axis-bar-${i}" class="axis-bar h-full bg-cyan-400"></div>
                </div>
                <span id="axis-label-${i}" class="text-[9px] font-mono text-slate-400">A${i}</span>
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
            const barClass = `axis-bar h-full ${isActivePitch ? 'bg-emerald-400' : 'bg-cyan-400'}`;
            const labelClass = `text-[9px] font-mono ${isActivePitch ? 'text-emerald-400 font-bold' : 'text-slate-400'}`;
            if (bar.className !== barClass) bar.className = barClass;
            if (lbl.className !== labelClass) lbl.className = labelClass;
        } else {
            bar.style.width = '0%';
            const labelClass = 'text-[9px] font-mono text-slate-600';
            if (lbl.className !== labelClass) lbl.className = labelClass;
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
    telemetryAccumulator += dt;
    sticksAccumulator += dt;

    const updateTelemetry = telemetryAccumulator >= TELEMETRY_INTERVAL;
    const updateSticks = sticksAccumulator >= STICKS_INTERVAL;
    if (!updateTelemetry && !updateSticks) return;

    if (updateTelemetry) {
        telemetryAccumulator = 0;

        setText('telemetry-alt', `${formatNumber(droneState.renderPos.y, 1)} m`);
        setText('telemetry-speed', `${formatNumber(droneState.vel.length(), 1)} m/s`);
        setText('telemetry-throttle', `${Math.round(droneState.throttle)}%`);

        const batVal = Math.round(droneState.battery);
        setText('telemetry-battery', `${batVal}%`);

        const objectives = droneState.objectives;
        setText(
            'gate-counter',
            objectives.gatesTotal > 0
                ? `${objectives.gatesPassed}/${objectives.gatesTotal}`
                : '—'
        );

        const batteryEl = document.getElementById('telemetry-battery');
        const isDanger = batVal < 20;
        if (batteryEl && batteryDangerState !== isDanger) {
            batteryEl.className = isDanger
                ? 'text-lg font-mono font-bold text-rose-500 animate-pulse'
                : 'text-lg font-mono font-bold text-emerald-500';
            batteryDangerState = isDanger;
        }
    }

    if (updateSticks) {
        sticksAccumulator = 0;

        const normThrottle = (droneState.throttle / 50) - 1; // -1 to +1
        setText('debug-pitch', droneState.pitch.toFixed(2));
        setText('debug-roll', droneState.roll.toFixed(2));
        setText('debug-yaw', droneState.yaw.toFixed(2));
        setText('debug-thr', normThrottle.toFixed(2));

        const maxStickOffset = 20; // pixels within 56x56 stick circle
        const leftDot = document.getElementById('stick-left-dot');
        const rightDot = document.getElementById('stick-right-dot');
        if (leftDot) {
            leftDot.style.transform = `translate(${(-droneState.yaw * maxStickOffset).toFixed(1)}px, ${(-normThrottle * maxStickOffset).toFixed(1)}px)`;
        }
        if (rightDot) {
            rightDot.style.transform = `translate(${(droneState.roll * maxStickOffset).toFixed(1)}px, ${(-droneState.pitch * maxStickOffset).toFixed(1)}px)`;
        }
    }
}

export function refreshHUD() {
    textCache.clear();
    telemetryAccumulator = 1;
    sticksAccumulator = 1;
    updateHUD(1);

    if (lastAxes) {
        updateAxesBars(lastAxes, true);
    }
}
