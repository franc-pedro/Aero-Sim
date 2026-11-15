import { showToast } from '../core/toast.js';
import { getLocale, t } from '../i18n/index.js';
import { getLevel, getLevelText, listLevels } from '../levels/index.js';
import {
    TELLO_API_GROUPS,
    TELLO_METHODS,
    getApiDescription,
    getApiGroupLabel,
} from '../python/api-reference.js';
import {
    getProgress,
    getQuizResult,
    recordQuizAnswer,
    resetProgress,
    subscribeProgress,
} from '../python/progress.js';
import { revealAllMissionHints, revealNextMissionHint } from '../python/mission.js';
import { PYTHON_PRESETS } from '../python/presets.js';

const STORAGE_PREFIX = 'aero-sim.python.code.';
const SAVE_DELAY_MS = 450;
const EXPANDED_KEY = 'aero-sim.lab.expanded';
const CONSOLE_COLLAPSED_KEY = 'aero-sim.lab.consoleCollapsed';

let view = null;
let mountPromise = null;
let cmModules = null;
let pendingCode = '';
let pendingDiagnostic = null;
let currentLevelId = null;
let handlers = { onRun: null, onStop: null, onReset: null };
let saveTimer = null;
let diagnosticClearTimer = null;
let suppressSave = false;
let referenceOpen = false;
let lessonOpen = false;
let progressOpen = false;
let labInitialized = false;
let saveState = 'local';
let labExpanded = false;
let consoleCollapsed = false;

function getCurrentLevelId() {
    const select = document.getElementById('level-select');
    return select?.value || currentLevelId || 'default';
}

function setPresetSelection(value) {
    const select = document.getElementById('python-preset-select');
    if (select && value) select.value = value;
}

function storageKey(levelId) {
    return `${STORAGE_PREFIX}${levelId}`;
}

function readSavedCode(levelId) {
    try {
        return localStorage.getItem(storageKey(levelId));
    } catch {
        return null;
    }
}

function writeSavedCode(levelId, code) {
    try {
        localStorage.setItem(storageKey(levelId), code);
        return true;
    } catch {
        // Persistence is optional (private mode, restricted storage, etc.).
        return false;
    }
}

function renderSaveState() {
    const element = document.getElementById('python-save-status');
    if (!element) return;

    const keys = {
        saving: 'python.save.saving',
        saved: 'python.save.saved',
        local: 'python.save.local',
        error: 'python.save.error',
    };
    element.dataset.state = saveState;
    element.textContent = t(keys[saveState] || keys.local);
}

function setSaveState(state) {
    saveState = state;
    renderSaveState();
}

export function getPythonCode() {
    return view ? view.state.doc.toString() : pendingCode;
}

export function setPythonCode(code, { save = true } = {}) {
    pendingCode = String(code ?? '');

    if (view) {
        suppressSave = true;
        view.dispatch({
            changes: {
                from: 0,
                to: view.state.doc.length,
                insert: pendingCode,
            },
        });
        suppressSave = false;
        clearPythonDiagnostic();
    }

    if (save && currentLevelId) {
        const ok = writeSavedCode(currentLevelId, pendingCode);
        setSaveState(ok ? 'saved' : 'error');
    }
}

export function saveCurrentCode() {
    if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
    }
    if (!view) return false;

    const levelId = currentLevelId || getCurrentLevelId();
    if (!levelId) return false;
    const ok = writeSavedCode(levelId, view.state.doc.toString());
    setSaveState(ok ? 'saved' : 'error');
    return ok;
}

function scheduleSave() {
    setSaveState('saving');
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        saveTimer = null;
        saveCurrentCode();
    }, SAVE_DELAY_MS);
}

export function setPythonLevel(levelId) {
    const nextLevelId = levelId || getCurrentLevelId();
    if (view && currentLevelId) {
        saveCurrentCode();
    }
    currentLevelId = nextLevelId;
    closeLessonPanel();
    closeProgressPanel();
    updateLessonButton();
    updateProgressBadge();

    if (!view) return;

    const saved = readSavedCode(currentLevelId);
    if (saved !== null) {
        setPythonCode(saved, { save: false });
        setPresetSelection('custom');
        setSaveState('saved');
        return;
    }

    const example = getLevel(currentLevelId)?.pythonMission?.example || 'square';
    if (example && PYTHON_PRESETS[example]) {
        setPythonCode(PYTHON_PRESETS[example], { save: false });
        setPresetSelection(example);
        setSaveState('local');
    }
}

export function clearPythonDiagnostic() {
    if (diagnosticClearTimer) {
        clearTimeout(diagnosticClearTimer);
        diagnosticClearTimer = null;
    }
    pendingDiagnostic = null;
    if (!view || !cmModules) return;
    view.dispatch(cmModules.setDiagnostics(view.state, []));
}

function scheduleDiagnosticClear() {
    if (diagnosticClearTimer) clearTimeout(diagnosticClearTimer);
    diagnosticClearTimer = setTimeout(() => {
        diagnosticClearTimer = null;
        clearPythonDiagnostic();
    }, 250);
}

export function setPythonDiagnostic(line, message) {
    const lineNumber = Math.max(1, Number(line) || 1);
    const text = String(message || 'Python error');

    if (diagnosticClearTimer) {
        clearTimeout(diagnosticClearTimer);
        diagnosticClearTimer = null;
    }

    if (!view || !cmModules) {
        pendingDiagnostic = { line: lineNumber, message: text };
        return;
    }

    pendingDiagnostic = null;
    const doc = view.state.doc;
    const safeLine = Math.min(doc.lines, lineNumber);
    const lineInfo = doc.line(safeLine);

    view.dispatch(cmModules.setDiagnostics(view.state, [{
        from: lineInfo.from,
        to: lineInfo.to,
        severity: 'error',
        message: text,
    }]));
    view.dispatch({
        effects: cmModules.EditorView.scrollIntoView(lineInfo.from, { y: 'center' }),
    });
}

function telloCompletionSource(context) {
    const line = context.state.doc.lineAt(context.pos);
    const beforeCursor = line.text.slice(0, context.pos - line.from);
    const match = beforeCursor.match(/(?:tello|drone)\.(\w*)$/);
    if (!match) return null;

    const from = context.pos - match[1].length;
    return {
        from,
        options: TELLO_METHODS.map((method) => ({
            label: method.name,
            type: 'method',
            detail: method.signature,
            info: getApiDescription(method, getLocale()),
            apply: method.signature.endsWith('()')
                ? `${method.name}()`
                : `${method.name}(`,
        })),
    };
}

function insertAtCursor(text) {
    if (!view) {
        setPythonCode(`${getPythonCode()}${text}`);
        return;
    }

    const { from, to } = view.state.selection.main;
    view.dispatch({
        changes: { from, to, insert: text },
        selection: { anchor: from + text.length },
    });
    view.focus();
}

function renderReference() {
    const content = document.getElementById('python-reference-content');
    if (!content) return;

    content.replaceChildren();
    const locale = getLocale();

    TELLO_API_GROUPS.forEach((group) => {
        const section = document.createElement('section');
        section.className = 'python-ref-group';

        const title = document.createElement('h4');
        title.className = 'python-ref-group-title';
        title.textContent = getApiGroupLabel(group, locale);
        section.appendChild(title);

        group.methods.forEach((method) => {
            const item = document.createElement('article');
            item.className = 'python-ref-method';
            item.tabIndex = 0;
            item.setAttribute('role', 'button');
            item.title = t('python.insertExample');
            item.setAttribute('aria-label', `${method.signature} — ${t('python.insertExample')}`);

            const signature = document.createElement('div');
            signature.className = 'python-ref-signature';
            signature.textContent = method.signature;
            item.appendChild(signature);

            const description = document.createElement('p');
            description.className = 'python-ref-description';
            description.textContent = getApiDescription(method, locale);
            item.appendChild(description);

            const example = document.createElement('code');
            example.className = 'python-ref-example';
            example.textContent = method.example.replace(/\\n/g, '\n');
            item.appendChild(example);

            const insert = () => {
                insertAtCursor(method.example.replace(/\\n/g, '\n'));
                closeReference();
            };
            item.addEventListener('click', insert);
            item.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    insert();
                }
            });

            section.appendChild(item);
        });

        content.appendChild(section);
    });
}

function getCurrentMission() {
    return getLevel(currentLevelId)?.pythonMission || null;
}

function getCurrentLesson() {
    return getCurrentMission()?.lesson || null;
}

function closeReference() {
    const panel = document.getElementById('python-reference-panel');
    const button = document.getElementById('btn-python-reference');
    if (!panel) return;

    panel.classList.add('hidden');
    referenceOpen = false;
    button?.setAttribute('aria-expanded', 'false');
}

function openReference() {
    const panel = document.getElementById('python-reference-panel');
    const button = document.getElementById('btn-python-reference');
    if (!panel) return;

    closeLessonPanel();
    closeProgressPanel();
    renderReference();
    panel.classList.remove('hidden');
    referenceOpen = true;
    button?.setAttribute('aria-expanded', 'true');
    document.getElementById('btn-close-python-reference')?.focus();
}

function closeLessonPanel({ restoreFocus = false } = {}) {
    const panel = document.getElementById('python-lesson-panel');
    const button = document.getElementById('btn-python-lesson');
    if (!panel) return;

    panel.classList.add('hidden');
    lessonOpen = false;
    button?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) button?.focus();
}

function renderLessonQuiz(quiz) {
    const section = document.getElementById('python-lesson-quiz');
    const questionEl = document.getElementById('python-lesson-quiz-question');
    const optionsEl = document.getElementById('python-lesson-quiz-options');
    const feedbackEl = document.getElementById('python-lesson-quiz-feedback');
    if (!section || !questionEl || !optionsEl || !feedbackEl) return;

    if (!quiz?.questionKey || !Array.isArray(quiz.optionKeys)) {
        section.classList.add('hidden');
        return;
    }

    section.classList.remove('hidden');
    questionEl.textContent = t(quiz.questionKey);
    optionsEl.replaceChildren();

    const result = getQuizResult(currentLevelId);
    quiz.optionKeys.forEach((key, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'python-quiz-option';
        button.textContent = t(key);

        if (result) {
            if (index === quiz.answerIndex) button.classList.add('python-quiz-correct');
            if (index === result.selectedIndex) {
                button.classList.add('python-quiz-selected');
                if (!result.correct) button.classList.add('python-quiz-wrong');
            }
            button.setAttribute('aria-pressed', String(index === result.selectedIndex));
        }

        button.addEventListener('click', () => {
            recordQuizAnswer(currentLevelId, {
                selectedIndex: index,
                correct: index === quiz.answerIndex,
            });
            renderLessonQuiz(quiz);
            updateProgressBadge();
        });

        optionsEl.appendChild(button);
    });

    feedbackEl.className = 'python-quiz-feedback';
    if (!result) {
        feedbackEl.textContent = t('python.quiz.noAnswer');
        feedbackEl.classList.add('python-quiz-feedback-muted');
        return;
    }

    const explanation = quiz.explanationKey ? t(quiz.explanationKey) : '';
    if (result.correct) {
        feedbackEl.textContent = `${t('python.quiz.correct')} ${explanation}`.trim();
        feedbackEl.classList.add('python-quiz-feedback-correct');
    } else {
        feedbackEl.textContent = `${t('python.quiz.incorrect')} ${explanation}`.trim();
        feedbackEl.classList.add('python-quiz-feedback-wrong');
    }
}

function renderLesson() {
    const panel = document.getElementById('python-lesson-panel');
    const lesson = getCurrentLesson();
    if (!panel || !lesson) {
        closeLessonPanel();
        return;
    }

    const mission = getCurrentMission();
    const titleEl = document.getElementById('python-lesson-title');
    const focusEl = document.getElementById('python-lesson-focus');
    const introEl = document.getElementById('python-lesson-intro');
    const objectivesEl = document.getElementById('python-lesson-objectives');
    const syntaxEl = document.getElementById('python-lesson-syntax');
    const syntaxCaptionEl = document.getElementById('python-lesson-syntax-caption');
    const vocabularyEl = document.getElementById('python-lesson-vocabulary');

    if (titleEl) {
        titleEl.textContent = mission?.titleKey ? t(mission.titleKey) : t('python.lesson');
    }

    if (focusEl) {
        focusEl.textContent = mission?.focus ? t(`python.focus.${mission.focus}`) : '';
        focusEl.classList.toggle('hidden', !focusEl.textContent);
    }

    if (introEl) introEl.textContent = lesson.introKey ? t(lesson.introKey) : '';

    if (objectivesEl) {
        objectivesEl.replaceChildren();
        (lesson.objectiveKeys || []).forEach((key) => {
            const item = document.createElement('li');
            item.textContent = t(key);
            objectivesEl.appendChild(item);
        });
    }

    if (syntaxEl) syntaxEl.textContent = lesson.syntaxKey ? t(lesson.syntaxKey) : '';
    if (syntaxCaptionEl) {
        syntaxCaptionEl.textContent = lesson.syntaxCaptionKey ? t(lesson.syntaxCaptionKey) : '';
        syntaxCaptionEl.classList.toggle('hidden', !syntaxCaptionEl.textContent);
    }

    if (vocabularyEl) {
        vocabularyEl.replaceChildren();
        (lesson.vocabularyKeys || []).forEach((key) => {
            const item = document.createElement('li');
            item.textContent = t(key);
            vocabularyEl.appendChild(item);
        });
    }

    renderLessonQuiz(lesson.quiz);
}

function openLesson() {
    const panel = document.getElementById('python-lesson-panel');
    const button = document.getElementById('btn-python-lesson');
    if (!panel || !getCurrentLesson()) return;

    closeReference();
    closeProgressPanel();
    renderLesson();
    panel.classList.remove('hidden');
    lessonOpen = true;
    button?.setAttribute('aria-expanded', 'true');
    document.getElementById('btn-close-python-lesson')?.focus();
}

function updateLessonButton() {
    const button = document.getElementById('btn-python-lesson');
    const hasLesson = Boolean(getCurrentLesson());
    button?.classList.toggle('hidden', !hasLesson);
    if (!hasLesson) closeLessonPanel();
}

function updateProgressBadge() {
    const levels = listLevels().filter((level) => level.pythonMission);
    const progress = getProgress();
    const completed = levels.filter((level) => progress.completed[level.id]).length;
    const countEl = document.getElementById('python-progress-count');
    const button = document.getElementById('btn-python-progress');

    if (countEl) countEl.textContent = `${completed}/${levels.length}`;
    button?.setAttribute(
        'aria-label',
        t('python.progressSummary', { completed, total: levels.length })
    );
    button?.setAttribute('title', t('python.progressTitle'));
}

function renderProgress() {
    const listEl = document.getElementById('python-progress-list');
    const summaryEl = document.getElementById('python-progress-summary');
    if (!listEl || !summaryEl) return;

    const levels = listLevels().filter((level) => level.pythonMission);
    const progress = getProgress();
    const completed = levels.filter((level) => progress.completed[level.id]).length;
    summaryEl.textContent = t('python.progressSummary', {
        completed,
        total: levels.length,
    });
    listEl.replaceChildren();

    levels.forEach((level) => {
        const text = getLevelText(level);
        const entry = progress.completed[level.id];
        const quiz = progress.quiz[level.id];
        const focus = level.pythonMission?.focus
            ? t(`python.focus.${level.pythonMission.focus}`)
            : '';

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'python-progress-item';
        button.classList.toggle('python-progress-done', Boolean(entry));
        button.classList.toggle('python-progress-current', level.id === currentLevelId);
        button.setAttribute('aria-label', t('python.progressAria', { name: text.name }));

        const status = document.createElement('span');
        status.className = 'python-progress-status';
        status.textContent = entry ? '✓' : '○';
        status.setAttribute('aria-hidden', 'true');
        button.appendChild(status);

        const body = document.createElement('span');
        body.className = 'python-progress-body';

        const name = document.createElement('span');
        name.className = 'python-progress-name';
        name.textContent = text.name;
        body.appendChild(name);

        const meta = document.createElement('span');
        meta.className = 'python-progress-meta';
        const parts = [focus];
        if (entry) {
            parts.push(entry.hintsUsed > 0
                ? t('python.progressHints', { count: entry.hintsUsed })
                : t('python.progressHintsNone'));
        } else {
            parts.push(t('python.progressNotStarted'));
        }
        if (quiz) {
            parts.push(quiz.correct
                ? t('python.progressQuizCorrect')
                : t('python.progressQuizWrong'));
        } else if (level.pythonMission?.lesson?.quiz) {
            parts.push(t('python.progressQuizNone'));
        }
        meta.textContent = parts.filter(Boolean).join(' · ');
        body.appendChild(meta);
        button.appendChild(body);

        button.addEventListener('click', () => {
            const select = document.getElementById('level-select');
            if (select && select.value !== level.id) {
                select.value = level.id;
                select.dispatchEvent(new Event('change', { bubbles: true }));
            }
            closeProgressPanel();
        });

        listEl.appendChild(button);
    });
}

function closeProgressPanel({ restoreFocus = false } = {}) {
    const panel = document.getElementById('python-progress-panel');
    const button = document.getElementById('btn-python-progress');
    if (!panel) return;

    panel.classList.add('hidden');
    progressOpen = false;
    button?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) button?.focus();
}

function openProgress() {
    const panel = document.getElementById('python-progress-panel');
    const button = document.getElementById('btn-python-progress');
    if (!panel) return;

    closeReference();
    closeLessonPanel();
    renderProgress();
    panel.classList.remove('hidden');
    progressOpen = true;
    button?.setAttribute('aria-expanded', 'true');
    document.getElementById('btn-close-python-progress')?.focus();
}

function readPreference(key, fallback = false) {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : value === '1';
    } catch {
        return fallback;
    }
}

function writePreference(key, value) {
    try {
        localStorage.setItem(key, value ? '1' : '0');
    } catch {
        // Preference persistence is optional.
    }
}

function updateLabControlLabels() {
    const expandBtn = document.getElementById('btn-expand-python-lab');
    if (expandBtn) {
        const label = t(labExpanded ? 'python.collapse' : 'python.expand');
        expandBtn.setAttribute('aria-pressed', String(labExpanded));
        expandBtn.setAttribute('aria-label', label);
        expandBtn.setAttribute('title', label);
        const icon = expandBtn.querySelector('i');
        if (icon) icon.className = `fa-solid ${labExpanded ? 'fa-compress' : 'fa-maximize'}`;
    }

    const consoleBtn = document.getElementById('btn-toggle-python-console');
    if (consoleBtn) {
        const label = t(consoleCollapsed ? 'python.consoleExpand' : 'python.consoleCollapse');
        consoleBtn.setAttribute('aria-expanded', String(!consoleCollapsed));
        consoleBtn.setAttribute('aria-label', label);
        consoleBtn.setAttribute('title', label);
        const icon = consoleBtn.querySelector('i');
        if (icon) icon.className = `fa-solid ${consoleCollapsed ? 'fa-chevron-up' : 'fa-chevron-down'}`;
    }
}

function applyLabExpanded(expanded, { persist = true } = {}) {
    labExpanded = expanded;
    document.body.classList.toggle('python-lab-expanded', expanded);
    updateLabControlLabels();
    if (persist) writePreference(EXPANDED_KEY, expanded);
}

function applyConsoleCollapsed(collapsed, { persist = true } = {}) {
    consoleCollapsed = collapsed;
    document.getElementById('python-console')?.classList.toggle('python-console-collapsed', collapsed);
    updateLabControlLabels();
    if (persist) writePreference(CONSOLE_COLLAPSED_KEY, collapsed);
}

export function expandPythonConsole() {
    if (consoleCollapsed) applyConsoleCollapsed(false);
}

export function refreshPythonLab() {
    if (referenceOpen) renderReference();
    if (lessonOpen) renderLesson();
    if (progressOpen) renderProgress();
    updateLessonButton();
    updateProgressBadge();
    renderSaveState();
    updateLabControlLabels();
}

export function setPythonMission(view) {
    const panel = document.getElementById('python-mission');
    if (!panel) return;

    const hintsBtn = document.getElementById('btn-python-mission-hints');
    const hintsAllBtn = document.getElementById('btn-python-mission-hints-all');

    if (!view?.visible) {
        panel.classList.add('hidden');
        panel.classList.remove('python-mission-complete', 'python-mission-failed');

        ['python-mission-title', 'python-mission-focus', 'python-mission-objective',
            'python-mission-progress', 'python-mission-status'].forEach((id) => {
            const element = document.getElementById(id);
            if (element) element.textContent = '';
        });

        const focusElement = document.getElementById('python-mission-focus');
        const statusElement = document.getElementById('python-mission-status');
        const hintsElement = document.getElementById('python-mission-hints');
        focusElement?.classList.add('hidden');
        statusElement?.classList.add('hidden');
        hintsElement?.replaceChildren();
        hintsElement?.classList.add('hidden');
        hintsBtn?.classList.add('hidden');
        hintsAllBtn?.classList.add('hidden');
        updateLessonButton();
        return;
    }

    const titleEl = document.getElementById('python-mission-title');
    const focusEl = document.getElementById('python-mission-focus');
    const objectiveEl = document.getElementById('python-mission-objective');
    const progressEl = document.getElementById('python-mission-progress');
    const statusEl = document.getElementById('python-mission-status');
    const hintsEl = document.getElementById('python-mission-hints');
    const hintsTotal = Number(view.hintsTotal) || view.hints?.length || 0;
    const hintsRevealed = Math.max(0, Math.min(Number(view.hintsRevealed) || 0, hintsTotal));
    const hintsDone = hintsRevealed >= hintsTotal;

    panel.classList.remove('hidden');
    panel.classList.toggle('python-mission-complete', view.complete);
    panel.classList.toggle('python-mission-failed', view.failed);

    if (titleEl) titleEl.textContent = view.title;
    if (focusEl) {
        focusEl.textContent = view.focusLabel || '';
        focusEl.classList.toggle('hidden', !view.focusLabel);
    }
    if (objectiveEl) objectiveEl.textContent = view.objective;
    if (progressEl) {
        progressEl.textContent = t('python.missionProgress', {
            passed: view.gatesPassed,
            total: view.gatesTotal,
            landed: view.landed ? t('python.missionLanded') : t('python.missionNotLanded'),
        });
    }

    if (statusEl) {
        if (view.complete) {
            statusEl.textContent = t('python.missionCompleteDetail');
            statusEl.classList.remove('hidden');
        } else if (view.failed) {
            statusEl.textContent = t('python.missionFailed');
            statusEl.classList.remove('hidden');
        } else {
            statusEl.textContent = '';
            statusEl.classList.add('hidden');
        }
    }

    if (hintsEl) {
        hintsEl.replaceChildren();
        (view.hints || []).slice(0, hintsRevealed).forEach((hint) => {
            const item = document.createElement('li');
            item.textContent = hint;
            hintsEl.appendChild(item);
        });
        hintsEl.classList.toggle('hidden', hintsRevealed === 0);
    }

    if (hintsBtn) {
        const label = hintsBtn.querySelector('span');
        let buttonText = t('python.missionHints');
        if (hintsTotal > 0) {
            if (hintsDone) {
                buttonText = t('python.hintsDone');
            } else if (hintsRevealed === 0) {
                buttonText = t('python.hintsShow');
            } else {
                buttonText = t('python.hintsNext', {
                    current: hintsRevealed + 1,
                    total: hintsTotal,
                });
            }
        }

        if (label) label.textContent = buttonText;
        hintsBtn.classList.toggle('hidden', hintsTotal === 0);
        hintsBtn.classList.toggle('opacity-50', hintsDone);
        hintsBtn.classList.toggle('cursor-not-allowed', hintsDone);
        hintsBtn.disabled = hintsDone || hintsTotal === 0;
        hintsBtn.setAttribute('aria-expanded', String(hintsRevealed > 0));
    }

    if (hintsAllBtn) {
        hintsAllBtn.classList.toggle('hidden', hintsRevealed === 0 || hintsDone);
    }

    updateLessonButton();
}

export function focusPythonEditor() {
    view?.focus();
}

export async function ensurePythonLab() {
    if (view) return view;
    if (mountPromise) return mountPromise;

    mountPromise = (async () => {
        const [
            codeMirror,
            stateModule,
            viewModule,
            pythonModule,
            commandsModule,
            autocompleteModule,
            lintModule,
            oneDarkModule,
        ] = await Promise.all([
            import('codemirror'),
            import('@codemirror/state'),
            import('@codemirror/view'),
            import('@codemirror/lang-python'),
            import('@codemirror/commands'),
            import('@codemirror/autocomplete'),
            import('@codemirror/lint'),
            import('@codemirror/theme-one-dark'),
        ]);

        const container = document.getElementById('python-editor');
        if (!container) throw new Error('Python editor container not found.');

        const { EditorState, Prec } = stateModule;
        const { EditorView, keymap } = viewModule;
        const { python } = pythonModule;
        const { indentWithTab } = commandsModule;
        const { autocompletion } = autocompleteModule;
        const { lintGutter, setDiagnostics } = lintModule;
        const { oneDark } = oneDarkModule;

        cmModules = { EditorView, setDiagnostics };
        const saved = currentLevelId ? readSavedCode(currentLevelId) : null;
        const missionExample = currentLevelId
            ? (getLevel(currentLevelId)?.pythonMission?.example || 'square')
            : null;
        const missionCode = missionExample ? PYTHON_PRESETS[missionExample] : null;
        const defaultCode = missionCode || pendingCode;
        const initialCode = saved !== null ? saved : defaultCode;
        pendingCode = initialCode;
        if (saved !== null) {
            setPresetSelection('custom');
        } else if (missionExample) {
            setPresetSelection(missionExample);
        }
        setSaveState(saved !== null ? 'saved' : 'local');

        view = new EditorView({
            parent: container,
            state: EditorState.create({
                doc: initialCode,
                extensions: [
                    codeMirror.basicSetup,
                    python(),
                    oneDark,
                    lintGutter(),
                    autocompletion({
                        override: [telloCompletionSource],
                        activateOnTyping: true,
                    }),
                    Prec.highest(keymap.of([
                        {
                            key: 'Mod-Enter',
                            run: () => {
                                handlers.onRun?.();
                                return true;
                            },
                        },
                        {
                            key: 'Mod-s',
                            run: () => {
                                saveCurrentCode();
                                return true;
                            },
                        },
                    ])),
                    keymap.of([indentWithTab]),
                    EditorView.lineWrapping,
                    EditorView.updateListener.of((update) => {
                        if (update.docChanged && !suppressSave) {
                            setPresetSelection('custom');
                            scheduleSave();
                            scheduleDiagnosticClear();
                        }
                    }),
                    EditorView.theme({
                        '&': {
                            height: '100%',
                            backgroundColor: '#0b1220',
                        },
                        '.cm-content': {
                            padding: '8px 0',
                        },
                        '.cm-gutters': {
                            backgroundColor: '#0b1220',
                            border: 'none',
                        },
                        '.cm-activeLineGutter': {
                            backgroundColor: 'rgba(56, 189, 248, 0.08)',
                        },
                    }),
                ],
            }),
        });

        if (pendingDiagnostic) {
            const diagnostic = pendingDiagnostic;
            pendingDiagnostic = null;
            setPythonDiagnostic(diagnostic.line, diagnostic.message);
        }

        return view;
    })().catch((error) => {
        mountPromise = null;
        throw error;
    });

    return mountPromise;
}

export function hidePythonFlightView() {
    document.body.classList.remove('python-lab-watching');
}

export function closePythonPanels() {
    closeReference();
    closeLessonPanel();
    closeProgressPanel();
}

export function showPythonFlightView() {
    if (document.body.classList.contains('python-lab-open')) {
        document.body.classList.add('python-lab-watching');
    }
}

export function initPythonLab(nextHandlers = {}) {
    handlers = { ...handlers, ...nextHandlers };

    if (labInitialized) {
        ensurePythonLab().catch(() => {});
        return;
    }
    labInitialized = true;

    labExpanded = readPreference(EXPANDED_KEY, false);
    consoleCollapsed = readPreference(CONSOLE_COLLAPSED_KEY, false);
    applyLabExpanded(labExpanded, { persist: false });
    applyConsoleCollapsed(consoleCollapsed, { persist: false });
    renderSaveState();

    document.getElementById('btn-watch-back')?.addEventListener('click', hidePythonFlightView);
    document.getElementById('btn-watch-stop')?.addEventListener('click', () => {
        hidePythonFlightView();
        handlers.onStop?.();
    });

    document.getElementById('btn-expand-python-lab')?.addEventListener('click', () => {
        applyLabExpanded(!labExpanded);
    });

    document.getElementById('btn-toggle-python-console')?.addEventListener('click', () => {
        applyConsoleCollapsed(!consoleCollapsed);
    });

    document.getElementById('btn-python-reference')?.addEventListener('click', openReference);
    document.getElementById('btn-close-python-reference')?.addEventListener('click', closeReference);
    document.getElementById('btn-python-lesson')?.addEventListener('click', openLesson);
    document.getElementById('btn-close-python-lesson')?.addEventListener('click', () => closeLessonPanel({ restoreFocus: true }));
    document.getElementById('btn-python-progress')?.addEventListener('click', openProgress);
    document.getElementById('btn-close-python-progress')?.addEventListener('click', () => closeProgressPanel({ restoreFocus: true }));

    document.getElementById('btn-python-mission-hints')?.addEventListener('click', revealNextMissionHint);
    document.getElementById('btn-python-mission-hints-all')?.addEventListener('click', revealAllMissionHints);

    document.getElementById('btn-reset-python-progress')?.addEventListener('click', () => {
        if (!window.confirm(t('python.progressResetConfirm'))) return;
        resetProgress();
        renderProgress();
        updateProgressBadge();
        showToast('python.progressResetDone', 'success');
    });

    subscribeProgress(() => {
        updateProgressBadge();
        if (progressOpen) renderProgress();
    });

    updateLessonButton();
    updateProgressBadge();

    document.getElementById('btn-python-download')?.addEventListener('click', () => {
        const blob = new Blob([getPythonCode()], { type: 'text/x-python' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'aero-sim.py';
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 500);
    });

    const fileInput = document.getElementById('python-file-input');
    document.getElementById('btn-python-upload')?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', async () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            setPythonCode(text);
            setPresetSelection('custom');
            clearPythonDiagnostic();
            focusPythonEditor();
        } catch {
            showToast('toast.pythonFileError', 'warning');
        } finally {
            fileInput.value = '';
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        if (referenceOpen) closeReference();
        if (lessonOpen) closeLessonPanel({ restoreFocus: true });
        if (progressOpen) closeProgressPanel({ restoreFocus: true });
    });

    ensurePythonLab()
        .then(() => {
            // The panel may have been hidden while CodeMirror mounted.
            requestAnimationFrame(() => view?.requestMeasure());
        })
        .catch(() => {
            showToast('toast.pythonEditorError', 'warning');
        });
}
