import * as THREE from 'three';
import { droneState } from '../core/state.js';

// --- Smooth Chase Camera ---
export function updateCamera(camera) {
    const idealOffset = new THREE.Vector3(0, 2.5, -6).applyEuler(new THREE.Euler(0, droneState.rotation.y, 0));
    const idealLookAt = droneState.pos.clone().add(new THREE.Vector3(0, 0.5, 0));

    const targetCamPos = droneState.pos.clone().add(idealOffset);
    camera.position.lerp(targetCamPos, 0.1);

    camera.lookAt(idealLookAt);
}
