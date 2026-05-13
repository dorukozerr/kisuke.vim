import { deleteSessionHandler } from "#/std-handlers/delete-session";
import { initializeHandler } from "#/std-handlers/initialize";
import { loadSessionsHandler } from "#/std-handlers/load_sessions";
import { newSessionHandler } from "#/std-handlers/new-session";
import { promptHandler } from "#/std-handlers/prompt";
import { restoreSessionHandler } from "#/std-handlers/restore-session";
import { resumeLastSessionHandler } from "#/std-handlers/resume-last-session";
import type { Event, Output } from "#/types";
import { writeError } from "#/utils/file-operations";

const stdin = process.stdin;
const stdout = process.stdout;

stdin.resume();
stdin.setEncoding("utf-8");

stdin.on("data", async (data: string) => {
  try {
    const event = JSON.parse(data) as Event;

    // TODO: Maybe convert this to object and call event.type as key, idk
    if (event.type === "initialize") await initializeHandler();
    if (event.type === "prompt") await promptHandler(event);
    if (event.type === "new_session") await newSessionHandler();
    if (event.type === "resume_last_session") await resumeLastSessionHandler();
    if (event.type === "load_sessions") await loadSessionsHandler();
    if (event.type === "restore_session") await restoreSessionHandler(event);
    if (event.type === "delete_session") await deleteSessionHandler(event);
  } catch (error) {
    await writeError(error, "std");

    stdOutput({
      type: "error",
      payload: `Unknown server error, ${
        error instanceof Error
          ? JSON.stringify({ message: error.message, stack: error.stack })
          : String(error)
      }`,
    });
  }
});

export const stdOutput = (reply: Output) => {
  stdout.write(JSON.stringify(reply) + "\n");
};
