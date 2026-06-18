export type TimelineEventSeverity = "Informational" | "Low" | "Medium" | "High" | "Critical";

export type TimelineEventStatus =
  | "Initial Access"
  | "Recon"
  | "Lateral Movement"
  | "Exfiltration"
  | "Remediation"
  | "Denial of Service"

export type TimelineEventDisplayStyle = "Solid" | "Outline" | "Muted";

export type TimelineEventIcon =
  | "Dot"
  | "Alert"
  | "Check"
  | "Flag"
  | "Bolt"
  | "Clock"
  | "User"
  | "Document";

export type TimelineEvent = {
  id: string;

  title: string;
  description?: string;

  start: string;
  end?: string | null;

  laneId?: string | null;

  category?: string;
  eventType?: string;
  status?: TimelineEventStatus;
  severity?: TimelineEventSeverity;

  color?: string;
  icon?: TimelineEventIcon;
  displayStyle?: TimelineEventDisplayStyle;

  tags?: string[];

  source?: string;
  evidenceUrl?: string;
  confidence?: "Low" | "Medium" | "High";

  actor?: string;
  location?: string;

  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
};

export type TimelineLane = {
  id: string;
  name: string;
  description?: string;
};

export type TimelineDocument = {
  schemaVersion: "1.0";
  id: string;
  title: string;
  description?: string;
  timezone: string;
  lanes: TimelineLane[];
  events: TimelineEvent[];
  createdAt: string;
  updatedAt: string;
};