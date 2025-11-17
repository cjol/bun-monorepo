import {
  type BillRepository,
  type Bill,
  type NewBill,
  billValidator,
} from "@ai-starter/core";

export interface Deps {
  repos: {
    bill: BillRepository;
  };
}

export const BillService = (deps: Deps) => {
  const { repos } = deps;

  return {
    getBill: async (id: string): Promise<Bill | null> => {
      return repos.bill.get(id);
    },

    createBill: async (data: {
      matterId: string;
      periodStart: Date;
      periodEnd: Date;
      status: "draft" | "finalized" | "sent" | "paid";
    }): Promise<Bill> => {
      const newBill: NewBill = {
        id: crypto.randomUUID(),
        matterId: data.matterId,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        status: data.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      billValidator.parse(newBill);
      return repos.bill.create(newBill);
    },

    updateBill: async (
      id: string,
      data: Partial<{
        matterId: string;
        periodStart: Date;
        periodEnd: Date;
        status: "draft" | "finalized" | "sent" | "paid";
      }>
    ): Promise<Bill> => {
      // Validate individual fields if provided
      if (data.matterId !== undefined) {
        billValidator.shape.matterId.parse(data.matterId);
      }
      if (data.periodStart !== undefined) {
        billValidator.shape.periodStart.parse(data.periodStart);
      }
      if (data.periodEnd !== undefined) {
        billValidator.shape.periodEnd.parse(data.periodEnd);
      }
      if (data.status !== undefined) {
        billValidator.shape.status.parse(data.status);
      }

      return repos.bill.update(id, {
        ...data,
        updatedAt: new Date(),
      });
    },

    deleteBill: async (id: string): Promise<void> => {
      return repos.bill.delete(id);
    },

    listByMatter: async (matterId: string): Promise<Bill[]> => {
      return repos.bill.listByMatter(matterId);
    },
  };
};

export type BillService = ReturnType<typeof BillService>;
