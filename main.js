const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800; 
canvas.height = 600;

// Preload tile images
const wallImg = new Image();
wallImg.src = 'images/wall.png';
const safeZoneImg = new Image();
safeZoneImg.src = 'images/safezone.png';
const keyImg = new Image();
keyImg.src = 'images/key.png';
const hopeImg = new Image();
hopeImg.src = 'images/hope.png';

let gameRunning = false;
let isPaused = false;
let keysFound = 0;
let deathCount = 0;
let currentRoomX = 0;
let currentRoomY = 0;
let hiddenItemsFound = 0;
let hopeCount = 0
const player = { x: 400, y: 300, size: 25, speed: 3.2 };

const enemies = [
    new RedEnemy(50, 50, 2),        // Đỏ: Theo dõi sát sao
    new GreenEnemy(200, 200, 1.5),  // Xanh: Di chuyển ngẫu nhiên
    new PinkEnemy(600, 400, 1.8)    // Hồng: Bảo vệ
];enemies[1].roomX = 1; enemies[1].roomY = 0; 
enemies[2].roomX = 0; enemies[2].roomY = 1;

let currentStoryIdx = 0;
let storyMode = "intro";
const bgMusic = new Audio('bgm.wav');
bgMusic.loop = true; // Lặp lại nhạc nền
bgMusic.volume = 0.5; // Điều chỉnh âm lượng (0.0 đến 1.0)

const bossMusic = new Audio('LastChance42.wav');
bossMusic.loop = true;
bossMusic.volume = 0.6;

// ===== SFX =====
const sfxPickupKey  = new Audio('sfx_key.mp3');      // Nhặt chìa khóa
sfxPickupKey.volume  = 0.8;
const sfxPickupItem = new Audio('sfx_item.mp3');     // Nhặt vật phẩm ẩn
sfxPickupItem.volume = 0.7;
const sfxJumpscare  = new Audio('sfx_jumpscare.mp3'); // Jumpscare
sfxJumpscare.volume  = 1.0;

// Footstep tổng hợp bằng Web Audio API (không cần file âm thanh)
let _audioCtx = null;
let _isMoving = false;
let _footstepTimer = 0;
const FOOTSTEP_INTERVAL = 18; // frames giữa 2 bước chân (~0.3s ở 60fps)

function getAudioCtx() {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return _audioCtx;
}

function playFootstep() {
    try {
        const ac = getAudioCtx();
        const osc  = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(110 + Math.random() * 50, ac.currentTime);
        osc.frequency.exponentialRampToValueAtTime(55, ac.currentTime + 0.09);
        gain.gain.setValueAtTime(0.12, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1);
        osc.start(ac.currentTime);
        osc.stop(ac.currentTime + 0.1);
    } catch(e) {}
}

function playSFX(audio) {
    try { audio.currentTime = 0; audio.play().catch(() => {}); } catch(e) {}
}

function showStoryScreen(type) {
    isPaused = true;
    storyMode = type;
    const screen = document.getElementById('story-screen');
    const img = document.getElementById('story-img');
    const text = document.getElementById('story-text');
    const footer = document.getElementById('story-footer');
    const pause = document.getElementById('pause-screen');

    let data;
    if (type === "intro") data = storyScenes[currentStoryIdx];
    else if (type === "key") data = keyCollectScenes[keysFound - 1];
    else if (type === "hidden_item") {
        let index = Math.min(hiddenItemsFound - 1, hiddenItemScenes.length - 1);
        data = hiddenItemScenes[index];
    }
    else if (type === "ending_bad") {
        img.src = "https://images.unsplash.com/photo-1601513445498-5dbffc8d5d40?q=80&w=800";
        text.innerText = "GAME OVER - BẠN ĐÃ BỊ KẸT LẠI MÃI MÃI TẠI UIT";
        footer.innerHTML = '<button class="retry-btn" onclick="location.reload()">CHƠI LẠI</button>';
        screen.style.display = 'flex';
        return;
    }  else if (type === "ending_good") {
        bgMusic.pause();
        img.src = "https://www.uit.edu.vn/_next/image?url=https%3A%2F%2Fwww.uit.edu.vn%2Fstrapi%2Fuploads%2FUIT_1_e406b7e283.jpg&w=1536&q=75";
        text.innerText = "CHÚC MỪNG! Bạn đã thật sự tìm được 4 mạnh ký ức, linh hồn của bạn trở nên mạnh mẽ hơn bao giờ hết và đã có thể giải thoát bạn khỏi đây!";
        footer.innerHTML = '<button class="retry-btn" style="background: green; border-color: lime;" onclick="showStoryScreen(\'plot_twist\')">LÊN NHẬN BẰNG</button>';
        screen.style.display = 'flex';
        return;
    } else if (type === "plot_twist") {
        img.src = "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=800"; 
        bossMusic.play();
        text.innerText = "Không... Ngươi không thể rời đi, ta sẽ giữ ngươi lại, tât cả các ngươi đều phải ở lại đây.";
        footer.innerHTML = '<button class="retry-btn" onclick="startBossBattle()">Không, tao sẽ không bỏ cuộc!</button>';
        screen.style.display = 'flex';
        return;
    }


    img.src = data.img;
    text.innerText = data.text;
    screen.style.display = 'flex';
}

function handleNextStory() {
    if (storyMode === "intro") {
        currentStoryIdx++;
        if (currentStoryIdx < storyScenes.length) showStoryScreen("intro");
        else {
            document.getElementById('story-screen').style.display = 'none';
            isPaused = false;
            gameRunning = true;
        }
    } else if (storyMode === "key") {
        if (keysFound === 4) {
            showStoryScreen("ending_good");
        } else {
            document.getElementById('story-screen').style.display = 'none';
            isPaused = false;
        }
    }
    else if (storyMode === "hidden_item") {
        document.getElementById('story-screen').style.display = 'none';
        isPaused = false;
    }
}

function isColliding(x, y, size, rX, rY) {
    const map = getMap(rX, rY);
    const points = [{x:x, y:y}, {x:x+size, y:y}, {x:x, y:y+size}, {x:x+size, y:y+size}];
    for (let p of points) {
        let c = Math.floor(p.x / TILE_SIZE), r = Math.floor(p.y / TILE_SIZE);
        if (map[r] && map[r][c] === 1) return true;
    }
    return false;
}

// ===== HELP OVERLAY =====
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

// Input Xử lý mượt mà
const keysPressed = {};
window.onkeydown = (e) => {
    keysPressed[e.code] = true;
    if (isPaused && (e.code === 'KeyJ'||e.code === 'Enter')) handleNextStory();
    // Phím ? để mở/đóng help
    if (e.code === 'Slash' && e.shiftKey) toggleHelp();
    // ESC đóng help overlay nếu đang mở
    if (e.code === 'Escape') {
        const helpOverlay = document.getElementById('help-overlay');
        if (helpOverlay && helpOverlay.classList.contains('active')) {
            toggleHelp();
        }
    }
};
window.onkeyup = (e) => keysPressed[e.code] = false;

// ============================================================
//  GẮN SỰ KIỆN GIAO DIỆN CHUẨN
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
    // Xử lý nút Start
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.onclick = () => {
            bgMusic.play().catch(() => {});
            document.getElementById('start-screen').style.display = 'none';
            showStoryScreen("intro");
        };
    }

    // Xử lý nút Chơi lại khi chết
    const respawnBtn = document.getElementById('respawn-btn');
    if (respawnBtn) {
        respawnBtn.onclick = () => {
            player.x = 400;
            player.y = 300;
            bgMusic.play().catch(() => {});
            enemies.forEach(enemy => enemy.respawn());
            isPaused = false;
            gameRunning = true;
            document.getElementById('respawn-container').style.display = 'none';
        };
    }
});

function triggerJumpscare() {
    bgMusic.pause();
    playSFX(sfxJumpscare);   // SFX jumpscare
    deathCount++;
    document.getElementById('death-count').innerText = deathCount;
    gameRunning = false;
    document.getElementById('jumpscare-overlay').style.display = 'block';
    
    document.getElementById('jumpscare-img').src = "nomon.gif"; 

    setTimeout(() => {
        document.getElementById('jumpscare-overlay').style.display = 'none';
        if (deathCount == 5) showStoryScreen("ending_bad");
        else {
            player.x = 400; player.y = 300;
            currentRoomX = 0; currentRoomY = 0;
            bgMusic.play().catch(() => {}); // Tiếp tục nhạc sau jumpscare
            gameRunning = true;
        }
    }, 1500);
}

function update() {
    if (!gameRunning || isPaused) return;

    let nx = player.x, ny = player.y;
    const _moving = (keysPressed['KeyW'] || keysPressed['ArrowUp'] ||
                     keysPressed['KeyS'] || keysPressed['ArrowDown'] ||
                     keysPressed['KeyA'] || keysPressed['ArrowLeft'] ||
                     keysPressed['KeyD'] || keysPressed['ArrowRight']);
    if ((keysPressed['KeyW'] || keysPressed['ArrowUp']) ) ny -= player.speed;
    if ((keysPressed['KeyS'] || keysPressed['ArrowDown']) ) ny += player.speed;
    if ((keysPressed['KeyA'] || keysPressed['ArrowLeft']) ) nx -= player.speed;
    if ((keysPressed['KeyD'] || keysPressed['ArrowRight']) ) nx += player.speed;
    if (canMoveTo(nx, ny)) {
        player.x = nx;
        player.y = ny;
    }

    // Footstep SFX
    if (_moving) {
        _footstepTimer++;
        if (_footstepTimer >= FOOTSTEP_INTERVAL) {
            _footstepTimer = 0;
            playFootstep();
        }
    } else {
        _footstepTimer = 0;
    }

    if (keysPressed['KeyP']) 
   showStoryScreen("ending_good");
    
    if (!isColliding(player.x, ny, player.size, currentRoomX, currentRoomY)) player.y = ny;
    if (!isColliding(nx, player.y, player.size, currentRoomX, currentRoomY)) player.x = nx;

    if (player.x < -15) { currentRoomX--; player.x = 780; }
    else if (player.x > 790) { currentRoomX++; player.x = 10; }
    if (player.y < -15) { currentRoomY--; player.y = 580; }
    else if (player.y > 590) { currentRoomY++; player.y = 10; }

    const map = getMap(currentRoomX, currentRoomY);
    let pc = Math.floor((player.x + 12)/TILE_SIZE), pr = Math.floor((player.y + 12)/TILE_SIZE);
    
    // Nhặt chìa khóa
    if (map[pr] && map[pr][pc] === 3) {
        map[pr][pc] = 0;
        keysFound++;
        const countUI = document.getElementById('key-count');   
        document.getElementById('key-count').innerText = keysFound;
        if (countUI) countUI.innerText = keysFound;
        playSFX(sfxPickupKey);   // SFX nhặt chìa khóa
        showStoryScreen("key"); 
    }
    if (map[pr] && map[pr][pc] === 5) {
        map[pr][pc] = 0;
        hiddenItemsFound++;
        const countUI = document.getElementById('item-count');
        if (countUI) countUI.innerText = hiddenItemsFound;
        playSFX(sfxPickupItem);  // SFX nhặt vật phẩm ẩn
        showStoryScreen("hidden_item"); 
    }
    enemies.forEach(enemy => {
        enemy.update(player, currentRoomX, currentRoomY, keysFound);
        
        if (currentRoomX === enemy.roomX && currentRoomY === enemy.roomY) {
            if (Math.hypot(player.x - enemy.x, player.y - enemy.y) < 25) {
                triggerJumpscare();
            }
        }
    });
}


function resumeGame() {
    
    if(keysPressed['ESCAPE']) {
    isPaused = false;
    document.getElementById('pause-screen').style.display = 'none';
}}
function draw() {
    ctx.fillStyle = "#000"; ctx.fillRect(0,0,800,600);
    const map = getMap(currentRoomX, currentRoomY);
    for(let r=0; r<ROWS; r++){
        for(let c=0; c<COLS; c++){
            if(map[r][c]===1) {
                if(wallImg.complete && wallImg.naturalWidth > 0) {
                    ctx.drawImage(wallImg, c*50, r*50, 50, 50);
                } else {
                    ctx.fillStyle="#121212"; ctx.fillRect(c*50, r*50, 50, 50);
                }
            }
            if(map[r][c]===3) {
                if(keyImg.complete && keyImg.naturalWidth > 0) {
                    ctx.drawImage(keyImg, c*50+5, r*50+5, 40, 40);
                } else {
                    ctx.fillStyle="yellow"; ctx.beginPath(); ctx.arc(c*50+25, r*50+25, 10, 0, 7); ctx.fill();
                }
            }
            if(map[r][c]===5) {
                if(hopeImg.complete && hopeImg.naturalWidth > 0) {
                    ctx.drawImage(hopeImg, c*50+8, r*50+8, 34, 34);
                } else {
                    ctx.fillStyle="cyan"; ctx.beginPath(); ctx.arc(c*50+25, r*50+25, 8, 0, 7); ctx.fill();
                }
            }
        }
    }
    
    // Gọi hàm vẽ Enemy
  enemies.forEach(enemy => enemy.draw(ctx, currentRoomX, currentRoomY));
    
    // Vẽ Player
    ctx.fillStyle = "#007bff"; ctx.fillRect(player.x, player.y, 25, 25);

    // Vẽ SafeZone (tile 4) SAU player để đè lên trên
    for(let r=0; r<ROWS; r++){
        for(let c=0; c<COLS; c++){
            if(map[r][c]===4) {
                if(safeZoneImg.complete && safeZoneImg.naturalWidth > 0) {
                    ctx.drawImage(safeZoneImg, c*50, r*50, 50, 50);
                } else {
                    ctx.fillStyle="rgba(0,200,0,0.7)"; ctx.fillRect(c*50, r*50, 50, 50);
                }
            }
        }
    }

    // Sương mù (Vignette effect)
    const grad = ctx.createRadialGradient(player.x+12, player.y+12, 50, player.x+12, player.y+12, 150);
    grad.addColorStop(0, "transparent"); grad.addColorStop(1, "rgba(0,0,0,0.8)");
    ctx.fillStyle = grad; ctx.fillRect(0,0,800,600);
}



// gameLoop(), updatePlayer(), updateEnemies(), renderGame() đã được gộp vào loop() + update() + draw() bên dưới
// để tránh chạy 2 vòng lặp song song và tránh gọi bgMusic.play() mỗi frame

function loop() { 
    update(); 
    draw(); 
    requestAnimationFrame(loop); 
}

// Chạy vòng lặp
loop();

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        isPaused = !isPaused; // Toggle pause state
        const pauseScreen = document.getElementById('pause-screen');
        if (isPaused) {
            pauseScreen.style.display = 'flex'; // Show pause screen
        } else {
            pauseScreen.style.display = 'none'; // Hide pause screen
        }
    }
});


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

        // Kiểm tra nếu đi ra ngoài biên map
        if (row < 0 || row >= ROWS || col < 0 || col >= COLS) continue;

        let tile = map[row][col];

        // Nếu là tường (1) -> Không cho đi
        if (tile === 1) return false;

        // BỎ chặn ô số 4: Giờ nó là Safe Zone nên cho phép Player bước vào thoải mái!
        if (tile === 4) {
            if(hopeCount>5) 
            return true; 
        }
    }
    return true;
    
}

window.onload = () => {
    enemies.forEach(enemy => enemy.savePosition());
};

// ============================================================
//  BOSS BATTLE - UNDERTALE STYLE
// ============================================================
let battleHP = 100;
let bossHP = 200;
let isPlayerTurn = false;

// --- Bullet hell mini-game ---
let battleCanvas, battleCtx;
let battlePhase = 'menu'; // 'menu' | 'dodge' | 'result'
let soul = { x: 200, y: 200, size: 12, speed: 4 };
let bullets = [];
let dodgeTimer = 0;
let dodgeDuration = 0;
let dodgeDamage = 0;
let dodgeKeys = {};
let dodgeActive = false;
let bossShakeUntil = 0;
let bossPhaseIndex = 0; // 0=normal, 1=angry (HP<100), 2=desperate (HP<50)

// HP bar animation
let displayBossHP = 200;
let displayPlayerHP = 100;

const BATTLE_W = 800, BATTLE_H = 600;
const DODGE_BOX = { x: 250, y: 250, w: 300, h: 180 };


let isTyping = false;
let skipDialog = false;


document.addEventListener('keydown', (e) => {
    // Nếu đang gõ chữ và người dùng bấm J hoặc Enter
    if ((e.code === 'KeyJ' || e.code === 'Enter' || e.code === 'NumpadEnter') && isTyping) {
        skipDialog = true;
    }
});
// Thay đổi 'dialog-box' thành ID của thẻ HTML hiển thị text trong game của bạn
function typeDialog(text) {
    return new Promise((resolve) => {

        const dialogueBox = document.getElementById('dialogue-box');
        const dialogEl = document.getElementById('dialog-text');

        if (!dialogEl || !dialogueBox) {
            console.warn("Không tìm thấy dialogue-box hoặc dialog-text");
            resolve();
            return;
        }

        dialogueBox.style.display = 'block';
        dialogEl.innerHTML = '';

        isTyping = true;
        skipDialog = false;

        let i = 0;

        function finishDialog() {

            isTyping = false;

            // Delay nhỏ cho tự nhiên
            setTimeout(() => {

                // ẨN BOX SAU KHI XONG
                dialogueBox.style.display = 'none';

                resolve();

            }, 300);
        }

        function typeNextChar() {

            // Skip
            if (skipDialog) {
                dialogEl.innerHTML = text;
                finishDialog();
                return;
            }

            // Typing
            if (i < text.length) {
                dialogEl.innerHTML += text.charAt(i);
                i++;
                setTimeout(typeNextChar, 30);
            }
            else {
                finishDialog();
            }
        }

        typeNextChar();
    });
}






// Tạo bullet patterns khác nhau
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
        // Tường đạn từ trái sang phải có khe hở
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
        // Đạn nhắm thẳng vào soul
        let cx = DODGE_BOX.x + DODGE_BOX.w/2;
        let count = 5 + bossPhaseIndex * 2;
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                if (!dodgeActive) return;
                let dx = soul.x - cx, dy = soul.y - (DODGE_BOX.y - 20);
                let d = Math.hypot(dx, dy) || 1;
                let spread = (Math.random()-0.5) * 1.2;
                bullets.push({
                    x: cx + (Math.random()-0.5)*80, y: DODGE_BOX.y - 10,
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
        battleCanvas.width = BATTLE_W;
        battleCanvas.height = BATTLE_H;
        // Sửa z-index từ 10 xuống thấp hơn các nút UI
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



// ============================================================
// 1. SỬA HÀM ANIMATE HP (Chống giật/chồng chéo vòng lặp)
// ============================================================
let hpAnimId; // Biến lưu trữ ID của vòng lặp để hủy khi cần
function animateHP() {
    if (hpAnimId) cancelAnimationFrame(hpAnimId); // Dọn dẹp vòng lặp cũ trước khi chạy mới
    
    let isAnimating = false;

    // Giảm mượt thanh Boss
    if (displayBossHP > bossHP) { 
        displayBossHP = Math.max(bossHP, displayBossHP - 2.5); 
        isAnimating = true; 
    }
    // Giảm hoặc Hồi mượt thanh Player
    if (displayPlayerHP > battleHP) { 
        displayPlayerHP = Math.max(battleHP, displayPlayerHP - 1.5); 
        isAnimating = true; 
    } else if (displayPlayerHP < battleHP) {
        displayPlayerHP = Math.min(battleHP, displayPlayerHP + 1.5);
        isAnimating = true;
    }
    
    const bossFill = document.getElementById('boss-hp-bar-fill');
    const playerFill = document.getElementById('player-hp-bar-fill');
    if (bossFill) bossFill.style.width = Math.max(0, (displayBossHP/200)*100) + '%';
    if (playerFill) playerFill.style.width = Math.max(0, (displayPlayerHP/100)*100) + '%';
    
    const pNum = document.getElementById('player-hp');
    const bNum = document.getElementById('boss-hp');
    if (pNum) pNum.innerText = Math.ceil(displayPlayerHP);
    if (bNum) bNum.innerText = Math.ceil(displayBossHP);

    // Tiếp tục gọi lặp tới khi đạt đúng target
    if (isAnimating) {
        hpAnimId = requestAnimationFrame(animateHP);
    }
}

// ============================================================
// 2. SỬA HÀM DODGELOOP (Thêm khung hình bất tử - I-frames)
// ============================================================
function dodgeLoop() {
    // Đảm bảo battle menu không bị che mờ sau khi dodgeLoop chạy
 
    if (battlePhase !== 'dodge') return;
    if (!dodgeActive) return;
    const bctx = getBattleCanvas();
    bctx.clearRect(0, 0, BATTLE_W, BATTLE_H);

    // Vẽ dodge box
    bctx.strokeStyle = 'white';
    bctx.lineWidth = 3;
    bctx.strokeRect(DODGE_BOX.x, DODGE_BOX.y, DODGE_BOX.w, DODGE_BOX.h);

    // Timer bar
    let progress = Math.max(0, dodgeTimer / (dodgeDuration/1000));
    bctx.fillStyle = '#333';
    bctx.fillRect(DODGE_BOX.x, DODGE_BOX.y + DODGE_BOX.h + 8, DODGE_BOX.w, 8);
    bctx.fillStyle = progress > 0.3 ? '#00ff88' : '#ff4400';
    bctx.fillRect(DODGE_BOX.x, DODGE_BOX.y + DODGE_BOX.h + 8, DODGE_BOX.w * progress, 8);

    // Label
    bctx.fillStyle = '#aaa';
    bctx.font = '13px Courier New';
    bctx.fillText('DODGE! [WASD]', DODGE_BOX.x + 4, DODGE_BOX.y - 8);

    // Di chuyển soul
    if (dodgeKeys['ArrowLeft'] || dodgeKeys['KeyA']) soul.x -= soul.speed;
    if (dodgeKeys['ArrowRight'] || dodgeKeys['KeyD']) soul.x += soul.speed;
    if (dodgeKeys['ArrowUp'] || dodgeKeys['KeyW']) soul.y -= soul.speed;
    if (dodgeKeys['ArrowDown'] || dodgeKeys['KeyS']) soul.y += soul.speed;
    soul.x = Math.max(DODGE_BOX.x + soul.size, Math.min(DODGE_BOX.x + DODGE_BOX.w - soul.size, soul.x));
    soul.y = Math.max(DODGE_BOX.y + soul.size, Math.min(DODGE_BOX.y + DODGE_BOX.h - soul.size, soul.y));

    // Update & vẽ bullets
    let hitThisFrame = false;
    bullets = bullets.filter(b => {
        b.x += b.vx; b.y += b.vy;
        if (b.x < DODGE_BOX.x - 20 || b.x > DODGE_BOX.x + DODGE_BOX.w + 20 ||
            b.y < DODGE_BOX.y - 20 || b.y > DODGE_BOX.y + DODGE_BOX.h + 20) return false;
        
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
           showBattleMenu(true);
        return true;
    });

    if (hitThisFrame) {
        battleHP = Math.max(0, battleHP - 5*dodgeDamage);
        animateHP();
    }
    bctx.save();
    if (soul._hitFlash > 0) soul._hitFlash--;
    // Vẽ soul là khối vuông màu xanh như player (thay vì tim đỏ)
    const soulColor = (soul._hitFlash > 0 && Math.floor(soul._hitFlash / 4) % 2 === 0) ? 'white' : '#007bff';
    bctx.fillStyle = soulColor;
    bctx.fillRect(soul.x - soul.size/2, soul.y - soul.size/2, soul.size, soul.size);
    bctx.restore();

    dodgeTimer -= 1/60;
    if (dodgeTimer <= 0 || battleHP <= 0) {
        dodgeActive = false;
        battleCtx.clearRect(0, 0, BATTLE_W, BATTLE_H);
        bullets = [];
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

    if (battleCtx) {
        battleCtx.clearRect(0,0,BATTLE_W,BATTLE_H);
    }
    if (battleHP <= 0) {

        await typeDialog("* Cơ thể bạn gục xuống...");

        document.getElementById('battle-screen').style.display = 'none';

        showStoryScreen('ending_bad');

        return;
    }
  showBattleMenu(true);
    await typeDialog("* Quái vật đang lườm bạn...");
    isPlayerTurn = true;
}

function showBattleMenu(show) {
    document.querySelector('.battle-menu').style.visibility = show ? 'visible' : 'hidden';
}

async function startDodgePhase(damage, duration, patterns) {
    battlePhase = 'dodge';

   
    

    dodgeDamage = damage;
    dodgeTimer = duration;
    dodgeDuration = duration * 1000;
    dodgeActive = true;

    soul.x = DODGE_BOX.x + DODGE_BOX.w / 2;
    soul.y = DODGE_BOX.y + DODGE_BOX.h / 2;
    soul._hitFlash = 0;

    bullets = [];

    // Spawn pattern
    for (let i = 0; i < patterns.length; i++) {
        setTimeout(() => {
            if (dodgeActive) {
                spawnBullets(patterns[i]);
            }
        }, i * (duration * 1000 / patterns.length));
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

window.startBossBattle = function() {
    bgMusic.pause();
    bgMusic.currentTime = 0;

    document.getElementById('story-screen').style.display = 'none';
    isPaused = true;
    gameRunning = false;

    battleHP = 100;
    bossHP = 200;
    displayBossHP = 200;
    displayPlayerHP = 100;
    bossPhaseIndex = 0;
    isPlayerTurn = false;
    hopeisused = false;

    const battleScreen = document.getElementById('battle-screen');
    battleScreen.style.setProperty("display", "flex", "important");

    if (!document.getElementById('boss-hp-bar-fill')) {
        const stats = document.querySelector('.battle-stats');
        stats.innerHTML = `
            <div style="width:48%;">
                <div style="margin-bottom:4px;">BẠN - HP: <span id="player-hp" style="color:lime;">100</span>/100</div>
                <div style="background:#333;height:12px;border:1px solid #fff;border-radius:2px;">
                    <div id="player-hp-bar-fill" style="height:100%;width:100%;background:lime;border-radius:2px;transition:width 0.3s;"></div>
                </div>
            </div>
            <div style="width:48%;">
                <div style="margin-bottom:4px;">GIÁM THỊ - HP: <span id="boss-hp" style="color:red;">200</span>/200</div>
                <div style="background:#333;height:12px;border:1px solid #fff;border-radius:2px;">
                    <div id="boss-hp-bar-fill" style="height:100%;width:100%;background:#ff4444;border-radius:2px;transition:width 0.3s;"></div>
                </div>
            </div>`;
    }

    // Ẩn menu và boss tĩnh trong lúc chạy intro
    showBattleMenu(false);
    const bossImg = document.querySelector('.battle-scene img');
    if (bossImg) bossImg.style.opacity = '0';

    // --- BOSS INTRO SEQUENCE ---
    const introOverlay = document.getElementById('boss-intro-overlay');
    const introGif     = document.getElementById('boss-intro-gif');
    const introFlash   = document.getElementById('boss-intro-flash');

    // Reset và reload GIF để animation chạy lại từ đầu
    introGif.src = '';
    introGif.src = 'Scenes/entrance.gif';

    // Bật nhạc boss ngay lúc intro
    bossMusic.play();

    // Hiện intro overlay
    introOverlay.classList.add('active');

    // Flash trắng ngay khi boss xuất hiện (0.1s sau để zoom kịp bắt đầu)
    setTimeout(() => {
        introFlash.classList.add('flash');
        // Rung màn hình
        battleScreen.style.animation = 'bossShakeIntro 0.5s ease-out';
        setTimeout(() => { battleScreen.style.animation = ''; }, 500);
    }, 100);

    // Sau 2.5s: ẩn intro, hiện boss thật, bắt đầu dialogue
    setTimeout(() => {
        // Fade out intro overlay
        introOverlay.style.transition = 'opacity 0.5s ease';
        introOverlay.style.opacity = '0';

        setTimeout(() => {
            introOverlay.classList.remove('active');
            introOverlay.style.opacity = '';
            introFlash.classList.remove('flash');

            // Hiện boss tĩnh
            if (bossImg) {
                bossImg.style.transition = 'opacity 0.4s ease';
                bossImg.style.opacity = '1';
            }

            // Bắt đầu dialogue
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

// Keyboard cho dodge
document.addEventListener('keydown', e => { dodgeKeys[e.code] = true; });
document.addEventListener('keyup', e => { dodgeKeys[e.code] = false; });

let hopeisused = false;

window.battleAction = async function(action) {
    if (!isPlayerTurn) return;
    isPlayerTurn = false;


    if (action === 'FIGHT') {
        let dmg = Math.floor(Math.random() * 20) + 15 + (bossPhaseIndex === 2 ? 5 : 0);
        bossHP = Math.max(0, bossHP - dmg);
        updateBossPhase();
        // Boss shake effect
        const bossImg = document.querySelector('.battle-scene img');
        if (bossImg) { bossImg.style.filter = 'drop-shadow(0 0 10px red) brightness(3)'; setTimeout(() => bossImg.style.filter = 'drop-shadow(0 0 10px red)', 300); }
        await typeDialog(`* Dùng chính sự quyết tâm ${bossPhaseIndex >= 1 ? 'và tức giận ' : ''}của mình, bạn gây ${dmg} sát thương!`);
    }
    else if (action === 'HOPE') {
        if (hiddenItemsFound > 0 && !hopeisused) {
            let dmg = hiddenItemsFound * 15;
            bossHP = Math.max(0, bossHP - dmg);
            hopeisused = true;
            updateBossPhase();
            await typeDialog(`* ${hiddenItemsFound} mảnh ký ức bùng sáng! UIT cộng hưởng với bạn — Boss nhận ${dmg} sát thương KHỔng lồ!`);
        } else if (hopeisused) {
            await typeDialog(`* Bạn đã dùng hết những ký ức đó rồi... nhưng chúng vẫn sống trong tim bạn.`);
            let heal = 10; battleHP = Math.min(100, battleHP + heal);
            animateHP();
        } else {
            await typeDialog(`* Bạn cầu cứu... nhưng không có ai. (Hãy thu thập mảnh Hy Vọng trước!)`);
        }
    }
    else if (action === 'DREAM') {
        let heal = bossPhaseIndex === 2 ? 15 : 30;
        battleHP = Math.min(100, battleHP + heal);
        animateHP();
        await typeDialog(`* Bạn nhắm mắt hồi tưởng về những ngày tháng tươi đẹp ở UIT... hồi ${heal} HP.`);
    }
    else if (action === 'ESCAPE') {
        await typeDialog(`* Bỏ cuộc ư?! Kẻ không đủ quyết tâm KHÔNG ĐÁNG được tốt nghiệp!!`);
    }

    animateHP();

    if (bossHP <= 0) {
        bossMusic.pause();
        if (battleCanvas) battleCanvas.remove(), battleCanvas = null;
        await typeDialog("* N... Không thể... Sao một sinh viên lại có thể...");
        await new Promise(r => setTimeout(r, 1000));
        await typeDialog("* ...Chúc mừng tốt nghiệp. Bạn xứng đáng.");
        setTimeout(() => {
            document.getElementById('battle-screen').style.display = 'none';
            showStoryScreen('ending_good');
        }, 3000);
        return;
    }


    const patterns = {
        0: [['rain'], ['aimed'], ['rain', 'aimed']],
        1: [['spiral'], ['wall'], ['aimed', 'wall']],
        2: [['spiral', 'aimed'], ['wall', 'rain'], ['spiral', 'wall', 'aimed']]
    };
    const pSet = patterns[bossPhaseIndex];
    const chosenPattern = pSet[Math.floor(Math.random() * pSet.length)];
    const dodgeDur = 4 + bossPhaseIndex * 1.5; // giây dodge tăng theo phase

    await startDodgePhase(bossPhaseIndex === 2 ? 8 : (bossPhaseIndex === 1 ? 5 : 3), dodgeDur, chosenPattern);
};

// Quản lý trạng thái boss
const defeatedBosses = new Set();

function returnToMenu() {
    console.log("Quay lại menu chính.");
    isPaused = true;
    gameRunning = false;
    document.getElementById('gameCanvas').style.display = 'none';
    document.getElementById('menu-screen').style.display = 'flex';
}

function startBossFight(bossId) {
    if (defeatedBosses.has(bossId)) {
        console.log(`Boss ${bossId} đã bị đánh bại, không thể chiến đấu lại.`);
        return;
    }

    console.log(`Bắt đầu chiến đấu với Boss ${bossId}`);
    bossMusic.play();
    isPaused = true;
    defeatedBosses.add(bossId);
    console.log(`Boss ${bossId} đã bị đánh bại.`);
    isPaused = false;
    bossMusic.pause();
    returnToMenu();
}