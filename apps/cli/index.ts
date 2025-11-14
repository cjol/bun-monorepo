#!/usr/bin/env bun
import { cli } from "cleye";
import { addFoo } from "./commands/add-foo";
import { getFoo } from "./commands/get-foo";
import { patchFoo } from "./commands/patch-foo";
import { chat } from "./commands/chat";

const argv = cli({
  name: "ai-starter",
  version: "0.0.1",
  commands: [addFoo, getFoo, patchFoo, chat],
});

if (!argv.command) {
  argv.showHelp();
}
