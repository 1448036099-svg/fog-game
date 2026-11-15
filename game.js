// 《雾里有什么》· 灰盒原型
// 只用色块和简单图形：擦雾 → 读线索 → 找目标 → 点击取出，三关后天亮
// 逻辑尺寸固定 1280x720，Phaser.Scale.FIT 自动缩放

// ================= 关卡数据（三关共用 LevelScene，只读这里） =================
// 所有坐标都是画布坐标（左上角 0,0，右下角 1280,720）
// 形状字段：
//   type    star 星形 / circle 圆 / crescent 月牙（开口朝右）/ halfCircle 上半圆 / rect 矩形 / image 图片
//   image 用 key、path、x、y；用 height 或 width 等比缩放（只写一个）；fallback 是图片缺失时的色块
// overlays（可选）：先于鱼缸绘制的叠层（比如底部胸像，垫在鱼缸后面）
//   size    半径（rect 用 w、h）
//   rot     旋转角度（度）
//   glow    true = 外面加一圈淡淡的光晕（表示「亮」）
//   holes   true = 上面有两个小洞
//   outline 描边 { color, width }
//   front   只用于 scenery：true = 画在目标和干扰项前面（比如挡住太阳的篱笆）
// target.hit：点击判定圆（圆心 x、y，半径 r），也是统计「擦开比例」的区域
// frame（可选）：玻璃外框图片 { key, path, x, y, width 或 height }，x、y 是图片左上角，宽或高二选一等比缩放
//   有图片时用图片代替玻璃底色和描边；图片缺失时自动退回色块
const LEVELS = [
  // ---------- 第 1 关：鱼缸（深夜蓝） ----------
  // 鱼缸图 655x429，放大到 700 宽（和原来的玻璃一样宽）；glass 是图里鱼缸正面玻璃的范围，雾只盖这里
  {
    bgColor: '#0b1a2e',
    clues: ['有五个角……', '亮亮的……', '我把它养在水草旁边……', '夜里，我是最先醒来的那一个……'],
    frame: { key: 'tank_frame_01', path: 'assets/frames/tank_frame_01.png', x: 290, y: 106, width: 700 },
    // 屏幕底部胸像：比鱼缸（700 宽）略窄，贴底居中；先画，垫在鱼缸后面
    overlays: [
      { type: 'image', key: 'viewer_01', path: 'assets/ui/viewer_01.png',
        x: 640, y: 860, width: 640, originX: 0.5, originY: 1 }
    ],
    glass: { x: 299, y: 189, w: 683, h: 353, radius: 6, color: 0x173b4f },
    fog: { color: 0xd8dee6, alpha: 0.9 },    // 较薄的水汽
    scenery: [
      { type: 'rect', x: 640, y: 520, w: 560, h: 36, color: 0x6b6a55 },   // 缸底沙子
      // 水草图片：x、y 是图片底边中点（插在沙子上），比原来的色块水草（120 高）略高
      { type: 'image', key: 'tank_cutouts_01', path: 'assets/cutouts/tank_cutouts_01.png',
        x: 425, y: 515, height: 200,
        fallback: [   // 图片缺失时画回原来的三根色块水草
          { type: 'rect', x: 405, y: 458, w: 10, h: 95, color: 0x2f6b4a },
          { type: 'rect', x: 430, y: 445, w: 14, h: 120, color: 0x2f6b4a },
          { type: 'rect', x: 458, y: 455, w: 12, h: 100, color: 0x2f6b4a }
        ] },
      // 珊瑚图片：在水草和礁石之间，高度约为礁石的一半；排在水草后、礁石前，所以画在水草前面、被礁石轻微挡住
      { type: 'image', key: 'tank_cutouts_03', path: 'assets/cutouts/tank_cutouts_03.png',
        x: 480, y: 525, height: 85,
        fallback: [   // 图片缺失时画一个紫色圆当珊瑚
          { type: 'circle', x: 480, y: 490, size: 35, color: 0x8a7aa8 }
        ] },
      // 沙堡图片：在礁石右后方，比水草（200 高）更高；排在礁石前面，所以会被礁石轻微挡住
      //   底边比礁石底边高一点，看起来在礁石后面
      { type: 'image', key: 'tank_cutouts_04', path: 'assets/cutouts/tank_cutouts_04.png',
        x: 810, y: 515, height: 260,
        fallback: [   // 图片缺失时画一个沙色矩形当沙堡
          { type: 'rect', x: 825, y: 430, w: 150, h: 170, color: 0xc8b48a }
        ] },
      // 小海草：沙堡和礁石之间；排在礁石前面画，所以会被礁石轻微挡住；高度约为礁石的 2/3
      { type: 'image', key: 'tank_cutouts_08', path: 'assets/cutouts/tank_cutouts_08.png',
        x: 750, y: 510, height: 113,
        fallback: [
          { type: 'rect', x: 720, y: 480, w: 8, h: 90, color: 0x2f6b4a },
          { type: 'rect', x: 735, y: 470, w: 10, h: 105, color: 0x2f6b4a }
        ] },
      // 礁石图片：在水草右边，比水草（200 高）略低
      { type: 'image', key: 'tank_cutouts_02', path: 'assets/cutouts/tank_cutouts_02.png',
        x: 630, y: 532, height: 170,
        fallback: [   // 图片缺失时画一块灰色半圆当礁石
          { type: 'halfCircle', x: 630, y: 532, size: 110, color: 0x6b7078 }
        ] },
      // 小鱼：鱼缸中上方，大小和海星差不多（高约 54）
      { type: 'image', key: 'tank_cutouts_07', path: 'assets/cutouts/tank_cutouts_07.png',
        x: 640, y: 280, height: 54, originX: 0.5, originY: 0.5,
        fallback: [{ type: 'circle', x: 640, y: 280, size: 22, color: 0xf0d060 }] }
    ],
    // 目标：水草旁发光的星星鹅卵石（图片位置和点击判定必须一致）
    target: { type: 'image', key: 'tank_cutouts_06', path: 'assets/cutouts/tank_cutouts_06.png',
              x: 395, y: 500, height: 36, originX: 0.5, originY: 0.5,
              hit: { x: 395, y: 500, r: 28 },
              fallback: [{ type: 'star', x: 395, y: 500, size: 16, color: 0xfff2a8, glow: true }] },
    decoys: [
      { type: 'star', x: 895, y: 262, size: 16, color: 0xfff2a8, glow: true },   // 小夜灯：亮、星形，但不在水草旁
      { type: 'star', x: 600, y: 522, size: 9, color: 0xc07aa8 },                // 彩色小石子：星形，但不亮
      { type: 'star', x: 690, y: 528, size: 9, color: 0x7aa8c0 },
      // 礁石和沙堡之间的海星：替换原先绿色小石子，长宽约为原星（直径约 18）的三倍
      { type: 'image', key: 'tank_cutouts_05', path: 'assets/cutouts/tank_cutouts_05.png',
        x: 780, y: 500, height: 54, originX: 0.5, originY: 0.5,
        fallback: [{ type: 'star', x: 780, y: 520, size: 9, color: 0x9bc07a }] },
      { type: 'circle', x: 850, y: 410, size: 8, color: 0xe8f6ff, glow: true },  // 气泡：亮，但没有角
      { type: 'circle', x: 862, y: 365, size: 6, color: 0xe8f6ff, glow: true },
      { type: 'circle', x: 855, y: 325, size: 5, color: 0xe8f6ff, glow: true }
    ]
  },


  // ---------- 第 2 关：电视机里的客厅（蓝调时刻） ----------
  // 电视机图 634x655，按高度 760 显示（略超出 720 画幅）；图里已带脖子，所以本关不用 overlays 胸像
  // glass 对准图里 CRT 屏幕区域；景物坐标已从旧玻璃映射到新屏幕
  {
    bgColor: '#1d3d66',
    clues: ['被放在软绵绵的东西上……', '弯弯的……', '有两个小洞……', '我曾经挂在天上，现在睡在这里……'],
    frame: { key: 'tv_frame_01', path: 'assets/frames/tv_frame_01.png', x: 272, y: -20, height: 760 },
    glass: { x: 365, y: 149, w: 454, h: 322, radius: 80, color: 0x3b3445 },
    fog: { color: 0xd4d6da, alpha: 0.94 },   // 灰白的雾
    scenery: [
    ],
    // 目标：外套上的月亮纽扣（有两个洞）；高度约等于原来月牙 size 13（直径约 26）
    target: { type: 'image', key: 'tv_cutouts_02', path: 'assets/cutouts/tv_cutouts_02.png',
              x: 765, y: 378, height: 20, originX: 0.5, originY: 0.5,
              hit: { x: 765, y: 378, r: 14 },
              fallback: [{ type: 'crescent', x: 755, y: 348, size: 13, color: 0xe8d9a0, holes: true }] },
    decoys: [
      // 月亮抱枕：弯、软，但没有洞；高度约等于原来浅黄月牙（size 20 → 直径约 40）
      { type: 'image', key: 'tv_cutouts_01', path: 'assets/cutouts/tv_cutouts_01.png',
        x: 445, y: 334, height: 44, originX: 0.5, originY: 0.5,
        fallback: [{ type: 'crescent', x: 445, y: 334, size: 20, color: 0xe8d9a0 }] },
      // 普通圆纽扣：有洞，但不弯；高度约等于原来 size 7（直径约 14）
      { type: 'image', key: 'tv_cutouts_03', path: 'assets/cutouts/tv_cutouts_03.png',
        x: 625, y: 374, height: 8, originX: 0.5, originY: 0.5,
        fallback: [{ type: 'circle', x: 625, y: 374, size: 4, color: 0xe8d9a0, holes: true }] },
      // 香蕉：弯，但没有洞；放在圆纽扣旁边，高度约等于原来 size 17
      { type: 'image', key: 'tv_cutouts_04', path: 'assets/cutouts/tv_cutouts_04.png',
        x: 600, y: 360, height: 36, originX: 0.5, originY: 0.5,
        fallback: [{ type: 'crescent', x: 670, y: 390, size: 17, color: 0xe6c94a, rot: -90 }] },
      // 月亮画：弯，但不在软的东西上；放在香蕉正上方
      { type: 'image', key: 'tv_cutouts_05', path: 'assets/cutouts/tv_cutouts_05.png',
        x: 620, y: 280, height: 20, originX: 0.5, originY: 0.5,
        fallback: [{ type: 'crescent', x: 600, y: 300, size: 17, color: 0xe8d9a0 }] }
    ]
  },

  // ---------- 第 3 关：窗外的小花园（日出） ----------
  // 窗景图 682x900，按宽度 700 显示（与原来玻璃同宽），高度约 924，上下略超出画幅
  {
    bgColor: '#3f74ad',
    clues: ['我在等一个很大很大的东西……', '它每天都会回来……', '它一出现，所有的灯都会变得很小……', '每一个早晨，都是从它开始的……'],
    frame: { key: 'window_frame_01', path: 'assets/frames/window_frame_01.jpg', x: 310, y: -302, width: 660 },
    // glass 对准整张窗景（宽 700、高约 924），雾盖满窗；景物坐标仍按旧窗户区摆放
    glass: { x: 310, y: -302, w: 660, h: 874, radius: 12, color: 0x9db4cc },
    fog: { color: 0xe4e8ec, alpha: 0.97 },   // 大面积厚雾
    scenery: [
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
    // 目标：篱笆后面冒出的太阳；底边贴篱笆，宽约等于原来半圆直径（size 100 → 200）
    target: { type: 'image', key: 'window_cutouts_01', path: 'assets/cutouts/window_cutouts_01.png',
              x: 650, y: 350, width: 250, originX: 0.5, originY: 1,
              hit: { x: 650, y: 380, r: 70 },
              fallback: [{ type: 'halfCircle', x: 650, y: 440, size: 100, color: 0xffc94a,
                outline: { color: 0xfff0b0, width: 6 } }] },
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

// 全局壁纸：开始画面、三关、结尾共用；铺满 1280x720
const WALLPAPER = { key: 'wallpaper_01', path: 'assets/backgrounds/wallpaper_01.jpg' };
const GAME_W = 1280;
const GAME_H = 720;

// 垫一张全屏背景；图片缺失时什么都不画，继续用场景的背景色
function addWallpaper(scene) {
  if (!scene.textures.exists(WALLPAPER.key)) return null;
  return scene.add.image(0, 0, WALLPAPER.key)
    .setOrigin(0, 0)
    .setDisplaySize(GAME_W, GAME_H)
    .setDepth(-1000);
}

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
  if (s.type === 'image') return drawImageItem(scene, s);

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

// 相对玻璃中心的径向位置：0 = 正中，1 = 贴到椭圆边缘（再往外仍钳在 1）
function radialEdgeT(px, py, w, h) {
  const nx = (px - w * 0.5) / (w * 0.5);
  const ny = (py - h * 0.5) / (h * 0.5);
  return Math.min(1, Math.sqrt(nx * nx + ny * ny));
}

// 中间透明、外侧更实：t 从 0→1 时不透明度从 centerA 升到 edgeA
function radialAlpha(t, centerA, edgeA) {
  const s = t * t;   // 中间一大片更透，靠近边缘才明显变实
  return centerA + (edgeA - centerA) * s;
}

// 画一张图片：用 width 或 height 等比缩放；默认底边中点在 (s.x, s.y)，也可设 originX / originY
// 图片缺失时改画 s.fallback 里的色块
function drawImageItem(scene, s) {
  if (!scene.textures.exists(s.key)) {
    (s.fallback || []).forEach(f => drawShape(scene, f));
    return null;
  }
  const ox = s.originX !== undefined ? s.originX : 0.5;
  const oy = s.originY !== undefined ? s.originY : 1;
  const img = scene.add.image(s.x, s.y, s.key).setOrigin(ox, oy);
  if (s.width) img.setScale(s.width / img.width);
  else img.setScale(s.height / img.height);
  return img;
}

// 目标飞进格子后的缩放比例（只缩小，不放大）
// 色块用 size；图片用纹理原高度，让格子里大约显示为格子边长的 55%
function iconScale(s, obj) {
  if (s.type === 'image' && obj && obj.height) {
    return (SLOT_SIZE * 0.55) / obj.height;
  }
  return Math.min(0.8, (SLOT_SIZE * 0.35) / (s.size || 16));
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

  // 在开始画面一次性加载所有关卡的图片；某张图加载失败也没关系，关卡里会退回色块
  preload() {
    this.load.image(WALLPAPER.key, WALLPAPER.path);
    LEVELS.forEach(level => {
      if (level.frame) this.load.image(level.frame.key, level.frame.path);
      [...level.scenery, ...level.decoys, level.target, ...(level.overlays || [])].forEach(s => {
        if (s && s.type === 'image') this.load.image(s.key, s.path);
      });
    });
  }

  create() {
    // 背景色作兜底；壁纸铺满画幅
    this.cameras.main.setBackgroundColor(LEVELS[0].bgColor);
    addWallpaper(this);

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

    // 背景色作兜底；三关共用同一张壁纸
    this.cameras.main.setBackgroundColor(level.bgColor);
    addWallpaper(this);

    // 画面分层（从下到上，后画的在上面）：
    // 壁纸 → 胸像 → 鱼缸 → 关卡内容 → 雾 → 界面 → 再接收输入
    // 胸像先画，垫在鱼缸后面，做成「鱼缸当头」的拼贴
    (level.overlays || []).forEach(s => drawShape(this, s));

    const frame = level.frame;
    const hasFrameImage = frame && this.textures.exists(frame.key);
    if (hasFrameImage) {
      const img = this.add.image(frame.x, frame.y, frame.key).setOrigin(0, 0);
      if (frame.height) img.setScale(frame.height / img.height);
      else img.setScale(frame.width / img.width);
    } else {
      // 无外框图时：玻璃底色也从中心向外渐变（中间更透，边缘更实）
      this.createGlassTint();
    }

    level.scenery.filter(s => !s.front).forEach(s => drawShape(this, s));
    this.target = drawShape(this, level.target);
    level.decoys.forEach(s => drawShape(this, s));
    level.scenery.filter(s => s.front).forEach(s => drawShape(this, s));

    this.createFog();

    // 没有外框图片时，画一圈描边当玻璃边框
    if (!hasFrameImage) {
      this.add.graphics()
        .lineStyle(8, 0x8796a8, 1)
        .strokeRoundedRect(glass.x, glass.y, glass.w, glass.h, glass.radius);
    }

    this.createSlots();
    this.createClue();
    this.setupInput();
  }

  // ---------- 玻璃底色（无外框图时）----------
  // 和雾一样：中间更透、外侧更实，圆角矩形外完全透明
  createGlassTint() {
    const { glass } = this.level;
    const w = glass.w;
    const h = glass.h;
    const key = 'glassTint';
    if (this.textures.exists(key)) this.textures.remove(key);
    const tex = this.textures.createCanvas(key, w, h);
    const img = tex.context.createImageData(w, h);
    const px = img.data;
    const color = Phaser.Display.Color.IntegerToRGB(glass.color);
    const edgeA = 230;    // 外侧较实
    const centerA = 40;   // 中间很透
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        px[i] = color.r;
        px[i + 1] = color.g;
        px[i + 2] = color.b;
        if (!insideRoundedRect(x + 0.5, y + 0.5, w, h, glass.radius)) {
          px[i + 3] = 0;
        } else {
          px[i + 3] = Math.round(radialAlpha(radialEdgeT(x + 0.5, y + 0.5, w, h), centerA, edgeA));
        }
      }
    }
    tex.context.putImageData(img, 0, 0);
    tex.refresh();
    this.add.image(glass.x, glass.y, key).setOrigin(0, 0);
  }

  // ---------- 雾 ----------
  // 雾是一张和玻璃一样大的画布贴图（每个像素一格），只在圆角矩形里有雾，
  // 所以玻璃以外的地方始终清楚。
  // 满雾时不透明度从中心向外渐变：中间更透、外侧更实。
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
    const edgeA = Math.round(fog.alpha * 255);
    const centerA = Math.round(edgeA * 0.12);   // 中间约保留一成雾，大部分透出景物
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (!insideRoundedRect(x + 0.5, y + 0.5, w, h, glass.radius)) {
          this.fogBase[i] = 0;
        } else {
          this.fogBase[i] = Math.round(
            radialAlpha(radialEdgeT(x + 0.5, y + 0.5, w, h), centerA, edgeA)
          );
        }
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
    const scale = iconScale(s, this.target);
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
        const pos = slotPosition(i, lv.target, 1);
        const icon = drawShape(this, { ...lv.target, x: pos.x, y: pos.y });
        if (icon) icon.setScale(iconScale(lv.target, icon));
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
    // 片尾也用同一张壁纸；文字改浅色，在花纹上看得清
    this.cameras.main.setBackgroundColor('#ffffff');
    addWallpaper(this);

    this.add.text(640, 300, '早安', {
      fontFamily: FONT, fontSize: '56px', color: '#f0f4f8'
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
