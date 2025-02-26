"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UserConfig {
    constructor(usersEnv) {
        const data = usersEnv
            ? JSON.parse(usersEnv)
            : require("./users.json");
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
exports.default = UserConfig;
//# sourceMappingURL=UserConfig.js.map