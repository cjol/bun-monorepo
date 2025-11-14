import { command } from "cleye";
import { getContext } from "../utils/app";
import { FLAGS } from "../utils/flags";
import { createInterface } from "readline";
import {
  renderMessages,
  renderMessage,
  renderTextDelta,
  startTextStream,
  endTextStream,
} from "../utils/render";
import ora from "ora";
import chalk from "chalk";

export const chat = command(
  {
    name: "chat",
    help: {
      description: "Chat with the AI agent",
      examples: [
        "bun cli chat # start a new interactive conversation",
        'bun cli chat --conversation-id "1234" --message "Hello, how are you?" # send a message to an existing conversation',
      ],
    },
    flags: {
      ...FLAGS,
      conversationId: {
        type: String,
        alias: "c",
        description: "The ID of the conversation to continue",
        required: false,
      },
      message: {
        type: String,
        alias: "m",
        description: "The message to send to the AI agent",
        required: false,
      },
    },
    parameters: ["[conversation id]", "[message]"],
  },
  async (argv) => {
    const { agent } = await getContext(argv.flags.database);
    let conversationId = argv.flags.conversationId;

    if (!conversationId) {
      const convo = await agent.createConversation();
      conversationId = convo.id;
      console.log(
        chalk.bold.cyan("Started new conversation with ID:"),
        conversationId
      );
    } else {
      // Load and render previous messages
      const previousMessages =
        await agent.getConversationMessages(conversationId);
      if (previousMessages.length > 0) {
        renderMessages(previousMessages);
      }
    }

    let message = argv.flags.message;
    if (!message) {
      // prompt the user interactively
      const readline = createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      message = await new Promise<string>((resolve) => {
        readline.question(
          chalk.bold.green("Enter your message: "),
          (input: string) => {
            readline.close();
            resolve(input);
          }
        );
      });
    }

    // Show spinner while generating response
    // const spinner = ora("Generating response...").start();

    try {
      const { stream } = await agent.sendMessage(conversationId, message);

      let textStreamStarted = false;

      // Stream and render content as it arrives
      for await (const chunk of stream) {
        if (chunk.type === "text-delta") {
          // Start text stream if not already started
          if (!textStreamStarted) {
            startTextStream("assistant");
            textStreamStarted = true;
            // spinner.stop();
          }
          renderTextDelta(chunk.delta);
        } else if (chunk.type === "message") {
          // Clear spinner before first output to prevent ghost effect
          // spinner.clear();
          // End text stream if it was started
          if (textStreamStarted) {
            endTextStream();
            textStreamStarted = false;
            // spinner.start("Generating response...");
          }
          // Render complete messages (tool calls, tool results)
          // skip text parts as they were already streamed
          renderMessage(chunk.message, { skipTextParts: true });
        }
      }

      // Stop spinner after stream completes
      // spinner.stop();

      // End text stream if it's still open
      if (textStreamStarted) {
        endTextStream();
      }
    } catch (error) {
      // spinner.fail("Failed to generate response");
      throw error;
    }
  }
);
