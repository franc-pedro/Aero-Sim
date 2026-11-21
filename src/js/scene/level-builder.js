import * as THREE from 'three';
import { SCENE_THEMES } from '../config/themes.js';
import { refreshEnvironmentIntensity } from './atmosphere.js';
import { buildPavilion, getHelipadTexture, getPadMarkerTexture, makeGridTexture } from './environment/pavilion.js';
import { buildGlassWalls } from './environment/glass-walls.js';

const DEFAULT_RING_RADIUS = 4;
const DEFAULT_RING_TUBE = 0.25;
const DEFAULT_BOUNDS = { halfSize: 180, ceiling: 150 };
const DEFAULT_SPAWN = { x: 0, y: 1.5, z: 0, yaw: 0 };

const DEFAULT_PALETTE = {
    pillar: 0x287F47,
    hazard: 0xf43f5e,
    tower: 0x6C81B7,
    ring: 0xF5CD30,
    decor: 0xAA0000,
};

const _identityQuaternion = new THREE.Quaternion();

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

// --- City props: buildings, arches, bridges, road marks ---
// Solid parts map onto the existing box colliders so collision handling is
// unchanged. Windows are baked into a facade texture used as both map and
// emissive map, so lit windows glow in the night theme without extra meshes.

function makeFacadeTexture(facadeHex, windowHex, litRatio, seed) {
    const cells = 8;
    const cell = 24;
    const inset = 5;
    const size = cells * cell;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = facadeHex;
    ctx.fillRect(0, 0, size, size);

    let state = (seed >>> 0) || 1;
    const rand = () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 4294967296;
    };

    for (let row = 0; row < cells; row++) {
        for (let col = 0; col < cells; col++) {
            const lit = rand() < litRatio;
            ctx.fillStyle = lit ? windowHex : 'rgba(8, 12, 22, 0.92)';
            ctx.fillRect(col * cell + inset, row * cell + inset, cell - inset * 2, cell - inset * 2);
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

function pushBoxCollider(solids, mesh, x, yCenter, z, width, height, depth, yaw = 0) {
    const collider = {
        shape: 'box',
        mesh,
        halfExtents: new THREE.Vector3(width / 2, height / 2, depth / 2),
        yaw,
        isDecor: true,
        pos: new THREE.Vector3(x, yCenter, z),
    };
    solids.push(collider);
    return collider;
}

function addBuilding(decor, root, solids, themeName, s) {
    const width = decor.width ?? 16 * s;
    const depth = decor.depth ?? 16 * s;
    const height = decor.height ?? 30 * s;
    const yaw = decor.yaw ?? 0;
    const facadeColor = new THREE.Color(decor.color ?? 0x1b2436);
    const windowColor = decor.windowColor ?? '#7dd3fc';
    const litRatio = decor.litRatio ?? 0.55;
    const emissiveIntensity = themeName === 'night' ? 0.85 : 0.12;

    const texture = makeFacadeTexture(
        '#' + facadeColor.getHexString(),
        windowColor,
        litRatio,
        (decor.seed ?? 7) + Math.round(width * 31 + height * 7)
    );
    texture.repeat.set(Math.max(2, Math.round(width / 5)), Math.max(3, Math.round(height / 6)));

    const facadeMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: texture,
        emissive: 0xffffff,
        emissiveMap: texture,
        emissiveIntensity,
        roughness: 0.72,
        metalness: 0.15,
    });

    const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), facadeMat);
    body.position.set(decor.x, height / 2, decor.z);
    body.rotation.y = yaw;
    body.castShadow = true;
    body.receiveShadow = true;
    root.add(body);

    const baseMat = new THREE.MeshStandardMaterial({ color: 0x0b1220, roughness: 0.85, metalness: 0.05 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(width + 0.5 * s, 2.2 * s, depth + 0.5 * s), baseMat);
    base.position.set(decor.x, 1.1 * s, decor.z);
    base.rotation.y = yaw;
    base.receiveShadow = true;
    root.add(base);

    const roofMat = new THREE.MeshStandardMaterial({
        color: facadeColor.clone().multiplyScalar(0.5),
        roughness: 0.85,
        metalness: 0.1,
    });
    const roofCap = new THREE.Mesh(new THREE.BoxGeometry(width + 0.35 * s, 0.45 * s, depth + 0.35 * s), roofMat);
    roofCap.position.set(decor.x, height + 0.22 * s, decor.z);
    roofCap.rotation.y = yaw;
    roofCap.receiveShadow = true;
    root.add(roofCap);

    let state = ((decor.seed ?? 7) + 13) >>> 0;
    const rand = () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 4294967296;
    };
    const acCount = decor.roofProps === false ? 0 : 1 + Math.floor(rand() * 2);
    const acMat = new THREE.MeshStandardMaterial({ color: 0x2b3648, roughness: 0.6, metalness: 0.4 });
    for (let i = 0; i < acCount; i++) {
        const acWidth = (2 + rand() * 1.2) * s;
        const ac = new THREE.Mesh(new THREE.BoxGeometry(acWidth, 1.1 * s, acWidth * 0.8), acMat);
        const limitX = Math.max(0, width / 2 - 2.6 * s);
        const limitZ = Math.max(0, depth / 2 - 2.6 * s);
        ac.position.set(
            decor.x + (rand() * 2 - 1) * limitX,
            height + (0.45 + 0.55) * s,
            decor.z + (rand() * 2 - 1) * limitZ
        );
        ac.rotation.y = yaw + rand() * Math.PI;
        ac.castShadow = true;
        root.add(ac);
    }

    if (decor.beacon) {
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.07 * s, 0.07 * s, 1.4 * s, 8), acMat);
        mast.position.set(decor.x, height + (0.45 + 0.7) * s, decor.z);
        root.add(mast);

        const beacon = new THREE.Mesh(
            new THREE.SphereGeometry(0.2 * s, 12, 12),
            new THREE.MeshBasicMaterial({ color: 0xff2d55 })
        );
        beacon.position.set(decor.x, height + (0.45 + 1.55) * s, decor.z);
        root.add(beacon);
    }

    pushBoxCollider(solids, body, decor.x, height / 2, decor.z, width, height, depth, yaw);
}

function addArch(decor, root, solids, movers, s) {
    const span = decor.span ?? 20 * s;
    const height = decor.height ?? 22 * s;
    const thickness = decor.thickness ?? 1.6 * s;
    const depth = decor.depth ?? 3 * s;
    const yaw = decor.yaw ?? 0;
    const color = decor.color ?? 0x1b2436;
    const neonColor = decor.neon ?? 0x67e8f9;
    const motion = decor.motion || null;
    const verticalAmplitude = motion?.vertical ?? 0;

    const pillarMat = new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.15 });

    // The whole arch lives in one group so moving props translate as a unit.
    const group = new THREE.Group();
    group.position.set(decor.x, 0, decor.z);
    group.rotation.y = yaw;
    root.add(group);

    // With vertical motion the pillars extend below ground so their base never
    // lifts off the floor: top stays at `height`, base oscillates buried.
    const pillarOffset = span / 2 + thickness / 2;
    const pillarHeight = height + verticalAmplitude;
    const pillarCenterY = (height - verticalAmplitude) / 2;
    const colliders = [];

    [-pillarOffset, pillarOffset].forEach((offset) => {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(thickness, pillarHeight, depth), pillarMat);
        pillar.position.set(offset, pillarCenterY, 0);
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        group.add(pillar);

        const collider = pushBoxCollider(
            solids,
            pillar,
            decor.x + offset * Math.cos(yaw),
            pillarCenterY,
            decor.z - offset * Math.sin(yaw),
            thickness,
            pillarHeight,
            depth,
            yaw
        );
        collider.localOffset = new THREE.Vector3(offset, pillarCenterY, 0);
        colliders.push(collider);
    });

    const lintelWidth = span + thickness * 2;
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(lintelWidth, 2.2 * s, depth), pillarMat);
    lintel.position.set(0, height + 1.1 * s, 0);
    lintel.castShadow = true;
    group.add(lintel);

    const lintelCollider = pushBoxCollider(solids, lintel, decor.x, height + 1.1 * s, decor.z, lintelWidth, 2.2 * s, depth, yaw);
    lintelCollider.localOffset = new THREE.Vector3(0, height + 1.1 * s, 0);
    colliders.push(lintelCollider);

    const neon = new THREE.Mesh(
        new THREE.BoxGeometry(span, 0.12 * s, 0.12 * s),
        new THREE.MeshBasicMaterial({ color: neonColor })
    );
    neon.position.set(0, height - 0.3 * s, 0);
    group.add(neon);

    if (motion && (verticalAmplitude || motion.lateral)) {
        movers.push({
            group,
            colliders,
            baseX: decor.x,
            baseZ: decor.z,
            yaw,
            vertical: verticalAmplitude,
            lateral: motion.lateral ?? 0,
            period: motion.period ?? 10,
            phase: motion.phase ?? 0,
            time: 0,
        });
    }
}

function addBridge(decor, root, solids, s) {
    const length = decor.length ?? 64 * s;
    const width = decor.width ?? 5 * s;
    const deckHeight = decor.height ?? 2.6 * s;
    const y = decor.y ?? 13 * s;
    const yaw = decor.yaw ?? 0;
    const neonColor = decor.neon ?? 0x67e8f9;

    const deckMat = new THREE.MeshStandardMaterial({ color: 0x243044, roughness: 0.68, metalness: 0.2 });

    const deck = new THREE.Mesh(new THREE.BoxGeometry(length, deckHeight, width), deckMat);
    deck.position.set(decor.x, y, decor.z);
    deck.rotation.y = yaw;
    deck.castShadow = true;
    root.add(deck);
    pushBoxCollider(solids, deck, decor.x, y, decor.z, length, deckHeight, width, yaw);

    [-1, 1].forEach((side) => {
        const railing = new THREE.Mesh(
            new THREE.BoxGeometry(length, 0.85 * s, 0.25 * s),
            new THREE.MeshStandardMaterial({ color: 0x2e3b52, roughness: 0.6, metalness: 0.3 })
        );
        railing.position.set(decor.x, y + deckHeight / 2 + 0.4 * s, decor.z);
        railing.rotation.y = yaw;
        railing.translateZ(side * (width / 2 - 0.12 * s));
        railing.castShadow = true;
        root.add(railing);

        const neonEdge = new THREE.Mesh(
            new THREE.BoxGeometry(length, 0.08 * s, 0.06 * s),
            new THREE.MeshBasicMaterial({ color: neonColor })
        );
        neonEdge.position.set(decor.x, y + deckHeight / 2 + 0.05 * s, decor.z);
        neonEdge.rotation.y = yaw;
        neonEdge.translateZ(side * (width / 2 + 0.03 * s));
        root.add(neonEdge);
    });
}

// Pallet rack: uprights, shelf boards and seeded cargo boxes. One box collider
// covers the whole unit so collision handling stays simple.
function addShelf(decor, root, solids, s) {
    const length = decor.length ?? 40 * s;
    const depth = decor.depth ?? 6 * s;
    const height = decor.height ?? 8 * s;
    const bays = decor.bays ?? 4;
    const levels = decor.levels ?? 3;
    const yaw = decor.yaw ?? 0;
    const seed = (decor.seed ?? 5) + Math.round(length * 13 + height * 7);

    const group = new THREE.Group();
    group.position.set(decor.x, 0, decor.z);
    group.rotation.y = yaw;
    root.add(group);

    const frameMat = new THREE.MeshStandardMaterial({
        color: decor.color ?? 0x475569,
        roughness: 0.55,
        metalness: 0.35,
    });
    const boardMat = new THREE.MeshStandardMaterial({
        color: decor.boardColor ?? 0x8a6a45,
        roughness: 0.82,
        metalness: 0.05,
    });
    const cargoColors = decor.cargoColors ?? [0xd97706, 0x0ea5e9, 0x94a3b8, 0xb91c1c];

    let state = seed >>> 0 || 1;
    const rand = () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 4294967296;
    };

    const bayWidth = length / bays;
    const levelHeight = height / (levels + 0.5);
    const postSize = 0.14 * s;

    for (let i = 0; i <= bays; i++) {
        const x = -length / 2 + i * bayWidth;
        [-depth / 2, depth / 2].forEach((zOffset) => {
            const post = new THREE.Mesh(new THREE.BoxGeometry(postSize, height, postSize), frameMat);
            post.position.set(x, height / 2, zOffset);
            post.castShadow = true;
            group.add(post);
        });
    }

    for (let level = 1; level <= levels; level++) {
        const y = level * levelHeight;
        const board = new THREE.Mesh(new THREE.BoxGeometry(length, 0.09 * s, depth), boardMat);
        board.position.set(0, y, 0);
        board.castShadow = true;
        board.receiveShadow = true;
        group.add(board);

        for (let bay = 0; bay < bays; bay++) {
            if (rand() > 0.75) continue;
            const boxWidth = bayWidth * (0.55 + rand() * 0.25);
            const boxHeight = levelHeight * (0.4 + rand() * 0.25);
            const cargoMat = new THREE.MeshStandardMaterial({
                color: cargoColors[Math.floor(rand() * cargoColors.length)],
                roughness: 0.85,
                metalness: 0.02,
            });
            const cargo = new THREE.Mesh(
                new THREE.BoxGeometry(boxWidth, boxHeight, depth * 0.7),
                cargoMat
            );
            cargo.position.set(
                -length / 2 + bay * bayWidth + bayWidth / 2,
                y + boxHeight / 2,
                (rand() - 0.5) * depth * 0.15
            );
            cargo.castShadow = true;
            group.add(cargo);
        }
    }

    pushBoxCollider(solids, group, decor.x, height / 2, decor.z, length, height, depth, yaw);
}

function addRoadmark(decor, root, s) {
    const length = decor.length ?? 60 * s;
    const dash = 2.2 * s;
    const gap = 3 * s;
    const yaw = decor.yaw ?? 0;
    const count = Math.floor(length / (dash + gap));

    const material = new THREE.MeshBasicMaterial({
        color: decor.color ?? 0x67e8f9,
        transparent: true,
        opacity: 0.7,
    });

    for (let i = 0; i < count; i++) {
        const offset = -length / 2 + dash / 2 + i * (dash + gap);
        const dashX = decor.x + offset * Math.sin(yaw);
        const dashZ = decor.z + offset * Math.cos(yaw);

        const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.16 * s, dash), material);
        mark.rotation.x = -Math.PI / 2;
        mark.rotation.z = -yaw;
        mark.position.set(dashX, 0.08 * s, dashZ);
        root.add(mark);
    }
}

export function buildLevel(def, scene, themeName = 'daylight') {
    validateLevel(def);

    const theme = SCENE_THEMES[themeName] || SCENE_THEMES.daylight;
    const groundConfig = def.ground || {};
    const groundSize = groundConfig.size ?? 400;
    const groundDivisions = groundConfig.divisions ?? 80;
    const palette = { ...DEFAULT_PALETTE, ...(def.palette || {}) };
    const spawn = { ...DEFAULT_SPAWN, ...(def.spawn || {}) };
    const bounds = { ...DEFAULT_BOUNDS, ...(def.bounds || {}) };

    // Metric pavilion replaces the generic grid with a 1 m ruled arena.
    const isPavilion = def.environment?.type === 'pavilion';

    const root = new THREE.Group();
    root.name = `level:${def.id}`;
    scene.add(root);

    // Ground and grid
    const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize);
    const groundMat = new THREE.MeshStandardMaterial({
        color: isPavilion ? theme.pavilionFloor : theme.groundColor,
        map: isPavilion ? makeGridTexture(groundSize, groundSize) : null,
        roughness: 0.85,
        metalness: 0.04,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    root.add(groundMesh);

    let gridHelper = null;
    if (!isPavilion) {
        gridHelper = new THREE.GridHelper(
            groundSize,
            groundDivisions,
            theme.gridMain,
            theme.gridSub
        );
        gridHelper.position.y = 0.05;
        gridHelper.material.transparent = true;
        gridHelper.material.opacity = theme.gridOpacity ?? 0.68;
        root.add(gridHelper);
    }

    let pavilion = null;
    if (isPavilion) {
        pavilion = buildPavilion(def, bounds, root, theme);
    }

    buildGlassWalls(def, bounds, root);

    // Prop sizes already arrive scaled (levels/index.js); hardcoded builder
    // sub-dimensions follow the same factor.
    const propScale = def.propScale ?? 1;

    // Optional landing pads for mission levels. Pads with `helipad: true`
    // render a marked heliport: "H" plus the pad coordinates in metres.
    function addLandingPad(padDef) {
        const padRadius = padDef.radius ?? 3;
        const padColor = padDef.color ?? palette.ring;
        const padX = padDef.x ?? spawn.x;
        const padZ = padDef.z ?? spawn.z;
        const isHelipad = padDef.helipad === true;
        const colorHex = '#' + new THREE.Color(padColor).getHexString();
        const padTexture = isHelipad
            ? getHelipadTexture(Math.round(padX), Math.round(padZ), colorHex)
            : (padDef.id != null ? getPadMarkerTexture(Math.round(padX), Math.round(padZ), colorHex, String(padDef.id)) : null);

        const padMaterial = new THREE.MeshStandardMaterial({
            color: padTexture ? 0xffffff : padColor,
            map: padTexture,
            emissive: padTexture ? 0xffffff : padColor,
            emissiveMap: padTexture,
            emissiveIntensity: padTexture ? 0.18 : (padDef.emissiveIntensity ?? 0.08),
            roughness: 0.62,
            metalness: 0.1,
            transparent: true,
            opacity: padDef.opacity ?? (padTexture ? 0.92 : 0.45),
            side: THREE.DoubleSide,
        });

        const pad = new THREE.Mesh(new THREE.CircleGeometry(padRadius, 48), padMaterial);
        pad.rotation.x = -Math.PI / 2;
        pad.position.set(padX, 0.07 * propScale, padZ);
        pad.receiveShadow = true;
        root.add(pad);

        // The torus border uses a plain material: the heliport texture must
        // not wrap around the tube.
        const ringMaterial = isHelipad
            ? new THREE.MeshStandardMaterial({
                color: padColor,
                emissive: padColor,
                emissiveIntensity: 0.22,
                roughness: 0.62,
                metalness: 0.1,
                transparent: true,
                opacity: 0.85,
            })
            : padMaterial;
        const padRing = new THREE.Mesh(
            new THREE.TorusGeometry(padRadius, 0.14 * propScale, 8, 64),
            ringMaterial
        );
        padRing.rotation.x = -Math.PI / 2;
        padRing.position.set(padX, 0.09 * propScale, padZ);
        padRing.receiveShadow = true;
        root.add(padRing);
    }

    [def.landingPad, def.missionPad, ...(def.pads || [])].filter(Boolean).forEach(addLandingPad);

    // Pillars / towers: colliders are per-obstacle, rendering is one
    // InstancedMesh per obstacle kind (a single draw call for dozens of props,
    // which keeps school hardware at 60 FPS).
    const getObstacleMaterial = makeObstacleMaterials(palette);
    const obstacles = [];
    const solids = [];
    const movers = [];

    const obstacleInstances = new Map();
    (def.obstacles || []).forEach((obstacle) => {
        const radius = obstacle.radius ?? 2;
        const height = obstacle.height ?? 10;

        const collider = {
            shape: 'cylinder',
            mesh: null,
            radius,
            height,
            bottom: 0,
            top: height,
            kind: obstacle.kind || 'pillar',
            pos: new THREE.Vector3(obstacle.x, height / 2, obstacle.z),
        };
        obstacles.push(collider);
        solids.push(collider);

        if (!obstacleInstances.has(collider.kind)) obstacleInstances.set(collider.kind, []);
        obstacleInstances.get(collider.kind).push({ x: obstacle.x, y: height / 2, z: obstacle.z, radius, height });
    });

    if (obstacleInstances.size > 0) {
        const unitCylinder = new THREE.CylinderGeometry(1, 1, 1, 16);
        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const scale = new THREE.Vector3();

        obstacleInstances.forEach((instances, kind) => {
            const instanced = new THREE.InstancedMesh(unitCylinder, getObstacleMaterial(kind), instances.length);
            instances.forEach((instance, index) => {
                matrix.compose(
                    position.set(instance.x, instance.y, instance.z),
                    _identityQuaternion,
                    scale.set(instance.radius, instance.height, instance.radius)
                );
                instanced.setMatrixAt(index, matrix);
            });
            instanced.instanceMatrix.needsUpdate = true;
            instanced.castShadow = true;
            instanced.receiveShadow = true;
            instanced.name = `obstacles:${kind}`;
            root.add(instanced);
        });
    }

    // Rings and gates
    const ringDefs = def.rings || [];
    const ringColor = new THREE.Color(palette.ring).lerp(new THREE.Color(0x94a3b8), 0.3);
    const endColor = new THREE.Color(palette.accent ?? 0x38bdf8); // Choose your target gradient color

    const baseRingMat = new THREE.MeshStandardMaterial({
        color: ringColor,
        emissive: ringColor,
        emissiveIntensity: 0.08,
        roughness: 0.52,
        metalness: 0.12,
    });
    const rings = [];
    const gates = [];

    ringDefs.forEach((ringDef, index) => {
        const radius = ringDef.radius ?? DEFAULT_RING_RADIUS;
        const tube = ringDef.tube ?? DEFAULT_RING_TUBE;
        const geometry = new THREE.TorusGeometry(radius, tube, 16, 50);

        // Calculate gradient step (0.0 at first ring -> 1.0 at last ring)
        const t = ringDefs.length > 1 ? index / (ringDefs.length - 1) : 0;
        const stepColor = ringColor.clone().lerpHSL(endColor, t); // Or use .lerp(endColor, t)

        // Clone base material and apply the gradient color to both color and emissive
        const ringMat = baseRingMat.clone();
        ringMat.color.copy(stepColor);
        ringMat.emissive.copy(stepColor);

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

    // City props (buildings, arches, bridges, road marks) have their own
    // composite builders above.
    const CITY_DECOR_TYPES = new Set(['building', 'arch', 'bridge', 'roadmark', 'shelf']);
    (def.decor || []).filter((decor) => CITY_DECOR_TYPES.has(decor.type)).forEach((decor) => {
        switch (decor.type) {
            case 'building':
                addBuilding(decor, root, solids, themeName, propScale);
                break;
            case 'arch':
                addArch(decor, root, solids, movers, propScale);
                break;
            case 'bridge':
                addBridge(decor, root, solids, propScale);
                break;
            case 'roadmark':
                addRoadmark(decor, root, propScale);
                break;
            case 'shelf':
                addShelf(decor, root, solids, propScale);
                break;
        }
    });

    // Decorative structures are solid by default so new level props cannot be
    // flown through. Set `solid: false` only for a deliberately non-solid
    // backdrop.
    (def.decor || []).filter((decor) => !CITY_DECOR_TYPES.has(decor.type)).forEach((decor) => {
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

    refreshEnvironmentIntensity(scene);

    return {
        def,
        root,
        groundMesh,
        movers,
        gridHelper,
        obstacles,
        solids,
        rings,
        gates,
        bounds,
        spawn,
        landingPad: def.landingPad || null,
        pavilion,
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
