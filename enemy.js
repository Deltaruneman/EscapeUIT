class Enemy {
    constructor(startX, startY, 0.5*baseSpeed) {
        this.x = startX;
        this.y = startY;
        this.roomX = 0;
        this.roomY = 0;
        this.size = 30;
        this.baseSpeed = baseSpeed;
        this.currentSpeed = baseSpeed;
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
                    if (map[nr] && map[nr][nc] !== 1) {
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

    update(player, currentRoomX, currentRoomY, keysFound) {
        // ENRAGE MECHANIC: Càng lượm nhiều chìa, quái càng chạy nhanh
        this.currentSpeed = this.baseSpeed + (keysFound * 0.3);

        let targetX = player.x;
        let targetY = player.y;

        // Dự đoán cửa phòng để di chuyển mượt hơn nếu khác phòng
        if (this.roomX < currentRoomX) { targetX = 850; targetY = player.y; }
        else if (this.roomX > currentRoomX) { targetX = -50; targetY = player.y; }
        else if (this.roomY < currentRoomY) { targetX = player.x; targetY = 650; }
        else if (this.roomY > currentRoomY) { targetX = player.x; targetY = -50; }

        const map = getMap(this.roomX, this.roomY);
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
        } else if (this.roomX !== currentRoomX || this.roomY !== currentRoomY) {
            // FIX KẸT CỬA: Ép đi thẳng đến target ảo để vượt viền màn hình
            let dx = targetX - this.x, dy = targetY - this.y;
            let dist = Math.hypot(dx, dy);
            if (dist > 0) {
                this.x += (dx / dist) * this.currentSpeed;
                this.y += (dy / dist) * this.currentSpeed;
            }
        }

        // Logic dịch chuyển room của enemy
        if (this.x < -15) { this.roomX--; this.x = 780; }
        else if (this.x > 790) { this.roomX++; this.x = 10; }
        if (this.y < -15) { this.roomY--; this.y = 580; }
        else if (this.y > 590) { this.roomY++; this.y = 10; }
    }

    draw(ctx, currentRoomX, currentRoomY) {
        if(this.roomX === currentRoomX && this.roomY === currentRoomY) {
            ctx.fillStyle = "red"; 
            ctx.fillRect(this.x, this.y, this.size, this.size);
        }
    }
    
    reset(startX, startY) {
        this.x = startX;
        this.y = startY;
        this.roomX = 0;
        this.roomY = 0;
    }
}