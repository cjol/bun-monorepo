import type { Experimental_Agent as Agent } from "ai";
import type { ModelMessage } from "ai";
import type { Message, NewMessage } from "@ai-starter/core";

/**
 * Simplified stream part types that we actually care about
 */
export type SimplifiedStreamPart =
  | { type: "text-delta"; delta: string }
  | { type: "message"; message: Message };

export interface StreamAgentProps {
  agent: Agent<any, any>;
  conversationId: string;
  messages: ModelMessage[];
  onCompleteMessage: (newMessage: NewMessage) => Promise<Message>;
}

/**
 * Wrapper around agent.stream that simplifies the stream parts to just
 * text-delta and message types, calling onCompleteMessage when
 * a complete message (text, tool-call, or tool-result) is ready.
 */
export async function* streamAgent(
  props: StreamAgentProps
): AsyncGenerator<SimplifiedStreamPart, void, undefined> {
  const { agent, conversationId, messages, onCompleteMessage } = props;

  const agentStream = agent.stream({ messages });
  let accumulatedText = "";

  for await (const chunk of agentStream.fullStream) {
    switch (chunk.type) {
      // Handle text deltas
      case "text-delta":
        accumulatedText += chunk.text;
        yield { type: "text-delta", delta: chunk.text };
        break;

      case "text-end": {
        if (!accumulatedText) continue;
        const newMessage: NewMessage = {
          conversationId,
          role: "assistant",
          content: [{ type: "text", text: accumulatedText }],
        };
        const persistedMessage = await onCompleteMessage(newMessage);
        yield { type: "message", message: persistedMessage };
        accumulatedText = "";
        break;
      }

      // Handle tool calls
      case "tool-call": {
        const newMessage: NewMessage = {
          conversationId,
          role: "assistant",
          content: [
            {
              type: "tool-call",
              toolCallId: chunk.toolCallId,
              toolName: chunk.toolName,
              input: chunk.input,
            },
          ],
        };
        const persistedMessage = await onCompleteMessage(newMessage);
        yield { type: "message", message: persistedMessage };
        break;
      }

      // Handle tool results
      case "tool-result": {
        const newMessage: NewMessage = {
          conversationId,
          role: "tool",
          content: [
            {
              type: "tool-result",
              toolCallId: chunk.toolCallId,
              toolName: chunk.toolName,
              output: { type: "json", value: chunk.output },
            },
          ],
        };
        const persistedMessage = await onCompleteMessage(newMessage);
        yield { type: "message", message: persistedMessage };
        break;
      }

      // Ignore events we don't need to handle
      case "start":
      case "finish":
      case "text-start":
      case "start-step":
      case "finish-step":
      case "tool-input-start":
      case "tool-input-delta":
      case "tool-input-end":
      case "tool-error":
      case "abort":
      case "error":
        break;

      // Warn about unexpected chunk types
      case "file":
      case "source":
      case "raw":
      case "reasoning-start":
      case "reasoning-delta":
      case "reasoning-end":
      default:
        console.warn("Unhandled chunk type:", chunk.type);
        break;
    }
  }

  // Warn if we have leftover text (shouldn't happen)
  if (accumulatedText) {
    console.warn("Unexpected remaining text after stream end");
  }
}
