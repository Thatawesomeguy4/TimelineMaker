import type { TimelineDocument } from "../../../../../packages/timeline-schema/src/types";

export async function saveTimelineFile(
  timeline: TimelineDocument,
  suggestedName = "timeline.timeline.json"
): Promise<void> {
  const json = JSON.stringify(timeline, null, 2);
  const blob = new Blob([json], {
    type: "application/json"
  });

  const maybeWindowWithFilePicker = window as Window &
    typeof globalThis & {
      showSaveFilePicker?: (options: {
        suggestedName: string;
        types: Array<{
          description: string;
          accept: Record<string, string[]>;
        }>;
      }) => Promise<FileSystemFileHandle>;
    };

  if (typeof maybeWindowWithFilePicker.showSaveFilePicker === "function") {
    const handle = await maybeWindowWithFilePicker.showSaveFilePicker({
      suggestedName,
      types: [
        {
          description: "Timeline JSON file",
          accept: {
            "application/json": [".json", ".timeline.json"]
          }
        }
      ]
    });

    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = suggestedName;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
    link.remove();
  }, 1000);
}