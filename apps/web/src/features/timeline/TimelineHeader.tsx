import type { TimelineDocument } from "../../../../../packages/timeline-schema/src/types";
import type { TimelineSortMode, TimelineViewMode } from "./timelineViewTypes";
import { TimelineViewModeToggle } from "./TimelineViewModeToggle";

type TimelineHeaderProps = {
  timeline: TimelineDocument;
  sortMode: TimelineSortMode;
  viewMode: TimelineViewMode;
  onSortModeChange: (sortMode: TimelineSortMode) => void;
  onViewModeChange: (viewMode: TimelineViewMode) => void;
  onAddEvent: () => void;
  onSaveTimeline: () => void;
  onImportTimelineClick: () => void;
  onOpenStartMenu: () => void;
};

export function TimelineHeader({  
timeline,
  sortMode,
  viewMode,
  onSortModeChange,
  onViewModeChange,
  onAddEvent,
  onSaveTimeline,
  onImportTimelineClick,
  onOpenStartMenu
}: TimelineHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{timeline.title}</h1>
          <p className="mt-1 text-sm text-slate-400">{timeline.description}</p>
          <p className="mt-2 text-xs text-slate-500">
            {timeline.events.length} event(s) • Timezone: {timeline.timezone}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenStartMenu}
            className="rounded-xl bg-slate-800 px-4 py-2 font-semibold text-slate-100 shadow hover:bg-slate-700">
            Menu
          </button>
          <button
            type="button"
            onClick={onImportTimelineClick}
            className="rounded-xl bg-slate-800 px-4 py-2 font-semibold text-slate-100 shadow hover:bg-slate-700">
            Import
          </button>

          <button
            type="button"
            onClick={onSaveTimeline}
            className="rounded-xl bg-green-700 px-4 py-2 font-semibold text-white shadow hover:bg-green-600">
            Save
          </button>

          <button
            type="button"
            onClick={onAddEvent}
            className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white shadow hover:bg-blue-500">
            New Event
          </button>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3 xl:grid-cols-2">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-200">
              Timeline Sort
            </div>
            <div className="text-xs text-slate-500">
              Chronological review or manual story ordering.
            </div>
          </div>

          <div className="flex rounded-xl border border-slate-700 bg-slate-900 p-1">
            <button
              type="button"
              onClick={() => onSortModeChange("time")}
              className={[
                "rounded-lg px-4 py-2 text-sm font-semibold transition",
                sortMode === "time"
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              ].join(" ")}
            >
              Sort by Time
            </button>

            <button
              type="button"
              onClick={() => onSortModeChange("manual")}
              className={[
                "rounded-lg px-4 py-2 text-sm font-semibold transition",
                sortMode === "manual"
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              ].join(" ")}
            >
              Manual Order
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-200">
              Timeline View
            </div>
            <div className="text-xs text-slate-500">
              Choose compact cards or a horizontal diagram.
            </div>
          </div>

          <TimelineViewModeToggle
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
          />
        </div>
      </div>
    </div>
  );
}