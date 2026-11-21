import * as THREE from 'three';
import { droneState } from '../core/state.js';

// --- Camera modes: chase (default), orbit (OrbitControls), FPV ---

export const CAMERA_MODES = ['chase', 'orbit', 'fpv'];

// --- Smooth Chase Camera ---
// Offsets are sized for the true-scale Tello (~10 cm body): tight follow so
// the drone keeps a comfortable share of the screen.
const CAMERA_OFFSET = new THREE.Vector3(0, 0.35, -0.8);
const LOOK_OFFSET = new THREE.Vector3(0, 0.08, 0);

// --- FPV Camera ---
// Mounted just ahead of the front lens (the lens sits at ~6.4 cm from the
// centre): past the glass, so the body never blocks the view.
const FPV_OFFSET = new THREE.Vector3(0, -0.012, 0.075);
// The camera looks along its local -Z; the drone flies along +Z.
const LOOK_BACK_YAW = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);

const POSITION_LAMBDA = 8.5;   // Position spring response (1/s)
const LOOK_LAMBDA = 10.0;      // Look-target spring response (1/s)
const YAW_LAMBDA = 9.0;        // Orbit yaw response (1/s)
const VELOCITY_LEAD = 0.035;  // Camera position look-ahead (seconds)
const LOOK_LEAD = 0.03;        // Look-target look-ahead (seconds)
const ORBIT_FOLLOW_LAMBDA = 4; // Orbit target follow response (1/s)

const _offset = new THREE.Vector3();
const _targetPos = new THREE.Vector3();
const _targetLook = new THREE.Vector3();
const _yawQuat = new THREE.Quaternion();
const _upAxis = new THREE.Vector3(0, 1, 0);
const _fpvOffset = new THREE.Vector3();

const rigPos = new THREE.Vector3();
const rigLook = new THREE.Vector3();
let rigYaw = 0;
let rigInitialized = false;
let shakeAmount = 0;

let cameraMode = 'chase';
let orbitControls = null;
const orbitFollowPos = new THREE.Vector3();

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

// Called once from main.js after the OrbitControls instance is created.
export function setOrbitControls(controls) {
    orbitControls = controls;
    if (controls) controls.enabled = cameraMode === 'orbit';
}

export function getCameraMode() {
    return cameraMode;
}

export function setCameraMode(mode) {
    if (!CAMERA_MODES.includes(mode) || mode === cameraMode) return;

    const previous = cameraMode;
    cameraMode = mode;
    clearCameraShake();

    if (previous === 'orbit' && orbitControls) {
        orbitControls.enabled = false;
    }

    if (mode === 'orbit' && orbitControls) {
        // Start inspecting from the drone's current position.
        orbitControls.target.copy(droneState.renderPos);
        orbitFollowPos.copy(droneState.renderPos);
        orbitControls.enabled = true;
        orbitControls.update();
    }

    if (mode === 'chase') {
        // Snap the chase rig to its ideal pose on the next update.
        rigInitialized = false;
    }
}

function updateChaseCamera(camera, dt) {
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

function updateOrbitCamera(dt) {
    if (!orbitControls) return;

    // Follow the drone only while it is actually moving, so a parked drone
    // keeps whatever target the student panned to.
    const pos = droneState.renderPos;
    if (pos.distanceTo(orbitFollowPos) > 0.01) {
        orbitControls.target.lerp(pos, dampFactor(ORBIT_FOLLOW_LAMBDA, dt));
        orbitFollowPos.copy(pos);
    }

    orbitControls.update();
}

function updateFpvCamera(camera) {
    _fpvOffset.copy(FPV_OFFSET).applyQuaternion(droneState.renderQuaternion);
    camera.position.copy(droneState.renderPos).add(_fpvOffset);
    camera.quaternion.copy(droneState.renderQuaternion).multiply(LOOK_BACK_YAW);
}

export function updateCamera(camera, dt, world) {
    if (cameraMode === 'orbit') {
        updateOrbitCamera(dt);
        return;
    }

    if (cameraMode === 'fpv') {
        updateFpvCamera(camera);
        return;
    }

    updateChaseCamera(camera, dt);
}
