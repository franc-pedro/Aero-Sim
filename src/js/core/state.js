import * as THREE from 'three';
import { showToast } from './toast.js';

const _spawnEuler = new THREE.Euler(0, 0, 0, 'YXZ');

// Drone physical state
export const droneState = {
    pos: new THREE.Vector3(0, 1.5, 0),
    vel: new THREE.Vector3(0, 0, 0),

    // Authoritative attitude. YXZ flight input produces the target quaternion;
    // the simulation smoothly rotates the current attitude towards it.
    quaternion: new THREE.Quaternion(),
    heading: 0, // Yaw in radians, used by the camera and horizontal thrust

    // Previous state for render interpolation (fixed-step simulation -> render)
    prevPos: new THREE.Vector3(0, 1.5, 0),
    prevQuaternion: new THREE.Quaternion(),

    // Interpolated state used by the renderer and camera
    renderPos: new THREE.Vector3(0, 1.5, 0),
    renderQuaternion: new THREE.Quaternion(),

    angularVel: new THREE.Vector3(0, 0, 0),
    throttle: 50, // 0 to 100% (50% = neutral altitude hold)
    pitch: 0,     // -1 to 1
    roll: 0,      // -1 to 1
    yaw: 0,       // -1 to 1
    battery: 100,

    // Visual rotor speeds (signed); integrated at render rate for smooth props
    rotorSpeeds: [0, 0, 0, 0],

    // Flight status / crash state
    flight: {
        status: 'flying', // 'flying' | 'crashed'
        cause: null,      // 'obstacle' | 'ring'
        impactSpeed: 0,
        time: 0,
        resting: false,
    },

    // Current level objectives
    objectives: {
        gatesPassed: 0,
        gatesTotal: 0,
        completed: false,
    },

    // Request a camera snap on the next update (reset / teleport)
    snapCamera: true,
};

// Keyboard state
export const keys = {};

// Gamepad tracking
export const gamepadState = {
    connected: false,
    activeIndex: null,
    name: '',
    baselineAxes: [],
    selectedPitchAxis: 'auto',
    detectedPitchAxisIndex: 3,
    invertPitch: false,
};

// Control mode and Python autopilot state
export const controlState = {
    mode: 'manual',
    pythonRunning: false,
    pythonRuntimeAvailable: false,
    pythonRuntimeReady: false,
    simElapsedTime: 0,
};

function syncRenderState() {
    droneState.prevPos.copy(droneState.pos);
    droneState.prevQuaternion.copy(droneState.quaternion);
    droneState.renderPos.copy(droneState.pos);
    droneState.renderQuaternion.copy(droneState.quaternion);
}

// --- Reset Drone Position & State ---
export function resetDrone(spawn = null, { silent = false } = {}) {
    const x = spawn?.x ?? 0;
    const y = spawn?.y ?? 1.5;
    const z = spawn?.z ?? 0;
    const heading = spawn?.yaw ?? 0;

    droneState.pos.set(x, y, z);
    droneState.vel.set(0, 0, 0);
    droneState.heading = heading;
    _spawnEuler.set(0, heading, 0, 'YXZ');
    droneState.quaternion.setFromEuler(_spawnEuler);
    droneState.angularVel.set(0, 0, 0);
    droneState.throttle = 50;
    droneState.pitch = 0;
    droneState.roll = 0;
    droneState.yaw = 0;
    droneState.battery = 100;
    droneState.rotorSpeeds.fill(0);
    droneState.flight.status = 'flying';
    droneState.flight.cause = null;
    droneState.flight.impactSpeed = 0;
    droneState.flight.time = 0;
    droneState.flight.resting = false;

    droneState.objectives.gatesPassed = 0;
    droneState.objectives.completed = false;

    syncRenderState();
    droneState.snapCamera = true;

    gamepadState.baselineAxes = [];

    if (!silent) {
        showToast('toast.reset', 'info');
    }
}
