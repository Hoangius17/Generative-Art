let ripples = [];
let particles = [];
let angle = 0;
let orbitRadius; // Removed hardcoded 300
let maxDiameter;

// Sounds
let bubblesMove;
let ambientSound;
let interactionSound;
let heartbeatSound;
let buttonSound;

// UI State
let isMuted = false;

// Buttons
const btnSize = 40;
const btnY = 20; 
const btnSoundX = 20; 
const btnInfoX = 70; 

// SOUNDS PRELOAD
function preload() {
  // Ensure your file paths are correct relative to index.html
  bubblesMove = loadSound("./bubbles_edited.wav");
  ambientSound = loadSound("./ambient_mixing_sound.wav");
  interactionSound = loadSound("./interaction_sound_2_edited.wav");
  heartbeatSound = loadSound("./heartbeat_edited.wav");
  buttonSound = loadSound("./interaction_edited.wav");
}

function setup() {
  // 1. Create canvas based on window size
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent("canvas-section");
  angleMode(RADIANS);
  pixelDensity(1);
  textFont("Arial");
  
  // 2. Calculate sizes initially
  calculateDimensions();
}

function windowResized() {
  // 3. Resize canvas and recalculate sizes when window changes
  resizeCanvas(windowWidth, windowHeight);
  calculateDimensions();
}

function calculateDimensions() {
  maxDiameter = sqrt(sq(width) + sq(height));
  // Responsive orbit radius: approx 30% of the smaller screen dimension
  orbitRadius = min(width, height) * 0.3; 
}

function mousePressed() {
  userStartAudio(); 

  // ... (Keep existing mousePressed logic unchanged) ...
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
  ) {
    return;
  }

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

let flashIntensity = 0;

function draw() {
 
  if (frameCount % 60 === 0 && heartbeatSound?.isLoaded() && !isMuted) {
    heartbeatSound.play();
    heartbeatSound.setVolume(0.8);
  }

  background(0, 90);

  push();
  translate(width / 2, height / 2);

  drawOrbitTracks();
  drawCenterHub();
  manageRipples(); 

  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].display();
    if (particles[i].isFinished()) {
      particles.splice(i, 1);
    }
  }

  drawFixedCircles();

  if (flashIntensity > 0) flashIntensity -= 5;
  flashIntensity = constrain(flashIntensity, 0, 255);

  angle += 0.01;
  pop();

  drawUI();
}

// ... (Keep existing drawUI function unchanged) ...
function drawUI() {
    push();
    noStroke();
    let isHoverSound =
      mouseX > btnSoundX &&
      mouseX < btnSoundX + btnSize &&
      mouseY > btnY &&
      mouseY < btnY + btnSize;
    fill(isHoverSound ? 100 : 50, 200); 
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
    fill(isHoverInfo ? 100 : 50, 200);
    rect(btnInfoX, btnY, btnSize, btnSize, 8);
  
  
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(20);
    textStyle(BOLD);
    text("i", btnInfoX + btnSize / 2, btnY + btnSize / 2);
  
   
    if (isHoverInfo) {
      let tooltipX = mouseX + 15; 
      let tooltipY = mouseY + 15;
      
      // Responsive tooltip check: if too close to right edge, draw to the left
      if (tooltipX + 220 > width) {
          tooltipX = mouseX - 235;
      }

      let boxW = 220;
      let boxH = 90;
  
      fill(0, 220);
      stroke(255, 100);
      strokeWeight(1);
      rect(tooltipX, tooltipY, boxW, boxH, 5);
  
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
        "- Click and Hold the mouse: create ripples.",
        tooltipX + 10,
        tooltipY + 30
      );
    }
  
    pop();
  }

// ... (Keep existing Particle and Ripple classes unchanged) ...
// ... (Keep createExplosion unchanged) ...
function createExplosion(x, y) {
    let numParticles = 12;
    for (let i = 0; i < numParticles; i++) {
      particles.push(new Particle(x, y));
    }
  }
  
  // Class
  class Particle {
    constructor(x, y) {
      this.pos = createVector(x, y);
      this.vel = p5.Vector.random2D().mult(random(3, 7));
      this.lifespan = 255;
      this.size = random(5, 9);
      this.drag = 0.95;
    }
  
    update() {
      this.vel.mult(this.drag);
      this.pos.add(this.vel);
      this.lifespan -= 3;
    }
  
    display() {
      push();
      noStroke();
      fill(220, 30, 40, this.lifespan);
      circle(this.pos.x, this.pos.y, this.size);
      pop();
    }
  
    isFinished() {
      return this.lifespan < 0;
    }
  }
  class Ripple {
    constructor(s) {
      this.d = 0;
      this.s = s;
      this.w = s > 10 ? 5 : 2;
      this.hasHit = false;
      this.a = 255;
    }
    update() {
      this.d += this.s;
      this.a = map(this.d, orbitRadius, maxDiameter * 1.1, 255, 0, true);
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

function drawFixedCircles() {
  let numCircles = 5;
  let r = constrain(220 + flashIntensity, 0, 255);
  let g = constrain(30 + flashIntensity, 0, 200);
  let b = constrain(40 + flashIntensity, 0, 200);

  noFill();
  stroke(r, g, b);
  strokeWeight(4);
  circle(0, 0, orbitRadius * 2);

  for (let i = 0; i < numCircles; i++) {
    let currentAngle = angle + (TWO_PI / numCircles) * i;
    let x = cos(currentAngle) * orbitRadius;
    let y = sin(currentAngle) * orbitRadius;
    
    // Scale extension lines relative to orbitRadius
    let xExt = cos(currentAngle) * (orbitRadius + (orbitRadius * 0.5)); 
    let yExt = sin(currentAngle) * (orbitRadius + (orbitRadius * 0.5));

    stroke(255, 180 + flashIntensity);
    strokeWeight(4);
    line(0, 0, xExt, yExt);

    noFill();
    stroke(r, g, b);
    strokeWeight(3);
    // Scale the outer circles relative to orbitRadius
    circle(x, y, orbitRadius * 0.66); 

    noFill();
    stroke(255);
    strokeWeight(2);
    circle(x, y, 12);
  }
}

// ... (Keep manageRipples logic almost same, ensure hit detection uses new orbitRadius) ...
function manageRipples() {
    let spawnRate = 60;
    let speed = 10;
  
   
    let isHoverUI = mouseX < 150 && mouseY < 100;
  
    if (mouseIsPressed && !isHoverUI) {
      spawnRate = 15;
      speed = 10;
    }
  
    if (frameCount % spawnRate === 0) ripples.push(new Ripple(speed));
  
    for (let i = ripples.length - 1; i >= 0; i--) {
      let rip = ripples[i];
      rip.update();
      rip.display();
  
      if (!rip.hasHit && rip.d / 2 >= orbitRadius) {
        flashIntensity = 150;
        rip.hasHit = true;
        let numCircles = 5;
        for (let j = 0; j < numCircles; j++) {
          let pAngle = angle + (TWO_PI / numCircles) * j;
          let px = cos(pAngle) * orbitRadius;
          let py = sin(pAngle) * orbitRadius;
          createExplosion(px, py);
        }
      }
      if (rip.isFinished()) ripples.splice(i, 1);
    }
  }

function drawOrbitTracks() {
  noFill();
  strokeWeight(1);
  stroke(255, 30);
  for (let layer = 1; layer <= 10; layer++) {
    // Make tracks relative to orbitRadius
    circle(0, 0, (layer * (orbitRadius/10) + 20) * 2);
  }
}

// ... (Keep drawCenterHub unchanged) ...
function drawCenterHub() {
    noFill();
    stroke(255);
    strokeWeight(1);
    circle(0, 0, 10);
    stroke(255, 100);
    circle(0, 0, 40);
    push();
    rotate(-angle * 2);
    for (let i = 0; i < 8; i++) {
      rotate(TWO_PI / 8);
      line(10, 0, 15, 0);
    }
    pop();
  }