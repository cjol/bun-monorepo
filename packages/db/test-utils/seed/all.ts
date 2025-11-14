import type { DB } from "../../db";
import { doSeedConversations } from "./conversation";
import { doSeedFoos } from "./foo";
import { doSeedMessages } from "./message";

export async function doSeedAll(db: DB) {
  await doSeedFoos(db);
  await doSeedConversations(db);
  await doSeedMessages(db);
}
