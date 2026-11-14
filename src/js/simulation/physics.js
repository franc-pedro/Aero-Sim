import * as THREE from 'three';
import { controlState, droneState } from '../core/state.js';
import { pollGamepad } from '../controls/gamepad.js';
import { handleKeyboard } from '../controls/keyboard.js';
import { runPythonStep } from '../python/autopilot.js';
import { updateHUD } from '../ui/hud.js';
import { updateCamera } from './camera.js';

// --- Physics & Flight Simulation ---
export function updatePhysics(dt, world) {
    if (controlState.mode === 'python') {
        runPythonStep(dt);
    } else {
        pollGamepad();
        handleKeyboard();
    }

    // Battery drain simulation
    if (droneState.battery > 0 && (droneState.pos.y > 0.3 || Math.abs(droneState.throttle - 50) > 2)) {
        droneState.battery = Math.max(0, droneState.battery - 0.001 * Math.max(0.25, droneState.throttle / 100));
    }

    // Target orientation based on stick input using YXZ Euler order to eliminate gimbal lock:
    // Yaw (Y) -> Pitch (X) -> Roll (Z)
    const maxTilt = Math.PI / 4.5; // ~40 degrees max tilt
    const targetPitch = droneState.pitch * maxTilt;
    const targetRoll = droneState.roll * maxTilt;

    droneState.rotation.order = 'YXZ';
    droneState.rotation.x = THREE.MathUtils.lerp(droneState.rotation.x, targetPitch, 0.2);
    droneState.rotation.z = THREE.MathUtils.lerp(droneState.rotation.z, targetRoll, 0.2);

    // Yaw rotation rate
    const yawRate = 2.2;
    droneState.rotation.y += droneState.yaw * yawRate * dt;

    // Sync drone quaternion immediately from YXZ Euler rotation
    world.droneMesh.quaternion.setFromEuler(droneState.rotation);

    // Vertical Altitude-Hold Physics:
    // throttle = 50% (throttleCmd = 0) holds exact altitude with zero vertical drift
    const throttleCmd = (droneState.throttle - 50) / 50; // -1 (down) to +1 (up)
    const verticalAccel = Math.abs(throttleCmd) < 0.02
        ? -droneState.vel.y * 6.0 // Strong vertical damping to lock altitude in place
        : throttleCmd * 16.0 - droneState.vel.y * 2.2;

    // Horizontal flight acceleration along forward (+Z) and right (-X) heading vectors
    const yawQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), droneState.rotation.y);
    const forwardDir = new THREE.Vector3(0, 0, 1).applyQuaternion(yawQuat);
    const rightDir = new THREE.Vector3(-1, 0, 0).applyQuaternion(yawQuat);

    const controlAuthority = 18.0;
    const acceleration = new THREE.Vector3(0, verticalAccel, 0);
    acceleration.addScaledVector(forwardDir, droneState.pitch * controlAuthority);
    acceleration.addScaledVector(rightDir, droneState.roll * controlAuthority);

    // Horizontal aerodynamic drag (brakes smoothly to a stationary hover when sticks are released)
    acceleration.x -= droneState.vel.x * 1.8;
    acceleration.z -= droneState.vel.z * 1.8;

    // Integrate velocity & position
    droneState.vel.addScaledVector(acceleration, dt);
    droneState.pos.addScaledVector(droneState.vel, dt);

    // Ground collision detection
    if (droneState.pos.y < 0.25) {
        droneState.pos.y = 0.25;
        droneState.vel.y = Math.max(0, droneState.vel.y);
        if (Math.abs(droneState.pitch) < 0.05 && Math.abs(droneState.roll) < 0.05) {
            droneState.vel.x *= 0.88;
            droneState.vel.z *= 0.88;
        }
    }

    // Boundary limits
    const limit = 180;
    if (Math.abs(droneState.pos.x) > limit) {
        droneState.pos.x = Math.sign(droneState.pos.x) * limit;
        droneState.vel.x *= -0.5;
    }
    if (Math.abs(droneState.pos.z) > limit) {
        droneState.pos.z = Math.sign(droneState.pos.z) * limit;
        droneState.vel.z *= -0.5;
    }
    if (droneState.pos.y > 150) {
        droneState.pos.y = 150;
        droneState.vel.y = 0;
    }

    // Update 3D Mesh Position (quaternion already synced above)
    world.droneMesh.position.copy(droneState.pos);

    // Spin Propellers dynamically using Quadcopter Motor Mixing (Throttle + Airborne Hover + Pitch/Roll/Yaw differential)
    const isAirborne = droneState.pos.y > 0.32;
    const controlEffort = Math.abs(droneState.pitch) + Math.abs(droneState.roll) + Math.abs(droneState.yaw);
    const baseRpm = isAirborne
        ? Math.max(38, (droneState.throttle / 100) * 55 + 15)
        : (droneState.throttle > 52 || controlEffort > 0.05 ? (droneState.throttle / 100) * 45 + 15 : 0);

    // Motor order: 0 = Front-Left (CW), 1 = Front-Right (CCW), 2 = Rear-Left (CCW), 3 = Rear-Right (CW)
    const motorMix = [
        -droneState.pitch + droneState.roll + droneState.yaw, // Front Left
        -droneState.pitch - droneState.roll - droneState.yaw, // Front Right
        droneState.pitch + droneState.roll - droneState.yaw, // Rear Left
        droneState.pitch - droneState.roll + droneState.yaw, // Rear Right
    ];

    world.propellers.forEach((prop, idx) => {
        const sign = (idx === 0 || idx === 3) ? 1 : -1;
        const differential = motorMix[idx] * 18;
        const rotorSpeed = (baseRpm > 0 || controlEffort > 0.05)
            ? Math.max(12, baseRpm + differential)
            : 0;
        prop.rotation.y += rotorSpeed * sign * dt * 10;
    });

    // Update Chase Camera
    updateCamera(world.camera);

    // Update UI Telemetry
    updateHUD();
}
