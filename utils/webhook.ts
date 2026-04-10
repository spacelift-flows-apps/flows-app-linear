import crypto from "crypto";
import { LinearClient } from "@linear/sdk";
import { kv } from "@slflows/sdk/v1";
import { RESOURCE_TYPES } from "./constants";

const KV_WEBHOOK_ID = "linear_webhook_id";
const KV_WEBHOOK_SECRET = "linear_webhook_secret";

const SYSTEMIC_ERROR_TYPES = [
  "AuthenticationError",
  "Forbidden",
  "Ratelimited",
  "NetworkError",
];

interface StoredWebhook {
  id: string;
  secret: string;
}

/** Reads webhook ID and secret from KV. Returns null if either is missing. */
export async function getStoredWebhook(): Promise<StoredWebhook | null> {
  const [idKv, secretKv] = await kv.app.getMany([
    KV_WEBHOOK_ID,
    KV_WEBHOOK_SECRET,
  ]);

  if (!idKv.value || !secretKv.value) return null;

  return { id: idKv.value as string, secret: secretKv.value as string };
}

async function saveWebhook(id: string, secret: string): Promise<void> {
  await kv.app.setMany([
    { key: KV_WEBHOOK_ID, value: id },
    { key: KV_WEBHOOK_SECRET, value: secret },
  ]);
}

async function clearStoredWebhook(): Promise<void> {
  await kv.app.delete([KV_WEBHOOK_ID, KV_WEBHOOK_SECRET]);
}

async function tryDeleteWebhook(
  client: LinearClient,
  webhookId: string,
): Promise<void> {
  try {
    await client.deleteWebhook(webhookId);
  } catch {
    // Best-effort — webhook may already be gone.
  }
}

interface EnsureWebhookInput {
  client: LinearClient;
  webhookUrl: string;
  teamKey?: string;
}

/**
 * Ensures a healthy webhook exists in Linear. Handles drift:
 * deleted externally, URL changed, disabled, or signing secret lost.
 */
export async function ensureWebhook(
  input: EnsureWebhookInput,
): Promise<string> {
  const { client, webhookUrl, teamKey } = input;

  const stored = await getStoredWebhook();

  if (stored) {
    const healthy = await healExistingWebhook(client, stored.id, webhookUrl);
    if (healthy) return webhookUrl;
  }

  // Webhook missing, unhealthy, or partial KV state — clean up and re-create.
  await clearStoredWebhook();
  await createWebhook(client, webhookUrl, teamKey);
  return webhookUrl;
}

/**
 * Checks an existing webhook and heals it if possible.
 * Returns true if healthy, false if it needs re-creation.
 */
async function healExistingWebhook(
  client: LinearClient,
  webhookId: string,
  expectedUrl: string,
): Promise<boolean> {
  let webhook;
  try {
    webhook = await client.webhook(webhookId);
  } catch {
    return false;
  }

  if (webhook.url !== expectedUrl) {
    await tryDeleteWebhook(client, webhook.id);
    return false;
  }

  if (!webhook.enabled) {
    await client.updateWebhook(webhook.id, { enabled: true });
  }

  return true;
}

async function createWebhook(
  client: LinearClient,
  webhookUrl: string,
  teamKey?: string,
): Promise<void> {
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

  const secret = crypto.randomBytes(32).toString("hex");

  const payload = await client.createWebhook({
    label: "Flows",
    url: webhookUrl,
    ...(teamId ? { teamId } : { allPublicTeams: true }),
    resourceTypes: [...RESOURCE_TYPES],
    secret,
  });

  const webhook = await payload.webhook;
  if (!webhook) {
    throw new Error("creating webhook: no webhook returned");
  }

  await saveWebhook(webhook.id, secret);
}

/** Deletes the webhook from Linear and clears KV. Re-throws systemic errors. */
export async function deleteWebhook(client: LinearClient): Promise<void> {
  const stored = await getStoredWebhook();

  if (stored) {
    try {
      await client.deleteWebhook(stored.id);
    } catch (err) {
      const errType = (err as { type?: string }).type;
      if (errType && SYSTEMIC_ERROR_TYPES.includes(errType)) {
        throw err;
      }
    }
  }

  await clearStoredWebhook();
}

/** Verifies the Linear webhook signature. */
export function verifySignature(
  rawBody: string,
  signature: string,
  secret: string,
): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  return (
    sigBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  );
}
