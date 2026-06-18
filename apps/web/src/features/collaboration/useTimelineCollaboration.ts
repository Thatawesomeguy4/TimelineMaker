import { useEffect, useMemo, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

type CollaborationStatus = "connected" | "disconnected" | "connecting";

export function useTimelineCollaboration(timelineId: string) {
  const [status, setStatus] = useState<CollaborationStatus>("disconnected");

  const doc = useMemo(() => new Y.Doc(), [timelineId]);

  useEffect(() => {
    const provider = new WebsocketProvider(
      import.meta.env.VITE_COLLAB_WS_URL ?? "ws://localhost:1234",
      `timeline-${timelineId}`,
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
    };
  }, [doc, timelineId]);

  return {
    doc,
    status,
    events: doc.getMap("events"),
    metadata: doc.getMap("metadata")
  };
}