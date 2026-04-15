/** JSON-schema fragments shared by more than one webhook block. */

import { stateSchema, teamSchema, assigneeSchema } from "../issues/schemas";

/** Who performed the action that triggered the webhook. */
export const actorSchema = {
  type: "object" as const,
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    email: { type: "string" },
    url: { type: "string" },
    avatarUrl: { type: "string" },
    type: { type: "string", description: "e.g. 'user', 'app'" },
  },
  required: ["id"],
  additionalProperties: true,
};

/**
 * Fields Linear documents as present on every webhook payload. Spread this
 * into per-block schemas and layer event-specific fields on top:
 *
 *   const mySchema = {
 *     ...webhookEventBase,
 *     properties: { ...webhookEventBase.properties, data: myDataSchema },
 *     required: [...webhookEventBase.required, "data"],
 *   };
 */
export const webhookEventBase = {
  type: "object" as const,
  properties: {
    action: { type: "string" },
    type: { type: "string" },
    actor: actorSchema,
    createdAt: { type: "string" },
    url: {
      type: "string",
      description: "Deep-link to the subject entity in Linear.",
    },
    webhookId: { type: "string" },
    webhookTimestamp: { type: "number" },
  },
  required: [
    "action",
    "type",
    "actor",
    "createdAt",
    "url",
    "webhookId",
    "webhookTimestamp",
  ],
  additionalProperties: true,
};

/**
 * Issue as delivered inside an Issue webhook `data` field. Richer than the
 * `issueDetailSchema` we emit from API-backed blocks — Linear's webhook payload
 * inlines IDs and denormalized fields we otherwise don't hydrate.
 */
export const issueWebhookDataSchema = {
  type: "object" as const,
  properties: {
    id: { type: "string" },
    identifier: { type: "string" },
    number: { type: "number" },
    title: { type: "string" },
    description: { type: "string" },
    url: { type: "string" },
    priority: { type: "number" },
    priorityLabel: { type: "string" },
    estimate: { type: "number" },
    dueDate: { type: "string" },
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
    state: stateSchema,
    stateId: { type: "string" },
    team: teamSchema,
    teamId: { type: "string" },
    project: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        url: { type: "string" },
      },
      required: ["id", "name"],
      additionalProperties: true,
    },
    projectId: { type: "string" },
    assignee: assigneeSchema,
    assigneeId: { type: "string" },
    creatorId: { type: "string" },
    labelIds: { type: "array", items: { type: "string" } },
    labels: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          color: { type: "string" },
        },
        required: ["id", "name"],
        additionalProperties: true,
      },
    },
    subscriberIds: { type: "array", items: { type: "string" } },
  },
  required: [
    "id",
    "identifier",
    "title",
    "url",
    "priority",
    "createdAt",
    "updatedAt",
  ],
  additionalProperties: true,
};
