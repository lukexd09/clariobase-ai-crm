export const ACTIVITY_TYPE_VALUES = [
  "NOTE",
  "CALL",
  "MESSAGE",
  "STATUS_CHANGE",
  "AUDIT",
  "OTHER"
] as const;

export type ActivityTypeValue = (typeof ACTIVITY_TYPE_VALUES)[number];
