import * as THREE from 'three';
import { droneState } from '../core/state.js';

// --- Smooth Chase Camera ---
const CAMERA_OFFSET = new THREE.Vector3(0, 2.5, -6);
const LOOK_OFFSET = new THREE.Vector3(0, 0.5, 0);

const POSITION_LAMBDA = 12.0;  // Position spring response (1/s)
const LOOK_LAMBDA = 14.0;      // Look-target spring response (1/s)
const YAW_LAMBDA = 12.0;       // Orbit yaw response (1/s)
const VELOCITY_LEAD = 0.06;    // Camera position look-ahead (seconds)
const LOOK_LEAD = 0.04;        // Look-target look-ahead (seconds)

const _offset = new THREE.Vector3();
const _targetPos = new THREE.Vector3();
const _targetLook = new THREE.Vector3();
const _yawQuat = new THREE.Quaternion();
const _upAxis = new THREE.Vector3(0, 1, 0);

const rigPos = new THREE.Vector3();
const rigLook = new THREE.Vector3();
let rigYaw = 0;
let rigInitialized = false;
let shakeAmount = 0;

function dampFactor(lambda, dt) {
    return 1 - Math.exp(-lambda * Math.max(0, dt));
}

function dampAngle(current, target, lambda, dt) {
    const delta = Math.atan2(Math.sin(target - current), Math.cos(target - current));
    return current + delta * dampFactor(lambda, dt);
}

export function addCameraShake(amount) {
    shakeAmount = Math.max(shakeAmount, amount);
}

export function clearCameraShake() {
    shakeAmount = 0;
}

export function updateCamera(camera, dt) {
    const needsSnap = !rigInitialized || droneState.snapCamera;

    // Damped yaw keeps the camera behind the drone without snapping the world
    // around instantly when yaw input changes.
    rigYaw = needsSnap
        ? droneState.heading
        : dampAngle(rigYaw, droneState.heading, YAW_LAMBDA, dt);

    _yawQuat.setFromAxisAngle(_upAxis, rigYaw);
    _offset.copy(CAMERA_OFFSET).applyQuaternion(_yawQuat);

    _targetPos.copy(droneState.renderPos).add(_offset);
    _targetPos.x += droneState.vel.x * VELOCITY_LEAD;
    _targetPos.z += droneState.vel.z * VELOCITY_LEAD;

    _targetLook.copy(droneState.renderPos).add(LOOK_OFFSET);
    _targetLook.x += droneState.vel.x * LOOK_LEAD;
    _targetLook.z += droneState.vel.z * LOOK_LEAD;

    if (needsSnap) {
        // Reset / level change: place the camera exactly at its ideal pose.
        rigPos.copy(_targetPos);
        rigLook.copy(_targetLook);
        rigInitialized = true;
        shakeAmount = 0;
        droneState.snapCamera = false;
    } else {
        rigPos.lerp(_targetPos, dampFactor(POSITION_LAMBDA, dt));
        rigLook.lerp(_targetLook, dampFactor(LOOK_LAMBDA, dt));
    }

    camera.position.copy(rigPos);

    // Short impact shake, applied after the rig so it does not feed back into
    // the camera damping or the next frame's position.
    if (shakeAmount > 0.001) {
        camera.position.x += (Math.random() - 0.5) * shakeAmount;
        camera.position.y += (Math.random() - 0.5) * shakeAmount;
        camera.position.z += (Math.random() - 0.5) * shakeAmount * 0.5;
        shakeAmount *= Math.exp(-10 * Math.max(0, dt));
    } else {
        shakeAmount = 0;
    }

    camera.lookAt(rigLook);
}
