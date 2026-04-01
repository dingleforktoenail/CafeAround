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

// --- 2. PHYSICS & OBSTACLE DATA ---
const obstacles = [];
const playerRadius = 0.4;
let yVelocity = 0;
const gravity = -0.012;
const jumpStrength = 0.25;
let isGrounded = true;

// Helper to create objects with hitboxes
function createBox(w, h, d, x, y, z, color, isObstacle = true) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color: color })
    );
    mesh.position.set(x, y, z);
    scene.add(mesh);
    
    if (isObstacle) {
        const box = new THREE.Box3();
        box.setFromObject(mesh);
        obstacles.push(box);
    }
    return mesh;
}

// --- 3. THE CAFE LAYOUT ---
// Floor
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(15, 15), 
    new THREE.MeshStandardMaterial({ color: 0x3e2723 })
);
floor.rotation.x = -Math.PI / 2; 
floor.position.y = -1;
scene.add(floor);

// Walls
const wallColor = 0xf5f5dc;
createBox(15, 5, 0.5, 0, 1.5, -7.5, wallColor); // Back
createBox(15, 5, 0.5, 0, 1.5, 7.5, wallColor);  // Front
createBox(0.5, 5, 15, -7.5, 1.5, 0, wallColor); // Left
createBox(0.5, 5, 15, 7.5, 1.5, 0, wallColor);  // Right

// Main Service Counter
createBox(6, 1.2, 1.5, -2, -0.4, -4, 0x221105);

// Tables (With Collision)
function createTable(x, z) {
    createBox(1.5, 0.1, 1.5, x, -0.4, z, 0x5d4037); // Table Top
    const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 1), 
        new THREE.MeshStandardMaterial({color: 0x111111})
    );
    leg.position.set(x, -0.9, z);
    scene.add(leg);
}
createTable(4, 2);
createTable(4, -2);
createTable(-4, 3); // Added an extra table for the layout

// --- 4. INPUT & MOVEMENT ---
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
        pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch));
        camera.rotation.set(pitch, yaw, 0, 'YXZ');
    }
});

camera.position.set(0, 1, 4);

// --- 5. COLLISION CHECKER ---
function checkCollision(newPos) {
    const playerBox = new THREE.Box3().setFromCenterAndSize(
        newPos,
        new THREE.Vector3(playerRadius, 1.5, playerRadius)
    );
    for (let obs of obstacles) {
        if (playerBox.intersectsBox(obs)) return true;
    }
    return false;
}

// --- 6. CORE UPDATE LOOP ---
function update() {
    if (document.pointerLockElement === renderer.domElement) {
        const speed = 0.08;
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        forward.y = 0; right.y = 0;
        forward.normalize(); right.normalize();

        // Handle X/Z Movement
        const wishDir = new THREE.Vector3(0, 0, 0);
        if (keys['KeyW']) wishDir.add(forward);
        if (keys['KeyS']) wishDir.add(forward.clone().negate());
        if (keys['KeyA']) wishDir.add(right.clone().negate());
        if (keys['KeyD']) wishDir.add(right);

        if (wishDir.length() > 0) {
            wishDir.normalize().multiplyScalar(speed);
            
            const nextX = camera.position.clone().add(new THREE.Vector3(wishDir.x, 0, 0));
            if (!checkCollision(nextX)) camera.position.x = nextX.x;
            
            const nextZ = camera.position.clone().add(new THREE.Vector3(0, 0, wishDir.z));
            if (!checkCollision(nextZ)) camera.position.z = nextZ.z;
        }

        // Handle Gravity & Jumping
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
