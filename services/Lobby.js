class Lobby {
  constructor(lobbyid) {
    this.lobbyid = lobbyid;
    this.players = [];
    this.controllerName = "";
    this.lobbyState = ""; //[ IDLE, WAITING, PLAYING ]
  }

  addPlayerToLobby(player) {
    this.players.push(player);
  }
}

module.exports = Lobby;
