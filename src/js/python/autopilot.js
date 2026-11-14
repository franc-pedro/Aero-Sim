import { controlState, droneState } from '../core/state.js';
import { showToast } from '../core/toast.js';
import { t } from '../i18n/index.js';
import { refreshFlightStatus } from '../ui/flight-status.js';
import { PYTHON_PRESETS } from './presets.js';

let consoleShowsDefaultMessage = true;

function setDefaultConsoleMessage(consoleEl) {
    if (!consoleEl) return;

    consoleEl.className = 'sub-card rounded-xl px-3 py-2 font-mono text-[11px] max-h-20 overflow-y-auto whitespace-pre-wrap theme-muted-text';
    consoleEl.textContent = t('python.consoleDisabled');
    consoleShowsDefaultMessage = true;
}

export function loadPythonPreset(name) {
    const editor = document.getElementById('python-code-editor');
    if (editor && PYTHON_PRESETS[name]) {
        editor.value = PYTHON_PRESETS[name];
    }
}

function setRunButtonState() {
    const runBtn = document.getElementById('btn-run-python');
    if (!runBtn) return;

    runBtn.disabled = !controlState.pythonRuntimeAvailable;
    if (runBtn.disabled) {
        runBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        runBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

export function initPythonUI() {
    const statusEl = document.getElementById('pyodide-status');
    const consoleEl = document.getElementById('python-console');
    const stopBtn = document.getElementById('btn-stop-python');

    if (statusEl) statusEl.textContent = t('python.runtimeStatus');
    setDefaultConsoleMessage(consoleEl);
    if (stopBtn) {
        stopBtn.disabled = true;
        stopBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
    setRunButtonState();
    loadPythonPreset('square');
}

export function startPythonAutopilot() {
    if (!controlState.pythonRuntimeAvailable) {
        showToast('toast.pythonUnavailable', 'warning');
        return;
    }
}

export function refreshPythonUI() {
    const statusEl = document.getElementById('pyodide-status');
    if (statusEl) statusEl.textContent = t('python.runtimeStatus');

    if (consoleShowsDefaultMessage) {
        setDefaultConsoleMessage(document.getElementById('python-console'));
    }
}

export function stopPythonAutopilot() {
    controlState.pythonRunning = false;

    // A crashed drone keeps its dead controls; do not revive the motors by
    // simply switching control mode.
    if (droneState.flight.status === 'flying') {
        droneState.throttle = 50;
        droneState.pitch = 0;
        droneState.roll = 0;
        droneState.yaw = 0;
    }

    const stopBtn = document.getElementById('btn-stop-python');
    const consoleEl = document.getElementById('python-console');

    setRunButtonState();
    if (stopBtn) {
        stopBtn.disabled = true;
        stopBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
    if (consoleEl && controlState.mode === 'python') {
        setDefaultConsoleMessage(consoleEl);
    }

    refreshFlightStatus();
}

// Pyodide is intentionally not wired in this phase. Keeping the hold behavior
// means Python mode cannot accidentally fly the drone without a runtime.
export function runPythonStep() {
    droneState.throttle = 50;
    droneState.pitch = 0;
    droneState.roll = 0;
    droneState.yaw = 0;
}
