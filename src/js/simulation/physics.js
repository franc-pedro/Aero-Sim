import * as THREE from 'three';
import { controlState, droneState } from '../core/state.js';
import { pollGamepad } from '../controls/gamepad.js';
import { handleKeyboard } from '../controls/keyboard.js';
import { runPythonStep } from '../python/autopilot.js';
import { detectCollision, resolveCollision } from './collision.js';
import { checkGateCrossings } from './gates.js';

// --- Flight Model Tuning ---
const MAX_TILT = Math.PI / 4.5;              // ~40 degrees
const ATTITUDE_LAMBDA = 14;                  // Attitude response (1/s)
const CONTROL_AUTHORITY = 18;                // Horizontal acceleration at full tilt (m/s^2)
const YAW_RATE = 2.2;                        // rad/s at full yaw input
const HORIZONTAL_DRAG = 1.8;                 // 1/s
const VERTICAL_HOLD_DAMPING = 6.0;           // 1/s, altitude-hold vertical damping
const VERTICAL_ACCEL = 16.0;                 // m/s^2 at full throttle
const VERTICAL_DRAG = 2.2;                   // 1/s
const GROUND_HEIGHT = 0.25;
const GROUND_FRICTION = 7.5;                 // 1/s while level on the ground
const BOUNDARY_LIMIT = 180;
const CEILING_LIMIT = 150;

// Crash / wreck physics
const CRASH_GRAVITY = 9.81;                  // m/s^2
const CRASH_DRAG = 0.35;                     // 1/s
const CRASH_ANGULAR_DRAG = 0.6;              // 1/s
const CRASH_GROUND_HEIGHT = 0.35;
const CRASH_BOUNCE_THRESHOLD = 1.2;          // m/s
const CRASH_BOUNCE = 0.22;
const CRASH_GROUND_FRICTION = 5.5;           // 1/s
const CRASH_GROUND_ANGULAR_DRAG = 4.5;       // 1/s
const ROTOR_SPINDOWN = 3.5;                  // 1/s

const SIN_MAX_TILT = Math.sin(MAX_TILT);

// Reusable objects: no per-frame allocations in the simulation hot path
const _targetEuler = new THREE.Euler(0, 0, 0, 'YXZ');
const _attitudeEuler = new THREE.Euler(0, 0, 0, 'YXZ');
const _targetQuat = new THREE.Quaternion();
const _yawQuat = new THREE.Quaternion();
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _accel = new THREE.Vector3();
const _upAxis = new THREE.Vector3(0, 1, 0);
const _motorMix = [0, 0, 0, 0];
const _tumbleAxis = new THREE.Vector3();
const _tumbleDelta = new THREE.Quaternion();

function wrapAngle(angle) {
    if (angle > Math.PI) return angle - Math.PI * 2;
    if (angle < -Math.PI) return angle + Math.PI * 2;
    return angle;
}

// Sample manual controls once per render frame. Python mode is stepped inside
// the fixed simulation step so scripts receive a stable dt.
export function sampleInput() {
    if (controlState.mode === 'python' || droneState.flight.status !== 'flying') return;
    pollGamepad();
    handleKeyboard();
}

// Called by the loop before each fixed step.
export function capturePreviousState() {
    droneState.prevPos.copy(droneState.pos);
    droneState.prevQuaternion.copy(droneState.quaternion);
}

// --- Fixed-Step Flight Simulation ---
export function stepPhysics(dt, world) {
    if (droneState.flight.status === 'crashed') {
        stepCrashed(dt, world);
        return;
    }

    if (controlState.mode === 'python') {
        runPythonStep(dt);
    }

    // Battery drain simulation
    if (droneState.battery > 0 && (droneState.pos.y > 0.3 || Math.abs(droneState.throttle - 50) > 2)) {
        droneState.battery = Math.max(0, droneState.battery - 0.001 * Math.max(0.25, droneState.throttle / 100) * dt * 60);
    }

    // Yaw rotation rate
    droneState.heading = wrapAngle(droneState.heading + droneState.yaw * YAW_RATE * dt);

    // Target orientation based on stick input using YXZ Euler order:
    // Yaw (Y) -> Pitch (X) -> Roll (Z)
    _targetEuler.set(
        droneState.pitch * MAX_TILT,
        droneState.heading,
        droneState.roll * MAX_TILT,
        'YXZ'
    );
    _targetQuat.setFromEuler(_targetEuler);

    // Frame-rate independent attitude response
    const attitudeBlend = 1 - Math.exp(-ATTITUDE_LAMBDA * dt);
    droneState.quaternion.slerp(_targetQuat, attitudeBlend);
    droneState.quaternion.normalize();

    // Use the actual (smoothed) attitude to drive horizontal acceleration so
    // the movement always matches the visual tilt of the drone.
    _attitudeEuler.setFromQuaternion(droneState.quaternion, 'YXZ');
    const pitchRatio = THREE.MathUtils.clamp(Math.sin(_attitudeEuler.x) / SIN_MAX_TILT, -1, 1);
    const rollRatio = THREE.MathUtils.clamp(Math.sin(_attitudeEuler.z) / SIN_MAX_TILT, -1, 1);

    // Horizontal flight acceleration along heading forward (+Z) and right (-X)
    _yawQuat.setFromAxisAngle(_upAxis, droneState.heading);
    _forward.set(0, 0, 1).applyQuaternion(_yawQuat);
    _right.set(-1, 0, 0).applyQuaternion(_yawQuat);

    // Vertical Altitude-Hold Physics:
    // throttle = 50% (throttleCmd = 0) holds exact altitude with zero vertical drift
    const throttleCmd = (droneState.throttle - 50) / 50; // -1 (down) to +1 (up)
    const verticalAccel = Math.abs(throttleCmd) < 0.02
        ? -droneState.vel.y * VERTICAL_HOLD_DAMPING
        : throttleCmd * VERTICAL_ACCEL - droneState.vel.y * VERTICAL_DRAG;

    _accel.set(0, verticalAccel, 0);
    _accel.addScaledVector(_forward, pitchRatio * CONTROL_AUTHORITY);
    _accel.addScaledVector(_right, rollRatio * CONTROL_AUTHORITY);

    // Horizontal aerodynamic drag (brakes smoothly to a stationary hover when level)
    _accel.x -= droneState.vel.x * HORIZONTAL_DRAG;
    _accel.z -= droneState.vel.z * HORIZONTAL_DRAG;

    // Integrate velocity & position
    droneState.vel.addScaledVector(_accel, dt);
    droneState.pos.addScaledVector(droneState.vel, dt);

    // Obstacle / ring collision. A hit immediately turns the flight into a
    // wreck: the next step will use the crash integration path.
    const hit = detectCollision(droneState.pos, world);
    if (hit) {
        resolveCollision(hit);
        decayRotorSpeeds(dt);
        return;
    }

    // Gate objectives are evaluated across the movement segment for this step.
    checkGateCrossings(droneState.prevPos, droneState.pos, world);

    // Ground collision detection
    if (droneState.pos.y < GROUND_HEIGHT) {
        droneState.pos.y = GROUND_HEIGHT;
        droneState.vel.y = Math.max(0, droneState.vel.y);
        if (Math.abs(_attitudeEuler.x) < 0.05 && Math.abs(_attitudeEuler.z) < 0.05) {
            const friction = Math.exp(-GROUND_FRICTION * dt);
            droneState.vel.x *= friction;
            droneState.vel.z *= friction;
        }
    }

    // Boundary limits (per level)
    const halfSize = world.bounds?.halfSize ?? BOUNDARY_LIMIT;
    const ceiling = world.bounds?.ceiling ?? CEILING_LIMIT;

    if (Math.abs(droneState.pos.x) > halfSize) {
        droneState.pos.x = Math.sign(droneState.pos.x) * halfSize;
        droneState.vel.x *= -0.5;
    }
    if (Math.abs(droneState.pos.z) > halfSize) {
        droneState.pos.z = Math.sign(droneState.pos.z) * halfSize;
        droneState.vel.z *= -0.5;
    }
    if (droneState.pos.y > ceiling) {
        droneState.pos.y = ceiling;
        droneState.vel.y = 0;
    }

    updateRotorSpeeds(world, pitchRatio, rollRatio, dt);
}

// --- Motor Mixing & Rotor Speed Targets ---
function updateRotorSpeeds(world, pitchRatio, rollRatio, dt) {
    if (droneState.flight.status !== 'flying') {
        decayRotorSpeeds(dt);
        return;
    }
    if (!world.propellers || world.propellers.length === 0) return;

    const isAirborne = droneState.pos.y > 0.32;
    const controlEffort = Math.abs(pitchRatio) + Math.abs(rollRatio) + Math.abs(droneState.yaw);
    const baseRpm = isAirborne
        ? Math.max(38, (droneState.throttle / 100) * 55 + 15)
        : (droneState.throttle > 52 || controlEffort > 0.05 ? (droneState.throttle / 100) * 45 + 15 : 0);

    // Motor order: 0 = Front-Left (CW), 1 = Front-Right (CCW), 2 = Rear-Left (CCW), 3 = Rear-Right (CW)
    _motorMix[0] = -pitchRatio + rollRatio + droneState.yaw;
    _motorMix[1] = -pitchRatio - rollRatio - droneState.yaw;
    _motorMix[2] = pitchRatio + rollRatio - droneState.yaw;
    _motorMix[3] = pitchRatio - rollRatio + droneState.yaw;

    const count = Math.min(4, world.propellers.length);
    for (let i = 0; i < count; i++) {
        const sign = (i === 0 || i === 3) ? 1 : -1;
        const differential = _motorMix[i] * 18;
        const rotorSpeed = (baseRpm > 0 || controlEffort > 0.05)
            ? Math.max(12, baseRpm + differential)
            : 0;
        droneState.rotorSpeeds[i] = rotorSpeed * sign;
    }
}

// --- Crash / Wreck Physics ---
function decayRotorSpeeds(dt) {
    const decay = Math.exp(-ROTOR_SPINDOWN * dt);
    for (let i = 0; i < droneState.rotorSpeeds.length; i++) {
        droneState.rotorSpeeds[i] *= decay;
        if (Math.abs(droneState.rotorSpeeds[i]) < 0.5) {
            droneState.rotorSpeeds[i] = 0;
        }
    }
}

function stepCrashed(dt, world) {
    droneState.flight.time += dt;

    // Free fall with light aerodynamic drag
    droneState.vel.y -= CRASH_GRAVITY * dt;
    droneState.vel.multiplyScalar(Math.exp(-CRASH_DRAG * dt));
    droneState.pos.addScaledVector(droneState.vel, dt);

    // Tumble around the current angular velocity (world-space rotation)
    droneState.angularVel.multiplyScalar(Math.exp(-CRASH_ANGULAR_DRAG * dt));
    const spin = droneState.angularVel.length();
    if (spin > 1e-5) {
        _tumbleAxis.copy(droneState.angularVel).multiplyScalar(1 / spin);
        _tumbleDelta.setFromAxisAngle(_tumbleAxis, spin * dt);
        droneState.quaternion.premultiply(_tumbleDelta).normalize();
    }

    // Ground bounce, friction and eventual rest
    if (droneState.pos.y < CRASH_GROUND_HEIGHT) {
        droneState.pos.y = CRASH_GROUND_HEIGHT;

        if (droneState.vel.y < -CRASH_BOUNCE_THRESHOLD) {
            droneState.vel.y = -droneState.vel.y * CRASH_BOUNCE;
        } else {
            droneState.vel.y = 0;
        }

        const friction = Math.exp(-CRASH_GROUND_FRICTION * dt);
        droneState.vel.x *= friction;
        droneState.vel.z *= friction;
        droneState.angularVel.multiplyScalar(Math.exp(-CRASH_GROUND_ANGULAR_DRAG * dt));

        if (droneState.vel.lengthSq() < 0.02 && droneState.angularVel.lengthSq() < 0.05) {
            droneState.vel.set(0, 0, 0);
            droneState.angularVel.set(0, 0, 0);
            droneState.flight.resting = true;
        }
    }

    // Keep the wreck inside the current level's arena
    const halfSize = world?.bounds?.halfSize ?? BOUNDARY_LIMIT;
    const ceiling = world?.bounds?.ceiling ?? CEILING_LIMIT;

    if (Math.abs(droneState.pos.x) > halfSize) {
        droneState.pos.x = Math.sign(droneState.pos.x) * halfSize;
        droneState.vel.x *= -0.35;
    }
    if (Math.abs(droneState.pos.z) > halfSize) {
        droneState.pos.z = Math.sign(droneState.pos.z) * halfSize;
        droneState.vel.z *= -0.35;
    }
    if (droneState.pos.y > ceiling) {
        droneState.pos.y = ceiling;
        droneState.vel.y = Math.min(0, droneState.vel.y);
    }

    decayRotorSpeeds(dt);
}

// --- Render Interpolation (fixed-step state -> display state) ---
export function updateRenderTransforms(alpha, world) {
    const t = THREE.MathUtils.clamp(alpha, 0, 1);

    droneState.renderPos.lerpVectors(droneState.prevPos, droneState.pos, t);
    droneState.renderQuaternion.copy(droneState.prevQuaternion).slerp(droneState.quaternion, t);

    world.droneMesh.position.copy(droneState.renderPos);
    world.droneMesh.quaternion.copy(droneState.renderQuaternion);
}

// --- Propeller Visuals (render rate) ---
export function updatePropellers(dt, world) {
    if (!world.propellers) return;

    const spinScale = dt * 10;
    for (let i = 0; i < world.propellers.length; i++) {
        const speed = droneState.rotorSpeeds[i] || 0;
        const prop = world.propellers[i];
        prop.rotation.y = (prop.rotation.y + speed * spinScale) % (Math.PI * 2);
    }
}
