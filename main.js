// ===== CANVAS SETUP & SCALING =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GAME_W = 800;
const GAME_H = 600;
canvas.width = GAME_W;
canvas.height = GAME_H;

// Scale canvas to fit viewport while preserving aspect ratio
function resizeCanvas() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scale = Math.min(vw / GAME_W, vh / GAME_H);
    canvas.style.width  = Math.floor(GAME_W * scale) + 'px';
    canvas.style.height = Math.floor(GAME_H * scale) + 'px';
    canvas.style.display = 'block';
    canvas.style.margin  = '0 auto';
    // Center vertically
    canvas.style.position = 'fixed';
    canvas.style.left = '50%';
    canvas.style.top  = '50%';
    canvas.style.transform = `translate(-50%, -50%)`;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 200));

// ===== IMAGES =====
const wallImg = new Image();    wallImg.src = 'images/wall.png';
const safeZoneImg = new Image(); safeZoneImg.src = 'images/safezone.png';
const keyImg = new Image();     keyImg.src = 'images/key.png';
const hopeImg = new Image();    hopeImg.src = 'images/hope.png';

// ===== GAME STATE =====
let gameRunning = false;
let isPaused = false;
let keysFound = 0;
let deathCount = 0;
let currentRoomX = 0;
let currentRoomY = 0;
let hiddenItemsFound = 0;
let hopeCount = 0;
const player = { x: 400, y: 300, size: 25, speed: 3.2 };

const enemies = [
    new RedEnemy(50, 50, 2),
    new GreenEnemy(200, 200, 1.5),
    new PinkEnemy(600, 400, 1.8)
];
enemies[1].roomX = 1; enemies[1].roomY = 0;
enemies[2].roomX = 0; enemies[2].roomY = 1;

let currentStoryIdx = 0;
let storyMode = "intro";

// ===== AUDIO =====
const bgMusic = new Audio('bgm.wav');
bgMusic.loop = true;
bgMusic.volume = 0.5;

const bossMusic = new Audio('LastChance42.wav');
bossMusic.loop = true;
bossMusic.volume = 0.6;

const sfxPickupKey  = new Audio('sfx_key.mp3');     sfxPickupKey.volume  = 0.8;
const sfxPickupItem = new Audio('sfx_item.mp3');    sfxPickupItem.volume = 0.7;
const sfxJumpscare  = new Audio('sfx_jumpscare.mp3'); sfxJumpscare.volume  = 1.0;
const sfxBossHit    = new Audio('sfx_boss_hit.mp3'); sfxBossHit.volume   = 0.9;
const sfxHope       = new Audio('sfx_hope.mp3');    sfxHope.volume      = 0.85;
const sfxHeal       = new Audio('sfx_heal.mp3');    sfxHeal.volume      = 0.8;
const sfxPlayerHit  = new Audio('sfx_player_hit.mp3'); sfxPlayerHit.volume = 0.9;
const sfxVictory    = new Audio('sfx_victory.wav'); sfxVictory.volume   = 1.0;

let _audioCtx = null;
let _footstepTimer = 0;
const FOOTSTEP_INTERVAL = 18;

function getAudioCtx() {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return _audioCtx;
}

function playFootstep() {
    try {
        const ac = getAudioCtx();
        const osc  = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain); gain.connect(ac.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(110 + Math.random() * 50, ac.currentTime);
        osc.frequency.exponentialRampToValueAtTime(55, ac.currentTime + 0.09);
        gain.gain.setValueAtTime(0.12, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1);
        osc.start(ac.currentTime); osc.stop(ac.currentTime + 0.1);
    } catch(e) {}
}

function playSFX(audio) {
    try { audio.currentTime = 0; audio.play().catch(() => {}); } catch(e) {}
}
function playBossHitSFX() { playSFX(sfxBossHit); }
function playHopeSFX()    { playSFX(sfxHope); }
function playHealSFX()    { playSFX(sfxHeal); }
function playPlayerHitSFX() { playSFX(sfxPlayerHit); }
function playVictorySFX() { playSFX(sfxVictory); }

// ===== JOYSTICK (Di chuyển) =====
const joystickContainer = document.getElementById('joystick-container');
const joystickBase      = document.getElementById('joystick-base');
const joystickStick     = document.getElementById('joystick-stick');

let joystickActive = false;
let joystickId     = null;
let joystickOrigin = { x: 0, y: 0 };
let joystickDelta  = { x: 0, y: 0 };
const JOYSTICK_RADIUS = 40;

joystickContainer.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (joystickActive) return;
    const t = e.changedTouches[0];
    joystickId = t.identifier;
    joystickActive = true;
    const rect = joystickBase.getBoundingClientRect();
    joystickOrigin.x = rect.left + rect.width / 2;
    joystickOrigin.y = rect.top  + rect.height / 2;
    updateJoystick(t.clientX, t.clientY);
}, { passive: false });

joystickContainer.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (let t of e.changedTouches) {
        if (t.identifier === joystickId) {
            updateJoystick(t.clientX, t.clientY);
        }
    }
}, { passive: false });

joystickContainer.addEventListener('touchend', (e) => {
    e.preventDefault();
    for (let t of e.changedTouches) {
        if (t.identifier === joystickId) {
            joystickActive = false;
            joystickId = null;
            joystickDelta = { x: 0, y: 0 };
            joystickStick.style.transform = 'translate(-50%, -50%)';
        }
    }
}, { passive: false });

function updateJoystick(cx, cy) {
    let dx = cx - joystickOrigin.x;
    let dy = cy - joystickOrigin.y;
    const dist = Math.hypot(dx, dy);
    if (dist > JOYSTICK_RADIUS) {
        dx = (dx / dist) * JOYSTICK_RADIUS;
        dy = (dy / dist) * JOYSTICK_RADIUS;
    }
    joystickDelta.x = dx / JOYSTICK_RADIUS;
    joystickDelta.y = dy / JOYSTICK_RADIUS;
    joystickStick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}

// ===== DODGE JOYSTICK =====
const dodgeJoyContainer = document.getElementById('dodge-joystick-container');
const dodgeJoyStick     = document.getElementById('dodge-joystick-stick');

let dodgeJoyActive = false;
let dodgeJoyId     = null;
let dodgeJoyOrigin = { x: 0, y: 0 };
let dodgeJoyDelta  = { x: 0, y: 0 };
const DODGE_JOY_RADIUS = 35;

dodgeJoyContainer.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (dodgeJoyActive) return;
    const t = e.changedTouches[0];
    dodgeJoyId = t.identifier;
    dodgeJoyActive = true;
    const rect = document.getElementById('dodge-joystick-base').getBoundingClientRect();
    dodgeJoyOrigin.x = rect.left + rect.width / 2;
    dodgeJoyOrigin.y = rect.top  + rect.height / 2;
    updateDodgeJoy(t.clientX, t.clientY);
}, { passive: false });

dodgeJoyContainer.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (let t of e.changedTouches) {
        if (t.identifier === dodgeJoyId) updateDodgeJoy(t.clientX, t.clientY);
    }
}, { passive: false });

dodgeJoyContainer.addEventListener('touchend', (e) => {
    e.preventDefault();
    for (let t of e.changedTouches) {
        if (t.identifier === dodgeJoyId) {
            dodgeJoyActive = false;
            dodgeJoyId = null;
            dodgeJoyDelta = { x: 0, y: 0 };
            dodgeJoyStick.style.transform = 'translate(-50%, -50%)';
        }
    }
}, { passive: false });

function updateDodgeJoy(cx, cy) {
    let dx = cx - dodgeJoyOrigin.x;
    let dy = cy - dodgeJoyOrigin.y;
    const dist = Math.hypot(dx, dy);
    if (dist > DODGE_JOY_RADIUS) {
        dx = (dx / dist) * DODGE_JOY_RADIUS;
        dy = (dy / dist) * DODGE_JOY_RADIUS;
    }
    dodgeJoyDelta.x = dx / DODGE_JOY_RADIUS;
    dodgeJoyDelta.y = dy / DODGE_JOY_RADIUS;
    dodgeJoyStick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}

// Expose dodge inputs for dodgeLoop
function getDodgeInput() {
    return {
        left:  (dodgeKeys['ArrowLeft']  || dodgeKeys['KeyA']  || (dodgeJoyActive && dodgeJoyDelta.x < -0.3)),
        right: (dodgeKeys['ArrowRight'] || dodgeKeys['KeyD']  || (dodgeJoyActive && dodgeJoyDelta.x >  0.3)),
        up:    (dodgeKeys['ArrowUp']    || dodgeKeys['KeyW']  || (dodgeJoyActive && dodgeJoyDelta.y < -0.3)),
        down:  (dodgeKeys['ArrowDown']  || dodgeKeys['KeyS']  || (dodgeJoyActive && dodgeJoyDelta.y >  0.3)),
    };
}

// ===== PAUSE TOGGLE =====
window.togglePause = function() {
    isPaused = !isPaused;
    const pauseScreen = document.getElementById('pause-screen');
    if (isPaused) { pauseScreen.style.display = 'flex'; }
    else          { pauseScreen.style.display = 'none'; }
};

// Tap on pause screen to resume (mobile)
document.getElementById('pause-screen').addEventListener('click', () => {
    isPaused = false;
    document.getElementById('pause-screen').style.display = 'none';
});

//const actionBtn = document.getElementById('action-btn');
//actionBtn.addEventListener('click', () => {
//    if (isPaused) handleNextStory();
//});

function updateActionBtn() {
    const storyVisible = document.getElementById('story-screen').style.display === 'flex';
    actionBtn.style.display = storyVisible ? 'block' : 'none';
}

document.getElementById('story-screen').addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') return;
    if (isPaused) handleNextStory();
});

// STORY SCREENS 
function showStoryScreen(type) {
    isPaused = true;
    storyMode = type;
    const screen = document.getElementById('story-screen');
    const img    = document.getElementById('story-img');
    const text   = document.getElementById('story-text');
    const footer = document.getElementById('story-footer');
    screen.style.zIndex = '300';

    let data;
    if (type === "intro") data = storyScenes[currentStoryIdx];
    else if (type === "key") data = keyCollectScenes[keysFound - 1];
    else if (type === "hidden_item") {
        let index = Math.min(hiddenItemsFound - 1, hiddenItemScenes.length - 1);
        data = hiddenItemScenes[index];
    }
    else if (type === "ending_bad") {
        img.src = "bg.png";
        text.innerText = "GAME OVER - BẠN ĐÃ BỊ KẸT LẠI MÃI MÃI TẠI UIT";
        footer.innerHTML = '<button class="retry-btn" onclick="location.reload()">CHƠI LẠI</button>';
        screen.style.display = 'flex';
        updateActionBtn();
        return;
    } else if (type === "ending_good") {
        bgMusic.pause();
        img.src = "bg.png";
        text.innerText = "CHÚC MỪNG! Bạn đã thật sự tìm được 4 mảnh ký ức, linh hồn của bạn trở nên mạnh mẽ hơn bao giờ hết và đã có thể giải thoát bạn khỏi đây!";
        footer.innerHTML = '<button class="retry-btn" style="background: green; border-color: lime;" onclick="showStoryScreen(\'plot_twist\')">Đến lúc thoát khỏi đây rồi</button>';
        screen.style.display = 'flex';
        updateActionBtn();
        return;
    } else if (type === "plot_twist") {
        img.src = "bg.png";
        bossMusic.play();
        text.innerText = "Không... Ngươi không thể rời đi, ta sẽ giữ ngươi lại, tất cả các ngươi đều phải ở lại đây.";
        footer.innerHTML = '<button class="retry-btn" onclick="startBossBattle()">Không, tao sẽ không bỏ cuộc!</button>';
        screen.style.display = 'flex';
        updateActionBtn();
        return;
    } else if (type === "extraending") {
        bgMusic.pause(); bossMusic.pause();
        img.src = "bg.png";
        text.innerText = "Chúc mừng bạn đã thoát khỏi ác mộng này, đến giờ tiếp tục làm đồ án rồi:))). Bạn không nghĩ là bạn thật sự sẽ thoát khỏi nó đấy chứ :))).";
        footer.innerHTML = `
            <div style="display:flex; gap:20px; align-items:center; justify-content:center; flex-wrap:wrap;">
                <button class="retry-btn" style="background: #003366; border-color: #0055cc;" onclick="location.reload()">CHƠI LẠI</button>
                <button id="memory-book-btn" onclick="openMemoryBook()" title="Xem lịch sử UIT">
                    <img src="images/uitlogo.png" alt="Ký Ức UIT" onerror="this.style.display='none'; this.parentNode.innerHTML='📖 UIT Gallery';">
                </button>
            </div>`;
        screen.style.display = 'flex';
        updateActionBtn();
        return;
    }

    img.src = data.img;
    text.innerText = data.text;
    footer.innerHTML = '(Bấm phím [J] hoặc chạm vào màn hình để tiếp tục)';
    screen.style.display = 'flex';
    updateActionBtn();
}

function handleNextStory() {
    if (storyMode === "intro") {
        currentStoryIdx++;
        if (currentStoryIdx < storyScenes.length) showStoryScreen("intro");
        else {
            document.getElementById('story-screen').style.display = 'none';
            isPaused = false;
            gameRunning = true;
            updateActionBtn();
        }
    } else if (storyMode === "key") {
        if (keysFound === 4) { showStoryScreen("ending_good"); }
        else {
            document.getElementById('story-screen').style.display = 'none';
            isPaused = false;
            updateActionBtn();
        }
    } else if (storyMode === "hidden_item") {
        document.getElementById('story-screen').style.display = 'none';
        isPaused = false;
        updateActionBtn();
    }
}

// ===== COLLISION =====
function isColliding(x, y, size, rX, rY) {
    const map = getMap(rX, rY);
    const points = [{x:x, y:y}, {x:x+size, y:y}, {x:x, y:y+size}, {x:x+size, y:y+size}];
    for (let p of points) {
        let c = Math.floor(p.x / TILE_SIZE), r = Math.floor(p.y / TILE_SIZE);
        if (map[r] && map[r][c] === 1) return true;
    }
    return false;
}

function canMoveTo(nextX, nextY) {
    const points = [
        { x: nextX, y: nextY },
        { x: nextX + player.size, y: nextY },
        { x: nextX, y: nextY + player.size },
        { x: nextX + player.size, y: nextY + player.size }
    ];
    const map = getMap(currentRoomX, currentRoomY);
    for (let p of points) {
        let col = Math.floor(p.x / TILE_SIZE);
        let row = Math.floor(p.y / TILE_SIZE);
        if (row < 0 || row >= ROWS || col < 0 || col >= COLS) continue;
        let tile = map[row][col];
        if (tile === 1) return false;
        if (tile === 4) {
            if (hopeCount > 5) return true;
        }
    }
    return true;
}

// ===== HELP =====
function toggleHelp() {
    const overlay = document.getElementById('help-overlay');
    overlay.classList.toggle('active');
    if (overlay.classList.contains('active')) {
        isPaused = true;
    } else {
        const storyVisible = document.getElementById('story-screen').style.display === 'flex';
        if (!storyVisible) isPaused = false;
    }
}
window.toggleHelp = toggleHelp;

// ===== KEYBOARD =====
const keysPressed = {};
window.onkeydown = (e) => {
    keysPressed[e.code] = true;
    if (isPaused && (e.code === 'KeyJ' || e.code === 'Enter')) handleNextStory();
    if (e.code === 'Escape') {
        const helpOverlay = document.getElementById('help-overlay');
        if (helpOverlay && helpOverlay.classList.contains('active')) {
            toggleHelp();
        } else {
            togglePause();
        }
    }
};
window.onkeyup = (e) => keysPressed[e.code] = false;

// ===== DOM READY =====
window.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            bgMusic.play().catch(() => {});
            document.getElementById('start-screen').style.display = 'none';
            showStoryScreen("intro");
        });
        startBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            bgMusic.play().catch(() => {});
            document.getElementById('start-screen').style.display = 'none';
            showStoryScreen("intro");
        }, { passive: false });
    }

    const respawnBtn = document.getElementById('respawn-btn');
    if (respawnBtn) {
        const doRespawn = () => {
            player.x = 400; player.y = 300;
            bgMusic.play().catch(() => {});
            enemies.forEach(enemy => enemy.respawn());
            isPaused = false;
            gameRunning = true;
            document.getElementById('respawn-container').style.display = 'none';
        };
        respawnBtn.onclick = doRespawn;
    }
});

// ===== JUMPSCARE =====
function triggerJumpscare() {
    bgMusic.pause();
    playSFX(sfxJumpscare);
    deathCount++;
    document.getElementById('death-count').innerText = deathCount;
    gameRunning = false;
    document.getElementById('jumpscare-overlay').style.setProperty('display', 'flex', 'important');
    document.getElementById('jumpscare-img').src = "nomon.gif";

    setTimeout(() => {
        document.getElementById('jumpscare-overlay').style.display = 'none';
        if (deathCount == 5) showStoryScreen("ending_bad");
        else {
            player.x = 400; player.y = 300;
            currentRoomX = 0; currentRoomY = 0;
            bgMusic.play().catch(() => {});
            gameRunning = true;
        }
    }, 1500);
}

// ===== UPDATE =====
function update(timeScale = 1) {
    if (!gameRunning || isPaused) return;

    let nx = player.x, ny = player.y;

    // Keyboard input
    const kUp    = keysPressed['KeyW'] || keysPressed['ArrowUp'];
    const kDown  = keysPressed['KeyS'] || keysPressed['ArrowDown'];
    const kLeft  = keysPressed['KeyA'] || keysPressed['ArrowLeft'];
    const kRight = keysPressed['KeyD'] || keysPressed['ArrowRight'];

    // Joystick input
    const jUp    = joystickActive && joystickDelta.y < -0.3;
    const jDown  = joystickActive && joystickDelta.y >  0.3;
    const jLeft  = joystickActive && joystickDelta.x < -0.3;
    const jRight = joystickActive && joystickDelta.x >  0.3;

    // Joystick analog movement
    if (joystickActive) {
        nx += joystickDelta.x * player.speed * timeScale;
        ny += joystickDelta.y * player.speed * timeScale;
    } else {
        if (kUp)    ny -= player.speed * timeScale;
        if (kDown)  ny += player.speed * timeScale;
        if (kLeft)  nx -= player.speed * timeScale;
        if (kRight) nx += player.speed * timeScale;
    }

    const _moving = kUp || kDown || kLeft || kRight || joystickActive;

    if (canMoveTo(nx, ny)) {
        player.x = nx;
        player.y = ny;
    } else {
        // Try sliding
        if (!isColliding(nx, player.y, player.size, currentRoomX, currentRoomY)) player.x = nx;
        if (!isColliding(player.x, ny, player.size, currentRoomX, currentRoomY)) player.y = ny;
    }

    if (_moving) {
        _footstepTimer++;
        if (_footstepTimer >= FOOTSTEP_INTERVAL) { _footstepTimer = 0; playFootstep(); }
    } else {
        _footstepTimer = 0;
    }

    // Room transitions
    if (player.x < -15) { currentRoomX--; player.x = 780; }
    else if (player.x > 790) { currentRoomX++; player.x = 10; }
    if (player.y < -15) { currentRoomY--; player.y = 580; }
    else if (player.y > 590) { currentRoomY++; player.y = 10; }

    // Item pickup
    const map = getMap(currentRoomX, currentRoomY);
    let pc = Math.floor((player.x + 12) / TILE_SIZE);
    let pr = Math.floor((player.y + 12) / TILE_SIZE);

    if (map[pr] && map[pr][pc] === 3) {
        map[pr][pc] = 0;
        keysFound++;
        document.getElementById('key-count').innerText = keysFound;
        playSFX(sfxPickupKey);
        showStoryScreen("key");
    }
    if (map[pr] && map[pr][pc] === 5) {
        map[pr][pc] = 0;
        hiddenItemsFound++;
        const countUI = document.getElementById('item-count');
        if (countUI) countUI.innerText = hiddenItemsFound;
        playSFX(sfxPickupItem);
        showStoryScreen("hidden_item");
    }

    // Enemy update & collision
    enemies.forEach(enemy => {
        enemy.update(player, currentRoomX, currentRoomY, keysFound, timeScale);
        if (currentRoomX === enemy.roomX && currentRoomY === enemy.roomY) {
            if (Math.hypot(player.x - enemy.x, player.y - enemy.y) < 25) {
                triggerJumpscare();
            }
        }
    });
}

// ===== DRAW =====
function draw() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, GAME_W, GAME_H);
    const map = getMap(currentRoomX, currentRoomY);
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (map[r][c] === 1) {
                if (wallImg.complete && wallImg.naturalWidth > 0) {
                    ctx.drawImage(wallImg, c*50, r*50, 50, 50);
                } else {
                    ctx.fillStyle = "#121212"; ctx.fillRect(c*50, r*50, 50, 50);
                }
            }
            if (map[r][c] === 3) {
                if (keyImg.complete && keyImg.naturalWidth > 0) {
                    ctx.drawImage(keyImg, c*50+5, r*50+5, 40, 40);
                } else {
                    ctx.fillStyle = "yellow"; ctx.beginPath(); ctx.arc(c*50+25, r*50+25, 10, 0, 7); ctx.fill();
                }
            }
            if (map[r][c] === 5) {
                if (hopeImg.complete && hopeImg.naturalWidth > 0) {
                    ctx.drawImage(hopeImg, c*50+8, r*50+8, 34, 34);
                } else {
                    ctx.fillStyle = "cyan"; ctx.beginPath(); ctx.arc(c*50+25, r*50+25, 8, 0, 7); ctx.fill();
                }
            }
        }
    }

    enemies.forEach(enemy => enemy.draw(ctx, currentRoomX, currentRoomY));
    ctx.fillStyle = "#007bff";
    ctx.fillRect(player.x, player.y, 25, 25);

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (map[r][c] === 4) {
                if (safeZoneImg.complete && safeZoneImg.naturalWidth > 0) {
                    ctx.drawImage(safeZoneImg, c*50, r*50, 50, 50);
                } else {
                    ctx.fillStyle = "rgba(0,200,0,0.7)"; ctx.fillRect(c*50, r*50, 50, 50);
                }
            }
        }
    }

    const grad = ctx.createRadialGradient(player.x+12, player.y+12, 50, player.x+12, player.y+12, 150);
    grad.addColorStop(0, "transparent");
    grad.addColorStop(1, "rgba(0,0,0,0.8)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_W, GAME_H);
}

// ===== DELTA TIME GAME LOOP =====
// Normalize to 60FPS so speed is consistent across all devices/refresh rates
let lastTime = 0;
const TARGET_FPS = 60;
const TARGET_FRAME_MS = 1000 / TARGET_FPS;

function loop(timestamp) {
    const rawDelta = timestamp - lastTime;
    lastTime = timestamp;
    // Clamp delta to avoid huge jumps (e.g. tab switching, phone sleep)
    const delta = Math.min(rawDelta, 100);
    const timeScale = delta / TARGET_FRAME_MS;
    update(timeScale);
    draw();
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ===== MEMORY BOOK =====
window.onload = () => { enemies.forEach(enemy => enemy.savePosition()); };

window.openMemoryBook = function() {
    const overlay = document.getElementById('memory-book-overlay');
    const body    = document.getElementById('memory-book-body');
    body.innerHTML = hiddenItemScenes.map((scene) => `
        <div class="memory-entry">
            <span class="memory-year">${scene.text.split(':')[0]}</span>
            <p>${scene.text.split(':').slice(1).join(':').trim()}</p>
        </div>
    `).join('');
    overlay.classList.add('active');
};
window.closeMemoryBook = function() {
    document.getElementById('memory-book-overlay').classList.remove('active');
};

// ===== BOSS BATTLE =====
let battleHP = 100, bossHP = 200;
let isPlayerTurn = false;
let battleCanvas, battleCtx;
let battlePhase = 'menu';
let soul = { x: 200, y: 200, size: 12, speed: 4 };
let bullets = [];
let dodgeTimer = 0, dodgeDuration = 0, dodgeDamage = 0;
let dodgeKeys = {};
let dodgeActive = false;
let bossPhaseIndex = 0;
let displayBossHP = 200, displayPlayerHP = 100;

const BATTLE_W = 800, BATTLE_H = 600;
const DODGE_BOX = { x: 250, y: 250, w: 300, h: 180 };

let isTyping = false, skipDialog = false;

// Mobile: show skip button while typing
function updateSkipBtn(show) {
    const btn = document.getElementById('skip-dialog-btn');
    if (btn) btn.style.display = show ? 'block' : 'none';
}

window.skipCurrentDialog = function() { skipDialog = true; };

document.addEventListener('keydown', (e) => {
    dodgeKeys[e.code] = true;
    if ((e.code === 'KeyJ' || e.code === 'Enter' || e.code === 'NumpadEnter') && isTyping) {
        skipDialog = true;
    }
});
document.addEventListener('keyup', e => { dodgeKeys[e.code] = false; });

function typeDialog(text) {
    return new Promise((resolve) => {
        const dialogueBox = document.getElementById('dialogue-box');
        const dialogEl    = document.getElementById('dialog-text');
        if (!dialogEl || !dialogueBox) { resolve(); return; }

        dialogueBox.style.display = 'block';
        dialogEl.innerHTML = '';
        isTyping = true;
        skipDialog = false;
        updateSkipBtn(true);

        let i = 0;

        function finishDialog() {
            isTyping = false;
            updateSkipBtn(false);
            setTimeout(() => { dialogueBox.style.display = 'none'; resolve(); }, 300);
        }

        function typeNextChar() {
            if (skipDialog) { dialogEl.innerHTML = text; finishDialog(); return; }
            if (i < text.length) { dialogEl.innerHTML += text.charAt(i); i++; setTimeout(typeNextChar, 30); }
            else { finishDialog(); }
        }
        typeNextChar();
    });
}

function typeDialogAutoAdvance(text, holdMs = 1500) {
    return new Promise((resolve) => {
        const dialogueBox = document.getElementById('dialogue-box');
        const dialogEl    = document.getElementById('dialog-text');
        if (!dialogEl || !dialogueBox) { resolve(); return; }

        dialogueBox.style.display = 'block';
        dialogEl.innerHTML = '';
        let i = 0;

        function typeNextChar() {
            if (i < text.length) { dialogEl.innerHTML += text.charAt(i); i++; setTimeout(typeNextChar, 30); }
            else { setTimeout(resolve, holdMs); }
        }
        typeNextChar();
    });
}

async function playBossEndingDialogues() {
    for (let i = 0; i < bossEndingDialogues.length; i++) {
        const line   = bossEndingDialogues[i];
        const holdMs = line.pause > 0 ? line.pause : 1500;
        await typeDialogAutoAdvance(line.text, holdMs);
    }
    const dialogueBox = document.getElementById('dialogue-box');
    if (dialogueBox) dialogueBox.style.display = 'none';
}

function spawnBullets(pattern) {
    bullets = [];
    if (pattern === 'rain') {
        for (let i = 0; i < 8 + bossPhaseIndex * 3; i++) {
            bullets.push({
                x: DODGE_BOX.x + Math.random() * DODGE_BOX.w,
                y: DODGE_BOX.y - 10,
                vx: (Math.random() - 0.5) * 2,
                vy: 2 + bossPhaseIndex * 0.8 + Math.random() * 1.5,
                size: 8, color: 'red', shape: 'circle'
            });
        }
    } else if (pattern === 'spiral') {
        let cx = DODGE_BOX.x + DODGE_BOX.w/2;
        let cy = DODGE_BOX.y + DODGE_BOX.h/2;
        for (let i = 0; i < 12; i++) {
            let angle = (i / 12) * Math.PI * 2;
            bullets.push({
                x: cx, y: cy,
                vx: Math.cos(angle) * (2.5 + bossPhaseIndex),
                vy: Math.sin(angle) * (2.5 + bossPhaseIndex),
                size: 7, color: '#ff6600', shape: 'circle'
            });
        }
    } else if (pattern === 'wall') {
        let gapY = DODGE_BOX.y + 30 + Math.random() * (DODGE_BOX.h - 60);
        for (let y = DODGE_BOX.y; y < DODGE_BOX.y + DODGE_BOX.h; y += 22) {
            if (Math.abs(y - gapY) > 28) {
                bullets.push({
                    x: DODGE_BOX.x - 10, y,
                    vx: 3.5 + bossPhaseIndex * 0.7, vy: 0,
                    size: 9, color: '#cc00ff', shape: 'square'
                });
            }
        }
    } else if (pattern === 'aimed') {
        let cx = DODGE_BOX.x + DODGE_BOX.w/2;
        let count = 5 + bossPhaseIndex * 2;
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                if (!dodgeActive) return;
                let dx = soul.x - cx, dy = soul.y - (DODGE_BOX.y - 20);
                let d = Math.hypot(dx, dy) || 1;
                let spread = (Math.random() - 0.5) * 1.2;
                bullets.push({
                    x: cx + (Math.random() - 0.5)*80, y: DODGE_BOX.y - 10,
                    vx: (dx/d)*3 + spread, vy: (dy/d)*3 + Math.abs(spread),
                    size: 8, color: '#ff0055', shape: 'circle'
                });
            }, i * 220);
        }
    }
}

function getBattleCanvas() {
    if (!battleCanvas) {
        battleCanvas = document.createElement('canvas');
        battleCanvas.width  = BATTLE_W;
        battleCanvas.height = BATTLE_H;
        battleCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;';
        document.getElementById('battle-screen').appendChild(battleCanvas);
        battleCtx = battleCanvas.getContext('2d');
    }
    return battleCtx;
}

function updateBossPhase() {
    if (bossHP <= 50) bossPhaseIndex = 2;
    else if (bossHP <= 100) bossPhaseIndex = 1;
    else bossPhaseIndex = 0;
}

let hpAnimId;
function animateHP() {
    if (hpAnimId) cancelAnimationFrame(hpAnimId);
    let isAnimating = false;
    if (displayBossHP > bossHP) { displayBossHP = Math.max(bossHP, displayBossHP - 2.5); isAnimating = true; }
    if (displayPlayerHP > battleHP) { displayPlayerHP = Math.max(battleHP, displayPlayerHP - 1.5); isAnimating = true; }
    else if (displayPlayerHP < battleHP) { displayPlayerHP = Math.min(battleHP, displayPlayerHP + 1.5); isAnimating = true; }

    const bossFill   = document.getElementById('boss-hp-bar-fill');
    const playerFill = document.getElementById('player-hp-bar-fill');
    if (bossFill)   bossFill.style.width   = Math.max(0, (displayBossHP/200)*100) + '%';
    if (playerFill) playerFill.style.width = Math.max(0, (displayPlayerHP/100)*100) + '%';

    const pNum = document.getElementById('player-hp');
    const bNum = document.getElementById('boss-hp');
    if (pNum) pNum.innerText = Math.ceil(displayPlayerHP);
    if (bNum) bNum.innerText = Math.ceil(displayBossHP);

    if (isAnimating) hpAnimId = requestAnimationFrame(animateHP);
}

function dodgeLoop(timestamp) {
    if (battlePhase !== 'dodge') return;
    if (!dodgeActive) return;

    // Delta time for dodge loop
    if (!dodgeLoop._lastTime) dodgeLoop._lastTime = timestamp;
    const rawDelta = timestamp - dodgeLoop._lastTime;
    dodgeLoop._lastTime = timestamp;
    const dScale = Math.min(rawDelta, 100) / TARGET_FRAME_MS;

    const bctx = getBattleCanvas();
    bctx.clearRect(0, 0, BATTLE_W, BATTLE_H);
    bctx.strokeStyle = 'white'; bctx.lineWidth = 3;
    bctx.strokeRect(DODGE_BOX.x, DODGE_BOX.y, DODGE_BOX.w, DODGE_BOX.h);

    let progress = Math.max(0, dodgeTimer / (dodgeDuration/1000));
    bctx.fillStyle = '#333';
    bctx.fillRect(DODGE_BOX.x, DODGE_BOX.y + DODGE_BOX.h + 8, DODGE_BOX.w, 8);
    bctx.fillStyle = progress > 0.3 ? '#00ff88' : '#ff4400';
    bctx.fillRect(DODGE_BOX.x, DODGE_BOX.y + DODGE_BOX.h + 8, DODGE_BOX.w * progress, 8);
    bctx.fillStyle = '#aaa'; bctx.font = '13px Courier New';
    bctx.fillText('DODGE!', DODGE_BOX.x + 4, DODGE_BOX.y - 8);

    // Use getDodgeInput for both keyboard & touch
    const di = getDodgeInput();
    if (di.left)  soul.x -= soul.speed * dScale;
    if (di.right) soul.x += soul.speed * dScale;
    if (di.up)    soul.y -= soul.speed * dScale;
    if (di.down)  soul.y += soul.speed * dScale;

    // Analog dodge from joystick
    if (dodgeJoyActive) {
        soul.x += dodgeJoyDelta.x * soul.speed * dScale;
        soul.y += dodgeJoyDelta.y * soul.speed * dScale;
    }

    soul.x = Math.max(DODGE_BOX.x + soul.size, Math.min(DODGE_BOX.x + DODGE_BOX.w - soul.size, soul.x));
    soul.y = Math.max(DODGE_BOX.y + soul.size, Math.min(DODGE_BOX.y + DODGE_BOX.h - soul.size, soul.y));

    let hitThisFrame = false;
    bullets = bullets.filter(b => {
        b.x += b.vx * dScale; b.y += b.vy * dScale;
        if (b.x < DODGE_BOX.x-20 || b.x > DODGE_BOX.x+DODGE_BOX.w+20 ||
            b.y < DODGE_BOX.y-20 || b.y > DODGE_BOX.y+DODGE_BOX.h+20) return false;

        bctx.fillStyle = b.color;
        if (b.shape === 'square') {
            bctx.fillRect(b.x - b.size/2, b.y - b.size/2, b.size, b.size);
        } else {
            bctx.beginPath(); bctx.arc(b.x, b.y, b.size/2, 0, Math.PI*2); bctx.fill();
        }
        if (!hitThisFrame && soul._hitFlash <= 0 && Math.hypot(b.x - soul.x, b.y - soul.y) < (b.size/2 + soul.size/2 - 2)) {
            hitThisFrame = true;
            soul._hitFlash = 40;
        }
        return true;
    });

    if (hitThisFrame) {
        battleHP = Math.max(0, battleHP - 5 * dodgeDamage);
        playPlayerHitSFX();
        animateHP();
    }

    bctx.save();
    if (soul._hitFlash > 0) soul._hitFlash--;
    const soulColor = (soul._hitFlash > 0 && Math.floor(soul._hitFlash/4) % 2 === 0) ? 'white' : '#007bff';
    bctx.fillStyle = soulColor;
    bctx.fillRect(soul.x - soul.size/2, soul.y - soul.size/2, soul.size, soul.size);
    bctx.restore();

    dodgeTimer -= (1/60) * dScale;
    if (dodgeTimer <= 0 || battleHP <= 0) {
        dodgeActive = false;
        dodgeLoop._lastTime = 0;
        battleCtx.clearRect(0, 0, BATTLE_W, BATTLE_H);
        bullets = [];
        // Hide dodge joystick
        dodgeJoyContainer.style.display = 'none';
        showBattleMenu(true);
        endDodgePhase();
    } else {
        requestAnimationFrame(dodgeLoop);
    }
}

async function endDodgePhase() {
    battlePhase = 'menu';
    dodgeActive = false;
    bullets = [];
    if (battleCtx) battleCtx.clearRect(0, 0, BATTLE_W, BATTLE_H);
    // Ẩn dodge joystick
    dodgeJoyContainer.style.display = 'none';

    if (battleHP <= 0) {
        showBattleMenu(false);
        await typeDialog("* Cơ thể bạn gục xuống...");
        document.getElementById('battle-screen').style.setProperty('display', 'none', 'important');
        showStoryScreen('ending_bad');
        return;
    }
    // Hiện lại battle-screen nếu bị ẩn
    const bs = document.getElementById('battle-screen');
    if (bs.style.display === 'none' || bs.style.display === '') {
        bs.style.setProperty('display', 'flex', 'important');
    }
    showBattleMenu(true);
    await typeDialog("* Quái vật đang lườm bạn...");
    isPlayerTurn = true;
}

function showBattleMenu(show) {
    const menu = document.querySelector('.battle-menu');
    if (!menu) return;
    menu.style.visibility = show ? 'visible' : 'hidden';
    menu.style.pointerEvents = show ? 'auto' : 'none';
}

async function startDodgePhase(damage, duration, patterns) {
    battlePhase = 'dodge';
    dodgeDamage  = damage;
    dodgeTimer   = duration;
    dodgeDuration = duration * 1000;
    dodgeActive  = true;

    soul.x = DODGE_BOX.x + DODGE_BOX.w / 2;
    soul.y = DODGE_BOX.y + DODGE_BOX.h / 2;
    soul._hitFlash = 0;
    bullets = [];

    // Show dodge joystick on touch devices
    if (window.matchMedia('(pointer: coarse)').matches) {
        dodgeJoyContainer.style.display = 'block';
        // Reset stick position
        dodgeJoyStick.style.transform = 'translate(-50%, -50%)';
        dodgeJoyActive = false; dodgeJoyDelta = { x: 0, y: 0 };
    }

    for (let i = 0; i < patterns.length; i++) {
        setTimeout(() => { if (dodgeActive) spawnBullets(patterns[i]); }, i * (duration * 1000 / patterns.length));
    }

    const phaseIntros = [
        `* Ta sẽ dạy ngươi ý nghĩa của "Trượt Môn"!`,
        `* Ngươi nghĩ ngươi đã cứng đủ? Thử cái này!`,
        `* ĐỦ RỒI! TA SẼ NGHIỀN NÁT NGƯƠI!`
    ];
    await typeDialog(phaseIntros[bossPhaseIndex] || phaseIntros[2]);
    getBattleCanvas();
    requestAnimationFrame(dodgeLoop);
}

let hopeisused = false;

window.battleAction = async function(action) {
    if (!isPlayerTurn) return;
    isPlayerTurn = false;

    if (action === 'FIGHT') {
        let dmg = Math.floor(Math.random() * 20) + 15 + (bossPhaseIndex === 2 ? 5 : 0);
        bossHP = Math.max(0, bossHP - dmg);
        updateBossPhase();
        playBossHitSFX();
        const bossImg = document.querySelector('.battle-scene img');
        if (bossImg) {
            bossImg.style.filter = 'drop-shadow(0 0 10px red) brightness(3)';
            setTimeout(() => bossImg.style.filter = 'drop-shadow(0 0 10px red)', 300);
        }
        await typeDialog(`* Dùng chính sự quyết tâm ${bossPhaseIndex >= 1 ? 'và tức giận ' : ''}của mình, bạn gây ${dmg} sát thương!`);
    }
    else if (action === 'HOPE') {
        if (hiddenItemsFound > 0 && !hopeisused) {
            let dmg = hiddenItemsFound * 10;
            bossHP = Math.max(0, bossHP - dmg);
            hopeisused = true;
            updateBossPhase();
            playHopeSFX();
            await typeDialog(`* ${hiddenItemsFound} mảnh ký ức bùng sáng! UIT cộng hưởng với bạn — Boss nhận ${dmg} sát thương KHỔNG lồ!`);
        } else if (hopeisused) {
            await typeDialog(`* Bạn đã dùng hết những ký ức đó rồi... nhưng chúng vẫn sống trong tim bạn.`);
            let heal = 10; battleHP = Math.min(100, battleHP + heal); animateHP();
        } else {
            await typeDialog(`* Bạn cầu cứu... nhưng không có ai. (Hãy thu thập mảnh Hy Vọng trước!)`);
        }
    }
    else if (action === 'DREAM') {
        let heal = bossPhaseIndex === 2 ? 15 : 30;
        battleHP = Math.min(100, battleHP + heal);
        animateHP(); playHealSFX();
        await typeDialog(`* Bạn nhắm mắt hồi tưởng về những ngày tháng tươi đẹp ở UIT... hồi ${heal} HP.`);
    }
    else if (action === 'ESCAPE') {
        await typeDialog(`* Bỏ cuộc ư?! Kẻ không đủ quyết tâm KHÔNG ĐÁNG được tốt nghiệp!!`);
    }

    animateHP();

    if (bossHP <= 0) {
        bossMusic.pause();
        playVictorySFX();
        if (battleCanvas) { battleCanvas.remove(); battleCanvas = null; }
        showBattleMenu(false);
        await playBossEndingDialogues();
        // Ẩn battle screen TRƯỚC khi hiện story screen
        document.getElementById('battle-screen').style.setProperty('display', 'none', 'important');
        // Đảm bảo dodge joystick ẩn
        dodgeJoyContainer.style.display = 'none';
        showStoryScreen('extraending');
        return;
    }

    const patterns = {
        0: [['rain'], ['aimed'], ['rain', 'aimed']],
        1: [['spiral'], ['wall'], ['aimed', 'wall']],
        2: [['spiral', 'aimed'], ['wall', 'rain'], ['spiral', 'wall', 'aimed']]
    };
    const pSet = patterns[bossPhaseIndex];
    const chosenPattern = pSet[Math.floor(Math.random() * pSet.length)];
    const dodgeDur = 4 + bossPhaseIndex * 1.5;

    showBattleMenu(false);
    await startDodgePhase(bossPhaseIndex === 2 ? 8 : (bossPhaseIndex === 1 ? 5 : 3), dodgeDur, chosenPattern);
};

const defeatedBosses = new Set();

window.startBossBattle = function() {
    bgMusic.pause(); bgMusic.currentTime = 0;
    document.getElementById('story-screen').style.display = 'none';
    isPaused = true; gameRunning = false;

    battleHP = 100; bossHP = 200;
    displayBossHP = 200; displayPlayerHP = 100;
    bossPhaseIndex = 0; isPlayerTurn = false; hopeisused = false;

    const battleScreen = document.getElementById('battle-screen');
    battleScreen.style.setProperty("display", "flex", "important");

    if (!document.getElementById('boss-hp-bar-fill')) {
        const stats = document.querySelector('.battle-stats');
        stats.innerHTML = `
            <div style="width:48%;">
                <div style="margin-bottom:4px;">Bạn - HP: <span id="player-hp" style="color:lime;">100</span>/100</div>
                <div style="background:#333;height:12px;border:1px solid #fff;border-radius:2px;">
                    <div id="player-hp-bar-fill" style="height:100%;width:100%;background:lime;border-radius:2px;transition:width 0.3s;"></div>
                </div>
            </div>
            <div style="width:48%;">
                <div style="margin-bottom:4px;">UIT?!?! - HP: <span id="boss-hp" style="color:red;">200</span>/200</div>
                <div style="background:#333;height:12px;border:1px solid #fff;border-radius:2px;">
                    <div id="boss-hp-bar-fill" style="height:100%;width:100%;background:#ff4444;border-radius:2px;transition:width 0.3s;"></div>
                </div>
            </div>`;
    }

    showBattleMenu(false);
    const bossImg = document.querySelector('.battle-scene img');
    if (bossImg) bossImg.style.opacity = '0';

    const introOverlay = document.getElementById('boss-intro-overlay');
    const introGif     = document.getElementById('boss-intro-gif');
    const introFlash   = document.getElementById('boss-intro-flash');
    introGif.src = ''; introGif.src = 'Scenes/entrance.gif';
    bossMusic.play();
    introOverlay.classList.add('active');

    setTimeout(() => {
        introFlash.classList.add('flash');
        battleScreen.style.animation = 'bossShakeIntro 0.5s ease-out';
        setTimeout(() => { battleScreen.style.animation = ''; }, 500);
    }, 100);

    setTimeout(() => {
        introOverlay.style.transition = 'opacity 0.5s ease';
        introOverlay.style.opacity = '0';
        setTimeout(() => {
            introOverlay.classList.remove('active');
            introOverlay.style.opacity = '';
            introFlash.classList.remove('flash');
            if (bossImg) {
                bossImg.style.transition = 'opacity 0.4s ease';
                bossImg.style.opacity = '1';
            }
            typeDialog("* ...Mày nghĩ lấy đủ 4 chìa khóa là thoát được sao?").then(() => {
                return new Promise(r => setTimeout(r, 800));
            }).then(() => {
                return typeDialog("* TA là UIT. Ta trường tồn. Và ngươi... sẽ ở lại đây MÃI MÃI.");
            }).then(() => {
                showBattleMenu(true);
                isPlayerTurn = true;
            });
        }, 500);
    }, 2500);
};