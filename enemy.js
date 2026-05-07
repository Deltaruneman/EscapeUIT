// =========================
// ENEMY IMAGES
// =========================

const redEnemyImg = new Image();
redEnemyImg.src = "images/Boss.png";

const greenEnemyImg = new Image();
greenEnemyImg.src = "images/Grass.png";

const pinkEnemyImg = new Image();
pinkEnemyImg.src = "images/WaterPurifier.png";


// =========================
// SAFE ZONE
// =========================

const SAFE_ZONE = {
    x: 300,
    y: 250,
    width: 200,
    height: 150,
    roomX: 0,
    roomY: 0
};


// =========================
// INVINCIBILITY
// =========================

let invincibleUntil = 0;

function setInvincible(ms = 1000) {
    invincibleUntil = Date.now() + ms;
}

function isInvincible() {
    return Date.now() < invincibleUntil;
}


// =========================
// SAFE ZONE CHECK
// =========================

function isInSafeZone(x, y, roomX, roomY) {

    const map = getMap(roomX, roomY);

    let col = Math.floor((x + 12.5) / 50);
    let row = Math.floor((y + 12.5) / 50);

    if (map && map[row] && map[row][col] === 4) {
        return true;
    }

    return false;
}


// =========================
// BASE ENEMY
// =========================

class BaseEnemy {

    constructor(startX, startY, baseSpeed, image) {

        this.x = startX;
        this.y = startY;

        this.roomX = 0;
        this.roomY = 0;

        this.size = 30;

        this.baseSpeed = baseSpeed;
        this.currentSpeed = baseSpeed;

        this.image = image;

        this.wanderTargetX = null;
        this.wanderTargetY = null;
    }

    // =========================
    // BFS PATHFINDING
    // =========================

    findPath(startC, startR, targetC, targetR, map) {

        if (
            startC < 0 ||
            startC >= COLS ||
            startR < 0 ||
            startR >= ROWS
        ) {
            return [];
        }

        if (startC === targetC && startR === targetR) {
            return [];
        }

        let queue = [
            {
                c: startC,
                r: startR,
                parent: null
            }
        ];

        let visited = new Set();

        visited.add(`${startC},${startR}`);

        let targetNode = null;

        const dirs = [
            { dc: 0, dr: -1 },
            { dc: 0, dr: 1 },
            { dc: -1, dr: 0 },
            { dc: 1, dr: 0 }
        ];

        while (queue.length > 0) {

            let curr = queue.shift();

            if (
                curr.c === targetC &&
                curr.r === targetR
            ) {
                targetNode = curr;
                break;
            }

            for (let d of dirs) {

                let nc = curr.c + d.dc;
                let nr = curr.r + d.dr;

                if (
                    nc >= 0 &&
                    nc < COLS &&
                    nr >= 0 &&
                    nr < ROWS
                ) {

                    if (
                        map[nr] &&
                        map[nr][nc] !== 1 &&
                        map[nr][nc] !== 4
                    ) {

                        let key = `${nc},${nr}`;

                        if (!visited.has(key)) {

                            visited.add(key);

                            queue.push({
                                c: nc,
                                r: nr,
                                parent: curr
                            });
                        }
                    }
                }
            }
        }

        if (!targetNode) return [];

        let path = [];
        let curr = targetNode;

        while (curr.parent !== null) {

            path.push({
                c: curr.c,
                r: curr.r
            });

            curr = curr.parent;
        }

        return path.reverse();
    }


    // =========================
    // ROOM TRANSITION
    // =========================

    handleRoomTransition() {

        if (this.x < -15) {
            this.roomX--;
            this.x = 780;
        }

        else if (this.x > 790) {
            this.roomX++;
            this.x = 10;
        }

        if (this.y < -15) {
            this.roomY--;
            this.y = 580;
        }

        else if (this.y > 590) {
            this.roomY++;
            this.y = 10;
        }
    }


    // =========================
    // FIND EXIT
    // =========================

    findClosestExit(map, targetRoomX, targetRoomY, player) {

        let validExits = [];

        let targetCol = -1;
        let targetRow = -1;

        if (this.roomX < targetRoomX) {
            targetCol = COLS - 1;
        }

        else if (this.roomX > targetRoomX) {
            targetCol = 0;
        }

        else if (this.roomY < targetRoomY) {
            targetRow = ROWS - 1;
        }

        else if (this.roomY > targetRoomY) {
            targetRow = 0;
        }

        for (let r = 0; r < ROWS; r++) {

            for (let c = 0; c < COLS; c++) {

                if (
                    map[r] &&
                    map[r][c] !== 1 &&
                    map[r][c] !== 4
                ) {

                    if (
                        (targetCol !== -1 && c === targetCol) ||
                        (targetRow !== -1 && r === targetRow)
                    ) {

                        validExits.push({
                            c,
                            r,
                            x: c * TILE_SIZE + 10,
                            y: r * TILE_SIZE + 10
                        });
                    }
                }
            }
        }

        if (validExits.length === 0) {
            return null;
        }

        let bestExit = validExits[0];
        let minDist = Infinity;

        for (let exit of validExits) {

            let dist = Math.hypot(
                exit.x - player.x,
                exit.y - player.y
            );

            if (dist < minDist) {
                minDist = dist;
                bestExit = exit;
            }
        }

        return bestExit;
    }


    // =========================
    // RANDOM WANDER
    // =========================

    pickRandomWanderTarget(map) {

        let validTiles = [];

        for (let r = 0; r < ROWS; r++) {

            for (let c = 0; c < COLS; c++) {

                if (
                    map[r] &&
                    map[r][c] !== 1 &&
                    map[r][c] !== 4
                ) {

                    validTiles.push({ c, r });
                }
            }
        }

        if (validTiles.length > 0) {

            let rTile =
                validTiles[
                    Math.floor(Math.random() * validTiles.length)
                ];

            this.wanderTargetX = rTile.c * 50 + 10;
            this.wanderTargetY = rTile.r * 50 + 10;
        }
    }


    wanderMove(map) {

        if (
            !this.wanderTargetX ||
            Math.hypot(
                this.wanderTargetX - this.x,
                this.wanderTargetY - this.y
            ) < 15
        ) {

            this.pickRandomWanderTarget(map);
        }

        this.chaseMove(
            this.wanderTargetX,
            this.wanderTargetY,
            map
        );
    }


    // =========================
    // CHASE MOVE
    // =========================

    chaseMove(targetX, targetY, map) {

        let ec = Math.floor(
            (this.x + this.size / 2) / TILE_SIZE
        );

        let er = Math.floor(
            (this.y + this.size / 2) / TILE_SIZE
        );

        let tc = Math.floor(targetX / TILE_SIZE);
        let tr = Math.floor(targetY / TILE_SIZE);

        let safeTc = Math.max(
            0,
            Math.min(COLS - 1, tc)
        );

        let safeTr = Math.max(
            0,
            Math.min(ROWS - 1, tr)
        );

        let path = this.findPath(
            ec,
            er,
            safeTc,
            safeTr,
            map
        );

        if (path.length > 0) {

            let nextStep = path[0];

            let nextX = nextStep.c * TILE_SIZE + 10;
            let nextY = nextStep.r * TILE_SIZE + 10;

            let dx = nextX - this.x;
            let dy = nextY - this.y;

            let dist = Math.hypot(dx, dy);

            if (dist > 0) {

                let moveDist = Math.min(
                    this.currentSpeed,
                    dist
                );

                this.x += (dx / dist) * moveDist;
                this.y += (dy / dist) * moveDist;
            }
        }

        else {

            if (
                (ec === safeTc && er === safeTr) ||
                targetX < 0 ||
                targetX > COLS * TILE_SIZE ||
                targetY < 0 ||
                targetY > ROWS * TILE_SIZE
            ) {

                let dx = targetX - this.x;
                let dy = targetY - this.y;

                let dist = Math.hypot(dx, dy);

                if (dist > 0) {

                    let moveDist = Math.min(
                        this.currentSpeed,
                        dist
                    );

                    this.x += (dx / dist) * moveDist;
                    this.y += (dy / dist) * moveDist;
                }
            }

            else {
                this.pickRandomWanderTarget(map);
            }
        }
    }


    // =========================
    // DRAW
    // =========================

    draw(ctx, currentRoomX, currentRoomY) {

        if (
            this.roomX === currentRoomX &&
            this.roomY === currentRoomY
        ) {

            ctx.drawImage(
                this.image,
                this.x,
                this.y,
                this.size,
                this.size
            );
        }
    }


    // =========================
    // SAVE POSITION
    // =========================

    savePosition() {

        this.savedX = this.x;
        this.savedY = this.y;

        this.savedRoomX = this.roomX;
        this.savedRoomY = this.roomY;
    }


    // =========================
    // RESPAWN
    // =========================

    respawn() {

        if (
            this.savedX !== undefined &&
            this.savedY !== undefined
        ) {

            this.x = this.savedX;
            this.y = this.savedY;

            this.roomX = this.savedRoomX;
            this.roomY = this.savedRoomY;

            this.wanderTargetX = null;
        }
    }
}


// =========================
// RED ENEMY
// =========================

class RedEnemy extends BaseEnemy {

    constructor(startX, startY, baseSpeed) {

        super(
            startX,
            startY,
            baseSpeed,
            redEnemyImg
        );

        this.vx = 0;
        this.vy = 0;

        this.acceleration = 0.18;
        this.friction = 0.82;

        this.isRaging = false;

        this.predictionStrength = 0.35;
    }

    draw(ctx, currentRoomX, currentRoomY) {

        if (
            this.roomX !== currentRoomX ||
            this.roomY !== currentRoomY
        ) {
            return;
        }

        if (this.isRaging) {

            ctx.save();

            ctx.shadowColor = 'red';

            ctx.shadowBlur =
                18 + Math.sin(Date.now() / 80) * 8;
        }

        ctx.drawImage(
            this.image,
            this.x,
            this.y,
            this.size,
            this.size
        );

        if (this.isRaging) {
            ctx.restore();
        }
    }
}


// =========================
// GREEN ENEMY
// =========================

class GreenEnemy extends BaseEnemy {

    constructor(startX, startY, baseSpeed) {

        super(
            startX,
            startY,
            baseSpeed,
            greenEnemyImg
        );
    }
}


// =========================
// PINK ENEMY
// =========================

class PinkEnemy extends BaseEnemy {

    constructor(startX, startY, baseSpeed) {

        super(
            startX,
            startY,
            baseSpeed,
            pinkEnemyImg
        );
    }
}