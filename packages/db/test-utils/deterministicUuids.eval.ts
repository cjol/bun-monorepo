import { evalite } from "evalite";
import { generateId } from "@ai-starter/core/schema/utils/generateId";
import { setupDeterministicIds } from "./deterministicUuids";

/**
 * Dummy eval to verify that deterministic ID generation works correctly in evalite.
 * This ensures that the setup.ts file properly configures deterministic IDs for evals,
 * which is crucial for prompt caching.
 *
 * Note: These evals demonstrate that IDs are deterministic and repeatable when evals run.
 * The setup.ts beforeEach hook ensures regular Bun tests get isolation,
 * but evalite evals need to manually reset if they want isolation from previous evals.
 */

evalite("Deterministic ID generation - first eval", {
  data: [
    {
      input: {},
      expected: [
        "01JGFJJZ00H7NE7NA00Q687B0D",
        "01JGFJJZZ8XMY6KN9J8S5BAZFD",
        "01JGFJK0YGHKS6FB8828HETW3G",
        "01JGFJK1XRWNK24MV2NV29KP2Q",
        "01JGFJK2X0MNYXJTQ48K0T5Q3Z",
      ],
    },
  ],
  task: async () => {
    return [
      generateId(),
      generateId(),
      generateId(),
      generateId(),
      generateId(),
    ];
  },
  scorers: [
    {
      name: "IDs match expected",
      scorer: ({ output, expected }) => {
        return JSON.stringify(output) === JSON.stringify(expected) ? 1 : 0;
      },
    },
  ],
});

evalite("Deterministic ID generation - with manual reset", {
  data: [
    {
      input: {},
      expected: [
        "01JGFJJZ00H7NE7NA00Q687B0D",
        "01JGFJJZZ8XMY6KN9J8S5BAZFD",
        "01JGFJK0YGHKS6FB8828HETW3G",
        "01JGFJK1XRWNK24MV2NV29KP2Q",
        "01JGFJK2X0MNYXJTQ48K0T5Q3Z",
      ],
    },
  ],
  task: async () => {
    // Manually reset deterministic IDs for this eval
    setupDeterministicIds();

    return [
      generateId(),
      generateId(),
      generateId(),
      generateId(),
      generateId(),
    ];
  },
  scorers: [
    {
      name: "Test isolation working with manual reset",
      scorer: ({ output, expected }) => {
        return JSON.stringify(output) === JSON.stringify(expected) ? 1 : 0;
      },
    },
  ],
});

evalite("Deterministic timestamps - with manual reset", {
  data: [
    {
      input: {},
      expected: {
        first: "2025-01-01T00:00:00.000Z",
        second: "2025-01-01T00:00:01.000Z",
        third: 1735689600000 + 2000,
      },
    },
  ],
  task: async () => {
    // Manually reset for deterministic timestamps
    setupDeterministicIds();

    return {
      first: new Date().toISOString(),
      second: new Date().toISOString(),
      third: Date.now(),
    };
  },
  scorers: [
    {
      name: "Timestamps match",
      scorer: ({ output, expected }) => {
        return JSON.stringify(output) === JSON.stringify(expected) ? 1 : 0;
      },
    },
  ],
});
