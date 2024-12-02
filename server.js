const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { Server } = require("socket.io");

const app = express();
const server = createServer(app);
const io = new Server(server);

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "controller.html"));
});
app.get("/game", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

io.on("connection", (socket) => {
  console.log("New user connected: ", socket.id);

  socket.on("chat message", (msg) => {
    console.log("message: " + msg);
  });
  socket.on("userInput", (userInputType) => {
    console.log("User input: ", userInputType);
    io.emit("userInputReciever", userInputType);
  });
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
