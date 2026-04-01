import * as THREE from 'three';

// --- 1. ENGINE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a); // Dark background for contrast

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lights
const ambient = new THREE.AmbientLight(0xffffff, 0.5);
const point = new THREE.PointLight(0xffffff, 20);
point.position.set(2, 5, 2);
scene.add(ambient, point);

// --- 2. THE CAFE LAYOUT ---

// Floor
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(15, 15),
    new THREE.MeshStandardMaterial({ color: 0x3e2723 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1;
scene.add(floor);

// Walls
const wallMat = new THREE.MeshStandardMaterial({ color: 0xf5f5dc });
const backWall = new THREE.Mesh(new THREE.BoxGeometry(15, 5, 0.5), wallMat);
backWall.position.set(0, 1.5, -7.5);
scene.add(backWall);

const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 5, 15), wallMat);
leftWall.position.set(-7.5, 1.5, 0);
scene.add(leftWall);

// Service Counter (L-Shape)
const counterMat = new THREE.MeshStandardMaterial({ color: 0x221105 });
const mainCounter = new THREE.Mesh(new THREE.BoxGeometry(6, 1.2, 1.5), counterMat);
mainCounter.position.set(-2, -0.4, -4);
scene.add(mainCounter);

const sideCounter = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 3), counterMat);
sideCounter.position.set(1.5, -0.4, -5.5);
scene.add(sideCounter);

// Tables
function createTable(x, z) {
    const tableGroup = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 1.5), new THREE.MeshStandardMaterial({color: 0x5d4037}));
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 8), new THREE.MeshStandardMaterial({color: 0x111111}));
    leg.position.y = -0.5;
    tableGroup.add(top, leg);
    tableGroup.position.set(x, -0.4, z);
    scene.add(tableGroup);
}
createTable(4, 2);
createTable(4, -2);

// --- 3. THE DRINK ---
const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.1, 0.3, 32),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
);
cup.position.set(-1, 0.35, -4); // Sitting on the counter
scene.add(cup);

const liquid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.28, 32),
    new THREE.MeshStandardMaterial({ color: 0x3c2005 })
);
liquid.position.set(-1, 0.35, -4);
liquid.scale.y = 0.01;
liquid.visible = false;
scene.add(liquid);

// --- 4. MOVEMENT & INPUT ---
const keys = {};
const speed = 0.08;
let yaw = 0;
let pitch = 0;

window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

// Mouse Sensitivity & Locking
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

// --- 5. GAME ACTIONS ---
document.getElementById('brewBtn').onclick = () => {
    liquid.visible = true;
    liquid.scale.y = 0.01;
    const interval = setInterval(() => {
        if (liquid.scale.y < 1) {
            liquid.scale.y += 0.02;
        } else {
            clearInterval(interval);
        }
    }, 30);
};

// --- 6. CORE UPDATE LOOP ---
function update() {
    if (document.pointerLockElement === renderer.domElement) {
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        forward.y = 0; // Prevent flying
        right.y = 0;
        forward.normalize();
        right.normalize();

        if (keys.w) camera.position.addScaledVector(forward, speed);
        if (keys.s) camera.position.addScaledVector(forward, -speed);
        if (keys.a) camera.position.addScaledVector(right, -speed);
        if (keys.d) camera.position.addScaledVector(right, speed);
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
