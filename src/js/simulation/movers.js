import * as THREE from 'three';

// Moving level props (e.g. oscillating arches). Each mover owns a THREE.Group
// plus the box colliders attached to it. Stepping advances the oscillation and
// keeps collider.pos in sync, so detectCollision sees them at their current
// spot without any changes to the collision code.
export function stepMovers(dt, world) {
    const movers = world?.movers;
    if (!movers) return;

    for (let i = 0; i < movers.length; i++) {
        const mover = movers[i];
        mover.time += dt;

        const t = (mover.time / mover.period) * Math.PI * 2 + mover.phase;
        const vertical = mover.vertical * Math.sin(t);
        const lateral = mover.lateral * Math.sin(t + Math.PI / 2);

        const cos = Math.cos(mover.yaw);
        const sin = Math.sin(mover.yaw);
        const wx = mover.baseX + lateral * cos;
        const wy = vertical;
        const wz = mover.baseZ - lateral * sin;

        mover.group.position.set(wx, wy, wz);

        const colliders = mover.colliders;
        for (let j = 0; j < colliders.length; j++) {
            const collider = colliders[j];
            const local = collider.localOffset;
            collider.pos.set(
                wx + local.x * cos + local.z * sin,
                wy + local.y,
                wz - local.x * sin + local.z * cos
            );
        }
    }
}
