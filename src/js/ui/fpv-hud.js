import * as THREE from 'three';
import { droneState } from '../core/state.js';
import { formatNumber, t } from '../i18n/index.js';

const TELEMETRY_INTERVAL = 1 / 10;
const ATTITUDE_INTERVAL = 1 / 30;

const MAX_PITCH_DEG = 45;
const MAX_ROLL_DEG = 45;

const _euler = new THREE.Euler(0, 0, 0, 'YXZ');

let telemetryAccumulator = 1;
let attitudeAccumulator = 1;
let lastBatteryDanger = false;
let lastRollDeg = 0;
let lastPitchDeg = 0;

const textCache = new Map();

function setText(id, text) {
    if (textCache.get(id) === text) return;
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    textCache.set(id, text);
}

export function initFPVHUD() {
    textCache.clear();
}

function updateTelemetry(state) {
    const altitudeText = `${formatNumber(state.renderPos.y, 1)} m`;
    const speedText = `${formatNumber(state.vel.length(), 1)} m/s`;
    const batVal = Math.round(state.battery);
    const batteryText = `${batVal}%`;
    const throttleText = `${Math.round(state.throttle)}%`;

    setText('fpv-alt', altitudeText);
    setText('fpv-spd', speedText);
    setText('fpv-thr', throttleText);
    setText('fpv-bat', batteryText);

    setText('touch-alt', altitudeText);
    setText('touch-speed', speedText);
    setText('touch-battery', batteryText);

    const objectives = state.objectives;
    setText(
        'gate-counter',
        objectives.gatesTotal > 0
            ? `${objectives.gatesPassed}/${objectives.gatesTotal}`
            : '—'
    );

    const batteryEl = document.getElementById('fpv-bat');
    const isDanger = batVal < 20;
    if (batteryEl && lastBatteryDanger !== isDanger) {
        batteryEl.className = isDanger
            ? 'fpv-value fpv-value-danger'
            : 'fpv-value fpv-value-success';
        lastBatteryDanger = isDanger;
    }
}

function clampDeg(v, max) {
    return Math.max(-max, Math.min(max, v));
}

function updateAttitude(state) {
    _euler.setFromQuaternion(state.renderQuaternion, 'YXZ');

    const pitchDeg = clampDeg(THREE.MathUtils.radToDeg(_euler.x), MAX_PITCH_DEG);
    const rollDeg = clampDeg(THREE.MathUtils.radToDeg(_euler.z), MAX_ROLL_DEG);

    if (Math.abs(pitchDeg - lastPitchDeg) < 0.05 && Math.abs(rollDeg - lastRollDeg) < 0.05) {
        return;
    }

    lastPitchDeg = pitchDeg;
    lastRollDeg = rollDeg;

    const horizonLine = document.getElementById('fpv-horizon-line');
    const horizonGroup = document.getElementById('fpv-horizon-group');
    const rollText = document.getElementById('fpv-roll-deg');
    const pitchText = document.getElementById('fpv-pitch-deg');

    if (horizonLine) {
        const pxPerDeg = 2.2;
        const yOffset = pitchDeg * pxPerDeg;
        horizonLine.setAttribute('transform', `translate(0, ${yOffset.toFixed(2)}) rotate(${(-rollDeg).toFixed(2)})`);
    }

    if (horizonGroup) {
        horizonGroup.setAttribute('transform', `rotate(${(-rollDeg).toFixed(2)}, 60, 60)`);
    }

    if (rollText) {
        rollText.textContent = `${rollDeg >= 0 ? '+' : ''}${rollDeg.toFixed(0)}°`;
    }

    if (pitchText) {
        pitchText.textContent = `${pitchDeg >= 0 ? '+' : ''}${pitchDeg.toFixed(0)}°`;
    }

    const miniHorizon = document.getElementById('touch-horizon-line');
    if (miniHorizon) {
        const pxPerDeg = 1.3;
        const yOffset = pitchDeg * pxPerDeg;
        miniHorizon.setAttribute('transform', `translate(0, ${yOffset.toFixed(2)}) rotate(${(-rollDeg).toFixed(2)})`);
    }
}

export function updateFPVHUD(dt) {
    telemetryAccumulator += dt;
    attitudeAccumulator += dt;

    if (telemetryAccumulator >= TELEMETRY_INTERVAL) {
        telemetryAccumulator = 0;
        updateTelemetry(droneState);
    }

    if (attitudeAccumulator >= ATTITUDE_INTERVAL) {
        attitudeAccumulator = 0;
        updateAttitude(droneState);
    }
}

export function refreshFPVHUD() {
    telemetryAccumulator = 1;
    attitudeAccumulator = 1;
    lastBatteryDanger = !lastBatteryDanger;
    updateFPVHUD(1);
}
