let playerInputs = document.getElementById("playerInputs");
// const socket = io({ autoConnect: false, path: "/viewer" });
const socket = io({ autoConnect: false, path: "/gameController" });
let players = {};
let bullets = {};
let droppedBombsList = {};
let booms = {};
let droppingPowerups = {};

let playerSize = 70;

let spaceshipImg = document.getElementById("spaceshipImg");
let spacebgImg = document.getElementById("spacebgImg");
let enemyshipImg = document.getElementById("enemyshipImg");
let boomImg = document.getElementById("boomImg");

let gameCanvas = document.getElementById("gameCanvas");
let ctx = gameCanvas.getContext("2d");

const generateRandomID = (length) =>
  Array.from(
    { length },
    () => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 62)]
  ).join("");

let width = gameCanvas.width;
let height = gameCanvas.height;

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
  constructor(x, y, w, h, ctx, bulletId, ownerName) {
    super(x, y, w, h, ctx);
    this.velocity = 5;
    this.bulletId = bulletId;
    this.ownerName = ownerName;
  }

  DrawAndMoveBulletUp(deltaTime) {
    this.ctx.fillStyle = "orange";
    this.ctx.fillRect(this.getPos().x, this.getPos().y, this.getSize().w, this.getSize().h);
    this.setPos(this.getPos().x, this.getPos().y - this.velocity) / deltaTime;
    if (this.y < -20) {
      delete bullets[this.bulletId];
    }
  }
}

// class Player extends Entity {}

class Explosion extends Entity {
  constructor(x, y, w, h, ctx, boomid) {
    super(x, y, w, h, ctx);
    this.boomid = boomid;
  }

  explode() {
    this.ctx.drawImage(boomImg, this.getPos().x, this.getPos().y, this.getSize().w, this.getSize().h);
    setTimeout(() => {
      delete booms[this.boomid];
    }, 500);
  }

  boom(deltaTime) {
    for (let boomSize = 0; this.getSize().w < 100; boomSize++) {
      this.setSize(this.getSize().w + boomSize, this.getSize().h + boomSize) / deltaTime;
    }
    this.explode();
  }
}

class powerUps extends Entity {
  constructor(x, y, w, h, ctx, powerupId) {
    super(x, y, w, h, ctx);
    this.powerupId = powerupId;
    this.powerUpValue = Math.floor(Math.random() * (3 - 1 + 1)) + 1;
    this.dropSpeed = 2;
  }

  drawAndDropPowerup(deltaTime) {
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

    this.setPos(this.getPos().x, this.getPos().y + this.dropSpeed) / deltaTime;
    if (this.y > height + 10) {
      delete droppingPowerups[this.powerupId];
    }
  }
}

class DroppingBombs extends Entity {
  constructor(x, y, w, h, ctx, bombId) {
    super(x, y, w, h, ctx);
    this.bombId = bombId;
    this.dropSpeed = 3;
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
    this.ctx.drawImage(enemyshipImg, this.getPos().x, this.getPos().y, this.getSize().w, this.getSize().h);
    this.setPos(this.getPos().x, this.getPos().y + this.dropSpeed) / deltaTime;
    if (this.y > height + 10) {
      delete droppedBombsList[this.bombId];
    }
  }

  stopDroppingBombAndDestroy() {
    this.dropSpeed = 0;
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
  }

  // drawPlayer() {
  //   this.ctx.fillStyle = this.color;
  //   this.ctx.fillRect(this.getPos().x, this.getPos().y, this.getSize().w, this.getSize().h);
  //   this.ctx.fillStyle = "black";
  //   this.ctx.font = "30px Arial";
  //   this.ctx.fillText(this.playerName, this.getPos().x, this.getPos().y + this.getSize().h / 2);
  // }
  drawPlayer() {
    this.ctx.fillStyle = this.color;
    this.ctx.drawImage(spaceshipImg, this.getPos().x, this.getPos().y, this.getSize().w, this.getSize().h);
    this.ctx.fillStyle = "white";
    this.ctx.font = "30px Arial";
    // this.ctx.fillText(this.playerName, this.getPos().x, this.getPos().y + this.getSize().h / 2);
    this.ctx.fillText(this.playerName, this.getPos().x, this.getPos().y + this.getSize().h + 10);
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

let b = new Player(20, 20, 100, 100, ctx, "brown", "hehe");

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

function drawContent(timestamp) {
  let deltaTime = timestamp - lastTime;
  lastTime = timestamp;
  ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  ctx.drawImage(spacebgImg, 0, 0, width, height);

  for (input in remotePlayerInputs) {
    if (players && Object.keys(players).length > 0 && remotePlayerInputs[input] && input) {
      if (remotePlayerInputs[input].heldDown == true) {
        if (remotePlayerInputs[input].inputValue == "A" && players[input].getPos().x > 0) {
          players[input].direction = -players[input].moveSpeed;
        } else if (
          remotePlayerInputs[input].inputValue == "B" &&
          players[input].getPos().x < width - players[input].getSize().w
        ) {
          players[input].direction = players[input].moveSpeed;
        } else {
          players[input].direction = 0;
        }
      } else {
        if (players[input]) {
          players[input].direction = 0;
        }
      }
    }
  }

  for (exploion in booms) {
    booms[exploion].boom(deltaTime);
  }

  // for (input in remotePlayerInputs) {
  //   if (players && Object.keys(players).length > 0 && remotePlayerInputs[input] && input) {
  //     for (inp in remotePlayerInputs[input]) {
  //       if (remotePlayerInputs[input][inp].heldDown == true) {
  //         console.log("HELD DOWN", inp, input, remotePlayerInputs[input][inp], remotePlayerInputs[input][inp].heldDown);
  //         if (inp == "A" && players[input].getPos().x > 0) {
  //           players[input].direction = -players[input].moveSpeed;
  //         } else if (inp == "B" && players[input].getPos().x < width - players[input].getSize().w) {
  //           players[input].direction = players[input].moveSpeed;
  //         } else {
  //           players[input].direction = 0;
  //         }
  //       } else {
  //         if (players[input]) {
  //           players[input].direction = 0;
  //         }
  //       }
  //     }
  //   }
  // }

  for (const player in players) {
    players[player].drawPlayer();
    players[player].updatePos();

    for (powerup in droppingPowerups) {
      droppingPowerups[powerup].drawAndDropPowerup();
      if (isColliding(droppingPowerups[powerup], players[player])) {
        players[player].setPowerup(droppingPowerups[powerup].powerUpValue);
        delete droppingPowerups[powerup];
      }
    }

    for (bomb in droppedBombsList) {
      droppedBombsList[bomb].drawAndDropBomb(deltaTime);
      // console.log(droppedBombsList[bomb]);
      if (isColliding(players[player], droppedBombsList[bomb])) {
        delete droppedBombsList[bomb];
        socket.emit("hapticResponse", { responseTo: player, eventType: "dropBombDestroyed" });
      }
      for (bullet in bullets) {
        bullets[bullet].DrawAndMoveBulletUp(deltaTime);
        if (isColliding(droppedBombsList[bomb], bullets[bullet])) {
          droppedBombsList[bomb].stopDroppingBombAndDestroy();
          let newBoomid = generateRandomID(4);
          let newBoom = new Explosion(
            droppedBombsList[bomb].getPos().x,
            droppedBombsList[bomb].getPos().y,
            50,
            50,
            ctx,
            newBoomid
          );
          booms[newBoomid] = newBoom;
          socket.emit("boomSound", { clientname: bullets[bullet].ownerName });
          delete droppedBombsList[bomb];
          delete bullets[bullet];
          // socket.emit("playersScore", bullets[bullet].ownerName);
        }
      }
    }
  }

  requestAnimationFrame(drawContent);
}

requestAnimationFrame(drawContent);

setInterval(() => {
  if (Object.keys(players).length > 0) {
    let newBombId = generateRandomID(4);
    let xmax = width - 50;
    let xmin = 50;
    let ymax = -10;
    let ymin = -50;
    let bombx = Math.floor(Math.random() * (xmax - xmin + 1)) + xmin;
    let bomby = Math.floor(Math.random() * (ymax - ymin + 1)) + ymin;
    let bomb = new DroppingBombs(bombx, bomby, 60, 60, ctx, newBombId);
    droppedBombsList[newBombId] = bomb;
  }
}, 500);

setInterval(() => {
  if (Object.keys(players).length > 0) {
    let newPowerUpid = generateRandomID(4);
    let xmax = width - 50;
    let xmin = 50;
    let ymax = -10;
    let ymin = -50;
    let powerupx = Math.floor(Math.random() * (xmax - xmin + 1)) + xmin;
    let powerupy = Math.floor(Math.random() * (ymax - ymin + 1)) + ymin;
    let powerup = new powerUps(powerupx, powerupy, 60, 60, ctx, newPowerUpid);
    droppingPowerups[newPowerUpid] = powerup;
  }
}, 10000);

document.addEventListener("DOMContentLoaded", () => {
  socket.connect();
});

socket.on("connect", () => {
  socket.emit("gameViewerConnected");
});

socket.on("playerjoined", (data) => {
  console.log(data);
  let r = Math.floor(Math.random() * (256 - 0 + 1)) + 0;
  let g = Math.floor(Math.random() * (256 - 0 + 1)) + 0;
  let b = Math.floor(Math.random() * (256 - 0 + 1)) + 0;
  let randomXStart = Math.floor(Math.random() * (width - playerSize - playerSize + 1)) + playerSize;
  console.log(`rgb(${r},${g}, ${b})`);
  let newPlayer = new Player(randomXStart, height - 200, playerSize, playerSize, ctx, `rgb(${r},${g}, ${b})`, data);
  players[data] = newPlayer;
});

socket.on("confirm", (data) => {
  console.log(data);
});

socket.on("playerInputs", (data) => {
  // if (Object.keys(remotePlayerInputs).length <= 0) {
  //   remotePlayerInputs[data.playerName] = {};
  // } else {
  //   remotePlayerInputs[data.playerName][data.inputValue] = data;
  // }
  remotePlayerInputs[data.playerName] = data;
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

        let bullet = new Bullet(bulletx, bullety, 10, 10, ctx, bulletid, data.playerName);
        console.log(bullet);
        bullets[`${bulletid}`] = bullet;
      }
    }
  }

  // playerInputs.innerHTML += JSON.stringify(data);
});

socket.on("disconnect", () => {
  console.log("Viewer disconnected");
});
