import '../css/main.css';
import '@fortawesome/fontawesome-free/css/fontawesome.css';
import '@fortawesome/fontawesome-free/css/solid.css';
import '@fortawesome/fontawesome-free/css/brands.css';
import * as THREE from 'three';

import { SCENE_THEMES } from './config/themes.js';
import { startLoop } from './core/loop.js';
import { createSession } from './core/session.js';
import { droneState } from './core/state.js';
import { refreshToast } from './core/toast.js';
import { initGamepad, refreshGamepadUI } from './controls/gamepad.js';
import { initKeyboard } from './controls/keyboard.js';
import { initI18n, onLocaleChange } from './i18n/index.js';
import { DEFAULT_LEVEL_ID } from './levels/index.js';
import { initPythonUI, loadPythonPreset, refreshPythonUI, startPythonAutopilot, stopPythonAutopilot } from './python/autopilot.js';
import { createQuadcopter } from './scene/quadcopter.js';
import { refreshFlightStatus } from './ui/flight-status.js';
import { initAxesBars, refreshHUD } from './ui/hud.js';
import { initLanguageSelector } from './ui/language.js';
import { initLevelUI, refreshLevelUI } from './ui/levels.js';
import { setControlMode } from './ui/mode.js';
import { applyTheme } from './ui/theme.js';

let scene;
let camera;
let renderer;
let world;

function init() {
    initI18n();
    initLanguageSelector();

    const defaultTheme = SCENE_THEMES.daylight;

    // 1. Scene Setup (Bright Daylight Default)
    scene = new THREE.Scene();
    scene.background = new THREE.Color(defaultTheme.sky);
    scene.fog = new THREE.FogExp2(defaultTheme.fog, defaultTheme.fogDensity);

    // 2. Camera Setup
    camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);

    // 3. Renderer Setup
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
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
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 300;
    dirLight.shadow.bias = -0.0005;
    dirLight.shadow.normalBias = 0.02;
    const d = 45;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.camera.updateProjectionMatrix();
    scene.add(dirLight);
    scene.add(dirLight.target);

    // 5. Build Drone
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
    };

    // 6. Level Session & UI
    const session = createSession({ scene, world });

    initAxesBars();
    initGamepad();
    initKeyboard({ onReset: session.reset });
    initPythonUI();
    initLevelUI({ onSelect: (id) => session.loadLevel(id) });

    session.loadLevel(DEFAULT_LEVEL_ID);
    drone.group.position.copy(droneState.renderPos);
    drone.group.quaternion.copy(droneState.renderQuaternion);

    function refreshLocalizedUI() {
        const def = session.getCurrent()?.def;
        refreshLevelUI(def);
        refreshGamepadUI();
        refreshPythonUI();
        refreshFlightStatus();
        refreshHUD();
        refreshToast();
    }

    onLocaleChange(refreshLocalizedUI);

    // 7. Event Listeners
    window.addEventListener('resize', onWindowResize);

    document.getElementById('mode-btn-manual').addEventListener('click', () => setControlMode('manual'));
    document.getElementById('mode-btn-python').addEventListener('click', () => setControlMode('python'));

    document.getElementById('theme-btn-daylight').addEventListener('click', () => applyTheme('daylight', world));
    document.getElementById('theme-btn-sunset').addEventListener('click', () => applyTheme('sunset', world));
    document.getElementById('theme-btn-night').addEventListener('click', () => applyTheme('night', world));

    document.getElementById('python-preset-select').addEventListener('change', (e) => loadPythonPreset(e.target.value));
    document.getElementById('btn-run-python').addEventListener('click', startPythonAutopilot);
    document.getElementById('btn-stop-python').addEventListener('click', stopPythonAutopilot);
    document.getElementById('btn-reset-drone').addEventListener('click', session.reset);

    // 8. Start Fixed-Step Simulation & Render Loop
    startLoop({ scene, camera, renderer, world });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
}

init();
