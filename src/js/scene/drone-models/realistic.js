import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// --- Refined quadcopter visual model ---
// Same contract as the classic model: { group, propellers } with four
// propeller groups (FL, FR, RL, RR) spun around Y by updatePropellers().
export function createQuadcopter() {
    const droneGroup = new THREE.Group();

    const carbonMat = new THREE.MeshStandardMaterial({ color: 0x151d29, metalness: 0.5, roughness: 0.45, envMapIntensity: 0.9 });
    const shellMat = new THREE.MeshPhysicalMaterial({
        color: 0xf1f5f9,
        metalness: 0.12,
        roughness: 0.32,
        clearcoat: 0.55,
        clearcoatRoughness: 0.3,
        envMapIntensity: 0.9,
    });
    const accentMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.3 });
    const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x3a4656, metalness: 0.92, roughness: 0.3, envMapIntensity: 1.1 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, metalness: 1, roughness: 0.04, envMapIntensity: 1.4 });
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x10151f, metalness: 0.45, roughness: 0.4 });

    // --- Fuselage ---
    const basePlate = new THREE.Mesh(new RoundedBoxGeometry(0.56, 0.07, 0.98, 2, 0.025), carbonMat);
    basePlate.position.y = -0.03;
    basePlate.castShadow = true;
    droneGroup.add(basePlate);

    const midShell = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.16, 0.8, 3, 0.06), shellMat);
    midShell.position.set(0, 0.05, -0.02);
    midShell.castShadow = true;
    droneGroup.add(midShell);

    const canopy = new THREE.Mesh(new RoundedBoxGeometry(0.4, 0.09, 0.56, 3, 0.04), shellMat);
    canopy.position.set(0, 0.16, -0.02);
    canopy.castShadow = true;
    droneGroup.add(canopy);

    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 16), shellMat);
    nose.scale.set(0.85, 0.55, 1.1);
    nose.position.set(0, 0.04, 0.42);
    nose.castShadow = true;
    droneGroup.add(nose);

    const stripe = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.015, 0.7, 2, 0.006), accentMat);
    stripe.position.set(0, 0.205, -0.02);
    droneGroup.add(stripe);

    // LiPo battery pack with strap
    const battery = new THREE.Mesh(new RoundedBoxGeometry(0.38, 0.12, 0.46, 2, 0.035), darkMetalMat);
    battery.position.set(0, 0.235, -0.1);
    battery.castShadow = true;
    droneGroup.add(battery);

    const strap = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.13, 0.09, 2, 0.02), accentMat);
    strap.position.set(0, 0.235, -0.1);
    droneGroup.add(strap);

    // GPS mast / antenna
    const antennaStem = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.02, 0.24, 10), carbonMat);
    antennaStem.position.set(0.15, 0.3, -0.4);
    antennaStem.rotation.x = -0.3;
    droneGroup.add(antennaStem);

    const antennaCap = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 12), accentMat);
    antennaCap.position.set(0.15, 0.42, -0.43);
    droneGroup.add(antennaCap);

    // --- Front FPV gimbal camera (+Z) ---
    const gimbalBracket = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.05, 0.1, 2, 0.02), darkMetalMat);
    gimbalBracket.position.set(0, -0.03, 0.5);
    droneGroup.add(gimbalBracket);

    const camBody = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.15, 0.16, 3, 0.03), darkMetalMat);
    camBody.position.set(0, -0.12, 0.5);
    camBody.castShadow = true;
    droneGroup.add(camBody);

    const camBarrelGeo = new THREE.CylinderGeometry(0.075, 0.085, 0.14, 24);
    camBarrelGeo.rotateX(Math.PI / 2);
    const camBarrel = new THREE.Mesh(camBarrelGeo, darkMetalMat);
    camBarrel.position.set(0, -0.12, 0.58);
    droneGroup.add(camBarrel);

    const lensGlass = new THREE.Mesh(new THREE.SphereGeometry(0.062, 20, 20), glassMat);
    lensGlass.position.set(0, -0.12, 0.64);
    droneGroup.add(lensGlass);

    const lensRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.095, 0.012, 8, 28),
        accentMat
    );
    lensRing.position.set(0, -0.12, 0.6);
    droneGroup.add(lensRing);

    // Front headlight & rear taillight bars
    const headLight = new THREE.Mesh(
        new RoundedBoxGeometry(0.3, 0.035, 0.03, 1, 0.012),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    headLight.position.set(0, -0.02, 0.56);
    droneGroup.add(headLight);

    const tailLight = new THREE.Mesh(
        new RoundedBoxGeometry(0.42, 0.04, 0.03, 1, 0.014),
        new THREE.MeshBasicMaterial({ color: 0xf43f5e })
    );
    tailLight.position.set(0, 0.06, -0.5);
    droneGroup.add(tailLight);

    // --- Landing skids (bent carbon tubes) ---
    [-0.36, 0.36].forEach((sideX) => {
        const railCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(sideX, -0.1, 0.36),
            new THREE.Vector3(sideX * 1.05, -0.25, 0.12),
            new THREE.Vector3(sideX * 1.05, -0.25, -0.12),
            new THREE.Vector3(sideX, -0.1, -0.36),
        ]);
        const rail = new THREE.Mesh(new THREE.TubeGeometry(railCurve, 24, 0.022, 10, false), darkMetalMat);
        rail.castShadow = true;
        droneGroup.add(rail);

        [-0.12, 0.12].forEach((strutZ) => {
            const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.2, 10), carbonMat);
            strut.position.set(sideX * 1.03, -0.15, strutZ);
            strut.castShadow = true;
            droneGroup.add(strut);
        });
    });

    // --- Arms, motors & propellers ---
    const armPositions = [
        { x: -0.78, z: 0.75, color: 0x10b981 },  // Front Left
        { x: 0.78, z: 0.75, color: 0x10b981 },   // Front Right
        { x: -0.78, z: -0.75, color: 0xf43f5e }, // Rear Left
        { x: 0.78, z: -0.75, color: 0xf43f5e },  // Rear Right
    ];

    const propellers = [];
    armPositions.forEach((pos) => {
        const armAngle = Math.atan2(pos.x, pos.z);

        const armCurve = new THREE.LineCurve3(
            new THREE.Vector3(pos.x * 0.16, -0.01, pos.z * 0.16),
            new THREE.Vector3(pos.x, 0.03, pos.z)
        );
        const arm = new THREE.Mesh(new THREE.TubeGeometry(armCurve, 8, 0.042, 10, false), carbonMat);
        arm.castShadow = true;
        droneGroup.add(arm);

        // LED accent strip along the arm (motor-side color cue)
        const armLength = Math.hypot(pos.x, pos.z);
        const armStripe = new THREE.Mesh(
            new THREE.BoxGeometry(0.028, 0.03, armLength * 0.62),
            new THREE.MeshBasicMaterial({ color: pos.color })
        );
        armStripe.position.set(pos.x * 0.56, -0.04, pos.z * 0.56);
        armStripe.rotation.y = armAngle;
        droneGroup.add(armStripe);

        // Motor mount pod, bell with cooling ribs, LED ring
        const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.07, 20), carbonMat);
        pod.position.set(pos.x, 0.02, pos.z);
        droneGroup.add(pod);

        const motorBell = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.13, 24), darkMetalMat);
        motorBell.position.set(pos.x, 0.11, pos.z);
        motorBell.castShadow = true;
        droneGroup.add(motorBell);

        [0.08, 0.13].forEach((ribY) => {
            const rib = new THREE.Mesh(new THREE.TorusGeometry(0.112, 0.007, 6, 24), darkMetalMat);
            rib.rotation.x = Math.PI / 2;
            rib.position.set(pos.x, ribY, pos.z);
            droneGroup.add(rib);
        });

        const motorRing = new THREE.Mesh(
            new THREE.TorusGeometry(0.118, 0.011, 8, 24),
            new THREE.MeshBasicMaterial({ color: pos.color })
        );
        motorRing.rotation.x = Math.PI / 2;
        motorRing.position.set(pos.x, 0.185, pos.z);
        droneGroup.add(motorRing);

        // Under-arm navigation beacon
        const navLed = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), new THREE.MeshBasicMaterial({ color: pos.color }));
        navLed.position.set(pos.x, -0.06, pos.z);
        droneGroup.add(navLed);

        // Rotor assembly: curved blades with colored tips + motion-blur disc
        const propGroup = new THREE.Group();
        propGroup.position.set(pos.x, 0.21, pos.z);

        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.05, 0.035, 14), darkMetalMat);
        propGroup.add(hub);

        const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.06, 14), shellMat);
        spinner.position.y = 0.04;
        propGroup.add(spinner);

        // Blade planform built as a 2D shape and extruded to a thin foil
        const bladeShape = new THREE.Shape();
        bladeShape.moveTo(0.07, 0.012);
        bladeShape.quadraticCurveTo(0.2, 0.055, 0.44, 0.022);
        bladeShape.quadraticCurveTo(0.47, 0, 0.44, -0.022);
        bladeShape.quadraticCurveTo(0.2, -0.05, 0.07, -0.012);
        bladeShape.quadraticCurveTo(0.02, 0, 0.07, 0.012);

        const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, {
            depth: 0.008,
            bevelEnabled: true,
            bevelThickness: 0.004,
            bevelSize: 0.006,
            bevelSegments: 2,
            curveSegments: 12,
        });

        [0, Math.PI].forEach((bladeYaw) => {
            const orient = new THREE.Group();
            orient.rotation.y = bladeYaw;

            const pitch = new THREE.Group();
            pitch.rotation.x = -Math.PI / 2 + 0.14;
            orient.add(pitch);

            pitch.add(new THREE.Mesh(bladeGeo, bladeMat));

            const tip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.018), new THREE.MeshBasicMaterial({ color: pos.color }));
            tip.position.x = 0.42;
            pitch.add(tip);

            propGroup.add(orient);
        });

        const blurDisc = new THREE.Mesh(
            new THREE.CylinderGeometry(0.47, 0.47, 0.004, 32),
            new THREE.MeshBasicMaterial({
                color: pos.color,
                transparent: true,
                opacity: 0.13,
                depthWrite: false,
            })
        );
        propGroup.add(blurDisc);

        droneGroup.add(propGroup);
        propellers.push(propGroup);
    });

    return { group: droneGroup, propellers };
}
