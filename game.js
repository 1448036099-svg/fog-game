// 《雾里有什么》· 灰盒原型
// 只用色块和简单图形：擦雾 → 读线索 → 找目标 → 点击取出，三关后天亮
// 逻辑尺寸固定 1280x720，Phaser.Scale.FIT 自动缩放

// ================= 关卡数据（三关共用 LevelScene，只读这里） =================
// 所有坐标都是画布坐标（左上角 0,0，右下角 1280,720）
// 形状字段：
//   type    star 星形 / circle 圆 / crescent 月牙（开口朝右）/ halfCircle 上半圆 / rect 矩形
//   size    半径（rect 用 w、h）
//   rot     旋转角度（度）
//   glow    true = 外面加一圈淡淡的光晕（表示「亮」）
//   holes   true = 上面有两个小洞
//   outline 描边 { color, width }
//   front   只用于 scenery：true = 画在目标和干扰项前面（比如挡住太阳的篱笆）
// target.hit：点击判定圆（圆心 x、y，半径 r），也是统计「擦开比例」的区域
const LEVELS = [
  // ---------- 第 1 关：鱼缸（深夜蓝） ----------
  {
    bgColor: '#0b1a2e',
    clues: ['有五个角……', '亮亮的……', '我把它养在水草旁边……', '夜里，我是最先醒来的那一个……'],
    glass: { x: 290, y: 80, w: 700, h: 510, radius: 28, color: 0x173b4f },
    fog: { color: 0xd8dee6, alpha: 0.9 },    // 较薄的水汽
    scenery: [
      { type: 'rect', x: 640, y: 565, w: 640, h: 40, color: 0x6b6a55 },   // 缸底沙子
      { type: 'rect', x: 405, y: 490, w: 10, h: 110, color: 0x2f6b4a },   // 水草
      { type: 'rect', x: 430, y: 470, w: 14, h: 150, color: 0x2f6b4a },
      { type: 'rect', x: 458, y: 485, w: 12, h: 120, color: 0x2f6b4a }
    ],
    // 目标：水草旁发光的星星
    target: { type: 'star', x: 482, y: 440, size: 16, color: 0xfff2a8, glow: true,
              hit: { x: 482, y: 440, r: 26 } },
    decoys: [
      { type: 'star', x: 395, y: 555, size: 18, color: 0xd9825b },               // 海星：星形、在水草旁，但不亮
      { type: 'star', x: 920, y: 140, size: 16, color: 0xfff2a8, glow: true },   // 小夜灯：亮、星形，但不在水草旁
      { type: 'star', x: 600, y: 562, size: 9, color: 0xc07aa8 },                // 彩色小石子：星形，但不亮
      { type: 'star', x: 690, y: 568, size: 9, color: 0x7aa8c0 },
      { type: 'star', x: 780, y: 560, size: 9, color: 0x9bc07a },
      { type: 'circle', x: 850, y: 380, size: 8, color: 0xe8f6ff, glow: true },  // 气泡：亮，但没有角
      { type: 'circle', x: 862, y: 330, size: 6, color: 0xe8f6ff, glow: true },
      { type: 'circle', x: 855, y: 285, size: 5, color: 0xe8f6ff, glow: true }
    ]
  },

  // ---------- 第 2 关：电视机里的客厅（蓝调时刻） ----------
  {
    bgColor: '#1d3d66',
    clues: ['被放在软绵绵的东西上……', '弯弯的……', '有两个小洞……', '我曾经挂在天上，现在睡在这里……'],
    glass: { x: 290, y: 80, w: 700, h: 510, radius: 28, color: 0x3b3445 },
    fog: { color: 0xd4d6da, alpha: 0.94 },   // 灰白的雾
    scenery: [
      { type: 'rect', x: 500, y: 470, w: 340, h: 110, color: 0x6a5a7a },  // 沙发
      { type: 'rect', x: 870, y: 400, w: 140, h: 200, color: 0x4a5f7a },  // 外套
      { type: 'rect', x: 450, y: 180, w: 140, h: 100, color: 0x262130 },  // 挂画
      { type: 'rect', x: 720, y: 545, w: 150, h: 16, color: 0x5a4a3a },   // 茶几
      { type: 'rect', x: 720, y: 515, w: 30, h: 44, color: 0xd8d0c0 }     // 马克杯
    ],
    // 目标：外套上的月亮形状纽扣（有两个洞）
    target: { type: 'crescent', x: 870, y: 360, size: 20, color: 0xe8d9a0, holes: true,
              hit: { x: 862, y: 360, r: 24 } },
    decoys: [
      { type: 'crescent', x: 420, y: 430, size: 30, color: 0xe8d9a0 },               // 月亮靠垫：弯、软，但没有洞
      { type: 'circle', x: 870, y: 430, size: 10, color: 0xe8d9a0, holes: true },    // 普通圆纽扣：有洞，但不弯
      { type: 'crescent', x: 560, y: 430, size: 26, color: 0xe6c94a, rot: -90 },     // 香蕉：在沙发上、弯，但没有洞
      { type: 'crescent', x: 733, y: 515, size: 12, color: 0xd8d0c0, rot: 180 },     // 马克杯把手：弯，但不在软的东西上
      { type: 'crescent', x: 450, y: 180, size: 26, color: 0xe8d9a0 }                // 挂画里的月亮：弯，但不在软的东西上
    ]
  },

  // ---------- 第 3 关：窗外的小花园（日出） ----------
  {
    bgColor: '#3f74ad',
    clues: ['我在等一个很大很大的东西……', '它每天都会回来……', '它一出现，所有的灯都会变得很小……', '每一个早晨，都是从它开始的……'],
    glass: { x: 290, y: 80, w: 700, h: 510, radius: 28, color: 0x9db4cc },
    fog: { color: 0xe4e8ec, alpha: 0.97 },   // 大面积厚雾
    scenery: [
      { type: 'rect', x: 640, y: 555, w: 660, h: 60, color: 0x5e7f55 },   // 草地
      { type: 'rect', x: 930, y: 400, w: 8, h: 360, color: 0x444a55 },    // 路灯杆
      { type: 'rect', x: 480, y: 300, w: 2, h: 120, color: 0xdddddd },    // 气球绳
      { type: 'rect', x: 380, y: 560, w: 4, h: 40, color: 0x3f6b3a },     // 向日葵茎
      // 篱笆：画在太阳前面，挡住太阳下半部分
      { type: 'rect', x: 640, y: 440, w: 640, h: 12, color: 0xcdbb98, front: true },
      { type: 'rect', x: 345, y: 470, w: 30, h: 120, color: 0xcdbb98, front: true },
      { type: 'rect', x: 420, y: 470, w: 30, h: 120, color: 0xcdbb98, front: true },
      { type: 'rect', x: 495, y: 470, w: 30, h: 120, color: 0xcdbb98, front: true },
      { type: 'rect', x: 570, y: 470, w: 30, h: 120, color: 0xcdbb98, front: true },
      { type: 'rect', x: 645, y: 470, w: 30, h: 120, color: 0xcdbb98, front: true },
      { type: 'rect', x: 720, y: 470, w: 30, h: 120, color: 0xcdbb98, front: true },
      { type: 'rect', x: 795, y: 470, w: 30, h: 120, color: 0xcdbb98, front: true },
      { type: 'rect', x: 870, y: 470, w: 30, h: 120, color: 0xcdbb98, front: true }
    ],
    // 目标：篱笆后面冒出金边的太阳
    target: { type: 'halfCircle', x: 650, y: 440, size: 100, color: 0xffc94a,
              outline: { color: 0xfff0b0, width: 6 },
              hit: { x: 650, y: 380, r: 60 } },
    decoys: [
      { type: 'circle', x: 380, y: 535, size: 14, color: 0xffc94a },               // 向日葵：黄圆，但小、在地上
      { type: 'circle', x: 930, y: 220, size: 12, color: 0xfff2c0, glow: true },   // 路灯：亮，但小
      { type: 'circle', x: 480, y: 220, size: 24, color: 0xffd23a }                // 黄色气球：圆、黄
    ]
  }
];

// ================= 其他设置 =================
const FONT = '"PingFang SC", "Microsoft YaHei", sans-serif';
const CLUE_INTERVAL = 10000;   // 卡住多久（毫秒）出现下一句线索
const CLUE_MAX_CHARS = 14;     // 线索一行最多几个字，超过就在逗号后换行
const BUBBLE_LEFT = 16;        // 第一个对话框的左上角 x
const BUBBLE_TOP = 16;         // 第一个对话框的左上角 y
const BUBBLE_PAD_X = 12;       // 对话框里文字和左右边的距离
const BUBBLE_PAD_Y = 8;        // 对话框里文字和上下边的距离
const BUBBLE_GAP = 16;         // 上下两个对话框之间的距离
const BUBBLE_COLOR = 0xf2efe6; // 对话框底色
const BUBBLE_TEXT = '#2a3445'; // 对话框里的文字颜色
const TAP_MAX_MOVE = 12;       // 按下后移动少于这个距离（像素）算「点击」，超过算「擦」
const TAP_GRACE_MS = 2000;     // 目标处「擦开够多」之后，这么久（毫秒）之内就算雾又回来了也还能点
const HIT_SAMPLE_STEP = 2;     // 统计目标处擦开比例时，每隔几个像素取一个点（只用来算比例，看不见）
const SLOT_X = 1135;           // 右侧格子的中心 x（玻璃右边的空地中间）
const SLOT_Y = 335;            // 中间那个格子的中心 y（和玻璃中心对齐）
const SLOT_SIZE = 64;          // 格子边长
const SLOT_GAP = 90;           // 格子之间的距离（上下排列）
const HOLE_COLOR = 0x1a1622;   // 纽扣小洞的颜色

// 手感参数（想调就直接改这里的数字）
const TUNING = {
  brushRadius: 28,    // 笔刷半径（像素）
  clearPercent: 60,   // 目标区域擦开多少 % 才能点
  regrowSpeed: 15     // 雾回来的速度：每秒长回多少 %（0 = 永远不回来；15 ≈ 6.7 秒长满）
};

// ================= 画形状的小工具 =================

// 根据形状数据算出一圈轮廓点（以形状中心为 0,0）
function shapePoints(s) {
  const r = s.size;
  const pts = [];
  if (s.type === 'star') {
    // 五角星：外顶点和内顶点交替，共 10 个点
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const len = (i % 2 === 0) ? r : r * 0.45;
      pts.push({ x: Math.cos(a) * len, y: Math.sin(a) * len });
    }
  } else if (s.type === 'crescent') {
    // 月牙：外边是左半圆，内边是一条扁的半椭圆，中间围出开口朝右的月牙
    for (let i = 0; i <= 16; i++) {
      const a = Math.PI / 2 + i * Math.PI / 16;
      pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }
    for (let i = 0; i <= 16; i++) {
      const a = Math.PI * 1.5 - i * Math.PI / 16;
      pts.push({ x: Math.cos(a) * r * 0.3, y: Math.sin(a) * r });
    }
  } else if (s.type === 'halfCircle') {
    // 上半圆：从左到右沿着上面画一个半圆，底边是平的
    for (let i = 0; i <= 24; i++) {
      const a = Math.PI + i * Math.PI / 24;
      pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }
  } else if (s.type === 'rect') {
    pts.push({ x: -s.w / 2, y: -s.h / 2 }, { x: s.w / 2, y: -s.h / 2 },
             { x: s.w / 2, y: s.h / 2 }, { x: -s.w / 2, y: s.h / 2 });
  } else {
    // circle
    for (let i = 0; i < 32; i++) {
      const a = i * Math.PI * 2 / 32;
      pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }
  }
  return pts;
}

// 把一个形状画成独立的 Graphics 对象，放在 (s.x, s.y)，方便之后移动和缩放
function drawShape(scene, s) {
  const g = scene.add.graphics({ x: s.x, y: s.y });
  if (s.rot) g.angle = s.rot;

  // 光晕：一圈更大的半透明圆
  if (s.glow) {
    g.fillStyle(s.color, 0.25);
    g.fillCircle(0, 0, s.size * 1.8);
  }

  const pts = shapePoints(s);
  g.fillStyle(s.color, 1);
  g.fillPoints(pts, true);

  if (s.outline) {
    g.lineStyle(s.outline.width, s.outline.color, 1);
    g.strokePoints(pts, true);
  }

  // 两个小洞：月牙的洞放在月牙最厚的地方，其他形状放在中间左右两边
  if (s.holes) {
    const r = s.size;
    const holeR = Math.max(2, r * 0.13);
    g.fillStyle(HOLE_COLOR, 1);
    if (s.type === 'crescent') {
      g.fillCircle(-r * 0.62, -r * 0.28, holeR);
      g.fillCircle(-r * 0.62, r * 0.28, holeR);
    } else {
      g.fillCircle(-r * 0.3, 0, holeR);
      g.fillCircle(r * 0.3, 0, holeR);
    }
  }
  return g;
}

// 点 (px, py) 是否在宽 w、高 h、圆角半径 r 的圆角矩形里（左上角是 0,0）
function insideRoundedRect(px, py, w, h, r) {
  const cx = Math.min(Math.max(px, r), w - r);   // 离这个点最近的「圆角圆心」
  const cy = Math.min(Math.max(py, r), h - r);
  return (px - cx) * (px - cx) + (py - cy) * (py - cy) <= r * r;
}

// 目标飞进格子后的缩放比例（只缩小，不放大）
function iconScale(s) {
  return Math.min(0.8, (SLOT_SIZE * 0.35) / s.size);
}

// 第 i 个格子的中心：右侧一列，从上往下排
function slotCenter(i) {
  return { x: SLOT_X, y: SLOT_Y + (i - (LEVELS.length - 1) / 2) * SLOT_GAP };
}

// 第 i 个格子里放目标的位置（半圆的中心在底边，所以往下挪一点让它看起来居中）
function slotPosition(i, s, scale) {
  const c = slotCenter(i);
  return { x: c.x, y: c.y + (s.type === 'halfCircle' ? s.size * scale * 0.45 : 0) };
}

// ================= 开始画面 =================
class StartScene extends Phaser.Scene {
  constructor() { super('Start'); }

  create() {
    // 背景色和第 1 关一样
    this.cameras.main.setBackgroundColor(LEVELS[0].bgColor);

    // 标题
    this.add.text(640, 250, '雾里有什么', {
      fontFamily: FONT, fontSize: '72px', color: '#dce4f0'
    }).setOrigin(0.5);

    // 开场文字
    this.add.text(640, 345, '冬夜，玻璃都起雾了。', {
      fontFamily: FONT, fontSize: '28px', color: '#b8c6da'
    }).setOrigin(0.5);

    // 玩法提示
    this.add.text(640, 400, '用手指擦开雾，找到线索说的东西', {
      fontFamily: FONT, fontSize: '20px', color: '#96aac8'
    }).setOrigin(0.5);

    // 底部的「按钮」：只是文字，点屏幕任何地方都能开始
    this.add.text(640, 600, '点击开始', {
      fontFamily: FONT, fontSize: '26px', color: '#dce4f0',
      backgroundColor: '#1d3d66', padding: { x: 28, y: 12 }
    }).setOrigin(0.5);

    // 鼠标点击和手指轻点都是 pointer 事件
    this.input.once('pointerup', () => this.scene.start('Level', { index: 0 }));
  }
}

// ================= 关卡（三关共用） =================
class LevelScene extends Phaser.Scene {
  constructor() { super('Level'); }

  // 每次进入或重开这个场景时调用，data.index 是第几关（从 0 开始）
  init(data) {
    this.levelIndex = data.index || 0;
    this.level = LEVELS[this.levelIndex];
    this.done = false;       // 本关目标是否已取出
    this.isWiping = false;   // 是否正按在屏幕上（可能在擦，也可能是点击）
  }

  create() {
    const level = this.level;
    const glass = level.glass;

    // 背景色：每关更亮一点
    this.cameras.main.setBackgroundColor(level.bgColor);

    // 画面分层（从下到上，后画的在上面）：
    // 玻璃后的底色 → 后面的景物 → 目标 → 干扰项 → 前面的景物 → 雾 → 玻璃外框 → 界面
    const back = this.add.graphics();
    back.fillStyle(glass.color, 1);
    back.fillRoundedRect(glass.x, glass.y, glass.w, glass.h, glass.radius);

    level.scenery.filter(s => !s.front).forEach(s => drawShape(this, s));
    this.target = drawShape(this, level.target);
    level.decoys.forEach(s => drawShape(this, s));
    level.scenery.filter(s => s.front).forEach(s => drawShape(this, s));

    this.createFog();

    this.add.graphics()
      .lineStyle(8, 0x8796a8, 1)
      .strokeRoundedRect(glass.x, glass.y, glass.w, glass.h, glass.radius);

    this.createSlots();
    this.createClue();
    this.setupInput();
  }

  // ---------- 雾 ----------
  // 雾是一张和玻璃一样大的画布贴图（每个像素一格），只在圆角矩形里有雾，
  // 所以玻璃以外的地方始终清楚。
  // 每个像素记住「上次被擦的时间」，雾的浓度 = 离上次擦过了多久 ÷ 长满需要的时间，
  // 所以雾会慢慢、均匀地长回来，越晚擦的地方越晚起雾。
  createFog() {
    const { glass, fog } = this.level;
    const w = glass.w;
    const h = glass.h;

    // 上一关留下的雾贴图先删掉，再建一张新的
    if (this.textures.exists('fog')) this.textures.remove('fog');
    this.fogTexture = this.textures.createCanvas('fog', w, h);
    this.fogImage = this.fogTexture.context.createImageData(w, h);
    this.fogPixels = this.fogImage.data;   // 每个像素 4 个数：红、绿、蓝、不透明度

    this.fogBase = new Uint8Array(w * h);             // 每个像素满雾时的不透明度（玻璃外是 0）
    this.wipeTime = new Float64Array(w * h).fill(-Infinity);   // 每个像素上次被擦的时间（没擦过 = -Infinity）

    const color = Phaser.Display.Color.IntegerToRGB(fog.color);
    const fullAlpha = Math.round(fog.alpha * 255);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        this.fogBase[i] = insideRoundedRect(x + 0.5, y + 0.5, w, h, glass.radius) ? fullAlpha : 0;
        this.fogPixels[i * 4] = color.r;
        this.fogPixels[i * 4 + 1] = color.g;
        this.fogPixels[i * 4 + 2] = color.b;
        this.fogPixels[i * 4 + 3] = this.fogBase[i];
      }
    }
    this.fogTexture.context.putImageData(this.fogImage, 0, 0);
    this.fogTexture.refresh();
    this.add.image(glass.x, glass.y, 'fog').setOrigin(0, 0);

    // 被擦过、还没完全长回来的范围（只重画这一块，省时间）；null = 没有
    this.wipeBox = null;
    this.lastWipeAt = -Infinity;      // 最近一次擦雾的时间
    this.fogDirty = false;            // 是否需要重画雾
    this.lastClearEnoughAt = -Infinity;   // 目标处最近一次「擦开够多」的时间
  }

  // 雾从完全擦开到长满需要多少毫秒（速度为 0 时是无穷大 = 永远不回来）
  fogRegrowMs() {
    return TUNING.regrowSpeed > 0 ? 100000 / TUNING.regrowSpeed : Infinity;
  }

  // 某个像素现在的雾浓度：0 = 完全擦开，1 = 满雾
  fogAmount(i, now, regrowMs) {
    const age = now - this.wipeTime[i];   // 没擦过的像素 age 是 Infinity，直接算满雾
    return age >= regrowMs ? 1 : age / regrowMs;
  }

  // 在画布坐标 (x, y) 擦一下：把笔刷圆里每个像素的「上次被擦时间」设为现在
  eraseAt(x, y) {
    const glass = this.level.glass;
    const w = glass.w;
    const r = TUNING.brushRadius;
    const lx = x - glass.x;   // 换成相对玻璃左上角的坐标
    const ly = y - glass.y;
    const x0 = Math.max(0, Math.floor(lx - r));
    const x1 = Math.min(w - 1, Math.ceil(lx + r));
    const y0 = Math.max(0, Math.floor(ly - r));
    const y1 = Math.min(glass.h - 1, Math.ceil(ly + r));
    if (x0 > x1 || y0 > y1) return;   // 完全在玻璃外面

    const now = this.time.now;
    for (let py = y0; py <= y1; py++) {
      const dy = py + 0.5 - ly;
      for (let px = x0; px <= x1; px++) {
        const dx = px + 0.5 - lx;
        if (dx * dx + dy * dy <= r * r) this.wipeTime[py * w + px] = now;
      }
    }

    // 扩大「需要重画」的范围
    const box = this.wipeBox;
    if (box) {
      box.x0 = Math.min(box.x0, x0); box.x1 = Math.max(box.x1, x1);
      box.y0 = Math.min(box.y0, y0); box.y1 = Math.max(box.y1, y1);
    } else {
      this.wipeBox = { x0, x1, y0, y1 };
    }
    this.lastWipeAt = now;
    this.fogDirty = true;
  }

  // 每一帧：重画雾，并记录目标处是否「擦开够多」
  update() {
    this.redrawFog();
    if (this.targetClearedFraction() * 100 >= TUNING.clearPercent) {
      this.lastClearEnoughAt = this.time.now;
    }
  }

  // 按每个像素现在的雾浓度重画雾贴图（只画被擦过的那一块）
  redrawFog() {
    const box = this.wipeBox;
    if (!box) return;
    const regrowMs = this.fogRegrowMs();
    // 雾不回来（速度 0）时，只有刚擦过才需要重画
    if (regrowMs === Infinity && !this.fogDirty) return;

    const now = this.time.now;
    const w = this.level.glass.w;
    for (let y = box.y0; y <= box.y1; y++) {
      for (let x = box.x0; x <= box.x1; x++) {
        const i = y * w + x;
        this.fogPixels[i * 4 + 3] = this.fogBase[i] * this.fogAmount(i, now, regrowMs);
      }
    }
    this.fogTexture.context.putImageData(this.fogImage, 0, 0,
      box.x0, box.y0, box.x1 - box.x0 + 1, box.y1 - box.y0 + 1);
    this.fogTexture.refresh();
    this.fogDirty = false;

    // 全部长满了：以后不用再重画，等下次擦
    if (now - this.lastWipeAt >= regrowMs) this.wipeBox = null;
  }

  // 从 (x0, y0) 擦到 (x1, y1)：沿线段每隔一小段擦一下，快速拖动也不会断开
  wipeLine(x0, y0, x1, y1) {
    const dist = Phaser.Math.Distance.Between(x0, y0, x1, y1);
    const step = Math.max(2, TUNING.brushRadius * 0.3);
    const count = Math.max(1, Math.ceil(dist / step));
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      this.eraseAt(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
    }
  }

  // 目标点击区域里，雾现在平均擦开了多少（0 到 1）
  // 每个点的「擦开程度」= 1 - 雾浓度，所以正在长回来的雾只算一部分
  targetClearedFraction() {
    const { glass, target } = this.level;
    const hit = target.hit;
    const now = this.time.now;
    const regrowMs = this.fogRegrowMs();
    let total = 0;
    let clear = 0;
    for (let y = hit.y - hit.r; y <= hit.y + hit.r; y += HIT_SAMPLE_STEP) {
      for (let x = hit.x - hit.r; x <= hit.x + hit.r; x += HIT_SAMPLE_STEP) {
        if (Phaser.Math.Distance.Between(x, y, hit.x, hit.y) > hit.r) continue;
        const px = Math.floor(x - glass.x);
        const py = Math.floor(y - glass.y);
        if (px < 0 || py < 0 || px >= glass.w || py >= glass.h) continue;
        total++;
        clear += 1 - this.fogAmount(py * glass.w + px, now, regrowMs);
      }
    }
    return total > 0 ? clear / total : 1;
  }

  // ---------- 输入：鼠标和触屏共用同一套 pointer 事件 ----------
  setupInput() {
    // 按下：记录起点
    this.input.on('pointerdown', (pointer) => {
      if (this.done) return;
      this.isWiping = true;
      this.pointerId = pointer.id;   // 只跟踪按下的这一根手指/这只鼠标
      this.downX = pointer.x;
      this.downY = pointer.y;
      this.lastX = pointer.x;
      this.lastY = pointer.y;
      this.maxMove = 0;
    });

    // 移动：移动距离超过 TAP_MAX_MOVE 才开始擦，这样轻点不会顺手把雾擦掉
    this.input.on('pointermove', (pointer) => {
      if (!this.isWiping || pointer.id !== this.pointerId || !pointer.isDown || this.done) return;
      const moved = Phaser.Math.Distance.Between(this.downX, this.downY, pointer.x, pointer.y);
      this.maxMove = Math.max(this.maxMove, moved);
      if (this.maxMove < TAP_MAX_MOVE) return;
      this.wipeLine(this.lastX, this.lastY, pointer.x, pointer.y);
      this.lastX = pointer.x;
      this.lastY = pointer.y;
    });

    // 松开：几乎没移动就算一次点击
    this.input.on('pointerup', (pointer) => {
      if (!this.isWiping || pointer.id !== this.pointerId) return;
      this.isWiping = false;
      if (this.maxMove < TAP_MAX_MOVE) this.tryTap(pointer.x, pointer.y);
    });

    // 在画布外松开：只结束擦拭
    this.input.on('pointerupoutside', (pointer) => {
      if (pointer.id === this.pointerId) this.isWiping = false;
    });
  }

  // 点击判定：点在目标区域里，且那里的雾「现在擦开够多」或「TAP_GRACE_MS 之内擦开够多过」，才算找到
  tryTap(x, y) {
    if (this.done) return;
    const hit = this.level.target.hit;
    if (Phaser.Math.Distance.Between(x, y, hit.x, hit.y) > hit.r) return;
    const clearNow = this.targetClearedFraction() * 100 >= TUNING.clearPercent;
    const clearRecently = this.time.now - this.lastClearEnoughAt <= TAP_GRACE_MS;
    if (!clearNow && !clearRecently) return;
    this.collect();
  }

  // ---------- 取出目标 ----------
  // 目标缩小并飞进右侧本关的格子，然后进入下一关
  collect() {
    this.done = true;
    this.clueTimer.remove();

    const s = this.level.target;
    const scale = iconScale(s);
    const slot = slotPosition(this.levelIndex, s, scale);

    this.target.setDepth(100);   // 飞的时候放到最上层，不被雾挡住
    this.tweens.add({
      targets: this.target,
      x: slot.x,
      y: slot.y,
      scale: scale,
      duration: 700,
      ease: 'Cubic.easeInOut',
      onComplete: () => this.time.delayedCall(700, () => this.nextLevel())
    });
  }

  nextLevel() {
    const next = this.levelIndex + 1;
    if (next < LEVELS.length) {
      this.scene.restart({ index: next });
      return;
    }
    // 最后一关结束：画面渐白，然后进入结尾
    this.cameras.main.fadeOut(1500, 255, 255, 255);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('End'));
  }

  // ---------- 右侧格子 ----------
  // 每关一个格子；前面几关取出的目标已经放在格子里
  createSlots() {
    const g = this.add.graphics();
    LEVELS.forEach((lv, i) => {
      const c = slotCenter(i);
      const half = SLOT_SIZE / 2;
      g.fillStyle(0x000000, 0.25);
      g.fillRoundedRect(c.x - half, c.y - half, SLOT_SIZE, SLOT_SIZE, 8);
      g.lineStyle(2, 0xdce4f0, 0.6);
      g.strokeRoundedRect(c.x - half, c.y - half, SLOT_SIZE, SLOT_SIZE, 8);

      if (i < this.levelIndex) {
        const scale = iconScale(lv.target);
        const pos = slotPosition(i, lv.target, scale);
        drawShape(this, { ...lv.target, x: pos.x, y: pos.y }).setScale(scale);
      }
    });
  }

  // ---------- 线索（左上角） ----------
  // 先显示第一句，之后每隔 CLUE_INTERVAL 还没找到就多显示一句
  createClue() {
    this.shownLines = 1;
    this.clueBox = this.add.container(0, 0);   // 装所有对话框
    this.refreshClue();

    this.clueTimer = this.time.addEvent({
      delay: CLUE_INTERVAL,
      loop: true,
      callback: () => {
        if (this.shownLines < this.level.clues.length) {
          this.shownLines++;
          this.refreshClue();
        }
      }
    });
  }

  // 每一句线索画成一个对话框，从上往下排（每次都全部重画）
  // 太长的一句在逗号后换行，免得盖到玻璃上
  refreshClue() {
    this.clueBox.removeAll(true);
    let y = BUBBLE_TOP;
    this.level.clues.slice(0, this.shownLines).forEach(line => {
      const content = line.length > CLUE_MAX_CHARS ? line.replace('，', '，\n') : line;
      const text = this.add.text(BUBBLE_LEFT + BUBBLE_PAD_X, y + BUBBLE_PAD_Y, content, {
        fontFamily: FONT,
        fontSize: '16px',
        color: BUBBLE_TEXT,
        lineSpacing: 6
      });

      // 先量出文字大小，再画刚好包住它的圆角框，右边中间加一个朝右的小三角当尾巴
      const w = text.width + BUBBLE_PAD_X * 2;
      const h = text.height + BUBBLE_PAD_Y * 2;
      const right = BUBBLE_LEFT + w;
      const midY = y + h / 2;
      const bubble = this.add.graphics();
      bubble.fillStyle(BUBBLE_COLOR, 0.95);
      bubble.fillRoundedRect(BUBBLE_LEFT, y, w, h, 10);
      bubble.fillTriangle(
        right - 1, midY - 7,
        right - 1, midY + 7,
        right + 10, midY
      );

      this.clueBox.add([bubble, text]);   // 框在下，字在上
      y += h + BUBBLE_GAP;
    });
  }

}

// ================= 结尾 =================
class EndScene extends Phaser.Scene {
  constructor() { super('End'); }

  create() {
    // 上一关已经渐变成白色，这里直接用白色背景接上
    this.cameras.main.setBackgroundColor('#ffffff');

    this.add.text(640, 300, '早安', {
      fontFamily: FONT, fontSize: '56px', color: '#3a4a5c'
    }).setOrigin(0.5);

    const button = this.add.rectangle(640, 430, 220, 64, 0x4f86bf)
      .setInteractive({ useHandCursor: true });
    this.add.text(640, 430, '再来一次', {
      fontFamily: FONT, fontSize: '24px', color: '#ffffff'
    }).setOrigin(0.5);

    button.on('pointerup', () => this.scene.start('Level', { index: 0 }));
  }
}

// ================= 启动游戏 =================
const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: LEVELS[0].bgColor,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [StartScene, LevelScene, EndScene]
});
