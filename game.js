// --- 4. COLLISION DATA ---
const obstacles = [];

// Helper to add boxes to our collision list
function addObstacle(mesh) {
    const box = new THREE.Box3().setFromObject(mesh);
    obstacles.push(box);
}

// Add the walls and counters to the list
addObstacle(backWall);
addObstacle(leftWall);
addObstacle(mainCounter);

// Create and add tables to the list
function createTable(x, z) {
    const tableGroup = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 1.5), new THREE.MeshStandardMaterial({color: 0x5d4037}));
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 8), new THREE.MeshStandardMaterial({color: 0x111111}));
    leg.position.y = -0.5;
    tableGroup.add(top, leg);
    tableGroup.position.set(x, -0.4, z);
    scene.add(tableGroup);
    
    // Add the table's hitbox
    addObstacle(top);
}
createTable(4, 2);
createTable(4, -2);

// --- 5. MOVEMENT & INPUT ---
const keys = {};
const speed = 0.08;
const playerRadius = 0.5; // Space around the player
let yaw = 0, pitch = 0;
let isBrewing = false;

window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space' && !isBrewing) {
        const dist = camera.position.distanceTo(cup.position);
        if (dist < 2.5) startBrewing();
    }
});
window.addEventListener('keyup', (e) => keys[e.code] = false);

// --- 6. CORE UPDATE LOOP WITH COLLISION ---
function update() {
    if (document.pointerLockElement === renderer.domElement) {
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        forward.y = 0; right.y = 0;
        forward.normalize(); right.normalize();

        // Calculate "Desired" movement
        let moveVec = new THREE.Vector3(0, 0, 0);
        if (keys['KeyW']) moveVec.add(forward);
        if (keys['KeyS']) moveVec.add(forward.clone().negate());
        if (keys['KeyA']) moveVec.add(right.clone().negate());
        if (keys['KeyD']) moveVec.add(right);

        if (moveVec.length() > 0) {
            moveVec.normalize().multiplyScalar(speed);
            
            // Test X movement
            const testPos = camera.position.clone();
            testPos.x += moveVec.x;
            if (!checkCollision(testPos)) camera.position.x = testPos.x;

            // Test Z movement
            testPos.copy(camera.position);
            testPos.z += moveVec.z;
            if (!checkCollision(testPos)) camera.position.z = testPos.z;
        }

        // UI Interaction Check
        const dist = camera.position.distanceTo(cup.position);
        document.getElementById('interaction-prompt').style.display = (dist < 2.5 && !isBrewing) ? 'block' : 'none';
    }
}

function checkCollision(pos) {
    // Create a small bounding box for the player at the test position
    const playerBox = new THREE.Box3().setFromCenterAndSize(
        pos, 
        new THREE.Vector3(playerRadius, 2, playerRadius)
    );

    for (const obstacle of obstacles) {
        if (playerBox.intersectsBox(obstacle)) return true;
    }
    return false;
}
