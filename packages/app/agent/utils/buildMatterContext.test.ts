import { describe, test, expect } from "bun:test";
import {
  testDB,
  doSeedRoles,
  createTestTimekeeper,
  createTestTimekeeperRole,
} from "@ai-starter/db/test-utils";
import { getRepos } from "@ai-starter/db";
import { MatterService, BillService, TimekeeperRoleService } from "../../core";
import { buildMatterContext } from "./buildMatterContext";

describe("buildMatterContext", () => {
  test("should build comprehensive matter context with all details", async () => {
    const db = await testDB({ seed: false });
    const repos = getRepos(db);
    await doSeedRoles(db);

    // Create services
    const matterService = MatterService({ repos: { matter: repos.matter } });
    const billService = BillService({
      repos: { bill: repos.bill, timeEntry: repos.timeEntry },
    });
    const timekeeperRoleService = TimekeeperRoleService({
      repos: {
        timekeeperRole: repos.timekeeperRole,
        timekeeper: repos.timekeeper,
        role: repos.role,
      },
    });

    // Create a matter with metadata schema
    const matter = await matterService.createMatter({
      clientName: "Acme Corporation",
      matterName: "Patent Litigation 2024",
      description: "Defense of patent infringement claims related to software",
      timeEntryMetadataSchema: {
        task_code: {
          type: "enum",
          name: "Task Code",
          values: [
            { name: "Research", value: "research" },
            { name: "Drafting", value: "drafting" },
            { name: "Court Appearance", value: "court" },
          ],
        },
        urgency: {
          type: "enum",
          name: "Urgency Level",
          values: [
            { name: "Low", value: "low" },
            { name: "Medium", value: "medium" },
            { name: "High", value: "high" },
          ],
        },
        case_number: {
          type: "string",
          name: "Case Number",
        },
      },
    });

    // Create timekeepers
    const partner = await createTestTimekeeper(db, {
      name: "Jane Smith",
      email: "jane.smith@lawfirm.com",
    });
    const associate = await createTestTimekeeper(db, {
      name: "John Doe",
      email: "john.doe@lawfirm.com",
    });

    if (!partner || !associate) {
      throw new Error("Failed to create timekeepers");
    }

    // Get roles from seed
    const roles = await repos.role.list();
    const partnerRole = roles.find((r) => r.name === "Partner");
    const associateRole = roles.find((r) => r.name === "Associate");

    if (!partnerRole || !associateRole) {
      throw new Error("Roles not found");
    }

    // Assign timekeepers to matter
    await createTestTimekeeperRole(db, partner.id, matter.id, {
      roleId: partnerRole.id,
      billableRate: 500,
    });
    await createTestTimekeeperRole(db, associate.id, matter.id, {
      roleId: associateRole.id,
      billableRate: 300,
    });

    // Create bills
    const bill1 = await billService.createBill({
      matterId: matter.id,
      periodStart: new Date("2024-01-01"),
      periodEnd: new Date("2024-01-31"),
      status: "draft",
    });

    const bill2 = await billService.createBill({
      matterId: matter.id,
      periodStart: new Date("2024-02-01"),
      periodEnd: new Date("2024-02-29"),
      status: "finalized",
    });

    // Create time entries
    await repos.timeEntry.createMany([
      {
        matterId: matter.id,
        timekeeperId: partner.id,
        billId: bill1.id,
        date: new Date("2024-01-15"),
        hours: 4,
        description: "Initial consultation",
      },
    ]);

    await repos.timeEntry.createMany([
      {
        matterId: matter.id,
        timekeeperId: associate.id,
        billId: bill1.id,
        date: new Date("2024-01-20"),
        hours: 3,
        description: "Legal research",
        metadata: {},
      },
    ]);

    await repos.timeEntry.createMany([
      {
        matterId: matter.id,
        timekeeperId: associate.id,
        billId: bill2.id,
        date: new Date("2024-02-10"),
        hours: 4,
        description: "Draft motion",
        metadata: { phase: "drafting" },
      },
    ]);

    // Build context
    const context = await buildMatterContext(matter.id, {
      services: {
        matter: matterService,
        timekeeperRole: timekeeperRoleService,
        bill: billService,
      },
    });

    // Snapshot test to visually inspect the output
    expect(context).toMatchSnapshot();
  });

  test("should handle matter with no timekeepers or bills", async () => {
    const db = await testDB({ seed: false });
    const repos = getRepos(db);

    // Create services
    const matterService = MatterService({ repos: { matter: repos.matter } });
    const billService = BillService({
      repos: { bill: repos.bill, timeEntry: repos.timeEntry },
    });
    const timekeeperRoleService = TimekeeperRoleService({
      repos: {
        timekeeperRole: repos.timekeeperRole,
        timekeeper: repos.timekeeper,
        role: repos.role,
      },
    });

    // Create a simple matter
    const matter = await matterService.createMatter({
      clientName: "Simple Corp",
      matterName: "Quick Consultation",
      description: null,
    });

    // Build context
    const context = await buildMatterContext(matter.id, {
      services: {
        matter: matterService,
        timekeeperRole: timekeeperRoleService,
        bill: billService,
      },
    });

    // Snapshot test
    expect(context).toMatchSnapshot();
  });

  test("should throw error if matter does not exist", async () => {
    const db = await testDB({ seed: false });
    const repos = getRepos(db);

    // Create services
    const matterService = MatterService({ repos: { matter: repos.matter } });
    const billService = BillService({
      repos: { bill: repos.bill, timeEntry: repos.timeEntry },
    });
    const timekeeperRoleService = TimekeeperRoleService({
      repos: {
        timekeeperRole: repos.timekeeperRole,
        timekeeper: repos.timekeeper,
        role: repos.role,
      },
    });

    // Try to build context for non-existent matter
    expect(
      buildMatterContext("non-existent-id", {
        services: {
          matter: matterService,
          timekeeperRole: timekeeperRoleService,
          bill: billService,
        },
      })
    ).rejects.toThrow("Matter with ID non-existent-id not found");
  });
});
