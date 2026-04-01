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

function createBox(w, h, d, x, y, z, color, isObstacle = true) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color: color })
    );
    mesh.position.set(x, y, z);
    scene.add(mesh);
    
    if (isObstacle) {
        // Force the bounding box to update immediately
        const box = new THREE.Box3().setFromObject(mesh);
        obstacles.push(box);
    }
    return mesh;
}

// --- 3. THE FULL ROOM LAYOUT ---

// Floor (No collision needed)
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(15, 15),
    new THREE.MeshStandardMaterial({ color: 0x3e2723 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1;
scene.add(floor);

// 4 Walls (Enclosing the 15x15 space)
const wallColor = 0xf5f5dc;
createBox(15, 5, 0.5, 0, 1.5, -7.5, wallColor); // Back
createBox(15, 5, 0.5, 0, 1.5, 7.5, wallColor);  // Front
createBox(0.5, 5, 15, -7.5, 1.5, 0, wallColor); // Left
createBox(0.5, 5, 15, 7.5, 1.5, 0, wallColor);  // Right

// Service Counter
createBox(6, 1.2, 1.5, -2, -0.4, -4, 0x221105);

// Tables
function createTable(x, z) {
    const top = createBox(1.5, 0.1, 1.5, x, -0.4, z, 0x5d4037);
    // Visual only leg (no collision)
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1), new THREE.MeshStandardMaterial({color: 0x111111}));
    leg.position.set(x, -0.9, z);
    scene.add(leg);
}
createTable(4, 2);
createTable(4, -2);

// --- 4. THE DRINK ---
const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.1, 0.3, 32),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
);
cup.position.set(-1, 0.35, -4);
scene.add(cup);

const liquid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.28, 32),
    new THREE.MeshStandardMaterial({ color: 0x3c2005 })
);
liquid.position.copy(cup.position);
liquid.scale.y = 0.01;
liquid.visible = false;
scene.add(liquid);

// --- 5. MOVEMENT LOGIC ---
const keys = {};
const speed = 0.08;
let yaw = 0, pitch = 0;
let isBrewing = false;

window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space' && !isBrewing) {
        if (camera.position.distanceTo(cup.position) < 2.5) {
            isBrewing = true;
            liquid.visible = true;
            const interval = setInterval(() => {
                if (liquid.scale.y < 1) liquid.scale.y += 0.02;
                else { clearInterval(interval); isBrewing = false; }
            }, 30);
        }
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

// --- 6. COLLISION CHECKER ---
function checkCollision(newPos) {
    const playerBox = new THREE.Box3().setFromCenterAndSize(
        newPos,
        new THREE.Vector3(playerRadius, 2, playerRadius)
    );

    for (let i = 0; i < obstacles.length; i++) {
        if (playerBox.intersectsBox(obstacles[i])) return true;
    }
    return false;
}

// --- 7. ANIMATION LOOP ---
function update() {
    if (document.pointerLockElement === renderer.domElement) {
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        forward.y = 0; right.y = 0;
        forward.normalize(); right.normalize();

        const wishDir = new THREE.Vector3(0, 0, 0);
        if (keys['KeyW']) wishDir.add(forward);
        if (keys['KeyS']) wishDir.add(forward.clone().negate());
        if (keys['KeyA']) wishDir.add(right.clone().negate());
        if (keys['KeyD']) wishDir.add(right);

        if (wishDir.length() > 0) {
            wishDir.normalize().multiplyScalar(speed);
            
            // Try X movement
            const nextX = camera.position.clone().add(new THREE.Vector3(wishDir.x, 0, 0));
            if (!checkCollision(nextX)) camera.position.x = nextX.x;

            // Try Z movement
            const nextZ = camera.position.clone().add(new THREE.Vector3(0, 0, wishDir.z));
            if (!checkCollision(nextZ)) camera.position.z = nextZ.z;
        }

        const dist = camera.position.distanceTo(cup.position);
        const prompt = document.getElementById('interaction-prompt');
        if (prompt) prompt.style.display = (dist < 2.5 && !isBrewing) ? 'block' : 'none';
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
