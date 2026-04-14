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
const player = { x: 400, y: 300, size: 25, speed: 3 };

// Khởi tạo đối tượng Enemy từ class đã tách
const theNemesis = new Enemy(50, 50, 2); // Tốc độ cơ bản của Enemy là 1.5

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
        img.src = "https://www.uit.edu.vn/_next/image?url=https%3A%2F%2Fwww.uit.edu.vn%2Fstrapi%2Fuploads%2FUIT_1_e406b7e283.jpg&w=1536&q=75";
        text.innerText = "CHÚC MỪNG! Bạn đã sống sót khỏi ngôi trường và sẵn sàng nhận bằng tốt nghiệp!";
        footer.innerHTML = '<button class="retry-btn" style="background: green; border-color: lime;" onclick="showStoryScreen(\'plot_twist\')">LÊN NHẬN BẰNG</button>';
        screen.style.display = 'flex';
        return;
    } else if (type === "plot_twist") {
        img.src = "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=800"; 
        text.innerText = "Mày nghĩ chỉ đến vậy thôi sao? Thật sự nghĩ mình có thể thoát khỏi đây sao";
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
            if(map[r][c]===5) { ctx.fillStyle="cyan"; ctx.beginPath(); ctx.arc(c*50+25, r*50+25, 8, 0, 7); ctx.fill(); }
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
// --- HỆ THỐNG BOSS FIGHT DELTARUNE STYLE CHẮC CHẮN CHẠY ---
let battleHP = 100;
let bossHP = 200;
let isPlayerTurn = false;

window.startBossBattle = function() {
    console.log("Boss battle bắt đầu!"); // Debug log

    // Check if story-screen exists and hide it
    const storyScreen = document.getElementById('story-screen');
    if (storyScreen) {
        storyScreen.style.display = 'none';
        console.log("story-screen hidden");
    } else {
        console.error("story-screen not found");
    }

    isPaused = true;
    gameRunning = false;

    // Initialize battle stats
    battleHP = 100;
    bossHP = 200;

    // Check if battle-screen exists and show it
    const battleScreen = document.getElementById('battle-screen');
    if (battleScreen) {
        battleScreen.style.setProperty("display", "flex", "important");
        console.log("battle-screen displayed");
    } else {
        console.error("battle-screen not found");
    }

    updateBattleUI();
    typeDialog("* BOSS CUỐI CÙNG XUẤT HIỆN! Hắn sẽ không để bạn ra trường dễ dàng vậy đâu.");

    // Wait 2.5s before allowing player to act
    setTimeout(() => {
        typeDialog("* Lượt của bạn!");
        isPlayerTurn = true;
    }, 2500);
};

function updateBattleUI() {
    document.getElementById('player-hp').innerText = battleHP;
    document.getElementById('boss-hp').innerText = bossHP;
}

// Hiệu ứng gõ chữ
// Biến toàn cục để lưu trữ bộ đếm thời gian, giúp hủy tiến trình cũ nếu có tiến trình mới
let currentTypingTimer = null;

/**
 * Hiển thị hiệu ứng gõ chữ từng ký tự.
 * @param {string} text - Nội dung văn bản cần hiển thị.
 * @param {Object} options - Các tùy chọn bổ sung (tốc độ, id phần tử).
 * @returns {Promise} - Trả về Promise để có thể chờ (await) khi gõ xong.
 */
function typeDialog(text, options = {}) {
    const { speed = 50, elementId = 'battle-dialog' } = options;
    const dialogBox = document.getElementById(elementId);

    // Kiểm tra an toàn: Nếu phần tử không tồn tại thì dừng hàm
    if (!dialogBox) {
        console.warn(`[typeDialog] Không tìm thấy phần tử có ID '${elementId}'`);
        return Promise.resolve(); 
    }

    // Nếu đang có một tiến trình gõ chữ khác đang chạy, hãy dừng nó lại
    if (currentTypingTimer) {
        clearTimeout(currentTypingTimer);
    }

    // Reset nội dung. Dùng textContent an toàn và nhanh hơn innerHTML
    dialogBox.textContent = "";
    let i = 0;

    return new Promise((resolve) => {
        function typeWriter() {
            if (i < text.length) {
                dialogBox.textContent += text[i];
                i++;
                currentTypingTimer = setTimeout(typeWriter, speed);
            } else {
                // Đã gõ xong
                currentTypingTimer = null;
                resolve(true); 
            }
        }
        typeWriter();
    });
}
let hopeisused = false;
// Hàm xử lý nút bấm
window.battleAction = async function(action) {
    if (!isPlayerTurn) return;
    isPlayerTurn = false; 

    if (action === 'FIGHT') {
        let dmg = Math.floor(Math.random() * 20) + 15; 
        bossHP -= dmg;
        await typeDialog(`* Dùng chính sự quyết tâm của mình, bạn gây ra ${dmg} HP.`);
    } 
  else if (action === 'HOPE') {
        if (hiddenItemsFound > 0&&!hopeisused) {
            let dmg = hiddenItemsFound * 10;
            bossHP -= dmg;
            hopeisused = true;
            await typeDialog(`* Từ ${hiddenItemsFound} mảnh ký ức. UIT cộng hưởng với bạn tung đòn tất sát. Boss nhận ${dmg} sát thương!`);
        } else {
            await typeDialog(`* Bạn cố gắng cầu cứu,..... nhưng không có ai đến (Bạn chưa thu thập mảnh Hy Vọng nào).`);
        }
    }
    else if (action === 'DREAM') {
        let heal = 40;
        battleHP = Math.min(100, battleHP + heal);
        typeDialog(`* UIT đang chúc phúc cho bạn, hồi lại ${heal} HP.`);
    } 
    else if (action === 'ESCAPE') {
       await typeDialog(`* Bỏ cuộc ư?? nằm mơ đi, kẻ không đủ quyết tâm không đáng để tồn tại!`);
    }
    

    updateBattleUI();
  if (bossHP <= 0) {
        setTimeout(async () => {
            await typeDialog("* Boss gục ngã! BẠN ĐÃ THỰC SỰ TỐT NGHIỆP TRƯỜNG UIT!");
            setTimeout(() => {
                alert("CHÚC MỪNG! CHẾ ĐỘ TRUE ENDING ĐÃ ĐƯỢC MỞ KHÓA!");
                location.reload(); 
            }, 3000);
        }, 2000);
        
        // Phải đặt return ở ĐÂY để ngắt luôn hàm battleAction, 
        // không cho code chạy tiếp xuống hàm bossTurn ở dưới nữa
        return; 
    } // <--- ĐÓNG NGOẶC KHỐI IF TẠI ĐÂY

    // Nếu boss chưa chết (code vượt qua được lệnh return phía trên)
    // thì mới gọi hàm lượt của boss
    setTimeout(bossTurn, 2500); 
};

async function bossTurn() {
    let dmg = Math.floor(Math.random() * 25) + 20;
    battleHP -= dmg;

    await typeDialog(`* Boss giáng xuống 1 đòn "Trượt Môn"! Bạn mất ${dmg} HP.`); 
    updateBattleUI();

    if (battleHP <= 0) {
        setTimeout(() => {
            document.getElementById('battle-screen').style.display = 'none';
            showStoryScreen('ending_bad'); 
        }, 2000);
        return;
    }

    setTimeout(async () => {
        await typeDialog("* Lượt của bạn! Chọn hành động đi.");
        isPlayerTurn = true;
    }, 2500);
}