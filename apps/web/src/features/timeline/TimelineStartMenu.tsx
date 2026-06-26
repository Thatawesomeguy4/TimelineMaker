import { useState } from "react";

type TimelineStartMenuProps = {
  onCreateNewTimeline: () => void;
  onOpenTimeline: () => void;
  onCollaborate: (collaborationRoomId: string) => void;
};

export function TimelineStartMenu({
  onCreateNewTimeline,
  onOpenTimeline,
  onCollaborate
}: TimelineStartMenuProps) {
  const [collaborationRoomId, setCollaborationRoomId] = useState("");

  function handleCollaborate() {
    const trimmedRoomId = collaborationRoomId.trim();

    if (!trimmedRoomId) {
      return;
    }

    onCollaborate(trimmedRoomId);
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl items-center justify-center">
        <div className="w-full rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-black tracking-tight">
              Timeline Authoring Tool
            </h1>
            <p className="mt-3 text-slate-400">
              Create a new timeline, open a saved timeline, or join a shared
              collaboration workspace.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <button
              type="button"
              onClick={onCreateNewTimeline}
              className="rounded-2xl border border-blue-800 bg-blue-950 p-5 text-left shadow transition hover:-translate-y-1 hover:border-blue-500 hover:bg-blue-900"
            >
              <div className="text-2xl">🆕</div>
              <div className="mt-4 text-lg font-bold">New Timeline</div>
              <p className="mt-2 text-sm text-blue-100/80">
                Start with a blank timeline and begin adding events.
              </p>
            </button>

            <button
              type="button"
              onClick={onOpenTimeline}
              className="rounded-2xl border border-slate-700 bg-slate-950 p-5 text-left shadow transition hover:-translate-y-1 hover:border-slate-400 hover:bg-slate-800"
            >
              <div className="text-2xl">📂</div>
              <div className="mt-4 text-lg font-bold">Open Timeline</div>
              <p className="mt-2 text-sm text-slate-400">
                Import a local <span className="font-semibold">.timeline.json</span>{" "}
                file from this workstation.
              </p>
            </button>

            <div className="rounded-2xl border border-purple-800 bg-purple-950 p-5 shadow">
              <div className="text-2xl">🤝</div>
              <div className="mt-4 text-lg font-bold">Collaborate</div>
              <p className="mt-2 text-sm text-purple-100/80">
                Enter a collaboration room or shared timeline ID.
              </p>

              <input
                value={collaborationRoomId}
                onChange={(event) => setCollaborationRoomId(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleCollaborate();
                  }
                }}
                placeholder="Example: incident-2026-001"
                className="mt-4 w-full rounded-xl border border-purple-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
              />

              <button
                type="button"
                onClick={handleCollaborate}
                disabled={!collaborationRoomId.trim()}
                className="mt-3 w-full rounded-xl bg-purple-700 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Join Timeline
              </button>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
            <strong className="text-slate-200">Note:</strong> Local open/save
            uses timeline JSON files. Collaboration room selection prepares the
            workspace for shared editing; real-time sync can be connected to the
            Yjs collaboration hook next.
          </div>
        </div>
      </section>
    </main>
  );
}