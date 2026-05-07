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

const bgMusic = new Audio('bgm.wav');
bgMusic.loop = true;
bgMusic.volume = 0.5;

const bossMusic = new Audio('LastChance42.wav');
bossMusic.loop = true;
bossMusic.volume = 0.6;

// ============================================================
//  INVINCIBILITY FRAMES (thêm mới)
// ============================================================
let invincibleUntil = 0;
function setInvincible(ms) { invincibleUntil = Date.now() + ms; }
function isInvincible() { return Date.now() < invincibleUntil; }

// ============================================================
//  STORY SCREEN
// ============================================================
function showStoryScreen(type) {
    isPaused = true;
    storyMode = type;
    const screen = document.getElementById('story-screen');
    const img = document.getElementById('story-img');
    const text = document.getElementById('story-text');
    const footer = document.getElementById('story-footer');

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
    } else if (type === "ending_good") {
        bgMusic.pause();
        img.src = "https://www.uit.edu.vn/_next/image?url=https%3A%2F%2Fwww.uit.edu.vn%2Fstrapi%2Fuploads%2FUIT_1_e406b7e283.jpg&w=1536&q=75";
        text.innerText = "CHÚC MỪNG! Bạn đã thật sự tìm được 4 mảnh ký ức, linh hồn của bạn trở nên mạnh mẽ hơn bao giờ hết và đã có thể giải thoát bạn khỏi đây!";
        footer.innerHTML = '<button class="retry-btn" style="background: green; border-color: lime;" onclick="showStoryScreen(\'plot_twist\')">LÊN NHẬN BẰNG</button>';
        screen.style.display = 'flex';
        return;
    } else if (type === "plot_twist") {
        img.src = "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=800"; 
        bossMusic.play();
        text.innerText = "Không... Ngươi không thể rời đi, ta sẽ giữ ngươi lại, tất cả các ngươi đều phải ở lại đây.";
        footer.innerHTML = '<button class="retry-btn" onclick="startBossBattle()">Không, tao sẽ không bỏ cuộc!</button>';
        screen.style.display = 'flex';
        return;
    }

    if (!data) return;
    img.src = data.img || '';
    text.innerText = data.text;
    // FIX: thêm hint text cho story screen
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
        if (keysFound === 4) {
            showStoryScreen("ending_good");
        } else {
            document.getElementById('story-screen').style.display = 'none';
            isPaused = false;
        }
    } else if (storyMode === "hidden_item") {
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

// ============================================================
//  INPUT
// ============================================================
const keysPressed = {};
window.onkeydown = (e) => {
    keysPressed[e.code] = true;
    dodgeKeys[e.code] = true;
    if ((e.code === 'KeyJ' || e.code === 'Enter' || e.code === 'NumpadEnter') && isTyping) {
        skipDialog = true;
    }
    if (isPaused && !dodgeActive && (e.code === 'KeyJ' || e.code === 'Enter')) handleNextStory();
    if (e.code === 'Escape') {
        if (gameRunning && !dodgeActive) {
            isPaused = !isPaused;
            document.getElementById('pause-screen').style.display = isPaused ? 'flex' : 'none';
        }
    }
};
window.onkeyup = (e) => {
    keysPressed[e.code] = false;
    dodgeKeys[e.code] = false;
};

document.getElementById('start-btn').onclick = () => {
    bgMusic.play().catch(() => {});
    document.getElementById('start-screen').style.display = 'none';
    showStoryScreen("intro");
};

// ============================================================
//  JUMPSCARE / DEATH
// ============================================================
function triggerJumpscare() {
    if (isInvincible()) return;
    bgMusic.pause();
    deathCount++;
    document.getElementById('death-count').innerText = deathCount;
    gameRunning = false;
    setInvincible(2500);
    document.getElementById('jumpscare-overlay').style.display = 'block';
    document.getElementById('jumpscare-img').src = "nomon.gif"; 

    setTimeout(() => {
        document.getElementById('jumpscare-overlay').style.display = 'none';
        if (deathCount >= 5) showStoryScreen("ending_bad");
        else {
            player.x = 400; player.y = 300;
            currentRoomX = 0; currentRoomY = 0; 
            gameRunning = true;
            bgMusic.play().catch(() => {});
        }
    }, 1500);
}

// ============================================================
//  GAME UPDATE + DRAW
// ============================================================
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
    }
    return true;
}

function update() {
    if (!gameRunning || isPaused) return;

    // FIX: khai báo nx, ny đúng chỗ
    let nx = player.x, ny = player.y;
    if (keysPressed['KeyW'] || keysPressed['ArrowUp'])    ny -= player.speed;
    if (keysPressed['KeyS'] || keysPressed['ArrowDown'])  ny += player.speed;
    if (keysPressed['KeyA'] || keysPressed['ArrowLeft'])  nx -= player.speed;
    if (keysPressed['KeyD'] || keysPressed['ArrowRight']) nx += player.speed;

    if (!isColliding(player.x, ny, player.size, currentRoomX, currentRoomY)) player.y = ny;
    if (!isColliding(nx, player.y, player.size, currentRoomX, currentRoomY)) player.x = nx;

    if (keysPressed['KeyP']) showStoryScreen("ending_good");

    if (player.x < -15) { currentRoomX--; player.x = 780; }
    else if (player.x > 790) { currentRoomX++; player.x = 10; }
    if (player.y < -15) { currentRoomY--; player.y = 580; }
    else if (player.y > 590) { currentRoomY++; player.y = 10; }

    const map = getMap(currentRoomX, currentRoomY);
    let pc = Math.floor((player.x + 12)/TILE_SIZE), pr = Math.floor((player.y + 12)/TILE_SIZE);
    
    if (map[pr] && map[pr][pc] === 3) {
        map[pr][pc] = 0;
        keysFound++;
        document.getElementById('key-count').innerText = keysFound;
        showStoryScreen("key"); 
    }
    if (map[pr] && map[pr][pc] === 5) {
        map[pr][pc] = 0;
        hiddenItemsFound++;
        const countUI = document.getElementById('item-count');
        if (countUI) countUI.innerText = hiddenItemsFound;
        showStoryScreen("hidden_item"); 
    }

    enemies.forEach(enemy => {
        enemy.update(player, currentRoomX, currentRoomY, keysFound);
        if (!isInvincible() && currentRoomX === enemy.roomX && currentRoomY === enemy.roomY) {
            if (Math.hypot(player.x - enemy.x, player.y - enemy.y) < 25) {
                triggerJumpscare();
            }
        }
    });
}

function draw() {
    ctx.fillStyle = "#000"; ctx.fillRect(0,0,800,600);
    const map = getMap(currentRoomX, currentRoomY);
    for(let r=0; r<ROWS; r++){
        for(let c=0; c<COLS; c++){
            if(map[r][c]===1) { ctx.fillStyle="#121212"; ctx.fillRect(c*50, r*50, 50, 50); }
            if(map[r][c]===3) { ctx.fillStyle="yellow"; ctx.beginPath(); ctx.arc(c*50+25, r*50+25, 10, 0, 7); ctx.fill(); }
            if(map[r][c]===5) { ctx.fillStyle="cyan"; ctx.beginPath(); ctx.arc(c*50+25, r*50+25, 8, 0, 7); ctx.fill(); }
            if(map[r][c]===4) { ctx.fillStyle="#003300"; ctx.fillRect(c*50, r*50, 50, 50); }
        }
    }
    enemies.forEach(enemy => enemy.draw(ctx, currentRoomX, currentRoomY));
    // Player — nhấp nháy khi bất tử
    ctx.fillStyle = isInvincible() && Math.floor(Date.now()/100)%2===0 ? '#aaddff' : "#007bff";
    ctx.fillRect(player.x, player.y, 25, 25);
    // Vignette
    const grad = ctx.createRadialGradient(player.x+12, player.y+12, 50, player.x+12, player.y+12, 150);
    grad.addColorStop(0, "transparent"); grad.addColorStop(1, "rgba(0,0,0,0.8)");
    ctx.fillStyle = grad; ctx.fillRect(0,0,800,600);
}

// FIX: CHỈ 1 game loop duy nhất
function loop() { 
    update(); 
    draw(); 
    requestAnimationFrame(loop); 
}
loop();

window.onload = () => {
    enemies.forEach(enemy => enemy.savePosition());
};

document.getElementById('respawn-btn').onclick = () => {
    player.x = 400;
    player.y = 300;
    bgMusic.play().catch(() => {});
    enemies.forEach(enemy => enemy.respawn());
    isPaused = false;
    gameRunning = true;
    document.getElementById('respawn-container').style.display = 'none';
};

// ============================================================
//  BOSS BATTLE VARS
// ============================================================
let battleHP = 100;
let bossHP   = 200;
let isPlayerTurn = false;
let hopeisused   = false;
let bossPhaseIndex = 0;
let displayBossHP   = 200;
let displayPlayerHP = 100;
let isTyping  = false;
let skipDialog = false;
let dodgeKeys  = {}; // giữ lại để không crash keydown listener cũ nếu còn

// ============================================================
//  INDEX.HTML — battle-screen cần được update
//  Ta inject UI mới vào khi startBossBattle() chạy
// ============================================================

// ---- TYPEWRITER ----
let _typingTimer = null;
function typeDialog(text, speed) {
    speed = speed || 40;
    const box = document.getElementById('battle-dialog');
    if (!box) return Promise.resolve();
    if (_typingTimer) { clearTimeout(_typingTimer); _typingTimer = null; }
    box.textContent = '';
    isTyping = true;
    skipDialog = false;
    let i = 0;
    return new Promise(function(resolve) {
        function tick() {
            if (skipDialog) {
                box.textContent = text;
                isTyping = false;
                _typingTimer = setTimeout(resolve, 400);
                return;
            }
            if (i < text.length) {
                box.textContent += text[i++];
                _typingTimer = setTimeout(tick, speed);
            } else {
                isTyping = false;
                _typingTimer = setTimeout(resolve, 700);
            }
        }
        tick();
    });
}

document.addEventListener('keydown', function(e) {
    dodgeKeys[e.code] = true;
    if ((e.code === 'KeyJ' || e.code === 'Enter') && isTyping) skipDialog = true;
});
document.addEventListener('keyup', function(e) { dodgeKeys[e.code] = false; });

function wait(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

// ---- HP BAR ANIMATION ----
let _hpRaf = null;
function animateHP() {
    if (_hpRaf) cancelAnimationFrame(_hpRaf);
    function step() {
        let dirty = false;
        if (Math.abs(displayBossHP - bossHP) > 0.3) {
            displayBossHP += (bossHP - displayBossHP) * 0.13;
            dirty = true;
        } else displayBossHP = bossHP;
        if (Math.abs(displayPlayerHP - battleHP) > 0.3) {
            displayPlayerHP += (battleHP - displayPlayerHP) * 0.13;
            dirty = true;
        } else displayPlayerHP = battleHP;

        // Boss HP bar
        const bFill = document.getElementById('pkm-boss-hp-fill');
        const bNum  = document.getElementById('pkm-boss-hp-num');
        if (bFill) bFill.style.width = Math.max(0, (displayBossHP / 200) * 100) + '%';
        if (bNum)  bNum.textContent  = Math.ceil(Math.max(0, displayBossHP)) + '/200';

        // Player HP bar
        const pFill = document.getElementById('pkm-player-hp-fill');
        const pNum  = document.getElementById('pkm-player-hp-num');
        if (pFill) pFill.style.width = Math.max(0, (displayPlayerHP / 100) * 100) + '%';
        if (pNum)  pNum.textContent  = Math.ceil(Math.max(0, displayPlayerHP)) + '/100';

        if (dirty) _hpRaf = requestAnimationFrame(step);
    }
    _hpRaf = requestAnimationFrame(step);
}

function updateBossPhase() {
    if      (bossHP <= 50)  bossPhaseIndex = 2;
    else if (bossHP <= 100) bossPhaseIndex = 1;
    else                    bossPhaseIndex = 0;
}

// ---- BUILD POKEMON UI ----
function buildBattleUI() {
    const bs = document.getElementById('battle-screen');
    bs.style.cssText = 'display:flex!important;flex-direction:column;justify-content:flex-end;padding:0;background:#000;position:fixed;top:0;left:0;width:100%;height:100%;z-index:200;box-sizing:border-box;font-family:"Courier New",monospace;';

    bs.innerHTML = `
    <!-- BATTLE SCENE -->
    <div id="pkm-scene" style="flex:1;position:relative;background:linear-gradient(180deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);overflow:hidden;display:flex;align-items:flex-end;justify-content:space-between;padding:0 60px 0px;">

      <!-- Boss side (top-right) -->
      <div style="position:absolute;top:30px;left:40px;background:rgba(0,0,0,0.7);border:2px solid #fff;border-radius:4px;padding:8px 14px;min-width:200px;">
        <div style="font-size:1rem;font-weight:bold;letter-spacing:2px;margin-bottom:6px;">GIÁM THỊ UIT</div>
        <div style="font-size:.75rem;color:#aaa;margin-bottom:4px;">Lv.99</div>
        <div style="background:#333;height:10px;border-radius:5px;overflow:hidden;margin-bottom:3px;">
          <div id="pkm-boss-hp-fill" style="height:100%;width:100%;background:#ff4444;border-radius:5px;transition:none;"></div>
        </div>
        <div id="pkm-boss-hp-num" style="font-size:.75rem;color:#ff4444;text-align:right;">200/200</div>
      </div>

      <!-- Boss sprite -->
      <div style="position:absolute;right:80px;top:20px;text-align:center;">
        <img id="pkm-boss-img" src="boss.png"
             style="height:220px;filter:drop-shadow(0 0 16px red);animation:pkm-float 3s ease-in-out infinite;"
             onerror="this.style.display='none';document.getElementById('pkm-boss-fallback').style.display='block'">
        <div id="pkm-boss-fallback" style="display:none;font-size:5rem;line-height:1;">👨‍🏫</div>
      </div>

      <!-- Player sprite (bottom-left) -->
      <div style="position:absolute;left:80px;bottom:20px;text-align:center;">
        <div style="font-size:4rem;">🧑‍🎓</div>
        <!-- Player stat box bottom-right of player -->
      </div>

      <!-- Player stat box -->
      <div style="position:absolute;bottom:18px;right:40px;background:rgba(0,0,0,0.75);border:2px solid #fff;border-radius:4px;padding:8px 14px;min-width:200px;">
        <div style="font-size:1rem;font-weight:bold;letter-spacing:2px;margin-bottom:6px;">SINH VIÊN</div>
        <div style="font-size:.75rem;color:#aaa;margin-bottom:4px;">Lv.4 (Năm 4)</div>
        <div style="background:#333;height:10px;border-radius:5px;overflow:hidden;margin-bottom:3px;">
          <div id="pkm-player-hp-fill" style="height:100%;width:100%;background:lime;border-radius:5px;transition:none;"></div>
        </div>
        <div id="pkm-player-hp-num" style="font-size:.75rem;color:lime;text-align:right;">100/100</div>
      </div>
    </div>

    <!-- BATTLE UI BOX -->
    <div style="background:#111;border-top:3px solid #fff;display:flex;height:160px;box-sizing:border-box;">

      <!-- Dialog -->
      <div style="flex:1;padding:14px 20px;display:flex;align-items:center;">
        <div id="battle-dialog" style="font-size:1.1rem;color:#fff;line-height:1.6;max-width:480px;">
          * ...
        </div>
      </div>

      <!-- Move buttons -->
      <div id="pkm-menu" style="width:320px;border-left:3px solid #fff;display:grid;grid-template-columns:1fr 1fr;visibility:hidden;">
        <button onclick="battleAction('FIGHT')"  class="pkm-btn" style="border-right:1.5px solid #fff;border-bottom:1.5px solid #fff;">⚔️ FIGHT</button>
        <button onclick="battleAction('HOPE')"   class="pkm-btn" style="border-bottom:1.5px solid #fff;">💫 HOPE</button>
        <button onclick="battleAction('DREAM')"  class="pkm-btn" style="border-right:1.5px solid #fff;">💭 DREAM</button>
        <button onclick="battleAction('ESCAPE')" class="pkm-btn">🏃 ESCAPE</button>
      </div>
    </div>

    <style>
      @keyframes pkm-float {
        0%,100% { transform: translateY(0); }
        50%      { transform: translateY(-14px); }
      }
      @keyframes pkm-shake {
        0%,100% { transform: translateX(0); }
        20%,60% { transform: translateX(-10px); }
        40%,80% { transform: translateX(10px); }
      }
      @keyframes pkm-hit {
        0%,100% { opacity:1; filter:drop-shadow(0 0 16px red); }
        50%      { opacity:0.2; filter:brightness(5) saturate(0); }
      }
      .pkm-btn {
        background:#000;color:#fff;border:none;
        font-family:'Courier New',monospace;font-size:1rem;font-weight:bold;
        cursor:pointer;padding:0 10px;transition:.15s;
      }
      .pkm-btn:hover { background:#222; color:#ffdd00; }
    </style>`;
}

function showMenu(v) {
    const m = document.getElementById('pkm-menu');
    if (m) m.style.visibility = v ? 'visible' : 'hidden';
}

function bossHitAnim() {
    const img = document.getElementById('pkm-boss-img');
    const fb  = document.getElementById('pkm-boss-fallback');
    const el  = img && img.style.display !== 'none' ? img : fb;
    if (!el) return;
    el.style.animation = 'pkm-hit .5s ease, pkm-shake .4s ease';
    setTimeout(() => { el.style.animation = 'pkm-float 3s ease-in-out infinite'; }, 500);
}

// ============================================================
//  START BOSS
// ============================================================
window.startBossBattle = function() {
    bgMusic.pause(); bgMusic.currentTime = 0;
    bossMusic.play().catch(function(){});

    document.getElementById('story-screen').style.display = 'none';
    isPaused = true;
    gameRunning = false;

    // Reset
    battleHP = 100; bossHP = 200;
    displayBossHP = 200; displayPlayerHP = 100;
    bossPhaseIndex = 0; isPlayerTurn = false; hopeisused = false;

    buildBattleUI();
    showMenu(false);

    typeDialog('* ...Mày nghĩ lấy đủ 4 chìa khóa là thoát được sao?')
        .then(function() { return wait(600); })
        .then(function() { return typeDialog('* TA là UIT. Ta trường tồn. Và ngươi... sẽ ở lại đây MÃI MÃI.'); })
        .then(function() { return wait(400); })
        .then(function() { showMenu(true); isPlayerTurn = true; });
};

// ============================================================
//  BATTLE ACTIONS (turn-based Pokémon style)
// ============================================================

// Boss move pool theo phase
const BOSS_MOVES = [
    // Phase 0 — normal
    [
        { name: 'Trừ Điểm',    dmg: [15,25], msg: '* Giám thị trừ điểm thành phần! Bạn mất {dmg} HP.' },
        { name: 'Cảnh Cáo',    dmg: [10,18], msg: '* "Lần sau tôi đình chỉ thi!" Bạn mất {dmg} HP.' },
        { name: 'Nhìn Chằm',   dmg: [8, 14], msg: '* Giám thị nhìn bạn chằm chằm. Bạn run lên mất {dmg} HP.' },
    ],
    // Phase 1 — angry
    [
        { name: 'Đình Chỉ Thi', dmg: [20,30], msg: '* "Đình chỉ thi toàn bộ!" Bạn mất {dmg} HP.' },
        { name: 'Lấy Bài',      dmg: [18,26], msg: '* Giám thị tịch thu bài của bạn! Mất {dmg} HP.' },
        { name: 'Mời Ra',        dmg: [22,32], msg: '* "Ra ngoài ngay!" Bạn bị đuổi, mất {dmg} HP.' },
    ],
    // Phase 2 — desperate
    [
        { name: 'Đuổi Học',     dmg: [28,40], msg: '* "ĐUỔI HỌC!" — đòn chí mạng! Mất {dmg} HP.' },
        { name: 'Hủy Bằng',     dmg: [25,35], msg: '* Giám thị đe dọa hủy bằng tốt nghiệp! Mất {dmg} HP.' },
        { name: 'Điểm F Tất Cả', dmg: [30,42], msg: '* Tất cả môn điểm F! Bạn tuyệt vọng, mất {dmg} HP.' },
    ]
];

function bossTurn() {
    const pool = BOSS_MOVES[bossPhaseIndex];
    const move = pool[Math.floor(Math.random() * pool.length)];
    const dmg  = Math.floor(Math.random() * (move.dmg[1] - move.dmg[0] + 1)) + move.dmg[0];
    battleHP   = Math.max(0, battleHP - dmg);
    animateHP();

    // Player stat box shake
    const pFill = document.getElementById('pkm-player-hp-fill');
    if (pFill) {
        pFill.style.background = battleHP < 30 ? '#ff4400' : battleHP < 60 ? '#ffaa00' : 'lime';
    }

    return typeDialog(move.msg.replace('{dmg}', dmg));
}

window.battleAction = async function(action) {
    if (!isPlayerTurn) return;
    isPlayerTurn = false;
    showMenu(false);

    // ---- PLAYER TURN ----
    if (action === 'FIGHT') {
        const dmg = Math.floor(Math.random() * 20) + 15 + bossPhaseIndex * 5;
        bossHP = Math.max(0, bossHP - dmg);
        updateBossPhase();
        bossHitAnim();
        animateHP();

        const msgs = [
            `* Bạn dùng hết quyết tâm tấn công! Gây ${dmg} sát thương!`,
            `* Ký ức 4 năm bùng lên! Đòn mạnh ${dmg} điểm!`,
            `* TẤT CẢ SỨC MẠNH! ${dmg} sát thương khổng lồ!`
        ];
        await typeDialog(msgs[bossPhaseIndex] || msgs[2]);
    }
    else if (action === 'HOPE') {
        if (hiddenItemsFound > 0 && !hopeisused) {
            const dmg = hiddenItemsFound * 15;
            bossHP = Math.max(0, bossHP - dmg);
            hopeisused = true;
            updateBossPhase();
            bossHitAnim(); bossHitAnim();
            animateHP();
            await typeDialog(`* ${hiddenItemsFound} mảnh ký ức UIT bùng sáng! Boss nhận ${dmg} sát thương cực mạnh!`);
        } else if (hopeisused) {
            const heal = 12;
            battleHP = Math.min(100, battleHP + heal);
            animateHP();
            await typeDialog(`* Ký ức đã dùng hết... nhưng niềm tin vẫn còn. Hồi ${heal} HP.`);
        } else {
            await typeDialog(`* Bạn cầu cứu... nhưng chưa có mảnh Hy Vọng nào. (Thu thập vật phẩm cyan trước!)`);
        }
    }
    else if (action === 'DREAM') {
        const heal = bossPhaseIndex === 2 ? 15 : 30;
        battleHP = Math.min(100, battleHP + heal);
        animateHP();
        await typeDialog(`* Bạn nhớ lại những ngày tháng ở UIT... Hồi ${heal} HP.`);
    }
    else if (action === 'ESCAPE') {
        await typeDialog(`* Bỏ cuộc ư?! Kẻ không đủ quyết tâm KHÔNG ĐÁNG được tốt nghiệp!!`);
    }

    // ---- THẮNG? ----
    if (bossHP <= 0) {
        bossMusic.pause();
        bossHitAnim();
        await typeDialog('* N... Không thể... Một sinh viên... lại có thể...');
        await wait(1000);
        await typeDialog('* ...Được rồi. Chúc mừng tốt nghiệp. Bạn xứng đáng.');
        await wait(2500);
        document.getElementById('battle-screen').style.display = 'none';
        showStoryScreen('ending_good');
        return;
    }

    // ---- LƯỢT BOSS ----
    const phaseMsg = [
        '* Giám thị bình tĩnh lại và tấn công!',
        '* Giám thị bắt đầu tức giận!',
        '* GIÁM THỊ MẤT KIỂM SOÁT!'
    ];
    await typeDialog(phaseMsg[bossPhaseIndex]);
    await wait(400);
    await bossTurn();
    animateHP();

    // ---- THUA? ----
    if (battleHP <= 0) {
        bossMusic.pause();
        await typeDialog('* Bạn đã gục ngã... UIT giữ bạn lại mãi mãi.');
        await wait(2000);
        document.getElementById('battle-screen').style.display = 'none';
        showStoryScreen('ending_bad');
        return;
    }

    // Phase change dialog
    if (bossPhaseIndex === 1 && bossHP <= 100 && bossHP > 95) {
        await typeDialog('* (Giám thị bắt đầu run lên vì tức giận...)');
    } else if (bossPhaseIndex === 2 && bossHP <= 50 && bossHP > 45) {
        await typeDialog('* (Giám thị đã mất lý trí! Hắn trở nên cực kỳ nguy hiểm!)');
    } else {
        const waitMsgs = [
            '* Lượt của bạn. Hãy chiến đấu!',
            '* Tiếp tục đi, đừng bỏ cuộc!',
            '* Còn sống là còn hy vọng!'
        ];
        await typeDialog(waitMsgs[Math.floor(Math.random() * waitMsgs.length)]);
    }

    showMenu(true);
    isPlayerTurn = true;
};