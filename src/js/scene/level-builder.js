import * as THREE from 'three';
import { SCENE_THEMES } from '../config/themes.js';

const DEFAULT_RING_RADIUS = 4;
const DEFAULT_RING_TUBE = 0.25;
const DEFAULT_BOUNDS = { halfSize: 180, ceiling: 150 };
const DEFAULT_SPAWN = { x: 0, y: 1.5, z: 0, yaw: 0 };

const DEFAULT_PALETTE = {
    pillar: 0x3b82f6,
    hazard: 0xf43f5e,
    tower: 0x334155,
    ring: 0x3b82f6,
    decor: 0x475569,
};

function validateLevel(def) {
    if (!import.meta.env || !import.meta.env.DEV) return;

    const bounds = { ...DEFAULT_BOUNDS, ...(def.bounds || {}) };
    const spawn = { ...DEFAULT_SPAWN, ...(def.spawn || {}) };

    if (Math.abs(spawn.x) > bounds.halfSize || Math.abs(spawn.z) > bounds.halfSize) {
        console.warn(`[level:${def.id}] spawn is outside the level bounds`, spawn);
    }

    (def.rings || []).forEach((ring, index) => {
        const radius = ring.radius ?? DEFAULT_RING_RADIUS;
        if (Math.abs(ring.x) > bounds.halfSize || Math.abs(ring.z) > bounds.halfSize) {
            console.warn(`[level:${def.id}] ring ${index} is outside the level bounds`, ring);
        }
        if (ring.y + radius + 2 > bounds.ceiling) {
            console.warn(`[level:${def.id}] ring ${index} is too close to the ceiling`, ring);
        }
    });

    (def.obstacles || []).forEach((obstacle, index) => {
        const spawnDistance = Math.hypot(obstacle.x - spawn.x, obstacle.z - spawn.z);
        if (spawnDistance < obstacle.radius + 4) {
            console.warn(`[level:${def.id}] obstacle ${index} is too close to spawn`, obstacle);
        }

        (def.rings || []).forEach((ring, ringIndex) => {
            const ringRadius = ring.radius ?? DEFAULT_RING_RADIUS;
            const distance = Math.hypot(obstacle.x - ring.x, obstacle.z - ring.z);
            if (distance < ringRadius + obstacle.radius + 2) {
                console.warn(`[level:${def.id}] obstacle ${index} intersects ring ${ringIndex}`, obstacle);
            }
        });
    });
}

function makeObstacleMaterials(palette) {
    const cache = new Map();

    return function getObstacleMaterial(kind) {
        const key = kind || 'pillar';
        if (!cache.has(key)) {
            cache.set(key, new THREE.MeshStandardMaterial({
                color: palette[key] ?? palette.pillar,
                roughness: 0.62,
                metalness: 0.15,
            }));
        }
        return cache.get(key);
    };
}

export function buildLevel(def, scene, themeName = 'daylight') {
    validateLevel(def);

    const theme = SCENE_THEMES[themeName] || SCENE_THEMES.daylight;
    const groundConfig = def.ground || {};
    const groundSize = groundConfig.size ?? 400;
    const groundDivisions = groundConfig.divisions ?? 80;
    const palette = { ...DEFAULT_PALETTE, ...(def.palette || {}) };
    const spawn = { ...DEFAULT_SPAWN, ...(def.spawn || {}) };

    const root = new THREE.Group();
    root.name = `level:${def.id}`;
    scene.add(root);

    // Ground and grid
    const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize);
    const groundMat = new THREE.MeshStandardMaterial({
        color: theme.groundColor,
        roughness: 0.85,
        metalness: 0.04,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    root.add(groundMesh);

    const gridHelper = new THREE.GridHelper(
        groundSize,
        groundDivisions,
        theme.gridMain,
        theme.gridSub
    );
    gridHelper.position.y = 0.05;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = theme.gridOpacity ?? 0.68;
    root.add(gridHelper);

    // Optional landing pads for mission levels.
    function addLandingPad(padDef) {
        const padRadius = padDef.radius ?? 3;
        const padColor = padDef.color ?? palette.ring;
        const padMaterial = new THREE.MeshStandardMaterial({
            color: padColor,
            emissive: padColor,
            emissiveIntensity: padDef.emissiveIntensity ?? 0.08,
            roughness: 0.62,
            metalness: 0.1,
            transparent: true,
            opacity: padDef.opacity ?? 0.45,
            side: THREE.DoubleSide,
        });

        const padX = padDef.x ?? spawn.x;
        const padZ = padDef.z ?? spawn.z;

        const pad = new THREE.Mesh(new THREE.CircleGeometry(padRadius, 48), padMaterial);
        pad.rotation.x = -Math.PI / 2;
        pad.position.set(padX, 0.07, padZ);
        pad.receiveShadow = true;
        root.add(pad);

        const padRing = new THREE.Mesh(
            new THREE.TorusGeometry(padRadius, 0.14, 8, 64),
            padMaterial
        );
        padRing.rotation.x = -Math.PI / 2;
        padRing.position.set(padX, 0.09, padZ);
        padRing.receiveShadow = true;
        root.add(padRing);
    }

    [def.landingPad, def.missionPad].filter(Boolean).forEach(addLandingPad);

    // Pillars / towers
    const getObstacleMaterial = makeObstacleMaterials(palette);
    const obstacles = [];
    const solids = [];

    (def.obstacles || []).forEach((obstacle) => {
        const radius = obstacle.radius ?? 2;
        const height = obstacle.height ?? 10;
        const geometry = new THREE.CylinderGeometry(radius, radius, height, 16);
        const mesh = new THREE.Mesh(geometry, getObstacleMaterial(obstacle.kind));

        mesh.position.set(obstacle.x, height / 2, obstacle.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        root.add(mesh);

        const collider = {
            shape: 'cylinder',
            mesh,
            radius,
            height,
            bottom: 0,
            top: height,
            kind: obstacle.kind || 'pillar',
            pos: new THREE.Vector3(obstacle.x, height / 2, obstacle.z),
        };
        obstacles.push(collider);
        solids.push(collider);
    });

    // Rings and gates
    const ringColor = new THREE.Color(palette.ring).lerp(new THREE.Color(0x94a3b8), 0.3);
    const ringMat = new THREE.MeshStandardMaterial({
        color: ringColor,
        emissive: ringColor,
        emissiveIntensity: 0.08,
        roughness: 0.52,
        metalness: 0.12,
    });
    const rings = [];
    const gates = [];

    (def.rings || []).forEach((ringDef, index) => {
        const radius = ringDef.radius ?? DEFAULT_RING_RADIUS;
        const tube = ringDef.tube ?? DEFAULT_RING_TUBE;
        const geometry = new THREE.TorusGeometry(radius, tube, 16, 50);
        const mesh = new THREE.Mesh(geometry, ringMat);

        mesh.position.set(ringDef.x, ringDef.y, ringDef.z);
        mesh.rotation.set(ringDef.pitch ?? 0, ringDef.yaw ?? 0, ringDef.roll ?? 0);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        root.add(mesh);

        const collider = {
            mesh,
            radius,
            tube,
            position: mesh.position.clone(),
            quaternion: mesh.quaternion.clone(),
            isGate: ringDef.gate !== false,
            order: index,
            passed: false,
        };
        rings.push(collider);
        if (collider.isGate) gates.push(collider);
    });

    // Decorative structures are solid by default so new level props cannot be
    // flown through. Set `solid: false` only for a deliberately non-solid
    // backdrop.
    (def.decor || []).forEach((decor) => {
        let geometry;
        let collider;
        const y = decor.y ?? 0;
        const height = decor.height ?? 10;

        if (decor.type === 'cylinder') {
            const radius = decor.radius ?? 2;
            geometry = new THREE.CylinderGeometry(radius, radius, height, 16);
            collider = {
                shape: 'cylinder',
                mesh: null,
                radius,
                height,
                bottom: y - height / 2,
                top: y + height / 2,
                isDecor: true,
                pos: new THREE.Vector3(decor.x ?? 0, y, decor.z ?? 0),
            };
        } else {
            const width = decor.width ?? 10;
            const depth = decor.depth ?? 10;
            geometry = new THREE.BoxGeometry(width, height, depth);
            collider = {
                shape: 'box',
                mesh: null,
                halfExtents: new THREE.Vector3(width / 2, height / 2, depth / 2),
                yaw: decor.yaw ?? 0,
                isDecor: true,
                pos: new THREE.Vector3(decor.x ?? 0, y, decor.z ?? 0),
            };
        }

        const material = new THREE.MeshStandardMaterial({
            color: decor.color ?? palette.decor,
            roughness: decor.roughness ?? 0.82,
            metalness: decor.metalness ?? 0.05,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(decor.x ?? 0, y, decor.z ?? 0);
        mesh.rotation.y = decor.yaw ?? 0;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        root.add(mesh);

        if (decor.solid !== false) {
            collider.mesh = mesh;
            solids.push(collider);
        }
    });

    return {
        def,
        root,
        groundMesh,
        gridHelper,
        obstacles,
        solids,
        rings,
        gates,
        bounds: { ...DEFAULT_BOUNDS, ...(def.bounds || {}) },
        spawn,
        landingPad: def.landingPad || null,
    };
}

export function disposeLevel(level, scene) {
    if (!level || !level.root) return;

    scene.remove(level.root);

    const geometries = new Set();
    const materials = new Set();

    level.root.traverse((object) => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) {
            if (Array.isArray(object.material)) {
                object.material.forEach((material) => materials.add(material));
            } else {
                materials.add(object.material);
            }
        }
    });

    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
}
