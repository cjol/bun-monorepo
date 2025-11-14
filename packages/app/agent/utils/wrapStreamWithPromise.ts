import type { Message } from "@ai-starter/core";
import type { SimplifiedStreamPart } from "./streamAgent";

/**
 * Wraps an async generator to collect Message items and also provide them
 * via a promise that resolves when the stream completes.
 *
 * @param stream The async generator to wrap
 * @returns Object with the wrapped stream and a promise for collected messages
 */
export function wrapStreamWithPromise(
  stream: AsyncGenerator<SimplifiedStreamPart, void, undefined>
): {
  stream: AsyncGenerator<SimplifiedStreamPart, void, undefined>;
  messages: Promise<Message[]>;
} {
  const streamedMessages: Message[] = [];
  let generator!: AsyncGenerator<SimplifiedStreamPart, void, undefined>;

  const messagesPromise = new Promise<Message[]>((resolve, reject) => {
    async function* wrappedStream(): AsyncGenerator<
      SimplifiedStreamPart,
      void,
      undefined
    > {
      try {
        for await (const chunk of stream) {
          if (chunk.type === "message") {
            streamedMessages.push(chunk.message);
          }
          yield chunk;
        }
        resolve(streamedMessages);
      } catch (error) {
        reject(error);
        throw error;
      }
    }

    generator = wrappedStream();
  });

  return {
    stream: generator,
    messages: messagesPromise,
  };
}
