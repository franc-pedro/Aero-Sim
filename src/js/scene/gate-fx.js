import * as THREE from 'three';

// Gate pass feedback: a crossed gate turns emissive green with a short pulse,
// and stays green so students can see which gates are still open. The pulse is
// a purely visual decay ticked at render rate; gate detection itself is
// untouched. Original colours live in the material's userData so a session
// reset (or level reload) can restore them.

const PASS_COLOR = 0x22c55e;
const FLASH_DURATION = 1.2;
const active = new Set();

export function flashGate(gate) {
    const material = gate.mesh?.material;
    if (!material) return;

    const ud = material.userData;
    if (!ud.baseColor) {
        ud.baseColor = material.color.clone();
        ud.baseEmissive = material.emissive.clone();
        ud.baseEmissiveIntensity = material.emissiveIntensity;
    }

    material.color.setHex(PASS_COLOR);
    material.emissive.setHex(PASS_COLOR);
    ud.flashTime = 0;
    active.add(gate);
}

export function updateGateFx(dt) {
    if (active.size === 0) return;

    for (const gate of [...active]) {
        const material = gate.mesh?.material;
        const ud = material?.userData;
        if (!material || ud.flashTime === undefined) {
            active.delete(gate);
            continue;
        }

        ud.flashTime += dt;
        const pulse = Math.exp(-ud.flashTime * 5);
        material.emissiveIntensity = (ud.baseEmissiveIntensity ?? 0.08) + 0.55 * pulse;

        if (ud.flashTime >= FLASH_DURATION) active.delete(gate);
    }
}

// Restores every gate material to its authored colour (session reset / level
// reload re-open all gates).
export function resetGateFx(gates) {
    active.clear();
    (gates || []).forEach((gate) => {
        const material = gate.mesh?.material;
        const ud = material?.userData;
        if (!ud || !ud.baseColor) return;

        material.color.copy(ud.baseColor);
        material.emissive.copy(ud.baseEmissive);
        material.emissiveIntensity = ud.baseEmissiveIntensity;
    });
}
