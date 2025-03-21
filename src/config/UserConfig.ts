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
      : require('../config/users.json');
    this.users = data.users || [];
    this.teams = data.teams || {};
  }

  getAllUsers(): User[] {
    return this.users;
  }

  getEnabledUsers(): User[] {
    return this.users.filter((user) => user.checkEnabled);
  }

  getTeams(): Teams {
    return this.teams;
  }
}

export default UserConfig;
