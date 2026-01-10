let ripples = [];
let particles = [];
let dust = [];
let angle = 0;
// orbitRadius is now calculated dynamically in setup/windowResized
let orbitRadius; 
let maxDiameter;
let centerRotationSpeed = 0.005;

// Sounds
let bubblesMove, ambientSound, interactionSound, heartbeatSound, buttonSound;

// UI State
let isMuted = false;
const btnSize = 40,
  btnY = 20,
  btnSoundX = 20,
  btnInfoX = 70;
let flashIntensity = 0;

function preload() {
  bubblesMove = loadSound("bubbles_edited.wav");
  ambientSound = loadSound("ambient_mixing_sound.wav");
  interactionSound = loadSound("interaction_sound_2_edited.wav");
  heartbeatSound = loadSound("heartbeat_edited.wav");
  buttonSound = loadSound("interaction_edited.wav");
}

function setup() {
  // --- OPTIMIZATION 1: GPU LOAD ---
  pixelDensity(1);
  
  // Create canvas attached to the specific HTML section
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent("canvas-section");

  angleMode(RADIANS);
  textFont("Arial");

  // Calculate dimensions based on initial window size
  calculateDimensions();

  // INIT PARTICLES
  for (let i = 0; i < 120; i++) {
    particles.push(new FloatingBubble());
  }
  // INIT DUST
  for (let i = 0; i < 150; i++) {
    dust.push(new SpaceDust());
  }
}

// --- NEW FUNCTION: HANDLES RESIZING ---
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  calculateDimensions();
}

// --- NEW FUNCTION: CENTRALIZES SIZE LOGIC ---
function calculateDimensions() {
  maxDiameter = sqrt(sq(width) + sq(height));
  
  // Make the orbit responsive:
  // On Desktop (e.g. 1920x1080): 1080 * 0.3 = 324 (close to your original 300)
  // On Mobile (e.g. 375x667): 375 * 0.35 = ~131 (fits nicely on screen)
  // We clamp it so it doesn't get too small or too massive
  let minDim = min(width, height);
  orbitRadius = constrain(minDim * 0.35, 120, 350); 
}

function mousePressed() {
  userStartAudio();
  handleUIInteraction();
}

function draw() {
  if (frameCount % 60 === 0 && heartbeatSound?.isLoaded() && !isMuted) {
    heartbeatSound.play();
    heartbeatSound.setVolume(0.8);
  }

  // Clear background with trail effect
  background(0, 100);

  push();
  // Always translate to the current center of the window
  translate(width / 2, height / 2);

  drawOrbitTracks();

  // Draw Dust
  noStroke();
  for (let d of dust) {
    d.update();
    d.display();
  }

  // --- DRAW CENTER & LINES ---
  push();
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = color(255, 0, 0, 150 + flashIntensity);
  drawCenterHub();
  drawDynamicLines();
  pop();

  manageRipples();

  // --- UPDATE PARTICLES ---
  for (let p of particles) {
    p.checkRippleCollision(ripples);
    p.update();
    p.display();
  }

  if (flashIntensity > 0) flashIntensity -= 8;
  flashIntensity = constrain(flashIntensity, 0, 255);

  angle += centerRotationSpeed;

  // Rotation speed logic
  // Check if mouse is in the bottom area (avoiding UI top area)
  let targetSpeed = mouseIsPressed && mouseY > 100 ? 0.02 : 0.005;
  centerRotationSpeed = lerp(centerRotationSpeed, targetSpeed, 0.1);

  pop();
  drawUI();
}

// ==========================================
//             CLASSES & FUNCTIONS
// ==========================================

class SpaceDust {
  constructor() {
    this.pos = p5.Vector.random2D().mult(random(maxDiameter / 2));
    this.vel = p5.Vector.random2D().mult(random(0.1, 0.3));
    this.size = random(1, 2);
    this.alpha = random(50, 150);
  }
  update() {
    this.pos.add(this.vel);
    // Boundary check using responsive maxDiameter
    if (this.pos.mag() > maxDiameter / 2) this.pos.mult(-0.9);
  }
  display() {
    fill(255, this.alpha);
    circle(this.pos.x, this.pos.y, this.size);
  }
}

function drawDynamicLines() {
  let numLines = 24;

  let r = 255;
  let g = constrain(255 - flashIntensity * 2, 0, 255);
  let b = constrain(255 - flashIntensity * 2, 0, 255);

  noFill();
  stroke(r, g, b, 100);
  strokeWeight(2);
  // Uses dynamic orbitRadius
  circle(0, 0, orbitRadius * 2);

  let breathe = sin(frameCount * 0.05) * 20;
  // Dynamic length based on responsive orbitRadius
  let currentLen = orbitRadius + 40 + breathe + flashIntensity * 0.2;
  let twoPiDivNum = TWO_PI / numLines;

  for (let i = 0; i < numLines; i++) {
    let currentAngle = angle + twoPiDivNum * i;
    let breatheLocal = sin(frameCount * 0.05 + i) * 20;
    
    // Calculate length relative to responsive orbitRadius
    let localLen = orbitRadius + 40 + breatheLocal + flashIntensity * 0.2;

    let ca = cos(currentAngle);
    let sa = sin(currentAngle);

    // Start slightly outside the center hub (fixed 60 is fine as hub is fixed size)
    let xStart = ca * 60;
    let xEnd = ca * localLen;
    let yStart = sa * 60;
    let yEnd = sa * localLen;

    stroke(r, g, b, 200);
    strokeWeight(2);
    line(xStart, yStart, xEnd, yEnd);

    noStroke();
    fill(r, g, b, 255);
    circle(xEnd, yEnd, 4);
  }
}

function drawCenterHub() {
  let centerCol = color(255, 255 - flashIntensity, 255 - flashIntensity);

  noFill();
  stroke(centerCol, 200);
  strokeWeight(2);
  circle(0, 0, 110);

  stroke(centerCol, 150);
  strokeWeight(5);
  circle(0, 0, 50);

  noStroke();
  fill(255, 0, 0, 200 + flashIntensity);
  circle(0, 0, 15);
}

class FloatingBubble {
  constructor() {
    let ang = random(TWO_PI);
    // Ensure bubbles spawn within screen limits
    let spawnLimit = maxDiameter / 1.6;
    let rad = random(120, spawnLimit);
    this.pos = createVector(cos(ang) * rad, sin(ang) * rad);
    this.vel = p5.Vector.random2D().mult(random(0.2, 0.8));
    this.size = random(5, 20);
    this.baseAlpha = random(50, 200);
    this.hitTimer = 0;
  }

  update() {
    this.pos.add(this.vel);

    // RESPONSIVE BOUNDARY (BOUNCE)
    // Updates automatically as width/height changes
    let halfW = width * 0.5 - this.size;
    let halfH = height * 0.5 - this.size;

    if (this.pos.x > halfW) {
      this.pos.x = halfW;
      this.vel.x *= -1;
    } else if (this.pos.x < -halfW) {
      this.pos.x = -halfW;
      this.vel.x *= -1;
    }

    if (this.pos.y > halfH) {
      this.pos.y = halfH;
      this.vel.y *= -1;
    } else if (this.pos.y < -halfH) {
      this.pos.y = -halfH;
      this.vel.y *= -1;
    }

    if (this.hitTimer > 0) this.hitTimer -= 2;
  }

  checkRippleCollision(ripplesArr) {
    if (ripplesArr.length === 0) return;

    let dFromCenter = this.pos.mag();

    for (let r of ripplesArr) {
      let rippleRadius = r.radius;
      if (abs(dFromCenter - rippleRadius) < this.size / 2 + r.w + 5) {
        this.hitTimer = 90;
      }
    }
  }

  display() {
    if (this.hitTimer > 0) {
      fill(255, 0, 0, 100);
      circle(this.pos.x, this.pos.y, this.size * 2);
      fill(255, 0, 0);
    } else {
      fill(255, this.baseAlpha);
    }
    noStroke();
    circle(this.pos.x, this.pos.y, this.size);
  }
}

function manageRipples() {
  let spawnRate = 60;
  let speed = 8;
  // UI Hover check
  let isHoverUI = mouseX < 150 && mouseY < 100;

  if (mouseIsPressed && !isHoverUI) {
    spawnRate = 12;
    speed = 12;
  }
  if (frameCount % spawnRate === 0) ripples.push(new Ripple(speed));

  for (let i = ripples.length - 1; i >= 0; i--) {
    let rip = ripples[i];
    rip.update();
    rip.display();

    // Trigger flash when ripple hits the orbit radius
    if (!rip.hasHit && rip.radius >= orbitRadius) {
      flashIntensity = 255;
      rip.hasHit = true;
    }
    if (rip.isFinished()) ripples.splice(i, 1);
  }
}

function drawOrbitTracks() {
  noFill();
  strokeWeight(1);
  stroke(255, 15);
  // Scale tracks based on orbitRadius logic to maintain proportions
  let scaleFactor = orbitRadius / 300; 
  
  for (let layer = 1; layer <= 8; layer++) {
    // Adjusted formulation to scale with the main orbit
    let radius = (layer * 45 + 50) * 3.5 * scaleFactor;
    circle(0, 0, radius);
  }
}

class Ripple {
  constructor(s) {
    this.d = 50;
    this.radius = 25;
    this.s = s;
    this.w = s > 10 ? 5 : 2;
    this.hasHit = false;
    this.a = 255;
  }
  update() {
    this.d += this.s;
    this.radius = this.d / 2;
    this.a = map(this.d, orbitRadius, maxDiameter * 0.9, 255, 0, true);
  }
  display() {
    noFill();
    stroke(255, this.a);
    strokeWeight(this.w);
    circle(0, 0, this.d);
  }
  isFinished() {
    return this.a <= 0;
  }
}

function handleUIInteraction() {
  if (
    mouseX > btnSoundX &&
    mouseX < btnSoundX + btnSize &&
    mouseY > btnY &&
    mouseY < btnY + btnSize
  ) {
    isMuted = !isMuted;
    buttonSound.play();
    buttonSound.setVolume(0.2);
    if (isMuted) {
      bubblesMove.setVolume(0);
      ambientSound.setVolume(0);
      interactionSound.setVolume(0);
      heartbeatSound.setVolume(0);
    } else {
      bubblesMove.setVolume(0.2);
      ambientSound.setVolume(0.08);
      interactionSound.setVolume(0.8);
      heartbeatSound.setVolume(0.8);
    }
    return;
  }
  if (
    mouseX > btnInfoX &&
    mouseX < btnInfoX + btnSize &&
    mouseY > btnY &&
    mouseY < btnY + btnSize
  )
    return;

  if (!isMuted) {
    if (bubblesMove?.isLoaded() && !bubblesMove.isPlaying()) {
      bubblesMove.setVolume(0.2);
      bubblesMove.loop();
    }
    if (ambientSound?.isLoaded() && !ambientSound.isPlaying()) {
      ambientSound.setVolume(0.08);
      ambientSound.loop();
    }
    if (interactionSound?.isLoaded()) {
      interactionSound.setVolume(0.8);
      interactionSound.play();
    }
  }
}

function drawUI() {
  push();
  noStroke();
  let isHoverSound =
    mouseX > btnSoundX &&
    mouseX < btnSoundX + btnSize &&
    mouseY > btnY &&
    mouseY < btnY + btnSize;
  fill(isHoverSound ? 80 : 40, 200);
  rect(btnSoundX, btnY, btnSize, btnSize, 8);
  fill(255);
  if (isMuted) {
    textAlign(CENTER, CENTER);
    textSize(10);
    text("MUTE", btnSoundX + btnSize / 2, btnY + btnSize / 2);
    stroke(255, 0, 0);
    strokeWeight(2);
    line(btnSoundX + 5, btnY + 5, btnSoundX + btnSize - 5, btnY + btnSize - 5);
  } else {
    noStroke();
    beginShape();
    vertex(btnSoundX + 10, btnY + 14);
    vertex(btnSoundX + 18, btnY + 14);
    vertex(btnSoundX + 28, btnY + 8);
    vertex(btnSoundX + 28, btnY + 32);
    vertex(btnSoundX + 18, btnY + 26);
    vertex(btnSoundX + 10, btnY + 26);
    endShape(CLOSE);
  }
  noStroke();
  let isHoverInfo =
    mouseX > btnInfoX &&
    mouseX < btnInfoX + btnSize &&
    mouseY > btnY &&
    mouseY < btnY + btnSize;
  fill(isHoverInfo ? 80 : 40, 200);
  rect(btnInfoX, btnY, btnSize, btnSize, 8);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(20);
  textStyle(BOLD);
  text("i", btnInfoX + btnSize / 2, btnY + btnSize / 2);

  if (isHoverInfo) {
    let tooltipX = mouseX + 15;
    let tooltipY = mouseY + 15;
    
    // Ensure tooltip doesn't go off screen on mobile
    if (tooltipX + 220 > width) {
        tooltipX = width - 230;
    }
    
    fill(20, 240);
    stroke(255, 100);
    strokeWeight(1);
    rect(tooltipX, tooltipY, 220, 90, 5);
    noStroke();
    fill(255);
    textAlign(LEFT, TOP);
    textSize(12);
    textStyle(NORMAL);
    text("GUIDELINE:", tooltipX + 10, tooltipY + 10);
    textSize(11);
    fill(200);
    textLeading(18);
    text(
      "- Click and Hold: create ripples.\n- Ripples hit particles -> RED.",
      tooltipX + 10,
      tooltipY + 30
    );
  }
  pop();
}
