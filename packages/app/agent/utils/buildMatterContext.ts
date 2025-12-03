import type {
  MatterService as MatterServiceType,
  TimekeeperRoleService as TimekeeperRoleServiceType,
  BillService as BillServiceType,
} from "../../core";
import { notFound } from "@hapi/boom";

export interface BuildMatterContextDeps {
  services: {
    matter: MatterServiceType;
    timekeeperRole: TimekeeperRoleServiceType;
    bill: BillServiceType;
  };
}

/**
 * Formats a date range into a human-readable string.
 * E.g., "Jan 1-31, 2024" or "Dec 25, 2023 - Jan 5, 2024"
 */
function formatDateRange(start: Date, end: Date): string {
  const startMonth = start.toLocaleDateString("en-US", { month: "short" });
  const startDay = start.getDate();
  const startYear = start.getFullYear();

  const endMonth = end.toLocaleDateString("en-US", { month: "short" });
  const endDay = end.getDate();
  const endYear = end.getFullYear();

  // Same month and year
  if (startMonth === endMonth && startYear === endYear) {
    return `${startMonth} ${startDay}-${endDay}, ${startYear}`;
  }

  // Same year
  if (startYear === endYear) {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${startYear}`;
  }

  // Different years
  return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
}

/**
 * Formats the time entry metadata schema into a human-readable list.
 */
function formatMetadataSchema(
  schema: Record<
    string,
    | { type: "string"; name: string }
    | { type: "number"; name: string }
    | { type: "enum"; name: string; values: { name: string; value: string }[] }
  > | null
): string {
  if (!schema || Object.keys(schema).length === 0) {
    return "None defined";
  }

  const lines = Object.entries(schema).map(([key, field]) => {
    if (field.type === "enum") {
      const values = field.values
        .map((v) => `\`${v.value}\` (${v.name})`)
        .join(", ");
      return `- **${key}** (${field.name}): ${values}`;
    }
    return `- **${key}** (${field.name}): ${field.type}`;
  });

  return lines.join("\n");
}

/**
 * Builds a comprehensive matter context string for the agent's system prompt.
 * Includes matter details, assigned timekeepers with roles, and bill summaries.
 *
 * @param matterId The ID of the matter to build context for
 * @param deps Dependencies containing services
 * @returns A formatted markdown string with matter context
 * @throws {notFound} If the matter doesn't exist
 */
export async function buildMatterContext(
  matterId: string,
  deps: BuildMatterContextDeps
): Promise<string> {
  const { services } = deps;

  // Fetch matter
  const matter = await services.matter.getMatter(matterId);
  if (!matter) {
    throw notFound(`Matter with ID ${matterId} not found`);
  }

  // Fetch enriched timekeepers
  const enrichedTimekeepers =
    await services.timekeeperRole.getEnrichedTimekeeperRolesByMatter(matterId);

  // Fetch bill summaries
  const billSummaries = await services.bill.getBillSummariesByMatter(matterId);

  // Build the context string
  let context = "## Matter Context\n\n";

  // Matter details
  context += `**Client**: ${matter.clientName}\n`;
  context += `**Matter**: ${matter.matterName}\n`;
  if (matter.description) {
    context += `**Description**: ${matter.description}\n`;
  }
  context += "\n\n";

  // Timekeepers section
  if (enrichedTimekeepers.length > 0) {
    context += "### Timekeepers\n\n";
    for (const { timekeeper, role, timekeeperRole } of enrichedTimekeepers) {
      context += `- **${timekeeper.name}** (${timekeeper.email}) - $${timekeeperRole.billableRate} - ${role.name}${role.description ? ` (${role.description})` : ""}\n`;
    }
    context += "\n";
  } else {
    context += "### Timekeepers\n\nNo timekeepers assigned to this matter.\n\n";
  }

  // Bills section
  if (billSummaries.length > 0) {
    context += "### Bills\n\n";
    for (const { bill, timeEntryCount } of billSummaries) {
      const dateRange = formatDateRange(bill.periodStart, bill.periodEnd);
      const entryText =
        timeEntryCount === 1
          ? "1 time entry"
          : `${timeEntryCount} time entries`;
      context += `- Bill \`${bill.id}\` (${dateRange}) - GBP - ${bill.status} - ${entryText}\n`;
    }
  } else {
    context += "### Bills\n\nNo bills created for this matter.\n";
  }
  context += "\n\n";

  // Metadata schema for time entries
  context += "### Time Entry Metadata Schema:\n";
  context += formatMetadataSchema(matter.timeEntryMetadataSchema);

  return context;
}
