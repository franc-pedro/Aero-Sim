import { controlState } from '../core/state.js';
import { stopPythonAutopilot } from '../python/autopilot.js';

export function setControlMode(mode) {
    controlState.mode = mode;
    const manualBtn = document.getElementById('mode-btn-manual');
    const pythonBtn = document.getElementById('mode-btn-python');
    const idePanel = document.getElementById('python-ide-panel');
    const flightModeBadge = document.getElementById('flight-mode');

    if (mode === 'python') {
        pythonBtn.className = 'px-3 py-1 rounded-lg text-xs font-semibold transition-all bg-emerald-500 text-white shadow flex items-center gap-1.5';
        manualBtn.className = 'px-3 py-1 rounded-lg text-xs font-semibold transition-all theme-muted-text hover:opacity-80 flex items-center gap-1.5';
        idePanel.classList.remove('hidden');
        if (flightModeBadge) flightModeBadge.innerText = controlState.pythonRunning ? 'PYTHON AUTOPILOT' : 'PYTHON STANDBY';
    } else {
        stopPythonAutopilot();
        manualBtn.className = 'px-3 py-1 rounded-lg text-xs font-semibold transition-all bg-sky-500 text-white shadow flex items-center gap-1.5';
        pythonBtn.className = 'px-3 py-1 rounded-lg text-xs font-semibold transition-all theme-muted-text hover:opacity-80 flex items-center gap-1.5';
        idePanel.classList.add('hidden');
        if (flightModeBadge) flightModeBadge.innerText = 'MODE 2 / ALT HOLD';
    }
}
