import { droneState, gamepadState } from '../core/state.js';

export function initAxesBars() {
    const axesBarContainer = document.getElementById('axes-bar-container');
    if (!axesBarContainer) return;

    axesBarContainer.innerHTML = '';
    for (let i = 0; i < 8; i++) {
        axesBarContainer.innerHTML += `
            <div class="flex flex-col items-center gap-0.5">
                <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex items-center">
                    <div id="axis-bar-${i}" class="axis-bar h-full bg-cyan-400 transition-all duration-75"></div>
                </div>
                <span id="axis-label-${i}" class="text-[9px] font-mono text-slate-400">A${i}</span>
            </div>
        `;
    }
}

export function updateAxesBars(axes) {
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
            bar.className = `axis-bar h-full transition-all duration-75 ${isActivePitch ? 'bg-emerald-400' : 'bg-cyan-400'}`;
            lbl.className = `text-[9px] font-mono ${isActivePitch ? 'text-emerald-400 font-bold' : 'text-slate-400'}`;
        } else {
            bar.style.width = '0%';
            lbl.className = 'text-[9px] font-mono text-slate-600';
        }
    }
}

// --- HUD Telemetry Update ---
export function updateHUD() {
    document.getElementById('telemetry-alt').innerText = `${droneState.pos.y.toFixed(1)} m`;
    document.getElementById('telemetry-speed').innerText = `${droneState.vel.length().toFixed(1)} m/s`;
    document.getElementById('telemetry-throttle').innerText = `${Math.round(droneState.throttle)}%`;

    const batteryEl = document.getElementById('telemetry-battery');
    const batVal = Math.round(droneState.battery);
    batteryEl.innerText = `${batVal}%`;
    batteryEl.className = batVal < 20
        ? 'text-lg font-mono font-bold text-rose-500 animate-pulse'
        : 'text-lg font-mono font-bold text-emerald-500';

    // Update Live Stick Debugger Values & Visual Dots
    const normThrottle = (droneState.throttle / 50) - 1; // -1 to +1
    document.getElementById('debug-pitch').innerText = droneState.pitch.toFixed(2);
    document.getElementById('debug-roll').innerText = droneState.roll.toFixed(2);
    document.getElementById('debug-yaw').innerText = droneState.yaw.toFixed(2);
    document.getElementById('debug-thr').innerText = normThrottle.toFixed(2);

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
