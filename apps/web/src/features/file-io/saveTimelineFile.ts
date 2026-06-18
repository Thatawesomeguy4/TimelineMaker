import type { TimelineDocument } from "../../../../../packages/timeline-schema/src/types";

export async function saveTimelineFile(
  timeline: TimelineDocument,
  suggestedName = "timeline.timeline.json"
): Promise<void> {
  const json = JSON.stringify(timeline, null, 2);
  const blob = new Blob([json], { type: "application/json" });

  const supportsFileSystemAccess =
    "showSaveFilePicker" in window &&
    (() => {
      try {
        return window.self === window.top;
      } catch {
        return false;
      }
    })();

  if (supportsFileSystemAccess) {
    const pickerWindow = window as unknown as {
      showSaveFilePicker: (options: {
        suggestedName: string;
        types: Array<{
          description: string;
          accept: Record<string, string[]>;
        }>;
      }) => Promise<FileSystemFileHandle>;
    };

    const handle = await pickerWindow.showSaveFilePicker({
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

  setTimeout(() => {
    URL.revokeObjectURL(url);
    link.remove();
  }, 1000);
}