import { DEFAULT_LEVEL_ID, getLevel, getLevelText } from '../levels/index.js';
import { stopPythonAutopilot } from '../python/autopilot.js';
import { resetTelloCommandState } from '../python/commands.js';
import { resetMission, setMissionLevel } from '../python/mission.js';
import { setMissionPads } from '../python/mission-pads.js';
import { buildLevel, disposeLevel } from '../scene/level-builder.js';
import { resetGateFx } from '../scene/gate-fx.js';
import { GROUND_HEIGHT } from '../simulation/constants.js';
import { refreshFlightStatus } from '../ui/flight-status.js';
import { setLevelInfo } from '../ui/levels.js';
import { applyTheme } from '../ui/theme.js';
import { controlState, droneState, resetDrone } from './state.js';
import { showToast } from './toast.js';

export function createSession({ scene, world }) {
    let current = null;

    function getSpawnForMode() {
        if (!current) return null;
        if (controlState.mode === 'python') {
            return { ...current.spawn, y: GROUND_HEIGHT };
        }
        return current.spawn;
    }

    function syncWorld() {
        world.level = current;
        world.levelDef = current.def;
        world.groundMesh = current.groundMesh;
        world.gridHelper = current.gridHelper;
        world.obstacles = current.obstacles;
        world.solids = current.solids;
        world.movers = current.movers;
        world.rings = current.rings;
        world.gates = current.gates;
        world.bounds = current.bounds;
        world.spawn = current.spawn;
    }

    function resetObjectives() {
        droneState.objectives.gatesTotal = current ? current.gates.length : 0;
        droneState.objectives.gatesPassed = 0;
        droneState.objectives.completed = false;

        if (current) {
            current.gates.forEach((gate) => {
                gate.passed = false;
            });
            // Re-open every gate visually: crossed rings return to their
            // authored colour.
            resetGateFx(current.gates);
        }
    }

    function loadLevel(id) {
        const def = getLevel(id) || getLevel(DEFAULT_LEVEL_ID);
        if (!def) return null;

        if (current) {
            disposeLevel(current, scene);
            current = null;
        }

        // A level change always starts from a controlled state.
        stopPythonAutopilot();
        resetTelloCommandState();

        const themeName = def.defaultTheme || 'daylight';
        current = buildLevel(def, scene, themeName);
        syncWorld();
        resetObjectives();

        applyTheme(themeName, world);
        resetDrone(getSpawnForMode(), { silent: true });
        setMissionLevel(def);
        setMissionPads(def);

        refreshFlightStatus();
        setLevelInfo(def);
        showToast('toast.levelLoaded', 'info', () => {
            const text = getLevelText(def);
            return { name: text.name, difficulty: text.difficulty };
        });

        return current;
    }

    function reset({ silent = false } = {}) {
        if (!current) return;

        if (controlState.mode === 'python') {
            stopPythonAutopilot();
        }
        resetTelloCommandState();
        resetObjectives();
        resetDrone(getSpawnForMode(), { silent });
        resetMission();
        refreshFlightStatus();
    }

    // Python scripts start on the launch pad so takeoff()/land() have a clear
    // physical meaning. The drone remains in normal "flying" physics, just at
    // ground level until takeoff is requested.
    function preparePython() {
        if (!current) return;

        stopPythonAutopilot();
        resetTelloCommandState();
        resetObjectives();
        resetDrone(
            { ...current.spawn, y: GROUND_HEIGHT },
            { silent: true }
        );
        resetMission();
        refreshFlightStatus();
    }

    return {
        loadLevel,
        reset,
        preparePython,
        getCurrent: () => current,
    };
}
