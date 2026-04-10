import { AppBlock } from "@slflows/sdk/v1";
import { runGraphqlQuery } from "./runGraphqlQuery";

export const blocks: Record<string, AppBlock> = {
  runGraphqlQuery,
};
