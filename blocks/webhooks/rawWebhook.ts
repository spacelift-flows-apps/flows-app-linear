import { EntityOnInternalMessageInput, events } from "@slflows/sdk/v1";
import { RESOURCE_TYPES } from "../../utils/constants";

export const rawWebhook = {
  name: "Any Event",
  description: "Receives any event from Linear (escape hatch)",
  category: "Events",
  entrypoint: true,

  config: {
    resourceType: {
      name: "Resource Type",
      description: "Filter by resource type. Leave empty to receive all types.",
      type: "string" as const,
      required: false,
      suggestValues: async (input: { searchPhrase?: string }) => {
        const values = RESOURCE_TYPES.map((t) => ({ value: t, label: t }));

        if (input.searchPhrase) {
          const search = input.searchPhrase.toLowerCase();
          return {
            suggestedValues: values.filter((v) =>
              v.label.toLowerCase().includes(search),
            ),
          };
        }

        return { suggestedValues: values };
      },
    },
    action: {
      name: "Action",
      description: "Filter by action. Leave empty to receive all actions.",
      type: "string" as const,
      required: false,
      suggestValues: async (input: { searchPhrase?: string }) => {
        const values = [
          { value: "create", label: "Create" },
          { value: "update", label: "Update" },
          { value: "remove", label: "Remove" },
        ];

        if (input.searchPhrase) {
          const search = input.searchPhrase.toLowerCase();
          return {
            suggestedValues: values.filter((v) =>
              v.label.toLowerCase().includes(search),
            ),
          };
        }

        return { suggestedValues: values };
      },
    },
  },

  onInternalMessage: async (input: EntityOnInternalMessageInput) => {
    const resourceType = input.block.config.resourceType as string | undefined;
    const action = input.block.config.action as string | undefined;
    const payload = input.message.body;

    if (resourceType && payload.type !== resourceType) {
      return;
    }
    if (action && payload.action !== action) {
      return;
    }

    await events.emit(payload);
  },

  outputs: {
    default: {
      name: "Event",
      description: "The raw Linear event payload",
      default: true,
      type: {
        type: "object",
        properties: {
          action: { type: "string" },
          type: { type: "string" },
          data: { type: "object", additionalProperties: true },
          createdAt: { type: "string" },
        },
        required: ["action", "type", "data", "createdAt"],
      },
    },
  },
};
