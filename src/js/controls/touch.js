import { droneState } from '../core/state.js';

// Soft touch profile: a larger deadzone, a gentle response curve and a
// smoothed output make small screen corrections much less abrupt.
const DEADZONE = 0.16;
const EXPO = 2.4;
const MAX_PITCH = 0.8;
const MAX_ROLL = 0.8;
const MAX_YAW = 0.5;
const MAX_THROTTLE_OFFSET = 25;
const AXIS_RESPONSE = 0.16;
const THROTTLE_RESPONSE = 0.2;
const RELEASE_RESPONSE = 0.25;
const NEUTRAL_EPSILON = 0.015;

const sticks = {
    left: { x: 0, y: 0, pointerId: null, active: false, base: null, knob: null },
    right: { x: 0, y: 0, pointerId: null, active: false, base: null, knob: null },
};

const output = {
    throttle: 50,
    yaw: 0,
    pitch: 0,
    roll: 0,
};

let initialized = false;
let onReset = null;
let mediaQuery = null;

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function shapeAxis(value) {
    return Math.sign(value) * (Math.abs(value) ** EXPO);
}

function approach(current, target, dt, responseTime) {
    const alpha = 1 - Math.exp(-dt / responseTime);
    return current + (target - current) * alpha;
}

function isOutputNeutral() {
    return Math.abs(output.throttle - 50) < NEUTRAL_EPSILON
        && Math.abs(output.yaw) < NEUTRAL_EPSILON
        && Math.abs(output.pitch) < NEUTRAL_EPSILON
        && Math.abs(output.roll) < NEUTRAL_EPSILON;
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
    output.throttle = 50;
    output.yaw = 0;
    output.pitch = 0;
    output.roll = 0;
}

// Called once per render frame in manual mode. The target comes directly from
// the stick, but the output is shaped and smoothed before reaching the drone.
export function applyTouchControls(dt = 1 / 60) {
    if (!initialized) return false;

    const active = sticks.left.active || sticks.right.active;
    if (!active && isOutputNeutral()) return false;

    const safeDt = clamp(Number(dt) || 1 / 60, 0.001, 0.05);
    const left = sticks.left.active ? sticks.left : { x: 0, y: 0 };
    const right = sticks.right.active ? sticks.right : { x: 0, y: 0 };

    const targetThrottle = 50 - shapeAxis(left.y) * MAX_THROTTLE_OFFSET;
    const targetYaw = -shapeAxis(left.x) * MAX_YAW;
    const targetPitch = -shapeAxis(right.y) * MAX_PITCH;
    const targetRoll = shapeAxis(right.x) * MAX_ROLL;

    const axisResponse = active ? AXIS_RESPONSE : RELEASE_RESPONSE;
    const throttleResponse = active ? THROTTLE_RESPONSE : RELEASE_RESPONSE;

    output.throttle = approach(output.throttle, targetThrottle, safeDt, throttleResponse);
    output.yaw = approach(output.yaw, targetYaw, safeDt, axisResponse);
    output.pitch = approach(output.pitch, targetPitch, safeDt, axisResponse);
    output.roll = approach(output.roll, targetRoll, safeDt, axisResponse);

    if (!active && isOutputNeutral()) {
        output.throttle = 50;
        output.yaw = 0;
        output.pitch = 0;
        output.roll = 0;
    }

    droneState.throttle = clamp(output.throttle, 0, 100);
    droneState.yaw = clamp(output.yaw, -1, 1);
    droneState.pitch = clamp(output.pitch, -1, 1);
    droneState.roll = clamp(output.roll, -1, 1);
    return true;
}
