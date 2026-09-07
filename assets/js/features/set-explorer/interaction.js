import * as THREE from 'three';
import { CALIBRATION, clamp, snappedTarget } from './calibration.js';

export function attachInteraction(sceneView, getState, commit) {
    const canvas = sceneView.renderer.domElement;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const point = new THREE.Vector3();
    let active = null;

    function cast(event) {
        const rect = canvas.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, sceneView.camera);
    }

    function stopDrag() {
        if (!active) return;
        active = null;
        sceneView.controls.enabled = true;
    }

    function onPointerDown(event) {
        if (active && event.pointerId !== active.pointerId) {
            stopDrag();
            return;
        }
        cast(event);
        const targetHit = raycaster.intersectObject(sceneView.target, false).length > 0;
        const setterHit = raycaster.intersectObject(sceneView.setterRing, false).length > 0;
        const kind = targetHit ? 'target' : setterHit ? 'setter' : null;
        sceneView.setSelection(kind);
        if (!kind) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        active = { kind, pointerId: event.pointerId };
        sceneView.controls.enabled = false;
        canvas.setPointerCapture(event.pointerId);
    }

    function onPointerMove(event) {
        if (!active || active.pointerId !== event.pointerId) return;
        cast(event);
        if (!raycaster.ray.intersectPlane(plane, point)) return;
        const state = getState();
        if (active.kind === 'setter') {
            state.setter.x = clamp(point.x, CALIBRATION.setterBounds.minX, CALIBRATION.setterBounds.maxX);
            state.setter.z = clamp(point.z, CALIBRATION.setterBounds.minZ, CALIBRATION.setterBounds.maxZ);
            if (state.target.mode === 'position6') state.target = snappedTarget(6, state.setter);
        } else {
            state.target = {
                mode: 'custom', position: null,
                x: clamp(point.x, CALIBRATION.targetBounds.minX, CALIBRATION.targetBounds.maxX),
                z: clamp(point.z, CALIBRATION.targetBounds.minZ, CALIBRATION.targetBounds.maxZ),
            };
        }
        commit({ clearShared: false });
    }

    function onPointerUp(event) {
        if (!active || active.pointerId !== event.pointerId) return;
        try { canvas.releasePointerCapture(event.pointerId); } catch (_) { /* already released */ }
        stopDrag();
        commit({ clearShared: true });
    }

    canvas.addEventListener('pointerdown', onPointerDown, true);
    canvas.addEventListener('pointermove', onPointerMove, true);
    canvas.addEventListener('pointerup', onPointerUp, true);
    canvas.addEventListener('pointercancel', onPointerUp, true);
    window.addEventListener('blur', stopDrag);

    return () => {
        canvas.removeEventListener('pointerdown', onPointerDown, true);
        canvas.removeEventListener('pointermove', onPointerMove, true);
        canvas.removeEventListener('pointerup', onPointerUp, true);
        canvas.removeEventListener('pointercancel', onPointerUp, true);
        window.removeEventListener('blur', stopDrag);
    };
}
