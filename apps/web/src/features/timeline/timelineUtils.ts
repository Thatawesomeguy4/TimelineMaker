import type { CSSProperties } from "react";
import type {
  TimelineEvent,
  TimelineEventIcon,
  TimelineEventSeverity,
  TimelineEventStatus
} from "../../../../../packages/timeline-schema/src/types";

export function getEventIcon(icon?: TimelineEventIcon) {
  switch (icon) {
    case "Alert":
      return "⚠️";
    case "Check":
      return "✅";
    case "Flag":
      return "🚩";
    case "Bolt":
      return "⚡";
    case "Clock":
      return "🕒";
    case "User":
      return "👤";
    case "Document":
      return "📄";
    case "Dot":
    default:
      return "●";
  }
}

export function getSeverityBadgeClass(severity?: TimelineEventSeverity) {
  switch (severity) {
    case "Critical":
      return "bg-red-950 text-red-200 border-red-800";
    case "High":
      return "bg-orange-950 text-orange-200 border-orange-800";
    case "Medium":
      return "bg-yellow-950 text-yellow-200 border-yellow-800";
    case "Low":
      return "bg-blue-950 text-blue-200 border-blue-800";
    case "Informational":
    default:
      return "bg-slate-800 text-slate-200 border-slate-700";
  }
}

export function getStatusBadgeClass(status?: TimelineEventStatus) {
  switch (status) {
    case "Initial Access":
      return "bg-blue-950 text-blue-200 border-blue-800";
    case "Recon":
      return "bg-purple-950 text-purple-200 border-purple-800";
    case "Lateral Movement":
      return "bg-yellow-950 text-yellow-200 border-yellow-800";
    case "Exfiltration":
      return "bg-red-950 text-red-200 border-red-800";
    case "Remediation":
      return "bg-green-950 text-green-200 border-green-800";
    case "Denial of Service":
      return "bg-red-950 text-red-200 border-red-800";
  }
}

export function getEventCardStyle(event: TimelineEvent): CSSProperties {
  const color = event.color ?? "#2563eb";

  if (event.displayStyle === "Outline") {
    return {
      borderColor: color,
      backgroundColor: "transparent"
    };
  }

  if (event.displayStyle === "Muted") {
    return {
      borderColor: color,
      backgroundColor: `${color}22`
    };
  }

  return {
    borderColor: color,
    background: `linear-gradient(135deg, ${color}33, rgba(15, 23, 42, 0.95))`
  };
}

export function tagsToString(tags?: string[]) {
  return tags?.join(", ") ?? "";
}

export function stringToTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}