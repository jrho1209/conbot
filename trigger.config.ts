import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  project: process.env.TRIGGER_PROJECT_ID || "your-project-id",
  runtime: "node",
  logLevel: "log",
  maxDuration: 3600, // 1 hour max per task
  dirs: ["./trigger"],
});
