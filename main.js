// ===========================
// Utility Functions
// ===========================

const random = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

const bezier = (cp, t) => {
  const [p0, p1, p2] = cp;
  return p0.mul((1 - t) ** 2).add(p1.mul(2 * t * (1 - t))).add(p2.mul(t ** 2));
};

const inheart = (x, y, r) => {
  const [nx, ny] = [x / r, y / r];
  return (nx ** 2 + ny ** 2 - 1) ** 3 - nx ** 2 * ny ** 3 < 0;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ===========================
// Core Classes
// ===========================

class Point {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  clone() { return new Point(this.x, this.y); }
  add(o) { return new Point(this.x + o.x, this.y + o.y); }
  sub(o) { return new Point(this.x - o.x, this.y - o.y); }
  div(n) { return new Point(this.x / n, this.y / n); }
  mul(n) { return new Point(this.x * n, this.y * n); }
}

class Heart {
  constructor() {
    this.points = [];
    for (let i = 10; i < 30; i += 0.2) {
      const t = i / Math.PI;
      const x = 16 * Math.sin(t) ** 3;
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      this.points.push(new Point(x, y));
    }
    this.length = this.points.length;
  }
  get(i, scale = 1) { return this.points[i].mul(scale); }
}

// ===========================
// Seed Class (Initial Heart)
// ===========================

class Seed {
  constructor(tree, point, scale = 1, color = "#FF0000") {
    this.tree = tree;
    this.heart = { point, scale, color, figure: new Heart() };
    this.circle = { point, scale, color, radius: 5 };
  }
  
  draw = () => { 
    this.drawHeart(); 
    this.drawText(); 
  };
  
  addPosition = (x, y) => { 
    this.circle.point = this.circle.point.add(new Point(x, y)); 
  };
  
  canMove = () => this.circle.point.y < this.tree.height + 20;
  canScale = () => this.heart.scale > 0.2;
  
  move = (x, y) => { 
    this.clear(); 
    this.drawCircle(); 
    this.addPosition(x, y); 
  };
  
  scale = (s) => { 
    this.clear(); 
    this.drawCircle(); 
    this.drawHeart(); 
    this.heart.scale *= s;
  };
  
  drawHeart = () => {
    const { ctx } = this.tree;
    const { point, color, scale } = this.heart;
    ctx.save();
    ctx.fillStyle = color;
    ctx.translate(point.x, point.y);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let i = 0; i < this.heart.figure.length; i++) {
      const p = this.heart.figure.get(i, scale);
      ctx.lineTo(p.x, -p.y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  
  drawCircle = () => {
    const { ctx } = this.tree;
    const { point, color, scale, radius } = this.circle;
    ctx.save();
    ctx.fillStyle = color;
    ctx.translate(point.x, point.y);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  
  drawText = () => {
    const { ctx } = this.tree;
    const { point, color, scale } = this.heart;
    const text = CONFIG.seedText;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.translate(point.x, point.y);
    ctx.scale(scale, scale);
    ctx.moveTo(0, 0);
    ctx.lineTo(15, 15);
    ctx.lineTo(60, 15);
    ctx.stroke();
    ctx.moveTo(0, 0);
    ctx.scale(0.75, 0.75);
    ctx.font = '12px sans-serif';
    ctx.fillText(text, 23, 10);
    ctx.restore();
  };
  
  clear = () => {
    const { ctx } = this.tree;
    const { point, scale } = this.circle;
    const w = 26 * scale, h = 26 * scale;
    ctx.clearRect(point.x - w, point.y - h, 4 * w, 4 * h);
  };
  
  hover = (x, y) => {
    const pixel = this.tree.ctx.getImageData(x, y, 1, 1);
    return pixel.data[3] === 255;
  };
}

// ===========================
// Footer Class (Ground Line)
// ===========================

class Footer {
  constructor(tree, width, height, speed = 2) {
    this.tree = tree;
    this.point = new Point(tree.seed.heart.point.x, tree.height - height / 2);
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.length = 0;
  }
  
  draw() {
    const { ctx } = this.tree;
    const { point, height, length, width, speed } = this;
    ctx.save();
    ctx.strokeStyle = "rgb(35, 31, 32)";
    ctx.lineWidth = height;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.translate(point.x, point.y);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(length / 2, 0);
    ctx.lineTo(-length / 2, 0);
    ctx.stroke();
    ctx.restore();
    if (length < width) this.length += speed;
  }
}

// ===========================
// Tree Class (Main Canvas Manager)
// ===========================

class Tree {
  constructor(canvas, width, height, opt = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.width = width;
    this.height = height;
    this.opt = opt;
    this.record = {};
    this.initSeed();
    this.initFooter();
    this.initBranch();
    this.initBloom();
  }
  
  initSeed() {
    const { x = this.width / 2, y = this.height / 2, color = "#FF0000", scale = 1 } = this.opt.seed || {};
    this.seed = new Seed(this, new Point(x, y), scale, color);
  }
  
  initFooter() {
    const { width = this.width, height = 5, speed = 2 } = this.opt.footer || {};
    this.footer = new Footer(this, width, height, speed);
  }
  
  initBranch() {
    this.branches = [];
    this.addBranches(this.opt.branch || []);
  }
  
  initBloom() {
    const { num = 500, width = this.width, height = this.height } = this.opt.bloom || {};
    const figure = this.seed.heart.figure;
    const r = 240;
    const cache = [];
    for (let i = 0; i < num; i++) {
      cache.push(this.createBloom(width, height, r, figure));
    }
    this.blooms = [];
    this.bloomsCache = cache;
  }
  
  toDataURL(type) { return this.canvas.toDataURL(type); }
  
  draw(k) {
    const rec = this.record[k];
    if (!rec) return;
    const { point, image } = rec;
    this.ctx.save();
    this.ctx.putImageData(image, point.x, point.y);
    this.ctx.restore();
  }
  
  addBranch(branch) { this.branches.push(branch); }
  
  addBranches(branches) {
    branches.forEach(([x1, y1, x2, y2, x3, y3, r, l, c]) => {
      this.addBranch(new Branch(this, new Point(x1, y1), new Point(x2, y2), new Point(x3, y3), r, l, c));
    });
  }
  
  removeBranch(branch) { this.branches = this.branches.filter((b) => b !== branch); }
  canGrow() { return this.branches.length > 0; }
  grow() { this.branches.forEach((b) => b?.grow()); }
  addBloom(bloom) { this.blooms.push(bloom); }
  removeBloom(bloom) { this.blooms = this.blooms.filter((b) => b !== bloom); }
  
  createBloom(width, height, radius, figure, color, alpha, angle, scale, place, speed) {
    let x, y;
    while (true) {
      x = Math.random() * (width - 40) + 20;
      y = Math.random() * (height - 40) + 20;
      if (inheart(x - width / 2, height - (height - 40) / 2 - y, radius)) {
        return new Bloom(this, new Point(x, y), figure, color, alpha, angle, scale, place, speed);
      }
    }
  }
  
  canFlower() { return this.bloomsCache.length > 0; }
  
  flower(num) {
    const blooms = this.bloomsCache.splice(0, num);
    blooms.forEach((b) => this.addBloom(b));
    this.blooms.forEach((b) => b.flower());
  }
  
  snapshot(k, x, y, width, height) {
    this.record[k] = { image: this.ctx.getImageData(x, y, width, height), point: new Point(x, y), width, height };
  }
  
  move(k, x, y) {
    const rec = this.record[k || "move"];
    let { point, image, speed = 10, width, height } = rec;
    const i = Math.min(point.x + speed, x);
    const j = Math.min(point.y + speed, y);
    this.ctx.save();
    this.ctx.clearRect(point.x, point.y, width, height);
    this.ctx.putImageData(image, i, j);
    this.ctx.restore();
    rec.point = new Point(i, j);
    rec.speed = Math.max(speed * 0.95, 2);
    return i < x || j < y;
  }
  
  jump() {
    // Only keep blooms that can fall (have place and speed)
    const blooms = this.blooms.filter(b => b.place && b.speed);
    this.blooms = blooms;
    blooms.forEach((b) => b.jump());
    
    // Generate new falling blooms if needed
    if (blooms.length < 3) {
      const { width = this.width, height = this.height } = this.opt.bloom || {};
      const figure = this.seed.heart.figure;
      for (let i = 0; i < random(1, 2); i++) {
        this.blooms.push(this.createBloom(
          width / 2 + width, height, 240, figure, 
          `rgb(255,${random(0, 255)},${random(0, 255)})`, 
          1, null, 1, 
          new Point(random(-100, 600), 720), 
          random(200, 300)
        ));
      }
    }
  }
}

// ===========================
// Branch Class (Tree Branches)
// ===========================

class Branch {
  constructor(tree, p1, p2, p3, radius, length = 100, branchs = []) {
    this.tree = tree;
    this.point1 = p1;
    this.point2 = p2;
    this.point3 = p3;
    this.radius = radius;
    this.length = length;
    this.len = 0;
    this.t = 1 / (length - 1);
    this.branchs = branchs;
  }
  
  grow() {
    if (this.len <= this.length) {
      const p = bezier([this.point1, this.point2, this.point3], this.len * this.t);
      this.draw(p);
      this.len += 1;
      this.radius *= 0.97;
    } else {
      this.tree.removeBranch(this);
      this.tree.addBranches(this.branchs);
    }
  }
  
  draw(p) {
    const { ctx } = this.tree;
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = "rgb(35, 31, 32)";
    ctx.shadowColor = "rgb(35, 31, 32)";
    ctx.shadowBlur = 2;
    ctx.moveTo(p.x, p.y);
    ctx.arc(p.x, p.y, this.radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

// ===========================
// Bloom Class (Heart Blossoms)
// ===========================

class Bloom {
  constructor(tree, point, figure, color = `rgb(255,${random(0, 255)},${random(0, 255)})`, 
    alpha = random(0.3, 1), angle = random(0, 360), scale = 0.1, place, speed) {
    this.tree = tree;
    this.point = point;
    this.color = color;
    this.alpha = alpha;
    this.angle = angle;
    this.scale = scale;
    this.place = place;
    this.speed = speed;
    this.figure = figure;
  }
  
  // Bloom animation: grow from small to large
  flower = () => {
    this.draw();
    this.scale += 0.1;
    if (this.scale > 1) this.tree.removeBloom(this);
  };
  
  draw = () => {
    const { ctx } = this.tree;
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.point.x, this.point.y);
    ctx.scale(this.scale, this.scale);
    ctx.rotate(this.angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let i = 0; i < this.figure.length; i++) {
      const p = this.figure.get(i);
      ctx.lineTo(p.x, -p.y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  
  // Jump animation: fall down from top
  jump = () => {
    if (!this.place || !this.speed) return;
    if (this.point.x < -20 || this.point.y > this.tree.height + 20) {
      this.tree.removeBloom(this);
    } else {
      this.draw();
      const { x, y } = this.place.sub(this.point).div(this.speed).add(this.point);
      this.point = { x, y };
      this.angle += 0.05;
      this.speed -= 1;
    }
  };
}

// ===========================
// UI Functions
// ===========================

const typewriter = async (el, speed = 75) => {
  el.style.display = "block";
  const str = el.innerHTML;
  let progress = 0;
  el.innerHTML = "";
  const timer = setInterval(() => {
    if (str.charAt(progress) === "<") progress = str.indexOf(">", progress) + 1;
    else progress++;
    el.innerHTML = `${str.substring(0, progress)}${progress & 1 ? "_" : ""}`;
    if (progress >= str.length) {
      clearInterval(timer);
      el.innerHTML = str;
    }
  }, speed);
};

const timeElapse = (date) => {
  const current = new Date();
  let seconds = (current - new Date(date)) / 1000;
  const days = Math.floor(seconds / (3600 * 24));
  seconds %= 3600 * 24;
  const hours = Math.floor(seconds / 3600).toString().padStart(2, "0");
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  seconds = Math.floor(seconds % 60).toString().padStart(2, "0");
  const cfg = CONFIG.time;
  document.getElementById("clock").innerHTML = `${cfg.prefix}<span class="digit">${days}</span> ${cfg.day} <span class="digit">${hours}</span> ${cfg.hour} <span class="digit">${minutes}</span> ${cfg.minute} <span class="digit">${seconds}</span> ${cfg.second}`;
};

const scaleContent = () => {
  const base = { w: 1100, h: 680 };
  const { innerWidth: w, innerHeight: h } = window;
  const scale = Math.min(w / base.w, h / base.h, 1);
  const newW = base.w * scale, newH = base.h * scale;
  Object.assign(document.body.style, {
    transform: `scale(${scale})`,
    transformOrigin: "top left",
    width: `${newW}px`,
    height: `${newH}px`,
    marginTop: `${(h - newH) / 2}px`,
    marginLeft: `${(w - newW) / 2}px`
  });
  return scale;
};

const initContent = () => {
  const letter = document.getElementById("letter");
  const { paragraph1, paragraph2, paragraph3 } = CONFIG.letter;
  letter.innerHTML = `
    ${paragraph1.map(line => `<p>${line}</p>`).join('')}
    <br>
    ${paragraph2.map(line => `<p>${line}</p>`).join('')}
    <br>
    ${paragraph3.map(line => `<p>${line}</p>`).join('')}
  `;
  const clockText = document.getElementById("clock-text");
  clockText.innerHTML = `<span class="name">${CONFIG.couple.name1}</span> ${CONFIG.couple.connector} <span class="name">${CONFIG.couple.name2}</span> ${CONFIG.couple.together}`;
};

// ===========================
// Animation Sequence Functions
// ===========================

const AnimationConfig = {
  SCALE_FACTOR: 0.95,        // Heart shrink factor per frame
  SEED_MOVE_SPEED: 2,        // Vertical speed of seed movement
  TREE_GROW_DELAY: 10,       // Delay between tree growth frames (ms)
  FLOWER_BLOOM_COUNT: 2,     // Number of flowers to bloom per frame
  FLOWER_BLOOM_DELAY: 10,    // Delay between flower bloom frames (ms)
  TREE_MOVE_TARGET_X: 500,   // Target X position for tree movement
  SNAPSHOT_LEFT_X: 240,      // Left snapshot X position
  SNAPSHOT_RIGHT_X: 500,     // Right snapshot X position
  SNAPSHOT_WIDTH: 610,       // Snapshot width
  BACKGROUND_FADE_DELAY: 300,// Background fade delay (ms)
  HEART_JUMP_DELAY: 25,      // Delay between heart jump frames (ms)
  TIME_UPDATE_DELAY: 1000    // Time display update interval (ms)
};

// Phase 1: Wait for user click on seed heart
async function waitForUserClick(seed, canvas, scaleFactor) {
  return new Promise((resolve) => {
    const clickHandler = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scaleFactor;
      const y = (e.clientY - rect.top) / scaleFactor;
      if (seed.hover(x, y)) {
        document.getElementById("bgm").play();
        canvas.removeEventListener("click", clickHandler);
        resolve();
      }
    };
    canvas.addEventListener("click", clickHandler);
  });
}

// Phase 2: Shrink seed heart
async function animateSeedShrink(seed) {
  while (seed.canScale()) {
    seed.scale(AnimationConfig.SCALE_FACTOR);
    await sleep(AnimationConfig.TREE_GROW_DELAY);
  }
}

// Phase 3: Move seed down
async function animateSeedMove(seed, footer) {
  while (seed.canMove()) {
    seed.move(0, AnimationConfig.SEED_MOVE_SPEED);
    footer.draw();
    await sleep(AnimationConfig.TREE_GROW_DELAY);
  }
}

// Phase 4: Grow tree branches
async function animateTreeGrow(tree) {
  while (tree.canGrow()) {
    tree.grow();
    await sleep(AnimationConfig.TREE_GROW_DELAY);
  }
}

// Phase 5: Bloom flowers on tree
async function animateFlowerBloom(tree) {
  while (tree.canFlower()) {
    tree.flower(AnimationConfig.FLOWER_BLOOM_COUNT);
    await sleep(AnimationConfig.FLOWER_BLOOM_DELAY);
  }
}

// Phase 6: Move tree to the right
async function animateTreeMove(tree, footer) {
  tree.snapshot("p1", AnimationConfig.SNAPSHOT_LEFT_X, 0, AnimationConfig.SNAPSHOT_WIDTH, tree.height);
  while (tree.move("p1", AnimationConfig.TREE_MOVE_TARGET_X, 0)) {
    footer.draw();
    await sleep(AnimationConfig.TREE_GROW_DELAY);
  }
  footer.draw();
  tree.snapshot("p2", AnimationConfig.SNAPSHOT_RIGHT_X, 0, AnimationConfig.SNAPSHOT_WIDTH, tree.height);
}

// Phase 7: Set background and prepare for continuous animation
async function prepareBackground(tree, canvas) {
  canvas.parentNode.style.background = `url(${tree.toDataURL("image/png")})`;
  canvas.style.background = "#ffe";
  await sleep(AnimationConfig.BACKGROUND_FADE_DELAY);
  canvas.style.background = "none";
}

// Phase 8: Show love letter and start time counter
function showLoveLetterAndTime() {
  const memorial = new Date(CONFIG.memorialDate);
  typewriter(document.getElementById("letter"));
  document.getElementById("clock-box").style.opacity = 1;
  return memorial;
}

// Phase 9: Continuous heart jumping animation
function startHeartJumpAnimation(tree) {
  const jumpAnimate = async () => {
    tree.ctx.clearRect(0, 0, tree.width, tree.height);
    tree.draw("p2");  // Redraw tree from snapshot
    tree.jump();      // Animate falling hearts
    tree.footer.draw();
    await sleep(AnimationConfig.HEART_JUMP_DELAY);
    requestAnimationFrame(jumpAnimate);
  };
  jumpAnimate();
}

// Phase 10: Continuous time update
function startTimeUpdate(memorial) {
  const timeAnimate = async () => {
    timeElapse(memorial);
    await sleep(AnimationConfig.TIME_UPDATE_DELAY);
    requestAnimationFrame(timeAnimate);
  };
  timeAnimate();
}

// ===========================
// Main Initialization
// ===========================

document.addEventListener("DOMContentLoaded", async () => {
  // Initialize content from config
  initContent();
  
  // Setup canvas
  const canvas = document.getElementById("canvas");
  const w = canvas.offsetWidth, h = canvas.offsetHeight;
  canvas.width = w;
  canvas.height = h;
  
  // Tree configuration
  const opts = {
    seed: { x: w / 2 - 20, color: "rgb(190, 26, 37)", scale: 2 },
    branch: [[535, 680, 570, 250, 500, 200, 30, 100, [
      [540, 500, 455, 417, 340, 400, 13, 100, [[450, 435, 434, 430, 394, 395, 2, 40]]],
      [550, 445, 600, 356, 680, 345, 12, 100, [[578, 400, 648, 409, 661, 426, 3, 80]]],
      [539, 281, 537, 248, 534, 217, 3, 40],
      [546, 397, 413, 247, 328, 244, 9, 80, [[427, 286, 383, 253, 371, 205, 2, 40], [498, 345, 435, 315, 395, 330, 4, 60]]],
      [546, 357, 608, 252, 678, 221, 6, 100, [[590, 293, 646, 277, 648, 271, 2, 80]]]
    ]]],
    bloom: { num: 700, width: 1080, height: 650 },
    footer: { width: 1200, height: 5, speed: 10 }
  };
  
  // Initialize tree and components
  const tree = new Tree(canvas, w, h, opts);
  const { seed, footer } = tree;
  
  // Setup responsive scaling
  let scaleFactor = scaleContent();
  window.addEventListener("resize", () => { scaleFactor = scaleContent(); });
  
  // ===========================
  // Animation Sequence
  // ===========================
  
  // Draw initial seed heart
  seed.draw();
  
  // Phase 1: Wait for user to click the heart
  await waitForUserClick(seed, canvas, scaleFactor);
  
  // Phase 2: Shrink the seed heart
  await animateSeedShrink(seed);
  
  // Phase 3: Move seed down to ground
  await animateSeedMove(seed, footer);
  
  // Phase 4: Grow tree from seed
  await animateTreeGrow(tree);
  
  // Phase 5: Bloom flowers on the tree
  await animateFlowerBloom(tree);
  
  // Phase 6: Move tree to the right side
  await animateTreeMove(tree, footer);
  
  // Phase 7: Prepare background for continuous animation
  await prepareBackground(tree, canvas);
  
  // Phase 8: Show love letter with typewriter effect and time counter
  const memorial = showLoveLetterAndTime();
  
  // Phase 9 & 10: Start continuous animations
  startHeartJumpAnimation(tree);
  startTimeUpdate(memorial);
});
