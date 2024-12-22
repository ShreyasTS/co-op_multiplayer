const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { Server } = require("socket.io");
const User = require("./services/User");
const Lobby = require("./services/Lobby");

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
  res.sendFile(join(__dirname, "/controllers/simple_3Btn.html"));
});
app.get("/game", (req, res) => {
  res.sendFile(join(__dirname, "/games/game1/index.html"));
});

const randomId = function (length = 6) {
  return Math.random()
    .toString(36)
    .substring(2, length + 2);
};

io.on("connection", (socket) => {
  console.log("New user connected: ", socket.id);

  socket.on("gameViewerConnected", () => {
    console.log("Game viewer Ready!");
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
    console.log(lobbies);
    socket.join(lobbyid);
    io.to(gameViewerSocket.id).emit("playerjoined", data.name);
    cb({ gameid: lobbyid });
  });

  socket.on("joinLobby", (data, cb) => {
    if (lobbies.length <= 0) {
      // let newPlayer = new User(data.name, socket);
      // players.push(newPlayer);
      // console.log("1>", lobbies[data.gameid]);
      // lobbies;
      // lobbies.push(data.playername);
      // socket.join(data.gameid);
      cb({ status: "NOK" });
      // socket.emit("err", { errCode: "0001" });
    } else {
      let newPlayer = new User(data.name, socket);
      players.push(newPlayer);
      console.log("2>", lobbies[data.gameid]);
      lobbies.push(data.playername);
      socket.join(data.gameid);
      cb({ status: "OK" });
      socket.to(data.gameid).emit("playerjoined", `New Player joined! ${data.playername}`);
      console.log(gameViewerSocket.id);
      io.to(gameViewerSocket.id).emit("playerjoined", data.playername);
      console.log("2>", lobbies);
    }
  });

  socket.on("userInput", (data) => {
    console.log(data);
    io.to(gameViewerSocket.id).emit("playerInputs", data);
  });

  socket.on("disconnect", (socket) => {
    console.log(`Player ${socket.id} left :(`);
  });
});
// ----------------------------------------------------------------------------------
viewerio.on("connection", (socket) => {
  console.log("Game viewer Ready!");

  socket.emit("confirm", "CONNECTED!");

  socket.on("disconnect", () => {
    console.log("Viewer not ready!!!", socket.id);
  });
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
