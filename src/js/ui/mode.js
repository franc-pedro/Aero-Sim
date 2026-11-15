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
        pythonBtn.className = 'mode-tab mode-tab-active';
        manualBtn.className = 'mode-tab';
        pythonBtn.setAttribute('aria-pressed', 'true');
        manualBtn.setAttribute('aria-pressed', 'false');
        idePanel?.classList.remove('hidden');
    } else {
        stopPythonAutopilot();
        manualBtn.className = 'mode-tab mode-tab-active';
        pythonBtn.className = 'mode-tab';
        manualBtn.setAttribute('aria-pressed', 'true');
        pythonBtn.setAttribute('aria-pressed', 'false');
        idePanel?.classList.add('hidden');
    }

    refreshFlightStatus();
}
