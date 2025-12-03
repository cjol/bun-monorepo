/* eslint-disable no-unexpected-multiline */
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as fs from "node:fs";
import { createClient } from "@ai-starter/api/client";
import { getApp, type App as _App } from "@ai-starter/api";
import { getContext } from "@ai-starter/api/context";
import { setupDB } from "./utils/db";
import { doSeedRoles } from "@ai-starter/db/test-utils/seed/timekeeper";

describe("API e2e", () => {
  let tmpDir: string;
  let client: ReturnType<typeof createClient>;

  beforeEach(async () => {
    const { db, tmpDir: dir, dbPath } = await setupDB("api-test-");
    tmpDir = dir;

    // Seed roles required for timekeeper creation
    await doSeedRoles(db);

    const ctx = getContext(`file:${dbPath}`);
    const app = getApp(ctx);
    client = createClient(app);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("should complete a full matter lifecycle with AI-assisted time entry management", async () => {
    // 1. Setup - Create Matter & Timekeeper
    const createMatterResponse = await client.matters.post({
      clientName: "Acme Corp",
      matterName: "Patent Litigation 2024",
      description: "Patent infringement case involving software patents",
    });
    expect(createMatterResponse.status).toBe(201);
    expect(createMatterResponse.data).toBeDefined();
    const matter = createMatterResponse.data!;
    expect(matter.clientName).toBe("Acme Corp");

    const listMattersResponse = await client.matters.get();
    expect(listMattersResponse.status).toBe(200);
    expect(listMattersResponse.data).toBeDefined();
    expect(listMattersResponse.data!.length).toBeGreaterThan(0);

    const createTimekeeperResponse = await client.timekeepers.post({
      name: "Jane Smith",
      email: "jane.smith@firm.com",
    });
    expect(createTimekeeperResponse.status).toBe(201);
    expect(createTimekeeperResponse.data).toBeDefined();
    const timekeeper = createTimekeeperResponse.data!;

    const listTimekeepersResponse = await client.timekeepers.get();
    expect(listTimekeepersResponse.status).toBe(200);
    expect(listTimekeepersResponse.data).toBeDefined();

    // 2. Create a Role first
    const createStandaloneRoleResponse = await client.roles.post({
      name: "Senior Associate",
      description: "Senior associate lawyer",
    });
    expect(createStandaloneRoleResponse.status).toBe(201);
    expect(createStandaloneRoleResponse.data).toBeDefined();
    const role = createStandaloneRoleResponse.data!;

    // 3. Configure Matter Resources with the role
    const createRoleResponse = await client
      .matters({
        matterId: matter.id,
      })
      ["timekeeper-roles"].post({
        timekeeperId: timekeeper.id,
        roleId: role.id,
        billableRate: 350.0,
      });
    expect(createRoleResponse.status).toBe(201);
    expect(createRoleResponse.data).toBeDefined();
    const timekeeperRole = createRoleResponse.data!;

    const listRolesResponse = await client
      .matters({
        matterId: matter.id,
      })
      ["timekeeper-roles"].get();
    expect(listRolesResponse.status).toBe(200);
    expect(listRolesResponse.data).toBeDefined();

    const listRolesByTimekeeperResponse = await client
      .matters({
        matterId: matter.id,
      })
      ["timekeeper-roles"].get({ query: { timekeeperId: timekeeper.id } });
    expect(listRolesByTimekeeperResponse.status).toBe(200);

    const createWorkflowResponse = await client
      .matters({ matterId: matter.id })
      .workflows.post({
        name: "Time Entry Review Process",
        instructions:
          "Review all time entries for clarity and accuracy. Ensure descriptions are detailed and professional.",
        trigger: "time_entry:batch_created",
      });
    expect(createWorkflowResponse.status).toBe(201);
    expect(createWorkflowResponse.data).toBeDefined();
    const workflow = createWorkflowResponse.data!;

    const listWorkflowsResponse = await client
      .matters({ matterId: matter.id })
      .workflows.get();
    expect(listWorkflowsResponse.status).toBe(200);

    const getWorkflowResponse = await client
      .matters({ matterId: matter.id })
      .workflows({ workflowId: workflow.id })
      .get();
    expect(getWorkflowResponse.status).toBe(200);
    expect(getWorkflowResponse.data?.name).toBe("Time Entry Review Process");

    // 3. Time Entry Management
    const createBillResponse = await client
      .matters({ matterId: matter.id })
      .bills.post({
        periodStart: "2024-01-01T00:00:00Z",
        periodEnd: "2024-01-31T23:59:59Z",
        status: "draft",
      });
    expect(createBillResponse.status).toBe(201);
    expect(createBillResponse.data).toBeDefined();
    const bill = createBillResponse.data!;

    const listBillsResponse = await client
      .matters({ matterId: matter.id })
      .bills.get();
    expect(listBillsResponse.status).toBe(200);

    const createTimeEntry1Response = await client
      .matters({
        matterId: matter.id,
      })
      ["time-entries"].post({
        timekeeperId: timekeeper.id,
        billId: bill.id,
        date: "2024-01-15T10:00:00Z",
        hours: 2.5,
        description: "reviewed docs",
      });
    expect(createTimeEntry1Response.status).toBe(201);
    expect(createTimeEntry1Response.data).toBeDefined();
    const timeEntry1 = createTimeEntry1Response.data!;

    const createTimeEntry2Response = await client
      .matters({
        matterId: matter.id,
      })
      ["time-entries"].post({
        timekeeperId: timekeeper.id,
        billId: bill.id,
        date: "2024-01-16T14:00:00Z",
        hours: 3.0,
        description: "client call",
      });
    expect(createTimeEntry2Response.status).toBe(201);
    expect(createTimeEntry2Response.data).toBeDefined();
    const timeEntry2 = createTimeEntry2Response.data!;

    const listTimeEntriesResponse = await client
      .matters({
        matterId: matter.id,
      })
      ["time-entries"].get();
    expect(listTimeEntriesResponse.status).toBe(200);
    expect(listTimeEntriesResponse.data?.length).toBe(2);

    const getTimeEntryResponse = await client
      .matters({
        matterId: matter.id,
      })
      ["time-entries"]({ timeEntryId: timeEntry1.id })
      .get();
    expect(getTimeEntryResponse.status).toBe(200);
    expect(getTimeEntryResponse.data?.description).toBe("reviewed docs");

    // 4. AI Suggestion Workflow
    const createSuggestion1Response = await client
      .matters({ matterId: matter.id })
      .suggestions.post({
        timeEntryId: timeEntry1.id,
        suggestedChanges: {
          matterId: matter.id,
          timekeeperId: timekeeper.id,
          billId: bill.id,
          date: "2024-01-15T10:00:00Z",
          hours: 2.5,
          description:
            "Reviewed and analyzed patent documentation and prior art references for infringement claims",
        },
      });
    expect(createSuggestion1Response.status).toBe(201);
    expect(createSuggestion1Response.data).toBeDefined();
    const suggestion1 = createSuggestion1Response.data!;

    const listSuggestionsResponse = await client
      .matters({ matterId: matter.id })
      .suggestions.get();
    expect(listSuggestionsResponse.status).toBe(200);
    expect(listSuggestionsResponse.data?.length).toBeGreaterThan(0);

    const listPendingSuggestionsResponse = await client
      .matters({ matterId: matter.id })
      .suggestions.get({ query: { status: "pending" } });
    expect(listPendingSuggestionsResponse.status).toBe(200);

    const getSuggestionResponse = await client
      .matters({ matterId: matter.id })
      .suggestions({ suggestionId: suggestion1.id })
      .get();
    expect(getSuggestionResponse.status).toBe(200);
    expect(getSuggestionResponse.data?.status).toBe("pending");

    const approveSuggestionResponse = await client
      .matters({ matterId: matter.id })
      .suggestions({ suggestionId: suggestion1.id })
      .approve.post();
    expect(approveSuggestionResponse.status).toBe(200);
    expect(approveSuggestionResponse.data?.status).toBe("approved");

    const createSuggestion2Response = await client
      .matters({ matterId: matter.id })
      .suggestions.post({
        timeEntryId: timeEntry2.id,
        suggestedChanges: {
          matterId: matter.id,
          timekeeperId: timekeeper.id,
          billId: bill.id,
          date: "2024-01-16T14:00:00Z",
          hours: 3.0,
          description:
            "Participated in conference call with client regarding case strategy",
        },
      });
    expect(createSuggestion2Response.status).toBe(201);
    const suggestion2 = createSuggestion2Response.data!;

    const rejectSuggestionResponse = await client
      .matters({ matterId: matter.id })
      .suggestions({ suggestionId: suggestion2.id })
      .reject.post();
    expect(rejectSuggestionResponse.status).toBe(200);
    expect(rejectSuggestionResponse.data?.status).toBe("rejected");

    // 5. Updates & Queries
    const updateTimeEntryResponse = await client
      .matters({
        matterId: matter.id,
      })
      ["time-entries"]({ timeEntryId: timeEntry2.id })
      .patch({
        hours: 3.5,
        description:
          "Conference call with client regarding litigation strategy",
      });
    expect(updateTimeEntryResponse.status).toBe(200);
    expect(updateTimeEntryResponse.data?.hours).toBe(3.5);

    const filterTimeEntriesByBillResponse = await client
      .matters({
        matterId: matter.id,
      })
      ["time-entries"].get({ query: { billId: bill.id } });
    expect(filterTimeEntriesByBillResponse.status).toBe(200);
    expect(filterTimeEntriesByBillResponse.data?.length).toBe(2);

    const updateWorkflowResponse = await client
      .matters({ matterId: matter.id })
      .workflows({ workflowId: workflow.id })
      .patch({
        instructions:
          "Review all time entries for clarity, accuracy, and compliance with billing guidelines.",
      });
    expect(updateWorkflowResponse.status).toBe(200);

    const updateRoleResponse = await client
      .matters({
        matterId: matter.id,
      })
      ["timekeeper-roles"]({ roleId: timekeeperRole.id })
      .patch({
        billableRate: 375.0,
      });
    expect(updateRoleResponse.status).toBe(200);
    expect(updateRoleResponse.data?.billableRate).toBe(375.0);

    const getRoleResponse = await client
      .matters({
        matterId: matter.id,
      })
      ["timekeeper-roles"]({ roleId: timekeeperRole.id })
      .get();
    expect(getRoleResponse.status).toBe(200);
    expect(getRoleResponse.data?.billableRate).toBe(375.0);

    // 6. Matter Updates
    const getMatterResponse = await client
      .matters({ matterId: matter.id })
      .get();
    expect(getMatterResponse.status).toBe(200);
    expect(getMatterResponse.data?.clientName).toBe("Acme Corp");

    const updateMatterResponse = await client
      .matters({ matterId: matter.id })
      .patch({
        description:
          "Patent infringement case involving software patents - discovery phase",
      });
    expect(updateMatterResponse.status).toBe(200);
    expect(updateMatterResponse.data?.description).toContain("discovery phase");

    const searchTimekeeperByEmailResponse = await client.timekeepers.get({
      query: { email: "jane.smith@firm.com" },
    });
    expect(searchTimekeeperByEmailResponse.status).toBe(200);
    const foundTimekeeper = searchTimekeeperByEmailResponse.data;
    expect(foundTimekeeper).toBeDefined();
    // When searching by email, the API returns a single timekeeper, not an array
    if (!Array.isArray(foundTimekeeper)) {
      expect(foundTimekeeper?.email).toBe("jane.smith@firm.com");
    }

    const getTimekeeperResponse = await client
      .timekeepers({ timekeeperId: timekeeper.id })
      .get();
    expect(getTimekeeperResponse.status).toBe(200);
    expect(getTimekeeperResponse.data?.name).toBe("Jane Smith");

    const updateTimekeeperResponse = await client
      .timekeepers({ timekeeperId: timekeeper.id })
      .patch({
        name: "Jane Smith, Esq.",
      });
    expect(updateTimekeeperResponse.status).toBe(200);
    expect(updateTimekeeperResponse.data?.name).toBe("Jane Smith, Esq.");

    // 7. Cleanup & Final Verifications
    const deleteWorkflowResponse = await client
      .matters({ matterId: matter.id })
      .workflows({ workflowId: workflow.id })
      .delete();
    expect(deleteWorkflowResponse.status).toBe(204);

    const listWorkflowsAfterDeleteResponse = await client
      .matters({ matterId: matter.id })
      .workflows.get();
    expect(listWorkflowsAfterDeleteResponse.status).toBe(200);
    expect(listWorkflowsAfterDeleteResponse.data?.length).toBe(0);

    const deleteMatterResponse = await client
      .matters({ matterId: matter.id })
      .delete();
    expect(deleteMatterResponse.status).toBe(204);

    const listMattersAfterDeleteResponse = await client.matters.get();
    expect(listMattersAfterDeleteResponse.status).toBe(200);
    expect(listMattersAfterDeleteResponse.data?.length).toBe(0);
  });
});
