import * as THREE from 'three';
import { CALIBRATION, clamp } from './calibration.js';

export function releasePoint(state) {
    return new THREE.Vector3(
        state.setter.x,
        state.setter.height + CALIBRATION.releaseAboveHead,
        state.setter.z,
    );
}

export function contactPoint(state) {
    return new THREE.Vector3(
        state.target.x,
        CALIBRATION.net.height + CALIBRATION.contactAboveNet,
        state.target.z,
    );
}

export function createTrajectory(state) {
    const start = releasePoint(state);
    const end = contactPoint(state);
    const horizontal = new THREE.Vector3(end.x - start.x, 0, end.z - start.z);
    const distance = Math.max(horizontal.length(), 0.15);
    horizontal.normalize();

    const handle = clamp(distance * 0.34, 0.35, 2.4);
    const radians = THREE.MathUtils.degToRad(CALIBRATION.angles[state.height]);
    const p1 = start.clone()
        .addScaledVector(horizontal, handle)
        .add(new THREE.Vector3(0, Math.tan(radians) * handle, 0));
    const arrivalHandle = clamp(distance * 0.2, 0.25, 1.25);
    const p2 = end.clone()
        .addScaledVector(horizontal, -arrivalHandle)
        .add(new THREE.Vector3(0, clamp(distance * 0.08, 0.18, 0.55), 0));

    return new THREE.CubicBezierCurve3(start, p1, p2, end);
}
