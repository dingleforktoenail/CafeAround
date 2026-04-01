import * as THREE from 'three';

/** * SCENE SETUP 
 */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x221a15);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lights
const ambient = new THREE.AmbientLight(0xffffff, 0.7);
const point = new THREE.PointLight(0xffffff, 15);
point.position.set(2, 4, 2);
scene.add(ambient, point);

/** * OBJECTS
 */
// Floor
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0x111111 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1;
scene.add(floor);

// Counter
const counter = new THREE.Mesh(
    new THREE.BoxGeometry(4, 1, 2),
    new THREE.MeshStandardMaterial({ color: 0x5d4037 })
);
counter.position.set(0, -0.5, -2);
scene.add(counter);

// Cup & Liquid
const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.15, 0.4, 32),
    new THREE.MeshStandardMaterial({ color: 0xeeeeee })
);
cup.position.set(0, 0.2, -2);
scene.add(cup);

const liquid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.35, 32),
    new THREE.MeshStandardMaterial({ color: 0x3e2723 })
);
liquid.position.set(0, 0.2, -2);
liquid.scale.y = 0.01;
liquid.visible = false;
scene.add(liquid);

/** * MOVEMENT SYSTEM
 */
const keys = {};
const speed = 0.1;
let yaw = 0;
let pitch = 0;

window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

// Mouse Look Logic
renderer.domElement.addEventListener('click', () => renderer.domElement.requestPointerLock());

window.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === renderer.domElement) {
        yaw -= e.movementX * 0.002;
        pitch -= e.movementY * 0.002;
        pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch));
        camera.rotation.set(pitch, yaw, 0, 'YXZ');
    }
});

camera.position.set(0, 1, 3);

/** * GAME ACTIONS
 */
document.getElementById('brewBtn').onclick = () => {
    liquid.visible = true;
    liquid.scale.y = 0.01;
    const interval = setInterval(() => {
        if (liquid.scale.y < 1) {
            liquid.scale.y += 0.05;
        } else {
            clearInterval(interval);
        }
    }, 50);
};

/** * CORE LOOP
 */
function update() {
    // If we are "locked" in the game, allow movement
    if (document.pointerLockElement === renderer.domElement) {
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        forward.y = 0; 
        right.y = 0;

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

// Window resize handling
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
