import shimSource from '../../py/djitellopy.py?raw';

let pyodide = null;
let initPromise = null;
let running = false;
let stopped = false;
let nextCommandId = 1;

const pendingCommands = new Map();
const pendingSleeps = new Set();

function post(message) {
    self.postMessage(message);
}

function resolvePendingCommands(result) {
    for (const resolve of pendingCommands.values()) {
        resolve(JSON.stringify(result));
    }
    pendingCommands.clear();
}

function stopPendingSleeps() {
    for (const entry of pendingSleeps) {
        clearTimeout(entry.timer);
        entry.reject(new Error('Python execution stopped.'));
    }
    pendingSleeps.clear();
}

const bridge = {
    call(method, argsJson) {
        return new Promise((resolve) => {
            const id = nextCommandId++;
            pendingCommands.set(id, resolve);
            post({
                type: 'telloCommand',
                id,
                method,
                args: JSON.parse(argsJson || '[]'),
            });
        });
    },

    sleep(seconds) {
        return new Promise((resolve, reject) => {
            const entry = { reject, timer: null };
            const ms = Math.max(0, Number(seconds) || 0) * 1000;
            entry.timer = setTimeout(() => {
                pendingSleeps.delete(entry);
                resolve();
            }, ms);
            pendingSleeps.add(entry);
        });
    },
};

async function initialize(baseURL) {
    if (initPromise) return initPromise;

    initPromise = (async () => {
        post({ type: 'status', status: 'loading' });

        const { loadPyodide } = await import(/* @vite-ignore */ `${baseURL}pyodide.mjs`);
        pyodide = await loadPyodide({ indexURL: baseURL });

        pyodide.setStdout({
            batched: (text) => post({ type: 'stdout', text }),
        });
        pyodide.setStderr({
            batched: (text) => post({ type: 'stderr', text }),
        });

        pyodide.registerJsModule('aero_bridge', bridge);

        // Expose the djitellopy-compatible simulator module on the Pyodide path.
        pyodide.FS.writeFile('/home/pyodide/djitellopy.py', shimSource);

        pyodide.runPython(`
import sys
if '/home/pyodide' not in sys.path:
    sys.path.insert(0, '/home/pyodide')
`);

        // time.sleep must yield to the worker event loop so the Stop button can
        // interrupt a sleeping script. run_sync uses JSPI stack switching.
        pyodide.runPython(`
import time
from pyodide.ffi import run_sync as _aero_run_sync
import aero_bridge as _aero_bridge

def _aero_sleep(seconds):
    _aero_run_sync(_aero_bridge.sleep(float(seconds)))

time.sleep = _aero_sleep
`);

        // Verify that stack switching is actually available in this worker
        // before reporting the runtime as ready.
        const canRunSync = await pyodide.runPythonAsync(`
from pyodide.ffi import can_run_sync
can_run_sync()
`);
        const jspiValue = canRunSync && typeof canRunSync.toJs === 'function'
            ? canRunSync.toJs()
            : canRunSync;
        const jspiAvailable = jspiValue === true;
        if (canRunSync && typeof canRunSync.destroy === 'function') canRunSync.destroy();
        if (!jspiAvailable) {
            throw new Error('JSPI is not available in this browser.');
        }

        post({ type: 'ready', version: pyodide.version });
    })();

    return initPromise;
}

async function runScript(code) {
    if (!pyodide) {
        post({ type: 'fatal', message: 'Python runtime is not ready.' });
        return;
    }
    if (running) {
        post({ type: 'fatal', message: 'A Python script is already running.' });
        return;
    }

    running = true;
    stopped = false;

    try {
        const result = await pyodide.runPythonAsync(code);
        if (result && typeof result.destroy === 'function') result.destroy();
        post({ type: 'finished', status: stopped ? 'stopped' : 'ok' });
    } catch (error) {
        const message = String(error?.message || error);
        if (stopped || message.includes('KeyboardInterrupt')) {
            post({ type: 'finished', status: 'stopped' });
        } else {
            post({ type: 'stderr', text: message });
            post({ type: 'finished', status: 'error', message });
        }
    } finally {
        running = false;
    }
}

self.onmessage = async (event) => {
    const message = event.data || {};

    try {
        if (message.type === 'init') {
            await initialize(message.baseURL);
            return;
        }

        if (message.type === 'run') {
            if (!pyodide) await initialize(message.baseURL);
            await runScript(message.code || '');
            return;
        }

        if (message.type === 'stop') {
            stopped = true;
            resolvePendingCommands({
                ok: false,
                error: { type: 'aborted', message: 'Stopped by user.' },
            });
            stopPendingSleeps();
            return;
        }

        if (message.type === 'telloResult') {
            const resolve = pendingCommands.get(message.id);
            if (!resolve) return;
            pendingCommands.delete(message.id);
            resolve(JSON.stringify({
                ok: message.ok,
                value: message.value,
                error: message.error,
            }));
        }
    } catch (error) {
        post({ type: 'fatal', message: String(error?.message || error) });
    }
};
