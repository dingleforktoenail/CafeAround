import * as THREE from 'three';

// --- 1. ENGINE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const ambient = new THREE.AmbientLight(0xffffff, 0.6);
const point = new THREE.PointLight(0xffffff, 15);
point.position.set(0, 4, 0);
scene.add(ambient, point);

// --- 2. PHYSICS DATA ---
const obstacles = [];
const playerRadius = 0.6; 
let yVelocity = 0;
const gravity = -0.01;
const jumpStrength = 0.2;
let isGrounded = true;

function createPhysicsBox(w, h, d, x, y, z, color) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: color }));
    mesh.position.set(x, y, z);
    scene.add(mesh);
    const box = new THREE.Box3().setFromObject(mesh);
    obstacles.push(box);
    return mesh;
}

// Floor & Walls
const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial({ color: 0x3e2723 }));
floor.rotation.x = -Math.PI / 2; floor.position.y = -1;
scene.add(floor);

const wallColor = 0xf5f5dc;
createPhysicsBox(20, 5, 0.5, 0, 1.5, -10, wallColor); // Back
createPhysicsBox(20, 5, 0.5, 0, 1.5, 10, wallColor);  // Front
createPhysicsBox(0.5, 5, 20, -10, 1.5, 0, wallColor); // Left
createPhysicsBox(0.5, 5, 20, 10, 1.5, 0, wallColor);  // Right

// Table with Collision
createPhysicsBox(2, 0.1, 2, 3, -0.4, 3, 0x5d4037);

// --- 3. INPUT SYSTEM (FIXED) ---
const keys = {};

window.addEventListener('keydown', (e) => {
    // We use both .code and .key to ensure it works on all browsers
    const k = e.code || e.key;
    keys[k] = true;

    // JUMP (Space)
    if ((k === 'Space' || k === ' ') && isGrounded) {
        yVelocity = jumpStrength;
        isGrounded = false;
        console.log("Jump Triggered");
    }

    // INTERACT (E)
    if (k === 'KeyE' || k === 'e' || k === 'E') {
        console.log("E Pressed - Interaction Triggered");
        // Flash the ambient light to show it works
        ambient.intensity = 2;
        setTimeout(() => ambient.intensity = 0.6, 100);
    }
});

window.addEventListener('keyup', (e) => {
    const k = e.code || e.key;
    keys[k] = false;
});

renderer.domElement.addEventListener('click', () => {
    renderer.domElement.requestPointerLock();
});

// Mouse Look
let yaw = 0, pitch = 0;
window.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === renderer.domElement) {
        yaw -= e.movementX * 0.002;
        pitch -= e.movementY * 0.002;
        pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch));
        camera.rotation.set(pitch, yaw, 0, 'YXZ');
    }
});

camera.position.set(0, 1, 0);

// --- 4. COLLISION & MOVEMENT ---
function isColliding(pos) {
    const pBox = new THREE.Box3().setFromCenterAndSize(pos, new THREE.Vector3(playerRadius, 1.5, playerRadius));
    for (let obs of obstacles) {
        if (pBox.intersectsBox(obs)) return true;
    }
    return false;
}

function update() {
    if (document.pointerLockElement === renderer.domElement) {
        const speed = 0.1;
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        forward.y = 0; right.y = 0;
        forward.normalize(); right.normalize();

        const move = new THREE.Vector3(0, 0, 0);
        if (keys['KeyW'] || keys['w']) move.add(forward);
        if (keys['KeyS'] || keys['s']) move.add(forward.clone().negate());
        if (keys['KeyA'] || keys['a']) move.add(right.clone().negate());
        if (keys['KeyD'] || keys['d']) move.add(right);

        if (move.length() > 0) {
            move.normalize().multiplyScalar(speed);
            const nextX = camera.position.clone(); nextX.x += move.x;
            if (!isColliding(nextX)) camera.position.x = nextX.x;
            const nextZ = camera.position.clone(); nextZ.z += move.z;
            if (!isColliding(nextZ)) camera.position.z = nextZ.z;
        }

        // Gravity/Jump Logic
        camera.position.y += yVelocity;
        if (camera.position.y > 1) {
            yVelocity += gravity;
            isGrounded = false;
        } else {
            camera.position.y = 1;
            yVelocity = 0;
            isGrounded = true;
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
