import {
  CoreAppService,
  MatterService,
  BillService,
  TimeEntryService,
  AiSuggestionService,
  WorkflowService,
} from "@ai-starter/app";
import { getDB, getRepos } from "@ai-starter/db";

export interface Context {
  app: {
    foo: ReturnType<typeof CoreAppService>;
    matter: ReturnType<typeof MatterService>;
    bill: ReturnType<typeof BillService>;
    timeEntry: ReturnType<typeof TimeEntryService>;
    aiSuggestion: ReturnType<typeof AiSuggestionService>;
    workflow: ReturnType<typeof WorkflowService>;
  };
}

export function getContext(database: string): Context {
  const db = getDB(database);
  const repos = getRepos(db);

  return {
    app: {
      foo: CoreAppService({ repos }),
      matter: MatterService({ repos }),
      bill: BillService({ repos }),
      timeEntry: TimeEntryService({ repos }),
      aiSuggestion: AiSuggestionService({ repos }),
      workflow: WorkflowService({ repos }),
    },
  };
}
