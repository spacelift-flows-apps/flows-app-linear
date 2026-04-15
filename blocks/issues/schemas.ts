/** Shared JSON-schema fragments for issue block output definitions. */

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

export const assigneeSchema = {
  type: "object" as const,
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    email: { type: "string" },
  },
  required: ["id", "name", "email"],
};

export const labelSchema = {
  type: "object" as const,
  properties: {
    id: { type: "string" },
    name: { type: "string" },
  },
  required: ["id", "name"],
};

export const projectSchema = {
  type: "object" as const,
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    url: { type: "string" },
  },
  required: ["id", "name", "url"],
};

/** Issue fields without relation lookups — used for list/search results. */
export const issueSummarySchema = {
  type: "object" as const,
  properties: {
    id: { type: "string" },
    identifier: { type: "string" },
    title: { type: "string" },
    description: { type: "string" },
    url: { type: "string" },
    priority: { type: "number" },
    estimate: { type: "number" },
    dueDate: { type: "string" },
  },
  required: ["id", "identifier", "title", "url", "priority"],
};

/** Full issue fields — used for get/create/update results. */
export const issueDetailSchema = {
  type: "object" as const,
  properties: {
    id: { type: "string" },
    identifier: { type: "string" },
    title: { type: "string" },
    description: { type: "string" },
    url: { type: "string" },
    priority: { type: "number" },
    estimate: { type: "number" },
    dueDate: { type: "string" },
    state: stateSchema,
    team: teamSchema,
    assignee: assigneeSchema,
    project: projectSchema,
    labels: { type: "array" as const, items: labelSchema },
  },
  required: ["id", "identifier", "title", "url", "priority"],
};
