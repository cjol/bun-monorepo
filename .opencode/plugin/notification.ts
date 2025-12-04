import type { Plugin } from "@opencode-ai/plugin";

export const NotificationPlugin: Plugin = async ({ $ }) => {
  return {
    event: async ({ event }) => {
      if (event.type === "session.idle") {
        await $`paplay /usr/share/sounds/freedesktop/stereo/complete.oga`;
        // await $`notify-send -e "Session Idle" "Input required"`;
      }
    },
  };
};
