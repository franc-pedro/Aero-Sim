import * as THREE from 'three';
import { droneState } from '../core/state.js';

const _normal = new THREE.Vector3();
const _prevRelative = new THREE.Vector3();
const _currRelative = new THREE.Vector3();
const _intersection = new THREE.Vector3();
const _inverseQuat = new THREE.Quaternion();

// Detects when the drone crosses a gate plane inside the opening. Gates are
// one-shot objectives for the current level; touching the frame is handled by
// the collision system and crashes the drone instead.
export function checkGateCrossings(prevPos, pos, world) {
    const gates = world.gates;
    if (!gates || gates.length === 0) return 0;

    let crossed = 0;

    for (let i = 0; i < gates.length; i++) {
        const gate = gates[i];
        if (gate.passed) continue;

        _normal.set(0, 0, 1).applyQuaternion(gate.quaternion);
        const prevDistance = _prevRelative.copy(prevPos).sub(gate.position).dot(_normal);
        const currDistance = _currRelative.copy(pos).sub(gate.position).dot(_normal);

        if (prevDistance === currDistance) continue;
        if (prevDistance * currDistance > 0) continue;

        const t = prevDistance / (prevDistance - currDistance);
        if (t < 0 || t > 1) continue;

        _intersection.lerpVectors(prevPos, pos, t);
        _inverseQuat.copy(gate.quaternion).invert();
        _intersection.sub(gate.position).applyQuaternion(_inverseQuat);

        const radial = Math.hypot(_intersection.x, _intersection.y);
        if (radial >= gate.radius - gate.tube - 0.2) continue;

        gate.passed = true;
        droneState.objectives.gatesPassed++;
        crossed++;
    }

    if (crossed > 0 && droneState.objectives.gatesTotal > 0) {
        droneState.objectives.completed =
            droneState.objectives.gatesPassed >= droneState.objectives.gatesTotal;
    }

    return crossed;
}
