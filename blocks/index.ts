import { AppBlock } from "@slflows/sdk/v1";
import { createIssue } from "./issues/createIssue";
import { runGraphqlQuery } from "./runGraphqlQuery";
import { rawWebhook } from "./webhooks/rawWebhook";

export const blocks: Record<string, AppBlock> = {
  createIssue,
  runGraphqlQuery,
  rawWebhook,
};
