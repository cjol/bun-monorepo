import type {
  FooRepository,
  MatterRepository,
  BillRepository,
  TimeEntryRepository,
  TimeEntryChangeLogRepository,
  AiSuggestionRepository,
  WorkflowRepository,
  TimekeeperRepository,
  TimekeeperRoleRepository,
  RoleRepository,
  JobRepository,
} from "@ai-starter/core";
import { MatterService } from "./MatterService";
import { BillService } from "./BillService";
import { TimeEntryService } from "./TimeEntryService";
import { AiSuggestionService } from "./AiSuggestionService";
import { WorkflowService } from "./WorkflowService";
import { TimekeeperService } from "./TimekeeperService";
import { TimekeeperRoleService } from "./TimekeeperRoleService";
import { RoleService } from "./RoleService";
import { JobService } from "./JobService";

export interface Deps {
  repos: {
    foo: FooRepository;
    matter: MatterRepository;
    bill: BillRepository;
    timeEntry: TimeEntryRepository;
    timeEntryChangeLog: TimeEntryChangeLogRepository;
    aiSuggestion: AiSuggestionRepository;
    workflow: WorkflowRepository;
    timekeeper: TimekeeperRepository;
    timekeeperRole: TimekeeperRoleRepository;
    role: RoleRepository;
    job: JobRepository;
  };
}

export const CoreAppService = (deps: Deps) => {
  const { repos } = deps;

  // Initialize services that don't have cross-dependencies first
  const matterService = MatterService({ repos: { matter: repos.matter } });
  const billService = BillService({ repos: { bill: repos.bill } });
  const workflowService = WorkflowService({
    repos: { workflow: repos.workflow },
  });
  const timekeeperService = TimekeeperService({
    repos: { timekeeper: repos.timekeeper },
  });
  const timekeeperRoleService = TimekeeperRoleService({
    repos: { timekeeperRole: repos.timekeeperRole },
  });
  const roleService = RoleService({
    repos: { role: repos.role },
  });
  const jobService = JobService({
    repos: { job: repos.job },
  });

  const timeEntryService = TimeEntryService({
    repos: {
      timeEntry: repos.timeEntry,
      timeEntryChangeLog: repos.timeEntryChangeLog,
      timekeeperRole: repos.timekeeperRole,
    },
    services: {
      workflow: workflowService,
      job: jobService,
    },
  });

  const aiSuggestionService = AiSuggestionService({
    repos: {
      aiSuggestion: repos.aiSuggestion,
    },
    services: {
      timeEntry: timeEntryService,
    },
  });

  // Now create timeEntryService WITH job service

  return {
    // Legacy foo methods (kept for backwards compatibility)
    getFoo: repos.foo.get,
    createFoo: (name: string) => repos.foo.create({ name }),
    patchFoo: repos.foo.patch,

    // Service instances for direct access
    matter: matterService,
    bill: billService,
    timeEntry: timeEntryService,
    aiSuggestion: aiSuggestionService,
    workflow: workflowService,
    timekeeper: timekeeperService,
    timekeeperRole: timekeeperRoleService,
    role: roleService,
    job: jobService,
  };
};

export type CoreAppService = ReturnType<typeof CoreAppService>;
