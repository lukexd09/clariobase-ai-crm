export function buildLeadUpdateActivityBody(changes: string[]) {
  return changes.length > 0 ? `Updated fields: ${changes.join(", ")}` : "Lead record updated";
}
