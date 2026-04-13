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

const player = { x: 400, y: 300, size: 25, speed: 2 };

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

    let data;
    if (type === "intro") data = storyScenes[currentStoryIdx];
    else if (type === "key") data = keyCollectScenes[keysFound - 1];
    else if (type === "ending_bad") {
        img.src = "https://images.unsplash.com/photo-1601513445498-5dbffc8d5d40?q=80&w=800";
        text.innerText = "GAME OVER - BẠN ĐÃ BỊ KẸT LẠI MÃI MÃI TẠI UIT";
        footer.innerHTML = '<button class="retry-btn" onclick="location.reload()">CHƠI LẠI</button>';
        screen.style.display = 'flex';
        return;
    } else if (type === "ending_good") {
        img.src = "https://www.uit.edu.vn/_next/image?url=https%3A%2F%2Fwww.uit.edu.vn%2Fstrapi%2Fuploads%2FUIT_1_e406b7e283.jpg&w=1536&q=75";
        text.innerText = "CHÚC MỪNG! Bạn đã sống sót khỏi ngôi trường và sẵn sàng nhận bằng tốt nghiệp!";
        footer.innerHTML = '<button class="retry-btn" style="background: green; border-color: lime;" onclick="showStoryScreen(\'plot_twist\')">LÊN NHẬN BẰNG</button>';
        screen.style.display = 'flex';
        return;
    } else if (type === "plot_twist") {
        img.src = "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=800"; 
        text.innerText = "PLOT TWIST: Tấm bằng UIT chỉ là khởi đầu. Kẻ thù bám theo bạn thực chất là DEADLINE CÔNG SỞ, CƠM ÁO GẠO TIỀN VÀ BẠN SẼ KHÔNG BAO GIỜ THOÁT ĐƯỢC!!!";
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
    if (isPaused && (e.code === 'KeyJ'||e.code === 'MouseLeft')) handleNextStory();
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
    
    // Nếu không có hình, nó vẫn hiện nền đen giật mình
    document.getElementById('jumpscare-img').src = "nomon.png"; 

    setTimeout(() => {
        document.getElementById('jumpscare-overlay').style.display = 'none';
        if (deathCount >= 20) showStoryScreen("ending_bad");
        else {
            player.x = 400; player.y = 300;
            currentRoomX = 0; currentRoomY = 0;
            
            // Reset Enemy bằng hàm trong OOP
            theNemesis.reset(50, 50);
            
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