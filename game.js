const config = {
  type: Phaser.AUTO,
  width: 480,
  height: 640,
  parent: 'gameContainer',
  backgroundColor: '#1377ac', // sea blue
  physics: { default: 'arcade' },
  scene: { preload, create, update }
};

let game = new Phaser.Game(config);

let player, rains, score = 0, scoreText, speedMultiplier = 1;
let cursors;
let gameState = 'home'; // home, play, pause, gameover
let username = '';
let leaderboard = [];

// ---------------- Preload ----------------
function preload() {
  this.load.image('player', 'images/player.png');

  // 5 obstacle images
  this.load.image('rain1', 'images/rain1.png');
  this.load.image('rain2', 'images/rain2.png');
  this.load.image('rain3', 'images/rain3.png');
  this.load.image('rain4', 'images/rain4.png');
  this.load.image('rain5', 'images/rain5.png');
}

// ---------------- Create ----------------
function create() {
  cursors = this.input.keyboard.createCursorKeys();

  // Pause button
  const pauseBtn = document.getElementById('pauseBtn');
  pauseBtn.addEventListener('click', togglePause);
  pauseBtn.style.display = 'none';

  // Keyboard ESC pause
  this.input.keyboard.on('keydown-ESC', togglePause);

  // Show home screen
  showHomeScreen(this);

  // 🫧 Create bigger bubble texture
    let bubbleGfx = this.make.graphics({ add: false });
    bubbleGfx.fillStyle(0xffffff, 1);
    bubbleGfx.fillCircle(10, 10, 10);   // bigger circle
    bubbleGfx.generateTexture('bubble', 20, 20);

    // 🫧 Bubble particles
    this.add.particles(0, 0, 'bubble', {
    x: { min: 0, max: this.scale.width },
    y: this.scale.height,
    speedY: { min: -150, max: -250 },
    scale: { start: 0.4, end: 0.1 },   // MUCH bigger
    alpha: { start: 0.6, end: 0 },
    lifespan: 5000,
    frequency: 250,
    blendMode: 'ADD'
    });
}

// ---------------- Update ----------------
function update(time, delta) {
    //NEW UPDATE
    if (this.waterStripes) {
    this.waterStripes.tilePositionY -= 0.5;
    }
    //NEW UPDATE

  if (gameState !== 'play') return;

  handlePlayerMovement();

  //NEW UPDATE
  if (player && gameState === 'play') {
    player.y = 600 + Math.sin(time * 0.005) * 5;
    }
  //NEW UPDATE

  // Spawn rain
  if (time > this.nextRainTime) {
    addRain(this);
    this.nextRainTime = time + 800;
  }

  // Update score display
  if(scoreText) scoreText.setText('Score: ' + score);

  // Increase speed multiplier over time
  speedMultiplier += delta * 0.0008;
}

// ---------------- Home Screen ----------------
function showHomeScreen(scene) {
  gameState = 'home';
  score = 0;
  speedMultiplier = 1;

  // Remove Phaser objects
  scene.children.removeAll();

  // Hide pause button
  document.getElementById('pauseBtn').style.display = 'none';

  // Show intro screen
  const introScreen = document.getElementById('introScreen');
  introScreen.style.display = 'flex';

  const input = document.getElementById('usernameInput');
  input.value = '';

  const btn = document.getElementById('startBtnIntro');
  btn.onclick = () => {
      username = input.value || 'Player';
      introScreen.style.display = 'none';
      startGame(scene);
  };
}

// function updateIntroLeaderboard(topScores) {
//   const leaderboardList = document.getElementById('top10Leaderboard');
//   leaderboardList.innerHTML = '';
//   topScores.slice(0,10).forEach(entry => {
//     const li = document.createElement('li');
//     li.textContent = `${entry[1]}: ${entry[2]}`;
//     leaderboardList.appendChild(li);
//   });
// }

// ---------------- Start Game ----------------
function startGame(scene) {
  gameState = 'play';
  score = 0;
  speedMultiplier = 5;

  // Show pause button
  document.getElementById('pauseBtn').style.display = 'flex';

  // Player
  player = scene.physics.add.sprite(240, 600, 'player').setScale(0.05);
  player.setCollideWorldBounds(true);

  // Rains group
  rains = scene.physics.add.group();

  // Collider
  scene.physics.add.collider(player, rains, () => gameOver(scene));

  // Score text
  scoreText = scene.add.text(350, 10, 'Score: 0', { fontSize:'20px', fill:'#fff' });

  scene.nextRainTime = 0;

  // Score increment timer
  scene.time.addEvent({
    delay: 1000,
    loop: true,
    callback: ()=>{ if(gameState==='play') score++; }
  });
}

// ---------------- Player Movement ----------------
function handlePlayerMovement() {
  if (!player) return;

  player.setVelocityX(0);
  const moveSpeed = 700; // player speed
  if (cursors.left.isDown) player.setVelocityX(-moveSpeed);
  else if (cursors.right.isDown) player.setVelocityX(moveSpeed);
}

// ---------------- Spawn Obstacles ----------------
function addRain(scene) {
  const x = Phaser.Math.Between(20, 460);

  // Obstacle keys
  const obstacleKeys = ['rain1','rain2','rain3','rain4','rain5'];

  // Random key
  const randomKey = obstacleKeys[Phaser.Math.Between(0, obstacleKeys.length - 1)];

  // Size map
  const sizeMap = {
    'rain1': 0.1,
    'rain2': 0.05,
    'rain3': 0.02,
    'rain4': 0.03,
    'rain5': 0.02
  };

  let p = rains.create(x, 0, randomKey).setScale(sizeMap[randomKey]);
  p.setVelocityY(50 * speedMultiplier);
}

// ---------------- Pause ----------------
function togglePause() {
  const pauseBtn = document.getElementById('pauseBtn');
  if (gameState === 'play') {
    gameState = 'pause';
    game.scene.scenes[0].physics.world.pause();
    pauseBtn.querySelector('span').innerText = '▶';
  } else if (gameState === 'pause') {
    gameState = 'play';
    game.scene.scenes[0].physics.world.resume();
    pauseBtn.querySelector('span').innerText = '||';
  }
}

// ---------------- Game Over ----------------
function gameOver(scene) {
  gameState = 'gameover';

  // Save score to leaderboard
  leaderboard.push({ name: username, score });
  leaderboard.sort((a,b)=>b.score-a.score);
  if(leaderboard.length>5) leaderboard.pop();

  // Remove game objects
  scene.children.removeAll();
  rains.clear(true,true);

  document.getElementById('pauseBtn').style.display = 'none';

  // Outro screen
  const outro = document.createElement('div');
  outro.className = 'outroScreen';
  outro.innerHTML = `
  <h2>💀 GAME OVER 💀</h2>
  <p>Nice try, ${username}.</p>
  <h3>Your Score: ${score}</h3>
  <fieldset>
        <legend>TOP 10 🏆</legend>
        ${leaderboard.map((x,i)=>`${i+1}. ${x.name}: ${x.score}`).join('<br>')}
    </fieldset>
    <br/>
  <div id="outroButtons"></div>
`;
  document.body.appendChild(outro);

  const btnContainer = document.getElementById('outroButtons');

  const retryBtn = document.createElement('button');
  retryBtn.innerText = 'Retry';
  retryBtn.onclick = () => { outro.remove(); startGame(scene); };
  btnContainer.appendChild(retryBtn);

  const homeBtn = document.createElement('button');
  homeBtn.innerText = 'Home';
  homeBtn.style.marginLeft='10px';
  homeBtn.onclick = () => { outro.remove(); showHomeScreen(scene); };
  btnContainer.appendChild(homeBtn);

  // Optional: send score to Google Sheets here
//   if(window.GSHEET_URL) {
//     fetch(window.GSHEET_URL, {
//       method: 'POST',
//       headers: { 'Content-Type':'application/json' },
//       body: JSON.stringify({ username, score })
//     }).then(res => res.json()).then(console.log).catch(console.error);
//   }
}
