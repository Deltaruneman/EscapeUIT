// Thêm roomX và roomY vào để xác định phòng chứa Safe Zone (ví dụ phòng bắt đầu 0, 0)
const SAFE_ZONE = { x: 300, y: 250, width: 200, height: 150, roomX: 0, roomY: 0 }; 

// Cập nhật hàm kiểm tra Safe Zone để check thêm ID phòng
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

    // 🔴 MỚI: Tìm ô gạch ở mép bản đồ (lối ra) không bị tường chặn để Enemy đi qua
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

        // Ưu tiên chọn lối ra có khoảng cách gần Player nhất để Enemy khôn hơn
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
                    
                    // 🔴 MỚI: Bỏ qua các ô nằm trong Safe Zone để Enemy không đi dạo vào đây
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

    // 🔴 MỚI: Đã bỏ biến isAcrossRooms, ép Enemy luôn dùng BFS để né tường
    chaseMove(targetX, targetY, map) {
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
                // Di chuyển mượt mà, không bị giật khi lại gần tâm node
                let moveDist = Math.min(this.currentSpeed, dist);
                this.x += (dx / dist) * moveDist;
                this.y += (dy / dist) * moveDist;
            }
        } else {
            // Nếu đã tới vị trí biên (để sang phòng) hoặc kẹt đường
            let dx = targetX - this.x, dy = targetY - this.y;
            let dist = Math.hypot(dx, dy);
            
            // Chỉ bước ra ngoài màn hình nếu đang đứng sát mép (chuẩn bị chuyển phòng)
            let isAtEdge = (ec === 0 || ec === COLS - 1 || er === 0 || er === ROWS - 1);
            
            if (dist > 0 && isAtEdge) {
                this.x += (dx / dist) * this.currentSpeed;
                this.y += (dy / dist) * this.currentSpeed;
            } else {
                this.pickRandomWanderTarget(map); // Bị chặn thật sự thì đổi mục tiêu đi dạo
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

// 🔴 Loại Đỏ: Cơ chế bám đuôi chuẩn xác
class RedEnemy extends BaseEnemy {
    constructor(startX, startY, baseSpeed) {
        super(startX, startY, baseSpeed, "red");
    }

    update(player, currentRoomX, currentRoomY, keysFound) {
        this.currentSpeed = this.baseSpeed + (keysFound * 0.3);
        const map = getMap(this.roomX, this.roomY);

        // Check xem Player có đang trong Safe Zone Ở ĐÚNG PHÒNG ĐÓ không
        if (isInSafeZone(player.x, player.y, currentRoomX, currentRoomY)) {
            this.wanderMove(map);
            this.handleRoomTransition();
            return;
        }

        let targetX = player.x;
        let targetY = player.y;

        // Logic chuyển phòng: Tìm một lối ra hợp lệ (không phải tường) để đi tới trước
        if (this.roomX !== currentRoomX || this.roomY !== currentRoomY) {
            let exit = this.findClosestExit(map, currentRoomX, currentRoomY, player);
            if (exit) {
                targetX = exit.x;
                targetY = exit.y;
                
                // Khi đã giẫm lên ô lối ra, ép tọa độ vọt ra ngoài màn hình để trigger handleRoomTransition
                let ec = Math.floor((this.x + this.size/2) / TILE_SIZE);
                let er = Math.floor((this.y + this.size/2) / TILE_SIZE);
                if (ec === exit.c && er === exit.r) {
                    if (this.roomX < currentRoomX) targetX = 850;
                    else if (this.roomX > currentRoomX) targetX = -50;
                    else if (this.roomY < currentRoomY) targetY = 650;
                    else if (this.roomY > currentRoomY) targetY = -50;
                }
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

        // Ngừng rượt nếu Player chạy vào Safe Zone
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