import { clearTrail, setTrailVisible } from '../scene/trail.js';

// Header toggles for the visual flying aids (nose indicator, trajectory line).
// Choices persist in localStorage so a returning student keeps their setup.

const STORAGE_KEY = 'aero-sim.view.v1';

export const viewOptions = { nose: true, trail: true };

function persist() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(viewOptions));
    } catch {
        // Storage unavailable (private mode): the session keeps defaults.
    }
}

function applyPressedState(button, pressed) {
    button.classList.toggle('theme-tab-active', pressed);
    button.setAttribute('aria-pressed', String(pressed));
}

export function initViewOptions({ noseIndicator }) {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        if (saved) {
            viewOptions.nose = saved.nose !== false;
            viewOptions.trail = saved.trail !== false;
        }
    } catch {
        // Corrupted state: keep defaults.
    }

    const noseButton = document.getElementById('view-btn-nose');
    const trailButton = document.getElementById('view-btn-trail');
    const clearButton = document.getElementById('view-btn-trail-clear');

    if (noseIndicator) noseIndicator.visible = viewOptions.nose;
    setTrailVisible(viewOptions.trail);
    if (noseButton) applyPressedState(noseButton, viewOptions.nose);
    if (trailButton) applyPressedState(trailButton, viewOptions.trail);

    noseButton?.addEventListener('click', () => {
        viewOptions.nose = !viewOptions.nose;
        if (noseIndicator) noseIndicator.visible = viewOptions.nose;
        applyPressedState(noseButton, viewOptions.nose);
        persist();
    });

    trailButton?.addEventListener('click', () => {
        viewOptions.trail = !viewOptions.trail;
        setTrailVisible(viewOptions.trail);
        applyPressedState(trailButton, viewOptions.trail);
        persist();
    });

    clearButton?.addEventListener('click', () => {
        clearTrail();
    });
}
