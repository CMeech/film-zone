import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CALIBRATION } from './calibration.js';
import { contactPoint, createTrajectory, releasePoint } from './trajectory.js';

const CAMERA_VIEWS = {
    end: { position: [4.5, 5.4, 12.5], target: [4.5, 1.5, 0.8] },
    left: { position: [-4.5, 5.2, 5.5], target: [4.2, 1.6, 0.5] },
    middle: { position: [4.5, 5.8, 8.5], target: [4.5, 1.5, 0.4] },
    right: { position: [13.5, 5.2, 5.5], target: [4.8, 1.6, 0.5] },
    opposition: { position: [4.5, 5.8, -12.5], target: [4.5, 1.5, 0.5] },
};

function material(color, options = {}) {
    return new THREE.MeshStandardMaterial({ color, roughness: 0.72, ...options });
}

export class SetExplorerScene {
    constructor(container, state) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111827);
        this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.domElement.style.display = 'block';
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
        container.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.minDistance = 3;
        this.controls.maxDistance = 24;
        this.controls.maxPolarAngle = Math.PI / 2.03;
        this.controls.addEventListener('change', () => this.requestRender());

        this.scene.add(new THREE.HemisphereLight(0xffffff, 0x334155, 2.1));
        const key = new THREE.DirectionalLight(0xffffff, 2.4);
        key.position.set(3, 10, 7);
        this.scene.add(key);

        this.createCourt();
        this.createSetter();
        this.createTarget();
        this.createBall();
        this.setState(state);
        this.setCamera(state.cameraView);

        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(container);
        this.resize();
    }

    createCourt() {
        const court = new THREE.Mesh(
            new THREE.PlaneGeometry(CALIBRATION.court.width, CALIBRATION.court.depth),
            material(0xd97706),
        );
        court.rotation.x = -Math.PI / 2;
        court.position.set(4.5, 0, 4.5);
        this.scene.add(court);

        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        const points = [
            new THREE.Vector3(0, 0.012, 0), new THREE.Vector3(9, 0.012, 0),
            new THREE.Vector3(9, 0.012, 9), new THREE.Vector3(0, 0.012, 9),
            new THREE.Vector3(0, 0.012, 0),
        ];
        this.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), lineMaterial));
        this.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0.014, 3), new THREE.Vector3(9, 0.014, 3),
        ]), lineMaterial));

        const postMaterial = material(0xf8fafc);
        for (const x of [-0.18, 9.18]) {
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, CALIBRATION.net.postHeight, 12), postMaterial);
            post.position.set(x, CALIBRATION.net.postHeight / 2, 0);
            this.scene.add(post);
        }
        const net = new THREE.Mesh(
            new THREE.PlaneGeometry(9, CALIBRATION.net.height),
            new THREE.MeshBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.28, side: THREE.DoubleSide, wireframe: true }),
        );
        net.position.set(4.5, CALIBRATION.net.height / 2, 0);
        this.scene.add(net);
        const tape = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.055, 0.055), postMaterial);
        tape.position.set(4.5, CALIBRATION.net.height, 0);
        this.scene.add(tape);
    }

    createSetter() {
        this.setter = new THREE.Group();
        this.setterBody = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.32, 1, 16), material(0x2563eb));
        this.setterHead = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 14), material(0xd6a47a));
        this.setter.add(this.setterBody, this.setterHead);
        this.setterRing = new THREE.Mesh(
            new THREE.RingGeometry(0.34, 0.47, 32),
            new THREE.MeshBasicMaterial({ color: 0x60a5fa, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }),
        );
        this.setterRing.rotation.x = -Math.PI / 2;
        this.setterRing.position.y = 0.025;
        this.setter.add(this.setterRing);
        this.scene.add(this.setter);
    }

    createTarget() {
        this.target = new THREE.Mesh(
            new THREE.SphereGeometry(0.18, 20, 14),
            new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.9 }),
        );
        this.target.userData.kind = 'target';
        this.scene.add(this.target);
    }

    createBall() {
        this.ball = new THREE.Mesh(new THREE.SphereGeometry(CALIBRATION.ballRadius, 24, 16), material(0xffffff));
        this.scene.add(this.ball);
        this.path = new THREE.Line(
            new THREE.BufferGeometry(),
            new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.9 }),
        );
        this.scene.add(this.path);
    }

    setState(state) {
        this.state = state;
        const height = state.setter.height;
        this.setter.position.set(state.setter.x, 0, state.setter.z);
        this.setterBody.scale.y = Math.max(0.9, height - 0.42);
        this.setterBody.position.y = (height - 0.42) / 2;
        this.setterHead.position.y = height - 0.14;
        const direction = new THREE.Vector3(state.target.x - state.setter.x, 0, state.target.z - state.setter.z);
        if (direction.lengthSq() > 0.001) this.setter.rotation.y = Math.atan2(direction.x, direction.z);
        this.target.position.copy(contactPoint(state));
        this.curve = createTrajectory(state);
        this.path.geometry.dispose();
        this.path.geometry = new THREE.BufferGeometry().setFromPoints(this.curve.getPoints(72));
        this.ball.position.copy(releasePoint(state));
        this.requestRender();
    }

    setBallProgress(progress) {
        this.ball.position.copy(this.curve.getPointAt(progress));
        this.requestRender();
    }

    setSelection(kind) {
        this.setterRing.material.color.set(kind === 'setter' ? 0x22c55e : 0x60a5fa);
        this.target.material.color.set(kind === 'target' ? 0x22c55e : 0xfacc15);
        this.requestRender();
    }

    setCamera(view) {
        const pose = CAMERA_VIEWS[view] || CAMERA_VIEWS.middle;
        this.camera.position.fromArray(pose.position);
        this.controls.target.fromArray(pose.target);
        this.controls.update();
        this.requestRender();
    }

    resize() {
        // Measure the sized card rather than the absolutely-positioned canvas
        // host. Some flex layouts otherwise let WebGL's drawing-buffer width
        // feed back into the host's intrinsic size on every resize.
        const bounds = this.container.parentElement.getBoundingClientRect();
        const width = Math.max(Math.round(bounds.width), 1);
        const height = Math.max(Math.round(bounds.height), 1);
        this.renderer.setSize(width, height, false);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.requestRender();
    }

    requestRender() {
        if (this.renderRequested) return;
        this.renderRequested = requestAnimationFrame(() => {
            this.renderRequested = null;
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        });
    }

    dispose() {
        if (this.renderRequested) cancelAnimationFrame(this.renderRequested);
        this.resizeObserver.disconnect();
        this.controls.dispose();
        this.renderer.dispose();
    }
}
