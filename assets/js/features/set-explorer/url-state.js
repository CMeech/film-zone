import { CALIBRATION, clamp, defaultState, snappedTarget } from './calibration.js';

const POSITIONS = new Set([1, 3, 5, 6, 7, 9]);
const VIEWS = new Set(['end', 'left', 'middle', 'right', 'opposition']);
const finite = (value) => Number.isFinite(Number(value)) ? Number(value) : null;

export function parseUrlState(search) {
    const state = defaultState();
    const params = new URLSearchParams(search);
    if (![...params.keys()].length) return { state, shared: false };

    const sx = finite(params.get('sx'));
    const sz = finite(params.get('sz'));
    const sh = finite(params.get('sh'));
    if (sx !== null) state.setter.x = clamp(sx, CALIBRATION.setterBounds.minX, CALIBRATION.setterBounds.maxX);
    if (sz !== null) state.setter.z = clamp(sz, CALIBRATION.setterBounds.minZ, CALIBRATION.setterBounds.maxZ);
    if (sh !== null) state.setter.height = clamp(sh, CALIBRATION.setterHeight.min, CALIBRATION.setterHeight.max);

    const positionValue = params.get('p');
    const position = Number(positionValue);
    if (POSITIONS.has(position)) state.target = snappedTarget(position, state.setter);
    if (positionValue === 'c') {
        const tx = finite(params.get('tx'));
        const tz = finite(params.get('tz'));
        if (tx !== null && tz !== null) {
            state.target = {
                mode: 'custom', position: null,
                x: clamp(tx, CALIBRATION.targetBounds.minX, CALIBRATION.targetBounds.maxX),
                z: clamp(tz, CALIBRATION.targetBounds.minZ, CALIBRATION.targetBounds.maxZ),
            };
        }
    }

    const height = Number(params.get('h'));
    if ([1, 2, 3].includes(height)) state.height = height;
    const force = finite(params.get('f'));
    if (force !== null) state.force = Math.round(clamp(force, 0, 100));
    const view = params.get('v');
    if (VIEWS.has(view)) state.cameraView = view;
    return { state, shared: true };
}

export function shareUrl(state) {
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('p', state.target.mode === 'custom' ? 'c' : String(state.target.position));
    url.searchParams.set('h', String(state.height));
    url.searchParams.set('f', String(Math.round(state.force)));
    url.searchParams.set('sx', state.setter.x.toFixed(3));
    url.searchParams.set('sz', state.setter.z.toFixed(3));
    url.searchParams.set('sh', state.setter.height.toFixed(3));
    if (state.target.mode === 'custom') {
        url.searchParams.set('tx', state.target.x.toFixed(3));
        url.searchParams.set('tz', state.target.z.toFixed(3));
    }
    url.searchParams.set('v', state.cameraView);
    return url.toString();
}

export function clearQuery() {
    if (window.location.search) window.history.replaceState({}, '', window.location.pathname);
}
