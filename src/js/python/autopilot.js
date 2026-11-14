import { controlState, droneState } from '../core/state.js';
import { showToast } from '../core/toast.js';
import { t } from '../i18n/index.js';
import { refreshFlightStatus } from '../ui/flight-status.js';
import {
    clearPythonDiagnostic,
    ensurePythonLab,
    getPythonCode,
    refreshPythonLab,
    setPythonCode,
    setPythonDiagnostic,
    setPythonMission,
} from '../ui/python-lab.js';
import {
    abortTelloCommand,
    executeTelloCommand,
    isTelloFlightActive,
    TelloCommandError,
    updateTelloCommand,
} from './commands.js';
import { describePythonError } from './errors.js';
import { initMissionUI, refreshMissionUI, updateMission } from './mission.js';
import { PYTHON_PRESETS } from './presets.js';

let worker = null;
let workerReadyPromise = null;
let workerReadyResolve = null;
let workerReadyReject = null;
let workerReadyTimer = null;
let runtimeVersion = '';
let runtimeStatus = 'idle';
let starting = false;
let startGeneration = 0;
let autoLanding = false;
let hardStopTimer = null;
let consoleShowsDefaultMessage = true;

function supportsJspi() {
    return typeof WebAssembly === 'object'
        && ('Suspending' in WebAssembly || 'Suspender' in WebAssembly);
}

function getConsole() {
    return document.getElementById('python-console');
}

function setDefaultConsoleMessage() {
    const consoleEl = getConsole();
    if (!consoleEl) return;

    consoleEl.textContent = t(controlState.pythonRuntimeAvailable
        ? 'python.consoleReady'
        : 'python.consoleUnsupported');
    consoleEl.classList.remove('python-console-error');
    consoleShowsDefaultMessage = true;
}

function clearConsole() {
    const consoleEl = getConsole();
    if (!consoleEl) return;
    consoleEl.textContent = '';
    consoleEl.classList.remove('python-console-error');
    consoleShowsDefaultMessage = false;
}

export function clearPythonConsole() {
    clearConsole();
}

function appendConsole(text, { error = false } = {}) {
    const consoleEl = getConsole();
    if (!consoleEl || !text) return;

    if (consoleShowsDefaultMessage) {
        consoleEl.textContent = '';
        consoleShowsDefaultMessage = false;
    }

    consoleEl.classList.toggle('python-console-error', error);
    consoleEl.textContent += `${text.replace(/\s+$/, '')}\n`;
    if (consoleEl.textContent.length > 12000) {
        consoleEl.textContent = consoleEl.textContent.slice(-12000);
    }
    consoleEl.scrollTop = consoleEl.scrollHeight;
}

function setRuntimeStatus(status) {
    runtimeStatus = status;
    updateStatusText();
    setRunButtonState();
}

function updateStatusText() {
    const statusEl = document.getElementById('pyodide-status');
    if (!statusEl) return;

    const keys = {
        idle: 'python.runtimeIdle',
        loading: 'python.runtimeLoading',
        ready: 'python.runtimeReady',
        running: 'python.runtimeRunning',
        stopping: 'python.runtimeStopping',
        error: 'python.runtimeError',
        unsupported: 'python.runtimeUnsupported',
    };

    const key = keys[runtimeStatus] || keys.idle;
    statusEl.textContent = t(key, { version: runtimeVersion || 'Pyodide' });
}

function setRunButtonState() {
    const runBtn = document.getElementById('btn-run-python');
    const stopBtn = document.getElementById('btn-stop-python');
    const busy = runtimeStatus === 'loading' || runtimeStatus === 'running' || runtimeStatus === 'stopping';
    const canRun = controlState.pythonRuntimeAvailable
        && !busy
        && !starting
        && !autoLanding
        && droneState.flight.status !== 'crashed';
    const canStop = controlState.pythonRunning || runtimeStatus === 'running';

    if (runBtn) {
        runBtn.disabled = !canRun;
        runBtn.classList.toggle('opacity-50', !canRun);
        runBtn.classList.toggle('cursor-not-allowed', !canRun);
    }

    if (stopBtn) {
        stopBtn.disabled = !canStop;
        stopBtn.classList.toggle('opacity-50', !canStop);
        stopBtn.classList.toggle('cursor-not-allowed', !canStop);
    }
}

function cleanupWorker() {
    if (workerReadyTimer) {
        clearTimeout(workerReadyTimer);
        workerReadyTimer = null;
    }
    if (hardStopTimer) {
        clearTimeout(hardStopTimer);
        hardStopTimer = null;
    }

    if (worker) {
        worker.terminate();
        worker = null;
    }

    controlState.pythonRuntimeReady = false;
    controlState.pythonRunning = false;
    autoLanding = false;
    workerReadyPromise = null;
    workerReadyResolve = null;
    workerReadyReject = null;
}

function failRuntime(message, { toast = false } = {}) {
    if (workerReadyReject) {
        const reject = workerReadyReject;
        workerReadyReject = null;
        reject(new Error(message));
    }
    cleanupWorker();
    setRuntimeStatus('error');
    appendConsole(message, { error: true });
    if (toast) showToast('toast.pythonRuntimeError', 'warning');
}

function autoLandIfNeeded() {
    if (
        controlState.mode !== 'python'
        || droneState.flight.status !== 'flying'
        || !isTelloFlightActive()
    ) {
        return false;
    }

    autoLanding = true;
    setRuntimeStatus('stopping');
    appendConsole(t('python.consoleAutoLand'));
    executeTelloCommand('land')
        .catch((error) => {
            if (error?.code !== 'aborted') {
                appendConsole(error?.message || String(error), { error: true });
            }
        })
        .finally(() => {
            autoLanding = false;
            setRuntimeStatus(controlState.pythonRuntimeReady ? 'ready' : 'idle');
            refreshFlightStatus();
        });
    return true;
}

function handleWorkerMessage(message) {
    if (!worker) return;

    switch (message.type) {
        case 'status':
            if (message.status === 'loading' && runtimeStatus !== 'loading') {
                setRuntimeStatus('loading');
            }
            break;

        case 'ready':
            runtimeVersion = message.version || '';
            controlState.pythonRuntimeReady = true;
            if (workerReadyTimer) {
                clearTimeout(workerReadyTimer);
                workerReadyTimer = null;
            }
            if (workerReadyResolve) {
                const resolve = workerReadyResolve;
                workerReadyResolve = null;
                workerReadyReject = null;
                resolve();
            }
            setRuntimeStatus('ready');
            break;

        case 'stdout':
            appendConsole(message.text);
            break;

        case 'stderr':
            appendConsole(message.text, { error: true });
            break;

        case 'telloCommand': {
            const sourceWorker = worker;
            if (!sourceWorker) return;
            executeTelloCommand(message.method, message.args || [])
                .then((value) => {
                    if (worker === sourceWorker) {
                        worker.postMessage({
                            type: 'telloResult',
                            id: message.id,
                            ok: true,
                            value,
                        });
                    }
                })
                .catch((error) => {
                    if (worker !== sourceWorker) return;
                    worker.postMessage({
                        type: 'telloResult',
                        id: message.id,
                        ok: false,
                        error: {
                            type: error?.code || 'tello_error',
                            message: error?.message || String(error),
                        },
                    });
                });
            break;
        }

        case 'finished':
            if (hardStopTimer) {
                clearTimeout(hardStopTimer);
                hardStopTimer = null;
            }
            controlState.pythonRunning = false;
            refreshFlightStatus();
            if (message.status === 'stopped') {
                appendConsole(t('python.consoleStopped'));
            }
            if (message.status === 'error') {
                const info = describePythonError(message.message);
                if (info.line) {
                    setPythonDiagnostic(info.line, info.hint);
                } else {
                    clearPythonDiagnostic();
                }
                appendConsole(`${t('python.hintPrefix')} ${info.hint}`);
            } else {
                clearPythonDiagnostic();
            }
            if (!autoLandIfNeeded()) {
                setRuntimeStatus('ready');
            }
            break;

        case 'fatal':
            failRuntime(message.message || 'Python runtime error.', { toast: true });
            break;

        default:
            break;
    }
}

function ensureRuntime() {
    if (controlState.pythonRuntimeReady && worker) {
        return Promise.resolve();
    }
    if (workerReadyPromise) {
        return workerReadyPromise;
    }
    if (!controlState.pythonRuntimeAvailable) {
        return Promise.reject(new Error(t('python.runtimeUnsupported')));
    }

    setRuntimeStatus('loading');

    worker = new Worker(new URL('./pyodide-worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (event) => handleWorkerMessage(event.data || {});
    worker.onerror = (event) => {
        failRuntime(event.message || 'Failed to start the Python worker.', { toast: true });
    };

    workerReadyPromise = new Promise((resolve, reject) => {
        workerReadyResolve = resolve;
        workerReadyReject = reject;
    });

    workerReadyTimer = setTimeout(() => {
        failRuntime(t('python.runtimeTimeout'), { toast: true });
    }, 120000);

    const baseURL = new URL('pyodide/', document.baseURI).href;
    worker.postMessage({ type: 'init', baseURL });

    return workerReadyPromise;
}

export function preloadPythonRuntime() {
    if (!controlState.pythonRuntimeAvailable || worker) return;
    ensureRuntime().catch(() => {
        // The visible status and console report the failure when the user runs.
    });
}

export function loadPythonPreset(name) {
    if (!PYTHON_PRESETS[name]) return;
    setPythonCode(PYTHON_PRESETS[name]);
    clearPythonDiagnostic();

    const select = document.getElementById('python-preset-select');
    if (select) select.value = name;
}

export function initPythonUI() {
    controlState.pythonRuntimeAvailable = supportsJspi();
    runtimeStatus = controlState.pythonRuntimeAvailable ? 'idle' : 'unsupported';

    setDefaultConsoleMessage();
    updateStatusText();
    setRunButtonState();
    loadPythonPreset('playground');
    initMissionUI(setPythonMission);

    document.getElementById('btn-clear-python-console')
        ?.addEventListener('click', clearPythonConsole);
}

export async function startPythonAutopilot() {
    if (!controlState.pythonRuntimeAvailable) {
        showToast('toast.pythonUnavailable', 'warning');
        return;
    }
    if (controlState.pythonRunning || starting) return;
    if (autoLanding) return;
    if (droneState.flight.status === 'crashed') {
        appendConsole(t('python.consoleCrashed'), { error: true });
        return;
    }

    const generation = ++startGeneration;
    starting = true;
    setRunButtonState();
    clearConsole();
    appendConsole(t('python.consoleStarting'));

    try {
        await ensurePythonLab();
    } catch (error) {
        appendConsole(error?.message || String(error), { error: true });
        showToast('toast.pythonEditorError', 'warning');
        starting = false;
        setRunButtonState();
        return;
    }

    const code = getPythonCode().trim();
    if (!code) {
        appendConsole(t('python.consoleEmpty'), { error: true });
        starting = false;
        setRunButtonState();
        return;
    }

    if (generation !== startGeneration || controlState.mode !== 'python') {
        starting = false;
        setRunButtonState();
        return;
    }

    clearPythonDiagnostic();

    try {
        await ensureRuntime();
    } catch (error) {
        appendConsole(error?.message || String(error), { error: true });
        showToast('toast.pythonLoadFailed', 'warning');
        starting = false;
        setRunButtonState();
        return;
    }

    if (!worker || generation !== startGeneration || controlState.mode !== 'python') {
        starting = false;
        setRunButtonState();
        return;
    }

    controlState.pythonRunning = true;
    setRuntimeStatus('running');
    refreshFlightStatus();
    worker.postMessage({ type: 'run', code, baseURL: new URL('pyodide/', document.baseURI).href });
    starting = false;
    setRunButtonState();
}

export function stopPythonAutopilot() {
    startGeneration += 1;
    starting = false;

    if (autoLanding) {
        autoLanding = false;
        abortTelloCommand(new TelloCommandError('Stopped by user.', 'aborted'));
        setRuntimeStatus(controlState.pythonRuntimeAvailable
            ? (controlState.pythonRuntimeReady ? 'ready' : 'idle')
            : 'unsupported');
        if (droneState.flight.status === 'flying') {
            droneState.throttle = 50;
            droneState.pitch = 0;
            droneState.roll = 0;
            droneState.yaw = 0;
        }
        refreshFlightStatus();
        setRunButtonState();
        return;
    }

    const wasActive = controlState.pythonRunning || runtimeStatus === 'running' || runtimeStatus === 'stopping';

    abortTelloCommand(new TelloCommandError('Stopped by user.', 'aborted'));

    if (wasActive && worker) {
        worker.postMessage({ type: 'stop' });
        controlState.pythonRunning = false;
        setRuntimeStatus('stopping');

        const sourceWorker = worker;
        if (hardStopTimer) clearTimeout(hardStopTimer);
        hardStopTimer = setTimeout(() => {
            if (worker === sourceWorker && runtimeStatus === 'stopping') {
                cleanupWorker();
                appendConsole(t('python.consoleHardStopped'), { error: true });
                if (!autoLandIfNeeded()) {
                    setRuntimeStatus('idle');
                }
            }
        }, 1000);
    } else if (runtimeStatus !== 'loading') {
        setRuntimeStatus(controlState.pythonRuntimeAvailable
            ? (controlState.pythonRuntimeReady ? 'ready' : 'idle')
            : 'unsupported');
    }

    // A crashed drone keeps its dead controls; hover otherwise.
    if (droneState.flight.status === 'flying') {
        droneState.throttle = 50;
        droneState.pitch = 0;
        droneState.roll = 0;
        droneState.yaw = 0;
    }

    refreshFlightStatus();
    setRunButtonState();
}

export function refreshPythonUI() {
    updateStatusText();
    refreshPythonLab();
    refreshMissionUI();
    if (consoleShowsDefaultMessage) {
        setDefaultConsoleMessage();
    }
    setRunButtonState();
}

// Called from the fixed simulation step. The worker runs Python separately;
// this function only advances the active Tello command in the main thread.
export function runPythonStep(dt) {
    updateTelloCommand(dt);
    updateMission();
}
