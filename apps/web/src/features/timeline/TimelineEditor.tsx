import { useMemo, useState } from "react";
import type {
  TimelineDocument,
  TimelineEvent
} from "../../../../../packages/timeline-schema/src/types";
import { TimelineEventCard } from "./TimelineEventCard";
import { TimelineEventEditModal } from "./TimelineEventEditModal";
import { TimelineHeader } from "./TimelineHeader";
import { TimelineHorizontalView } from "./TimelineHorizontalView";
import { sampleTimeline } from "./timelineSampleData";
import type { TimelineSortMode, TimelineViewMode } from "./timelineViewTypes";

function getTimeSortedEvents(events: TimelineEvent[]) {
  return [...events].sort((a, b) => {
    const timeComparison = a.start.localeCompare(b.start);

    if (timeComparison !== 0) {
      return timeComparison;
    }

    return (a.order ?? 0) - (b.order ?? 0);
  });
}

function getManualSortedEvents(events: TimelineEvent[]) {
  return [...events].sort((a, b) => {
    const orderComparison = (a.order ?? 0) - (b.order ?? 0);

    if (orderComparison !== 0) {
      return orderComparison;
    }

    return a.start.localeCompare(b.start);
  });
}

function getSortedEvents(events: TimelineEvent[], sortMode: TimelineSortMode) {
  if (sortMode === "time") {
    return getTimeSortedEvents(events);
  }

  return getManualSortedEvents(events);
}

function normalizeManualOrder(events: TimelineEvent[]) {
  return getManualSortedEvents(events).map((event, index) => ({
    ...event,
    order: index
  }));
}

function reorderEvents(
  events: TimelineEvent[],
  draggedEventId: string,
  targetEventId: string
) {
  const sortedEvents = getManualSortedEvents(events);

  const draggedIndex = sortedEvents.findIndex((event) => event.id === draggedEventId);
  const targetIndex = sortedEvents.findIndex((event) => event.id === targetEventId);

  if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
    return events;
  }

  const reorderedEvents = [...sortedEvents];
  const [draggedEvent] = reorderedEvents.splice(draggedIndex, 1);

  if (!draggedEvent) {
    return events;
  }

  reorderedEvents.splice(targetIndex, 0, draggedEvent);

  return reorderedEvents.map((event, index) => ({
    ...event,
    order: index
  }));
}

export function TimelineEditor() {
  const [timeline, setTimeline] = useState<TimelineDocument>(() => ({
    ...sampleTimeline,
    events: normalizeManualOrder(sampleTimeline.events)
  }));

  const [sortMode, setSortMode] = useState<TimelineSortMode>("time");
  const [viewMode, setViewMode] = useState<TimelineViewMode>("cards");

  const [editingEventId, setEditingEventId] = useState<string | null>(
    sampleTimeline.events[0]?.id ?? null
  );

  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [dragOverEventId, setDragOverEventId] = useState<string | null>(null);

  const sortedEvents = useMemo(() => {
    return getSortedEvents(timeline.events, sortMode);
  }, [timeline.events, sortMode]);

  const editingEvent = useMemo(() => {
    if (!editingEventId) {
      return null;
    }

    return timeline.events.find((event) => event.id === editingEventId) ?? null;
  }, [editingEventId, timeline.events]);

  const isManualSortMode = sortMode === "manual";

  function updateEvent(eventId: string, updates: Partial<TimelineEvent>) {
    const now = new Date().toISOString();

    setTimeline((currentTimeline) => ({
      ...currentTimeline,
      events: currentTimeline.events.map((event) =>
        event.id === eventId
          ? {
              ...event,
              ...updates,
              updatedAt: now
            }
          : event
      ),
      updatedAt: now
    }));
  }

  function addEvent() {
    const now = new Date().toISOString();
    const normalizedEvents = normalizeManualOrder(timeline.events);
    const nextOrder = normalizedEvents.length;

    const newEvent: TimelineEvent = {
      id: crypto.randomUUID(),
      title: "New timeline event",
      description: "",
      start: now,
      end: null,
      order: nextOrder,
      laneId: timeline.lanes[0]?.id ?? null,

      category: "General",
      eventType: "Manual Entry",
      status: "Initial Access",
      severity: "Informational",

      color: "#2563eb",
      icon: "Dot",
      displayStyle: "Solid",

      tags: [],
      source: "Manual entry",
      evidenceUrl: "",
      confidence: "Medium",
      actor: "",
      location: "",

      createdAt: now,
      updatedAt: now
    };

    setTimeline((currentTimeline) => ({
      ...currentTimeline,
      events: [...normalizeManualOrder(currentTimeline.events), newEvent],
      updatedAt: now
    }));

    setEditingEventId(newEvent.id);
  }

  function duplicateEvent(event: TimelineEvent) {
    const now = new Date().toISOString();
    const normalizedEvents = normalizeManualOrder(timeline.events);
    const nextOrder = normalizedEvents.length;

    const duplicatedEvent: TimelineEvent = {
      ...event,
      id: crypto.randomUUID(),
      title: `${event.title} Copy`,
      order: nextOrder,
      createdAt: now,
      updatedAt: now
    };

    setTimeline((currentTimeline) => ({
      ...currentTimeline,
      events: [...normalizeManualOrder(currentTimeline.events), duplicatedEvent],
      updatedAt: now
    }));

    setEditingEventId(duplicatedEvent.id);
  }

  function deleteEvent(eventId: string) {
    const now = new Date().toISOString();

    setTimeline((currentTimeline) => {
      const remainingEvents = currentTimeline.events.filter(
        (event) => event.id !== eventId
      );

      return {
        ...currentTimeline,
        events: normalizeManualOrder(remainingEvents),
        updatedAt: now
      };
    });

    if (editingEventId === eventId) {
      setEditingEventId(null);
    }
  }

  function handleSortModeChange(nextSortMode: TimelineSortMode) {
    setDraggedEventId(null);
    setDragOverEventId(null);
    setSortMode(nextSortMode);
  }

  function handleDragStart(eventId: string) {
    if (!isManualSortMode) {
      return;
    }

    setDraggedEventId(eventId);
    setDragOverEventId(null);
  }

  function handleDragOver(eventId: string) {
    if (!isManualSortMode || !draggedEventId || draggedEventId === eventId) {
      return;
    }

    setDragOverEventId(eventId);
  }

  function handleDrop(targetEventId: string) {
    if (!isManualSortMode || !draggedEventId) {
      return;
    }

    const now = new Date().toISOString();

    setTimeline((currentTimeline) => ({
      ...currentTimeline,
      events: reorderEvents(currentTimeline.events, draggedEventId, targetEventId),
      updatedAt: now
    }));

    setDraggedEventId(null);
    setDragOverEventId(null);
  }

  function handleDragEnd() {
    setDraggedEventId(null);
    setDragOverEventId(null);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto max-w-7xl p-6">
        <TimelineHeader
          timeline={timeline}
          sortMode={sortMode}
          viewMode={viewMode}
          onSortModeChange={handleSortModeChange}
          onViewModeChange={setViewMode}
          onAddEvent={addEvent}
        />

        <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-slate-300">
          {viewMode === "horizontal" ? (
            <span>
              Current view:{" "}
              <strong className="text-slate-100">Horizontal Timeline</strong>.
              Events are displayed as a scrolling diagram.
            </span>
          ) : sortMode === "time" ? (
            <span>
              Current view: <strong className="text-slate-100">Card View</strong>{" "}
              sorted by time. Drag-and-drop is disabled in this mode.
            </span>
          ) : (
            <span>
              Current view: <strong className="text-slate-100">Card View</strong>{" "}
              using manual order. Drag cards to reorder without changing timestamps.
            </span>
          )}
        </div>

        {viewMode === "horizontal" ? (
          <TimelineHorizontalView
            events={sortedEvents}
            onEdit={setEditingEventId}
          />
        ) : (
          <div className="grid gap-4">
            {sortedEvents.map((event) => (
              <TimelineEventCard
                key={event.id}
                event={event}
                isDragEnabled={isManualSortMode}
                isDragging={draggedEventId === event.id}
                isDragOver={dragOverEventId === event.id}
                onEdit={setEditingEventId}
                onUpdate={updateEvent}
                onDuplicate={duplicateEvent}
                onDelete={deleteEvent}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
              />
            ))}
          </div>
        )}
      </section>

      <TimelineEventEditModal
        event={editingEvent}
        lanes={timeline.lanes}
        onUpdate={updateEvent}
        onClose={() => setEditingEventId(null)}
      />
    </main>
  );
}