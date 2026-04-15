import { AppBlock, events } from "@slflows/sdk/v1";
import { createLinearClient } from "../../utils/linearClient";
import { issueDetailSchema } from "./schemas";

export const getIssue: AppBlock = {
  name: "Get Issue",
  description: "Get a Linear issue by ID",
  category: "Issues",

  inputs: {
    default: {
      config: {
        issueId: {
          name: "Issue ID",
          type: "string",
          required: true,
        },
      },
      onEvent: async (input) => {
        const apiKey = input.app.config.apiKey as string;
        const { issueId } = input.event.inputConfig as Record<string, unknown>;

        const client = createLinearClient(apiKey);
        const issue = await client.issue(issueId as string);

        const [state, team, assignee, project, labels] = await Promise.all([
          issue.state,
          issue.team,
          issue.assignee,
          issue.project,
          issue.labels(),
        ]);

        await events.emit({
          id: issue.id,
          identifier: issue.identifier,
          title: issue.title,
          description: issue.description ?? null,
          url: issue.url,
          priority: issue.priority,
          estimate: issue.estimate ?? null,
          dueDate: issue.dueDate ?? null,
          state: state ? { id: state.id, name: state.name } : null,
          team: team ? { id: team.id, name: team.name, key: team.key } : null,
          assignee: assignee
            ? { id: assignee.id, name: assignee.name, email: assignee.email }
            : null,
          project: project
            ? { id: project.id, name: project.name, url: project.url }
            : null,
          labels: labels.nodes.map((l) => ({ id: l.id, name: l.name })),
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Issue",
      description: "The retrieved issue",
      default: true,
      type: issueDetailSchema,
    },
  },
};
