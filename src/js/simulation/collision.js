import * as THREE from 'three';
import { controlState, droneState } from '../core/state.js';

// The drone is approximated by a sphere large enough to include the body and
// the fragile rotor tips. This keeps collisions predictable without per-mesh
// raycasts.
export const DRONE_COLLISION_RADIUS = 1.3;

const RESTITUTION = 0.18;

const _inverseQuat = new THREE.Quaternion();
const _localPos = new THREE.Vector3();
const _closestLocal = new THREE.Vector3();
const _normal = new THREE.Vector3();
const _tumbleAxis = new THREE.Vector3();

function collideCylinder(pos, obstacle) {
    const radius = obstacle.radius;
    const height = obstacle.height;
    const dx = pos.x - obstacle.pos.x;
    const dz = pos.z - obstacle.pos.z;
    const rho = Math.hypot(dx, dz);
    const radialX = rho > 1e-6 ? dx / rho : 1;
    const radialZ = rho > 1e-6 ? dz / rho : 0;

    // Center inside the solid pillar: push out through the nearest surface.
    if (rho <= radius && pos.y >= 0 && pos.y <= height) {
        const sideDistance = radius - rho;
        const topDistance = height - pos.y;
        const bottomDistance = pos.y;

        if (sideDistance <= topDistance && sideDistance <= bottomDistance) {
            _normal.set(radialX, 0, radialZ);
            return { normal: _normal.clone(), penetration: DRONE_COLLISION_RADIUS + sideDistance };
        }
        if (topDistance <= bottomDistance) {
            _normal.set(0, 1, 0);
            return { normal: _normal.clone(), penetration: DRONE_COLLISION_RADIUS + topDistance };
        }
        _normal.set(0, -1, 0);
        return { normal: _normal.clone(), penetration: DRONE_COLLISION_RADIUS + bottomDistance };
    }

    // Nearest point on the finite cylinder surface, including the top edge.
    const closestRadius = Math.min(rho, radius);
    const closestY = THREE.MathUtils.clamp(pos.y, 0, height);
    const offsetX = pos.x - (obstacle.pos.x + radialX * closestRadius);
    const offsetY = pos.y - closestY;
    const offsetZ = pos.z - (obstacle.pos.z + radialZ * closestRadius);
    const distanceSq = offsetX * offsetX + offsetY * offsetY + offsetZ * offsetZ;

    if (distanceSq >= DRONE_COLLISION_RADIUS * DRONE_COLLISION_RADIUS) return null;

    const distance = Math.sqrt(distanceSq);
    if (distance < 1e-6) {
        _normal.set(radialX, 0, radialZ);
        return { normal: _normal.clone(), penetration: DRONE_COLLISION_RADIUS };
    }

    _normal.set(offsetX / distance, offsetY / distance, offsetZ / distance);
    return { normal: _normal.clone(), penetration: DRONE_COLLISION_RADIUS - distance };
}

function collideRing(pos, ring) {
    // Torus lies in its local XY plane; the hole axis is local Z.
    _inverseQuat.copy(ring.quaternion).invert();
    _localPos.copy(pos).sub(ring.position).applyQuaternion(_inverseQuat);

    const rho = Math.hypot(_localPos.x, _localPos.y);
    if (rho > 1e-6) {
        _closestLocal.set(
            (_localPos.x / rho) * ring.radius,
            (_localPos.y / rho) * ring.radius,
            0
        );
    } else {
        _closestLocal.set(ring.radius, 0, 0);
    }

    const offsetX = _localPos.x - _closestLocal.x;
    const offsetY = _localPos.y - _closestLocal.y;
    const offsetZ = _localPos.z - _closestLocal.z;
    const distanceSq = offsetX * offsetX + offsetY * offsetY + offsetZ * offsetZ;
    const combinedRadius = ring.tube + DRONE_COLLISION_RADIUS;

    if (distanceSq >= combinedRadius * combinedRadius) return null;

    const distance = Math.sqrt(distanceSq);
    if (distance < 1e-6) {
        _normal.set(0, 0, 1);
    } else {
        _normal.set(offsetX / distance, offsetY / distance, offsetZ / distance);
    }

    return {
        normal: _normal.clone().applyQuaternion(ring.quaternion),
        penetration: combinedRadius - distance,
    };
}

// Returns the first collision against the current level geometry, or null.
export function detectCollision(pos, world) {
    const obstacles = world.obstacles || [];
    for (let i = 0; i < obstacles.length; i++) {
        const hit = collideCylinder(pos, obstacles[i]);
        if (hit) {
            return { ...hit, type: 'obstacle', mesh: obstacles[i].mesh };
        }
    }

    const rings = world.rings || [];
    for (let i = 0; i < rings.length; i++) {
        const hit = collideRing(pos, rings[i]);
        if (hit) {
            return { ...hit, type: 'ring', mesh: rings[i].mesh, ring: rings[i] };
        }
    }

    return null;
}

// Turns an obstacle / ring contact into a crash, adding a bounce and tumbling.
export function resolveCollision(hit) {
    const impactSpeed = droneState.vel.length();

    // Move the sphere out of the collider before the next step.
    droneState.pos.addScaledVector(hit.normal, hit.penetration + 0.02);

    const normalSpeed = droneState.vel.dot(hit.normal);
    if (normalSpeed < 0) {
        droneState.vel.addScaledVector(hit.normal, -(1 + RESTITUTION) * normalSpeed);
    }
    droneState.vel.multiplyScalar(0.82);

    // Convert impact energy into a plausible tumble.
    _tumbleAxis.crossVectors(hit.normal, droneState.vel).multiplyScalar(0.6);
    droneState.angularVel.add(_tumbleAxis);
    droneState.angularVel.x += (Math.random() - 0.5) * 4;
    droneState.angularVel.y += (Math.random() - 0.5) * 2;
    droneState.angularVel.z += (Math.random() - 0.5) * 4;

    const spin = droneState.angularVel.length();
    if (spin > 10) {
        droneState.angularVel.multiplyScalar(10 / spin);
    }

    droneState.flight.status = 'crashed';
    droneState.flight.cause = hit.type;
    droneState.flight.impactSpeed = impactSpeed;
    droneState.flight.time = 0;
    droneState.flight.resting = false;

    // Controls are dead after impact. The loop will report the crash.
    droneState.throttle = 0;
    droneState.pitch = 0;
    droneState.roll = 0;
    droneState.yaw = 0;
    controlState.pythonRunning = false;

    return impactSpeed;
}
