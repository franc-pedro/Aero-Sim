import * as THREE from 'three';
import { showToast } from './toast.js';

// Drone physical state
export const droneState = {
    pos: new THREE.Vector3(0, 1.5, 0),
    vel: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Euler(0, 0, 0, 'YXZ'),
    angularVel: new THREE.Vector3(0, 0, 0),
    throttle: 50, // 0 to 100% (50% = neutral altitude hold)
    pitch: 0,     // -1 to 1
    roll: 0,      // -1 to 1
    yaw: 0,       // -1 to 1
    battery: 100,
};

// Keyboard state
export const keys = {};

// Gamepad tracking
export const gamepadState = {
    connected: false,
    activeIndex: null,
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
    simElapsedTime: 0,
};

// --- Reset Drone Position & State ---
export function resetDrone() {
    droneState.pos.set(0, 1.5, 0);
    droneState.vel.set(0, 0, 0);
    droneState.rotation.set(0, 0, 0, 'YXZ');
    droneState.angularVel.set(0, 0, 0);
    droneState.throttle = 50;
    droneState.pitch = 0;
    droneState.roll = 0;
    droneState.yaw = 0;
    droneState.battery = 100;
    gamepadState.baselineAxes = [];
    showToast('Drone reset to launch pad (Altitude Hold active).', 'info');
}
