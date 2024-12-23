let playerInputs = document.getElementById("playerInputs");
// const socket = io({ autoConnect: false, path: "/viewer" });
const socket = io({ autoConnect: false, path: "/gameController" });
let players = {};
let bullets = {};
let droppedBombsList = {};

let gameCanvas = document.getElementById("gameCanvas");
let ctx = gameCanvas.getContext("2d");
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
}
class GameManager {
  constructor() {}

  addPlayer(playerName) {}
}

class Bullet extends Entity {
  constructor(x, y, w, h, ctx) {
    super(x, y, w, h, ctx);
    this.velocity = 10;
  }

  DrawAndMoveBulletUp(deltaTime) {
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(this.getPos().x, this.getPos().y, this.getSize().w, this.getSize().h);
    this.setPos(this.getPos().x, this.getPos().y - this.velocity) / deltaTime;
  }
}

class Player extends Entity {}

const generateRandomID = (length) =>
  Array.from(
    { length },
    () => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 62)]
  ).join("");

class DroppingBombs extends Entity {
  constructor(x, y, w, h, ctx, bombId) {
    super(x, y, w, h, ctx);
    this.bombId = bombId;
  }

  drawAndDropBomb(deltaTime) {
    this.ctx.fillStyle = "red";
    this.ctx.fillRect(this.getPos().x, this.getPos().y, this.getSize().w, this.getSize().h);
    this.setPos(this.getPos().x, this.getPos().y + 10) / deltaTime;
  }
}

class TreeBlock extends Entity {
  constructor(x, y, w, h, ctx, color, name = "") {
    super(x, y, w, h, ctx);
    this.color = color;
    this.playerName = name;
  }

  drawTreeBlock() {
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(this.getPos().x, this.getPos().y, this.getSize().w, this.getSize().h);
  }

  // moveTreeBlockRight(xPix, deltaTime) {
  //   this.setPos(this.getPos().x + xPix, this.getPos().y) / deltaTime;
  // }
  // moveTreeBlockLeft(xPix, deltaTime) {
  //   this.setPos(this.getPos().x - xPix, this.getPos().y) / deltaTime;
  // }
}

// ctx.fillStyle = "brown";
// ctx.fillRect(width / 2 - 20, height / 2 + 200, 40, 100); // X Y W H
let b = new TreeBlock(20, 20, 100, 100, ctx, "brown", "hehe");

let lastTime = 0;
let remotePlayerInputs = {};
let bullet = new Bullet(200, 200, 10, 10, ctx);

function drawContent(timestamp) {
  let deltaTime = timestamp - lastTime;
  lastTime = timestamp;
  ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

  for (const bullet in bullets) {
    bullets[bullet].DrawAndMoveBulletUp(deltaTime);
  }

  for (const player in players) {
    players[player].drawTreeBlock();
  }

  for (bomb in droppedBombsList) {
    droppedBombsList[bomb].drawAndDropBomb(deltaTime);
  }

  // setInterval(() => {
  //   console.log("newBOMB!! 💥");
  // }, 3000);

  requestAnimationFrame(drawContent);
}

requestAnimationFrame(drawContent);

setInterval(() => {
  let newBombId = generateRandomID(4);
  console.log(newBombId);
  let xmax = 800;
  let xmin = 10;
  let ymax = -10;
  let ymin = -50;
  let bombx = Math.floor(Math.random() * (xmax - xmin + 1)) + xmin;
  let bomby = Math.floor(Math.random() * (ymax - ymin + 1)) + ymin;
  let bomb = new DroppingBombs(bombx, bomby, 20, 20, ctx, newBombId);
  droppedBombsList[newBombId] = bomb;
}, 2000);

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
  let newPlayer = new TreeBlock(15, 350, 50, 50, ctx, `rgb(${r},${g}, ${b})`, data);
  players[data] = newPlayer;
});

socket.on("confirm", (data) => {
  console.log(data);
});

socket.on("playerInputs", (data) => {
  if (data.held == true) {
    remotePlayerInputs = data;
  } else {
    if (data.inputValue == "B" && players[data.playerName].getPos().x + players[data.playerName].getSize().w < width) {
      players[data.playerName].setPos(players[data.playerName].getPos().x + 10, players[data.playerName].getPos().y);
      // players[data.playerName].moveTreeplayers[data.playerName]lockRight(5, deltaTime);
    } else if (data.inputValue == "A" && players[data.playerName].getPos().x > 0) {
      players[data.playerName].setPos(players[data.playerName].getPos().x - 10, players[data.playerName].getPos().y);
      // players[data.playerName].moveTreeplayers[data.playerName]lockLeft(5, deltaTime);
    } else if (data.inputValue == "SHOOT") {
      let bullet = new Bullet(
        players[data.playerName].getPos().x + players[data.playerName].getSize().w / 2,
        players[data.playerName].getPos().y,
        5,
        5,
        ctx
      );
      bullets[`${data.playerName}`] = bullet;
      console.log("SHOOT", data);
    }
  }
  // playerInputs.innerHTML += JSON.stringify(data);
});

socket.on("disconnect", () => {
  console.log("Viewer disconnected");
});
