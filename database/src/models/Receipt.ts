import { PgModel } from "./pgModel.js";

export interface IReceipt {
  receiptNo: string;
  loanNo: string;
  customerName: string;
  amount: number;
  paymentMode: "CASH" | "BANK" | "UPI" | "CHEQUE";
  referenceNo?: string;
  penaltyCollected?: number;
  docCharges?: number;
  remarks?: string;
  date: string;
  collectorName?: string;
  createdAt?: string;
  updatedAt?: string;
  save?: () => Promise<any>;
}

export const ReceiptModel = new PgModel<IReceipt>("receipts");
