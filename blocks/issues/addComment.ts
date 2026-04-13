import { AppBlock, events } from "@slflows/sdk/v1";
import { createLinearClient } from "../../utils/linearClient";

export const addComment: AppBlock = {
  name: "Add Comment",
  description: "Add a comment to a Linear issue",
  category: "Comments",

  inputs: {
    default: {
      config: {
        issueId: {
          name: "Issue ID",
          type: "string",
          required: true,
        },
        body: {
          name: "Comment Body",
          description: "Markdown format",
          type: "string",
          required: true,
        },
      },
      onEvent: async (input) => {
        const apiKey = input.app.config.apiKey as string;
        const { issueId, body } = input.event.inputConfig as Record<
          string,
          unknown
        >;

        const client = createLinearClient(apiKey);
        const result = await client.createComment({
          issueId: issueId as string,
          body: body as string,
        });

        if (!result.success) {
          throw new Error("adding comment: Linear reported failure");
        }
        const comment = await result.comment;
        if (!comment) throw new Error("adding comment: no comment returned");

        await events.emit({
          id: comment.id,
          body: comment.body,
          url: comment.url,
          createdAt: comment.createdAt.toISOString(),
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Created Comment",
      description: "The newly created comment",
      default: true,
      type: {
        type: "object",
        properties: {
          id: { type: "string" },
          body: { type: "string" },
          url: { type: "string" },
          createdAt: { type: "string" },
        },
        required: ["id", "body", "url", "createdAt"],
      },
    },
  },
};
