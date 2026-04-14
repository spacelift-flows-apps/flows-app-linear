import { AppBlock } from "@slflows/sdk/v1";
import { runGraphqlQuery } from "./runGraphqlQuery";
import { rawWebhook } from "./webhooks/rawWebhook";

export const blocks: Record<string, AppBlock> = {
  runGraphqlQuery,
  rawWebhook,
};
