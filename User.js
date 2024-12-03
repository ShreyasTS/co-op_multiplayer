class User {
  constructor(playerName, socketCon) {
    this.playerName = playerName;
    this.socketCon = socketCon;
  }

  getPlayerName() {
    return this.playerName;
  }

  getSocketCon() {
    return this.socketCon;
  }
}
