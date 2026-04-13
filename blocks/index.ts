import { AppBlock } from "@slflows/sdk/v1";
import { createIssue } from "./issues/createIssue";
import { updateIssue } from "./issues/updateIssue";
import { getIssue } from "./issues/getIssue";
import { searchIssues } from "./issues/searchIssues";
import { addComment } from "./issues/addComment";
import { runGraphqlQuery } from "./runGraphqlQuery";
import { rawWebhook } from "./webhooks/rawWebhook";

export const blocks: Record<string, AppBlock> = {
  createIssue,
  updateIssue,
  getIssue,
  searchIssues,
  addComment,
  runGraphqlQuery,
  rawWebhook,
};
