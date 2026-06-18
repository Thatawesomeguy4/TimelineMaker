import type { KeyboardEvent } from "react";
import type { TimelineEvent } from "../../../../../packages/timeline-schema/src/types";
import {
  getEventIcon,
  getSeverityBadgeClass,
  getStatusBadgeClass
} from "./timelineUtils";

type TimelineHorizontalViewProps = {
  events: TimelineEvent[];
  onEdit: (eventId: string) => void;
};

type HorizontalTimelineEventProps = {
  event: TimelineEvent;
  index: number;
  centerY: number;
  topCardY: number;
  bottomCardY: number;
  cardHeight: number;
  onEdit: (eventId: string) => void;
};

function formatEventDate(value: string): string {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getShortDescription(event: TimelineEvent): string {
  if (event.description && event.description.trim().length > 0) {
    return event.description;
  }

  if (event.source && event.source.trim().length > 0) {
    return `Source: ${event.source}`;
  }

  return "No description provided.";
}

function getEventLeftPosition(index: number): number {
  return 180 + index * 340;
}

function HorizontalTimelineEvent({
  event,
  index,
  centerY,
  topCardY,
  bottomCardY,
  cardHeight,
  onEdit
}: HorizontalTimelineEventProps) {
  const isTop = index % 2 === 0;
  const left = getEventLeftPosition(index);
  const eventColor = event.color ?? "#2563eb";

  const nodeRadius = 24;
  const connectorGap = 18;

  const cardTop = isTop ? topCardY : bottomCardY;

  const topConnectorStart = topCardY + cardHeight;
  const topConnectorEnd = centerY - nodeRadius - connectorGap;

  const bottomConnectorStart = centerY + nodeRadius + connectorGap;
  const bottomConnectorEnd = bottomCardY;

  const connectorTop = isTop ? topConnectorStart : bottomConnectorStart;
  const connectorHeight = isTop
    ? Math.max(0, topConnectorEnd - topConnectorStart)
    : Math.max(0, bottomConnectorEnd - bottomConnectorStart);

  function openEditor() {
    onEdit(event.id);
  }

  function handleCardKeyDown(
    keyboardEvent: KeyboardEvent<HTMLDivElement>
  ) {
    if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
      keyboardEvent.preventDefault();
      openEditor();
    }
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={openEditor}
        onKeyDown={handleCardKeyDown}
        className="absolute z-10 w-[270px] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-4 text-center shadow transition hover:-translate-y-1 hover:border-blue-500 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950"
        style={{
          left: left - 135,
          top: cardTop,
          height: cardHeight,
          cursor: "pointer"
        }}
        aria-label={`Edit ${event.title}`}
      >
        <div className="text-lg font-black tracking-wide text-slate-100">
          {formatEventDate(event.start)}
        </div>

        <div className="mt-2 text-base font-semibold text-slate-200">
          {event.title}
        </div>

        <div className="mt-2 max-h-16 overflow-hidden text-sm leading-6 text-slate-400">
          {getShortDescription(event)}
        </div>

        <div className="mt-3 flex flex-wrap justify-center gap-2">
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
            {event.status ?? "Initial Access"}
          </span>
        </div>

      </div>

      <div
        className="absolute z-0 border-l-4 border-dotted border-slate-500"
        style={{
          left,
          top: connectorTop,
          height: connectorHeight
        }}
      />

      <button
        type="button"
        onClick={openEditor}
        className="absolute z-20 flex h-12 w-12 items-center justify-center rounded-full border-4 border-slate-950 text-lg font-bold text-white shadow-lg transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950"
        style={{
          left: left - nodeRadius,
          top: centerY - nodeRadius,
          backgroundColor: eventColor
        }}
        aria-label={`Edit ${event.title}`}
      >
        {getEventIcon(event.icon)}
      </button>
    </div>
  );
}

export function TimelineHorizontalView({
  events,
  onEdit
}: TimelineHorizontalViewProps) {
  const topCardY = 50;
  const cardHeight = 230;
  const centerY = 390;
  const bottomCardY = 500;
  const diagramHeight = 760;

  const timelineWidth = Math.max(1000, 360 + events.length * 340);

  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
        No events have been added yet.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow">
      <div className="mb-5 text-center">
        <h2 className="text-4xl font-black tracking-tight text-slate-100">
          Timeline Diagram
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Scroll horizontally to review events. Events alternate above and below
          the center line.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
        <div
          className="relative"
          style={{
            width: timelineWidth,
            height: diagramHeight
          }}
        >
          <div
            className="absolute z-0 border-t-4 border-dotted border-slate-500"
            style={{
              left: 60,
              right: 60,
              top: centerY
            }}
          />

          {events.map((event, index) => (
            <HorizontalTimelineEvent
              key={event.id}
              event={event}
              index={index}
              centerY={centerY}
              topCardY={topCardY}
              bottomCardY={bottomCardY}
              cardHeight={cardHeight}
              onEdit={onEdit}
            />
          ))}
        </div>
      </div>

      <div className="mt-3 text-xs text-slate-500">
        Tip: use Manual Order mode to control the left-to-right sequence without
        changing event timestamps.
      </div>
    </div>
  );
}