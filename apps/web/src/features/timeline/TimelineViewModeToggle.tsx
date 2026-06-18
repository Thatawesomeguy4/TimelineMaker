import type { TimelineViewMode } from "./timelineViewTypes";

type TimelineViewModeToggleProps = {
  viewMode: TimelineViewMode;
  onViewModeChange: (viewMode: TimelineViewMode) => void;
};

export function TimelineViewModeToggle({
  viewMode,
  onViewModeChange
}: TimelineViewModeToggleProps) {
  return (
    <div className="flex rounded-xl border border-slate-700 bg-slate-900 p-1">
      <button
        type="button"
        onClick={() => onViewModeChange("cards")}
        className={[
          "rounded-lg px-4 py-2 text-sm font-semibold transition",
          viewMode === "cards"
            ? "bg-blue-600 text-white"
            : "text-slate-300 hover:bg-slate-800"
        ].join(" ")}
      >
        Card View
      </button>

      <button
        type="button"
        onClick={() => onViewModeChange("horizontal")}
        className={[
          "rounded-lg px-4 py-2 text-sm font-semibold transition",
          viewMode === "horizontal"
            ? "bg-blue-600 text-white"
            : "text-slate-300 hover:bg-slate-800"
        ].join(" ")}
      >
        Horizontal Timeline
      </button>
    </div>
  );
}