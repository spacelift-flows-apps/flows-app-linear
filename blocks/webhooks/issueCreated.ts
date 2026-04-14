import { EntityOnInternalMessageInput, events } from "@slflows/sdk/v1";
import { webhookEventSchema } from "./schemas";

export const issueCreated = {
  name: "Issue Created",
  description: "Triggers when a new issue is created in Linear",
  category: "Events",
  entrypoint: true,

  onInternalMessage: async (input: EntityOnInternalMessageInput) => {
    await events.emit(input.message.body);
  },

  outputs: {
    default: {
      name: "Issue Created Event",
      description: "Linear webhook payload for an Issue create event",
      default: true,
      type: webhookEventSchema,
    },
  },
};
