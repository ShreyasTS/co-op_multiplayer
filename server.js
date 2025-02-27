const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { Server } = require("socket.io");
const User = require("./services/User");
const Lobby = require("./services/Lobby");
const fs = require("fs");

const appName = "splitMultiplayer";
let appPort = "";

const app = express();
const server = createServer(app);
const io = new Server(server, { path: "/gameController/" });
const viewerio = new Server(server, { path: "/viewer/" });

app.use(express.static("public"));
app.use(express.static("games"));

let lobbies = [];
let players = [];
let gameViewerSocket;

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "/controllers/simple_3Btn_joystick.html"));
});

app.get("/userTest", (req, res) => {
  res.sendFile(join(__dirname, "/controllers/autoBotTest.html"));
});
app.get("/space", (req, res) => {
  res.sendFile(join(__dirname, "/games/game1/spaceShooter.html"));
});

const randomId = function (length = 5) {
  return Math.random()
    .toString(36)
    .substring(2, length + 2);
};

io.on("connection", (socket) => {
  console.log("New user connected: ", socket.id);
  socket.emit("localip", getLocalIP());

  socket.on("gameViewerConnected", () => {
    gameViewerSocket = socket;
    console.log("GAME VIEWER SOCKET: ", socket.id);
  });

  socket.on("assignName", (data, cb) => {
    let lobbyid = String(randomId()).toUpperCase();
    let newLobby = new Lobby(lobbyid);
    let newPlayer = new User(data.name, socket);
    players.push(newPlayer);
    newPlayer.setLobbyid(lobbyid);
    newLobby.addPlayerToLobby(newPlayer);
    lobbies.push(newLobby);
    socket.join(lobbyid);
    gameViewerSocket.join(lobbyid);
    io.to(gameViewerSocket.id).emit("gameCode", lobbyid);
    io.to(gameViewerSocket.id).emit("playerjoined", data.name);
    cb({ gameid: lobbyid });
  });

  socket.on("joinLobby", (data, cb) => {
    let newPlayer = new User(data.playername, socket);
    players.push(newPlayer);
    lobbies.push(data.playername);
    socket.join(String(data.gameid).toUpperCase());
    // socket.to(data.gameid).emit("playerjoined", `New Player joined! ${data.playername}`);
    gameViewerSocket.join(data.gameid);
    io.to(gameViewerSocket.id).emit("gameCode", data.gameid);
    cb({ status: "OK" });
    io.to(gameViewerSocket.id).emit("playerjoined", data.playername);
  });

  socket.on("refreshGameScreen", () => {
    io.to(gameViewerSocket.id).emit("refreshGameScreen");
  });

  socket.on("starGameConfirm", (data) => {
    io.to(gameViewerSocket.id).emit("starGameConfirm", data.playerName);
  });

  socket.on("userInput", (data) => {
    if (gameViewerSocket) {
      io.to(gameViewerSocket.id).emit("playerInputs", data);
      if (data.inputValue == "nuke") {
        Array.from(socket.rooms).forEach((soc) => {
          io.to(soc).emit("boomSound");
          io.to(soc).emit("hapticResponse", "nuke");
        });
      }
    }
  });

  socket.on("boomSound", (data) => {
    players.forEach((player) => {
      if (player.getPlayerName() == data.clientname) {
        io.to(player.playerSocket.id).emit("boomSound");
      }
    });
  });

  socket.on("difficultyType", (data) => {
    Array.from(socket.rooms).forEach((soc) => {
      io.to(soc).emit("difficultyType", data);
    });
  });

  socket.on("hapticResponse", (data) => {
    players.forEach((player) => {
      if (player.getPlayerName() == data.responseTo) {
        io.to(player.playerSocket.id).emit("hapticResponse", data.eventType);
      }
    });
  });

  socket.on("playerScore", (data) => {
    players.forEach((player) => {
      if (player.getPlayerName() == data.playerName) {
        io.to(player.playerSocket.id).emit("playerScore", data.score);
      }
    });
  });

  socket.on("newPowerUpEarned", (data) => {
    players.forEach((player) => {
      if (player.getPlayerName() == data.givenTo) {
        io.to(player.playerSocket.id).emit("newPowerUpEarned", data.powerUpType);
      }
    });
  });

  socket.on("playerDied", () => {
    players.forEach((player) => {
      if (player.playerSocket.id == socket.id) {
        io.to(gameViewerSocket.id).emit("playerDied", player.getPlayerName());
      }
    });
  });

  socket.on("disconnect", () => {
    console.log(`Player ${socket.id} left :(`);
    players.forEach((player) => {
      if (player.playerSocket.id == socket.id) {
        io.to(gameViewerSocket.id).emit("playerDied", player.getPlayerName());
      }
    });
  });
});
// ----------------------------------------------------------------------------------
viewerio.on("connection", (socket) => {
  socket.emit("confirm", "CONNECTED!");
  socket.on("disconnect", () => {
    console.log("Viewer not ready!!!", socket.id);
  });
});

const os = require("os");

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  let ips = ["127.0.0.1"];
  for (let interfaceName in interfaces) {
    for (let iface of interfaces[interfaceName]) {
      if (iface.family === "IPv4" && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  let localip;
  ips.forEach((ip) => {
    if (String(ip).includes("192")) {
      console.log(ip);
      localip = ip;
    }
  });
  return localip;
}

fs.readFile("../../app_ports.json", "utf8", (err, data) => {
  appPort = JSON.parse(data)[appName];
  server.listen(3000, () => {
    console.log(`[${appName}] - server running at http://localhost:${appPort}`);
  });
});
