let playerInputs = document.getElementById("playerInputs");
// const socket = io({ autoConnect: false, path: "/viewer" });
const socket = io({ autoConnect: false, path: "/gameController" });
let players = {};
let bullets = {};

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

let gameCanvas = document.getElementById("gameCanvas");
let ctx = gameCanvas.getContext("2d");
let width = gameCanvas.width;
let height = gameCanvas.height;

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
    if (players[player].getPos().x + players[player].getSize().w < width) {
      players[player].drawTreeBlock();
      // console.log(remotePlayerInputs);
      // if (remotePlayerInputs.held == true) {
      //   if (remotePlayerInputs.inputValue == "A") {
      //     b.moveTreeBlockLeft(10, deltaTime);
      //   } else if (remotePlayerInputs.inputValue == "B") b.moveTreeBlockLeft(10, deltaTime);
      // }
    }
  }

  requestAnimationFrame(drawContent);
}

requestAnimationFrame(drawContent);

document.addEventListener("DOMContentLoaded", () => {
  socket.connect();
});

socket.on("connect", () => {
  socket.emit("gameViewerConnected");
});

socket.on("playerjoined", (data) => {
  console.log(data);
  let newPlayer = new TreeBlock(15, 150, 100, 100, ctx, "green", data);
  players[data] = newPlayer;
});

socket.on("confirm", (data) => {
  console.log(data);
});

socket.on("playerInputs", (data) => {
  if (data.held == true) {
    remotePlayerInputs = data;
  } else {
    if (data.inputValue == "B") {
      players[data.playerName].setPos(players[data.playerName].getPos().x + 10, players[data.playerName].getPos().y);
      // players[data.playerName].moveTreeplayers[data.playerName]lockRight(5, deltaTime);
    } else if (data.inputValue == "A") {
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
