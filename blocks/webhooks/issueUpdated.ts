import { EntityOnInternalMessageInput, events } from "@slflows/sdk/v1";

export const issueUpdated = {
  name: "Issue Updated",
  description: "Triggers when an issue is updated in Linear",
  category: "Events",
  entrypoint: true,

  onInternalMessage: async (input: EntityOnInternalMessageInput) => {
    await events.emit(input.message.body);
  },

  outputs: {
    default: {
      name: "Issue Updated Event",
      description: "Linear webhook payload for an Issue update event",
      default: true,
      type: {
        type: "object",
        properties: {
          action: { type: "string" },
          type: { type: "string" },
          data: { type: "object" },
          createdAt: { type: "string" },
        },
        required: ["action", "type", "data", "createdAt"],
      },
    },
  },
};
