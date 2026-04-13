import { LinearClient } from "@linear/sdk";

export function createLinearClient(apiKey: string): LinearClient {
  return new LinearClient({ apiKey });
}

export async function resolveUserByHandle(
  client: LinearClient,
  handle: string,
): Promise<string> {
  const result = await client.users({
    filter: { displayName: { eq: handle } },
  });
  const user = result.nodes[0];
  if (!user) {
    throw new Error(
      `resolving assignee: user with handle "${handle}" not found`,
    );
  }
  return user.id;
}

export async function resolveLabelsByName(
  client: LinearClient,
  teamId: string,
  names: string[],
): Promise<string[]> {
  // Labels can be either team-scoped or workspace-wide (team is null).
  // Include both so workspace labels remain usable when a team is specified.
  const result = await client.issueLabels({
    filter: {
      name: { in: names },
      or: [{ team: { id: { eq: teamId } } }, { team: { null: true } }],
    },
  });
  // Label names are case-sensitive in Linear ("bug" and "Bug" can coexist
  // within the same team), so we match them exactly.
  const found = new Map(result.nodes.map((l) => [l.name, l.id]));
  const missing = names.filter((n) => !found.has(n));
  if (missing.length > 0) {
    throw new Error(
      `resolving labels: labels not found: ${missing.join(", ")}`,
    );
  }
  return names.map((n) => found.get(n)!);
}
