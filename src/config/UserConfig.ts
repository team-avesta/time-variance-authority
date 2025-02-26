export interface User {
  id: string;
  name: string;
  email: string;
  team: string;
  checkEnabled: boolean;
}

interface Teams {
  [key: string]: {
    name: string;
    emoji?: string;
  };
}

interface UserData {
  users: User[];
  teams: Teams;
}

class UserConfig {
  private users: User[];
  private teams: Teams;

  constructor(usersEnv?: string) {
    const data: UserData = usersEnv
      ? JSON.parse(usersEnv)
      : require(require('path').join(__dirname, './users.json'));
    this.users = data.users || [];
    this.teams = data.teams || {};
  }

  getAllUsers(): User[] {
    return this.users;
  }

  getEnabledUsers(): User[] {
    return this.users.filter((user) => user.checkEnabled);
  }

  getUserById(id: string): User | undefined {
    return this.users.find((user) => user.id === id);
  }

  getUsersByTeam(team: string): User[] {
    return this.users.filter((user) => user.team === team);
  }

  getTeams(): Teams {
    return this.teams;
  }
}

export default UserConfig;
