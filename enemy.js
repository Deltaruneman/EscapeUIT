class BaseEnemy {
    constructor(startX, startY, baseSpeed, color) {
        this.x = startX;
        this.y = startY;
        this.roomX = 0;
        this.roomY = 0;
        this.size = 30;
        this.baseSpeed = baseSpeed;
        this.currentSpeed = baseSpeed;
        this.color = color;
        this.wanderTargetX = null;
        this.wanderTargetY = null;
    }

    // AI Tìm đường dùng BFS
    findPath(startC, startR, targetC, targetR, map) {
        if (startC < 0 || startC >= COLS || startR < 0 || startR >= ROWS) return [];
        if (startC === targetC && startR === targetR) return [];

        let queue = [{c: startC, r: startR, parent: null}];
        let visited = new Set();
        visited.add(`${startC},${startR}`);
        let targetNode = null;
        const dirs = [{dc:0, dr:-1}, {dc:0, dr:1}, {dc:-1, dr:0}, {dc:1, dr:0}];

        while (queue.length > 0) {
            let curr = queue.shift();
            if (curr.c === targetC && curr.r === targetR) { targetNode = curr; break; }

            for (let d of dirs) {
                let nc = curr.c + d.dc, nr = curr.r + d.dr;
                if (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS) {
                    if (map[nr] && map[nr][nc] !== 1 && map[nr][nc] !== 4) { 
                        let key = `${nc},${nr}`;
                        if (!visited.has(key)) {
                            visited.add(key);
                            queue.push({c: nc, r: nr, parent: curr});
                        }
                    }
                }
            }
        }
        if (!targetNode) return [];
        let path = [];
        let curr = targetNode;
        while (curr.parent !== null) { path.push({c: curr.c, r: curr.r}); curr = curr.parent; }
        return path.reverse(); 
    }

    handleRoomTransition() {
        if (this.x < -15) { this.roomX--; this.x = 780; }
        else if (this.x > 790) { this.roomX++; this.x = 10; }
        if (this.y < -15) { this.roomY--; this.y = 580; }
        else if (this.y > 590) { this.roomY++; this.y = 10; }
    }

    pickRandomWanderTarget(map) {
        let validTiles = [];
        for (let r=0; r<ROWS; r++) {
            for (let c=0; c<COLS; c++) {
                if (map[r] && map[r][c] !== 1) {
                    validTiles.push({c, r});
                }
            }
        }
        if (validTiles.length > 0) {
            let rTile = validTiles[Math.floor(Math.random() * validTiles.length)];
            this.wanderTargetX = rTile.c * TILE_SIZE + 10;
            this.wanderTargetY = rTile.r * TILE_SIZE + 10;
        }
    }

    wanderMove(map) {
        // Nếu chưa có mục tiêu hoặc đã đến gần mục tiêu, chọn điểm mới
        if (!this.wanderTargetX || Math.hypot(this.wanderTargetX - this.x, this.wanderTargetY - this.y) < 15) {
            this.pickRandomWanderTarget(map);
        }

        this.chaseMove(this.wanderTargetX, this.wanderTargetY, map, false);
    }

    chaseMove(targetX, targetY, map, isAcrossRooms = false) {
        let ec = Math.floor((this.x + this.size/2) / TILE_SIZE);
        let er = Math.floor((this.y + this.size/2) / TILE_SIZE);
        let tc = Math.floor(targetX / TILE_SIZE);
        let tr = Math.floor(targetY / TILE_SIZE);

        let safeTc = Math.max(0, Math.min(COLS - 1, tc));
        let safeTr = Math.max(0, Math.min(ROWS - 1, tr));

        let path = this.findPath(ec, er, safeTc, safeTr, map);

        if (path.length > 0) {
            let nextStep = path[0];
            let nextX = nextStep.c * TILE_SIZE + 10;
            let nextY = nextStep.r * TILE_SIZE + 10;
            let dx = nextX - this.x, dy = nextY - this.y;
            let dist = Math.hypot(dx, dy);
            if (dist > 0) {
                this.x += (dx / dist) * this.currentSpeed;
                this.y += (dy / dist) * this.currentSpeed;
            }
        } else if (isAcrossRooms) {
            // Vượt viền màn hình nếu khác phòng
            let dx = targetX - this.x, dy = targetY - this.y;
            let dist = Math.hypot(dx, dy);
            if (dist > 0) {
                this.x += (dx / dist) * this.currentSpeed;
                this.y += (dy / dist) * this.currentSpeed;
            }
        } else {
            // Kẹt đường (không tìm được path), ép chọn mục tiêu wander mới
            this.pickRandomWanderTarget(map);
        }
    }

    draw(ctx, currentRoomX, currentRoomY) {
        if(this.roomX === currentRoomX && this.roomY === currentRoomY) {
            ctx.fillStyle = this.color; 
            ctx.fillRect(this.x, this.y, this.size, this.size);
        }
    }
    
    savePosition() {
        this.savedX = this.x;
        this.savedY = this.y;
        this.savedRoomX = this.roomX;
        this.savedRoomY = this.roomY;
    }

    respawn() {
        if (this.savedX !== undefined && this.savedY !== undefined) {
            this.x = this.savedX;
            this.y = this.savedY;
            this.roomX = this.savedRoomX;
            this.roomY = this.savedRoomY;
            this.wanderTargetX = null;
        }
    }
}

// Define a safe zone
const SAFE_ZONE = { x: 300, y: 250, width: 200, height: 150 }; // Example coordinates

// Helper function to check if a point is inside the safe zone
function isInSafeZone(x, y) {
    return (
        x > SAFE_ZONE.x &&
        x < SAFE_ZONE.x + SAFE_ZONE.width &&
        y > SAFE_ZONE.y &&
        y < SAFE_ZONE.y + SAFE_ZONE.height
    );
}

// 🔴 Loại Đỏ: Cơ chế bám đuôi liên tục y như cũ
class RedEnemy extends BaseEnemy {
    constructor(startX, startY, baseSpeed) {
        super(startX, startY, baseSpeed, "red");
    }
update(player, roomX, roomY) {
    if (this.roomX !== roomX || this.roomY !== roomY) return;

    let dx = player.x - this.x;
    let dy = player.y - this.y;
    let dist = Math.hypot(dx, dy);

    let nx = this.x + (dx / dist) * this.speed;
    let ny = this.y + (dy / dist) * this.speed;

    // ✅ CHECK COLLISION
    if (!isColliding(nx, this.y, this.size, roomX, roomY)) {
        this.x = nx;
    }
    if (!isColliding(this.x, ny, this.size, roomX, roomY)) {
        this.y = ny;
    }
}
}

// 🟢 Loại Xanh: Chỉ di chuyển ngẫu nhiên
class GreenEnemy extends BaseEnemy {
    constructor(startX, startY, baseSpeed) {
        super(startX, startY, baseSpeed, "green");
    }
    update(player, currentRoomX, currentRoomY, keysFound) {
        this.currentSpeed = this.baseSpeed + (keysFound * 0.1); 
        const map = getMap(this.roomX, this.roomY);
        this.wanderMove(map);
        this.handleRoomTransition();
    }
}

// 🌸 Loại Hồng: Bảo vệ Key/Item
class PinkEnemy extends BaseEnemy {
    constructor(startX, startY, baseSpeed) {
        super(startX, startY, baseSpeed, "pink");
    }
    update(player, currentRoomX, currentRoomY, keysFound) {
        this.currentSpeed = this.baseSpeed + (keysFound * 0.2);
        const map = getMap(this.roomX, this.roomY);
        let isChasing = false;

        // Bán kính phát hiện (khoảng 5 blocks)
        const detectRadius = 250; 

        if (this.roomX === currentRoomX && this.roomY === currentRoomY) {
            for(let r=0; r<ROWS; r++){
                for(let c=0; c<COLS; c++){
                    // Check xem tile này có phải key (3) hoặc item (5)
                    if(map[r] && (map[r][c] === 3 || map[r][c] === 5)){
                        let itemX = c * TILE_SIZE + TILE_SIZE/2;
                        let itemY = r * TILE_SIZE + TILE_SIZE/2;
                        
                        let distToEnemy = Math.hypot(this.x + this.size/2 - itemX, this.y + this.size/2 - itemY);
                        let distToPlayer = Math.hypot(player.x + player.size/2 - itemX, player.y + player.size/2 - itemY);

                        // Cả Quái và Người chơi đều phải nằm trong bán kính của Item đó
                        if (distToEnemy < detectRadius && distToPlayer < detectRadius) {
                            isChasing = true;
                            break;
                        }
                    }
                }
                if(isChasing) break;
            }
        }

        if (isChasing) {
            this.chaseMove(player.x, player.y, map, false);
        } else {
            this.wanderMove(map);
        }
        this.handleRoomTransition();
    }
}