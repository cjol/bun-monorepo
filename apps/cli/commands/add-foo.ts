import { command } from "cleye";
import { getContext } from "../utils/app";
import { FLAGS } from "../utils/flags";

export const addFoo = command(
  {
    name: "add-foo",
    help: {
      description: "Add a new foo",
      examples: ['bun cli add-foo "My Foo Name"'],
    },
    flags: {
      ...FLAGS,
    },
    parameters: ["<foo name>"],
  },
  async (argv) => {
    const { app } = await getContext(argv.flags.database);
    const result = await app.createFoo(argv._.fooName);
    if (!result) {
      console.log(`\x1b[1m\x1b[31mFailed to create foo.\x1b[0m`);
      return;
    }
    console.log(`\x1b[1m\x1b[36mFoo Details:\x1b[0m`);
    console.log(`\x1b[33mID:\x1b[0m ${result.id}`);
    console.log(`\x1b[33mName:\x1b[0m ${result.name}`);
    console.log(`\x1b[33mCreated:\x1b[0m ${result.createdAt}`);
  }
);
