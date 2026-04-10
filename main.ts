import { defineApp } from "@slflows/sdk/v1";
import { blocks } from "./blocks/index";

export const app = defineApp({
  name: "Linear",
  installationInstructions:
    "Linear app for Flows focused on issue management.\n\nTo install:\n1. Go to Linear Settings > Account > API > Personal API keys\n2. Create a new API key\n3. Paste the key in the API Key field below\n4. Start using the blocks in your flows",

  blocks,

  config: {
    apiKey: {
      name: "API Key",
      description: "Linear personal API key (Settings > Account > API)",
      type: "string",
      required: true,
      sensitive: true,
    },
  },
});
