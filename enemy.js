// Thêm roomX và roomY vào để xác định phòng chứa Safe Zone (ví dụ phòng bắt đầu 0, 0)
const SAFE_ZONE = { x: 300, y: 250, width: 200, height: 150, roomX: 0, roomY: 0 }; 

// Cập nhật hàm kiểm tra Safe Zone để check thêm phòng
function isInSafeZone(x, y, roomX, roomY) {
    return (
        roomX === SAFE_ZONE.roomX &&
        roomY === SAFE_ZONE.roomY &&
        x > SAFE_ZONE.x &&
        x < SAFE_ZONE.x + SAFE_ZONE.width &&
        y > SAFE_ZONE.y &&
        y < SAFE_ZONE.y + SAFE_ZONE.height
    );
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
        for (let r=0; r<ROWS; r++) {
            for (let c=0; c<COLS; c++) {
                if (map[r] && map[r][c] !== 1) {
                    let tileX = c * TILE_SIZE + 10;
                    let tileY = r * TILE_SIZE + 10;
                    
                    // Không bao giờ dạo bước ngẫu nhiên vào Safe Zone
                    if (isInSafeZone(tileX, tileY, this.roomX, this.roomY)) continue;
                    
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

// 🔴 Loại Đỏ: Cơ chế bám đuôi liên tục và thông minh bằng BFS
class RedEnemy extends BaseEnemy {
    constructor(startX, startY, baseSpeed) {
        super(startX, startY, baseSpeed, "red");
    }

    update(player, currentRoomX, currentRoomY, keysFound) {
        this.currentSpeed = this.baseSpeed + (keysFound * 0.3);
        const map = getMap(this.roomX, this.roomY);

        // Check xem Player có đang trong Safe Zone ĐÚNG PHÒNG ĐÓ không
        if (isInSafeZone(player.x, player.y, currentRoomX, currentRoomY)) {
            this.wanderMove(map);
            this.handleRoomTransition();
            return;
        }

        let targetX = player.x;
        let targetY = player.y;

        // Nếu Player sang phòng khác, Enemy sẽ tìm đường bằng BFS ra chỗ mép bản đồ (chỗ ko có tường)
        if (this.roomX !== currentRoomX || this.roomY !== currentRoomY) {
            let exit = this.findClosestExit(map, currentRoomX, currentRoomY, player);
            if (exit) {
                targetX = exit.x;
                targetY = exit.y;
                
                let ec = Math.floor((this.x + this.size/2) / TILE_SIZE);
                let er = Math.floor((this.y + this.size/2) / TILE_SIZE);
                
                // Khi đã giẫm lên được ô mép cửa, ép kéo tọa độ ra khỏi khung hình để kích hoạt chuyển phòng
                if (ec === exit.c && er === exit.r) {
                    if (this.roomX < currentRoomX) targetX = 850;
                    else if (this.roomX > currentRoomX) targetX = -50;
                    else if (this.roomY < currentRoomY) targetY = 650;
                    else if (this.roomY > currentRoomY) targetY = -50;
                }
            } else {
                // Nếu cực kì xui bị kẹt đường hoàn toàn thì dự phòng cho trôi qua tường
                if (this.roomX < currentRoomX) { targetX = 850; targetY = player.y; }
                else if (this.roomX > currentRoomX) { targetX = -50; targetY = player.y; }
                else if (this.roomY < currentRoomY) { targetX = player.x; targetY = 650; }
                else if (this.roomY > currentRoomY) { targetX = player.x; targetY = -50; }
            }
        }

        this.chaseMove(targetX, targetY, map);
        this.handleRoomTransition();
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