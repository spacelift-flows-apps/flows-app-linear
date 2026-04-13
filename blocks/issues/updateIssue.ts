import { AppBlock, events } from "@slflows/sdk/v1";
import {
  createLinearClient,
  resolveUserByHandle,
  resolveLabelsByName,
} from "../../utils/linearClient";
import {
  teamIdConfig,
  stateIdConfig,
  priorityConfig,
  projectIdConfig,
} from "../../utils/suggestValues";

export const updateIssue: AppBlock = {
  name: "Update Issue",
  description: "Update an existing issue in Linear",
  category: "Issues",

  inputs: {
    default: {
      config: {
        issueId: {
          name: "Issue ID",
          type: "string",
          required: true,
        },
        title: {
          name: "Title",
          type: "string",
          required: false,
        },
        description: {
          name: "Description",
          description: "Markdown format",
          type: "string",
          required: false,
        },
        stateId: stateIdConfig,
        assigneeHandle: {
          name: "Assignee Handle",
          description: "Linear user handle (e.g. aubergenius)",
          type: "string",
          required: false,
        },
        priority: priorityConfig,
        labelNames: {
          name: "Labels",
          description:
            "Comma-separated label names (e.g. Bug, Feature). Case-sensitive. Replaces the issue's current labels.",
          type: "string",
          required: false,
        },
        projectId: projectIdConfig,
        teamId: { ...teamIdConfig, required: false as const },
        estimate: {
          name: "Estimate",
          type: "number",
          required: false,
        },
        dueDate: {
          name: "Due Date",
          description: "YYYY-MM-DD format",
          type: "string",
          required: false,
        },
      },
      onEvent: async (input) => {
        const apiKey = input.app.config.apiKey as string;
        const {
          issueId,
          title,
          description,
          stateId,
          assigneeHandle,
          priority,
          labelNames: labelNamesRaw,
          projectId,
          teamId,
          estimate,
          dueDate,
        } = input.event.inputConfig as Record<string, unknown>;

        const client = createLinearClient(apiKey);

        let labelIds: string[] | undefined;
        if (labelNamesRaw) {
          // Labels are team-scoped, so we need a teamId. Use the explicit
          // teamId from the update (if moving teams), otherwise look up the
          // issue's current team.
          let labelTeamId = teamId as string | undefined;
          if (!labelTeamId) {
            const currentIssue = await client.issue(issueId as string);
            const currentTeam = await currentIssue.team;
            if (!currentTeam) {
              throw new Error(
                "updating issue: resolving labels: issue has no team",
              );
            }
            labelTeamId = currentTeam.id;
          }
          labelIds = await resolveLabelsByName(
            client,
            labelTeamId,
            (labelNamesRaw as string)
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          );
        }

        const assigneeId = assigneeHandle
          ? await resolveUserByHandle(client, assigneeHandle as string)
          : undefined;

        const result = await client.updateIssue(issueId as string, {
          title: title as string | undefined,
          description: description as string | undefined,
          stateId: stateId as string | undefined,
          assigneeId,
          priority: priority as number | undefined,
          labelIds,
          projectId: projectId as string | undefined,
          teamId: teamId as string | undefined,
          estimate: estimate as number | undefined,
          dueDate: dueDate as string | undefined,
        });

        if (!result.success) {
          throw new Error("updating issue: Linear reported failure");
        }
        const issue = await result.issue;
        if (!issue) throw new Error("updating issue: no issue returned");

        const state = await issue.state;
        const team = await issue.team;

        await events.emit({
          id: issue.id,
          identifier: issue.identifier,
          title: issue.title,
          url: issue.url,
          state: state ? { id: state.id, name: state.name } : null,
          team: team ? { id: team.id, name: team.name, key: team.key } : null,
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Updated Issue",
      description: "The updated issue",
      default: true,
      type: {
        type: "object",
        properties: {
          id: { type: "string" },
          identifier: { type: "string" },
          title: { type: "string" },
          url: { type: "string" },
          state: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
            },
            required: ["id", "name"],
          },
          team: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              key: { type: "string" },
            },
            required: ["id", "name", "key"],
          },
        },
        required: ["id", "identifier", "title", "url", "state", "team"],
      },
    },
  },
};
