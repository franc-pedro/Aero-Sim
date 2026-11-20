import * as THREE from 'three';
import { SCENE_THEMES } from '../config/themes.js';
import { applyAtmosphere, setEnvironmentIntensity } from '../scene/atmosphere.js';

export function applyTheme(themeName, world) {
    const cfg = SCENE_THEMES[themeName] || SCENE_THEMES.daylight;
    document.body.setAttribute('data-theme', themeName);

    // Update theme button highlights
    ['daylight', 'night'].forEach((t) => {
        const btn = document.getElementById(`theme-btn-${t}`);
        if (!btn) return;
        btn.className = t === themeName ? 'theme-tab theme-tab-active' : 'theme-tab';
        btn.setAttribute('aria-pressed', String(t === themeName));
    });

    // Update 3D Scene Atmosphere & Lighting
    if (world.scene) {
        world.scene.background = new THREE.Color(cfg.sky);
        world.scene.fog = new THREE.FogExp2(cfg.fog, cfg.fogDensity);
    }
    if (world.atmosphere) {
        applyAtmosphere(cfg, world.atmosphere, world.renderer);
    }
    if (world.scene) {
        setEnvironmentIntensity(world.scene, cfg.envIntensity ?? 1);
    }
    if (world.groundMesh) {
        world.groundMesh.material.color.setHex(cfg.groundColor);
    }
    const groundConfig = world.level?.def?.ground || {};
    const groundSize = groundConfig.size ?? 400;
    const groundDivisions = groundConfig.divisions ?? 80;
    const gridParent = world.level?.root || world.scene;

    if (world.gridHelper) {
        if (world.gridHelper.parent) {
            world.gridHelper.parent.remove(world.gridHelper);
        }
        world.gridHelper.geometry.dispose();
        world.gridHelper.material.dispose();
    }

    const gridHelper = new THREE.GridHelper(
        groundSize,
        groundDivisions,
        cfg.gridMain,
        cfg.gridSub
    );
    gridHelper.position.y = 0.05;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = cfg.gridOpacity ?? 0.68;
    if (gridParent) gridParent.add(gridHelper);
    world.gridHelper = gridHelper;
    if (world.level) world.level.gridHelper = gridHelper;
}
