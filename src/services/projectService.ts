import type { Project } from "@/types";

const DEMO_PROJECTS: Project[] = [
  {
    id: "p1",
    name: "Portal Interno",
    code: "INT-01",
    description: "Backoffice de acompanhamento diário dos estagiários.",
    teamId: "t1",
    color: "#1a56db",
    active: true,
  },
  {
    id: "p2",
    name: "Aplicação X",
    code: "APP-02",
    description: "Funcionalidades de registo, métricas e relatórios.",
    teamId: "t1",
    color: "#0f172a",
    active: true,
  },
  {
    id: "p3",
    name: "Data Hub",
    code: "DATA-03",
    description: "Organização do schema e integração com Supabase.",
    teamId: "t2",
    color: "#0ea5e9",
    active: true,
  },
];

function readProjects(): Project[] {
  if (typeof window === "undefined") return DEMO_PROJECTS;
  const stored = localStorage.getItem("estagio_projects");
  if (stored) return JSON.parse(stored) as Project[];
  localStorage.setItem("estagio_projects", JSON.stringify(DEMO_PROJECTS));
  return DEMO_PROJECTS;
}

function writeProjects(projects: Project[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("estagio_projects", JSON.stringify(projects));
}

class ProjectService {
  private projects: Project[] = readProjects();

  private refresh(): Project[] {
    this.projects = readProjects();
    return this.projects;
  }

  getAll(): Project[] {
    return this.refresh();
  }

  getActive(): Project[] {
    return this.refresh().filter((project) => project.active);
  }

  getById(id: string): Project | undefined {
    return this.refresh().find((project) => project.id === id);
  }

  create(project: Omit<Project, "id" | "createdAt" | "updatedAt">): Project {
    const newProject: Project = {
      ...project,
      id: `p${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.projects = [...this.refresh(), newProject];
    writeProjects(this.projects);
    return newProject;
  }

  update(id: string, updates: Partial<Project>): Project {
    const projects = this.refresh();
    const index = projects.findIndex((project) => project.id === id);
    if (index === -1) throw new Error("Project not found");
    const updated: Project = {
      ...projects[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    projects[index] = updated;
    this.projects = projects;
    writeProjects(this.projects);
    return updated;
  }

  toggleActive(id: string, active: boolean): Project {
    return this.update(id, { active });
  }
}

export const projectService = new ProjectService();
