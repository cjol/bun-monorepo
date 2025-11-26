import { type BillRepository } from "@ai-starter/core";

export interface Deps {
  repos: {
    bill: BillRepository;
  };
}

export const BillService = (deps: Deps) => {
  const { repos } = deps;

  return {
    getBill: repos.bill.get,
    createBill: repos.bill.create,
    updateBill: repos.bill.update,
    deleteBill: repos.bill.delete,
    listByMatter: repos.bill.listByMatter,
  };
};

export type BillService = ReturnType<typeof BillService>;
