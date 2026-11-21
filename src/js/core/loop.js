import { droneState } from './state.js';
import { showToast } from './toast.js';
import { updateHUD } from '../ui/hud.js';
import { notifyCrash, refreshFlightStatus } from '../ui/flight-status.js';
import { addCameraShake, updateCamera } from '../simulation/camera.js';
import { updateDroneShadow } from '../scene/atmosphere.js';
import { updateTrail } from '../scene/trail.js';
import { updateGateFx } from '../scene/gate-fx.js';
import { updateMission } from '../python/mission.js';
import {
    capturePreviousState,
    sampleInput,
    stepPhysics,
    updatePropellers,
    updateRenderTransforms,
} from '../simulation/physics.js';

const FIXED_DT = 1 / 120;
const MAX_FRAME_DT = 0.1;
const MAX_STEPS_PER_FRAME = 12;

const FRAME_HISTORY_SIZE = 120;

export function startLoop({ scene, camera, renderer, world }) {
    let lastTime = null;
    let accumulator = 0;
    let lastSteps = 0;
    let lastFlightStatus = droneState.flight.status;
    let lastGatesPassed = droneState.objectives.gatesPassed;

    const frameTimes = new Float32Array(FRAME_HISTORY_SIZE);
    let frameTimeIndex = 0;
    let frameTimeCount = 0;
    let statsAccumulator = 0;

    const debugEl = document.getElementById('debug-stats');
    let debugVisible = false;

    window.addEventListener('keydown', (event) => {
        if (event.code !== 'F3') return;
        event.preventDefault();
        debugVisible = !debugVisible;
        if (debugEl) debugEl.classList.toggle('hidden', !debugVisible);
    });

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            // Resume cleanly without simulating the time spent in the background.
            lastTime = null;
            accumulator = 0;
        }
    });

    function updateSunShadow() {
        const light = world.dirLight;
        if (!light) return;

        const target = droneState.renderPos;
        light.position.set(target.x + 50, target.y + 100, target.z + 50);
        light.target.position.copy(target);
        light.target.updateMatrixWorld();
    }

    function updateDebugStats(rawDt) {
        frameTimes[frameTimeIndex] = rawDt * 1000;
        frameTimeIndex = (frameTimeIndex + 1) % FRAME_HISTORY_SIZE;
        frameTimeCount = Math.min(frameTimeCount + 1, FRAME_HISTORY_SIZE);

        statsAccumulator += rawDt;
        if (!debugEl || !debugVisible || statsAccumulator < 0.25) return;
        statsAccumulator = 0;

        let total = 0;
        let max = 0;
        for (let i = 0; i < frameTimeCount; i++) {
            total += frameTimes[i];
            if (frameTimes[i] > max) max = frameTimes[i];
        }
        const averageMs = frameTimeCount > 0 ? total / frameTimeCount : 0;
        const fps = averageMs > 0 ? 1000 / averageMs : 0;
        const info = renderer.info;

        debugEl.textContent = [
            `FPS   ${fps.toFixed(1)}   frame ${averageMs.toFixed(1)} ms   max ${max.toFixed(1)} ms`,
            `steps ${lastSteps}   calls ${info.render.calls}   tris ${info.render.triangles}`,
            `geo   ${info.memory.geometries}   tex ${info.memory.textures}`,
        ].join('\n');
    }

    function frame(timestamp) {
        requestAnimationFrame(frame);

        let rawDt = 0;
        if (lastTime === null) {
            lastTime = timestamp;
        } else {
            rawDt = (timestamp - lastTime) / 1000;
            lastTime = timestamp;
        }

        if (document.hidden) {
            accumulator = 0;
            return;
        }

        const frameDt = Math.min(Math.max(rawDt, 0), MAX_FRAME_DT);
        sampleInput(frameDt);

        accumulator += frameDt;
        lastSteps = 0;
        while (accumulator >= FIXED_DT && lastSteps < MAX_STEPS_PER_FRAME) {
            capturePreviousState();
            stepPhysics(FIXED_DT, world);
            accumulator -= FIXED_DT;
            lastSteps++;
        }

        // Drop any backlog that could not be simulated in this frame.
        if (lastSteps === MAX_STEPS_PER_FRAME) {
            accumulator = Math.min(accumulator, FIXED_DT);
        }

        if (droneState.flight.status !== lastFlightStatus) {
            if (droneState.flight.status === 'crashed') {
                addCameraShake(Math.min(0.5, 0.08 + droneState.flight.impactSpeed * 0.02));
                notifyCrash(droneState.flight.cause, droneState.flight.impactSpeed);
                updateMission();
            } else {
                refreshFlightStatus();
            }
            lastFlightStatus = droneState.flight.status;
        }

        const objectives = droneState.objectives;
        if (objectives.gatesTotal > 0 && objectives.gatesPassed > lastGatesPassed) {
            if (objectives.gatesPassed >= objectives.gatesTotal) {
                showToast('toast.courseComplete', 'success');
            } else {
                showToast('toast.gate', 'success', {
                    passed: objectives.gatesPassed,
                    total: objectives.gatesTotal,
                });
            }
        }
        lastGatesPassed = objectives.gatesPassed;

        const alpha = Math.min(accumulator / FIXED_DT, 1);
        updateRenderTransforms(alpha, world);
        updatePropellers(frameDt, world);
        updateCamera(camera, frameDt, world);
        updateSunShadow();
        updateDroneShadow(world.atmosphere, droneState.renderPos);
        updateTrail(droneState.renderPos);
        updateGateFx(frameDt);
        updateHUD(frameDt);

        renderer.render(scene, camera);
        updateDebugStats(rawDt);
    }

    requestAnimationFrame(frame);
}
