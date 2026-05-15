// --- 1. SETUPS CƠ BẢN ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a14);
scene.fog = new THREE.FogExp2(0x0a0a14, 0.04);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 0);

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

// Ánh sáng môi trường
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(20, 40, 20);
dirLight.castShadow = true;
scene.add(dirLight);

// Mặt sàn
const floorGeo = new THREE.PlaneGeometry(100, 100);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x22222b });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// --- 2. HỆ THỐNG VẬT CẢN (MÊ CUNG / TƯỜNG) ---
const walls = [];
const wallMat = new THREE.MeshStandardMaterial({ color: 0x444454, roughness: 0.8 });

function createWall(x, z, width, depth, height = 4) {
    const wallGeo = new THREE.BoxGeometry(width, height, depth);
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(x, height / 2, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
    walls.push(wall); // Lưu vào mảng để tính va chạm
}

// Xây dựng một số bức tường giả lập mê cung
createWall(0, -10, 20, 2);
createWall(-10, 10, 2, 15);
createWall(15, 5, 2, 20);
createWall(-20, -20, 15, 2);
createWall(20, -25, 2, 15);

// Biên giới bản đồ (4 bức tường bao quanh)
createWall(0, -50, 100, 2);
createWall(0, 50, 100, 2);
createWall(-50, 0, 2, 100);
createWall(50, 0, 2, 100);


// --- 3. ĐIỀU KHIỂN & ĐĂNG KÝ CHUỘT/PHÍM ---
let playerHP = 100;
let score = 0;
const moveSpeed = 0.12;
const playerRadius = 0.6;
const keys = { w: false, a: false, s: false, d: false };
let pitch = 0, yaw = 0;

const instructions = document.getElementById('instructions');
instructions.addEventListener('click', () => { document.body.requestPointerLock(); });
document.addEventListener('pointerlockchange', () => {
    instructions.style.display = document.pointerLockElement === document.body ? 'none' : 'flex';
});

document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement !== document.body) return;
    yaw -= e.movementX * 0.0025;
    pitch -= e.movementY * 0.0025;
    pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, pitch));
    camera.rotation.order = "YXZ";
    camera.rotation.set(pitch, yaw, 0);
});

document.addEventListener('keydown', (e) => { if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = true; });
document.addEventListener('keyup', (e) => { if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = false; });


// --- 4. TẠO VŨ KHÍ ---
const gunGeo = new THREE.BoxGeometry(0.08, 0.08, 0.5);
const gunMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 });
const gun = new THREE.Mesh(gunGeo, gunMat);
gun.position.set(0.2, -0.25, -0.45);
camera.add(gun);
scene.add(camera);


// --- 5. TẢI MÔ HÌNH 3D CHO BOT & AI ---
let botMesh = null; // Lưu mesh hoặc mô hình 3D gốc của Bot
let botHP = 4;
const botSpeed = 0.05;
const loader = new THREE.GLTFLoader();

// Hàm tải mô hình 3D (Nếu chưa có file robot.glb thật, hệ thống tự fallback về khối trụ màu đỏ)
loader.load('models/robot.glb', 
    (gltf) => {
        botMesh = gltf.scene;
        botMesh.scale.set(0.8, 0.8, 0.8); // Điều chỉnh kích thước mô hình
        spawnBot();
    }, 
    undefined, 
    (error) => {
        console.warn("Chưa tìm thấy file robot.glb, sử dụng mô hình dự phòng hình trụ.");
        // Khởi tạo mô hình dự phòng nếu không tải được file
        const fallbackGeo = new THREE.CylinderGeometry(0.5, 0.5, 2, 16);
        const fallbackMat = new THREE.MeshStandardMaterial({ color: 0xff3333 });
        botMesh = new THREE.Mesh(fallbackGeo, fallbackMat);
        spawnBot();
    }
);

function spawnBot() {
    if (!botMesh) return;
    botMesh.position.set((Math.random() - 0.5) * 40, 1, (Math.random() - 0.5) * 40);
    botHP = 4;
    scene.add(botMesh);
}


// --- 6. KIỂM TRA VA CHẠM (COLLISION DETECTION) ---
function checkWallCollision(newPos) {
    // Tạo một hộp giới hạn ảo bao quanh người chơi
    const playerBox = new THREE.Box3(
        new THREE.Vector3(newPos.x - playerRadius, 0, newPos.z - playerRadius),
        new THREE.Vector3(newPos.x + playerRadius, 4, newPos.z + playerRadius)
    );

    for (let i = 0; i < walls.length; i++) {
        const wallBox = new THREE.Box3().setFromObject(walls[i]);
        if (playerBox.intersectsBox(wallBox)) {
            return true; // Bị kẹt vào tường
        }
    }
    return false; // Không va chạm
}


// --- 7. CƠ CHẾ BẮN SÚNG & TIA RAYCASTER ---
const raycaster = new THREE.Raycaster();

document.addEventListener('mousedown', (e) => {
    if (document.pointerLockElement !== document.body || e.button !== 0) return;

    // Giật súng
    gun.position.z = -0.35;
    setTimeout(() => gun.position.z = -0.45, 60);

    // Tính hướng bắn
    const shootDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
    raycaster.set(camera.position, shootDir);

    // Kiểm tra đạn bắn trúng tường trước hay trúng Bot trước
    const intersectsWalls = raycaster.intersectObjects(walls);
    const intersectsBot = botMesh ? raycaster.intersectObject(botMesh, true) : [];

    let distToWall = intersectsWalls.length > 0 ? intersectsWalls[0].distance : Infinity;
    let distToBot = intersectsBot.length > 0 ? intersectsBot[0].distance : Infinity;

    // Nếu Bot ở gần hơn bức tường chắn phía trước -> Trúng Bot
    if (distToBot < distToWall) {
        botHP--;
        if (botHP <= 0) {
            score += 20;
            document.getElementById('score').innerText = score;
            spawnBot();
        }
    }
});


// --- 8. VÒNG LẶP CHÍNH (GAME LOOP) ---
let lastBotAttack = 0;

function animate(time) {
    requestAnimationFrame(animate);

    // Tính toán hướng di chuyển
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    forward.y = 0; forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    let targetMove = new THREE.Vector3(0, 0, 0);

    if (keys.w) targetMove.addScaledVector(forward, moveSpeed);
    if (keys.s) targetMove.addScaledVector(forward, -moveSpeed);
    if (keys.d) targetMove.addScaledVector(right, -moveSpeed);
    if (keys.a) targetMove.addScaledVector(right, moveSpeed);

    // Thử nghiệm vị trí mới trước khi áp dụng thực tế (Tránh đi xuyên tường)
    if (targetMove.lengthSq() > 0) {
        let testPos = camera.position.clone().add(targetMove);
        
        // Kiểm tra độc lập trục X và trục Z để mượt mà khi trượt dọc tường
        let testPosX = camera.position.clone(); testPosX.x = testPos.x;
        if (!checkWallCollision(testPosX)) camera.position.x = testPos.x;

        let testPosZ = camera.position.clone(); testPosZ.z = testPos.z;
        if (!checkWallCollision(testPosZ)) camera.position.z = testPos.z;
    }

    // Logic xử lý Trí Tuệ Nhân Tạo cho Bot
    if (botMesh) {
        const dirToPlayer = new THREE.Vector3().subVectors(camera.position, botMesh.position);
        dirToPlayer.y = 0;
        const distance = dirToPlayer.length();
        dirToPlayer.normalize();

        // Quay mặt Bot về hướng người chơi
        botMesh.lookAt(new THREE.Vector3(camera.position.x, botMesh.position.y, camera.position.z));

        // Nếu ở xa, Bot tự động đi tìm người chơi
        if (distance > 2.5) {
            // Lưu vị trí tạm thời của Bot để kiểm tra va chạm tường giống Player
            let nextBotPos = botMesh.position.clone().addScaledVector(dirToPlayer, botSpeed);
            
            // Nếu không vướng tường, Bot tiến lên
            const botBox = new THREE.Box3(
                new THREE.Vector3(nextBotPos.x - 0.5, 0, nextBotPos.z - 0.5),
                new THREE.Vector3(nextBotPos.x + 0.5, 2, nextBotPos.z + 0.5)
            );
            
            let hitWall = false;
            for(let w of walls) {
                if(botBox.intersectsBox(new THREE.Box3().setFromObject(w))) { hitWall = true; break; }
            }
            if(!hitWall) {
                botMesh.position.copy(nextBotPos);
            }
        }

        // Tấn công cận chiến khi Bot áp sát thành công
        if (distance < 2.8 && time - lastBotAttack > 1200) {
            playerHP -= 25;
            document.getElementById('hp').innerText = playerHP;
            lastBotAttack = time;

            if (playerHP <= 0) {
                alert("GAME OVER! Bạn đạt được: " + score + " điểm.");
                playerHP = 100; score = 0;
                document.getElementById('hp').innerText = playerHP;
                document.getElementById('score').innerText = score;
                camera.position.set(0, 1.6, 0);
                spawnBot();
            }
        }
    }

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

requestAnimationFrame(animate);
