import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import * as Y from "yjs";

import type {
  TimelineDocument,
  TimelineEvent
} from "../../../../../packages/timeline-schema/src/types";

import { useTimelineCollaboration } from "../collaboration/useTimelineCollaboration";
import type {
  TimelineEventMap,
  TimelineMetadataSnapshot
} from "../collaboration/useTimelineCollaboration";

import { openTimelineFile } from "../file-io/openTimelineFile";
import { saveTimelineFile } from "../file-io/saveTimelineFile";
import { TimelineEventCard } from "./TimelineEventCard";
import { TimelineEventEditModal } from "./TimelineEventEditModal";
import { TimelineHeader } from "./TimelineHeader";
import { TimelineHorizontalView } from "./TimelineHorizontalView";
import { TimelineStartMenu } from "./TimelineStartMenu";
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

const LOCAL_COLLABORATION_ORIGIN = "timeline-editor-local-change";

function getTimelineMetadataSnapshot(
  timeline: TimelineDocument
): TimelineMetadataSnapshot {
  return {
    schemaVersion: timeline.schemaVersion,
    id: timeline.id,
    title: timeline.title,
    description: timeline.description,
    timezone: timeline.timezone,
    lanes: timeline.lanes,
    createdAt: timeline.createdAt,
    updatedAt: timeline.updatedAt
  };
}

function writeEventToYMap(eventMap: TimelineEventMap, event: TimelineEvent) {
  eventMap.set("id", event.id);
  eventMap.set("title", event.title);
  eventMap.set("description", event.description);
  eventMap.set("start", event.start);
  eventMap.set("end", event.end ?? null);
  eventMap.set("order", event.order);
  eventMap.set("laneId", event.laneId ?? null);
  eventMap.set("category", event.category);
  eventMap.set("eventType", event.eventType);
  eventMap.set("status", event.status);
  eventMap.set("severity", event.severity);
  eventMap.set("color", event.color);
  eventMap.set("icon", event.icon);
  eventMap.set("displayStyle", event.displayStyle);
  eventMap.set("tags", event.tags ?? []);
  eventMap.set("source", event.source);
  eventMap.set("evidenceUrl", event.evidenceUrl);
  eventMap.set("confidence", event.confidence);
  eventMap.set("actor", event.actor);
  eventMap.set("location", event.location);
  eventMap.set("createdAt", event.createdAt);
  eventMap.set("updatedAt", event.updatedAt);
  eventMap.set("createdBy", event.createdBy);
  eventMap.set("updatedBy", event.updatedBy);
}

function patchEventYMap(
  eventMap: TimelineEventMap,
  updates: Partial<TimelineEvent>
) {
  for (const [key, value] of Object.entries(updates)) {
    eventMap.set(key, value as string | number | boolean | null | string[] | undefined);
  }
}

function readEventFromYMap(eventMap: TimelineEventMap): TimelineEvent | null {
  const id = eventMap.get("id");
  const title = eventMap.get("title");
  const start = eventMap.get("start");
  const createdAt = eventMap.get("createdAt");
  const updatedAt = eventMap.get("updatedAt");

  if (
    typeof id !== "string" ||
    typeof title !== "string" ||
    typeof start !== "string" ||
    typeof createdAt !== "string" ||
    typeof updatedAt !== "string"
  ) {
    return null;
  }

  return {
    id,
    title,
    description:
      typeof eventMap.get("description") === "string"
        ? (eventMap.get("description") as string)
        : "",
    start,
    end:
      typeof eventMap.get("end") === "string"
        ? (eventMap.get("end") as string)
        : null,
    order:
      typeof eventMap.get("order") === "number"
        ? (eventMap.get("order") as number)
        : undefined,
    laneId:
      typeof eventMap.get("laneId") === "string"
        ? (eventMap.get("laneId") as string)
        : null,
    category:
      typeof eventMap.get("category") === "string"
        ? (eventMap.get("category") as string)
        : undefined,
    eventType:
      typeof eventMap.get("eventType") === "string"
        ? (eventMap.get("eventType") as string)
        : undefined,
    status:
      typeof eventMap.get("status") === "string"
        ? (eventMap.get("status") as TimelineEvent["status"])
        : undefined,
    severity:
      typeof eventMap.get("severity") === "string"
        ? (eventMap.get("severity") as TimelineEvent["severity"])
        : undefined,
    color:
      typeof eventMap.get("color") === "string"
        ? (eventMap.get("color") as string)
        : undefined,
    icon:
      typeof eventMap.get("icon") === "string"
        ? (eventMap.get("icon") as TimelineEvent["icon"])
        : undefined,
    displayStyle:
      typeof eventMap.get("displayStyle") === "string"
        ? (eventMap.get("displayStyle") as TimelineEvent["displayStyle"])
        : undefined,
    tags: Array.isArray(eventMap.get("tags"))
      ? (eventMap.get("tags") as string[])
      : [],
    source:
      typeof eventMap.get("source") === "string"
        ? (eventMap.get("source") as string)
        : undefined,
    evidenceUrl:
      typeof eventMap.get("evidenceUrl") === "string"
        ? (eventMap.get("evidenceUrl") as string)
        : undefined,
    confidence:
      typeof eventMap.get("confidence") === "string"
        ? (eventMap.get("confidence") as TimelineEvent["confidence"])
        : undefined,
    actor:
      typeof eventMap.get("actor") === "string"
        ? (eventMap.get("actor") as string)
        : undefined,
    location:
      typeof eventMap.get("location") === "string"
        ? (eventMap.get("location") as string)
        : undefined,
    createdAt,
    updatedAt,
    createdBy:
      typeof eventMap.get("createdBy") === "string"
        ? (eventMap.get("createdBy") as string)
        : undefined,
    updatedBy:
      typeof eventMap.get("updatedBy") === "string"
        ? (eventMap.get("updatedBy") as string)
        : undefined
  };
}

function buildTimelineFromYjs(
  fallbackTimeline: TimelineDocument,
  metadata: TimelineMetadataSnapshot | undefined,
  eventsMap: Y.Map<TimelineEventMap>,
  eventOrderArray: Y.Array<string>
): TimelineDocument | null {
  if (!metadata) {
    return null;
  }

  const eventsById = new Map<string, TimelineEvent>();

  for (const [eventId, eventMap] of eventsMap.entries()) {
    const event = readEventFromYMap(eventMap);

    if (event) {
      eventsById.set(eventId, event);
    }
  }

  const orderedEvents: TimelineEvent[] = [];

  for (const eventId of eventOrderArray.toArray()) {
    const event = eventsById.get(eventId);

    if (event) {
      orderedEvents.push(event);
      eventsById.delete(eventId);
    }
  }

  for (const remainingEvent of eventsById.values()) {
    orderedEvents.push(remainingEvent);
  }

  return {
    ...fallbackTimeline,
    ...metadata,
    events: normalizeManualOrder(orderedEvents)
  };
}

function seedCollaborationDocument(
  collaboration: ReturnType<typeof useTimelineCollaboration>,
  timeline: TimelineDocument
) {
  collaboration.doc.transact(() => {
    collaboration.metadataMap.set(
      "timeline",
      getTimelineMetadataSnapshot(timeline)
    );

    collaboration.eventOrderArray.delete(0, collaboration.eventOrderArray.length);
    collaboration.eventOrderArray.push(timeline.events.map((event) => event.id));

    for (const event of timeline.events) {
      let eventMap = collaboration.eventsMap.get(event.id);

      if (!eventMap) {
        eventMap = new Y.Map();
        collaboration.eventsMap.set(event.id, eventMap);
      }

      writeEventToYMap(eventMap, event);
    }
  }, LOCAL_COLLABORATION_ORIGIN);
}

export function TimelineEditor() {
  // Refs to track the import input and last known timeline states
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const lastRemoteTimelineJsonRef = useRef<string | null>(null);
  const lastPublishedTimelineJsonRef = useRef<string | null>(null);
  const [lastRemoteChangeMessage, setLastRemoteChangeMessage] = useState<string | null>(null);

  // State for the timeline, sort mode, view mode, and collaboration
  const [timeline, setTimeline] = useState<TimelineDocument>(() => ({
    ...sampleTimeline,
    events: normalizeManualOrder(sampleTimeline.events)
  }));

  // State for sorting mode
  const [sortMode, setSortMode] = useState<TimelineSortMode>("time");
  const [viewMode, setViewMode] = useState<TimelineViewMode>("cards");

  // State for editing an event
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // State for event dragging in manual sort mode
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [dragOverEventId, setDragOverEventId] = useState<string | null>(null);
  
  // State for the file message and its visibility
  const [fileMessage, setFileMessage] = useState<string | null>(null);
  const [isFileMessageVisible, setIsFileMessageVisible] = useState(false);

  // State for collaboration room ID
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

    function applyRemoteState() {
      const metadata = collaboration.metadataMap.get("timeline");

      setTimeline((currentTimeline) => {
        const nextTimeline = buildTimelineFromYjs(
          currentTimeline,
          metadata,
          collaboration.eventsMap,
          collaboration.eventOrderArray
        );

        if (!nextTimeline) {
          return currentTimeline;
        }

        setLastRemoteChangeMessage("Remote timeline changes applied.");
        return nextTimeline;
      });
    }

    const observer = (_events: unknown, transaction: Y.Transaction) => {
      if (transaction.origin === LOCAL_COLLABORATION_ORIGIN) {
        return;
      }

      applyRemoteState();
    };

    collaboration.eventsMap.observeDeep(observer);
    collaboration.eventOrderArray.observe(observer);
    collaboration.metadataMap.observe(observer);

    applyRemoteState();

    return () => {
      collaboration.eventsMap.unobserveDeep(observer);
      collaboration.eventOrderArray.unobserve(observer);
      collaboration.metadataMap.unobserve(observer);
    };
  }, [
    collaborationRoomId,
    collaboration.eventsMap,
    collaboration.eventOrderArray,
    collaboration.metadataMap
  ]);

  // Remote to local synchronization effect
  useEffect(() => {
    if (!collaborationRoomId) {
      return;
    }

    function applyRemoteState() {
      const metadata = collaboration.metadataMap.get("timeline");

      setTimeline((currentTimeline) => {
        const nextTimeline = buildTimelineFromYjs(
          currentTimeline,
          metadata,
          collaboration.eventsMap,
          collaboration.eventOrderArray
        );

        if (!nextTimeline) {
          return currentTimeline;
        }

        setLastRemoteChangeMessage("Remote timeline changes applied.");
        return nextTimeline;
      });
    }

    const observer = (
      _events: unknown,
      transaction: Y.Transaction
    ) => {
      if (transaction.origin === LOCAL_COLLABORATION_ORIGIN) {
        return;
      }

      applyRemoteState();
    };

    collaboration.eventsMap.observeDeep(observer);
    collaboration.eventOrderArray.observe(observer);
    collaboration.metadataMap.observe(observer);

    applyRemoteState();

    return () => {
      collaboration.eventsMap.unobserveDeep(observer);
      collaboration.eventOrderArray.unobserve(observer);
      collaboration.metadataMap.unobserve(observer);
    };
  }, [
  collaborationRoomId,
  collaboration.eventsMap,
  collaboration.eventOrderArray,
  collaboration.metadataMap
  ]);

  // Seed effect for collaboration document when joining a room
  useEffect(() => {
    if (!collaborationRoomId) {
      return;
    }

    if (collaboration.status !== "connected") {
      return;
    }

    const hasRemoteMetadata = collaboration.metadataMap.has("timeline");
    const hasRemoteEvents = collaboration.eventsMap.size > 0;

    if (hasRemoteMetadata || hasRemoteEvents) {
      return;
    }

    seedCollaborationDocument(collaboration, timeline);
  }, [
    collaborationRoomId,
    collaboration.status,
    collaboration,
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

    const updatesWithTimestamp: Partial<TimelineEvent> = {
      ...updates,
      updatedAt: now
    };

    setTimeline((currentTimeline) => ({
      ...currentTimeline,
      events: currentTimeline.events.map((event) =>
        event.id === eventId
          ? {
              ...event,
              ...updatesWithTimestamp
            }
          : event
      ),
      updatedAt: now
    }));

    if (!collaborationRoomId || collaboration.status !== "connected") {
      return;
    }

    collaboration.doc.transact(() => {
      const eventMap = collaboration.eventsMap.get(eventId);

      if (!eventMap) {
        return;
      }

      patchEventYMap(eventMap, updatesWithTimestamp);
      collaboration.metadataMap.set("timeline", {
        ...getTimelineMetadataSnapshot(timeline),
        updatedAt: now
      });
    }, LOCAL_COLLABORATION_ORIGIN);
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

    if (collaborationRoomId && collaboration.status === "connected") {
      collaboration.doc.transact(() => {
        const eventMap = new Y.Map() as TimelineEventMap;
        writeEventToYMap(eventMap, newEvent);

        collaboration.eventsMap.set(newEvent.id, eventMap);
        collaboration.eventOrderArray.push([newEvent.id]);
        collaboration.metadataMap.set("timeline", {
          ...getTimelineMetadataSnapshot(timeline),
          updatedAt: now
        });
      }, LOCAL_COLLABORATION_ORIGIN);
    }

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

    if (collaborationRoomId && collaboration.status === "connected") {
      collaboration.doc.transact(() => {
        collaboration.eventsMap.delete(eventId);

        const existingOrder = collaboration.eventOrderArray.toArray();
        const index = existingOrder.indexOf(eventId);

        if (index >= 0) {
          collaboration.eventOrderArray.delete(index, 1);
        }

        collaboration.metadataMap.set("timeline", {
          ...getTimelineMetadataSnapshot(timeline),
          updatedAt: now
        });
      }, LOCAL_COLLABORATION_ORIGIN);
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

    const reorderedEvents = reorderEvents(
      timeline.events,
      draggedEventId,
      targetEventId
    );

    setTimeline((currentTimeline) => ({
      ...currentTimeline,
      events: reorderedEvents,
      updatedAt: now
    }));

    if (collaborationRoomId && collaboration.status === "connected") {
      collaboration.doc.transact(() => {
        collaboration.eventOrderArray.delete(0, collaboration.eventOrderArray.length);
        collaboration.eventOrderArray.push(reorderedEvents.map((event) => event.id));

        for (const event of reorderedEvents) {
          const eventMap = collaboration.eventsMap.get(event.id);

          if (eventMap) {
            eventMap.set("order", event.order);
            eventMap.set("updatedAt", now);
          }
        }

        collaboration.metadataMap.set("timeline", {
          ...getTimelineMetadataSnapshot(timeline),
          updatedAt: now
        });
      }, LOCAL_COLLABORATION_ORIGIN);
    }

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
        
        {lastRemoteChangeMessage ? (
              <div className="mt-1 text-xs text-purple-200/80">
                {lastRemoteChangeMessage}
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
