import { droneState, gamepadState } from '../core/state.js';
import { showToast } from '../core/toast.js';
import { updateAxesBars } from '../ui/hud.js';

const DEADZONE = 0.08;

function applyDeadzone(value) {
    if (value === undefined || value === null || Number.isNaN(value)) return 0;
    return Math.abs(value) < DEADZONE ? 0 : value;
}

// --- Gamepad Status UI Updater ---
export function updateGamepadUI(connected, name = '') {
    const dot = document.getElementById('gamepad-dot');
    const text = document.getElementById('gamepad-text');
    if (!dot || !text) return;

    if (connected) {
        dot.className = 'w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]';
        text.innerText = name ? `Connected: ${name.slice(0, 24)}` : 'Gamepad Connected';
        text.className = 'text-xs font-semibold tracking-wider uppercase text-emerald-600 dark:text-emerald-300';
    } else {
        dot.className = 'w-3 h-3 rounded-full bg-rose-500 animate-pulse';
        text.innerText = 'No Gamepad Connected';
        text.className = 'text-xs font-semibold tracking-wider uppercase theme-muted-text';
    }
}

export function initGamepad() {
    window.addEventListener('gamepadconnected', (e) => {
        gamepadState.connected = true;
        gamepadState.activeIndex = e.gamepad.index;
        showToast(`Gamepad Connected: ${e.gamepad.id}`, 'success');
        updateGamepadUI(true, e.gamepad.id);
    });

    window.addEventListener('gamepaddisconnected', (e) => {
        if (gamepadState.activeIndex === e.gamepad.index) {
            gamepadState.connected = false;
            gamepadState.activeIndex = null;
            showToast('Gamepad Disconnected. Switched to Keyboard.', 'warning');
            updateGamepadUI(false);
        }
    });

    const pitchAxisSelect = document.getElementById('pitch-axis-select');
    if (pitchAxisSelect) {
        pitchAxisSelect.addEventListener('change', (e) => {
            gamepadState.selectedPitchAxis = e.target.value;
            if (gamepadState.selectedPitchAxis !== 'auto') {
                gamepadState.detectedPitchAxisIndex = Number(gamepadState.selectedPitchAxis);
            }
        });
    }

    const invertPitchCheckbox = document.getElementById('invert-pitch-checkbox');
    if (invertPitchCheckbox) {
        invertPitchCheckbox.addEventListener('change', (e) => {
            gamepadState.invertPitch = e.target.checked;
        });
    }
}

// --- Gamepad Input Polling ---
export function pollGamepad() {
    if (!navigator.getGamepads) return;
    const gamepads = navigator.getGamepads();
    let gp = gamepadState.activeIndex !== null ? gamepads[gamepadState.activeIndex] : null;

    // Auto-detect if a gamepad was already connected before page load
    if (!gp) {
        for (let i = 0; i < gamepads.length; i++) {
            if (gamepads[i]) {
                gp = gamepads[i];
                gamepadState.activeIndex = i;
                if (!gamepadState.connected) {
                    gamepadState.connected = true;
                    updateGamepadUI(true, gp.id);
                }
                break;
            }
        }
    }

    if (!gp) return;

    const axes = gp.axes || [];

    // Capture initial resting baseline for secondary axes (triggers/sliders often rest at -1 or +1)
    if (gamepadState.baselineAxes.length !== axes.length) {
        gamepadState.baselineAxes = Array.from(axes).map((v) => (Math.abs(v) > 0.85 ? Math.sign(v) : 0));
    }

    // Standard Mode 2 Left Stick & Roll:
    // axes[0] = Yaw, axes[1] = Throttle, axes[2] = Roll
    const rawThrottle = applyDeadzone(axes[1]);
    const rawYaw = applyDeadzone(axes[0]);
    const rawRoll = applyDeadzone(axes[2]);

    // Pitch Axis Resolution (Manual override or intelligent Auto-Detect)
    let rawPitch = 0;
    if (gamepadState.selectedPitchAxis !== 'auto') {
        const idx = Number(gamepadState.selectedPitchAxis);
        gamepadState.detectedPitchAxisIndex = idx;
        rawPitch = applyDeadzone(axes[idx]);
    } else {
        // Check standard Axis 3 first, then common USB/RC right-stick Y axes (5, 4, 6, 7)
        const candidateIndices = [3, 5, 4, 6, 7];
        let bestIdx = gamepadState.detectedPitchAxisIndex;
        let bestDeflection = 0;

        for (const idx of candidateIndices) {
            if (idx >= axes.length) continue;
            const base = gamepadState.baselineAxes[idx] || 0;
            const delta = axes[idx] - base;
            // Ignore axes stuck at an unmoved rail (-1 or +1 when baseline was 0) unless actively moving
            const mag = Math.abs(delta);
            if (mag > DEADZONE && mag <= 1.05 && mag > bestDeflection) {
                bestDeflection = mag;
                bestIdx = idx;
            }
        }

        gamepadState.detectedPitchAxisIndex = bestIdx;
        const base = gamepadState.baselineAxes[bestIdx] || 0;
        rawPitch = applyDeadzone(axes[bestIdx] - base);
    }

    // Update visual 8-channel raw axes monitor (throttled inside the HUD module)
    updateAxesBars(axes);

    // Pushing stick UP gives negative Y on standard gamepads -> invert for positive Throttle & forward Pitch
    const axisThrottle = -rawThrottle;
    const pitchSign = gamepadState.invertPitch ? 1 : -1;
    const axisPitch = rawPitch * pitchSign;

    // Spring-centered gamepad throttle: 0 (centered) maps to 50% (altitude hold)
    droneState.throttle = Math.max(0, Math.min(100, (axisThrottle + 1) * 50));
    droneState.yaw = -rawYaw;
    droneState.pitch = Math.max(-1, Math.min(1, axisPitch));
    droneState.roll = rawRoll;
}
