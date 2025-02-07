const users = require("./users.json");

class UserConfig {
  constructor(usersEnv) {
    const data = usersEnv ? JSON.parse(usersEnv) : users;
    this.users = data.users || [];
    this.teams = data.teams || {};
  }

  getAllUsers() {
    return this.users;
  }

  getEnabledUsers() {
    return this.users.filter((user) => user.checkEnabled);
  }

  getUserById(id) {
    return this.users.find((user) => user.id === id);
  }

  getUsersByTeam(team) {
    return this.users.filter((user) => user.team === team);
  }

  getTeams() {
    return this.teams;
  }
}

module.exports = UserConfig;
