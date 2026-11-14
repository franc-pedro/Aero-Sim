import * as THREE from 'three';
import { SCENE_THEMES } from '../config/themes.js';

export function applyTheme(themeName, world) {
    const cfg = SCENE_THEMES[themeName] || SCENE_THEMES.daylight;
    document.body.setAttribute('data-theme', themeName);

    // Update theme button highlights
    ['daylight', 'sunset', 'night'].forEach((t) => {
        const btn = document.getElementById(`theme-btn-${t}`);
        if (!btn) return;
        if (t === themeName) {
            btn.className = `px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${SCENE_THEMES[t].btnClass}`;
        } else {
            btn.className = 'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all theme-muted-text hover:opacity-80';
        }
    });

    // Update 3D Scene Atmosphere & Lighting
    if (world.scene) {
        world.scene.background = new THREE.Color(cfg.sky);
        world.scene.fog = new THREE.FogExp2(cfg.fog, cfg.fogDensity);
    }
    if (world.ambientLight) world.ambientLight.intensity = cfg.ambientIntensity;
    if (world.hemiLight) {
        world.hemiLight.color.setHex(cfg.hemiSky);
        world.hemiLight.groundColor.setHex(cfg.hemiGround);
        world.hemiLight.intensity = cfg.hemiIntensity;
    }
    if (world.dirLight) {
        world.dirLight.color.setHex(cfg.dirColor);
        world.dirLight.intensity = cfg.dirIntensity;
    }
    if (world.groundMesh) {
        world.groundMesh.material.color.setHex(cfg.groundColor);
    }
    if (world.gridHelper) {
        world.scene.remove(world.gridHelper);
        world.gridHelper = new THREE.GridHelper(400, 80, cfg.gridMain, cfg.gridSub);
        world.gridHelper.position.y = 0.05;
        world.scene.add(world.gridHelper);
    }
}
