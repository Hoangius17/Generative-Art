let ripples = [];
let particles = [];
let dust = [];
let angle = 0;

let orbitRadius;
let maxDiameter;
let centerRotationSpeed = 0.005;

// Sounds
let bubblesMove, ambientSound, interactionSound, heartbeatSound, buttonSound;
let factory_sound_1, factory_sound_2, factory_sound_3, bassSound;

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
  factory_sound_1 = loadSound("factory_sound_1.wav");
  factory_sound_2 = loadSound("factory_sound_2.wav");
  factory_sound_3 = loadSound("factory_sound_3.wav");
  bassSound = loadSound("bass.wav");
}

function setup() {
  pixelDensity(1);

  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent("canvas-section");

  angleMode(RADIANS);
  textFont("Arial");
  calculateDimensions();

  // Create Orbiting Bubbles
  for (let i = 0; i < 120; i++) {
    particles.push(new OrbitingBubble());
  }
  
  for (let i = 0; i < 150; i++) {
    dust.push(new SpaceDust());
  }

  factory_sound_1.setVolume(0.2);
  factory_sound_2.setVolume(0.1);
  factory_sound_3.setVolume(0.2);
  bassSound.setVolume(0.3);
  factory_sound_1.loop();
  factory_sound_2.loop();
  factory_sound_3.loop();
  bassSound.loop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  calculateDimensions();
}

function calculateDimensions() {
  maxDiameter = sqrt(sq(width) + sq(height));
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
  
  // Dark background with trails
  background(0, 80);

  push();

  translate(width / 2, height / 2);

  drawConcentricTracks();

  // Draw Dust
  noStroke();
  for (let d of dust) {
    d.update();
    d.display();
  }

  // --- DRAW CENTER & LINES ---
  push();
  // Red Glow
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = color(255, 0, 0, 150 + flashIntensity);
  drawCenterHub();
  drawRadarLines();
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
  let targetSpeed = mouseIsPressed && mouseY > 100 ? 0.03 : 0.005;
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
    if (this.pos.mag() > maxDiameter / 2) this.pos.mult(-0.9);
  }
  display() {
    fill(255, this.alpha);
    circle(this.pos.x, this.pos.y, this.size);
  }
}

function drawRadarLines() {
  let numLines = 12; // Fewer, thicker lines for "Factory" look
  let r = 255;
  let g = constrain(255 - flashIntensity * 2, 0, 255);
  let b = constrain(255 - flashIntensity * 2, 0, 255);

  let breathe = sin(frameCount * 0.05) * 15;
  
  for (let i = 0; i < numLines; i++) {
    // Rotating lines
    let currentAngle = angle + (TWO_PI / numLines) * i;
    
    // Varying lengths
    let lenMod = (i % 2 === 0) ? 1.0 : 0.7;
    let localLen = (orbitRadius + 20 + breathe) * lenMod;

    let xStart = cos(currentAngle) * 50;
    let yStart = sin(currentAngle) * 50;
    let xEnd = cos(currentAngle) * localLen;
    let yEnd = sin(currentAngle) * localLen;

    stroke(r, g, b, 150);
    strokeWeight(1.5);
    line(xStart, yStart, xEnd, yEnd);

    // End caps
    noStroke();
    fill(r, 0, 0, 200);
    circle(xEnd, yEnd, 5);
  }
}

function drawCenterHub() {
  let centerCol = color(255, 255 - flashIntensity, 255 - flashIntensity);

  noFill();
  stroke(centerCol, 200);
  strokeWeight(2);
  
  // Pulsing rings
  let pulse = sin(frameCount * 0.1) * 5;
  circle(0, 0, 100 + pulse);
  circle(0, 0, 80 - pulse);

  stroke(255, 0, 0, 150);
  strokeWeight(4);
  circle(0, 0, 50);

  noStroke();
  fill(255, 0, 0, 200 + flashIntensity);
  circle(0, 0, 20);
}

class OrbitingBubble {
  constructor() {
    this.angle = random(TWO_PI);
    this.dist = random(120, maxDiameter/1.5);
    this.speed = random(0.002, 0.008) * (random() > 0.5 ? 1 : -1);
    this.size = random(4, 15);
    this.baseAlpha = random(50, 200);
    this.hitTimer = 0;
    
    // Position vector for collision math
    this.pos = createVector(0,0);
    this.updatePos();
  }

  updatePos() {
    this.pos.x = cos(this.angle) * this.dist;
    this.pos.y = sin(this.angle) * this.dist;
  }

  update() {
    this.angle += this.speed;
    
    // Slight oscillation in distance
    this.dist += sin(frameCount * 0.01 + this.angle) * 0.5;
    
    this.updatePos();
    if (this.hitTimer > 0) this.hitTimer -= 2;
  }

  checkRippleCollision(ripplesArr) {
    if (ripplesArr.length === 0) return;
    let dFromCenter = this.dist; 

    for (let r of ripplesArr) {
      if (abs(dFromCenter - r.radius) < this.size / 2 + r.w + 5) {
        this.hitTimer = 90;
      }
    }
  }

  display() {

    if (this.hitTimer > 0) {
      stroke(255, 0, 0, this.hitTimer * 2); // Fade out line
      strokeWeight(1);
      line(0, 0, this.pos.x, this.pos.y);
      
      fill(255, 0, 0);
      noStroke();
      // Bubble expands when hit
      circle(this.pos.x, this.pos.y, this.size * 2); 
    } else {
      fill(255, this.baseAlpha);
      noStroke();
      circle(this.pos.x, this.pos.y, this.size);
    }
  }
}

function manageRipples() {
  let spawnRate = 60;
  let speed = 8;
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

function drawConcentricTracks() {
  noFill();
  strokeWeight(1);
  stroke(255, 20); // Very faint
  
  let scaleFactor = orbitRadius / 300; 
  
  // Draw static orbital tracks to emphasize the circular motion
  for (let layer = 1; layer <= 6; layer++) {
    let radius = (layer * 60 + 50) * scaleFactor;
    // Dashed lines manually
    for(let a = 0; a < TWO_PI; a+=0.1) {
        if(floor(a * 10) % 2 == 0) {
            arc(0,0, radius*2, radius*2, a, a+0.05);
        }
    }
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
    
    // Double Ring Effect for "Difference"
    stroke(255, this.a * 0.5);
    circle(0, 0, this.d - 20);
  }
  isFinished() {
    return this.a <= 0;
  }
}

// ==========================================
//             UI LOGIC (UNCHANGED)
// ==========================================

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
      "- Particles now ORBIT the center.\n- Hit particles connect to center.",
      tooltipX + 10,
      tooltipY + 30
    );
  }
  pop();
}
