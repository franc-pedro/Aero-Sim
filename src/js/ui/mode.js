import { controlState } from '../core/state.js';
import { resetTouchControls } from '../controls/touch.js';
import { stopPythonAutopilot } from '../python/autopilot.js';
import { refreshFlightStatus } from './flight-status.js';
import { closePythonPanels, hidePythonFlightView } from './python-lab.js';

export function setControlMode(mode) {
    resetTouchControls();
    hidePythonFlightView();
    closePythonPanels();
    controlState.mode = mode;
    const manualBtn = document.getElementById('mode-btn-manual');
    const pythonBtn = document.getElementById('mode-btn-python');
    const idePanel = document.getElementById('python-ide-panel');

    document.body.classList.toggle('python-lab-open', mode === 'python');

    if (mode === 'python') {
        pythonBtn.className = 'px-3 py-1 rounded-lg text-xs font-semibold transition-all bg-emerald-500 text-white shadow flex items-center gap-1.5';
        manualBtn.className = 'px-3 py-1 rounded-lg text-xs font-semibold transition-all theme-muted-text hover:opacity-80 flex items-center gap-1.5';
        idePanel?.classList.remove('hidden');
    } else {
        stopPythonAutopilot();
        manualBtn.className = 'px-3 py-1 rounded-lg text-xs font-semibold transition-all bg-sky-500 text-white shadow flex items-center gap-1.5';
        pythonBtn.className = 'px-3 py-1 rounded-lg text-xs font-semibold transition-all theme-muted-text hover:opacity-80 flex items-center gap-1.5';
        idePanel?.classList.add('hidden');
    }

    refreshFlightStatus();
}
