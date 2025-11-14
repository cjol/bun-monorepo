import type { DB } from "../../db";
import { doSeedConversations } from "./conversation";
import { doSeedFoos } from "./foo";
import { doSeedMessages } from "./message";
import { doSeedMatters } from "./matter";
import { doSeedBills } from "./bill";
import { doSeedTimeEntries } from "./timeEntry";
import { doSeedAiSuggestions } from "./aiSuggestion";
import { doSeedWorkflows } from "./workflow";

export async function doSeedAll(db: DB) {
  await doSeedFoos(db);
  await doSeedConversations(db);
  await doSeedMessages(db);
  await doSeedMatters(db);
  await doSeedBills(db);
  await doSeedTimeEntries(db);
  await doSeedAiSuggestions(db);
  await doSeedWorkflows(db);
}
