import { defineApp } from "@slflows/sdk/v1";
import { blocks as blocksDef, http, messaging } from "@slflows/sdk/v1";
import { blocks } from "./blocks/index";
import { createLinearClient } from "./utils/linearClient";
import {
  ensureWebhook,
  deleteWebhook,
  getStoredWebhook,
  verifySignature,
} from "./utils/webhook";

export const app = defineApp({
  name: "Linear",
  installationInstructions: `Linear app for Flows focused on issue management.

## Setup
1. Go to **Linear Settings > Account > API > Personal API keys**
2. Create a new API key
3. Paste the key in the API Key field below
4. Optionally set a Team Key to scope webhooks to a specific team

## Webhook Management
Webhooks are managed automatically — no manual setup needed.
- The app registers a webhook in Linear on install and cleans it up on uninstall.
- If webhook events stop arriving, trigger a **re-sync** from the Flows UI. The app will detect and fix the issue (re-create if deleted, re-enable if disabled, update URL if changed).
- The webhook URL and status are visible as app signals in the flow editor.

## Supported Webhook Resource Types
Issue, Comment, Project, Cycle, IssueLabel, Reaction, ProjectUpdate.`,

  blocks,

  config: {
    apiKey: {
      name: "API Key",
      description: "Linear personal API key (Settings > Account > API)",
      type: "string",
      required: true,
      sensitive: true,
    },
    teamKey: {
      name: "Team Key",
      description:
        'Scope webhooks to a specific Linear team by its key (e.g. "ENG"). Leave empty to receive events from all public teams.',
      type: "string",
      required: false,
    },
  },

  signals: {
    webhookUrl: {
      name: "Webhook URL",
      description: "The URL Linear sends webhook events to",
    },
    webhookEnabled: {
      name: "Webhook Enabled",
      description: "Whether the webhook is currently active in Linear",
    },
  },

  onSync: async (input) => {
    const client = createLinearClient(input.app.config.apiKey as string);

    await client.viewer;

    const webhookUrl = await ensureWebhook({
      client,
      webhookUrl: input.app.http.url + "/webhook",
      teamKey: input.app.config.teamKey as string | undefined,
    });

    return {
      newStatus: "ready",
      signalUpdates: { webhookUrl, webhookEnabled: true },
    };
  },

  onDrain: async (input) => {
    const client = createLinearClient(input.app.config.apiKey as string);

    await deleteWebhook(client);

    return {
      newStatus: "drained",
      signalUpdates: { webhookUrl: null, webhookEnabled: false },
    };
  },

  http: {
    onRequest: async (input) => {
      if (
        input.request.method !== "POST" ||
        input.request.path !== "/webhook"
      ) {
        await http.respond(input.request.requestId, { statusCode: 404 });
        return;
      }

      const stored = await getStoredWebhook();
      if (!stored) {
        await http.respond(input.request.requestId, { statusCode: 500 });
        return;
      }

      // Case-insensitive header lookup.
      const signatureHeader = Object.keys(input.request.headers).find(
        (h) => h.toLowerCase() === "linear-signature",
      );
      const signature = signatureHeader
        ? input.request.headers[signatureHeader]
        : undefined;

      if (
        !signature ||
        !verifySignature(input.request.rawBody, signature, stored.secret)
      ) {
        await http.respond(input.request.requestId, { statusCode: 401 });
        return;
      }

      const payload = JSON.parse(input.request.rawBody);

      const rawWebhookBlocks = await blocksDef.list({
        typeIds: ["rawWebhook"],
      });
      if (rawWebhookBlocks.blocks.length > 0) {
        await messaging.sendToBlocks({
          blockIds: rawWebhookBlocks.blocks.map((b) => b.id),
          body: payload,
        });
      }

      await http.respond(input.request.requestId, { statusCode: 200 });
    },
  },
});
