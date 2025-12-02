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
      interactive: {
        type: Boolean,
        alias: "i",
        description:
          "Enable interactive mode to continue chatting after each message",
        required: false,
        default: false,
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

    const isInteractive = argv.flags.interactive;
    let shouldContinue = true;

    // Handle Ctrl+C gracefully
    process.on("SIGINT", () => {
      console.log(chalk.yellow("\n\nExiting chat..."));
      process.exit(0);
    });

    while (shouldContinue) {
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

      const { stream } = await agent.sendMessage(conversationId, message);

      let textStreamStarted = false;

      // Stream and render content as it arrives
      for await (const chunk of stream) {
        if (chunk.type === "text-delta") {
          // Start text stream if not already started
          if (!textStreamStarted) {
            startTextStream("assistant");
            textStreamStarted = true;
          }
          renderTextDelta(chunk.delta);
        } else if (chunk.type === "message") {
          // End text stream if it was started
          if (textStreamStarted) {
            endTextStream();
            textStreamStarted = false;
          }
          // Render complete messages (tool calls, tool results)
          // skip text parts as they were already streamed
          renderMessage(chunk.message, { skipTextParts: true });
        }
      }

      // End text stream if it's still open
      if (textStreamStarted) {
        endTextStream();
      }

      // If not in interactive mode or message was provided via flag, exit after first message
      if (!isInteractive || argv.flags.message) {
        shouldContinue = false;
      }

      // Clear the message flag for subsequent iterations
      argv.flags.message = undefined;
    }
  }
);
