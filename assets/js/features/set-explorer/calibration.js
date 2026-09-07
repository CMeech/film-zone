export const CALIBRATION = Object.freeze({
    court: { width: 9, depth: 9, attackLine: 3 },
    net: { height: 2.432, postHeight: 2.7 },
    ballRadius: 0.105,
    contactAboveNet: 0.533,
    releaseAboveHead: 0.2032,
    defaultSetter: { x: 5.5, z: 0.61, height: 1.778 },
    setterBounds: { minX: 0.3, maxX: 8.7, minZ: 0.25, maxZ: 8.5 },
    targetBounds: { minX: 0.3, maxX: 8.7, minZ: 0.05, maxZ: 2.5 },
    setterHeight: { min: 1.575, max: 1.93 },
    position6Offset: 0.762,
    targetNetOffset: 0.35,
    angles: { 1: 45, 2: 52, 3: 60 },
    duration: { min: 0.45, max: 1.5 },
    customTolerance: 0.18,
});

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function positionX(position) {
    return (position - 0.5) * (CALIBRATION.court.width / 9);
}

export function snappedTarget(position, setter) {
    if (position === 6) {
        return {
            mode: 'position6',
            position,
            x: clamp(setter.x + CALIBRATION.position6Offset, CALIBRATION.targetBounds.minX, CALIBRATION.targetBounds.maxX),
            z: CALIBRATION.targetNetOffset,
        };
    }
    return {
        mode: 'standard',
        position,
        x: positionX(position),
        z: CALIBRATION.targetNetOffset,
    };
}

export function defaultState() {
    const setter = { ...CALIBRATION.defaultSetter };
    return {
        setter,
        target: snappedTarget(5, setter),
        height: 1,
        force: 50,
        cameraView: 'middle',
    };
}

export function durationForForce(force) {
    const normalized = clamp(force, 0, 100) / 100;
    return CALIBRATION.duration.max - normalized * (CALIBRATION.duration.max - CALIBRATION.duration.min);
}
