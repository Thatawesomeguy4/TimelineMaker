import type { TimelineEvent } from "../../../../../packages/timeline-schema/src/types";
import {
  getEventCardStyle,
  getEventIcon,
  getSeverityBadgeClass,
  getStatusBadgeClass
} from "./timelineUtils";

type TimelineEventCardProps = {
  event: TimelineEvent;
  onEdit: (eventId: string) => void;
  onUpdate: (eventId: string, updates: Partial<TimelineEvent>) => void;
  onDuplicate: (event: TimelineEvent) => void;
  onDelete: (eventId: string) => void;
};

export function TimelineEventCard({
  event,
  onEdit,
  onUpdate,
  onDuplicate,
  onDelete
}: TimelineEventCardProps) {
  return (
    <article
      style={getEventCardStyle(event)}
      className="rounded-2xl border bg-slate-900 p-4 shadow"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-1 gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl shadow"
            style={{
              backgroundColor: event.color ?? "#2563eb"
            }}
          >
            {getEventIcon(event.icon)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
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

            <input
              value={event.title}
              onChange={(inputEvent) =>
                onUpdate(event.id, { title: inputEvent.target.value })
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-lg font-semibold text-slate-100"
            />

            <p className="mt-3 line-clamp-2 text-sm text-slate-300">
              {event.description || "No description provided."}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {(event.tags ?? []).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <div className="mt-3 grid gap-2 text-xs text-slate-400 md:grid-cols-2 xl:grid-cols-4">
              {event.category ? <span>Category: {event.category}</span> : null}
              {event.eventType ? <span>Type: {event.eventType}</span> : null}
              {event.actor ? <span>Actor: {event.actor}</span> : null}
              {event.source ? <span>Source: {event.source}</span> : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onEdit(event.id)}
            className="rounded-lg bg-blue-950 px-3 py-2 text-sm text-blue-200 hover:bg-blue-900"
          >
            Edit
          </button>

          <button
            onClick={() => onDuplicate(event)}
            className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
          >
            Duplicate
          </button>

          <button
            onClick={() => onDelete(event.id)}
            className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-200 hover:bg-red-900"
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}