// Thêm roomX và roomY vào để xác định phòng chứa Safe Zone (ví dụ phòng bắt đầu 0, 0)
const SAFE_ZONE = { x: 300, y: 250, width: 200, height: 150, roomX: 0, roomY: 0 };

// --- INVINCIBILITY FRAMES ---
// Sau khi player chết, enemy sẽ không tấn công được trong 1 giây
let invincibleUntil = 0;
function setInvincible(ms = 1000) { invincibleUntil = Date.now() + ms; }
function isInvincible() { return Date.now() < invincibleUntil; }

// Cập nhật hàm kiểm tra Safe Zone để check thêm phòng
function isInSafeZone(x, y, roomX, roomY) {
    // TILE_SIZE = 50, size của player = 25
    const map = getMap(roomX, roomY);
    
    // Lấy toạ độ tâm của người chơi/quái vật để check cho chính xác
    let col = Math.floor((x + 12.5) / 50); 
    let row = Math.floor((y + 12.5) / 50);
    
    // Nếu Player đang dẫm lên ô số 4 -> đang trong Safe Zone
    if (map && map[row] && map[row][col] === 4) {
        return true;
    }
    return false;
}


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

    // TÌM LỐI RA: Dùng để Enemy đi mép bản đồ qua phòng khác mà không bị đâm xuyên tường
    findClosestExit(map, targetRoomX, targetRoomY, player) {
        let validExits = [];
        let targetCol = -1, targetRow = -1;

        if (this.roomX < targetRoomX) targetCol = COLS - 1; 
        else if (this.roomX > targetRoomX) targetCol = 0;   
        else if (this.roomY < targetRoomY) targetRow = ROWS - 1; 
        else if (this.roomY > targetRoomY) targetRow = 0;   

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (map[r] && map[r][c] !== 1 && map[r][c] !== 4) { 
                    if ((targetCol !== -1 && c === targetCol) || (targetRow !== -1 && r === targetRow)) {
                        validExits.push({ c, r, x: c * TILE_SIZE + 10, y: r * TILE_SIZE + 10 });
                    }
                }
            }
        }

        if (validExits.length === 0) return null;

        let bestExit = validExits[0];
        let minDist = Infinity;
        for (let exit of validExits) {
            let dist = Math.hypot(exit.x - player.x, exit.y - player.y);
            if (dist < minDist) {
                minDist = dist;
                bestExit = exit;
            }
        }
        return bestExit;
    }

  pickRandomWanderTarget(map) {
        let validTiles = [];
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                // QUAN TRỌNG: Không cho AI đi dạo vào tường (1) và Safe Zone (4)
                if (map[r] && map[r][c] !== 1 && map[r][c] !== 4) {
                    validTiles.push({c, r});
                }
            }
        }
        if (validTiles.length > 0) {
            let rTile = validTiles[Math.floor(Math.random() * validTiles.length)];
            this.wanderTargetX = rTile.c * 50 + 10;
            this.wanderTargetY = rTile.r * 50 + 10;
        }
    }

    wanderMove(map) {
        if (!this.wanderTargetX || Math.hypot(this.wanderTargetX - this.x, this.wanderTargetY - this.y) < 15) {
            this.pickRandomWanderTarget(map);
        }
        this.chaseMove(this.wanderTargetX, this.wanderTargetY, map);
    }

    // ĐÃ FIX: Thuật toán di chuyển mượt bằng BFS 100%, khắc phục triệt để lỗi bỏ đuôi Player
    chaseMove(targetX, targetY, map) {
        let ec = Math.floor((this.x + this.size/2) / TILE_SIZE);
        let er = Math.floor((this.y + this.size/2) / TILE_SIZE);
        let tc = Math.floor(targetX / TILE_SIZE);
        let tr = Math.floor(targetY / TILE_SIZE);

        let safeTc = Math.max(0, Math.min(COLS - 1, tc));
        let safeTr = Math.max(0, Math.min(ROWS - 1, tr));

        let path = this.findPath(ec, er, safeTc, safeTr, map);

        if (path.length > 0) {
            // Đi lách qua tường bằng BFS
            let nextStep = path[0];
            let nextX = nextStep.c * TILE_SIZE + 10;
            let nextY = nextStep.r * TILE_SIZE + 10;
            let dx = nextX - this.x, dy = nextY - this.y;
            let dist = Math.hypot(dx, dy);
            if (dist > 0) {
                let moveDist = Math.min(this.currentSpeed, dist);
                this.x += (dx / dist) * moveDist;
                this.y += (dy / dist) * moveDist;
            }
        } else {
            // Đã tới CÙNG Ô LƯỚI với target, tiếp tục lao thẳng bám vào tọa độ tuyệt đối của mục tiêu 
            // HOẶC mục tiêu đang nằm ngoài viền màn hình (đang lúc chuyển phòng)
            if ((ec === safeTc && er === safeTr) || targetX < 0 || targetX > COLS * TILE_SIZE || targetY < 0 || targetY > ROWS * TILE_SIZE) {
                let dx = targetX - this.x, dy = targetY - this.y;
                let dist = Math.hypot(dx, dy);
                if (dist > 0) {
                    let moveDist = Math.min(this.currentSpeed, dist);
                    this.x += (dx / dist) * moveDist;
                    this.y += (dy / dist) * moveDist;
                }
            } else {
                // Kẹt thực sự ở sau tường (hiếm), ép chọn mục tiêu wander mới
                this.pickRandomWanderTarget(map);
            }
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

// 🔴 Loại Đỏ: Bám đuôi BFS + smooth acceleration + dự đoán vị trí player
class RedEnemy extends BaseEnemy {
    constructor(startX, startY, baseSpeed) {
        super(startX, startY, baseSpeed, "red");
        // Momentum / smooth movement
        this.vx = 0;
        this.vy = 0;
        this.acceleration = 0.18;
        this.friction = 0.82;
        // Rage mode khi player gần
        this.isRaging = false;
        // Predict player position
        this.predictionStrength = 0.35;
    }

    update(player, currentRoomX, currentRoomY, keysFound) {
        // Scale speed theo số key, rage burst khi rất gần
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        const sameRoom = (this.roomX === currentRoomX && this.roomY === currentRoomY);
        this.isRaging = sameRoom && dist < 120;
        const rageMultiplier = this.isRaging ? 1.5 : 1.0;
        this.currentSpeed = (this.baseSpeed + keysFound * 0.3) * rageMultiplier;

        const map = getMap(this.roomX, this.roomY);

        if (isInSafeZone(player.x, player.y, currentRoomX, currentRoomY)) {
            this.wanderMove(map);
            this.handleRoomTransition();
            return;
        }

        let targetX = player.x;
        let targetY = player.y;

        // Dự đoán vị trí player dựa trên velocity ước tính (chỉ khi cùng phòng)
        if (sameRoom && player.lastX !== undefined) {
            let pvx = player.x - player.lastX;
            let pvy = player.y - player.lastY;
            targetX += pvx * (60 * this.predictionStrength);
            targetY += pvy * (60 * this.predictionStrength);
        }

        if (this.roomX !== currentRoomX || this.roomY !== currentRoomY) {
            let exit = this.findClosestExit(map, currentRoomX, currentRoomY, player);
            if (exit) {
                targetX = exit.x;
                targetY = exit.y;
                let ec = Math.floor((this.x + this.size/2) / TILE_SIZE);
                let er = Math.floor((this.y + this.size/2) / TILE_SIZE);
                if (ec === exit.c && er === exit.r) {
                    if (this.roomX < currentRoomX) targetX = 850;
                    else if (this.roomX > currentRoomX) targetX = -50;
                    else if (this.roomY < currentRoomY) targetY = 650;
                    else if (this.roomY > currentRoomY) targetY = -50;
                }
            } else {
                if (this.roomX < currentRoomX) { targetX = 850; targetY = player.y; }
                else if (this.roomX > currentRoomX) { targetX = -50; targetY = player.y; }
                else if (this.roomY < currentRoomY) { targetX = player.x; targetY = 650; }
                else if (this.roomY > currentRoomY) { targetX = player.x; targetY = -50; }
            }
        }

        this.chaseMoveSmooth(targetX, targetY, map);
        this.handleRoomTransition();
    }

    // Di chuyển với momentum (mượt hơn chaseMove gốc)
    chaseMoveSmooth(targetX, targetY, map) {
        let ec = Math.floor((this.x + this.size/2) / TILE_SIZE);
        let er = Math.floor((this.y + this.size/2) / TILE_SIZE);
        let tc = Math.max(0, Math.min(COLS-1, Math.floor(targetX / TILE_SIZE)));
        let tr = Math.max(0, Math.min(ROWS-1, Math.floor(targetY / TILE_SIZE)));

        let path = this.findPath(ec, er, tc, tr, map);
        let dx = 0, dy = 0;

        if (path.length > 0) {
            let next = path[0];
            dx = (next.c * TILE_SIZE + 10) - this.x;
            dy = (next.r * TILE_SIZE + 10) - this.y;
        } else {
            dx = targetX - this.x;
            dy = targetY - this.y;
        }

        let d = Math.hypot(dx, dy);
        if (d > 0) {
            // Tích lũy vận tốc (smooth acceleration)
            this.vx += (dx / d) * this.currentSpeed * this.acceleration;
            this.vy += (dy / d) * this.currentSpeed * this.acceleration;
        }

        // Clamp tốc độ tối đa
        let speed = Math.hypot(this.vx, this.vy);
        if (speed > this.currentSpeed) {
            this.vx = (this.vx / speed) * this.currentSpeed;
            this.vy = (this.vy / speed) * this.currentSpeed;
        }

        this.x += this.vx;
        this.y += this.vy;

        // Friction
        this.vx *= this.friction;
        this.vy *= this.friction;
    }

    draw(ctx, currentRoomX, currentRoomY) {
        if (this.roomX !== currentRoomX || this.roomY !== currentRoomY) return;
        // Rage glow effect
        if (this.isRaging) {
            ctx.save();
            ctx.shadowColor = 'red';
            ctx.shadowBlur = 18 + Math.sin(Date.now() / 80) * 8;
        }
        ctx.fillStyle = this.isRaging ? '#ff2200' : 'red';
        ctx.fillRect(this.x, this.y, this.size, this.size);
        if (this.isRaging) ctx.restore();
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
        const detectRadius = 250; 

        // Ngừng rượt nếu Player trốn vô Safe Zone hợp lệ
        if (isInSafeZone(player.x, player.y, currentRoomX, currentRoomY)) {
            this.wanderMove(map);
            this.handleRoomTransition();
            return;
        }

        if (this.roomX === currentRoomX && this.roomY === currentRoomY) {
            for(let r=0; r<ROWS; r++){
                for(let c=0; c<COLS; c++){
                    if(map[r] && (map[r][c] === 3 || map[r][c] === 5)){
                        let itemX = c * TILE_SIZE + TILE_SIZE/2;
                        let itemY = r * TILE_SIZE + TILE_SIZE/2;
                        
                        let distToEnemy = Math.hypot(this.x + this.size/2 - itemX, this.y + this.size/2 - itemY);
                        let distToPlayer = Math.hypot(player.x + player.size/2 - itemX, player.y + player.size/2 - itemY);

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
            this.chaseMove(player.x, player.y, map);
        } else {
            this.wanderMove(map);
        }
        this.handleRoomTransition();
    }
}