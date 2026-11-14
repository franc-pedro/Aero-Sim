import { droneState } from '../core/state.js';
import { showToast } from '../core/toast.js';
import { getLocale } from '../i18n/index.js';
import { GROUND_HEIGHT } from '../simulation/constants.js';
import { isTelloFlightActive } from './commands.js';

let levelDef = null;
let missionDef = null;
let onUpdate = null;
let state = createState();
let lastSignature = '';

function createState() {
    return {
        gatesPassed: 0,
        gatesTotal: countGates(),
        airborne: false,
        landed: false,
        complete: false,
        failed: false,
    };
}

function countGates() {
    return (levelDef?.rings || []).filter((ring) => ring.gate !== false).length;
}

function localize(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    const locale = getLocale();
    return value[locale] ?? value.pt ?? value.en ?? '';
}

function isOnPad() {
    if (!missionDef || !levelDef) return false;

    const pad = missionDef.landingPad || levelDef.spawn || { x: 0, z: 0 };
    const radius = missionDef.landingRadius ?? pad.radius ?? levelDef.landingPad?.radius ?? 3;
    const distance = Math.hypot(droneState.pos.x - pad.x, droneState.pos.z - pad.z);
    const horizontalSpeed = Math.hypot(droneState.vel.x, droneState.vel.z);

    return distance <= radius
        && droneState.pos.y <= GROUND_HEIGHT + 0.09
        && horizontalSpeed < 0.3;
}

function buildView() {
    return {
        visible: Boolean(missionDef),
        title: localize(missionDef?.title),
        objective: localize(missionDef?.objective),
        hints: (missionDef?.hints || []).map(localize),
        gatesPassed: state.gatesPassed,
        gatesTotal: state.gatesTotal,
        airborne: state.airborne,
        landed: state.landed,
        complete: state.complete,
        failed: state.failed,
    };
}

function emit(force = false) {
    const view = buildView();
    const signature = JSON.stringify(view);
    if (!force && signature === lastSignature) return;
    lastSignature = signature;
    onUpdate?.(view);
}

export function initMissionUI(callback) {
    onUpdate = callback;
    emit(true);
}

export function setMissionLevel(def) {
    levelDef = def || null;
    missionDef = def?.pythonMission || null;
    state = createState();
    lastSignature = '';
    emit(true);
}

export function resetMission() {
    state = createState();
    lastSignature = '';
    emit(true);
}

export function refreshMissionUI() {
    lastSignature = '';
    emit(true);
}

export function updateMission() {
    if (!missionDef) return;

    let changed = false;
    const crashed = droneState.flight.status === 'crashed';
    const flying = isTelloFlightActive();

    if (state.gatesPassed !== droneState.objectives.gatesPassed) {
        state.gatesPassed = droneState.objectives.gatesPassed;
        changed = true;
    }

    if (crashed && !state.failed && !state.complete) {
        state.failed = true;
        changed = true;
    }

    if (flying) {
        if (!state.airborne) {
            state.airborne = true;
            changed = true;
        }
        if (state.landed) {
            state.landed = false;
            changed = true;
        }
    } else if (state.airborne && !crashed && isOnPad() && !state.landed) {
        state.landed = true;
        changed = true;
    }

    if (
        !state.complete
        && !state.failed
        && state.airborne
        && state.landed
        && state.gatesTotal > 0
        && state.gatesPassed >= state.gatesTotal
    ) {
        state.complete = true;
        changed = true;
        showToast('toast.pythonMissionComplete', 'success');
    }

    if (changed) emit();
}
