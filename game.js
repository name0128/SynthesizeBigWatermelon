// ============================================================
// 合成大西瓜 · Emoji 版
// 基于 worldligang/SynthesizeBigWatermelon (MIT License) 修改
// 原项目：https://github.com/worldligang/SynthesizeBigWatermelon
// 依 MIT 协议保留本版权声明，可自由修改与商用
// ============================================================

// 游戏配置（emoji 合成链：两个相同的 → 合成右边高一级）
const FRUIT_TYPES = [
    { radius: 15, emoji: '🍒', name: '樱桃',   score: 1 },
    { radius: 20, emoji: '🍇', name: '葡萄',   score: 3 },
    { radius: 26, emoji: '🍋', name: '柠檬',   score: 6 },
    { radius: 32, emoji: '🍊', name: '橙子',   score: 10 },
    { radius: 38, emoji: '🍑', name: '桃子',   score: 15 },
    { radius: 44, emoji: '🍍', name: '菠萝',   score: 21 },
    { radius: 50, emoji: '🥝', name: '猕猴桃', score: 28 },
    { radius: 56, emoji: '🍈', name: '甜瓜',   score: 36 },
    { radius: 62, emoji: '🍎', name: '苹果王', score: 45 },
    { radius: 68, emoji: '🍉', name: '西瓜',   score: 55 }
];

const GRAVITY = 0.5;
const BOUNCE = 0.15;   // 弹性调低(原0.3): 堆叠更稳、抖动更小
const FRICTION = 0.99;

// 游戏状态
let canvas, ctx;
let fruits = [];
let currentFruit = null;
let nextFruitType = 0;
let score = 0;
let highScore = 0;
let gameOver = false;
let overLineFrames = 0;   // 水果持续越过危险线的帧数（持续 1.5 秒才判负，防误判）
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
    if (gameOver) { restartGame(); return; }   // 结束状态: 点屏幕任意位置重新开始
    if (currentFruit && !currentFruit.isDropping) {
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
    if (gameOver) { restartGame(); return; }   // 结束状态: 点击重新开始
    if (currentFruit && !currentFruit.isDropping) {
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
    overLineFrames = 0;
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
        currentFruit.dropFrames = (currentFruit.dropFrames || 0) + 1;
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
                    // 合成：生成高一级水果；移除场上参与合成的那个；掉落中的自己不再保留
                    const newFruit = mergeFruits(currentFruit, fruit);
                    const idx = fruits.indexOf(fruit);
                    if (idx > -1) fruits.splice(idx, 1);
                    fruits.push(newFruit);
                    currentFruit = null;
                    createCurrentFruit();
                    break;
                } else {
                    // 弹开
                    resolveCollision(currentFruit, fruit);
                }
            }
        }

        // 超时保护：掉落超过 3 秒仍未结算（如被抖动的水果堆卡住），强制结算并生成新水果
        if (currentFruit && currentFruit.dropFrames > 180) {
            currentFruit.isDropping = false;
            fruits.push(currentFruit);
            currentFruit = null;
            createCurrentFruit();
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
            if (Math.abs(fruit.vy) < 0.8) fruit.vy = 0;   // 微弱反弹直接静止, 消除落底抖动
        }
        if (fruit.x - fruit.radius < 0) {
            fruit.x = fruit.radius;
            fruit.vx *= -BOUNCE;
            if (Math.abs(fruit.vx) < 0.8) fruit.vx = 0;
        }
        if (fruit.x + fruit.radius > canvasWidth) {
            fruit.x = canvasWidth - fruit.radius;
            fruit.vx *= -BOUNCE;
            if (Math.abs(fruit.vx) < 0.8) fruit.vx = 0;
        }

        // 限制最大下落速度, 防止堆叠中弹跳过猛
        if (fruit.vy > 12) fruit.vy = 12;
    }

    // 水果之间的碰撞
    for (let i = 0; i < fruits.length; i++) {
        for (let j = i + 1; j < fruits.length; j++) {
            // 同类水果近距离"磁吸"：互相吸引直到接触并合成（修复相邻相同水果不合成的问题）
            const mdx = fruits[j].x - fruits[i].x;
            const mdy = fruits[j].y - fruits[i].y;
            const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
            const msum = fruits[i].radius + fruits[j].radius;
            if (fruits[i].type === fruits[j].type &&
                fruits[i].type < FRUIT_TYPES.length - 1 &&
                mdist < msum * 1.5 && mdist > 0.01) {
                const pull = 0.12;
                fruits[i].vx += (mdx / mdist) * pull;
                fruits[i].vy += (mdy / mdist) * pull;
                fruits[j].vx -= (mdx / mdist) * pull;
                fruits[j].vy -= (mdy / mdist) * pull;
            }
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

    // 游戏结束判定（防误判版）：水果顶端越过危险线且"持续静止"1.5 秒（90帧）才判负
    // 修复：水果被弹起掠过危险线的瞬间不再立即结束游戏
    let danger = false;
    for (let fruit of fruits) {
        if (fruit.y - fruit.radius < 100 && Math.abs(fruit.vy) < 1 && Math.abs(fruit.vx) < 1) {
            danger = true;
            break;
        }
    }
    if (danger) {
        overLineFrames++;
        if (overLineFrames > 90) {
            gameOver = true;   // 结束画面由 draw() 全屏面板展示(手机端 alert 可能被拦截或阻塞)
        }
    } else {
        overLineFrames = 0;
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
    const separationX = nx * overlap * 0.35;   // 分离量软化(原为1/2): 位置调整渐进, 堆叠更丝滑
    const separationY = ny * overlap * 0.35;

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

    // 绘制游戏结束面板（画布内全屏提示，不依赖手机浏览器 alert）
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';   // 重置文字基线(水果绘制用的是 middle, 需还原)

        ctx.font = 'bold 30px Arial';
        ctx.fillText('游戏结束', canvasWidth / 2, canvasHeight / 2 - 40);

        ctx.font = '22px Arial';
        ctx.fillText('本局得分: ' + score, canvasWidth / 2, canvasHeight / 2);

        ctx.font = '18px Arial';
        ctx.fillText('点击屏幕任意位置重新开始', canvasWidth / 2, canvasHeight / 2 + 36);
    }
}

// 绘制水果（emoji 版）
function drawFruit(fruit) {
    ctx.font = (fruit.radius * 1.8) + 'px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(FRUIT_TYPES[fruit.type].emoji, fruit.x, fruit.y + fruit.radius * 0.08);
}

// 启动游戏
window.onload = init;
