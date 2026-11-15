const STORAGE_KEY = 'aero-sim.python.progress.v1';
const listeners = new Set();

let memory = null;

function emptyProgress() {
    return {
        version: 1,
        completed: {},
        quiz: {},
        lastLevel: null,
        updatedAt: 0,
    };
}

function normalizeProgress(raw) {
    const base = emptyProgress();
    if (!raw || typeof raw !== 'object') return base;

    return {
        version: 1,
        completed: raw.completed && typeof raw.completed === 'object'
            ? raw.completed
            : base.completed,
        quiz: raw.quiz && typeof raw.quiz === 'object'
            ? raw.quiz
            : base.quiz,
        lastLevel: typeof raw.lastLevel === 'string' ? raw.lastLevel : null,
        updatedAt: Number.isFinite(raw.updatedAt) ? raw.updatedAt : 0,
    };
}

function readProgress() {
    if (memory) return memory;

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        memory = stored ? normalizeProgress(JSON.parse(stored)) : emptyProgress();
    } catch {
        memory = emptyProgress();
    }

    return memory;
}

function writeProgress(progress) {
    memory = normalizeProgress(progress);
    memory.updatedAt = Date.now();

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
    } catch {
        // Progress remains available for this session.
    }

    return memory;
}

function notify() {
    const snapshot = getProgress();
    listeners.forEach((listener) => {
        try {
            listener(snapshot);
        } catch {
            // A progress listener must not break the lab.
        }
    });
}

export function getProgress() {
    return JSON.parse(JSON.stringify(readProgress()));
}

export function subscribeProgress(listener) {
    if (typeof listener !== 'function') return () => {};
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function isLevelComplete(levelId) {
    return Boolean(readProgress().completed[levelId]);
}

export function getQuizResult(levelId) {
    return readProgress().quiz[levelId] || null;
}

export function recordMissionComplete({ levelId, concept = null, hintsUsed = 0 }) {
    if (!levelId) return;

    const progress = readProgress();
    const previous = progress.completed[levelId] || null;
    const count = Math.max(0, Number(hintsUsed) || 0);

    progress.completed[levelId] = {
        completedAt: previous?.completedAt || Date.now(),
        concept: concept || previous?.concept || null,
        hintsUsed: previous ? Math.min(previous.hintsUsed ?? count, count) : count,
    };

    writeProgress(progress);
    notify();
}

export function recordQuizAnswer(levelId, { selectedIndex, correct }) {
    if (!levelId) return;

    const progress = readProgress();
    progress.quiz[levelId] = {
        selectedIndex: Number(selectedIndex),
        correct: Boolean(correct),
        answeredAt: Date.now(),
    };

    writeProgress(progress);
    notify();
}

export function setLastLevel(levelId) {
    if (!levelId) return;

    const progress = readProgress();
    if (progress.lastLevel === levelId) return;
    progress.lastLevel = levelId;
    writeProgress(progress);
    notify();
}

export function resetProgress() {
    writeProgress(emptyProgress());
    notify();
}

export function getCompletionCount(levels = []) {
    const progress = readProgress();
    return levels.filter((level) => progress.completed[level.id]).length;
}
