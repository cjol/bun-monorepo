import type {
  BillRepository,
  TimeEntryRepository,
  Bill,
} from "@ai-starter/core";

export interface Deps {
  repos: {
    bill: BillRepository;
    timeEntry: TimeEntryRepository;
  };
}

export interface BillSummary {
  bill: Bill;
  timeEntryCount: number;
}

export const BillService = (deps: Deps) => {
  const { repos } = deps;

  return {
    getBill: repos.bill.get,
    createBill: repos.bill.create,
    updateBill: repos.bill.update,
    deleteBill: repos.bill.delete,
    listByMatter: repos.bill.listByMatter,

    /**
     * Get all bills for a matter with time entry counts.
     * Useful for displaying bill summaries with activity information.
     */
    getBillSummariesByMatter: async (
      matterId: string
    ): Promise<BillSummary[]> => {
      const bills = await repos.bill.listByMatter(matterId);

      const summaries = await Promise.all(
        bills.map(async (bill) => {
          const timeEntries = await repos.timeEntry.listByMatterAndBill(
            matterId,
            bill.id
          );

          return {
            bill,
            timeEntryCount: timeEntries.length,
          };
        })
      );

      return summaries;
    },
  };
};

export type BillService = ReturnType<typeof BillService>;
