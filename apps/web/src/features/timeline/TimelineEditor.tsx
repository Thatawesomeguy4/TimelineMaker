import { useMemo, useState } from "react";
import type {
  TimelineDocument,
  TimelineEvent
} from "../../../../../packages/timeline-schema/src/types";
import { TimelineEventCard } from "./TimelineEventCard";
import { TimelineEventEditModal } from "./TimelineEventEditModal";
import { TimelineHeader } from "./TimelineHeader";
import { sampleTimeline } from "./timelineSampleData";

export function TimelineEditor() {
  const [timeline, setTimeline] = useState<TimelineDocument>(sampleTimeline);
  const [editingEventId, setEditingEventId] = useState<string | null>(
    sampleTimeline.events[0]?.id ?? null
  );

  const sortedEvents = useMemo(() => {
    return [...timeline.events].sort((a, b) => a.start.localeCompare(b.start));
  }, [timeline.events]);

  const editingEvent = useMemo(() => {
    if (!editingEventId) {
      return null;
    }

    return timeline.events.find((event) => event.id === editingEventId) ?? null;
  }, [editingEventId, timeline.events]);

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

    const newEvent: TimelineEvent = {
      id: crypto.randomUUID(),
      title: "New timeline event",
      description: "",
      start: now,
      end: null,
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
      events: [...currentTimeline.events, newEvent],
      updatedAt: now
    }));

    setEditingEventId(newEvent.id);
  }

  function duplicateEvent(event: TimelineEvent) {
    const now = new Date().toISOString();

    const duplicatedEvent: TimelineEvent = {
      ...event,
      id: crypto.randomUUID(),
      title: `${event.title} Copy`,
      createdAt: now,
      updatedAt: now
    };

    setTimeline((currentTimeline) => ({
      ...currentTimeline,
      events: [...currentTimeline.events, duplicatedEvent],
      updatedAt: now
    }));

    setEditingEventId(duplicatedEvent.id);
  }

  function deleteEvent(eventId: string) {
    const now = new Date().toISOString();

    setTimeline((currentTimeline) => ({
      ...currentTimeline,
      events: currentTimeline.events.filter((event) => event.id !== eventId),
      updatedAt: now
    }));

    if (editingEventId === eventId) {
      setEditingEventId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto max-w-7xl p-6">
        <TimelineHeader timeline={timeline} onAddEvent={addEvent} />

        <div className="grid gap-4">
          {sortedEvents.map((event) => (
            <TimelineEventCard
              key={event.id}
              event={event}
              onEdit={setEditingEventId}
              onUpdate={updateEvent}
              onDuplicate={duplicateEvent}
              onDelete={deleteEvent}
            />
          ))}
        </div>
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