import { command } from "cleye";
import { getApp } from "../utils/app";
import { FLAGS } from "../utils/flags";

export const getFoo = command(
  {
    name: "get-foo",
    help: {
      description: "Get the foo",
      examples: ["bun cli get-foo 1234"],
    },
    flags: {
      ...FLAGS,
    },
    parameters: ["<foo id>"],
  },
  async (argv) => {
    const app = await getApp(argv.flags.database);
    const result = await app.getFoo(argv._.fooId);
    if (!result) {
      console.log(
        `\x1b[1m\x1b[31mFoo with ID ${argv._.fooId} not found.\x1b[0m`
      );
      return;
    }
    console.log(`\x1b[1m\x1b[36mFoo Details:\x1b[0m`);
    console.log(`\x1b[33mID:\x1b[0m ${result.id}`);
    console.log(`\x1b[33mName:\x1b[0m ${result.name}`);
    console.log(`\x1b[33mCreated:\x1b[0m ${result.createdAt}`);
    console.log(`\x1b[33mUpdated:\x1b[0m ${result.updatedAt}`);
  }
);
