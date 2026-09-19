import { PgModel } from "./pgModel.js";

export interface IMaster {
  id: string;
  name: string;
  category: "dealer" | "broker" | "area" | "godown" | "ledger_group" | string;
  phone?: string;
  address?: string;
  commissionPct?: string | number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  save?: () => Promise<any>;
}

export const MasterModel = new PgModel<IMaster>("masters");
