import * as THREE from 'three';

// Luminous arrow mounted just ahead of the nose. The Tello is nearly
// symmetric, so after a rotate_clockwise(90) beginners lose track of which way
// the drone is facing; this arrow always points along +Z (the flight-forward
// axis) and pitches / rolls with the body. Dimensions are in model space (the
// group is scaled down by DRONE_MODEL_SCALE).
export function createNoseIndicator() {
    const material = new THREE.MeshBasicMaterial({
        color: 0x34d399,
        transparent: true,
        opacity: 0.95,
    });

    const arrow = new THREE.Group();
    arrow.name = 'nose-indicator';

    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.3, 12), material);
    tip.rotation.x = Math.PI / 2; // tip points along +Z
    tip.position.z = 0.68;
    arrow.add(tip);

    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.18), material);
    shaft.position.z = 0.44;
    arrow.add(shaft);

    return arrow;
}
