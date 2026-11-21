import { CAMERA_MODES, getCameraMode, setCameraMode } from '../simulation/camera.js';
import { viewOptions } from './view-options.js';

// Header switch for the three camera modes (follow / orbit / FPV), plus the
// keyboard shortcut: C cycles through the modes. Typing in the Python Lab or
// any form field never triggers the shortcut.

const BUTTON_IDS = {
    chase: 'camera-btn-chase',
    orbit: 'camera-btn-orbit',
    fpv: 'camera-btn-fpv',
};

export function initCameraModeUI({ noseIndicator }) {
    const buttons = Object.fromEntries(
        Object.entries(BUTTON_IDS).map(([mode, id]) => [mode, document.getElementById(id)])
    );

    function apply(mode) {
        Object.entries(buttons).forEach(([key, button]) => {
            if (!button) return;
            const active = key === mode;
            button.classList.toggle('theme-tab-active', active);
            button.setAttribute('aria-pressed', String(active));
        });
    }

    function switchTo(mode) {
        if (mode === getCameraMode()) return;
        setCameraMode(mode);

        // The nose arrow sits exactly in front of the lens: hide it while the
        // student is flying FPV, restore their preference in other modes.
        if (noseIndicator) {
            noseIndicator.visible = mode === 'fpv' ? false : viewOptions.nose;
        }

        apply(mode);
    }

    Object.entries(buttons).forEach(([mode, button]) => {
        button?.addEventListener('click', () => switchTo(mode));
    });

    document.addEventListener('keydown', (event) => {
        if (event.defaultPrevented || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;

        const target = event.target;
        if (target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;

        if (event.key === 'c' || event.key === 'C') {
            const next = CAMERA_MODES[(CAMERA_MODES.indexOf(getCameraMode()) + 1) % CAMERA_MODES.length];
            switchTo(next);
        }
    });

    apply(getCameraMode());
}
