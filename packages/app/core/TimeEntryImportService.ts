import Papa from "papaparse";
import {
  type TimeEntryRepository,
  type TimeEntryChangeLogRepository,
  type TimekeeperRoleRepository,
  type TimekeeperRepository,
  type RoleRepository,
  type BillRepository,
  type TimeEntry,
  type NewTimeEntry,
  newTimeEntryInputSchema,
  buildZodMetadataFieldSchema,
} from "@ai-starter/core";
import type { TimeEntryService as TimeEntryServiceType } from "./TimeEntryService";

import type { Matter, MatterRepository } from "@ai-starter/core";
import { CsvHeaderMappingService } from "./CsvHeaderMappingService";
import type z from "zod";

export interface Deps {
  repos: {
    timeEntry: TimeEntryRepository;
    timeEntryChangeLog: TimeEntryChangeLogRepository;
    timekeeperRole: TimekeeperRoleRepository;
    timekeeper: TimekeeperRepository;
    role: RoleRepository;
    bill: BillRepository;
    matter: MatterRepository;
  };
  services: {
    timeEntry: TimeEntryServiceType;
    csvMapping: CsvHeaderMappingService;
  };
}

export interface ImportResult {
  success: true;
  imported: TimeEntry[];
  count: number;
}

export interface ImportError {
  success: false;
  error: string;
  row?: number;
  details?: string;
}

export type ImportTimeEntriesResult = ImportResult | ImportError;

interface ParsedRow {
  date: string;
  timekeeperName: string;
  hours: string;
  description: string;
  billId?: string;
  [key: string]: string | undefined;
}

const PLACEHOLDER_ROLE_NAME = "Imported Timekeeper";

export const TimeEntryImportService = (deps: Deps) => {
  const { repos, services } = deps;

  /**
   * Get or create the placeholder role for imported timekeepers
   */
  const getOrCreatePlaceholderRole = async () => {
    // Check if placeholder role already exists
    const roles = await repos.role.list();
    const existingRole = roles.find((r) => r.name === PLACEHOLDER_ROLE_NAME);

    if (existingRole) {
      return existingRole;
    }

    // Create placeholder role
    const newRole = await repos.role.create({
      name: PLACEHOLDER_ROLE_NAME,
      description: "Auto-created role for timekeepers imported via CSV",
    });
    return newRole;
  };

  /**
   * Get or create a timekeeper by name, and ensure they have a role in the matter
   // TODO: I'd like to go through the CSV file, find all unique timekeeper names, then try to map them with AI as a more robust solution than exact string matching (maybe only if exact string matching fails)
   */
  const getOrCreateTimekeeperWithRole = async (
    timekeeperName: string,
    matterId: string,
    timekeeperCache: Map<string, string>
  ) => {
    // Check cache first
    const cached = timekeeperCache.get(timekeeperName);
    if (cached) {
      return cached;
    }

    // Try to find existing timekeeper by name
    const allTimekeepers = await repos.timekeeper.listAll();
    let timekeeper = allTimekeepers.find((t) => t.name === timekeeperName);

    // Create timekeeper if doesn't exist
    if (!timekeeper) {
      // Generate a placeholder email
      const placeholderEmail = `placeholder-${timekeeperName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}@import.local`;
      timekeeper = await repos.timekeeper.create({
        name: timekeeperName,
        email: placeholderEmail,
      });
    }

    // Check if timekeeper has a role in this matter
    const existingRole = await repos.timekeeperRole.findByTimekeeperAndMatter(
      timekeeper.id,
      matterId
    );

    // Create timekeeper role if doesn't exist
    if (!existingRole) {
      const placeholderRole = await getOrCreatePlaceholderRole();
      await repos.timekeeperRole.create({
        timekeeperId: timekeeper.id,
        matterId,
        roleId: placeholderRole.id,
        billableRate: 0, // Default to 0 for imported timekeepers
      });
    }

    // Cache the timekeeper ID
    timekeeperCache.set(timekeeperName, timekeeper.id);
    return timekeeper.id;
  };

  /**
   * Parse and validate CSV content with AI-powered header mapping
   */
  const parseCSV = async (
    csvContent: string,
    matter: Matter
  ): Promise<{ rows: ParsedRow[] } | ImportError> => {
    if (!csvContent || csvContent.trim().length === 0) {
      return {
        success: false,
        error: "CSV content is empty",
      };
    }

    // First parse with original headers to get the column names
    const parsed = Papa.parse<ParsedRow>(csvContent, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      const details = parsed.errors.join("\n ");
      return {
        success: false,
        error: "CSV parsing error",
        details,
      };
    }

    if (!parsed.data || parsed.data.length === 0) {
      return {
        success: false,
        error: "No data rows found in CSV",
      };
    }

    // Use AI to map headers to our expected field names
    const csvHeaders = Object.keys(parsed.data[0] || {});
    const mappingResult = await services.csvMapping.mapCsvHeaders(
      csvHeaders,
      matter
    );

    // Apply the mapping to transform the data
    const transformedRows: ParsedRow[] = parsed.data.map((row) => {
      const transformedRow: ParsedRow = {} as ParsedRow;

      for (const [originalHeader, value] of Object.entries(row)) {
        const mappedField = mappingResult.mapping[originalHeader];
        if (mappedField) {
          transformedRow[mappedField] = value;
        }
      }

      return transformedRow;
    });

    return { rows: transformedRows };
  };

  const parseTime = (timeStr: string): number | null => {
    // returns the time in hours as a number
    if (timeStr.includes(":")) {
      const [hoursStr, minutesStr] = timeStr.split(":");
      if (!hoursStr || !minutesStr) return null;

      const hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);
      if (isNaN(hours) || isNaN(minutes)) return null;
      return hours + minutes / 60;
    } else {
      const hours = parseFloat(timeStr);
      return isNaN(hours) ? null : hours;
    }
  };

  const parseDate = (dateStr: string): Date | null => {
    // parse using EU date formats (DD/MM/YYYY or DD-MM-YYYY
    const euDateRegex = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/;
    const match = dateStr.match(euDateRegex);
    if (match && match[1] && match[2] && match[3]) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1; // Months are 0-based
      const year = parseInt(match[3], 10);
      return new Date(year, month, day);
    }

    // Fallback to Date constructor
    const parsedDate = new Date(dateStr);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  };

  /**
   * Validate and transform a single row
   */
  const validateRow = async (
    row: ParsedRow,
    rowIndex: number,
    matterId: string,
    timekeeperCache: Map<string, string>,
    matter: Matter
  ): Promise<NewTimeEntry | ImportError> => {
    // Get or create timekeeper and ensure they have a role
    const timekeeperName = row.timekeeperName?.trim();
    if (!timekeeperName) {
      return {
        success: false,
        error: "Missing timekeeper name",
        row: rowIndex,
      };
    }

    const timekeeperId = await getOrCreateTimekeeperWithRole(
      timekeeperName,
      matterId,
      timekeeperCache
    );

    // Extract metadata (columns starting with "metadata.")
    const metadata: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      if (key.startsWith("metadata.") && value && value.trim()) {
        const metadataKey = key.substring("metadata.".length);
        metadata[metadataKey] = value.trim();
      }
    }
    let dateIso: string | undefined;
    try {
      dateIso = parseDate(row.date)?.toISOString();
    } catch {
      return {
        success: false,
        error: `Invalid date format: ${row.date}`,
        row: rowIndex,
      };
    }

    const draft = {
      matterId,
      timekeeperId,
      billId: row.billId?.trim() || undefined,
      date: dateIso,
      hours: parseTime(row.hours),
      description: row.description?.trim() || "",
      metadata,
    };
    try {
      const validated = newTimeEntryInputSchema(
        buildZodMetadataFieldSchema(matter.timeEntryMetadataSchema)
      ).parse(draft);
      return { ...validated, date: new Date(validated.date) };
    } catch (e) {
      return {
        success: false,
        error: `Validation error: ${(e as z.ZodError).issues.map((i) => i.path + ": " + i.message).join(",\n\t")}`,
        row: rowIndex,
      };
    }
  };

  return {
    /**
     * Import time entries from CSV content
     */
    importTimeEntries: async (
      matterId: string,
      csvContent: string
    ): Promise<ImportTimeEntriesResult> => {
      // Get matter for AI mapping
      const matter = await repos.matter.get(matterId);
      if (!matter) {
        return {
          success: false,
          error: "Matter not found",
        };
      }

      // Parse CSV with AI header mapping
      const parsedOrError = await parseCSV(csvContent, matter);
      if ("success" in parsedOrError && !parsedOrError.success) {
        return parsedOrError;
      }

      const rows = (parsedOrError as { rows: ParsedRow[] }).rows;

      // Validate all rows (fail-fast)
      const validatedRows: NewTimeEntry[] = [];
      const timekeeperCache = new Map<string, string>();

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row) continue;

        const result = await validateRow(
          row,
          i + 1,
          matterId,
          timekeeperCache,
          matter
        );

        if ("success" in result && !result.success) {
          return result;
        }
        validatedRows.push(result as NewTimeEntry);
      }

      // create time entries in bulk
      const created = await services.timeEntry.createTimeEntries(
        matterId,
        validatedRows
      );

      return {
        success: true,
        count: created.length,
        imported: created,
      };
    },
  };
};

export type TimeEntryImportService = ReturnType<typeof TimeEntryImportService>;
