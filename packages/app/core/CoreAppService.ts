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
  DocumentTemplateRepository,
  DocumentRepository,
} from "@ai-starter/core";
import { MatterService } from "./MatterService";
import { BillService } from "./BillService";
import { TimeEntryService } from "./TimeEntryService";
import { TimeEntryImportService } from "./TimeEntryImportService";
import { AiSuggestionService } from "./AiSuggestionService";
import { WorkflowService } from "./WorkflowService";
import { TimekeeperService } from "./TimekeeperService";
import { TimekeeperRoleService } from "./TimekeeperRoleService";
import { RoleService } from "./RoleService";
import { JobService } from "./JobService";
import { CsvHeaderMappingService } from "./CsvHeaderMappingService";
import { DocumentTemplateService } from "./DocumentTemplateService";
import { DocumentService } from "./DocumentService";
import type { FileStorage } from "@ai-starter/core";

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
    documentTemplate: DocumentTemplateRepository;
    document: DocumentRepository;
  };
  storage: FileStorage;
}

export const CoreAppService = (deps: Deps) => {
  const { repos, storage } = deps;

  // Initialize services that don't have cross-dependencies first
  const csvMappingService = CsvHeaderMappingService({ model: undefined });
  const matterService = MatterService({ repos: { matter: repos.matter } });
  const billService = BillService({
    repos: { bill: repos.bill, timeEntry: repos.timeEntry },
  });
  const workflowService = WorkflowService({
    repos: { workflow: repos.workflow },
  });
  const timekeeperService = TimekeeperService({
    repos: { timekeeper: repos.timekeeper },
  });
  const timekeeperRoleService = TimekeeperRoleService({
    repos: {
      timekeeperRole: repos.timekeeperRole,
      timekeeper: repos.timekeeper,
      role: repos.role,
    },
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

  const timeEntryImportService = TimeEntryImportService({
    repos: {
      timeEntry: repos.timeEntry,
      timeEntryChangeLog: repos.timeEntryChangeLog,
      timekeeperRole: repos.timekeeperRole,
      timekeeper: repos.timekeeper,
      role: repos.role,
      bill: repos.bill,
      matter: repos.matter,
    },
    services: { timeEntry: timeEntryService, csvMapping: csvMappingService },
  });

  const aiSuggestionService = AiSuggestionService({
    repos: {
      aiSuggestion: repos.aiSuggestion,
    },
    services: {
      timeEntry: timeEntryService,
    },
  });

  const documentTemplateService = DocumentTemplateService({
    repos: { documentTemplate: repos.documentTemplate },
  });

  const documentService = DocumentService({
    repos: {
      document: repos.document,
      documentTemplate: repos.documentTemplate,
    },
    storage,
  });

  return {
    // Legacy foo methods (kept for backwards compatibility)
    getFoo: repos.foo.get,
    createFoo: (name: string) => repos.foo.create({ name }),
    patchFoo: repos.foo.patch,

    // Service instances for direct access
    matter: matterService,
    bill: billService,
    timeEntry: timeEntryService,
    timeEntryImport: timeEntryImportService,
    aiSuggestion: aiSuggestionService,
    workflow: workflowService,
    timekeeper: timekeeperService,
    timekeeperRole: timekeeperRoleService,
    role: roleService,
    job: jobService,
    documentTemplate: documentTemplateService,
    document: documentService,
  };
};

export type CoreAppService = ReturnType<typeof CoreAppService>;
