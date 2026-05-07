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

// Input Xử lý mượt mà
const keysPressed = {};
window.onkeydown = (e) => {
    keysPressed[e.code] = true;
    if (isPaused && (e.code === 'KeyJ'||e.code === 'Enter')) handleNextStory();
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
            gameRunning = true;
        }
    }, 1500);
}

function update() {
    if (!gameRunning || isPaused) return;

    let nx = player.x, ny = player.y;
    if ((keysPressed['KeyW'] || keysPressed['ArrowUp']) ) ny -= player.speed;
    if ((keysPressed['KeyS'] || keysPressed['ArrowDown']) ) ny += player.speed;
    if ((keysPressed['KeyA'] || keysPressed['ArrowLeft']) ) nx -= player.speed;
    if ((keysPressed['KeyD'] || keysPressed['ArrowRight']) ) nx += player.speed;
    if (canMoveTo(nx, ny)) {
        player.x = nx;
        player.y = ny;
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
            if(map[r][c]===1) { ctx.fillStyle="#121212"; ctx.fillRect(c*50, r*50, 50, 50); }
            if(map[r][c]===3) { ctx.fillStyle="yellow"; ctx.beginPath(); ctx.arc(c*50+25, r*50+25, 10, 0, 7); ctx.fill(); }
            if(map[r][c]===5) { ctx.fillStyle="cyan"; ctx.beginPath(); ctx.arc(c*50+25, r*50+25, 8, 0, 7); ctx.fill(); }
            if(map[r][c]===4) { ctx.fillStyle="green"; ctx.fillRect(c*50, r*50, 50, 50); };
        }
    }
    
    // Gọi hàm vẽ Enemy
  enemies.forEach(enemy => enemy.draw(ctx, currentRoomX, currentRoomY));
    
    // Vẽ Player
    ctx.fillStyle = "#007bff"; ctx.fillRect(player.x, player.y, 25, 25);

    // Sương mù (Vignette effect)
    const grad = ctx.createRadialGradient(player.x+12, player.y+12, 50, player.x+12, player.y+12, 150);
    grad.addColorStop(0, "transparent"); grad.addColorStop(1, "rgba(0,0,0,0.8)");
    ctx.fillStyle = grad; ctx.fillRect(0,0,800,600);
}



function gameLoop() {
    if (!isPaused && gameRunning) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);


        updatePlayer();
        updateEnemies();
        renderGame();
    }
    requestAnimationFrame(gameLoop);
}

function updatePlayer() {
    if ((keysPressed['KeyW'] || keysPressed['ArrowUp']) ) ny -= player.speed;
    if ((keysPressed['KeyS'] || keysPressed['ArrowDown']) ) ny += player.speed;
    if ((keysPressed['KeyA'] || keysPressed['ArrowLeft']) ) nx -= player.speed;
    if ((keysPressed['KeyD'] || keysPressed['ArrowRight']) ) nx += player.speed;
    if (canMoveTo(nx, ny)) {
        player.x = nx;
        player.y = ny;
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
        
        if (currentRoomX === enemy.roomX && currentRoomY === enemy.roomY) {
            if (Math.hypot(player.x - enemy.x, player.y - enemy.y) < 25) {
                triggerJumpscare();
            }
        }
    });
}

function updateEnemies() {
    enemies.forEach(enemy => {
        enemy.update(player, currentRoomX, currentRoomY, keysFound);
        
        if (currentRoomX === enemy.roomX && currentRoomY === enemy.roomY) {
            if (Math.hypot(player.x - enemy.x, player.y - enemy.y) < 25) {
                triggerJumpscare();
            }
        }
    });
}

function renderGame() {
    draw();
}

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
 