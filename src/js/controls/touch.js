import { droneState } from '../core/state.js';

const DEADZONE = 0.12;

const sticks = {
    left: { x: 0, y: 0, pointerId: null, active: false, base: null, knob: null },
    right: { x: 0, y: 0, pointerId: null, active: false, base: null, knob: null },
};

let initialized = false;
let onReset = null;
let mediaQuery = null;

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function setKnobPosition(stick) {
    if (!stick.knob || !stick.base) return;

    const maxOffset = Math.max(0, stick.base.clientWidth / 2 - stick.knob.offsetWidth / 2);
    stick.knob.style.transform = `translate(calc(-50% + ${stick.x * maxOffset}px), calc(-50% + ${stick.y * maxOffset}px))`;
}

function resetStick(stick) {
    if (stick.pointerId !== null && stick.base?.hasPointerCapture?.(stick.pointerId)) {
        try {
            stick.base.releasePointerCapture(stick.pointerId);
        } catch {
            // The pointer may already be released.
        }
    }

    stick.pointerId = null;
    stick.active = false;
    stick.x = 0;
    stick.y = 0;
    setKnobPosition(stick);
}

function updateStickFromPointer(stick, event) {
    if (!stick.base) return;

    const rect = stick.base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxOffset = Math.max(1, rect.width / 2 - stick.knob.offsetWidth / 2);

    let dx = event.clientX - centerX;
    let dy = event.clientY - centerY;
    const distance = Math.hypot(dx, dy);

    if (distance > maxOffset) {
        const scale = maxOffset / distance;
        dx *= scale;
        dy *= scale;
    }

    let x = dx / maxOffset;
    let y = dy / maxOffset;
    if (Math.hypot(x, y) < DEADZONE) {
        x = 0;
        y = 0;
    }

    stick.x = clamp(x, -1, 1);
    stick.y = clamp(y, -1, 1);
    setKnobPosition(stick);
}

function bindStick(stick, baseId) {
    const base = document.getElementById(baseId);
    if (!base) return;

    stick.base = base;
    stick.knob = base.querySelector('.touch-stick-knob');

    base.addEventListener('pointerdown', (event) => {
        if (stick.pointerId !== null) return;
        event.preventDefault();
        stick.pointerId = event.pointerId;
        stick.active = true;
        base.setPointerCapture?.(event.pointerId);
        updateStickFromPointer(stick, event);
    });

    base.addEventListener('pointermove', (event) => {
        if (stick.pointerId !== event.pointerId) return;
        event.preventDefault();
        updateStickFromPointer(stick, event);
    });

    const release = (event) => {
        if (stick.pointerId !== event.pointerId) return;
        resetStick(stick);
    };

    base.addEventListener('pointerup', release);
    base.addEventListener('pointercancel', release);
    base.addEventListener('lostpointercapture', release);
}

function updateTouchUiVisibility() {
    const smallScreen = window.innerWidth <= 900;
    document.body.classList.toggle('touch-ui', Boolean(mediaQuery?.matches || smallScreen));
}

export function initTouchControls({ onReset: resetCallback } = {}) {
    if (initialized) return;
    initialized = true;
    onReset = resetCallback;

    bindStick(sticks.left, 'touch-stick-left');
    bindStick(sticks.right, 'touch-stick-right');

    document.getElementById('btn-touch-reset')?.addEventListener('click', () => {
        resetTouchControls();
        onReset?.();
    });

    mediaQuery = window.matchMedia?.('(pointer: coarse)') || null;
    updateTouchUiVisibility();
    mediaQuery?.addEventListener?.('change', updateTouchUiVisibility);
    window.addEventListener('resize', updateTouchUiVisibility);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) resetTouchControls();
    });
    window.addEventListener('blur', resetTouchControls);
}

export function resetTouchControls() {
    resetStick(sticks.left);
    resetStick(sticks.right);
}

// Called once per fixed simulation step in manual mode. Returns true when a
// virtual stick is being touched, so gamepad/keyboard values are overridden.
export function applyTouchControls() {
    if (!initialized || (!sticks.left.active && !sticks.right.active)) {
        return false;
    }

    const left = sticks.left.active ? sticks.left : { x: 0, y: 0 };
    const right = sticks.right.active ? sticks.right : { x: 0, y: 0 };

    droneState.throttle = clamp(50 - left.y * 50, 0, 100);
    droneState.yaw = clamp(-left.x, -1, 1);
    droneState.pitch = clamp(-right.y, -1, 1);
    droneState.roll = clamp(right.x, -1, 1);
    return true;
}
