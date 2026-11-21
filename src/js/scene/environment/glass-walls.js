import * as THREE from 'three';

// Semi-transparent glass walls on the level's flight bounds: they make the
// arena limit visible without blocking the camera. The panes use BackSide
// (rendered only from inside), so an orbital inspection from outside looks
// straight through them, exactly like the pavilion walls.
//
// Colours are theme-neutral (a soft ice tint plus a cyan rim) so the glass
// works in the daylight and night themes without per-theme tuning.

const GLASS_COLOR = 0x9fd8ff;
const GLASS_OPACITY = 0.14;
const RIM_COLOR = 0x22d3ee;
const WALL_MARGIN = 0.4; // inner face sits just outside the flight clamp

export function buildGlassWalls(def, bounds, root) {
    if (def.environment?.glassWalls !== true) return null;

    const half = bounds.halfSize + WALL_MARGIN;
    const wallHeight = Math.ceil(bounds.ceiling) + 1;
    const span = 2 * half + 1; // overlap the corners so no gap shows

    const glassMaterial = new THREE.MeshStandardMaterial({
        color: GLASS_COLOR,
        transparent: true,
        opacity: GLASS_OPACITY,
        roughness: 0.08,
        metalness: 0,
        side: THREE.BackSide,
        depthWrite: false,
    });

    const rimMaterial = new THREE.MeshBasicMaterial({
        color: RIM_COLOR,
        transparent: true,
        opacity: 0.7,
    });

    const specs = [
        { rotY: Math.PI, pos: [0, wallHeight / 2, -half] },
        { rotY: 0, pos: [0, wallHeight / 2, half] },
        { rotY: Math.PI / 2, pos: [half, wallHeight / 2, 0] },
        { rotY: -Math.PI / 2, pos: [-half, wallHeight / 2, 0] },
    ];

    const group = new THREE.Group();
    group.name = 'glass-walls';

    specs.forEach(({ rotY, pos }) => {
        const pane = new THREE.Mesh(new THREE.PlaneGeometry(span, wallHeight), glassMaterial);
        pane.rotation.y = rotY;
        pane.position.set(...pos);
        group.add(pane);

        // Subtle emissive rim along the top edge, so the limit reads at a glance.
        const rim = new THREE.Mesh(new THREE.BoxGeometry(span, 0.08, 0.08), rimMaterial);
        rim.position.set(pos[0], wallHeight, pos[2]);
        group.add(rim);
    });

    root.add(group);
    return { glassMaterial, rimMaterial };
}
