import { EntityOnInternalMessageInput, events } from "@slflows/sdk/v1";
import { issueWebhookDataSchema, webhookEventBase } from "./schemas";

/** Envelope shape for `Issue` + `update` webhooks. */
const issueUpdatedEventSchema = {
  ...webhookEventBase,
  properties: {
    ...webhookEventBase.properties,
    data: issueWebhookDataSchema,
    organizationId: { type: "string" },
    updatedFrom: {
      type: "object",
      description:
        "Prior values of fields that changed in this update. Only keys that actually changed are present.",
      additionalProperties: true,
    },
  },
  required: [
    ...webhookEventBase.required,
    "data",
    "organizationId",
    "updatedFrom",
  ],
};

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
      type: issueUpdatedEventSchema,
    },
  },
};
