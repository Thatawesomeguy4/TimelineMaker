import type {
  TimelineEvent,
  TimelineEventDisplayStyle,
  TimelineEventIcon,
  TimelineEventSeverity,
  TimelineEventStatus,
  TimelineLane
} from "../../../../../packages/timeline-schema/src/types";
import {
  DISPLAY_STYLES,
  EVENT_COLORS,
  EVENT_ICONS,
  EVENT_SEVERITIES,
  EVENT_STATUSES
} from "./timelineConstants";
import { getEventIcon, stringToTags, tagsToString } from "./timelineUtils";

type TimelineEventCustomizationPanelProps = {
  event: TimelineEvent;
  lanes: TimelineLane[];
  onUpdate: (eventId: string, updates: Partial<TimelineEvent>) => void;
};

export function TimelineEventCustomizationPanel({
  event,
  lanes,
  onUpdate
}: TimelineEventCustomizationPanelProps) {
  return (
    <div className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 md:grid-cols-2 xl:grid-cols-3">
      <label className="grid gap-1 text-sm">
        <span className="text-slate-400">Start</span>
        <input
          value={event.start}
          onChange={(e) => onUpdate(event.id, { start: e.target.value })}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="text-slate-400">End</span>
        <input
          value={event.end ?? ""}
          onChange={(e) => onUpdate(event.id, { end: e.target.value || null })}
          placeholder="Optional"
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="text-slate-400">Lane</span>
        <select
          value={event.laneId ?? ""}
          onChange={(e) => onUpdate(event.id, { laneId: e.target.value || null })}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
        >
          <option value="">No lane</option>
          {lanes.map((lane) => (
            <option key={lane.id} value={lane.id}>
              {lane.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-sm">
        <span className="text-slate-400">Category</span>
        <input
          value={event.category ?? ""}
          onChange={(e) => onUpdate(event.id, { category: e.target.value })}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="text-slate-400">Event Type</span>
        <input
          value={event.eventType ?? ""}
          onChange={(e) => onUpdate(event.id, { eventType: e.target.value })}
          placeholder="Alert, Email, Log Entry, Call, Action, etc."
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="text-slate-400">Status</span>
        <select
          value={event.status ?? "Planned"}
          onChange={(e) =>
            onUpdate(event.id, {
              status: e.target.value as TimelineEventStatus
            })
          }
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
        >
          {EVENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-sm">
        <span className="text-slate-400">Severity</span>
        <select
          value={event.severity ?? "Informational"}
          onChange={(e) =>
            onUpdate(event.id, {
              severity: e.target.value as TimelineEventSeverity
            })
          }
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
        >
          {EVENT_SEVERITIES.map((severity) => (
            <option key={severity} value={severity}>
              {severity}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-sm">
        <span className="text-slate-400">Confidence</span>
        <select
          value={event.confidence ?? "Medium"}
          onChange={(e) =>
            onUpdate(event.id, {
              confidence: e.target.value as "Low" | "Medium" | "High"
            })
          }
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
      </label>

      <label className="grid gap-1 text-sm">
        <span className="text-slate-400">Icon</span>
        <select
          value={event.icon ?? "Dot"}
          onChange={(e) =>
            onUpdate(event.id, {
              icon: e.target.value as TimelineEventIcon
            })
          }
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
        >
          {EVENT_ICONS.map((icon) => (
            <option key={icon} value={icon}>
              {getEventIcon(icon)} {icon}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-sm">
        <span className="text-slate-400">Display Style</span>
        <select
          value={event.displayStyle ?? "Solid"}
          onChange={(e) =>
            onUpdate(event.id, {
              displayStyle: e.target.value as TimelineEventDisplayStyle
            })
          }
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
        >
          {DISPLAY_STYLES.map((style) => (
            <option key={style} value={style}>
              {style}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-sm">
        <span className="text-slate-400">Color</span>
        <div className="flex flex-wrap gap-2 rounded-lg border border-slate-700 bg-slate-950 p-2">
          {EVENT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onUpdate(event.id, { color })}
              className="h-8 w-8 rounded-full border-2"
              style={{
                backgroundColor: color,
                borderColor: event.color === color ? "#ffffff" : "transparent"
              }}
              aria-label={`Set event color to ${color}`}
            />
          ))}

          <input
            value={event.color ?? "#2563eb"}
            onChange={(e) => onUpdate(event.id, { color: e.target.value })}
            className="min-w-32 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1"
          />
        </div>
      </label>

      <label className="grid gap-1 text-sm">
        <span className="text-slate-400">Actor / Owner</span>
        <input
          value={event.actor ?? ""}
          onChange={(e) => onUpdate(event.id, { actor: e.target.value })}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="text-slate-400">Location</span>
        <input
          value={event.location ?? ""}
          onChange={(e) => onUpdate(event.id, { location: e.target.value })}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="text-slate-400">Source</span>
        <input
          value={event.source ?? ""}
          onChange={(e) => onUpdate(event.id, { source: e.target.value })}
          placeholder="Manual entry, SIEM, email, ticket, etc."
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
        />
      </label>

      <label className="grid gap-1 text-sm md:col-span-2">
        <span className="text-slate-400">Evidence URL</span>
        <input
          value={event.evidenceUrl ?? ""}
          onChange={(e) => onUpdate(event.id, { evidenceUrl: e.target.value })}
          placeholder="Link to ticket, email, document, log, etc."
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
        />
      </label>

      <label className="grid gap-1 text-sm xl:col-span-3">
        <span className="text-slate-400">Tags</span>
        <input
          value={tagsToString(event.tags)}
          onChange={(e) =>
            onUpdate(event.id, { tags: stringToTags(e.target.value) })
          }
          placeholder="Comma-separated tags, e.g. security, alert, escalation"
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
        />
      </label>
    </div>
  );
}