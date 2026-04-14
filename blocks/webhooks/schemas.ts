/** Shared JSON-schema fragments for webhook block output definitions. */

export const webhookEventSchema = {
  type: "object" as const,
  properties: {
    action: { type: "string" },
    type: { type: "string" },
    data: { type: "object", additionalProperties: true },
    createdAt: { type: "string" },
  },
  required: ["action", "type", "data", "createdAt"],
};
