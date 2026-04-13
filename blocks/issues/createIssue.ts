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

export const createIssue: AppBlock = {
  name: "Create Issue",
  description: "Create a new issue in Linear",
  category: "Issues",

  inputs: {
    default: {
      config: {
        teamId: teamIdConfig,
        title: {
          name: "Title",
          type: "string",
          required: true,
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
            "Comma-separated label names (e.g. Bug, Feature). Case-sensitive.",
          type: "string",
          required: false,
        },
        projectId: projectIdConfig,
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
        parentId: {
          name: "Parent Issue ID",
          type: "string",
          required: false,
        },
      },
      onEvent: async (input) => {
        const apiKey = input.app.config.apiKey as string;
        const {
          teamId,
          title,
          description,
          stateId,
          assigneeHandle,
          priority,
          labelNames: labelNamesRaw,
          projectId,
          estimate,
          dueDate,
          parentId,
        } = input.event.inputConfig as Record<string, unknown>;

        const client = createLinearClient(apiKey);

        const labelIds = labelNamesRaw
          ? await resolveLabelsByName(
              client,
              teamId as string,
              (labelNamesRaw as string)
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            )
          : undefined;

        const assigneeId = assigneeHandle
          ? await resolveUserByHandle(client, assigneeHandle as string)
          : undefined;
        const result = await client.createIssue({
          teamId: teamId as string,
          title: title as string,
          description: description as string | undefined,
          stateId: stateId as string | undefined,
          assigneeId,
          priority: priority as number | undefined,
          labelIds,
          projectId: projectId as string | undefined,
          estimate: estimate as number | undefined,
          dueDate: dueDate as string | undefined,
          parentId: parentId as string | undefined,
        });

        if (!result.success) {
          throw new Error("creating issue: Linear reported failure");
        }
        const issue = await result.issue;
        if (!issue) throw new Error("creating issue: no issue returned");

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
      name: "Created Issue",
      description: "The newly created issue",
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
