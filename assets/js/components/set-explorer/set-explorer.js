import { CALIBRATION, defaultState, durationForForce, snappedTarget } from '../../features/set-explorer/calibration.js';
import { attachInteraction } from '../../features/set-explorer/interaction.js';
import { SetExplorerScene } from '../../features/set-explorer/scene.js';
import { clearQuery, parseUrlState, shareUrl } from '../../features/set-explorer/url-state.js';

const app = document.getElementById('set-explorer-app');

if (app) {
    const sceneRoot = document.getElementById('set-explorer-scene');
    const fallback = document.getElementById('set-explorer-fallback');
    const parsed = parseUrlState(window.location.search);
    let state = parsed.state;
    let sharedPristine = parsed.shared;
    let animation = { status: 'ready', progress: 0, elapsed: 0, startedAt: null, frame: null };
    let sceneView;
    let detachInteraction;

    const label = document.getElementById('set-explorer-label');
    const status = document.getElementById('set-explorer-status');
    const play = document.getElementById('set-explorer-play');
    const force = document.getElementById('set-explorer-force');
    const forceValue = document.getElementById('set-explorer-force-value');
    const setterHeight = document.getElementById('set-explorer-setter-height');
    const setterHeightValue = document.getElementById('set-explorer-setter-height-value');

    function heightLabel(metres) {
        const inches = Math.round(metres / 0.0254);
        return `${Math.floor(inches / 12)}′${inches % 12}″`;
    }

    function currentLabel() {
        if (state.target.mode === 'custom') return `Custom · Height ${state.height}`;
        return `Set ${state.target.position}${state.height}`;
    }

    function syncUi() {
        label.textContent = currentLabel();
        force.value = String(state.force);
        forceValue.textContent = `${Math.round(state.force)}%`;
        setterHeight.value = String(Math.round(state.setter.height / 0.0254));
        setterHeightValue.textContent = heightLabel(state.setter.height);
        play.textContent = animation.status === 'playing' ? 'Pause' : animation.status === 'paused' ? 'Resume' : 'Play';
        status.textContent = animation.status === 'paused' ? 'Paused' : animation.status === 'playing' ? 'Playing' : 'Ready';
        document.querySelectorAll('[data-position]').forEach((button) => {
            button.classList.toggle('btn-primary', state.target.mode !== 'custom' && Number(button.dataset.position) === state.target.position);
        });
        document.querySelectorAll('[data-height]').forEach((button) => {
            button.classList.toggle('btn-primary', Number(button.dataset.height) === state.height);
        });
        document.querySelectorAll('[data-view]').forEach((button) => {
            button.classList.toggle('btn-secondary', button.dataset.view === state.cameraView);
        });
    }

    function cancelAnimation() {
        if (animation.frame) cancelAnimationFrame(animation.frame);
        animation = { status: 'ready', progress: 0, elapsed: 0, startedAt: null, frame: null };
    }

    function markEdited() {
        if (!sharedPristine) return;
        clearQuery();
        sharedPristine = false;
    }

    function commit({ clearShared = true } = {}) {
        cancelAnimation();
        sceneView.setState(state);
        if (clearShared) markEdited();
        syncUi();
    }

    function tick(timestamp) {
        if (animation.status !== 'playing') return;
        if (animation.startedAt === null) animation.startedAt = timestamp;
        const durationMs = durationForForce(state.force) * 1000;
        const elapsed = animation.elapsed + timestamp - animation.startedAt;
        animation.progress = Math.min(elapsed / durationMs, 1);
        sceneView.setBallProgress(animation.progress);
        if (animation.progress >= 1) {
            animation.status = 'complete';
            animation.frame = null;
            syncUi();
            return;
        }
        animation.frame = requestAnimationFrame(tick);
    }

    function togglePlayback() {
        if (animation.status === 'playing') {
            const now = performance.now();
            animation.elapsed += now - animation.startedAt;
            animation.startedAt = null;
            animation.status = 'paused';
            if (animation.frame) cancelAnimationFrame(animation.frame);
            animation.frame = null;
        } else {
            if (animation.status === 'complete' || animation.status === 'ready') {
                animation.progress = 0;
                animation.elapsed = 0;
                sceneView.setBallProgress(0);
            }
            animation.status = 'playing';
            animation.startedAt = null;
            animation.frame = requestAnimationFrame(tick);
        }
        syncUi();
    }

    try {
        sceneView = new SetExplorerScene(sceneRoot, state);
        detachInteraction = attachInteraction(sceneView, () => state, commit);

        document.querySelectorAll('[data-position]').forEach((button) => button.addEventListener('click', () => {
            state.target = snappedTarget(Number(button.dataset.position), state.setter);
            commit();
        }));
        document.querySelectorAll('[data-height]').forEach((button) => button.addEventListener('click', () => {
            state.height = Number(button.dataset.height);
            commit();
        }));
        document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => {
            state.cameraView = button.dataset.view;
            sceneView.setCamera(state.cameraView);
            markEdited();
            syncUi();
        }));
        force.addEventListener('input', () => {
            state.force = Number(force.value);
            commit();
        });
        setterHeight.addEventListener('input', () => {
            state.setter.height = Number(setterHeight.value) * 0.0254;
            commit();
        });
        play.addEventListener('click', togglePlayback);
        document.getElementById('set-explorer-reset').addEventListener('click', () => {
            state = defaultState();
            sceneView.setCamera(state.cameraView);
            commit();
        });
        document.getElementById('set-explorer-camera-reset').addEventListener('click', () => sceneView.setCamera(state.cameraView));
        document.getElementById('set-explorer-share').addEventListener('click', async (event) => {
            const link = shareUrl(state);
            try {
                await navigator.clipboard.writeText(link);
                event.currentTarget.textContent = 'Copied';
            } catch (_) {
                window.prompt('Copy this link', link);
            }
            setTimeout(() => { event.currentTarget.textContent = 'Copy share link'; }, 1400);
        });
        document.getElementById('set-explorer-fullscreen').addEventListener('click', async () => {
            if (app.requestFullscreen) await app.requestFullscreen();
        });
        const controls = document.getElementById('set-explorer-controls');
        const controlsToggle = document.getElementById('set-explorer-controls-toggle');
        controlsToggle.addEventListener('click', () => {
            const isHidden = controls.classList.toggle('hidden');
            controlsToggle.textContent = isHidden ? 'Show controls' : 'Hide controls';
            requestAnimationFrame(() => sceneView.resize());
        });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && animation.status === 'playing') togglePlayback();
        });
        syncUi();
    } catch (error) {
        console.error('Set Explorer failed to initialize', error);
        fallback.classList.remove('hidden');
        fallback.classList.add('grid');
    }

    window.addEventListener('pagehide', () => {
        if (detachInteraction) detachInteraction();
        if (sceneView) sceneView.dispose();
    }, { once: true });
}
