// ============================================================
// 合成大西瓜 · Emoji 版
// 基于 worldligang/SynthesizeBigWatermelon (MIT License) 修改
// 原项目：https://github.com/worldligang/SynthesizeBigWatermelon
// 依 MIT 协议保留本版权声明，可自由修改与商用
// ============================================================

// 游戏配置（emoji 合成链：两个相同的 → 合成右边高一级）
const FRUIT_TYPES = [
    { radius: 20,  emoji: '🍒', name: '樱桃',   score: 1 },
    { radius: 30,  emoji: '🍇', name: '葡萄',   score: 3 },
    { radius: 40,  emoji: '🍋', name: '柠檬',   score: 6 },
    { radius: 50,  emoji: '🍊', name: '橙子',   score: 10 },
    { radius: 60,  emoji: '🍑', name: '桃子',   score: 15 },
    { radius: 70,  emoji: '🍍', name: '菠萝',   score: 21 },
    { radius: 80,  emoji: '🥝', name: '猕猴桃', score: 28 },
    { radius: 90,  emoji: '🍈', name: '甜瓜',   score: 36 },
    { radius: 100, emoji: '🍎', name: '苹果王', score: 45 },
    { radius: 110, emoji: '🍉', name: '西瓜',   score: 55 }
];

const GRAVITY = 0.5;
const BOUNCE = 0.3;
const FRICTION = 0.99;

// 游戏状态
let canvas, ctx;
let fruits = [];
let currentFruit = null;
let nextFruitType = 0;
let score = 0;
let highScore = 0;
let gameOver = false;
let dropX = 0;
let canvasWidth, canvasHeight;

// 初始化游戏
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // 适配移动端画布大小
    const containerWidth = Math.min(window.innerWidth - 50, 400);
    const containerHeight = Math.min(window.innerHeight - 250, 600);

    canvas.width = containerWidth;
    canvas.height = containerHeight;
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;

    dropX = canvasWidth / 2;

    // 加载最高分
    const savedHighScore = localStorage.getItem('watermelonHighScore');
    if (savedHighScore) {
        highScore = parseInt(savedHighScore);
        document.getElementById('highScore').textContent = highScore;
    }

    // 生成初始水果
    generateNextFruit();
    createCurrentFruit();

    // 绑定事件
    bindEvents();

    // 开始游戏循环
    gameLoop();
}

// 生成下一个水果
function generateNextFruit() {
    // 只生成前5种水果
    nextFruitType = Math.floor(Math.random() * 5);
    updateNextFruitPreview();
}

// 更新下一个水果预览（emoji 版）
function updateNextFruitPreview() {
    const preview = document.getElementById('nextFruit');
    const fruit = FRUIT_TYPES[nextFruitType];
    preview.innerHTML = '';

    const fruitDiv = document.createElement('div');
    fruitDiv.style.fontSize = (fruit.radius * 1.3) + 'px';
    fruitDiv.style.lineHeight = '1';
    fruitDiv.textContent = fruit.emoji;
    preview.appendChild(fruitDiv);
}

// 创建当前待掉落的水果
function createCurrentFruit() {
    currentFruit = {
        x: dropX,
        y: 50,
        radius: FRUIT_TYPES[nextFruitType].radius,
        type: nextFruitType,
        vx: 0,
        vy: 0,
        isDropping: false
    };

    generateNextFruit();
}

// 绑定事件
function bindEvents() {
    // 触摸事件
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    // 鼠标事件（PC端）
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    // 重新开始按钮
    document.getElementById('restartBtn').addEventListener('click', restartGame);

    // 窗口大小改变
    window.addEventListener('resize', handleResize);
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    dropX = touch.clientX - rect.left;

    // 边界限制
    if (dropX < FRUIT_TYPES[nextFruitType].radius) {
        dropX = FRUIT_TYPES[nextFruitType].radius;
    }
    if (dropX > canvasWidth - FRUIT_TYPES[nextFruitType].radius) {
        dropX = canvasWidth - FRUIT_TYPES[nextFruitType].radius;
    }

    if (currentFruit && !currentFruit.isDropping) {
        currentFruit.x = dropX;
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    dropX = touch.clientX - rect.left;

    // 边界限制
    if (dropX < FRUIT_TYPES[nextFruitType].radius) {
        dropX = FRUIT_TYPES[nextFruitType].radius;
    }
    if (dropX > canvasWidth - FRUIT_TYPES[nextFruitType].radius) {
        dropX = canvasWidth - FRUIT_TYPES[nextFruitType].radius;
    }

    if (currentFruit && !currentFruit.isDropping) {
        currentFruit.x = dropX;
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    if (currentFruit && !currentFruit.isDropping && !gameOver) {
        currentFruit.isDropping = true;
        currentFruit.vy = 2;
    }
}

function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    dropX = e.clientX - rect.left;

    // 边界限制
    if (dropX < FRUIT_TYPES[nextFruitType].radius) {
        dropX = FRUIT_TYPES[nextFruitType].radius;
    }
    if (dropX > canvasWidth - FRUIT_TYPES[nextFruitType].radius) {
        dropX = canvasWidth - FRUIT_TYPES[nextFruitType].radius;
    }

    if (currentFruit && !currentFruit.isDropping) {
        currentFruit.x = dropX;
    }
}

function handleClick(e) {
    if (currentFruit && !currentFruit.isDropping && !gameOver) {
        currentFruit.isDropping = true;
        currentFruit.vy = 2;
    }
}

function handleResize() {
    const containerWidth = Math.min(window.innerWidth - 50, 400);
    const containerHeight = Math.min(window.innerHeight - 250, 600);

    canvas.width = containerWidth;
    canvas.height = containerHeight;
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;

    // 重新定位水果
    fruits.forEach(fruit => {
        if (fruit.x > canvasWidth - fruit.radius) {
            fruit.x = canvasWidth - fruit.radius;
        }
        if (fruit.y > canvasHeight - fruit.radius) {
            fruit.y = canvasHeight - fruit.radius;
        }
    });
}

// 重新开始游戏
function restartGame() {
    fruits = [];
    score = 0;
    gameOver = false;
    document.getElementById('score').textContent = score;
    generateNextFruit();
    createCurrentFruit();
}

// 游戏主循环
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// 更新游戏状态
function update() {
    if (gameOver) return;

    // 更新掉落的水果
    if (currentFruit && currentFruit.isDropping) {
        currentFruit.vy += GRAVITY;
        currentFruit.y += currentFruit.vy;

        // 边界碰撞
        if (currentFruit.y + currentFruit.radius > canvasHeight) {
            currentFruit.y = canvasHeight - currentFruit.radius;
            currentFruit.vy *= -BOUNCE;

            if (Math.abs(currentFruit.vy) < 1) {
                currentFruit.isDropping = false;
                fruits.push(currentFruit);
                currentFruit = null;
                createCurrentFruit();
            }
        }

        // 左右边界
        if (currentFruit.x - currentFruit.radius < 0) {
            currentFruit.x = currentFruit.radius;
            currentFruit.vx *= -BOUNCE;
        }
        if (currentFruit.x + currentFruit.radius > canvasWidth) {
            currentFruit.x = canvasWidth - currentFruit.radius;
            currentFruit.vx *= -BOUNCE;
        }

        // 与其他水果碰撞检测
        for (let fruit of fruits) {
            if (checkCollision(currentFruit, fruit)) {
                if (currentFruit.type === fruit.type && currentFruit.type < FRUIT_TYPES.length - 1) {
                    // 合成
                    mergeFruits(currentFruit, fruit);
                    currentFruit = null;
                    createCurrentFruit();
                    break;
                } else {
                    // 弹开
                    resolveCollision(currentFruit, fruit);
                }
            }
        }
    }

    // 更新场景中的水果
    for (let i = 0; i < fruits.length; i++) {
        let fruit = fruits[i];

        fruit.vy += GRAVITY;
        fruit.vx *= FRICTION;
        fruit.vy *= FRICTION;

        fruit.x += fruit.vx;
        fruit.y += fruit.vy;

        // 边界碰撞
        if (fruit.y + fruit.radius > canvasHeight) {
            fruit.y = canvasHeight - fruit.radius;
            fruit.vy *= -BOUNCE;
        }
        if (fruit.x - fruit.radius < 0) {
            fruit.x = fruit.radius;
            fruit.vx *= -BOUNCE;
        }
        if (fruit.x + fruit.radius > canvasWidth) {
            fruit.x = canvasWidth - fruit.radius;
            fruit.vx *= -BOUNCE;
        }

        // 检查游戏是否结束
        if (fruit.y - fruit.radius < 100 && Math.abs(fruit.vy) < 0.5 && Math.abs(fruit.vx) < 0.5) {
            gameOver = true;
            alert('游戏结束！最终得分: ' + score);
        }
    }

    // 水果之间的碰撞
    for (let i = 0; i < fruits.length; i++) {
        for (let j = i + 1; j < fruits.length; j++) {
            if (checkCollision(fruits[i], fruits[j])) {
                if (fruits[i].type === fruits[j].type && fruits[i].type < FRUIT_TYPES.length - 1) {
                    // 合成
                    const newFruit = mergeFruits(fruits[i], fruits[j]);
                    fruits.splice(j, 1);
                    fruits.splice(i, 1);
                    fruits.push(newFruit);
                    i--;
                    break;
                } else {
                    // 弹开
                    resolveCollision(fruits[i], fruits[j]);
                }
            }
        }
    }
}

// 碰撞检测
function checkCollision(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < a.radius + b.radius;
}

// 解决碰撞
function resolveCollision(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return;

    const nx = dx / distance;
    const ny = dy / distance;

    const overlap = a.radius + b.radius - distance;
    const separationX = nx * overlap / 2;
    const separationY = ny * overlap / 2;

    a.x -= separationX;
    a.y -= separationY;
    b.x += separationX;
    b.y += separationY;

    const dvx = b.vx - a.vx;
    const dvy = b.vy - a.vy;
    const dvn = dvx * nx + dvy * ny;

    if (dvn > 0) {
        const restitution = BOUNCE;
        const impulse = (-(1 + restitution) * dvn) / 2;

        a.vx -= impulse * nx;
        a.vy -= impulse * ny;
        b.vx += impulse * nx;
        b.vy += impulse * ny;
    }
}

// 合成水果
function mergeFruits(a, b) {
    const newType = a.type + 1;
    const newX = (a.x + b.x) / 2;
    const newY = (a.y + b.y) / 2;

    // 更新分数
    score += FRUIT_TYPES[newType].score;
    document.getElementById('score').textContent = score;

    // 更新最高分
    if (score > highScore) {
        highScore = score;
        document.getElementById('highScore').textContent = highScore;
        localStorage.setItem('watermelonHighScore', highScore);
    }

    return {
        x: newX,
        y: newY,
        radius: FRUIT_TYPES[newType].radius,
        type: newType,
        vx: (a.vx + b.vx) / 2,
        vy: (a.vy + b.vy) / 2
    };
}

// 绘制游戏
function draw() {
    // 清空画布
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 绘制危险线
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.moveTo(0, 100);
    ctx.lineTo(canvasWidth, 100);
    ctx.stroke();
    ctx.setLineDash([]);

    // 绘制场景中的水果
    for (let fruit of fruits) {
        drawFruit(fruit);
    }

    // 绘制当前水果
    if (currentFruit) {
        drawFruit(currentFruit);
    }

    // 绘制游戏结束文字
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        ctx.fillStyle = 'white';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('游戏结束', canvasWidth / 2, canvasHeight / 2 - 20);

        ctx.font = '20px Arial';
        ctx.fillText('点击重新开始按钮', canvasWidth / 2, canvasHeight / 2 + 20);
    }
}

// 绘制水果（emoji 版）
function drawFruit(fruit) {
    ctx.font = (fruit.radius * 1.6) + 'px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(FRUIT_TYPES[fruit.type].emoji, fruit.x, fruit.y + fruit.radius * 0.08);
}

// 启动游戏
window.onload = init;
