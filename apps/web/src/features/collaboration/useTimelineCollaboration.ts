import { useEffect, useMemo, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import type {
  TimelineDocument,
  TimelineEvent
} from "../../../../../packages/timeline-schema/src/types";

export type CollaborationStatus = "connected" | "disconnected" | "connecting";

export type TimelineMetadataSnapshot = Omit<TimelineDocument, "events">;

export function useTimelineCollaboration(collaborationRoomId: string | null) {
  const [status, setStatus] = useState<CollaborationStatus>("disconnected");

  const doc = useMemo(() => new Y.Doc(), [collaborationRoomId]);

  const eventsMap = useMemo(() => {
    return doc.getMap<TimelineEvent>("events");
  }, [doc]);

  const metadataMap = useMemo(() => {
    return doc.getMap<TimelineMetadataSnapshot>("metadata");
  }, [doc]);

  useEffect(() => {
    if (!collaborationRoomId) {
      setStatus("disconnected");
      return;
    }

    const provider = new WebsocketProvider(
      import.meta.env.VITE_COLLAB_WS_URL ?? "ws://localhost:1234",
      `timeline-${collaborationRoomId}`,
      doc
    );

    provider.on("status", (event: { status: CollaborationStatus }) => {
      setStatus(event.status);
    });

    provider.awareness.setLocalStateField("user", {
      name: "Local Developer",
      color: "#2563eb"
    });

    return () => {
      provider.destroy();
      doc.destroy();
      setStatus("disconnected");
    };
  }, [collaborationRoomId, doc]);

  return {
    doc,
    status,
    eventsMap,
    metadataMap
  };
}