import { AppBlock, events } from "@slflows/sdk/v1";
import { createLinearClient } from "../utils/linearClient";

export const runGraphqlQuery: AppBlock = {
  name: "Run GraphQL Query",
  description: "Execute any GraphQL query or mutation against the Linear API",
  category: "Advanced",

  inputs: {
    default: {
      config: {
        query: {
          name: "Query",
          description: "The GraphQL query or mutation string",
          type: "string",
          required: true,
        },
        variables: {
          name: "Variables",
          description: "JSON-encoded variables object",
          type: "string",
          required: false,
          default: "{}",
        },
      },
      onEvent: async (input) => {
        const apiKey = input.app.config.apiKey as string;
        const query = input.event.inputConfig.query as string;
        const variablesRaw = input.event.inputConfig.variables as
          | string
          | undefined;

        const variables = variablesRaw ? JSON.parse(variablesRaw) : {};

        const client = createLinearClient(apiKey);
        const response = await client.client.rawRequest(query, variables);

        await events.emit({
          data: response.data,
          status: response.status,
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Result",
      description: "The GraphQL response",
      default: true,
      type: {
        type: "object",
        properties: {
          data: { type: "object" },
          status: { type: "number" },
        },
        required: ["data", "status"],
        additionalProperties: true,
      },
    },
  },
};
