import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type { TimelineDocument, TimelineEvent } from "../../../../../packages/timeline-schema/src/types";
import { openTimelineFile } from "../file-io/openTimelineFile";
import { saveTimelineFile } from "../file-io/saveTimelineFile";
import { TimelineEventCard } from "./TimelineEventCard";
import { TimelineEventEditModal } from "./TimelineEventEditModal";
import { TimelineHeader } from "./TimelineHeader";
import { TimelineHorizontalView } from "./TimelineHorizontalView";
import { sampleTimeline } from "./timelineSampleData";
import type { TimelineSortMode, TimelineViewMode } from "./timelineViewTypes";
import { TimelineStartMenu } from "./TimelineStartMenu";
import { useTimelineCollaboration } from "../collaboration/useTimelineCollaboration";

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
    order: event.order ?? index
  }));
}

function normalizeImportedTimeline(timeline: TimelineDocument): TimelineDocument {
  const now = new Date().toISOString();

  return {
    ...timeline,
    events: normalizeManualOrder(timeline.events),
    updatedAt: timeline.updatedAt || now
  };
}

function getSafeTimelineFileName(timeline: TimelineDocument) {
  const safeTitle = timeline.title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");

  return `${safeTitle || "timeline"}.timeline.json`;
}

function createBlankTimeline(): TimelineDocument {
  const now = new Date().toISOString();

  return {
    schemaVersion: "1.0",
    id: crypto.randomUUID(),
    title: "Untitled Timeline",
    description: "New timeline",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    lanes: [
      {
        id: "default-lane",
        name: "Default"
      }
    ],
    events: [],
    createdAt: now,
    updatedAt: now
  };
}

type TimelineMetadataSnapshot = Omit<TimelineDocument, "events">;

function getTimelineMetadataSnapshot(
  timeline: TimelineDocument
): TimelineMetadataSnapshot {
  const { events: _events, ...metadata } = timeline;
  return metadata;
}

function buildTimelineFromCollaborationState(
  fallbackTimeline: TimelineDocument,
  metadata: TimelineMetadataSnapshot | undefined,
  events: TimelineEvent[]
): TimelineDocument | null {
  if (!metadata) {
    return null;
  }

  return {
    ...fallbackTimeline,
    ...metadata,
    events: normalizeManualOrder(events)
  };
}

function getTimelineJson(timeline: TimelineDocument): string {
  return JSON.stringify(timeline);
}

function createCollaborationTimeline(collaborationRoomId: string): TimelineDocument {
  const now = new Date().toISOString();

  return {
    schemaVersion: "1.0",
    id: collaborationRoomId,
    title: `Collaborative Timeline: ${collaborationRoomId}`,
    description: "Shared collaboration workspace",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    lanes: [
      {
        id: "shared-lane",
        name: "Shared Events"
      }
    ],
    events: [],
    createdAt: now,
    updatedAt: now
  };
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
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const lastRemoteTimelineJsonRef = useRef<string | null>(null);
  const lastPublishedTimelineJsonRef = useRef<string | null>(null);

  const [timeline, setTimeline] = useState<TimelineDocument>(() => ({
    ...sampleTimeline,
    events: normalizeManualOrder(sampleTimeline.events)
  }));

  const [sortMode, setSortMode] = useState<TimelineSortMode>("time");
  const [viewMode, setViewMode] = useState<TimelineViewMode>("cards");

  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [dragOverEventId, setDragOverEventId] = useState<string | null>(null);
  const [fileMessage, setFileMessage] = useState<string | null>(null);
  const [isFileMessageVisible, setIsFileMessageVisible] = useState(false);

  
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(true);
  const [collaborationRoomId, setCollaborationRoomId] = useState<string | null>(null);

  const collaboration = useTimelineCollaboration(collaborationRoomId);


  const sortedEvents = useMemo(() => {
    return getSortedEvents(timeline.events, sortMode);
  }, [timeline.events, sortMode]);

  useEffect(() => {
    if (!collaborationRoomId) {
      return;
    }

    function applyRemoteTimelineState() {
      const metadata = collaboration.metadataMap.get("timeline");
      const remoteEvents = Array.from(collaboration.eventsMap.values());

      setTimeline((currentTimeline) => {
        const nextTimeline = buildTimelineFromCollaborationState(
          currentTimeline,
          metadata,
          remoteEvents
        );

        if (!nextTimeline) {
          return currentTimeline;
        }

        const nextTimelineJson = getTimelineJson(nextTimeline);

        lastRemoteTimelineJsonRef.current = nextTimelineJson;

        if (getTimelineJson(currentTimeline) === nextTimelineJson) {
          return currentTimeline;
        }

        return nextTimeline;
      });
    }

    collaboration.eventsMap.observe(applyRemoteTimelineState);
    collaboration.metadataMap.observe(applyRemoteTimelineState);

    applyRemoteTimelineState();

    return () => {
      collaboration.eventsMap.unobserve(applyRemoteTimelineState);
      collaboration.metadataMap.unobserve(applyRemoteTimelineState);
    };
  }, [
    collaborationRoomId,
    collaboration.eventsMap,
    collaboration.metadataMap
  ]);

  useEffect(() => {
    if (!collaborationRoomId) {
      return;
    }

    if (collaboration.status !== "connected") {
      return;
    }

    const timelineJson = getTimelineJson(timeline);

    if (timelineJson === lastRemoteTimelineJsonRef.current) {
      return;
    }

    if (timelineJson === lastPublishedTimelineJsonRef.current) {
      return;
    }

    collaboration.doc.transact(() => {
      const metadata = getTimelineMetadataSnapshot(timeline);
      collaboration.metadataMap.set("timeline", metadata);

      const currentEventIds = new Set(timeline.events.map((event) => event.id));

      for (const existingEventId of Array.from(collaboration.eventsMap.keys())) {
        if (!currentEventIds.has(existingEventId)) {
          collaboration.eventsMap.delete(existingEventId);
        }
      }

      for (const event of timeline.events) {
        collaboration.eventsMap.set(event.id, event);
      }
    });

    lastPublishedTimelineJsonRef.current = timelineJson;
  }, [
    collaborationRoomId,
    collaboration.status,
    collaboration.doc,
    collaboration.eventsMap,
    collaboration.metadataMap,
    timeline
  ]);

  useEffect(() => {
  if (!fileMessage) {
    return;
  }

  const fadeTimer = window.setTimeout(() => {
    setIsFileMessageVisible(false);
  }, 2500);

  const clearTimer = window.setTimeout(() => {
    setFileMessage(null);
  }, 3000);

  return () => {
    window.clearTimeout(fadeTimer);
    window.clearTimeout(clearTimer);
  };
}, [fileMessage]);

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

  function showFileMessage(message: string) {
  setFileMessage(message);
  setIsFileMessageVisible(true);
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

  async function handleSaveTimeline() {
    try {
      await saveTimelineFile(timeline, getSafeTimelineFileName(timeline));
      showFileMessage("Timeline saved successfully.");
    } catch (error) {
      showFileMessage(
        error instanceof Error
          ? `Save failed: ${error.message}`
          : "Save failed."
      );
    }
  }

  function handleImportTimelineClick() {
    importInputRef.current?.click();
  }

  async function handleImportTimelineFile(file: File) {
    try {
      const importedTimeline = await openTimelineFile(file);
      const normalizedTimeline = normalizeImportedTimeline(importedTimeline);

      setTimeline(normalizedTimeline);
      setEditingEventId(null);
      setDraggedEventId(null);
      setDragOverEventId(null);
      setCollaborationRoomId(null);

      lastRemoteTimelineJsonRef.current = null;
      lastPublishedTimelineJsonRef.current = null;

      setIsStartMenuOpen(false);
      showFileMessage(`Imported timeline: ${normalizedTimeline.title}`);
    } catch (error) {
      showFileMessage(
        error instanceof Error
          ? `Import failed: ${error.message}`
          : "Import failed. The selected file could not be loaded."
      );
    }
  }

  function handleImportInputChange(
    changeEvent: ChangeEvent<HTMLInputElement>
  ) {
    const file = changeEvent.target.files?.[0];

    if (file) {
      void handleImportTimelineFile(file);
    }

    changeEvent.target.value = "";
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

  function handleCreateNewTimeline() {
  const blankTimeline = createBlankTimeline();

  lastRemoteTimelineJsonRef.current = null;
  lastPublishedTimelineJsonRef.current = null;

  setTimeline(blankTimeline);
  setEditingEventId(null);
  setDraggedEventId(null);
  setDragOverEventId(null);
  setCollaborationRoomId(null);
  setIsStartMenuOpen(false);
  showFileMessage("Created new timeline.");
  }

  function handleOpenTimelineFromMenu() {
    importInputRef.current?.click();
  }

  function handleCollaborateOnTimeline(nextCollaborationRoomId: string) {
    const collaborativeTimeline = createCollaborationTimeline(nextCollaborationRoomId);

    lastRemoteTimelineJsonRef.current = null;
    lastPublishedTimelineJsonRef.current = null;

    setTimeline(collaborativeTimeline);
    setEditingEventId(null);
    setDraggedEventId(null);
    setDragOverEventId(null);
    setCollaborationRoomId(nextCollaborationRoomId);
    setIsStartMenuOpen(false);
    showFileMessage(`Joined collaboration room: ${nextCollaborationRoomId}`);
  }

  if (isStartMenuOpen) {
    return (
      <>
        <input
          ref={importInputRef}
          type="file"
          accept=".json,.timeline.json,application/json"
          onChange={handleImportInputChange}
          className="hidden"
        />

        <TimelineStartMenu
          onCreateNewTimeline={handleCreateNewTimeline}
          onOpenTimeline={handleOpenTimelineFromMenu}
          onCollaborate={handleCollaborateOnTimeline}
        />
      </>
    );
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
          onSaveTimeline={handleSaveTimeline}
          onImportTimelineClick={handleImportTimelineClick}
          onOpenStartMenu={() => setIsStartMenuOpen(true)}
        />

        <input
          ref={importInputRef}
          type="file"
          accept=".json,.timeline.json,application/json"
          onChange={handleImportInputChange}
          className="hidden"
        />

        {fileMessage ? (
            <div
              className={[
                "mb-4 rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-slate-300",
                "transition-opacity duration-500",
                isFileMessageVisible ? "opacity-100" : "opacity-0"
              ].join(" ")}
            >
              {fileMessage}
            </div>
          ) : null}

        {collaborationRoomId ? (
          <div className="mb-4 rounded-xl border border-purple-800 bg-purple-950 p-3 text-sm text-purple-100">
            <div>
              Collaboration room:{" "}
              <strong className="text-white">{collaborationRoomId}</strong>
            </div>
            <div className="mt-1 text-xs text-purple-200/80">
              Status: <strong>{collaboration.status}</strong>
            </div>
          </div>
        ) : null}

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
