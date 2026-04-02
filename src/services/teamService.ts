import type { Team } from "@/types";

const DEMO_TEAMS: Team[] = [
  {
    id: "t1",
    name: "Produto Digital",
    company: "EstágioTrack",
    groupCode: "GRP-2026-A",
    memberIds: ["u2"],
    active: true,
  },
  {
    id: "t2",
    name: "Data & Operações",
    company: "EstágioTrack",
    groupCode: "GRP-2026-B",
    memberIds: ["u3"],
    active: true,
  },
];

function readTeams(): Team[] {
  if (typeof window === "undefined") return DEMO_TEAMS;
  const stored = localStorage.getItem("estagio_teams");
  if (stored) return JSON.parse(stored) as Team[];
  localStorage.setItem("estagio_teams", JSON.stringify(DEMO_TEAMS));
  return DEMO_TEAMS;
}

function writeTeams(teams: Team[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("estagio_teams", JSON.stringify(teams));
}

class TeamService {
  private teams: Team[] = readTeams();

  private refresh(): Team[] {
    this.teams = readTeams();
    return this.teams;
  }

  getAll(): Team[] {
    return this.refresh();
  }

  getActive(): Team[] {
    return this.refresh().filter((team) => team.active);
  }

  getById(id: string): Team | undefined {
    return this.refresh().find((team) => team.id === id);
  }

  create(team: Omit<Team, "id" | "createdAt" | "updatedAt">): Team {
    const newTeam: Team = {
      ...team,
      id: `t${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.teams = [...this.refresh(), newTeam];
    writeTeams(this.teams);
    return newTeam;
  }

  update(id: string, updates: Partial<Team>): Team {
    const teams = this.refresh();
    const index = teams.findIndex((team) => team.id === id);
    if (index === -1) throw new Error("Team not found");
    const updated: Team = {
      ...teams[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    teams[index] = updated;
    this.teams = teams;
    writeTeams(this.teams);
    return updated;
  }

  toggleActive(id: string, active: boolean): Team {
    return this.update(id, { active });
  }
}

export const teamService = new TeamService();
