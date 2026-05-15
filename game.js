const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111122);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 0);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8); dirLight.position.set(10, 20, 10); scene.add(dirLight);

const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({ color: 0x333333 }));
floor.rotation.x = -Math.PI / 2; scene.add(floor);

let playerHP = 100, score = 0, pitch = 0, yaw = 0;
const keys = { w: false, a: false, s: false, d: false };

document.getElementById('instructions').addEventListener('click', () => { document.body.requestPointerLock(); });
document.addEventListener('pointerlockchange', () => {
    document.getElementById('instructions').style.display = document.pointerLockElement === document.body ? 'none' : 'flex';
});
document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement !== document.body) return;
    yaw -= e.movementX * 0.002; pitch -= e.movementY * 0.002;
    pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, pitch));
    camera.rotation.order = "YXZ"; camera.rotation.set(pitch, yaw, 0);
});
document.addEventListener('keydown', (e) => { if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = true; });
document.addEventListener('keyup', (e) => { if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = false; });

const bot = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.8, 16), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
bot.position.set(5, 0.9, -10); scene.add(bot);

document.addEventListener('mousedown', (e) => {
    if (document.pointerLockElement !== document.body || e.button !== 0) return;
    const raycaster = new THREE.Raycaster();
    raycaster.set(camera.position, new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion));
    const intersects = raycaster.intersectObject(bot);
    if (intersects.length > 0) {
        score += 10; document.getElementById('score').innerText = score;
        bot.position.set((Math.random() - 0.5) * 20, 0.9, (Math.random() - 0.5) * 20);
    }
});

function animate() {
    requestAnimationFrame(animate);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion); forward.y = 0; forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0,1,0)).normalize();
    if (keys.w) camera.position.addScaledVector(forward, 0.1);
    if (keys.s) camera.position.addScaledVector(forward, -0.1);
    if (keys.d) camera.position.addScaledVector(right, -0.1);
    if (keys.a) camera.position.addScaledVector(right, 0.1);

    const dirToPlayer = new THREE.Vector3().subVectors(camera.position, bot.position); dirToPlayer.y = 0;
    if (dirToPlayer.length() > 2) bot.position.addScaledVector(dirToPlayer.normalize(), 0.03);
    renderer.render(scene, camera);
}
animate();
