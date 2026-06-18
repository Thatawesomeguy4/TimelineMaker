import type { TimelineDocument } from "../../../../../packages/timeline-schema/src/types";

type TimelineHeaderProps = {
  timeline: TimelineDocument;
  onAddEvent: () => void;
};

export function TimelineHeader({ timeline, onAddEvent }: TimelineHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold">{timeline.title}</h1>
        <p className="mt-1 text-sm text-slate-400">{timeline.description}</p>
        <p className="mt-2 text-xs text-slate-500">
          {timeline.events.length} event(s) • Timezone: {timeline.timezone}
        </p>
      </div>

      <button
        onClick={onAddEvent}
        className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white shadow hover:bg-blue-500"
      >
        New Event
      </button>
    </div>
  );
}