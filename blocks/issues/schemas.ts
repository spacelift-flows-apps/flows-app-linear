/** Shared JSON-schema fragments for block output definitions. */

export const stateSchema = {
  type: "object" as const,
  properties: {
    id: { type: "string" },
    name: { type: "string" },
  },
  required: ["id", "name"],
};

export const teamSchema = {
  type: "object" as const,
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    key: { type: "string" },
  },
  required: ["id", "name", "key"],
};

export const issueMutationResultSchema = {
  type: "object" as const,
  properties: {
    id: { type: "string" },
    identifier: { type: "string" },
    title: { type: "string" },
    url: { type: "string" },
    state: stateSchema,
    team: teamSchema,
  },
  required: ["id", "identifier", "title", "url", "state", "team"],
};
