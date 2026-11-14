import * as THREE from 'three';

// --- Quadcopter 3D Model Constructor ---
export function createQuadcopter() {
    const droneGroup = new THREE.Group();

    // Shared Materials
    const carbonMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.75, roughness: 0.25 });
    const shellMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.25, roughness: 0.2 });
    const accentMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.5, roughness: 0.25 });
    const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.2 });

    // Main Aerodynamic Fuselage Core
    const lowerPlate = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.1, 1.05), carbonMat);
    lowerPlate.position.y = -0.02;
    lowerPlate.castShadow = true;
    droneGroup.add(lowerPlate);

    // Sculpted Upper Canopy Shell
    const upperShell = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.16, 0.92), shellMat);
    upperShell.position.set(0, 0.09, -0.02);
    upperShell.castShadow = true;
    droneGroup.add(upperShell);

    // Aerodynamic Nose Cone (+Z Front)
    const noseGeo = new THREE.CylinderGeometry(0.14, 0.3, 0.36, 16);
    noseGeo.rotateX(Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, shellMat);
    nose.position.set(0, 0.06, 0.54);
    nose.castShadow = true;
    droneGroup.add(nose);

    // Top Racing Stripe & LiPo Battery Pack
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.88), accentMat);
    stripe.position.set(0, 0.175, -0.02);
    droneGroup.add(stripe);

    const batteryPack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.58), darkMetalMat);
    batteryPack.position.set(0, 0.23, -0.08);
    batteryPack.castShadow = true;
    droneGroup.add(batteryPack);

    const batteryStrap = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.15, 0.12), accentMat);
    batteryStrap.position.set(0, 0.23, -0.08);
    droneGroup.add(batteryStrap);

    // GPS Mast / Antenna on Rear
    const antennaStem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.24, 8), carbonMat);
    antennaStem.position.set(0.16, 0.28, -0.42);
    antennaStem.rotation.x = -0.25;
    droneGroup.add(antennaStem);

    const antennaCap = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 10), accentMat);
    antennaCap.position.set(0.16, 0.4, -0.45);
    droneGroup.add(antennaCap);

    // Front FPV Gimbal Camera Assembly (+Z)
    const gimbalBracket = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.2), darkMetalMat);
    gimbalBracket.position.set(0, -0.1, 0.46);
    droneGroup.add(gimbalBracket);

    const camBarrelGeo = new THREE.CylinderGeometry(0.09, 0.1, 0.18, 20);
    camBarrelGeo.rotateX(Math.PI / 2);
    const camBarrel = new THREE.Mesh(camBarrelGeo, darkMetalMat);
    camBarrel.position.set(0, -0.11, 0.55);
    droneGroup.add(camBarrel);

    const lensGlass = new THREE.Mesh(
        new THREE.SphereGeometry(0.075, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0x0ea5e9, metalness: 0.95, roughness: 0.05 })
    );
    lensGlass.position.set(0, -0.11, 0.61);
    droneGroup.add(lensGlass);

    // Front Headlight Bar & Rear Taillight Bar
    const headLight = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.04, 0.04),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    headLight.position.set(0, 0.05, 0.72);
    droneGroup.add(headLight);

    const tailLight = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.05, 0.04),
        new THREE.MeshBasicMaterial({ color: 0xf43f5e })
    );
    tailLight.position.set(0, 0.08, -0.53);
    droneGroup.add(tailLight);

    // Landing Skids (Left & Right)
    [-0.36, 0.36].forEach((sideX) => {
        // Vertical struts
        [-0.28, 0.28].forEach((strutZ) => {
            const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.24, 8), carbonMat);
            strut.position.set(sideX, -0.14, strutZ);
            strut.rotation.z = sideX > 0 ? -0.18 : 0.18;
            strut.castShadow = true;
            droneGroup.add(strut);
        });
        // Horizontal skid rail
        const railGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.85, 10);
        railGeo.rotateX(Math.PI / 2);
        const rail = new THREE.Mesh(railGeo, darkMetalMat);
        rail.position.set(sideX * 1.06, -0.25, 0);
        rail.castShadow = true;
        droneGroup.add(rail);
    });

    // Arms, Brushless Motors & Twin-Blade Propellers + Motion Blur Discs
    const armPositions = [
        { x: -0.78, z: 0.75, color: 0x10b981 },  // Front Left (Emerald Green)
        { x: 0.78, z: 0.75, color: 0x10b981 },   // Front Right (Emerald Green)
        { x: -0.78, z: -0.75, color: 0xf43f5e }, // Rear Left (Crimson Red)
        { x: 0.78, z: -0.75, color: 0xf43f5e },  // Rear Right (Crimson Red)
    ];

    const propellers = [];
    armPositions.forEach((pos) => {
        const armLength = Math.hypot(pos.x, pos.z);
        const armAngle = Math.atan2(pos.x, pos.z);

        // Tapered Carbon Fiber Arm
        const armGeo = new THREE.BoxGeometry(0.11, 0.065, armLength);
        const arm = new THREE.Mesh(armGeo, carbonMat);
        arm.position.set(pos.x * 0.5, 0.01, pos.z * 0.5);
        arm.rotation.y = armAngle;
        arm.castShadow = true;
        droneGroup.add(arm);

        // LED Accent Strip along Arm
        const armStripe = new THREE.Mesh(
            new THREE.BoxGeometry(0.03, 0.072, armLength * 0.65),
            new THREE.MeshBasicMaterial({ color: pos.color })
        );
        armStripe.position.set(pos.x * 0.55, 0.01, pos.z * 0.55);
        armStripe.rotation.y = armAngle;
        droneGroup.add(armStripe);

        // Motor Mount Pod & Brushless Bell
        const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.08, 16), carbonMat);
        pod.position.set(pos.x, 0.02, pos.z);
        droneGroup.add(pod);

        const motorBell = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.14, 20), darkMetalMat);
        motorBell.position.set(pos.x, 0.11, pos.z);
        motorBell.castShadow = true;
        droneGroup.add(motorBell);

        const motorRing = new THREE.Mesh(
            new THREE.TorusGeometry(0.132, 0.012, 8, 24),
            new THREE.MeshBasicMaterial({ color: pos.color })
        );
        motorRing.rotation.x = Math.PI / 2;
        motorRing.position.set(pos.x, 0.13, pos.z);
        droneGroup.add(motorRing);

        // Under-arm Navigation Beacon
        const navLed = new THREE.Mesh(
            new THREE.SphereGeometry(0.055, 10, 10),
            new THREE.MeshBasicMaterial({ color: pos.color })
        );
        navLed.position.set(pos.x, -0.05, pos.z);
        droneGroup.add(navLed);

        // Rotor Assembly (Spinner Cap + Aerodynamic Blades + Blur Disc)
        const propGroup = new THREE.Group();
        propGroup.position.set(pos.x, 0.21, pos.z);

        const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.09, 14), shellMat);
        spinner.position.y = 0.03;
        propGroup.add(spinner);

        const bladeMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            metalness: 0.4,
            roughness: 0.35,
        });
        const tipMat = new THREE.MeshBasicMaterial({ color: pos.color });

        // Two pitched blades
        const blade1 = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.014, 0.085), bladeMat);
        blade1.rotation.x = 0.14;
        propGroup.add(blade1);

        // Colored safety tips on propeller ends
        [-0.45, 0.45].forEach((tipX) => {
            const tip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.016, 0.088), tipMat);
            tip.position.x = tipX;
            tip.rotation.x = 0.14;
            propGroup.add(tip);
        });

        // Subtle semi-transparent rotor motion-blur disc
        const discGeo = new THREE.CylinderGeometry(0.49, 0.49, 0.005, 32);
        const discMat = new THREE.MeshBasicMaterial({
            color: pos.color,
            transparent: true,
            opacity: 0.14,
            depthWrite: false,
        });
        const blurDisc = new THREE.Mesh(discGeo, discMat);
        propGroup.add(blurDisc);

        droneGroup.add(propGroup);
        propellers.push(propGroup);
    });

    return { group: droneGroup, propellers };
}
