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
const playerRadius = 0.5; // Increased for better collision
let yVelocity = 0;
const gravity = -0.01;
const jumpStrength = 0.2;
let isGrounded = true;

// Helper to create objects and ensure they are added to collision list
function createPhysicsBox(w, h, d, x, y, z, color) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color: color })
    );
    mesh.position.set(x, y, z);
    scene.add(mesh);
    
    // Create the bounding box immediately
    const box = new THREE.Box3();
    box.setFromObject(mesh);
    obstacles.push(box);
    return mesh;
}

// --- 3. CAFE BUILD ---
// Floor
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0x3e2723 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1;
scene.add(floor);

// Ceiling (Keeps you from jumping out)
const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0x222222 })
);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = 4;
scene.add(ceiling);

// Walls (Full Enclosure)
const wallColor = 0xf5f5dc;
createPhysicsBox(20, 5, 0.5, 0, 1.5, -10, wallColor); // Back
createPhysicsBox(20, 5, 0.5, 0, 1.5, 10, wallColor);  // Front
createPhysicsBox(0.5, 5, 20, -10, 1.5, 0, wallColor); // Left
createPhysicsBox(0.5, 5, 20, 10, 1.5, 0, wallColor);  // Right

// Counter
createPhysicsBox(6, 1.2, 2, -2, -0.4, -6, 0x221105);

// Tables
function makeTable(x, z) {
    createPhysicsBox(2, 0.1, 2, x, -0.4, z, 0x5d4037); // Table Top
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1), new THREE.MeshStandardMaterial({color: 0x000000}));
    leg.position.set(x, -0.9, z);
    scene.add(leg);
}
makeTable(5, 5);
makeTable(5, -5);
makeTable(-5, 5);

// --- 4. CONTROLS ---
const keys = {};
let yaw = 0, pitch = 0;

window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space' && isGrounded) {
        yVelocity = jumpStrength;
        isGrounded = false;
    }
});
window.addEventListener('keyup', (e) => keys[e.code] = false);

renderer.domElement.addEventListener('click', () => renderer.domElement.requestPointerLock());

window.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === renderer.domElement) {
        yaw -= e.movementX * 0.002;
        pitch -= e.movementY * 0.002;
        pitch = Math.max(-Math.PI/2.1, Math.min(Math.PI/2.1, pitch));
        camera.rotation.set(pitch, yaw, 0, 'YXZ');
    }
});

camera.position.set(0, 1, 0);

// --- 5. COLLISION LOGIC ---
function isColliding(pos) {
    // Create a bounding box for the player
    const pBox = new THREE.Box3().setFromCenterAndSize(
        pos,
        new THREE.Vector3(playerRadius, 1.8, playerRadius)
    );

    for (let i = 0; i < obstacles.length; i++) {
        if (pBox.intersectsBox(obstacles[i])) return true;
    }
    return false;
}

// --- 6. GAME LOOP ---
function update() {
    if (document.pointerLockElement === renderer.domElement) {
        const speed = 0.1;
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        forward.y = 0; right.y = 0;
        forward.normalize(); right.normalize();

        const move = new THREE.Vector3(0, 0, 0);
        if (keys['KeyW']) move.add(forward);
        if (keys['KeyS']) move.add(forward.clone().negate());
        if (keys['KeyA']) move.add(right.clone().negate());
        if (keys['KeyD']) move.add(right);

        if (move.length() > 0) {
            move.normalize().multiplyScalar(speed);
            
            // Step-by-step collision check (X then Z)
            const nextX = camera.position.clone();
            nextX.x += move.x;
            if (!isColliding(nextX)) camera.position.x = nextX.x;

            const nextZ = camera.position.clone();
            nextZ.z += move.z;
            if (!isColliding(nextZ)) camera.position.z = nextZ.z;
        }

        // Gravity math
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

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
