import { task, metadata } from "@trigger.dev/sdk/v3";
import { runPipeline } from "@/lib/pipeline/runner";
import type { PipelineJobData } from "@/lib/pipeline/types";

export const pipelineTask = task({
  id: "video-pipeline",
  maxDuration: 3600, // 1 hour max (8hr video render can take a while)
  run: async (payload: PipelineJobData) => {
    await runPipeline(payload);
    return { success: true, videoId: payload.videoId };
  },
});
