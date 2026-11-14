import { DEFAULT_LEVEL_ID, getLevel } from '../levels/index.js';
import { stopPythonAutopilot } from '../python/autopilot.js';
import { buildLevel, disposeLevel } from '../scene/level-builder.js';
import { refreshFlightStatus } from '../ui/flight-status.js';
import { setLevelInfo } from '../ui/levels.js';
import { applyTheme } from '../ui/theme.js';
import { droneState, resetDrone } from './state.js';
import { showToast } from './toast.js';

export function createSession({ scene, world }) {
    let current = null;

    function syncWorld() {
        world.level = current;
        world.levelDef = current.def;
        world.groundMesh = current.groundMesh;
        world.gridHelper = current.gridHelper;
        world.obstacles = current.obstacles;
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

        const themeName = def.defaultTheme || 'daylight';
        current = buildLevel(def, scene, themeName);
        syncWorld();
        resetObjectives();

        applyTheme(themeName, world);
        resetDrone(current.spawn, { silent: true });

        refreshFlightStatus();
        setLevelInfo(def);
        showToast(`Level: ${def.name} — ${def.difficulty}`, 'info');

        return current;
    }

    function reset() {
        if (!current) return;

        resetObjectives();
        resetDrone(current.spawn, { silent: false });
        refreshFlightStatus();
    }

    return {
        loadLevel,
        reset,
        getCurrent: () => current,
    };
}
