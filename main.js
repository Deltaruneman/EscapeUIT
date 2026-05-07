# PHIÊN BẢN ĐÃ FIX LỖI

```js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

const TILE_SIZE = 50;
const ROWS = 12;
const COLS = 16;

let gameRunning = false;
let isPaused = false;
let keysFound = 0;
let deathCount = 0;
let currentRoomX = 0;
let currentRoomY = 0;
let hiddenItemsFound = 0;
let hopeCount = 0;

const player = {
    x: 400,
    y: 300,
    size: 25,
    speed: 3.2
};

// ============================================================
// ENEMY SYSTEM
// ============================================================

class Enemy {
    constructor(x, y, speed, color) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.color = color;
        this.roomX = 0;
        this.roomY = 0;
        this.startX = x;
        this.startY = y;
    }

    update(player) {
        let dx = player.x - this.x;
        let dy = player.y - this.y;
        let dist = Math.hypot(dx, dy);

        if (dist > 0) {
            let nx = this.x + (dx / dist) * this.speed;
            let ny = this.y + (dy / dist) * this.speed;

            if (!isColliding(nx, ny, 25, this.roomX, this.roomY)) {
                this.x = nx;
                this.y = ny;
            }
        }
    }

    draw(ctx, roomX, roomY) {
        if (roomX !== this.roomX || roomY !== this.roomY) return;

        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, 25, 25);
    }

    respawn() {
        this.x = this.startX;
        this.y = this.startY;
    }

    savePosition() {
        this.startX = this.x;
        this.startY = this.y;
    }
}

class RedEnemy extends Enemy {
    constructor(x, y, speed) {
        super(x, y, speed, 'red');
    }
}

class GreenEnemy extends Enemy {
    constructor(x, y, speed) {
        super(x, y, speed, 'green');
    }
}

class PinkEnemy extends Enemy {
    constructor(x, y, speed) {
        super(x, y, speed, 'pink');
    }
}

const enemies = [
    new RedEnemy(50, 50, 2),
    new GreenEnemy(200, 200, 1.5),
    new PinkEnemy(600, 400, 1.8)
];

enemies[1].roomX = 1;
enemies[1].roomY = 0;

enemies[2].roomX = 0;
enemies[2].roomY = 1;

// ============================================================
// AUDIO
// ============================================================

const bgMusic = new Audio('bgm.wav');
bgMusic.loop = true;
bgMusic.volume = 0.5;

const bossMusic = new Audio('LastChance42.wav');
bossMusic.loop = true;
bossMusic.volume = 0.6;

// ============================================================
// INPUT
// ============================================================

const keysPressed = {};

window.addEventListener('keydown', (e) => {
    keysPressed[e.code] = true;

    if (isPaused && (e.code === 'KeyJ' || e.code === 'Enter')) {
        handleNextStory();
    }
});

window.addEventListener('keyup', (e) => {
    keysPressed[e.code] = false;
});

// ============================================================
// MAP
// ============================================================

const currentMap = Array.from({ length: ROWS }, () =>
    Array(COLS).fill(0)
);

function getMap() {
    return currentMap;
}

function isColliding(x, y, size, rX, rY) {
    const map = getMap(rX, rY);

    const points = [
        { x: x, y: y },
        { x: x + size, y: y },
        { x: x, y: y + size },
        { x: x + size, y: y + size }
    ];

    for (let p of points) {
        let c = Math.floor(p.x / TILE_SIZE);
        let r = Math.floor(p.y / TILE_SIZE);

        if (map[r] && map[r][c] === 1) {
            return true;
        }
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

        if (row < 0 || row >= ROWS || col < 0 || col >= COLS) {
            continue;
        }

        let tile = map[row][col];

        if (tile === 1) {
            return false;
        }

        if (tile === 4 && hopeCount <= 5) {
            return false;
        }
    }

    return true;
}

// ============================================================
// UPDATE
// ============================================================

function update() {
    if (!gameRunning || isPaused) return;

    let nx = player.x;
    let ny = player.y;

    if (keysPressed['KeyW'] || keysPressed['ArrowUp']) ny -= player.speed;
    if (keysPressed['KeyS'] || keysPressed['ArrowDown']) ny += player.speed;
    if (keysPressed['KeyA'] || keysPressed['ArrowLeft']) nx -= player.speed;
    if (keysPressed['KeyD'] || keysPressed['ArrowRight']) nx += player.speed;

    if (canMoveTo(nx, ny)) {
        player.x = nx;
        player.y = ny;
    }

    if (!isColliding(player.x, ny, player.size, currentRoomX, currentRoomY)) {
        player.y = ny;
    }

    if (!isColliding(nx, player.y, player.size, currentRoomX, currentRoomY)) {
        player.x = nx;
    }

    if (player.x < -15) {
        currentRoomX--;
        player.x = 780;
    }

    else if (player.x > 790) {
        currentRoomX++;
        player.x = 10;
    }

    if (player.y < -15) {
        currentRoomY--;
        player.y = 580;
    }

    else if (player.y > 590) {
        currentRoomY++;
        player.y = 10;
    }

    const map = getMap(currentRoomX, currentRoomY);

    let pc = Math.floor((player.x + 12) / TILE_SIZE);
    let pr = Math.floor((player.y + 12) / TILE_SIZE);

    // KEY
    if (map[pr] && map[pr][pc] === 3) {
        map[pr][pc] = 0;
        keysFound++;

        const countUI = document.getElementById('key-count');

        if (countUI) {
            countUI.innerText = keysFound;
        }
    }

    // HOPE ITEM
    if (map[pr] && map[pr][pc] === 5) {
        map[pr][pc] = 0;

        hiddenItemsFound++;
        hopeCount++;

        const countUI = document.getElementById('item-count');

        if (countUI) {
            countUI.innerText = hiddenItemsFound;
        }
    }

    // ENEMIES
    enemies.forEach(enemy => {
        enemy.update(player);

        if (
            currentRoomX === enemy.roomX &&
            currentRoomY === enemy.roomY
        ) {
            if (
                Math.hypot(player.x - enemy.x, player.y - enemy.y) < 25
            ) {
                triggerJumpscare();
            }
        }
    });
}

// ============================================================
// DRAW
// ============================================================

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 800, 600);

    const map = getMap(currentRoomX, currentRoomY);

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (map[r][c] === 1) {
                ctx.fillStyle = '#121212';
                ctx.fillRect(c * 50, r * 50, 50, 50);
            }

            if (map[r][c] === 3) {
                ctx.fillStyle = 'yellow';
                ctx.beginPath();
                ctx.arc(c * 50 + 25, r * 50 + 25, 10, 0, 7);
                ctx.fill();
            }

            if (map[r][c] === 5) {
                ctx.fillStyle = 'cyan';
                ctx.beginPath();
                ctx.arc(c * 50 + 25, r * 50 + 25, 8, 0, 7);
                ctx.fill();
            }
        }
    }

    enemies.forEach(enemy => {
        enemy.draw(ctx, currentRoomX, currentRoomY);
    });

    ctx.fillStyle = '#007bff';
    ctx.fillRect(player.x, player.y, 25, 25);

    // Vignette
    const grad = ctx.createRadialGradient(
        player.x + 12,
        player.y + 12,
        50,
        player.x + 12,
        player.y + 12,
        150
    );

    grad.addColorStop(0, 'transparent');
    grad.addColorStop(1, 'rgba(0,0,0,0.8)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 600);
}

// ============================================================
// JUMPSCARE
// ============================================================

function triggerJumpscare() {
    bgMusic.pause();

    deathCount++;

    const deathText = document.getElementById('death-count');

    if (deathText) {
        deathText.innerText = deathCount;
    }

    gameRunning = false;

    const overlay = document.getElementById('jumpscare-overlay');

    if (overlay) {
        overlay.style.display = 'block';
    }

    const img = document.getElementById('jumpscare-img');

    if (img) {
        img.src = 'nomon.gif';
    }

    setTimeout(() => {
        if (overlay) {
            overlay.style.display = 'none';
        }

        if (deathCount >= 5) {
            alert('GAME OVER');
            location.reload();
            return;
        }

        player.x = 400;
        player.y = 300;

        currentRoomX = 0;
        currentRoomY = 0;

        gameRunning = true;
    }, 1500);
}

// ============================================================
// LOOP
// ============================================================

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();

// ============================================================
// START
// ============================================================

window.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-btn');

    if (startBtn) {
        startBtn.onclick = () => {
            bgMusic.play().catch(err => console.log(err));
            gameRunning = true;
        };
    }

    enemies.forEach(enemy => {
        enemy.savePosition();
    });
});

// ============================================================
// ESC PAUSE
// ============================================================

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        isPaused = !isPaused;

        const pauseScreen = document.getElementById('pause-screen');

        if (pauseScreen) {
            pauseScreen.style.display = isPaused ? 'flex' : 'none';
        }
    }
});
```

