import type { TimelineDocument } from "../../../../../packages/timeline-schema/src/types";
import { TimelineDocumentSchema } from "../../../../../packages/timeline-schema/src/validation";

export async function openTimelineFile(file: File): Promise<TimelineDocument> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  return TimelineDocumentSchema.parse(parsed);
}