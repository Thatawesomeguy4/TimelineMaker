import type {
  TimelineEventDisplayStyle,
  TimelineEventIcon,
  TimelineEventSeverity,
  TimelineEventStatus
} from "../../../../../packages/timeline-schema/src/types";

export const EVENT_COLORS = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#ca8a04",
  "#9333ea",
  "#0891b2",
  "#f97316",
  "#64748b"
];

export const EVENT_ICONS: TimelineEventIcon[] = [
  "Dot",
  "Alert",
  "Check",
  "Flag",
  "Bolt",
  "Clock",
  "User",
  "Document"
];

export const EVENT_SEVERITIES: TimelineEventSeverity[] = [
  "Informational",
  "Low",
  "Medium",
  "High",
  "Critical"
];

export const EVENT_STATUSES: TimelineEventStatus[] = [
  "Initial Access",
  "Recon",
  "Lateral Movement",
  "Exfiltration",
  "Remediation",
  "Denial of Service",
];

export const DISPLAY_STYLES: TimelineEventDisplayStyle[] = [
  "Solid",
  "Outline",
  "Muted"
];