import { AppBlock, events } from "@slflows/sdk/v1";
import { createLinearClient } from "../../utils/linearClient";
import {
  teamIdConfig,
  stateIdConfig,
  priorityConfig,
  projectIdConfig,
} from "../../utils/suggestValues";

export const searchIssues: AppBlock = {
  name: "Search Issues",
  description: "Search for issues in Linear with filters",
  category: "Issues",

  inputs: {
    default: {
      config: {
        query: {
          name: "Search Query",
          description:
            "Free-text search term. Matches against issue title and description (case-insensitive).",
          type: "string",
          required: false,
        },
        teamId: { ...teamIdConfig, required: false as const },
        stateId: stateIdConfig,
        assigneeHandle: {
          name: "Assignee Handle",
          description: "Linear user handle (e.g. aubergenius)",
          type: "string",
          required: false,
        },
        labelName: {
          name: "Label",
          description: "Filter to issues with this label (case-sensitive)",
          type: "string",
          required: false,
        },
        priority: priorityConfig,
        projectId: projectIdConfig,
        maxResults: {
          name: "Max Results",
          type: "number",
          required: false,
          default: 10,
        },
        includeArchived: {
          name: "Include Archived",
          type: "boolean",
          required: false,
          default: false,
        },
      },
      onEvent: async (input) => {
        const apiKey = input.app.config.apiKey as string;
        const {
          query,
          teamId,
          stateId,
          assigneeHandle,
          labelName,
          priority,
          projectId,
          maxResults,
          includeArchived,
        } = input.event.inputConfig as Record<string, unknown>;

        const client = createLinearClient(apiKey);

        const filter: Record<string, unknown> = {};
        if (teamId) filter.team = { id: { eq: teamId } };
        if (stateId) filter.state = { id: { eq: stateId } };
        if (assigneeHandle) {
          filter.assignee = { displayName: { eq: assigneeHandle } };
        }
        if (labelName) filter.labels = { name: { eq: labelName } };
        if (priority !== undefined) filter.priority = { eq: priority };
        if (projectId) filter.project = { id: { eq: projectId } };
        if (query) {
          filter.or = [
            { title: { containsIgnoreCase: query } },
            { description: { containsIgnoreCase: query } },
          ];
        }

        const first = (maxResults as number | undefined) ?? 10;
        const archived = (includeArchived as boolean | undefined) ?? false;

        const result = await client.issues({
          first,
          includeArchived: archived,
          filter,
        });

        const results = result.nodes.map((issue) => ({
          id: issue.id,
          identifier: issue.identifier,
          title: issue.title,
          url: issue.url,
          priority: issue.priority,
        }));

        await events.emit({ results });
      },
    },
  },

  outputs: {
    default: {
      name: "Search Results",
      description: "Matching issues",
      default: true,
      type: {
        type: "object",
        properties: {
          results: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                identifier: { type: "string" },
                title: { type: "string" },
                url: { type: "string" },
                priority: { type: "number" },
              },
              required: ["id", "identifier", "title", "url", "priority"],
            },
          },
        },
        required: ["results"],
      },
    },
  },
};
