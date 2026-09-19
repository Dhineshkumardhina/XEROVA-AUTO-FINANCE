import mongoose, { Schema, Document } from "mongoose";

export interface IReceipt extends Document {
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
}

const ReceiptSchema: Schema = new Schema(
  {
    receiptNo: { type: String, required: true, unique: true },
    loanNo: { type: String, required: true },
    customerName: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentMode: { type: String, default: "CASH" },
    referenceNo: { type: String },
    penaltyCollected: { type: Number, default: 0 },
    docCharges: { type: Number, default: 0 },
    remarks: { type: String },
    date: { type: String, required: true },
    collectorName: { type: String, default: "Cashier Counter" }
  },
  { timestamps: true }
);

export const ReceiptModel = (mongoose.models.Receipt || mongoose.model<IReceipt>("Receipt", ReceiptSchema)) as mongoose.Model<IReceipt>;
