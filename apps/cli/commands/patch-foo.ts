import { command } from "cleye";
import { getApp, getContext } from "../utils/app";
import { FLAGS } from "../utils/flags";
import type { Foo } from "@ai-starter/core";
import { isBoom } from "@hapi/boom";

export const patchFoo = command(
  {
    name: "patch-foo",
    help: {
      description: "Patch the foo",
      examples: ["bun cli patch-foo 1234 'New Name'"],
    },
    flags: {
      ...FLAGS,
      name: {
        type: String,
        alias: "n",
        description: "New name for the foo",
        required: true,
      },
    },
    parameters: ["<foo id>", "<foo name>"],
  },
  async (argv) => {
    const { app } = await getContext(argv.flags.database);
    let result: Foo | undefined;
    try {
      result = await app.patchFoo(argv._.fooId, argv._.fooName);
    } catch (error) {
      if (!isBoom(error) || error.output.statusCode !== 404) {
        throw error;
      }
      // continue to handle not found case below
    }
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
