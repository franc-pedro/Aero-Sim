import * as THREE from 'three';
import { SCENE_THEMES } from '../config/themes.js';

// --- Environment Generator ---
export function createEnvironment(scene) {
    const defaultTheme = SCENE_THEMES.daylight;

    // Textured / Grid Ground
    const groundGeo = new THREE.PlaneGeometry(400, 400, 50, 50);
    const groundMat = new THREE.MeshStandardMaterial({
        color: defaultTheme.groundColor,
        roughness: 0.75,
        metalness: 0.1,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Grid Helper for visual depth
    const gridHelper = new THREE.GridHelper(400, 80, defaultTheme.gridMain, defaultTheme.gridSub);
    gridHelper.position.y = 0.05;
    scene.add(gridHelper);

    // Obstacles (Training Course Pillars & Cubes)
    const obstacleMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.4, metalness: 0.5 });
    const hazardMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.4, metalness: 0.5 });
    const obstacles = [];

    for (let i = 0; i < 30; i++) {
        const isHazard = i % 5 === 0;
        const height = 5 + Math.random() * 15;
        const radius = 1.5 + Math.random() * 2;

        const geom = new THREE.CylinderGeometry(radius, radius, height, 16);
        const mesh = new THREE.Mesh(geom, isHazard ? hazardMat : obstacleMat);

        let x, z;
        do {
            x = (Math.random() - 0.5) * 300;
            z = (Math.random() - 0.5) * 300;
        } while (Math.abs(x) < 15 && Math.abs(z) < 15); // keep spawn area clear

        mesh.position.set(x, height / 2, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        obstacles.push({ mesh, radius, height, pos: mesh.position });
    }

    // Floating rings / gates for extra immersion
    for (let i = 0; i < 5; i++) {
        const ringGeo = new THREE.TorusGeometry(4, 0.4, 16, 50);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 0.5 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set((i - 2) * 25, 8 + Math.random() * 5, -30 - i * 30);
        ring.rotation.y = Math.PI / 4;
        scene.add(ring);
    }

    return { groundMesh, gridHelper, obstacles };
}
