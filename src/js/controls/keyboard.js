import { droneState, gamepadState, keys } from '../core/state.js';

// --- Keyboard Input Handling ---
export function initKeyboard({ onReset }) {
    window.addEventListener('keydown', (e) => {
        // Allow typing normally inside the Python code editor
        if (document.activeElement && document.activeElement.id === 'python-code-editor') return;

        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
            e.preventDefault();
        }
        keys[e.code] = true;
        if (e.code === 'KeyR') onReset();
    });

    window.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });
}

export function handleKeyboard() {
    const keyboardActive = keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD'] ||
        keys['ArrowUp'] || keys['ArrowDown'] || keys['ArrowLeft'] || keys['ArrowRight'] ||
        keys['KeyI'] || keys['KeyK'] || keys['KeyJ'] || keys['KeyL'];

    if (gamepadState.connected && !keyboardActive) return;

    // Throttle controls (W = Climb, S = Descend, neither = Hold Altitude at 50%)
    if (keys['KeyW']) {
        droneState.throttle = 85;
    } else if (keys['KeyS']) {
        droneState.throttle = 15;
    } else {
        droneState.throttle = 50;
    }

    // Yaw controls (A / D)
    if (keys['KeyA']) droneState.yaw = 1;
    else if (keys['KeyD']) droneState.yaw = -1;
    else droneState.yaw = 0;

    // Pitch controls (Arrow Up / Down or I / K)
    const kbPitchSign = gamepadState.invertPitch ? -1 : 1;
    if (keys['ArrowUp'] || keys['KeyI']) droneState.pitch = 1 * kbPitchSign;
    else if (keys['ArrowDown'] || keys['KeyK']) droneState.pitch = -1 * kbPitchSign;
    else droneState.pitch = 0;

    // Roll controls (Arrow Left / Right or J / L)
    if (keys['ArrowLeft'] || keys['KeyJ']) droneState.roll = -1;
    else if (keys['ArrowRight'] || keys['KeyL']) droneState.roll = 1;
    else droneState.roll = 0;
}
