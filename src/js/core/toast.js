import { t } from '../i18n/index.js';

// --- Notification Toast Helper ---
let toastTimer = null;
let lastToast = null;

function applyToastType(type) {
    const toastIcon = document.getElementById('toast-icon');
    if (!toastIcon) return;

    if (type === 'success') {
        toastIcon.className = 'fa-solid fa-circle-check text-emerald-400';
    } else if (type === 'warning') {
        toastIcon.className = 'fa-solid fa-triangle-exclamation text-amber-400';
    } else {
        toastIcon.className = 'fa-solid fa-circle-info text-cyan-400';
    }
}

function renderToast() {
    const toastMsg = document.getElementById('toast-msg');
    if (!toastMsg || !lastToast) return;

    const params = typeof lastToast.params === 'function'
        ? lastToast.params()
        : lastToast.params;

    toastMsg.textContent = t(lastToast.key, params || {});
}

export function showToast(key, type = 'info', params = {}) {
    lastToast = { key, type, params };

    const toast = document.getElementById('toast');
    if (!toast) return;

    renderToast();
    applyToastType(type);

    toast.classList.remove('opacity-0', 'translate-y-[-20px]', 'pointer-events-none');
    toast.classList.add('opacity-100', 'translate-y-0');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-y-0');
        toast.classList.add('opacity-0', 'translate-y-[-20px]', 'pointer-events-none');
        toastTimer = null;
    }, 3500);
}

export function refreshToast() {
    renderToast();
}
