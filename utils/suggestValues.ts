import memoizee from "memoizee";
import { createLinearClient } from "./linearClient";

// --- Cached fetchers ---

async function fetchTeams(apiKey: string) {
  const client = createLinearClient(apiKey);
  const result = await client.teams({ first: 50 });
  return result.nodes.map((t) => ({ id: t.id, name: t.name, key: t.key }));
}

async function fetchWorkflowStates(apiKey: string, teamId: string) {
  const client = createLinearClient(apiKey);
  const team = await client.team(teamId);
  const result = await team.states({ filter: { archivedAt: { null: true } } });
  return result.nodes.map((s) => ({ id: s.id, name: s.name, type: s.type }));
}

async function fetchProjects(apiKey: string) {
  const client = createLinearClient(apiKey);
  const result = await client.projects({ first: 250 });
  return result.nodes.map((p) => ({ id: p.id, name: p.name }));
}

async function fetchPriorities(apiKey: string) {
  const client = createLinearClient(apiKey);
  const values = await client.issuePriorityValues;
  return values.map((p) => ({ label: p.label, priority: p.priority }));
}

const getTeams = memoizee(fetchTeams, { maxAge: 60000, promise: true });
const getWorkflowStates = memoizee(fetchWorkflowStates, {
  maxAge: 60000,
  promise: true,
});
const getProjects = memoizee(fetchProjects, { maxAge: 60000, promise: true });
const getPriorities = memoizee(fetchPriorities, {
  maxAge: 60000,
  promise: true,
});

// --- Helper to filter by searchPhrase ---

function filterBySearch<V extends string | number>(
  values: { label: string; value: V }[],
  searchPhrase?: string,
) {
  if (!searchPhrase) return values.slice(0, 50);
  const lower = searchPhrase.toLowerCase();
  return values
    .filter((v) => v.label.toLowerCase().includes(lower))
    .slice(0, 50);
}

// --- Reusable input config objects ---

export const teamIdConfig = {
  name: "Team",
  type: "string" as const,
  required: true as const,
  suggestValues: async (input: any) => {
    const apiKey = input.app.config.apiKey as string;
    const teams = await getTeams(apiKey);
    const values = teams.map((t) => ({
      label: `${t.name} (${t.key})`,
      value: t.id,
    }));
    return { suggestedValues: filterBySearch(values, input.searchPhrase) };
  },
};

export const stateIdConfig = {
  name: "Status",
  type: "string" as const,
  required: false as const,
  suggestValues: async (input: any) => {
    const apiKey = input.app.config.apiKey as string;
    const client = createLinearClient(apiKey);

    // Prefer an explicit teamId from the block's static config (Create Issue,
    // or Update Issue when moving teams). Otherwise, fall back to the team of
    // the issue being updated, if an issueId is statically configured.
    let teamId = input.staticInputConfig?.teamId as string | undefined;
    if (!teamId) {
      const issueId = input.staticInputConfig?.issueId as string | undefined;
      if (issueId) {
        const issue = await client.issue(issueId);
        const team = await issue.team;
        teamId = team?.id;
      }
    }
    if (!teamId) {
      return {
        suggestedValues: [],
        message:
          "Configure static value for Team or Issue ID to receive suggestions.",
      };
    }
    const states = await getWorkflowStates(apiKey, teamId);
    const values = states.map((s) => ({
      label: `${s.name} (${s.type})`,
      value: s.id,
    }));
    return { suggestedValues: filterBySearch(values, input.searchPhrase) };
  },
};

export const projectIdConfig = {
  name: "Project",
  type: "string" as const,
  required: false as const,
  suggestValues: async (input: any) => {
    const apiKey = input.app.config.apiKey as string;
    const projects = await getProjects(apiKey);
    const values = projects.map((p) => ({
      label: p.name,
      value: p.id,
    }));
    return { suggestedValues: filterBySearch(values, input.searchPhrase) };
  },
};

export const priorityConfig = {
  name: "Priority",
  type: "number" as const,
  required: false as const,
  suggestValues: async (input: any) => {
    const apiKey = input.app.config.apiKey as string;
    const priorities = await getPriorities(apiKey);
    const values = priorities.map((p) => ({
      label: p.label,
      value: p.priority,
    }));
    return { suggestedValues: filterBySearch(values, input.searchPhrase) };
  },
};
