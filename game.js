import * as THREE from 'three';

// --- 1. ENGINE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const ambient = new THREE.AmbientLight(0xffffff, 0.5);
const point = new THREE.PointLight(0xffffff, 20);
point.position.set(2, 5, 2);
scene.add(ambient, point);

// --- 2. CAFE LAYOUT ---
const floor = new THREE.Mesh(new THREE.PlaneGeometry(15, 15), new THREE.MeshStandardMaterial({ color: 0x3e2723 }));
floor.rotation.x = -Math.PI / 2; floor.position.y = -1;
scene.add(floor);

const wallMat = new THREE.MeshStandardMaterial({ color: 0xf5f5dc });
const backWall = new THREE.Mesh(new THREE.BoxGeometry(15, 5, 0.5), wallMat);
backWall.position.set(0, 1.5, -7.5);
scene.add(backWall);

const counterMat = new THREE.MeshStandardMaterial({ color: 0x221105 });
const mainCounter = new THREE.Mesh(new THREE.BoxGeometry(6, 1.2, 1.5), counterMat);
mainCounter.position.set(-2, -0.4, -4);
scene.add(mainCounter);

// --- 3. THE DRINK ---
const cupPos = new THREE.Vector3(-1, 0.35, -4);
const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.1, 0.3, 32), new THREE.MeshStandardMaterial({ color: 0xffffff }));
cup.position.copy(cupPos);
scene.add(cup);

const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.28, 32), new THREE.MeshStandardMaterial({ color: 0x3c2005 }));
liquid.position.copy(cupPos);
liquid.scale.y = 0.01;
liquid.visible = false;
scene.add(liquid);

// --- 4. MOVEMENT & INTERACTION ---
const keys = {};
const speed = 0.08;
let yaw = 0, pitch = 0;
let isBrewing = false;

window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    // Check for Spacebar interaction
    if (e.code === 'Space' && !isBrewing) {
        const dist = camera.position.distanceTo(cup.position);
        if (dist < 2.5) startBrewing();
    }
});
window.addEventListener('keyup', (e) => keys[e.code] = false);

renderer.domElement.addEventListener('click', () => renderer.domElement.requestPointerLock());

window.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === renderer.domElement) {
        yaw -= e.movementX * 0.002;
        pitch -= e.movementY * 0.002;
        pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch));
        camera.rotation.set(pitch, yaw, 0, 'YXZ');
    }
});

function startBrewing() {
    isBrewing = true;
    liquid.visible = true;
    liquid.scale.y = 0.01;
    const interval = setInterval(() => {
        if (liquid.scale.y < 1) {
            liquid.scale.y += 0.02;
        } else {
            clearInterval(interval);
            isBrewing = false;
        }
    }, 30);
}

camera.position.set(0, 1, 4);

// --- 5. CORE UPDATE LOOP ---
const promptUI = document.getElementById('interaction-prompt');

function update() {
    if (document.pointerLockElement === renderer.domElement) {
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        forward.y = 0; right.y = 0;
        forward.normalize(); right.normalize();

        if (keys['KeyW']) camera.position.addScaledVector(forward, speed);
        if (keys['KeyS']) camera.position.addScaledVector(forward, -speed);
        if (keys['KeyA']) camera.position.addScaledVector(right, -speed);
        if (keys['KeyD']) camera.position.addScaledVector(right, speed);

        // UI Interaction Check
        const dist = camera.position.distanceTo(cup.position);
        promptUI.style.display = (dist < 2.5 && !isBrewing) ? 'block' : 'none';
    }
}

function animate() {
    requestAnimationFrame(animate);
    update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
