import { tasks } from "@trigger.dev/sdk/v3";
import type { PipelineJobData } from "./types";

export async function enqueueVideo(data: PipelineJobData): Promise<string> {
  // Dynamically import to avoid circular deps at module load time
  const { pipelineTask } = await import("@/trigger/pipeline.task");

  const handle = await pipelineTask.trigger(data, {
    idempotencyKey: `video-${data.videoId}`,
  });

  return handle.id;
}
