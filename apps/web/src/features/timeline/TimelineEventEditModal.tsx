import { useEffect } from "react";
import type {
  TimelineEvent,
  TimelineLane
} from "../../../../../packages/timeline-schema/src/types";
import { TimelineEventCustomizationPanel } from "./TimelineEventCustomizationPanel";
import {
  getEventIcon,
  getSeverityBadgeClass,
  getStatusBadgeClass
} from "./timelineUtils";

type TimelineEventEditModalProps = {
  event: TimelineEvent | null;
  lanes: TimelineLane[];
  onUpdate: (eventId: string, updates: Partial<TimelineEvent>) => void;
  onClose: () => void;
};

export function TimelineEventEditModal({
  event,
  lanes,
  onUpdate,
  onClose
}: TimelineEventEditModalProps) {
  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [onClose]);

  if (!event) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="timeline-event-edit-title"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl"
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 p-5 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl shadow"
                style={{
                  backgroundColor: event.color ?? "#2563eb"
                }}
              >
                {getEventIcon(event.icon)}
              </div>

              <div>
                <h2
                  id="timeline-event-edit-title"
                  className="text-2xl font-bold text-slate-100"
                >
                  Edit Timeline Event
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Customize event details, appearance, metadata, and evidence.
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400">{event.start}</span>

                  {event.end ? (
                    <span className="text-xs text-slate-500">→ {event.end}</span>
                  ) : null}

                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs ${getSeverityBadgeClass(
                      event.severity
                    )}`}
                  >
                    {event.severity ?? "Informational"}
                  </span>

                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs ${getStatusBadgeClass(
                      event.status
                    )}`}
                  >
                    {event.status ?? "Planned"}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-700"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="mb-5 grid gap-4 md:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="text-slate-400">Title</span>
              <input
                value={event.title}
                onChange={(inputEvent) =>
                  onUpdate(event.id, { title: inputEvent.target.value })
                }
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-lg font-semibold text-slate-100"
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="text-slate-400">Description / Notes</span>
              <textarea
                value={event.description ?? ""}
                onChange={(inputEvent) =>
                  onUpdate(event.id, { description: inputEvent.target.value })
                }
                rows={3}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              />
            </label>
          </div>

          <TimelineEventCustomizationPanel
            event={event}
            lanes={lanes}
            onUpdate={onUpdate}
          />
        </div>
      </div>
    </div>
  );
}
