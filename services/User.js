class User {
  constructor(playerName, playerSocket, playerSocketId) {
    this.playerName = playerName;
    this.playerSocket = playerSocket;
    this.setPlayerControllerSocket;
    this.playerSocketId = playerSocketId;
    this.lobbyid = "";
  }

  getPlayerName() {
    return this.playerName;
  }

  setPlayerControllerSocket(controllerSocket) {
    this.controllerSocket = controllerSocket;
  }

  setLobbyid(lobbyid) {
    this.lobbyid = lobbyid;
  }
}
module.exports = User;