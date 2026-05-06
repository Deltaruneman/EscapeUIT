// ============================================================
//  SETUP
// ============================================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

let gameRunning = false;
let isPaused = false;
let keysFound = 0;
let deathCount = 0;
let currentRoomX = 0;
let currentRoomY = 0;
let hiddenItemsFound = 0;
let hopeCount = 0;

const player = { x: 400, y: 300, size: 25, speed: 3.2, lastX: 400, lastY: 300 };

const enemies = [
    new RedEnemy(50, 50, 2),
    new GreenEnemy(200, 200, 1.5),
    new PinkEnemy(600, 400, 1.8)
];
enemies[1].roomX = 1; enemies[1].roomY = 0;
enemies[2].roomX = 0; enemies[2].roomY = 1;

let currentStoryIdx = 0;
let storyMode = "intro";
let dodgeActive = false; // khai báo sớm để dùng trong keydown listener

const bgMusic = new Audio('bgm.waw');
bgMusic.loop = true;
bgMusic.volume = 0.5;

const bossMusic = new Audio('LastChance42.waw');
bossMusic.loop = true;
bossMusic.volume = 0.5;

// ============================================================
//  INVINCIBILITY FRAMES
// ============================================================
let invincibleUntil = 0;
function setInvincible(ms) { invincibleUntil = Date.now() + ms; }
function isInvincible() { return Date.now() < invincibleUntil; }

// ============================================================
//  INPUT
// ============================================================
const keysPressed = {};
const dodgeKeys = {};

window.addEventListener('keydown', (e) => {
    keysPressed[e.code] = true;
    dodgeKeys[e.code] = true;
    if (isPaused && (e.code === 'KeyJ' || e.code === 'Enter')) handleNextStory();
    if (e.code === 'Escape' && gameRunning && !dodgeActive) {
        isPaused = !isPaused;
        document.getElementById('pause-screen').style.display = isPaused ? 'flex' : 'none';
    }
});
window.addEventListener('keyup', (e) => {
    keysPressed[e.code] = false;
    dodgeKeys[e.code] = false;
});

// ============================================================
//  STORY SCREEN
// ============================================================
function showStoryScreen(type) {
    isPaused = true;
    storyMode = type;
    const screen = document.getElementById('story-screen');
    const img    = document.getElementById('story-img');
    const text   = document.getElementById('story-text');
    const footer = document.getElementById('story-footer');

    if (type === "ending_bad") {
        img.src = "https://images.unsplash.com/photo-1601513445498-5dbffc8d5d40?q=80&w=800";
        text.innerText = "GAME OVER - BẠN ĐÃ BỊ KẸT LẠI MÃI MÃI TẠI UIT";
        footer.innerHTML = '<button class="retry-btn" onclick="location.reload()">CHƠI LẠI</button>';
        screen.style.display = 'flex';
        return;
    }
    if (type === "ending_good") {
        img.src = "https://www.uit.edu.vn/_next/image?url=https%3A%2F%2Fwww.uit.edu.vn%2Fstrapi%2Fuploads%2FUIT_1_e406b7e283.jpg&w=1536&q=75";
        text.innerText = "CHÚC MỪNG! Bạn đã tìm được 4 mảnh ký ức. Linh hồn của bạn trở nên mạnh mẽ và đã có thể giải thoát khỏi đây!";
        footer.innerHTML = '<button class="retry-btn" style="background:green;border-color:lime;" onclick="showStoryScreen(\'plot_twist\')">LÊN NHẬN BẰNG</button>';
        screen.style.display = 'flex';
        return;
    }
    if (type === "plot_twist") {
        img.src = "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=800";
        text.innerText = "Không... Ngươi không thể rời đi. Ta sẽ giữ ngươi lại mãi mãi.";
        footer.innerHTML = '<button class="retry-btn" onclick="startBossBattle()">Không, tao sẽ không bỏ cuộc!</button>';
        screen.style.display = 'flex';
        return;
    }

    let data;
    if (type === "intro") data = storyScenes[currentStoryIdx];
    else if (type === "key") data = keyCollectScenes[keysFound - 1];
    else if (type === "hidden_item") data = hiddenItemScenes[Math.min(hiddenItemsFound - 1, hiddenItemScenes.length - 1)];

    if (!data) return;
    img.src = data.img || '';
    text.innerText = data.text;
    footer.innerText = "(Bấm [J] hoặc [Enter] để tiếp tục)";
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
        document.getElementById('story-screen').style.display = 'none';
        isPaused = false;
        if (keysFound === 4) showStoryScreen("ending_good");
    } else if (storyMode === "hidden_item") {
        document.getElementById('story-screen').style.display = 'none';
        isPaused = false;
    }
}

document.getElementById('start-btn').onclick = () => {
    document.getElementById('start-screen').style.display = 'none';
    showStoryScreen("intro");
    bgMusic.play().catch(() => {});
};

// ============================================================
//  COLLISION
// ============================================================
function isColliding(x, y, size, rX, rY) {
    const map = getMap(rX, rY);
    const corners = [{x, y}, {x: x+size, y}, {x, y: y+size}, {x: x+size, y: y+size}];
    for (let p of corners) {
        let c = Math.floor(p.x / TILE_SIZE), r = Math.floor(p.y / TILE_SIZE);
        if (map[r] && map[r][c] === 1) return true;
    }
    return false;
}

// ============================================================
//  DEATH
// ============================================================
function triggerJumpscare() {
    if (isInvincible()) return;
    bgMusic.pause();
    deathCount++;
    document.getElementById('death-count').innerText = deathCount;
    gameRunning = false;
    setInvincible(3000);
    document.getElementById('jumpscare-overlay').style.display = 'block';
    document.getElementById('jumpscare-img').src = "nomon.gif";
    setTimeout(() => {
        document.getElementById('jumpscare-overlay').style.display = 'none';
        if (deathCount >= 5) {
            showStoryScreen("ending_bad");
        } else {
            player.x = 400; player.y = 300;
            currentRoomX = 0; currentRoomY = 0;
            gameRunning = true;
            bgMusic.play().catch(() => {});
        }
    }, 1500);
}

// ============================================================
//  GAME UPDATE
// ============================================================
function update() {
    if (!gameRunning || isPaused) return;

    player.lastX = player.x;
    player.lastY = player.y;

    let nx = player.x, ny = player.y;
    if (keysPressed['KeyW'] || keysPressed['ArrowUp'])    ny -= player.speed;
    if (keysPressed['KeyS'] || keysPressed['ArrowDown'])  ny += player.speed;
    if (keysPressed['KeyA'] || keysPressed['ArrowLeft'])  nx -= player.speed;
    if (keysPressed['KeyD'] || keysPressed['ArrowRight']) nx += player.speed;

    if (!isColliding(player.x, ny, player.size, currentRoomX, currentRoomY)) player.y = ny;
    if (!isColliding(nx, player.y, player.size, currentRoomX, currentRoomY)) player.x = nx;

    if (player.x < -15) { currentRoomX--; player.x = 770; }
    if (player.x > 790) { currentRoomX++; player.x = 10; }
    if (player.y < -15) { currentRoomY--; player.y = 570; }
    if (player.y > 590) { currentRoomY++; player.y = 10; }

    const map = getMap(currentRoomX, currentRoomY);
    let pc = Math.floor((player.x + 12) / TILE_SIZE);
    let pr = Math.floor((player.y + 12) / TILE_SIZE);

    if (map[pr] && map[pr][pc] === 3) {
        map[pr][pc] = 0;
        keysFound++;
        document.getElementById('key-count').innerText = keysFound;
        showStoryScreen("key");
    }
    if (map[pr] && map[pr][pc] === 5) {
        map[pr][pc] = 0;
        hiddenItemsFound++;
        document.getElementById('item-count').innerText = hiddenItemsFound;
        showStoryScreen("hidden_item");
    }

    if (keysPressed['KeyP']) showStoryScreen("ending_good"); // debug

    enemies.forEach(enemy => {
        enemy.update(player, currentRoomX, currentRoomY, keysFound);
        if (!isInvincible() && currentRoomX === enemy.roomX && currentRoomY === enemy.roomY) {
            if (Math.hypot(player.x - enemy.x, player.y - enemy.y) < 28) {
                triggerJumpscare();
            }
        }
    });
}

// ============================================================
//  DRAW
// ============================================================
function draw() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, 800, 600);

    const map = getMap(currentRoomX, currentRoomY);
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            let t = map[r][c];
            if (t === 1) { ctx.fillStyle = "#121212"; ctx.fillRect(c*50, r*50, 50, 50); }
            if (t === 3) { ctx.fillStyle = "yellow"; ctx.beginPath(); ctx.arc(c*50+25, r*50+25, 10, 0, Math.PI*2); ctx.fill(); }
            if (t === 5) { ctx.fillStyle = "cyan";   ctx.beginPath(); ctx.arc(c*50+25, r*50+25, 8,  0, Math.PI*2); ctx.fill(); }
            if (t === 4) { ctx.fillStyle = "#003300"; ctx.fillRect(c*50, r*50, 50, 50); }
        }
    }

    enemies.forEach(e => e.draw(ctx, currentRoomX, currentRoomY));

    ctx.fillStyle = isInvincible() && Math.floor(Date.now() / 100) % 2 === 0 ? '#aaddff' : '#007bff';
    ctx.fillRect(player.x, player.y, player.size, player.size);

    const grad = ctx.createRadialGradient(player.x+12, player.y+12, 50, player.x+12, player.y+12, 200);
    grad.addColorStop(0, "transparent");
    grad.addColorStop(1, "rgba(0,0,0,0.85)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 600);
}

// ============================================================
//  MAIN LOOP
// ============================================================
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}
loop();

window.onload = () => { enemies.forEach(e => e.savePosition()); };

document.getElementById('respawn-btn').onclick = () => {
    player.x = 400; player.y = 300;
    bgMusic.play().catch(() => {});
    enemies.forEach(e => e.respawn());
    isPaused = false;
    gameRunning = true;
    document.getElementById('respawn-container').style.display = 'none';
};

// ============================================================
//  TYPEWRITER
// ============================================================
let _typingTimer = null;
function typeDialog(text, speed) {
    speed = speed || 48;
    const box = document.getElementById('battle-dialog');
    if (!box) return Promise.resolve();
    if (_typingTimer) { clearTimeout(_typingTimer); _typingTimer = null; }
    box.textContent = '';
    let i = 0;
    return new Promise(function(resolve) {
        function tick() {
            if (i < text.length) {
                box.textContent += text[i++];
                _typingTimer = setTimeout(tick, speed);
            } else {
                _typingTimer = null;
                resolve();
            }
        }
        tick();
    });
}

function wait(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

// ============================================================
//  BOSS BATTLE
// ============================================================
let battleHP = 100;
let bossHP   = 200;
let isPlayerTurn  = false;
let hopeisused    = false;
let bossPhaseIndex = 0;

// Dodge mini-game state
let dodgeDmgPerHit   = 4;
let dodgeDurationSec = 5;
let dodgeStartTime   = 0;
let bullets          = [];
let dodgeRAF         = null;

const soul = { x: 400, y: 300, size: 11, speed: 4.5, hitFlash: 0 };

// Dodge box coordinates (relative to the 800x600 battle-screen)
const DB = { x: 190, y: 140, w: 420, h: 220 };

// Canvas overlay for dodge game
let bCanvas = null;
let bCtx    = null;

function ensureBattleCanvas() {
    if (bCanvas) return bCtx;
    bCanvas = document.createElement('canvas');
    bCanvas.width  = 800;
    bCanvas.height = 600;
    bCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:20;';
    document.getElementById('battle-screen').appendChild(bCanvas);
    bCtx = bCanvas.getContext('2d');
    return bCtx;
}

function destroyBattleCanvas() {
    if (dodgeRAF) { cancelAnimationFrame(dodgeRAF); dodgeRAF = null; }
    if (bCanvas)  { bCanvas.remove(); bCanvas = null; bCtx = null; }
}

// --- HP bars ---
let dispPlayerHP = 100, dispBossHP = 200;
let _hpRaf = null;
function animateHP() {
    if (_hpRaf) cancelAnimationFrame(_hpRaf);
    function step() {
        dispPlayerHP += (battleHP - dispPlayerHP) * 0.14;
        dispBossHP   += (bossHP   - dispBossHP)   * 0.14;
        if (Math.abs(dispPlayerHP - battleHP) < 0.3) dispPlayerHP = battleHP;
        if (Math.abs(dispBossHP   - bossHP)   < 0.3) dispBossHP   = bossHP;

        var pFill = document.getElementById('player-hp-fill');
        var bFill = document.getElementById('boss-hp-fill');
        var pNum  = document.getElementById('player-hp');
        var bNum  = document.getElementById('boss-hp');

        if (pFill) pFill.style.width = Math.max(0, dispPlayerHP) + '%';
        if (bFill) bFill.style.width = Math.max(0, (dispBossHP / 200) * 100) + '%';
        if (pNum)  pNum.textContent  = Math.ceil(Math.max(0, dispPlayerHP));
        if (bNum)  bNum.textContent  = Math.ceil(Math.max(0, dispBossHP));

        if (dispPlayerHP !== battleHP || dispBossHP !== bossHP) {
            _hpRaf = requestAnimationFrame(step);
        }
    }
    _hpRaf = requestAnimationFrame(step);
}

function updateBossPhase() {
    if      (bossHP <= 50)  bossPhaseIndex = 2;
    else if (bossHP <= 100) bossPhaseIndex = 1;
    else                    bossPhaseIndex = 0;
}

// --- Bullet patterns ---
function spawnPattern(name) {
    var phase = bossPhaseIndex;
    if (name === 'rain') {
        var count = 6 + phase * 4;
        for (var i = 0; i < count; i++) {
            bullets.push({
                x: DB.x + Math.random() * DB.w,
                y: DB.y - 12,
                vx: (Math.random() - 0.5) * 1.6,
                vy: 1.8 + phase * 0.7 + Math.random() * 1.0,
                r: 7, color: '#ff3333', square: false
            });
        }
    } else if (name === 'spiral') {
        var cx = DB.x + DB.w / 2, cy = DB.y + DB.h / 2;
        var n = 10 + phase * 2;
        for (var i = 0; i < n; i++) {
            var angle = (i / n) * Math.PI * 2;
            var spd = 2.0 + phase * 0.5;
            bullets.push({ x: cx, y: cy, vx: Math.cos(angle)*spd, vy: Math.sin(angle)*spd, r: 7, color: '#ff8800', square: false });
        }
    } else if (name === 'wall') {
        var gapC = DB.y + 45 + Math.random() * (DB.h - 90);
        var gapH = 48 - phase * 7;
        for (var y = DB.y + 8; y < DB.y + DB.h - 8; y += 20) {
            if (Math.abs(y - gapC) > gapH / 2) {
                bullets.push({ x: DB.x - 14, y: y, vx: 3.0 + phase * 0.9, vy: 0, r: 8, color: '#cc00ff', square: true });
            }
        }
    } else if (name === 'aimed') {
        var shots = 4 + phase * 2;
        for (var i = 0; i < shots; i++) {
            (function(idx) {
                setTimeout(function() {
                    if (!dodgeActive) return;
                    var sx = DB.x + (Math.random()) * DB.w;
                    var sy = DB.y - 10;
                    var dx = soul.x - sx, dy = soul.y - sy;
                    var d  = Math.hypot(dx, dy) || 1;
                    var spd = 2.6 + phase * 0.5;
                    bullets.push({ x: sx, y: sy, vx: dx/d*spd + (Math.random()-0.5)*0.6, vy: dy/d*spd, r: 8, color: '#ff0055', square: false });
                }, idx * 300);
            })(i);
        }
    }
}

// --- Dodge render loop ---
function dodgeLoop(ts) {
    if (!dodgeActive) return;
    var c = ensureBattleCanvas();
    c.clearRect(0, 0, 800, 600);

    // Elapsed / remaining
    var elapsed   = (ts - dodgeStartTime) / 1000;
    var remaining = Math.max(0, dodgeDurationSec - elapsed);

    // Move soul
    if (dodgeKeys['ArrowLeft']  || dodgeKeys['KeyA']) soul.x -= soul.speed;
    if (dodgeKeys['ArrowRight'] || dodgeKeys['KeyD']) soul.x += soul.speed;
    if (dodgeKeys['ArrowUp']    || dodgeKeys['KeyW']) soul.y -= soul.speed;
    if (dodgeKeys['ArrowDown']  || dodgeKeys['KeyS']) soul.y += soul.speed;
    soul.x = Math.max(DB.x + soul.size, Math.min(DB.x + DB.w - soul.size, soul.x));
    soul.y = Math.max(DB.y + soul.size, Math.min(DB.y + DB.h - soul.size, soul.y));

    // Draw dodge box
    c.strokeStyle = 'white';
    c.lineWidth = 3;
    c.strokeRect(DB.x, DB.y, DB.w, DB.h);

    // Timer bar
    var pct = remaining / dodgeDurationSec;
    c.fillStyle = '#111';
    c.fillRect(DB.x, DB.y + DB.h + 8, DB.w, 12);
    c.fillStyle = pct > 0.35 ? '#00ff88' : '#ff4400';
    c.fillRect(DB.x, DB.y + DB.h + 8, DB.w * pct, 12);
    c.strokeStyle = '#555';
    c.lineWidth = 1;
    c.strokeRect(DB.x, DB.y + DB.h + 8, DB.w, 12);

    // Label
    c.fillStyle = '#aaa';
    c.font = '14px Courier New';
    c.fillText('DODGE! [WASD / Arrows]', DB.x + 4, DB.y - 8);

    // Update bullets
    var hitThisFrame = false;
    var alive = [];
    for (var i = 0; i < bullets.length; i++) {
        var b = bullets[i];
        b.x += b.vx; b.y += b.vy;
        if (b.x < DB.x - 35 || b.x > DB.x + DB.w + 35 || b.y < DB.y - 35 || b.y > DB.y + DB.h + 35) continue;
        alive.push(b);
        c.fillStyle = b.color;
        if (b.square) {
            c.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
        } else {
            c.beginPath(); c.arc(b.x, b.y, b.r, 0, Math.PI * 2); c.fill();
        }
        if (!hitThisFrame && Math.hypot(b.x - soul.x, b.y - soul.y) < b.r + soul.size - 3) {
            hitThisFrame = true;
            soul.hitFlash = 8;
        }
    }
    bullets = alive;

    if (hitThisFrame) {
        battleHP = Math.max(0, battleHP - dodgeDmgPerHit);
        animateHP();
    }

    // Draw soul heart
    c.save();
    c.fillStyle = soul.hitFlash > 0 ? '#ffffff' : '#ff0055';
    if (soul.hitFlash > 0) soul.hitFlash--;
    c.translate(soul.x, soul.y);
    var s = soul.size;
    c.beginPath();
    c.moveTo(0, s * 0.45);
    c.bezierCurveTo( s*0.9,  s*0.1,  s*1.0, -s*0.65,  0, -s*0.5);
    c.bezierCurveTo(-s*1.0, -s*0.65, -s*0.9,  s*0.1,  0,  s*0.45);
    c.fill();
    c.restore();

    if (remaining <= 0 || battleHP <= 0) {
        dodgeActive = false;
        if (bCtx) bCtx.clearRect(0, 0, 800, 600);
        bullets = [];
        onDodgeEnd();
        return;
    }
    dodgeRAF = requestAnimationFrame(dodgeLoop);
}

async function onDodgeEnd() {
    animateHP();
    if (battleHP <= 0) {
        bossMusic.pause();
        destroyBattleCanvas();
        await typeDialog("* Linh hồn bạn đã tan vỡ... UIT giữ bạn lại mãi mãi.");
        await wait(2000);
        document.getElementById('battle-screen').style.display = 'none';
        showStoryScreen('ending_bad');
        return;
    }
    var lines = [
        "* Tốt lắm... nhưng ta chưa xong đâu!",
        "* Ngươi... mạnh hơn ta nghĩ. Ta sẽ nghiêm túc!",
        "* KHÔNG THỂ!! Ta là UIT, ta trường tồn mãi mãi!!"
    ];
    await typeDialog(lines[bossPhaseIndex] || lines[2]);
    setBattleMenuVisible(true);
    await wait(300);
    isPlayerTurn = true;
}

async function startDodgePhase(dmg, durSec, patternList) {
    setBattleMenuVisible(false);
    dodgeDmgPerHit   = dmg;
    dodgeDurationSec = durSec;
    dodgeActive      = true;
    bullets          = [];
    soul.x = DB.x + DB.w / 2;
    soul.y = DB.y + DB.h / 2;
    soul.hitFlash = 0;

    // Schedule patterns across the duration
    var interval = (durSec * 1000) / patternList.length;
    for (var i = 0; i < patternList.length; i++) {
        (function(idx, pat) {
            setTimeout(function() { if (dodgeActive) spawnPattern(pat); }, idx * interval + 100);
        })(i, patternList[i]);
    }

    var intros = [
        '* Ta sẽ dạy ngươi ý nghĩa của "Trượt Môn"!',
        '* Ngươi nghĩ ngươi đã đủ cứng? Thử cái này!',
        '* ĐỦ RỒI! TA SẼ NGHIỀN NÁT NGƯƠI!'
    ];
    await typeDialog(intros[bossPhaseIndex] || intros[2]);

    ensureBattleCanvas();
    dodgeStartTime = performance.now();
    dodgeRAF = requestAnimationFrame(dodgeLoop);
}

function setBattleMenuVisible(v) {
    var menu = document.querySelector('.battle-menu');
    if (menu) menu.style.visibility = v ? 'visible' : 'hidden';
}

function bossHitFlash() {
    var img = document.querySelector('.battle-scene img');
    if (!img) return;
    img.style.filter = 'brightness(6) saturate(0)';
    setTimeout(function() { img.style.filter = 'drop-shadow(0 0 12px red)'; }, 220);
}

// ============================================================
//  START BOSS
// ============================================================
window.startBossBattle = function() {
    bgMusic.pause(); bgMusic.currentTime = 0;
    bossMusic.play().catch(function() {});

    document.getElementById('story-screen').style.display = 'none';
    isPaused = true;
    gameRunning = false;

    battleHP = 100; bossHP = 200;
    dispPlayerHP = 100; dispBossHP = 200;
    bossPhaseIndex = 0; isPlayerTurn = false; hopeisused = false;
    dodgeActive = false; bullets = [];
    destroyBattleCanvas();

    var bs = document.getElementById('battle-screen');
    bs.style.display = 'flex';

    // Rebuild HP bars
    var stats = document.querySelector('.battle-stats');
    stats.innerHTML =
        '<div style="flex:1;margin-right:16px;">' +
            '<div style="margin-bottom:4px;font-size:.95rem;">BẠN &nbsp; HP: <span id="player-hp" style="color:lime;font-weight:bold;">100</span>/100</div>' +
            '<div style="background:#111;height:13px;border:2px solid #fff;border-radius:2px;overflow:hidden;">' +
                '<div id="player-hp-fill" style="height:100%;width:100%;background:lime;"></div>' +
            '</div>' +
        '</div>' +
        '<div style="flex:1;">' +
            '<div style="margin-bottom:4px;font-size:.95rem;">GIÁM THỊ &nbsp; HP: <span id="boss-hp" style="color:#ff4444;font-weight:bold;">200</span>/200</div>' +
            '<div style="background:#111;height:13px;border:2px solid #fff;border-radius:2px;overflow:hidden;">' +
                '<div id="boss-hp-fill" style="height:100%;width:100%;background:#ff4444;"></div>' +
            '</div>' +
        '</div>';

    setBattleMenuVisible(false);

    typeDialog("* ...Mày nghĩ lấy đủ 4 chìa khóa là thoát được sao?")
        .then(function() { return wait(900); })
        .then(function() { return typeDialog("* TA là UIT. Ta trường tồn. Và ngươi... sẽ ở lại đây MÃI MÃI."); })
        .then(function() { return wait(600); })
        .then(function() { setBattleMenuVisible(true); isPlayerTurn = true; });
};

// ============================================================
//  BATTLE ACTIONS
// ============================================================
window.battleAction = async function(action) {
    if (!isPlayerTurn) return;
    isPlayerTurn = false;
    setBattleMenuVisible(false);

    if (action === 'FIGHT') {
        var dmg = 15 + Math.floor(Math.random() * 20) + bossPhaseIndex * 5;
        bossHP = Math.max(0, bossHP - dmg);
        updateBossPhase();
        bossHitFlash();
        animateHP();
        await typeDialog('* Bạn dùng toàn bộ quyết tâm tấn công — gây ' + dmg + ' sát thương!');
    }
    else if (action === 'HOPE') {
        if (hiddenItemsFound > 0 && !hopeisused) {
            var dmg = hiddenItemsFound * 15;
            bossHP = Math.max(0, bossHP - dmg);
            hopeisused = true;
            updateBossPhase();
            bossHitFlash();
            animateHP();
            await typeDialog('* ' + hiddenItemsFound + ' mảnh ký ức bùng sáng! Boss nhận ' + dmg + ' sát thương khổng lồ!');
        } else if (hopeisused) {
            var heal = 12;
            battleHP = Math.min(100, battleHP + heal);
            animateHP();
            await typeDialog('* Ký ức đã dùng hết, nhưng chúng cho bạn thêm nghị lực. Hồi ' + heal + ' HP.');
        } else {
            await typeDialog('* Bạn cầu cứu... nhưng không có ai. (Thu thập mảnh Hy Vọng trước!)');
        }
    }
    else if (action === 'DREAM') {
        var heal = bossPhaseIndex === 2 ? 15 : 30;
        battleHP = Math.min(100, battleHP + heal);
        animateHP();
        await typeDialog('* Bạn mơ về những ngày tháng tươi đẹp ở UIT... hồi ' + heal + ' HP.');
    }
    else if (action === 'ESCAPE') {
        await typeDialog('* Bỏ cuộc ư?! Kẻ không đủ quyết tâm KHÔNG ĐÁNG được tốt nghiệp!!');
    }

    // Win?
    if (bossHP <= 0) {
        bossMusic.pause();
        destroyBattleCanvas();
        await typeDialog('* N... Không thể... Một sinh viên... lại có thể...');
        await wait(1000);
        await typeDialog('* ...Được rồi. Chúc mừng tốt nghiệp. Bạn xứng đáng.');
        await wait(2500);
        document.getElementById('battle-screen').style.display = 'none';
        showStoryScreen('ending_good');
        return;
    }

    // Boss attacks
    var allPatterns = [
        [['rain'], ['aimed'], ['rain', 'aimed']],
        [['spiral'], ['wall'], ['aimed', 'wall']],
        [['spiral', 'aimed'], ['wall', 'rain'], ['spiral', 'wall', 'aimed']]
    ];
    var pSet    = allPatterns[bossPhaseIndex];
    var chosen  = pSet[Math.floor(Math.random() * pSet.length)];
    var dur     = 4 + bossPhaseIndex * 1.5;
    var dmgHit  = [4, 6, 9][bossPhaseIndex];

    await startDodgePhase(dmgHit, dur, chosen);
};