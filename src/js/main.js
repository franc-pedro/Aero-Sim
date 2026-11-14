import '../css/main.css';
import '@fortawesome/fontawesome-free/css/fontawesome.css';
import '@fortawesome/fontawesome-free/css/solid.css';
import '@fortawesome/fontawesome-free/css/brands.css';
import * as THREE from 'three';

import { SCENE_THEMES } from './config/themes.js';
import { resetDrone } from './core/state.js';
import { initGamepad } from './controls/gamepad.js';
import { initKeyboard } from './controls/keyboard.js';
import { initPythonUI, loadPythonPreset, startPythonAutopilot, stopPythonAutopilot } from './python/autopilot.js';
import { createEnvironment } from './scene/environment.js';
import { createQuadcopter } from './scene/quadcopter.js';
import { updatePhysics } from './simulation/physics.js';
import { initAxesBars } from './ui/hud.js';
import { setControlMode } from './ui/mode.js';
import { applyTheme } from './ui/theme.js';

let scene;
let camera;
let renderer;
let world;

function init() {
    const defaultTheme = SCENE_THEMES.daylight;

    // 1. Scene Setup (Bright Daylight Default)
    scene = new THREE.Scene();
    scene.background = new THREE.Color(defaultTheme.sky);
    scene.fog = new THREE.FogExp2(defaultTheme.fog, defaultTheme.fogDensity);

    // 2. Camera Setup
    camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);

    // 3. Renderer Setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // 4. Lighting (Bright Three-Point + Hemisphere Sky Fill)
    const ambientLight = new THREE.AmbientLight(0xffffff, defaultTheme.ambientIntensity);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(defaultTheme.hemiSky, defaultTheme.hemiGround, defaultTheme.hemiIntensity);
    hemiLight.position.set(0, 100, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(defaultTheme.dirColor, defaultTheme.dirIntensity);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 300;
    const d = 60;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    // 5. Build Environment
    const environment = createEnvironment(scene);

    // 6. Build Drone
    const drone = createQuadcopter();
    scene.add(drone.group);

    world = {
        scene,
        camera,
        renderer,
        droneMesh: drone.group,
        propellers: drone.propellers,
        ambientLight,
        hemiLight,
        dirLight,
        groundMesh: environment.groundMesh,
        gridHelper: environment.gridHelper,
    };

    // 7. Initialize UI & Input
    initAxesBars();
    initGamepad();
    initKeyboard({ onReset: resetDrone });
    initPythonUI();

    // 8. Event Listeners
    window.addEventListener('resize', onWindowResize);

    document.getElementById('mode-btn-manual').addEventListener('click', () => setControlMode('manual'));
    document.getElementById('mode-btn-python').addEventListener('click', () => setControlMode('python'));

    document.getElementById('theme-btn-daylight').addEventListener('click', () => applyTheme('daylight', world));
    document.getElementById('theme-btn-sunset').addEventListener('click', () => applyTheme('sunset', world));
    document.getElementById('theme-btn-night').addEventListener('click', () => applyTheme('night', world));

    document.getElementById('python-preset-select').addEventListener('change', (e) => loadPythonPreset(e.target.value));
    document.getElementById('btn-run-python').addEventListener('click', startPythonAutopilot);
    document.getElementById('btn-stop-python').addEventListener('click', stopPythonAutopilot);
    document.getElementById('btn-reset-drone').addEventListener('click', resetDrone);

    // Start Animation Loop
    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- Main Animation Loop ---
let lastTime = 0;
function animate(timestamp = 0) {
    requestAnimationFrame(animate);

    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    if (dt > 0) {
        updatePhysics(dt, world);
    }

    renderer.render(scene, camera);
}

init();
