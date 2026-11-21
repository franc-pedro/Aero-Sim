import * as THREE from 'three';

// Flight trajectory line: a dashed THREE.Line updated at render rate from the
// interpolated drone position. Helps students debug visual paths (loops, squares
// drawn with for cycles) without touching the fixed-step physics.

const MAX_POINTS = 3000;
const MIN_SEGMENT = 0.05; // metres between recorded points
const TELEPORT_DISTANCE = 3; // reset / level change / crash reset jumps

let line = null;
let pointCount = 0;
let lastPoint = null;

export function initTrail(scene) {
    if (line) return line;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_POINTS * 3), 3));
    geometry.setDrawRange(0, 0);

    line = new THREE.Line(geometry, new THREE.LineDashedMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.55,
        dashSize: 0.16,
        gapSize: 0.1,
        depthWrite: false,
    }));
    line.frustumCulled = false;
    line.renderOrder = 2;
    scene.add(line);
    return line;
}

export function updateTrail(renderPos) {
    if (!line || !line.visible) return;

    const attribute = line.geometry.attributes.position;

    // Level changes and session resets teleport the drone: start a fresh trail.
    if (lastPoint && renderPos.distanceTo(lastPoint) > TELEPORT_DISTANCE) {
        clearTrail();
    }

    if (lastPoint && renderPos.distanceTo(lastPoint) < MIN_SEGMENT) return;

    if (pointCount >= MAX_POINTS) {
        attribute.array.copyWithin(0, 3);
        pointCount = MAX_POINTS - 1;
    }

    attribute.setXYZ(pointCount, renderPos.x, renderPos.y, renderPos.z);
    pointCount += 1;
    attribute.needsUpdate = true;
    line.geometry.setDrawRange(0, pointCount);

    if (!lastPoint) lastPoint = new THREE.Vector3();
    lastPoint.copy(renderPos);
    line.computeLineDistances();
}

export function clearTrail() {
    if (!line) return;
    pointCount = 0;
    lastPoint = null;
    line.geometry.setDrawRange(0, 0);
}

export function setTrailVisible(visible) {
    if (!line) return;
    line.visible = visible;
    // Re-enabling starts a new trail so no segment is drawn across the gap.
    if (visible) clearTrail();
}
