// @ts-ignore: zod may not be installed in all environments.
import { z } from "zod";

export const TimelineEventSeveritySchema = z.enum([
  "Informational",
  "Low",
  "Medium",
  "High",
  "Critical"
]);

export const TimelineEventStatusSchema = z.enum([
  "Initial Access",
  "Recon",
  "Lateral Movement",
  "Exfiltration",
  "Remediation",
  "Denial of Service",
]);

export const TimelineEventDisplayStyleSchema = z.enum([
  "Solid",
  "Outline",
  "Muted"
]);

export const TimelineEventIconSchema = z.enum([
  "Dot",
  "Alert",
  "Check",
  "Flag",
  "Bolt",
  "Clock",
  "User",
  "Document"
]);

export const TimelineEventSchema = z.object({
  id: z.string(),

  title: z.string().min(1),
  description: z.string().optional(),

  start: z.string(),
  end: z.string().nullable().optional(),

  laneId: z.string().nullable().optional(),

  category: z.string().optional(),
  eventType: z.string().optional(),
  status: TimelineEventStatusSchema.optional(),
  severity: TimelineEventSeveritySchema.optional(),

  color: z.string().optional(),
  icon: TimelineEventIconSchema.optional(),
  displayStyle: TimelineEventDisplayStyleSchema.optional(),

  tags: z.array(z.string()).optional(),

  source: z.string().optional(),
  evidenceUrl: z.string().optional(),
  confidence: z.enum(["Low", "Medium", "High"]).optional(),

  actor: z.string().optional(),
  location: z.string().optional(),

  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional()
});

export const TimelineLaneSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional()
});

export const TimelineDocumentSchema = z.object({
  schemaVersion: z.literal("1.0"),
  id: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  timezone: z.string(),
  lanes: z.array(TimelineLaneSchema),
  events: z.array(TimelineEventSchema),
  createdAt: z.string(),
  updatedAt: z.string()
});