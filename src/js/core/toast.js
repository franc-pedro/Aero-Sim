// --- Notification Toast Helper ---
let toastTimer = null;

export function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');
    const toastIcon = document.getElementById('toast-icon');

    if (!toast || !toastMsg || !toastIcon) return;

    toastMsg.innerText = message;
    if (type === 'success') {
        toastIcon.className = 'fa-solid fa-circle-check text-emerald-400';
    } else if (type === 'warning') {
        toastIcon.className = 'fa-solid fa-triangle-exclamation text-amber-400';
    } else {
        toastIcon.className = 'fa-solid fa-circle-info text-cyan-400';
    }

    toast.classList.remove('opacity-0', 'translate-y-[-20px]', 'pointer-events-none');
    toast.classList.add('opacity-100', 'translate-y-0');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-y-0');
        toast.classList.add('opacity-0', 'translate-y-[-20px]', 'pointer-events-none');
        toastTimer = null;
    }, 3500);
}
