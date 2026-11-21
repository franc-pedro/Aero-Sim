import '../css/main.css';
import '@fontsource-variable/nunito/wght.css';
import '@fortawesome/fontawesome-free/css/fontawesome.css';
import '@fortawesome/fontawesome-free/css/solid.css';
import '@fortawesome/fontawesome-free/css/brands.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { SCENE_THEMES } from './config/themes.js';
import { startLoop } from './core/loop.js';
import { createSession } from './core/session.js';
import { droneState } from './core/state.js';
import { refreshToast } from './core/toast.js';
import { initGamepad, refreshGamepadUI } from './controls/gamepad.js';
import { initKeyboard } from './controls/keyboard.js';
import { initTouchControls, resetTouchControls } from './controls/touch.js';
import { initI18n, onLocaleChange } from './i18n/index.js';
import { DEFAULT_LEVEL_ID, getLevelForPreset } from './levels/index.js';
import { initPythonUI, loadPythonPreset, preloadPythonRuntime, refreshPythonUI, startPythonAutopilot, stopPythonAutopilot } from './python/autopilot.js';
import { createQuadcopter } from './scene/quadcopter.js';
import { createNoseIndicator } from './scene/nose-indicator.js';
import { initTrail } from './scene/trail.js';
import { configureRenderer, createAtmosphere, applyEnvironmentLighting, setEnvironmentIntensity } from './scene/atmosphere.js';
import { refreshFlightStatus } from './ui/flight-status.js';
import { initHeaderToggle } from './ui/header-toggle.js';
import { initAxesBars, refreshHUD } from './ui/hud.js';
import { initLanguageSelector } from './ui/language.js';
import { initLevelUI, refreshLevelUI } from './ui/levels.js';
import { setControlMode } from './ui/mode.js';
import { initPythonLab, setPythonLevel } from './ui/python-lab.js';
import { initCameraModeUI } from './ui/camera-mode.js';
import { initViewOptions } from './ui/view-options.js';
import { applyTheme } from './ui/theme.js';
import { setOrbitControls } from './simulation/camera.js';

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
    configureRenderer(renderer);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Orbit mode rig (enabled only while the camera mode is 'orbit')
    const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enabled = false;
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.08;
    orbitControls.minDistance = 0.25;
    orbitControls.maxDistance = 80;
    setOrbitControls(orbitControls);

    // 4. Lighting (Atmosphere rig: key, fill, rim, hemisphere and contact shadow)
    const atmosphere = createAtmosphere(scene, defaultTheme);

    const ambientLight = atmosphere.ambientLight;
    const hemiLight = atmosphere.hemiLight;
    const dirLight = atmosphere.keyLight;

    // 5. Build Drone
    const drone = createQuadcopter();
    scene.add(drone.group);

    // Visual flying aids (toggled from the header, see initViewOptions)
    const noseIndicator = createNoseIndicator();
    drone.group.add(noseIndicator);
    initTrail(scene);

    world = {
        scene,
        camera,
        renderer,
        droneMesh: drone.group,
        propellers: drone.propellers,
        atmosphere,
        ambientLight,
        hemiLight,
        dirLight,
        noseIndicator,
        orbitControls,
    };

    // 6. Level Session & UI
    const session = createSession({ scene, world });

    initAxesBars();
    initHeaderToggle();
    initGamepad();
    initKeyboard({ onReset: () => {
        resetTouchControls();
        session.reset();
        refreshPythonUI();
    } });
    initTouchControls({
        onReset: () => {
            session.reset();
            refreshPythonUI();
        },
    });
    initPythonUI();
    initLevelUI({ onSelect: (id) => {
        resetTouchControls();
        session.loadLevel(id);
        setPythonLevel(id);
        refreshPythonUI();
    } });

    session.loadLevel(DEFAULT_LEVEL_ID);
    setPythonLevel(document.getElementById('level-select').value);
    drone.group.position.copy(droneState.renderPos);
    drone.group.quaternion.copy(droneState.renderQuaternion);

    // Image-based lighting (after level build so all meshes get the theme intensity)
    applyEnvironmentLighting(scene, renderer);
    setEnvironmentIntensity(scene, defaultTheme.envIntensity ?? 1);

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
    window.addEventListener('resize', scheduleRendererResize);
    const canvasContainer = document.getElementById('canvas-container');
    if (canvasContainer && typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(scheduleRendererResize).observe(canvasContainer);
    }

    function enterManualMode() {
        setControlMode('manual');
        session.reset({ silent: true });
        refreshPythonUI();
    }

    function enterPythonMode() {
        session.preparePython();
        setControlMode('python');
        setPythonLevel(document.getElementById('level-select').value);
        initPythonLab({
            onRun: startPythonAutopilot,
            onStop: stopPythonAutopilot,
            onReset: () => {
                resetTouchControls();
                session.reset();
                refreshPythonUI();
            },
        });
        preloadPythonRuntime();
        refreshPythonUI();
    }

    document.getElementById('mode-btn-manual').addEventListener('click', enterManualMode);
    document.getElementById('mode-btn-python').addEventListener('click', enterPythonMode);
    document.getElementById('btn-close-python-lab').addEventListener('click', enterManualMode);

    document.getElementById('theme-btn-daylight').addEventListener('click', () => applyTheme('daylight', world));
    document.getElementById('theme-btn-night').addEventListener('click', () => applyTheme('night', world));

    initViewOptions({ noseIndicator });
    initCameraModeUI({ noseIndicator });

    document.getElementById('python-preset-select').addEventListener('change', (e) => {
        const preset = e.target.value;
        const level = getLevelForPreset(preset);
        const levelSelect = document.getElementById('level-select');

        if (level && levelSelect && levelSelect.value !== level.id) {
            levelSelect.value = level.id;
            levelSelect.dispatchEvent(new Event('change', { bubbles: true }));
            return;
        }

        loadPythonPreset(preset);
    });
    document.getElementById('btn-run-python').addEventListener('click', startPythonAutopilot);
    document.getElementById('btn-stop-python').addEventListener('click', stopPythonAutopilot);
    document.getElementById('btn-reset-drone').addEventListener('click', () => {
        resetTouchControls();
        session.reset();
        refreshPythonUI();
    });

    // 8. Start Fixed-Step Simulation & Render Loop
    startLoop({ scene, camera, renderer, world });
}

function scheduleRendererResize() {
    if (rendererResizeFrame) return;
    rendererResizeFrame = requestAnimationFrame(() => {
        rendererResizeFrame = null;
        resizeRenderer();
    });
}

function resizeRenderer() {
    const container = document.getElementById('canvas-container');
    if (!container || !camera || !renderer) return;

    const width = Math.max(1, Math.round(container.clientWidth));
    const height = Math.max(1, Math.round(container.clientHeight));

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(width, height);
}

let rendererResizeFrame = null;

init();
