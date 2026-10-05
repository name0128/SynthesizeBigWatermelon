// ============================================================
// 合成大西瓜 · Emoji 版
// 基于 worldligang/SynthesizeBigWatermelon (MIT License) 修改
// 原项目：https://github.com/worldligang/SynthesizeBigWatermelon
// 依 MIT 协议保留本版权声明，可自由修改与商用
// ============================================================

// ============================================================
// 汉字合成 · 幼小衔接识字版
// 基于 worldligang/SynthesizeBigWatermelon (MIT License) 修改
// 原项目：https://github.com/worldligang/SynthesizeBigWatermelon
// 依 MIT 协议保留本版权声明，可自由修改与商用
// 玩法：两个相同的字合成下一个字；等级越低字越大(堆积压力)，
//       合成后字越小(腾出空间) —— 把大字"变小心"的过程就是识字过程
// ============================================================

// 游戏配置（识字合成链：山→水→火→木→土→日→月→口→田→人，一年级上册高频独体字）
// bg=卡片底色(亮色糖果系, 等级色编码), text=字色(浅底配深字保证可读)
const FRUIT_TYPES = [
    { radius: 56, char: '山', name: '山', score: 1,  bg: '#FF8A65', text: '#FFFFFF' },
    { radius: 51, char: '水', name: '水', score: 3,  bg: '#4FC3F7', text: '#FFFFFF' },
    { radius: 46, char: '火', name: '火', score: 6,  bg: '#FF6B6B', text: '#FFFFFF' },
    { radius: 42, char: '木', name: '木', score: 10, bg: '#81C784', text: '#FFFFFF' },
    { radius: 38, char: '土', name: '土', score: 15, bg: '#FFB74D', text: '#7A4A00' },
    { radius: 34, char: '日', name: '日', score: 21, bg: '#FFD54F', text: '#7A5C00' },
    { radius: 30, char: '月', name: '月', score: 28, bg: '#B39DDB', text: '#FFFFFF' },
    { radius: 26, char: '口', name: '口', score: 36, bg: '#F48FB1', text: '#FFFFFF' },
    { radius: 22, char: '田', name: '田', score: 45, bg: '#4DB6AC', text: '#FFFFFF' },
    { radius: 18, char: '人', name: '人', score: 55, bg: '#7986CB', text: '#FFFFFF' }
];

const GRAVITY = 0.5;
const BOUNCE = 0.15;   // 弹性调低(原0.3): 堆叠更稳、抖动更小
const FRICTION = 0.99;
const WALL_PAD = 6;    // 左右墙内边距: 汉字卡片不贴画布边缘, 避免视觉卡切

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

// 合成鼓励（合出最高等级汉字时触发）
let cheer = null;   // { text, frames }
const CHEER_TEXTS = ['真棒！', '太厉害了！', '好样的！', '你真棒！', '继续加油！'];

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

// 更新下一个水果预览（识字卡版）
function updateNextFruitPreview() {
    const preview = document.getElementById('nextFruit');
    const fruit = FRUIT_TYPES[nextFruitType];
    preview.innerHTML = '';

    const fruitDiv = document.createElement('div');
    const PREVIEW_SIZE = 56;   // 预览卡固定直径, 不随字等级变化
    fruitDiv.style.width = PREVIEW_SIZE + 'px';
    fruitDiv.style.height = PREVIEW_SIZE + 'px';
    fruitDiv.style.background = fruit.bg;
    fruitDiv.style.borderRadius = '50%';
    fruitDiv.style.border = '3px solid rgba(255,255,255,0.9)';
    fruitDiv.style.fontSize = '36px';
    fruitDiv.style.lineHeight = PREVIEW_SIZE + 'px';
    fruitDiv.style.textAlign = 'center';
    fruitDiv.style.color = fruit.text;
    fruitDiv.textContent = fruit.char;
    preview.appendChild(fruitDiv);
}

// 创建当前待掉落的水果
function createCurrentFruit() {
    currentFruit = {
        x: dropX,
        y: Math.max(50, FRUIT_TYPES[nextFruitType].radius + 10),   // 大字起点下移, 避免露出画布顶部
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
    const minDropX = WALL_PAD + FRUIT_TYPES[nextFruitType].radius;
    const maxDropX = canvasWidth - WALL_PAD - FRUIT_TYPES[nextFruitType].radius;
    if (dropX < minDropX) {
        dropX = minDropX;
    }
    if (dropX > maxDropX) {
        dropX = maxDropX;
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
    const minDropX = WALL_PAD + FRUIT_TYPES[nextFruitType].radius;
    const maxDropX = canvasWidth - WALL_PAD - FRUIT_TYPES[nextFruitType].radius;
    if (dropX < minDropX) {
        dropX = minDropX;
    }
    if (dropX > maxDropX) {
        dropX = maxDropX;
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
    const minDropX = WALL_PAD + FRUIT_TYPES[nextFruitType].radius;
    const maxDropX = canvasWidth - WALL_PAD - FRUIT_TYPES[nextFruitType].radius;
    if (dropX < minDropX) {
        dropX = minDropX;
    }
    if (dropX > maxDropX) {
        dropX = maxDropX;
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
    cheer = null;
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

        // 左右边界（内缩 WALL_PAD, 卡片不贴边）
        if (currentFruit.x - currentFruit.radius < WALL_PAD) {
            currentFruit.x = WALL_PAD + currentFruit.radius;
            currentFruit.vx *= -BOUNCE;
        }
        if (currentFruit.x + currentFruit.radius > canvasWidth - WALL_PAD) {
            currentFruit.x = canvasWidth - WALL_PAD - currentFruit.radius;
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
        if (fruit.x - fruit.radius < WALL_PAD) {
            fruit.x = WALL_PAD + fruit.radius;
            fruit.vx *= -BOUNCE;
            if (Math.abs(fruit.vx) < 0.8) fruit.vx = 0;
        }
        if (fruit.x + fruit.radius > canvasWidth - WALL_PAD) {
            fruit.x = canvasWidth - WALL_PAD - fruit.radius;
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

    // 合出最高等级汉字 → 触发鼓励语
    if (newType === FRUIT_TYPES.length - 1) {
        cheer = { text: CHEER_TEXTS[Math.floor(Math.random() * CHEER_TEXTS.length)], frames: 100 };
    }

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

    // 合成鼓励动效（合出最高等级汉字时出现，弹出放大后渐隐）
    if (cheer && cheer.frames > 0) {
        const t = cheer.frames / 100;                 // 1 → 0
        const scale = 1 + (1 - t) * 0.4;              // 逐渐放大
        ctx.save();
        ctx.globalAlpha = Math.min(1, t * 2.5);       // 尾段渐隐
        ctx.font = 'bold ' + Math.round(44 * scale) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 8;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.strokeText(cheer.text, canvasWidth / 2, canvasHeight * 0.3);
        ctx.fillStyle = '#FF7043';
        ctx.fillText(cheer.text, canvasWidth / 2, canvasHeight * 0.3);
        ctx.restore();
        cheer.frames--;
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

// 绘制水果（彩虹识字卡版：彩色圆底 + 白描边 + 汉字）
function drawFruit(fruit) {
    const conf = FRUIT_TYPES[fruit.type];

    // 彩色圆底
    ctx.beginPath();
    ctx.arc(fruit.x, fruit.y, fruit.radius, 0, Math.PI * 2);
    ctx.fillStyle = conf.bg;
    ctx.fill();

    // 白色描边(贴纸风)
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.stroke();

    // 汉字（字号随半径变化：低级大字醒目，高级小字精巧）
    ctx.font = 'bold ' + (fruit.radius * 1.4) + 'px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = conf.text;
    ctx.fillText(conf.char, fruit.x, fruit.y + fruit.radius * 0.06);
}

// 启动游戏
window.onload = init;
