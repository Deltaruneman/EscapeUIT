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

const player = { x: 400, y: 300, size: 25, speed: 3 };

// Khởi tạo đối tượng Enemy từ class đã tách
const theNemesis = new Enemy(50, 50, 2.5);

let currentStoryIdx = 0;
let storyMode = "intro";

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
    else if (type === "ending_bad") {
        img.src = "https://images.unsplash.com/photo-1601513445498-5dbffc8d5d40?q=80&w=800";
        text.innerText = "GAME OVER - BẠN ĐÃ BỊ KẸT LẠI MÃI MÃI TẠI UIT";
        footer.innerHTML = '<button class="retry-btn" onclick="location.reload()">CHƠI LẠI</button>';
        screen.style.display = 'flex';
        return;
    }  else if (type === "ending_good") {
        img.src = "https://www.uit.edu.vn/_next/image?url=https%3A%2F%2Fwww.uit.edu.vn%2Fstrapi%2Fuploads%2FUIT_1_e406b7e283.jpg&w=1536&q=75";
        text.innerText = "CHÚC MỪNG! Bạn đã sống sót và sẵn sàng lên bục nhận bằng tốt nghiệp!";
        // SỬA ONCLICK Ở ĐÂY:
        footer.innerHTML = '<button class="retry-btn" style="background: green; border-color: lime;" onclick="startBossBattle()">LÊN NHẬN BẰNG</button>';
        screen.style.display = 'flex';
        return;
    }
     else if (type === "plot_twist") {
        img.src = "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=800"; 
        text.innerText = "Mày nghĩ chỉ đến vậy thôi sao? Thật sự nghĩ mình có thể thoát khỏi đây sao";
        footer.innerHTML = '<button class="retry-btn" onclick="location.reload()">CHƠI LẠI TỪ ĐẦU (KIẾP NÀY BỎ)</button>';
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

document.getElementById('start-btn').onclick = () => {
    document.getElementById('start-screen').style.display = 'none';
    showStoryScreen("intro");
};

function triggerJumpscare() {
    deathCount++;
    document.getElementById('death-count').innerText = deathCount;
    gameRunning = false;
    document.getElementById('jumpscare-overlay').style.display = 'block';
    
    document.getElementById('jumpscare-img').src = "nomon.png"; 

    setTimeout(() => {
        document.getElementById('jumpscare-overlay').style.display = 'none';
        if (deathCount >= 20) showStoryScreen("ending_bad");
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
    if (keysPressed['KeyW'] || keysPressed['ArrowUp']) ny -= player.speed;
    if (keysPressed['KeyS'] || keysPressed['ArrowDown']) ny += player.speed;
    if (keysPressed['KeyA'] || keysPressed['ArrowLeft']) nx -= player.speed;
    if (keysPressed['KeyD'] || keysPressed['ArrowRight']) nx += player.speed;

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
        document.getElementById('key-count').innerText = keysFound;
        showStoryScreen("key"); 
    }

    // Gọi logic update của Enemy
    theNemesis.update(player, currentRoomX, currentRoomY, keysFound);

    // Xử lý va chạm với Enemy
    if (currentRoomX === theNemesis.roomX && currentRoomY === theNemesis.roomY) {
        if (Math.hypot(player.x - theNemesis.x, player.y - theNemesis.y) < 25) {
            triggerJumpscare();
        }
    }
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
            if(map[r][c]===1) { ctx.fillStyle="#333"; ctx.fillRect(c*50, r*50, 50, 50); }
            if(map[r][c]===3) { ctx.fillStyle="yellow"; ctx.beginPath(); ctx.arc(c*50+25, r*50+25, 10, 0, 7); ctx.fill(); }
        }
    }
    
    // Gọi hàm vẽ Enemy
    theNemesis.draw(ctx, currentRoomX, currentRoomY);
    
    // Vẽ Player
    ctx.fillStyle = "#007bff"; ctx.fillRect(player.x, player.y, 25, 25);

    // Sương mù (Vignette effect)
    const grad = ctx.createRadialGradient(player.x+12, player.y+12, 50, player.x+12, player.y+12, 150);
    grad.addColorStop(0, "transparent"); grad.addColorStop(1, "rgba(0,0,0,0.8)");
    ctx.fillStyle = grad; ctx.fillRect(0,0,800,600);
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

document.getElementById('respawn-btn').onclick = () => {
    player.x = 400; // Reset player position
    player.y = 300;
    theNemesis.respawn(); // Restore enemy to its saved position
    deathCount++;
    isPaused = false;
    gameRunning = true;
};

theNemesis.savePosition(); // Save enemy position at the start or key moments

// Save the enemy's position when the game starts
window.onload = () => {
    theNemesis.savePosition();
};
// --- HỆ THỐNG BOSS FIGHT DELTARUNE STYLE ---
let battleHP = 100;
let bossHP = 200;
let isPlayerTurn = false;

function startBossBattle() {
    // Ẩn màn hình cốt truyện và dừng game chính
    document.getElementById('story-screen').style.display = 'none';
    isPaused = true;
    gameRunning = false;
    
    // Khởi tạo chỉ số
    battleHP = 100;
    bossHP = 200;
    
    // Hiện UI Battle
    const battleScreen = document.getElementById('battle-screen');
    battleScreen.style.display = 'flex';
    
    updateBattleUI();
    typeDialog("* BOSS CUỐI CÙNG XUẤT HIỆN! Hắn sẽ không để bạn ra trường dễ dàng vậy đâu.");
    
    // Đợi 2s trước khi cho player đánh
    setTimeout(() => {
        typeDialog("* Lượt của bạn!");
        isPlayerTurn = true;
    }, 2500);
}

function updateBattleUI() {
    document.getElementById('player-hp').innerText = battleHP;
    document.getElementById('boss-hp').innerText = bossHP;
}

// Hiệu ứng gõ chữ từng ký tự
function typeDialog(text) {
    const dialogBox = document.getElementById('battle-dialog');
    dialogBox.innerText = "";
    let i = 0;
    let speed = 25; // Tốc độ gõ
    
    function typeWriter() {
        if (i < text.length) {
            dialogBox.innerHTML += text.charAt(i);
            i++;
            setTimeout(typeWriter, speed);
        }
    }
    typeWriter();
}

// Hàm xử lý nút bấm của người chơi
function battleAction(action) {
    if (!isPlayerTurn) return;
    isPlayerTurn = false; // Khóa lượt

    if (action === 'FIGHT') {
        let dmg = Math.floor(Math.random() * 20) + 15; // Sát thương 15 - 34
        bossHP -= dmg;
        typeDialog(`* Bạn ném đống Assignment vào mặt Boss! Hắn mất ${dmg} HP.`);
    } 
    else if (action === 'ACT') {
        typeDialog(`* Bạn xin xỏ điểm liệt... Boss lườm bạn một cách khinh bỉ.`);
    } 
    else if (action === 'ITEM') {
        let heal = 40;
        battleHP = Math.min(100, battleHP + heal);
        typeDialog(`* Bạn uống 1 lon Bò Húc! Hồi phục ${heal} HP.`);
    } 
    else if (action === 'SPARE') {
        typeDialog(`* Bạn cố gắng thương lượng... NHƯNG HẮN TỪ CHỐI SPARE!`);
    }

    updateBattleUI();

    // Kiểm tra Boss chết chưa
    if (bossHP <= 0) {
        setTimeout(() => {
            typeDialog("* Boss gục ngã! BẠN ĐÃ THỰC SỰ TỐT NGHIỆP TRƯỜNG UIT!");
            setTimeout(() => {
                alert("CHÚC MỪNG! CHẾ ĐỘ TRUE ENDING ĐÃ ĐƯỢC MỞ KHÓA!");
                location.reload(); 
            }, 3000);
        }, 2000);
        return;
    }

    // Chuyển sang lượt của Boss sau 2 giây
    setTimeout(bossTurn, 2500);
}

// Lượt của quái vật tấn công
function bossTurn() {
    let dmg = Math.floor(Math.random() * 20) + 15;
    battleHP -= dmg;
    
    typeDialog(`* Boss giáng xuống 1 đòn "Trượt Môn"! Bạn mất ${dmg} HP.`);
    updateBattleUI();

    // Kiểm tra Player chết chưa
    if (battleHP <= 0) {
        setTimeout(() => {
            document.getElementById('battle-screen').style.display = 'none';
            showStoryScreen('ending_bad'); // Dùng lại bad ending có sẵn của bạn
        }, 2000);
        return;
    }

    // Trả lại lượt cho player
    setTimeout(() => {
        typeDialog("* Lượt của bạn! Chọn hành động đi.");
        isPlayerTurn = true;
    }, 2500);
}

function showBattleScreen() {
    isPaused = true;
    gameRunning = false;

    const battleScreen = document.getElementById('battle-screen');
    if (!battleScreen) {
        console.error('Battle screen element not found!');
        return;
    }

    battleScreen.style.display = 'flex';

    // Example content for the battle screen
    battleScreen.innerHTML = `
        <div class="battle-container">
            <h1>Battle Start!</h1>
            <p>Prepare to fight the Nemesis!</p>
            <button onclick="startBattle()">Start Battle</button>
        </div>
    `;
}

function startBattle() {
    const battleScreen = document.getElementById('battle-screen');
    battleScreen.style.display = 'none';
    isPaused = false;
    gameRunning = true;

    // Add battle logic here
    console.log('Battle started!');
}