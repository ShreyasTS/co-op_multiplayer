let playerInputs = document.getElementById("playerInputs");
// const socket = io({ autoConnect: false, path: "/viewer" });
const socket = io({ autoConnect: false, path: "/gameController" });

class Entity {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
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

class Player extends Entity {}

class Tree extends Entity {}

let gameCanvas = document.getElementById("gameCanvas");
let ctx = gameCanvas.getContext("2d");
let width = gameCanvas.width;
let height = gameCanvas.height;

ctx.fillStyle = "brown";
ctx.fillRect(width / 2 - 20, height / 2 + 200, 40, 100); // X Y W H

document.addEventListener("DOMContentLoaded", () => {
  socket.connect();
});

socket.on("connect", () => {
  socket.emit("gameViewerConnected");
});

socket.on("playerjoined", (data) => {
  console.log(data);
});

socket.on("confirm", (data) => {
  console.log(data);
});

socket.on("playerInputs", (data) => {
  playerInputs.innerHTML += JSON.stringify(data);
});

socket.on("disconnect", () => {
  console.log("Viewer disconnected");
});
