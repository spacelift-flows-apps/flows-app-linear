import crypto from "crypto";
import { defineApp } from "@slflows/sdk/v1";
import { blocks as blocksDef, http, kv, messaging } from "@slflows/sdk/v1";
import { blocks } from "./blocks/index";
import { createLinearClient } from "./utils/linearClient";

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
    teamKey: {
      name: "Team Key",
      description:
        'Scope webhooks to a specific Linear team by its key (e.g. "ENG"). Leave empty to receive events from all public teams.',
      type: "string",
      required: false,
    },
  },

  onSync: async (input) => {
    const apiKey = input.app.config.apiKey as string;
    const client = createLinearClient(apiKey);

    // Validate credentials.
    await client.viewer;

    const existingWebhookId = await kv.app.get("linear_webhook_id");
    if (existingWebhookId.value) {
      return { newStatus: "ready" };
    }

    // Create a new webhook.
    const webhookUrl = input.app.http.url + "/webhook";
    const secret = crypto.randomBytes(32).toString("hex");

    const teamKey = input.app.config.teamKey as string | undefined;

    let teamId: string | undefined;
    if (teamKey) {
      const teams = await client.teams({
        filter: { key: { eq: teamKey } },
      });
      const team = teams.nodes[0];
      if (!team) {
        throw new Error(`Team with key "${teamKey}" not found`);
      }
      teamId = team.id;
    }

    const payload = await client.createWebhook({
      url: webhookUrl,
      ...(teamId ? { teamId } : { allPublicTeams: true }),
      // All resource types supported by Linear webhooks:
      // https://developers.linear.app/docs/graphql/webhooks
      resourceTypes: [
        "Issue",
        "Comment",
        "Project",
        "Cycle",
        "IssueLabel",
        "Reaction",
        "ProjectUpdate",
      ],
      secret,
    });

    const webhook = await payload.webhook;
    if (!webhook) {
      throw new Error("creating webhook: no webhook returned");
    }

    await kv.app.set({ key: "linear_webhook_id", value: webhook.id });
    await kv.app.set({ key: "linear_webhook_secret", value: secret });

    return { newStatus: "ready" };
  },

  onDrain: async (input) => {
    const apiKey = input.app.config.apiKey as string;
    const client = createLinearClient(apiKey);

    const existingWebhookId = await kv.app.get("linear_webhook_id");
    if (existingWebhookId.value) {
      try {
        await client.deleteWebhook(existingWebhookId.value as string);
      } catch (err) {
        // Re-throw systemic errors (auth, network, rate limit).
        // Ignore others — webhook may have been deleted externally.
        const errType = (err as { type?: string }).type;
        const systemicErrors = [
          "AuthenticationError",
          "Forbidden",
          "Ratelimited",
          "NetworkError",
        ];
        if (errType && systemicErrors.includes(errType)) {
          throw err;
        }
      }
    }

    await kv.app.delete(["linear_webhook_id", "linear_webhook_secret"]);

    return { newStatus: "drained" };
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

      const secretKv = await kv.app.get("linear_webhook_secret");
      if (!secretKv.value) {
        await http.respond(input.request.requestId, { statusCode: 500 });
        return;
      }

      // Verify Linear-Signature header (case-insensitive lookup).
      const signatureHeader = Object.keys(input.request.headers).find(
        (h) => h.toLowerCase() === "linear-signature",
      );
      const signature = signatureHeader
        ? input.request.headers[signatureHeader]
        : undefined;
      if (!signature) {
        await http.respond(input.request.requestId, { statusCode: 401 });
        return;
      }

      const expectedSignature = crypto
        .createHmac("sha256", secretKv.value as string)
        .update(input.request.rawBody)
        .digest("hex");

      const sigBuffer = Buffer.from(signature);
      const expectedBuffer = Buffer.from(expectedSignature);

      if (
        sigBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
      ) {
        await http.respond(input.request.requestId, { statusCode: 401 });
        return;
      }

      const payload = JSON.parse(input.request.rawBody);

      // Route to all rawWebhook blocks.
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
