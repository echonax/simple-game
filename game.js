// Game Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 800;

// Variables
let player = {
  x: canvas.width / 2,
  y: canvas.height - 50,
  width: 20,
  height: 20,
  speed: 3,
  bullets: [],
  playersCount: 1,
};
let enemies = [];
let powerUps = [];
let currentWave = 0;
let currentLevel = 1;
let points = 0;
let isGameOver = false;
let shootingSpeed = 100;
let isCountdown = false;
let countdownTime = 3;
const maxWavesPerLevel = 3;
const levelUpPoints = 1000;
let boss = null;

// Local Storage
const storedLevel = localStorage.getItem('level');
const storedPoints = localStorage.getItem('points');
if (storedLevel) currentLevel = parseInt(storedLevel);
if (storedPoints) points = parseInt(storedPoints);

// Game Functions
function drawPlayer() {
  ctx.fillStyle = 'blue';
  for (let i = 0; i < player.playersCount; i++) {
    ctx.fillRect(player.x - i * 30, player.y, player.width, player.height);
  }
}

function drawBullet(bullet) {
  ctx.fillStyle = 'white';
  ctx.fillRect(bullet.x, bullet.y, 5, 10);
}

function drawEnemy(enemy) {
  ctx.fillStyle = 'red';
  ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
}

function drawBoss() {
  if (boss) {
    ctx.fillStyle = 'darkred';
    ctx.fillRect(boss.x, boss.y, boss.width, boss.height);

    // Display boss health
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('Boss HP: ' + boss.health, boss.x + 10, boss.y - 10);
  }
}

function drawPowerUp(powerUp) {
  ctx.fillStyle = powerUp.type === 'add' ? 'green' : 'purple';
  ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);

  // Add text to the power-ups to display their effects
  ctx.fillStyle = 'white';
  ctx.font = '14px Arial';
  const text = powerUp.type === 'add' ? '+2 Players' : 'x2 Players';
  ctx.fillText(text, powerUp.x + 10, powerUp.y + 15);
}

// Update the score display
function updateScore() {
  document.getElementById('score').innerText = 'Score: ' + points;
}

function shoot() {
  // Each player fires a bullet
  for (let i = 0; i < player.playersCount; i++) {
    player.bullets.push({
      x: player.x - i * 30 + player.width / 2 - 2.5,
      y: player.y - 5,
    });
  }
}

function moveBullets() {
  player.bullets.forEach((bullet, index) => {
    bullet.y -= 5;
    if (bullet.y < 0) player.bullets.splice(index, 1);
  });
}

function createEnemies(waveSize = 25) {
  enemies = [];
  for (let i = 0; i < waveSize; i++) {
    enemies.push({
      x: 5 + i * 20, // Horizontally aligned with small gaps
      y: -50,
      width: 10,
      height: 10,
      speed: 0.5, // Enemies get faster each level  + currentLevel * 0.2
    });
  }
}

function createBoss() {
  boss = {
    x: canvas.width / 3,
    y: -100,
    width: 100,
    height: 50,
    speed: 0.5,
    health: 10 + currentLevel * 25, // Increase boss health based on level
  };
}

function createPowerUps() {
  powerUps.push({
    x: 0,
    y: -50,
    width: 400, // Wider power-ups
    height: 20,
    type: 'add',
  });
  powerUps.push({
    x: canvas.width / 2,
    y: -50,
    width: 400, // Wider power-ups
    height: 20,
    type: 'multiply',
  });
}

function checkEnemyCollision() {
  player.bullets.forEach((bullet, bulletIndex) => {
    enemies.forEach((enemy, enemyIndex) => {
      if (
        bullet.y < enemy.y + enemy.height &&
        bullet.x > enemy.x &&
        bullet.x < enemy.x + enemy.width
      ) {
        enemies.splice(enemyIndex, 1);
        player.bullets.splice(bulletIndex, 1);
        points += 100; // Update points when enemy is killed
        updateScore();
      }
    });
  });
}

function checkBossCollision() {
  player.bullets.forEach((bullet, bulletIndex) => {
    if (
      boss &&
      bullet.y < boss.y + boss.height &&
      bullet.x > boss.x &&
      bullet.x < boss.x + boss.width
    ) {
      boss.health--;
      player.bullets.splice(bulletIndex, 1);
      if (boss.health <= 0) {
        boss = null;
        points += 1000; // Bonus points for defeating boss
        updateScore();
        countdownToNextLevel(); // Move to next level after boss is defeated
      }
    }
  });
}

function checkPowerUpCollision() {
  powerUps.forEach((powerUp, index) => {
    if (
      powerUp.y + powerUp.height > player.y &&
      powerUp.x < player.x + player.width &&
      powerUp.x + powerUp.width > player.x
    ) {
      if (powerUp.type === 'add') {
        player.playersCount += 2;
      } else if (powerUp.type === 'multiply') {
        player.playersCount *= 2;
      }
      powerUps.splice(index, 1);
    }
  });
}

function nextWave() {
  currentWave++;
  if (currentWave > maxWavesPerLevel) {
    createBoss(); // Create boss at the end of the level
  } else {
    createEnemies(6 + currentWave * 2 + currentLevel); // Increase enemies per wave and level
  }
}

function levelUp() {
  currentLevel++;
  points += levelUpPoints;
  updateScore();
  saveProgress();
  currentWave = 0; // Reset wave for the new level
  createEnemies(6 + currentWave * 2); // Create the first wave of the new level
}

function countdownToNextLevel() {
  isCountdown = true;
  countdownTime = 3; // Reset countdown time
  const countdownInterval = setInterval(() => {
    countdownTime--;
    document.getElementById('countdown').innerText = countdownTime;
    if (countdownTime <= 0) {
      clearInterval(countdownInterval);
      document.getElementById('countdown').innerText = '';
      isCountdown = false;
      levelUp(); // Move to the next level after countdown
    }
  }, 1000);
}

function saveProgress() {
  localStorage.setItem('level', currentLevel);
  localStorage.setItem('points', points);
}

function gameOver() {
  isGameOver = true;
  ctx.font = '30px Arial';
  ctx.fillStyle = 'white';
  ctx.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2);
  localStorage.clear();
}

// Shooting Interval
setInterval(() => {
  if (!isCountdown) shoot();
}, shootingSpeed);

// Update player movement in game loop
function movePlayer() {
  if (moveLeft && player.x > 0) player.x -= player.speed;
  if (moveRight && player.x < canvas.width - player.width)
    player.x += player.speed;
}

// Move Functions
function moveEnemies() {
  enemies.forEach((enemy, index) => {
    enemy.y += enemy.speed;
    if (enemy.y > canvas.height - 150) {
      enemy.x += player.x > enemy.x ? 1 : -1;
    }
    if (
      enemy.y + enemy.height > player.y &&
      enemy.x < player.x + player.width &&
      enemy.x + enemy.width > player.x
    ) {
      gameOver();
    }
  });
}

function moveBoss() {
  if (boss) {
    boss.y += boss.speed;
    if (boss.y > canvas.height - 150) {
      boss.x += player.x > boss.x ? 1 : -1;
    }
    if (
      boss.y + boss.height > player.y &&
      boss.x < player.x + player.width &&
      boss.x + boss.width > player.x
    ) {
      gameOver();
    }
  }
}

function movePowerUps() {
  powerUps.forEach((powerUp, index) => {
    powerUp.y += 2;
    if (powerUp.y > canvas.height) powerUps.splice(index, 1);
  });
}

function gameLoop() {
  if (!isGameOver) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPlayer();
    player.bullets.forEach(drawBullet);
    enemies.forEach(drawEnemy);
    powerUps.forEach(drawPowerUp);
    if (boss) drawBoss();

    movePlayer();
    moveBullets();
    moveEnemies();
    movePowerUps();
    moveBoss();

    checkEnemyCollision();
    checkBossCollision();
    checkPowerUpCollision();

    if (enemies.length === 0 && !boss && !isCountdown) {
      if (currentWave <= maxWavesPerLevel) {
        nextWave();
      }
    }

    requestAnimationFrame(gameLoop);
  }
}

let moveLeft = false;
let moveRight = false;

// Player Controls - Start movement
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') moveLeft = true;
  if (e.key === 'ArrowRight') moveRight = true;
});

// Player Controls - Stop movement
document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft') moveLeft = false;
  if (e.key === 'ArrowRight') moveRight = false;
});

createEnemies();
createPowerUps();
gameLoop();
