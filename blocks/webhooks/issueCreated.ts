import { EntityOnInternalMessageInput, events } from "@slflows/sdk/v1";
import { issueWebhookDataSchema, webhookEventBase } from "./schemas";

/** Envelope shape for `Issue` + `create` webhooks. */
const issueCreatedEventSchema = {
  ...webhookEventBase,
  properties: {
    ...webhookEventBase.properties,
    data: issueWebhookDataSchema,
    organizationId: { type: "string" },
  },
  required: [...webhookEventBase.required, "data", "organizationId"],
};

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
      type: issueCreatedEventSchema,
    },
  },
};
