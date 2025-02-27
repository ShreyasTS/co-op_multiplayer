let playerInputs = document.getElementById("playerInputs");
// const socket = io({ autoConnect: false, path: "/viewer" });
const socket = io({ autoConnect: false, path: "/gameController" });
let players = {};
let bullets = {};
let droppedBombsList = {};
let booms = {};
let droppingPowerups = {};
let cautionZones = {};

let playerSize = 70;

let hasGameStarted = false;
let canSpawnObjects = true;
let canPlaySound = true;

let bgmSoundAudio;

let spaceshipImg = document.getElementById("spaceshipImg");
let spacebgImg = document.getElementById("spacebgImg");
let enemyshipImg = document.getElementById("enemyshipImg");
let enemyship2Img = document.getElementById("enemyship2Img");
let nukeImg = document.getElementById("nukeImg");
let boomImg = document.getElementById("boomImg");
let cautionImg = document.getElementById("cautionImg");
let missileImg = document.getElementById("missileImg");
let soundToggleBtn = document.getElementById("soundToggleBtn");
let gameCodeDisplay = document.getElementById("gameCodeDisplay");
let gameHolder = document.getElementById("gameHolder");
let gameModeBtn = document.getElementById("gameModeBtn");
let connInstruction = document.getElementById("connInstruction");

let width;
let height;
let gameCanvas = document.getElementById("gameCanvas");
let ctx = gameCanvas.getContext("2d");

let userAgent = navigator.userAgent.toLowerCase();
let Android = userAgent.indexOf("android") > -1;
let ios = userAgent.indexOf("ios") > -1;

let easyDifficulty = true;

console.log(userAgent);
ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;
width = gameCanvas.width;
height = gameCanvas.height;

if (Android || ios) {
  width = gameCanvas.width;
  height = gameCanvas.height;
}

document.addEventListener("keypress", (e) => {
  if (e.key == "f") fullscreenMode();
  if (e.key == "m") toggleSound();
  if (e.key == "r") window.location.reload();
  if (e.key == "d") toggleDifficulty();
});

function fullscreenMode() {
  if (!document.fullscreenElement) {
    gameHolder.requestFullscreen();
    setTimeout(() => {
      ctx.canvas.width = window.innerWidth;
      ctx.canvas.height = window.innerHeight;
      if (!Android && !ios) {
        width = gameCanvas.width;
        height = gameCanvas.height;
      }
    }, 500);

    screen.orientation.lock("landscape-primary");
  } else {
    gameHolder.exitFullscreen();
    screen.orientation.lock("portrait-primary");
    setTimeout(() => {
      ctx.canvas.width = window.innerWidth;
      ctx.canvas.height = window.innerHeight;
      if (!Android && !ios) {
        width = gameCanvas.width;
        height = gameCanvas.height;
      }
    }, 500);
  }
}

const generateRandomID = (length) =>
  Array.from(
    { length },
    () => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 62)]
  ).join("");

class Entity {
  constructor(x, y, w, h, ctx) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.ctx = ctx;
  }

  getPos() {
    return { x: this.x, y: this.y };
  }

  setPos(newX, newY) {
    this.x = newX;
    this.y = newY;
  }

  getSize() {
    return { w: this.w, h: this.h };
  }

  setSize(newW, newH) {
    this.w = newW;
    this.h = newH;
  }
}
class GameManager {
  constructor() {}

  addPlayer(playerName) {}
}

class Bullet extends Entity {
  constructor(x, y, w, h, ctx, bulletId, ownerName, bulletDir) {
    super(x, y, w, h, ctx);
    this.bulletSpeed = 50;
    this.bulletId = bulletId;
    this.ownerName = ownerName;
    this.bulletDir = bulletDir;
  }

  DrawAndMoveBulletUp(deltaTime) {
    if (this.bulletDir == "up") {
      this.ctx.fillStyle = "orange";
      this.setPos(this.getPos().x, this.getPos().y - this.bulletSpeed) / deltaTime;
    } else {
      this.ctx.fillStyle = "red";
      this.setPos(this.getPos().x, this.getPos().y + this.bulletSpeed) / deltaTime;
    }
    this.ctx.fillRect(this.getPos().x, this.getPos().y, this.getSize().w, this.getSize().h);
    if (this.y < -20 || this.y > height) {
      delete bullets[this.bulletId];
    }
  }
}

class Explosion extends Entity {
  constructor(x, y, w, h, ctx, boomid, explosionTime) {
    super(x, y, w, h, ctx);
    this.boomid = boomid;
    this.explosionTime = explosionTime;
    // this.rotAngle = Math.floor(Math.random() * (360 - 0 + 1)) + 0;
  }

  explode() {
    // this.ctx.save();
    // this.ctx.translate(this.getPos().x, this.getPos().y);
    // this.ctx.rotate((this.rotAngle * Math.PI) / 180);
    this.ctx.drawImage(boomImg, this.getPos().x, this.getPos().y, this.getSize().w, this.getSize().h);
    // this.ctx.restore();
    setTimeout(() => {
      delete booms[this.boomid];
    }, this.explosionTime);
  }

  boom(deltaTime) {
    this.setSize(this.getSize().w + 2, this.getSize().h + 2) / deltaTime;
    this.setPos(this.getPos().x - 1, this.getPos().y - 1) / deltaTime;
    this.explode();
  }
}

class powerUps extends Entity {
  constructor(x, y, w, h, ctx, powerupId, powerUpType) {
    super(x, y, w, h, ctx);
    this.powerupId = powerupId;
    this.powerUpType = powerUpType;
    this.powerUpValue = Math.floor(Math.random() * (3 - 1 + 1)) + 1;
    this.dropSpeed = 2;
  }

  drawAndDropPowerup(deltaTime) {
    if (this.powerUpType == "bullet") {
      this.powerUpValue == 3
        ? (this.ctx.fillStyle = "red")
        : this.powerUpValue == 2
        ? (this.ctx.fillStyle = "blue")
        : (this.ctx.fillStyle = "green");
      // this.ctx.fillRect(this.getPos().x, this.getPos().y, this.getSize().w, this.getSize().h);
      this.ctx.fillRect(this.getPos().x, this.getPos().y, this.getSize().w, this.getSize().h);
      this.powerUpValue == 3
        ? (this.ctx.fillStyle = "black")
        : this.powerUpValue == 2
        ? (this.ctx.fillStyle = "white")
        : (this.ctx.fillStyle = "black");
      this.ctx.fillStyle = "white";
      this.ctx.font = "20px Arial";
      // this.ctx.fillText(this.playerName, this.getPos().x, this.getPos().y + this.getSize().h / 2);
      this.ctx.fillText(
        `${this.powerUpValue}`,
        this.getPos().x + this.getSize().w / 2,
        this.getPos().y + this.getSize().h / 2
      );
    } else if (this.powerUpType == "nuke") {
      this.ctx.fillStyle = "white";
      this.ctx.fillRect(this.getPos().x - 2, this.getPos().y - 2, this.getSize().w + 4, this.getSize().h + 4);
      this.ctx.fillStyle = "black";
      this.ctx.fillRect(this.getPos().x, this.getPos().y, this.getSize().w, this.getSize().h);
      this.ctx.drawImage(
        nukeImg,
        this.getPos().x + this.getSize().w * 0.1,
        this.getPos().y + this.getSize().h * 0.1,
        this.getSize().w * 0.8,
        this.getSize().h * 0.8
      );
    }

    //----------------------------------------------------------------------------------------------

    this.setPos(this.getPos().x, this.getPos().y + this.dropSpeed) / deltaTime;
    if (this.y > height + 10) {
      delete droppingPowerups[this.powerupId];
    }
  }
}

class CautionZone extends Entity {
  constructor(x, y, w, h, ctx, cautionZoneId) {
    super(x, y, w, h, ctx);
    this.cautionZoneId = cautionZoneId;
    this.isLaunched = false;
    this.missileSpeed = 10;
    this.isDestroyed = false;
  }

  launch() {
    //called after warning timer
    setTimeout(() => {
      delete cautionZones[this.cautionZoneId];
    }, 8000);
  }

  timeoutAndLaunchMissile() {
    //Called when spawned
    setTimeout(() => {
      this.launch();
      this.setPos(this.getPos().x, height + 100);
      this.isLaunched = true;
      this.missileSpeed = 20;
    }, 3000);
  }

  drawMissileMoveUp(timestamp) {
    //called every frame with timestamp passed
    if (this.isLaunched) {
      this.ctx.drawImage(missileImg, this.getPos().x, this.getPos().y, this.getSize().w + 50, this.getSize().h + 50);
      this.setPos(this.getPos().x, this.getPos().y - this.missileSpeed);
    } else {
      if (parseInt((timestamp / 500) % 2) == 0) {
        this.ctx.drawImage(cautionImg, this.getPos().x, height - 100, this.getSize().w + 20, this.getSize().h + 20);
      }
    }
  }

  destroySelf() {
    this.isDestroyed = true;
  }
}

class DroppingBombs extends Entity {
  constructor(x, y, w, h, ctx, bombId, shipType) {
    super(x, y, w, h, ctx);
    this.bombId = bombId;
    this.shipType = shipType;
    // this.dropSpeed = 3;
    this.dropSpeed = Math.floor(Math.random() * (8 - 3 + 1)) + 3;
    this.droppInterval;
    this.isDestroyed = false;
  }

  // drawAndDropBomb(deltaTime) {
  //   this.ctx.fillStyle = "red";
  //   this.ctx.fillRect(this.getPos().x, this.getPos().y, this.getSize().w, this.getSize().h);
  //   this.setPos(this.getPos().x, this.getPos().y + this.dropSpeed) / deltaTime;
  //   if (this.y > height + 10) {
  //     delete droppedBombsList[this.bombId];
  //   }
  // }
  drawAndDropBomb(deltaTime) {
    this.ctx.fillStyle = "red";
    // this.ctx.fillRect(this.getPos().x, this.getPos().y, this.getSize().w, this.getSize().h);
    if (this.shipType == "normal") {
      this.ctx.drawImage(enemyshipImg, this.getPos().x, this.getPos().y, this.getSize().w, this.getSize().h);
    } else {
      this.ctx.drawImage(enemyship2Img, this.getPos().x, this.getPos().y, this.getSize().w, this.getSize().h);
    }
    this.setPos(this.getPos().x, this.getPos().y + this.dropSpeed) / deltaTime;
    if (this.y > height + 10) {
      droppedBombsList[bomb].destroySelf();
    }
  }

  stopDroppingBombAndDestroy() {
    this.dropSpeed = 0;
  }

  shipType2Shoot() {
    if (this.shipType != "normal") {
      this.droppInterval = setInterval(() => {
        let bulletid = generateRandomID(4);
        let bullet = new Bullet(
          this.getPos().x + this.getSize().w / 2,
          this.getPos().y + this.getSize().h / 2,
          10,
          30,
          this.ctx,
          bulletid,
          this.bombId,
          "down"
        );
        bullet.bulletSpeed = 10;
        bullets[`${bulletid}`] = bullet;
      }, (Math.floor(Math.random() * 2) + 1) * 1000);
    }
  }

  destroySelf() {
    clearInterval(this.droppInterval);
    this.isDestroyed = true;
  }
}

class Player extends Entity {
  constructor(x, y, w, h, ctx, color, name = "") {
    super(x, y, w, h, ctx);
    this.color = color;
    this.playerName = name;
    this.moveSpeed = 5;
    this.direction = 0;
    this.powerupLvl = 1;
    this.score = 0;
    this.hasTakenDamage = false;
    this.canTakeDamage = true;
    // this.timeToResetDamage = 3;
    this.prevTimestamp = 0;
    this.hasPressedStart = false;
  }

  drawPlayer(timestamp) {
    if (this.hasTakenDamage) {
      this.canTakeDamage = false;
      if (timestamp - this.prevTimestamp >= 3000) {
        this.prevTimestamp = timestamp;
        this.canTakeDamage = true;
        this.hasTakenDamage = false;
      }

      if (Math.floor(timestamp / 200) % 2 == 0) {
        this.ctx.fillStyle = this.color;
        this.ctx.fillRect(this.getPos().x, this.getPos().y + 70, this.getSize().w, 30);
        this.ctx.fillStyle = "black";
        this.ctx.font = "30px Arial";
        this.ctx.fillText(this.playerName, this.getPos().x, this.getPos().y + this.getSize().h + 20);
        this.ctx.drawImage(spaceshipImg, this.getPos().x, this.getPos().y, this.getSize().w, this.getSize().h);
      }
    } else {
      this.prevTimestamp = timestamp;
      this.ctx.fillStyle = this.color;
      this.ctx.fillRect(this.getPos().x, this.getPos().y + 70, this.getSize().w, 30);
      this.ctx.fillStyle = "black";
      this.ctx.font = "30px Arial";
      this.ctx.fillText(this.playerName, this.getPos().x, this.getPos().y + this.getSize().h + 20);
      this.ctx.drawImage(spaceshipImg, this.getPos().x, this.getPos().y, this.getSize().w, this.getSize().h);
    }
  }

  updatePos() {
    this.x += this.direction;
  }

  setPowerup(powerupVal) {
    this.powerupLvl = powerupVal;
    setTimeout(() => {
      this.powerupLvl = 1;
    }, 3000);
  }
}

let lastTime = 0;
let remotePlayerInputs = {};

function isColliding(entity1, entity2) {
  if (entity1 && entity2) {
    return (
      entity1.getPos().x < entity2.getPos().x + entity2.getSize().w &&
      entity1.getPos().x + entity1.getSize().w > entity2.getPos().x &&
      entity1.getPos().y < entity2.getPos().y + entity2.getSize().h &&
      entity1.getPos().y + entity1.getSize().h > entity2.getPos().y
    );
  }
}

// setInterval(() => {
//   if (Object.keys(players).length > 0 && Object.keys(droppedBombsList).length < 20) {
//     let newBombId = generateRandomID(4);
//     let xmax = width - 50;
//     let xmin = 50;
//     let ymax = -10;
//     let ymin = -50;
//     let bombx = Math.floor(Math.random() * (xmax - xmin + 1)) + xmin;
//     let bomby = Math.floor(Math.random() * (ymax - ymin + 1)) + ymin;
//     let shipType = Math.random() > 0.2 ? "normal" : "none";
//     let bomb = new DroppingBombs(bombx, bomby, 60, 60, ctx, newBombId, shipType);
//     if (shipType == "none") {
//       bomb.dropSpeed = 2;
//     }
//     bomb.shipType2Shoot();
//     droppedBombsList[newBombId] = bomb;
//   }
// }, 500);

// setInterval(() => {
//   if (Object.keys(players).length > 0 && Object.keys(cautionZones).length < 8) {
//     let newZoneid = generateRandomID(4);
//     let randomX = Math.floor(Math.random() * (width - 50 + 1)) + 50;
//     let cautionZone = new CautionZone(randomX, width - 100, 50, 50, ctx, newZoneid);
//     cautionZone.timeoutAndLaunchMissile();
//     cautionZones[newZoneid] = cautionZone;
//   }
// }, 3000);

// setInterval(() => {
//   if (Object.keys(players).length > 0 && Object.keys(droppingPowerups).length < 5) {
//     let newPowerUpid = generateRandomID(4);
//     let xmax = width - 50;
//     let xmin = 50;
//     let ymax = -10;
//     let ymin = -50;
//     let powerupx = Math.floor(Math.random() * (xmax - xmin + 1)) + xmin;
//     let powerupy = Math.floor(Math.random() * (ymax - ymin + 1)) + ymin;
//     let powerUpType = Math.random() < 0.1 ? "nuke" : "bullet";
//     let powerUpXSize = powerUpType == "nuke" ? 80 : 60;
//     let powerUpYSize = powerUpType == "nuke" ? 60 : 60;

//     let powerup = new powerUps(powerupx, powerupy, powerUpXSize, powerUpYSize, ctx, newPowerUpid, powerUpType);
//     droppingPowerups[newPowerUpid] = powerup;
//   }
// }, 3000);

let prev_cautionZoneSpawnTime = 0;
let maxCautionZonesCount = 8;
function cautionZoneSpawner(timestamp, spawnTimeInteval) {
  if (timestamp - prev_cautionZoneSpawnTime >= spawnTimeInteval) {
    prev_cautionZoneSpawnTime = timestamp;
    if (Object.keys(cautionZones).length < maxCautionZonesCount) {
      let newZoneid = generateRandomID(4);
      let randomX = Math.floor(Math.random() * (width - 50 + 1)) + 50;

      let cautionZone = new CautionZone(randomX, width - 100, 50, 50, ctx, newZoneid);
      cautionZone.timeoutAndLaunchMissile();
      cautionZones[newZoneid] = cautionZone;
    }
  }
}

let prev_PowerupSpawnTime = 0;
let maxPowerUpsCount = 5;
function powerUpSpawner(timestamp, spawnTimeInteval) {
  if (timestamp - prev_PowerupSpawnTime >= spawnTimeInteval) {
    if (Object.keys(droppingPowerups).length < maxPowerUpsCount) {
      prev_PowerupSpawnTime = timestamp;
      let newPowerUpid = generateRandomID(4);
      let xmax = width - 50;
      let xmin = 50;
      let ymax = -10;
      let ymin = -50;
      let powerupx = Math.floor(Math.random() * (xmax - xmin + 1)) + xmin;
      let powerupy = Math.floor(Math.random() * (ymax - ymin + 1)) + ymin;
      let powerUpType = Math.random() < 0.2 ? "nuke" : "bullet";
      let powerUpXSize = powerUpType == "nuke" ? 80 : 60;
      let powerUpYSize = powerUpType == "nuke" ? 60 : 60;

      let powerup = new powerUps(powerupx, powerupy, powerUpXSize, powerUpYSize, ctx, newPowerUpid, powerUpType);
      droppingPowerups[newPowerUpid] = powerup;
    }
  }
}

let prev_DropBombSpawnTime = 0;
let maxDropBombCount = 20;

function dropBombSpawner(timestamp, spawnTimeInteval) {
  if (timestamp - prev_DropBombSpawnTime >= spawnTimeInteval) {
    if (Object.keys(droppedBombsList).length < maxDropBombCount) {
      prev_DropBombSpawnTime = timestamp;
      let newBombId = generateRandomID(4);
      let xmax = width - 50;
      let xmin = 50;
      let ymax = -10;
      let ymin = -50;
      let bombx = Math.floor(Math.random() * (xmax - xmin + 1)) + xmin;
      let bomby = Math.floor(Math.random() * (ymax - ymin + 1)) + ymin;
      let shipType = Math.random() > 0.2 ? "normal" : "none";
      let bomb = new DroppingBombs(bombx, bomby, 60, 60, ctx, newBombId, shipType);
      if (shipType == "none") {
        bomb.dropSpeed = 2;
      }
      bomb.shipType2Shoot();
      droppedBombsList[newBombId] = bomb;
    }
  }
}

function playSound(trackName) {
  let tracks = {
    timerBeep: "/game1/assets/gameTimerBeep.mp3",
    bgm1: "/game1/assets/bgm1.mp3",
    bgm2: "/game1/assets/bgm2.mp3",
  };
  if (canPlaySound) {
    let audio = new Audio(tracks[trackName]);
    audio.play();
    return audio;
  }
}

const gameTime = 60000;
let lastGameTime = 0;
let gameStartTime;
let gotGameStartTime = false;

let cautionZoneSpawnRate = 3000; // Every 3 seconds
let powerUpSpawnRate = 3000; // Every 3 seconds
let dropBombSpawnRate = 500; // Every half seconds

let bgmCoices = ["bgm1", "bgm2"];
let bgmSelectedChoice = Math.floor(Math.random() * bgmCoices.length);

function drawContent(timestamp) {
  let deltaTime = timestamp - lastTime;
  ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  ctx.drawImage(spacebgImg, 0, 0, width, height);
  let scoreHolder = 50 + Object.keys(players).length * 30;
  ctx.fillStyle = "black";
  ctx.fillRect(10, 10, 200, scoreHolder);
  ctx.fillStyle = "white";
  ctx.font = "30px Arial";
  ctx.fillText("Scores: ", 20, 40);
  // ctx.fillText(timestamp, width - 150, 80);
  // ctx.fillText(deltaTime, width - 150, 120);

  if (Object.keys(players).length > 0 && hasGameStarted && canSpawnObjects) {
    cautionZoneSpawner(timestamp, cautionZoneSpawnRate);
    powerUpSpawner(timestamp, powerUpSpawnRate);
    dropBombSpawner(timestamp, dropBombSpawnRate);
    connInstruction.style.display = "none";
  } else {
    connInstruction.style.display = "block";
  }

  if (Object.keys(players).length > 0) {
    hasGameStarted = Object.values(players).every((player) => player.hasPressedStart == true);
    canSpawnObjects = hasGameStarted;
  } else {
    hasGameStarted = false;
  }

  let scoreDisplayerCounter = 70;
  for (player in players) {
    ctx.font = "20px Arial";
    ctx.fillText(`${players[player].playerName} : ${players[player].score}`, 20, scoreDisplayerCounter);
    scoreDisplayerCounter += 30;
  }

  for (input in remotePlayerInputs) {
    if (players && Object.keys(players).length > 0 && remotePlayerInputs[input] && input && players[input]) {
      if (remotePlayerInputs[input]["A"].heldDown == true && players[input].getPos().x > 0) {
        players[input].direction = -players[input].moveSpeed;
      } else if (
        remotePlayerInputs[input]["B"].heldDown == true &&
        players[input].getPos().x < width - players[input].getSize().w
      ) {
        players[input].direction = players[input].moveSpeed;
      } else {
        players[input].direction = 0;
      }
    }
  }
  // for (input in remotePlayerInputs) {
  //   if (players && Object.keys(players).length > 0 && remotePlayerInputs[input] && input && players[input]) {
  //     if (remotePlayerInputs[input].heldDown == true) {
  //       if (remotePlayerInputs[input].inputValue == "A" && players[input].getPos().x > 0) {
  //         players[input].direction = -players[input].moveSpeed;
  //       } else if (
  //         remotePlayerInputs[input].inputValue == "B" &&
  //         players[input].getPos().x < width - players[input].getSize().w
  //       ) {
  //         players[input].direction = players[input].moveSpeed;
  //       } else {
  //         players[input].direction = 0;
  //       }
  //     } else {
  //       if (players[input]) {
  //         players[input].direction = 0;
  //       }
  //     }
  //   }
  // }

  for (exploion in booms) {
    booms[exploion].boom(deltaTime);
  }

  for (cautionzone in cautionZones) {
    cautionZones[cautionzone].drawMissileMoveUp(timestamp);
    if (cautionZones[cautionzone].isDestroyed) {
      delete cautionZones[cautionzone];
    }
  }

  for (powerup in droppingPowerups) {
    droppingPowerups[powerup].drawAndDropPowerup();
  }

  for (bomb in droppedBombsList) {
    droppedBombsList[bomb].drawAndDropBomb(deltaTime);
    if (droppedBombsList[bomb].isDestroyed) {
      delete droppedBombsList[bomb];
    }
  }

  for (bullet in bullets) {
    bullets[bullet].DrawAndMoveBulletUp(deltaTime);
  }

  for (const player in players) {
    players[player].drawPlayer(timestamp);
    players[player].updatePos();

    for (powerup in droppingPowerups) {
      if (isColliding(droppingPowerups[powerup], players[player])) {
        if (droppingPowerups[powerup].powerUpType == "nuke") {
          socket.emit("newPowerUpEarned", { givenTo: player, powerUpType: "nuke" });
        } else {
          players[player].setPowerup(droppingPowerups[powerup].powerUpValue);
        }
        delete droppingPowerups[powerup];
      }
    }

    for (cautionzone in cautionZones) {
      if (isColliding(cautionZones[cautionzone], players[player]) && players[player].canTakeDamage) {
        players[player].hasTakenDamage = true;
        cautionZones[cautionzone].destroySelf();
        socket.emit("hapticResponse", { responseTo: player, eventType: "dropBombDestroyed" });
      }
    }

    for (bomb in droppedBombsList) {
      // console.log(droppedBombsList[bomb]);
      if (isColliding(players[player], droppedBombsList[bomb]) && players[player].canTakeDamage) {
        players[player].hasTakenDamage = true;
        droppedBombsList[bomb].destroySelf();
        socket.emit("hapticResponse", { responseTo: player, eventType: "dropBombDestroyed" });
      }
      for (bullet in bullets) {
        if (isColliding(droppedBombsList[bomb], bullets[bullet]) && bullets[bullet].bulletDir == "up") {
          droppedBombsList[bomb].stopDroppingBombAndDestroy();
          let newBoomid = generateRandomID(4);
          let newBoom = new Explosion(
            droppedBombsList[bomb].getPos().x,
            droppedBombsList[bomb].getPos().y,
            50,
            50,
            ctx,
            newBoomid,
            500
          );
          booms[newBoomid] = newBoom;
          socket.emit("boomSound", { clientname: bullets[bullet].ownerName });
          socket.emit("hapticResponse", { responseTo: bullets[bullet].ownerName, eventType: "boom" });
          if (droppedBombsList[bomb].shipType != "normal" && hasGameStarted) {
            players[bullets[bullet].ownerName].score += 10;
          } else {
            if (hasGameStarted) {
              players[bullets[bullet].ownerName].score += 20;
            }
          }
          socket.emit("playerScore", {
            playerName: bullets[bullet].ownerName,
            score: players[bullets[bullet].ownerName].score,
          });
          droppedBombsList[bomb].destroySelf();
          delete bullets[bullet];
        }
        if (
          isColliding(players[player], bullets[bullet]) &&
          bullets[bullet].bulletDir == "down" &&
          players[player].canTakeDamage
        ) {
          players[player].hasTakenDamage = true;
          socket.emit("hapticResponse", { responseTo: player, eventType: "dropBombDestroyed" });
          droppedBombsList[bomb].destroySelf();
          delete bullets[bullet];
        }
      }
    }
  }

  if (!hasGameStarted || !canSpawnObjects) {
    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.fillRect(width / 2 - 300, height / 2 - 40, 520, 50);
    ctx.fillStyle = "black";
    ctx.fillText("Press start on your controller", width / 2 - 300, height / 2);
  } else {
    if (!gotGameStartTime) {
      bgmSoundAudio = playSound(bgmCoices[bgmSelectedChoice]);
      gameStartTime = timestamp;
      gotGameStartTime = true;
      socket.emit("difficultyType", easyDifficulty);
    }

    let elspsedTime = timestamp - gameStartTime;

    if (elspsedTime >= gameTime) {
      hasGameStarted = false;
      canSpawnObjects = false;
    } else {
      ctx.fillStyle = "white";
      ctx.fillRect(width / 2 - 100, 18, 115, 108);
      ctx.fillStyle = "black";
      ctx.fillRect(width / 2 - 98, 20, 110, 104);
      ctx.font = "100px Arial";
      ctx.fillStyle = "white";
      let timeLeft = Math.ceil((gameTime - elspsedTime) / 1000);
      if (timeLeft % 2 == 0 && timeLeft < 10) {
        ctx.fillStyle = "red";
      }
      let refactoredTimeLeft = "";
      refactoredTimeLeft = timeLeft < 10 ? "0" + timeLeft : timeLeft;

      ctx.fillText(refactoredTimeLeft, width / 2 - 100, 100);
      lastGameTime = timestamp;
    }
  }

  lastTime = timestamp;
  requestAnimationFrame(drawContent);
}

requestAnimationFrame(drawContent);

document.addEventListener("DOMContentLoaded", () => {
  socket.connect();
  canPlaySound = window.localStorage.getItem("canPlaySound") == "true" ? true : false;
  canPlaySound ? (soundToggleBtn.innerText = "🔊") : (soundToggleBtn.innerText = "🔇");
});

function toggleSound() {
  canPlaySound = !canPlaySound;
  canPlaySound ? (soundToggleBtn.innerText = "🔊") : (soundToggleBtn.innerText = "🔇");
  canPlaySound
    ? window.localStorage.setItem("canPlaySound", "true")
    : window.localStorage.setItem("canPlaySound", "false");
  if (!canPlaySound) {
    bgmSoundAudio.pause();
  } else {
    bgmSoundAudio.play();
  }
}

function toggleDifficulty() {
  easyDifficulty = !easyDifficulty;
  easyDifficulty ? (gameModeBtn.innerText = "🙂") : (gameModeBtn.innerText = "💀");
  socket.emit("difficultyType", easyDifficulty);
}

socket.on("connect", () => {
  socket.emit("gameViewerConnected");
  players = {};
  bullets = {};
  droppedBombsList = {};
  booms = {};
  droppingPowerups = {};
});

socket.on("localip", (data) => {
  connInstruction.innerHTML = `Open <span class="ip">${data}</span> on your mobile device to open controller 🎮`;
});

socket.on("refreshGameScreen", () => {
  window.location.reload();
});

socket.on("starGameConfirm", (data) => {
  players[data].hasPressedStart = true;
});

socket.on("playerjoined", (data) => {
  let r = Math.floor(Math.random() * (256 - 0 + 1)) + 0;
  let g = Math.floor(Math.random() * (256 - 0 + 1)) + 0;
  let b = Math.floor(Math.random() * (256 - 0 + 1)) + 0;
  let randomXStart = Math.floor(Math.random() * (width - playerSize - playerSize + 1)) + playerSize;
  console.log(`rgb(${r},${g}, ${b})`);
  let newPlayer = new Player(randomXStart, height - 200, playerSize, playerSize, ctx, `rgb(${r},${g}, ${b})`, data);
  players[data] = newPlayer;
  socket.emit("difficultyType", easyDifficulty);
});

socket.on("confirm", (data) => {
  console.log(data);
});

socket.on("playerDied", (data) => {
  if (players[data]) {
    console.log(data);
    let newBoomid = generateRandomID(4);
    let newBoom = new Explosion(players[data].getPos().x, players[data].getPos().y, 50, 50, ctx, newBoomid, 800);
    booms[newBoomid] = newBoom;
    delete players[data];
  }
});

socket.on("gameCode", (data) => {
  gameCodeDisplay.innerText = String(data).toUpperCase();
});

socket.on("playerInputs", (data) => {
  if (Object.keys(remotePlayerInputs).length <= 0 || remotePlayerInputs[data.playerName] == undefined) {
    remotePlayerInputs[data.playerName] = {};
    remotePlayerInputs[data.playerName]["A"] = { heldDown: false };
    remotePlayerInputs[data.playerName]["B"] = { heldDown: false };
  }
  if (data.inputValue == "A" && data.heldDown) {
    remotePlayerInputs[data.playerName]["B"].heldDown = false;
  } else if (data.inputValue == "B" && data.heldDown) {
    remotePlayerInputs[data.playerName]["A"].heldDown = false;
  }
  remotePlayerInputs[data.playerName][data.inputValue] = data;
  if (Object.keys(players).length > 0) {
    if (data.inputValue == "SHOOT") {
      for (let index = 0; index < players[data.playerName].powerupLvl; index++) {
        let bulletid = generateRandomID(4);
        let bulletx = players[data.playerName].getPos().x;
        let bullety = players[data.playerName].getPos().y;

        if (players[data.playerName].powerupLvl == 1) {
          if (index == 0) {
            bulletx += players[data.playerName].getSize().w / 2;
          }
        }
        if (players[data.playerName].powerupLvl == 2) {
          if (index == 0) {
            bulletx += players[data.playerName].getSize().w;
          } else if (index == 1) {
            bulletx = players[data.playerName].getPos().x;
          }
        }
        if (players[data.playerName].powerupLvl == 3) {
          if (index == 0) {
            bulletx += players[data.playerName].getSize().w / 2;
          } else if (index == 1) {
            bulletx = players[data.playerName].getPos().x;
          } else if (index == 2) {
            bulletx += players[data.playerName].getSize().w;
          }
        }

        let bullet = new Bullet(bulletx, bullety, 10, 85, ctx, bulletid, data.playerName, "up");
        bullets[`${bulletid}`] = bullet;
      }
    } else if (data.inputValue == "nuke") {
      console.log("ALL GONE! NUKED!");
      let bombedShipsCounter = 0;
      for (b in droppedBombsList) {
        let newBoomid = generateRandomID(4);
        let newBoom = new Explosion(
          droppedBombsList[b].getPos().x,
          droppedBombsList[b].getPos().y,
          50,
          50,
          ctx,
          newBoomid,
          500
        );
        // socket.emit("hapticResponse", { responseTo: "all", eventType: "-" });
        // socket.emit("boomSound", { clientname: "all" });
        booms[newBoomid] = newBoom;
        droppedBombsList[b].destroySelf();
        droppedBombsList[b].shipType == "normal" ? (bombedShipsCounter += 10) : (bombedShipsCounter += 20);
      }
      if (hasGameStarted) {
        players[data.playerName].score += bombedShipsCounter;
        socket.emit("playerScore", {
          playerName: data.playerName,
          score: players[data.playerName].score,
        });
      }
      droppedBombsList = {};
    }
  }

  // playerInputs.innerHTML += JSON.stringify(data);
});

socket.on("disconnect", () => {
  console.log("Viewer disconnected");
});
