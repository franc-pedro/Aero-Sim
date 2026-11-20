import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const SHADOW_MAP_DESKTOP = 2048;
const SHADOW_MAP_MOBILE = 1024;

function isMobile() {
    return window.matchMedia?.('(pointer: coarse)').matches
        || window.innerWidth <= 900;
}

function createSoftShadowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;

    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(15, 23, 42, 0.68)');
    gradient.addColorStop(0.44, 'rgba(15, 23, 42, 0.25)');
    gradient.addColorStop(1, 'rgba(15, 23, 42, 0)');

    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    return texture;
}

export function configureRenderer(renderer) {
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
}

// Image-based lighting: neutral indoor environment baked once via PMREM and
// shared as scene.environment. Gives MeshStandard/Physical materials real
// reflections instead of relying purely on the analytic lights.
let environmentTexture = null;
let environmentIntensity = 1;

export function applyEnvironmentLighting(scene, renderer) {
    if (!environmentTexture) {
        const pmrem = new THREE.PMREMGenerator(renderer);
        environmentTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        pmrem.dispose();
    }
    scene.environment = environmentTexture;
}

function forEachMaterial(root, fn) {
    root.traverse((obj) => {
        if (!obj.material) return;
        (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(fn);
    });
}

export function setEnvironmentIntensity(root, intensity) {
    environmentIntensity = intensity;
    forEachMaterial(root, (mat) => {
        if ('envMapIntensity' in mat) mat.envMapIntensity = intensity;
    });
}

// Re-apply the remembered intensity to meshes built after the last theme
// application (e.g. a level loaded mid-session).
export function refreshEnvironmentIntensity(root) {
    forEachMaterial(root, (mat) => {
        if ('envMapIntensity' in mat) mat.envMapIntensity = environmentIntensity;
    });
}

export function createAtmosphere(scene, theme) {
    const ambientLight = new THREE.AmbientLight(0xffffff, theme.ambientIntensity);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(
        theme.hemiSky,
        theme.hemiGround,
        theme.hemiIntensity
    );
    hemiLight.position.set(0, 120, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(theme.dirColor, theme.dirIntensity);
    keyLight.position.set(38, 88, 52);
    keyLight.castShadow = true;

    const shadowMapSize = isMobile() ? SHADOW_MAP_MOBILE : SHADOW_MAP_DESKTOP;
    keyLight.shadow.mapSize.width = shadowMapSize;
    keyLight.shadow.mapSize.height = shadowMapSize;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 240;
    keyLight.shadow.bias = -0.00035;
    keyLight.shadow.normalBias = 0.03;
    keyLight.shadow.radius = 4;
    keyLight.shadow.camera.left = -60;
    keyLight.shadow.camera.right = 60;
    keyLight.shadow.camera.top = 60;
    keyLight.shadow.camera.bottom = -60;
    keyLight.shadow.camera.updateProjectionMatrix();
    scene.add(keyLight);
    scene.add(keyLight.target);

    const fillLight = new THREE.DirectionalLight(theme.fillColor, theme.fillIntensity);
    fillLight.position.set(-48, 34, -36);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(theme.rimColor, theme.rimIntensity);
    rimLight.position.set(-28, 58, -78);
    scene.add(rimLight);

    const droneShadow = new THREE.Mesh(
        new THREE.CircleGeometry(1, 36),
        new THREE.MeshBasicMaterial({
            map: createSoftShadowTexture(),
            transparent: true,
            opacity: theme.droneShadowOpacity ?? 0.24,
            depthWrite: false,
        })
    );
    droneShadow.rotation.x = -Math.PI / 2;
    droneShadow.position.set(0, 0.09, 0);
    droneShadow.material.userData.baseOpacity = theme.droneShadowOpacity ?? 0.24;
    scene.add(droneShadow);

    return {
        ambientLight,
        hemiLight,
        keyLight,
        fillLight,
        rimLight,
        droneShadow,
    };
}

export function applyAtmosphere(theme, atmosphere, renderer) {
    if (atmosphere.ambientLight) {
        atmosphere.ambientLight.intensity = theme.ambientIntensity;
    }

    if (atmosphere.hemiLight) {
        atmosphere.hemiLight.color.setHex(theme.hemiSky);
        atmosphere.hemiLight.groundColor.setHex(theme.hemiGround);
        atmosphere.hemiLight.intensity = theme.hemiIntensity;
    }

    if (atmosphere.keyLight) {
        atmosphere.keyLight.color.setHex(theme.dirColor);
        atmosphere.keyLight.intensity = theme.dirIntensity;
    }

    if (atmosphere.fillLight) {
        atmosphere.fillLight.color.setHex(theme.fillColor);
        atmosphere.fillLight.intensity = theme.fillIntensity;
    }

    if (atmosphere.rimLight) {
        atmosphere.rimLight.color.setHex(theme.rimColor);
        atmosphere.rimLight.intensity = theme.rimIntensity;
    }

    if (atmosphere.droneShadow) {
        const baseOpacity = theme.droneShadowOpacity ?? 0.24;
        atmosphere.droneShadow.material.opacity = baseOpacity;
        atmosphere.droneShadow.material.userData.baseOpacity = baseOpacity;
    }

    if (renderer) {
        renderer.toneMappingExposure = theme.toneMappingExposure ?? 1.05;
    }
}

export function updateDroneShadow(atmosphere, renderPos) {
    const mesh = atmosphere.droneShadow;
    if (!mesh) return;

    mesh.position.set(renderPos.x, 0.09, renderPos.z);

    const altitude = Math.max(0, renderPos.y);
    const scale = Math.min(2.1, 0.78 + altitude * 0.03);
    mesh.scale.set(scale, scale, 1);

    const opacity = Math.max(0.05, (atmosphere.droneShadow.material.userData.baseOpacity ?? 0.24) - altitude * 0.004);
    mesh.material.opacity = opacity;
}
