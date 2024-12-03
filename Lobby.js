class Lobby {
  constructor() {
    this.players = [];
    this.controllerName = "";
  }

  addPlayerToLobby(player) {
    this.players.push(player);
  }
}
