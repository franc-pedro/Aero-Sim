import * as THREE from 'three';

// Metric test pavilion: walls, floor markings, ceiling and height rulers where
// one texture tile equals exactly one metre, so students can count squares
// instead of guessing distances. Physics bounds are untouched: walls sit just
// outside the flight clamp and the ceiling sits above it.
//
// Textures are cached and shared across level loads; disposeLevel only
// disposes geometries and materials, so the caches never leak.

const GRID_STRONG = '#7d8ea6'; // 100 cm metric lines
const GRID_SUB = '#bcc6d3'; // 50 cm sublines
const GRID_BG = '#ffffff'; // neutral background so material color tints per theme

const WALL_INSET = 0.6; // inner wall face, just outside the flight clamp
const RULER_STEP = 20; // roughly one ruler strip every 20 m of wall

let gridCanvas = null;
const rulerTextures = new Map();
const helipadTextures = new Map();

function getGridCanvas() {
    if (gridCanvas) return gridCanvas;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = GRID_BG;
    ctx.fillRect(0, 0, size, size);

    // 50 cm sublines: each tile draws half of the line at its centre.
    ctx.strokeStyle = GRID_SUB;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.stroke();

    // 100 cm lines on the tile border; half of the stroke falls inside each
    // tile so adjacent tiles join seamlessly into one full-width line.
    ctx.strokeStyle = GRID_STRONG;
    ctx.lineWidth = 7;
    const inset = ctx.lineWidth / 2;
    ctx.strokeRect(inset, inset, size - ctx.lineWidth, size - ctx.lineWidth);

    gridCanvas = canvas;
    return canvas;
}

// Textures can't be shared when the repeat differs, so they are cached by
// dimensions: every level configuration maps to exactly one texture instance.
const gridTextures = new Map();

export function makeGridTexture(repeatX, repeatY) {
    const key = `${repeatX}|${repeatY}`;
    if (gridTextures.has(key)) return gridTextures.get(key);

    const texture = new THREE.CanvasTexture(getGridCanvas());
    texture.encoding = THREE.sRGBEncoding;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 8;
    texture.repeat.set(repeatX, repeatY);
    gridTextures.set(key, texture);
    return texture;
}

// Vertical height ruler: one texture spans the full wall height so labels keep
// their absolute meaning, with a tick every 50 cm and a label every metre.
function getRulerTexture(wallHeight) {
    const key = Math.round(wallHeight * 100);
    if (rulerTextures.has(key)) return rulerTextures.get(key);

    const pxPerMeter = 48;
    const width = 108;
    const height = Math.ceil(wallHeight * pxPerMeter);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.font = '600 24px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const steps = Math.round(wallHeight * 2);
    for (let i = 0; i <= steps; i++) {
        const meters = i / 2;
        const y = height - meters * pxPerMeter;
        const isMeter = i % 2 === 0;

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(isMeter ? 26 : 14, y);
        ctx.stroke();

        if (isMeter) {
            ctx.fillText(`${meters} m`, width - 6, y);
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    texture.anisotropy = 8;
    rulerTextures.set(key, texture);
    return texture;
}

// Mission pad marker: coloured disc with the pad number, so students can
// correlate the visual pad with get_mission_pad_id().
function getPadMarkerTexture(x, z, colorHex, label) {
    const key = `marker|${x}|${z}|${colorHex}|${label}`;
    if (helipadTextures.has(key)) return helipadTextures.get(key);

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const center = size / 2;

    ctx.fillStyle = colorHex;
    ctx.beginPath();
    ctx.arc(center, center, center, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(center, center, center - 22, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 270px Arial, sans-serif';
    ctx.fillText(label, center, center - 8);

    ctx.font = '600 40px Arial, sans-serif';
    ctx.fillText(`X: ${x}  Z: ${z}`, center, center + 138);

    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    texture.anisotropy = 8;
    helipadTextures.set(key, texture);
    return texture;
}

// Landing pad marked as heliport: coloured disc, white ring, an "H" and the
// pad coordinates in metres so students relate spawn to the level origin.
function getHelipadTexture(x, z, colorHex) {
    const key = `${x}|${z}|${colorHex}`;
    if (helipadTextures.has(key)) return helipadTextures.get(key);

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const center = size / 2;

    ctx.fillStyle = colorHex;
    ctx.beginPath();
    ctx.arc(center, center, center, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.arc(center, center, center - 26, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 210px Arial, sans-serif';
    ctx.fillText('H', center, center - 28);

    ctx.font = '600 42px Arial, sans-serif';
    ctx.fillText(`X: ${x}  Z: ${z}`, center, center + 116);

    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    texture.anisotropy = 8;
    helipadTextures.set(key, texture);
    return texture;
}

// Walls use BackSide so they are only rendered from inside the arena: the
// chase camera can cross the wall plane near the bounds and still see through.
function addWalls(root, span, wallHeight, wallMat) {
    const half = span / 2 - 1;
    const centerY = wallHeight / 2;
    const specs = [
        { rotY: Math.PI, pos: [0, centerY, -half - WALL_INSET] },
        { rotY: 0, pos: [0, centerY, half + WALL_INSET] },
        { rotY: Math.PI / 2, pos: [half + WALL_INSET, centerY, 0] },
        { rotY: -Math.PI / 2, pos: [-half - WALL_INSET, centerY, 0] },
    ];

    specs.forEach(({ rotY, pos }) => {
        const wall = new THREE.Mesh(new THREE.PlaneGeometry(span, wallHeight), wallMat);
        wall.rotation.y = rotY;
        wall.position.set(...pos);
        wall.receiveShadow = true;
        root.add(wall);
    });
}

// Height ruler strips placed evenly along the inner wall faces, facing inwards
// so they only render where students (and the camera) actually look.
function addRulers(root, span, wallHeight, rulerMat) {
    const count = Math.max(1, Math.round(span / RULER_STEP));
    const geometry = new THREE.PlaneGeometry(1, wallHeight);

    [
        { rotY: 0, faceZ: -1 },
        { rotY: Math.PI, faceZ: 1 },
    ].forEach(({ rotY, faceZ }) => {
        for (let i = 0; i < count; i++) {
            const strip = new THREE.Mesh(geometry, rulerMat);
            strip.position.set(
                -span / 2 + (span * (i + 0.5)) / count,
                wallHeight / 2,
                faceZ * (span / 2 - 1 + WALL_INSET - 0.06)
            );
            strip.rotation.y = rotY;
            root.add(strip);
        }
    });

    [
        { rotY: -Math.PI / 2, faceX: 1 },
        { rotY: Math.PI / 2, faceX: -1 },
    ].forEach(({ rotY, faceX }) => {
        for (let i = 0; i < count; i++) {
            const strip = new THREE.Mesh(geometry, rulerMat);
            strip.position.set(
                faceX * (span / 2 - 1 + WALL_INSET - 0.06),
                wallHeight / 2,
                -span / 2 + (span * (i + 0.5)) / count
            );
            strip.rotation.y = rotY;
            root.add(strip);
        }
    });
}

export function buildPavilion(def, bounds, root, theme) {
    const env = def.environment || {};
    const half = bounds.halfSize;
    const wallHeight = env.wallHeight ?? Math.ceil(bounds.ceiling) + 1;
    const span = 2 * half + 2; // integer so grid lines land on whole metres

    const wallMat = new THREE.MeshStandardMaterial({
        color: theme.pavilionWall,
        map: makeGridTexture(span, wallHeight),
        roughness: 0.92,
        metalness: 0,
        side: THREE.BackSide,
    });

    const ceilMat = env.ceiling === false
        ? null
        : new THREE.MeshBasicMaterial({
            color: theme.pavilionCeiling,
            map: makeGridTexture(span, span),
        });
    if (ceilMat) {
        const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(span, span), ceilMat);
        ceiling.rotation.x = Math.PI / 2; // face down, culled from above
        ceiling.position.y = wallHeight;
        root.add(ceiling);
    }

    addWalls(root, span, wallHeight, wallMat);

    let rulerMat = null;
    if (env.ruler !== false) {
        rulerMat = new THREE.MeshBasicMaterial({
            color: theme.pavilionRuler,
            map: getRulerTexture(wallHeight),
            transparent: true,
            depthWrite: false,
        });
        addRulers(root, span, wallHeight, rulerMat);
    }

    return { wallMat, ceilMat, rulerMat };
}

// Theme switches happen at runtime; only the material colours are theme driven,
// the metric textures themselves stay neutral white and get tinted.
export function applyPavilionTheme(pavilion, cfg) {
    if (!pavilion) return;

    pavilion.wallMat?.color.setHex(cfg.pavilionWall);
    pavilion.ceilMat?.color.setHex(cfg.pavilionCeiling);
    pavilion.rulerMat?.color.setHex(cfg.pavilionRuler);
}

export { getHelipadTexture, getPadMarkerTexture };
