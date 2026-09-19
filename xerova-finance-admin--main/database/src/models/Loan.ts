import mongoose, { Schema, Document } from "mongoose";

export interface IInstallment {
  instNo: number;
  dueDate: string;
  emiAmount: number;
  principalPart: number;
  interestPart: number;
  status: "PAID" | "PENDING" | "OVERDUE" | "PARTIAL";
  paidAmount: number;
  paidDate?: string;
  receiptNo?: string;
}

export interface ILoan extends Document {
  loanNo: string;
  borrowerId: string;
  customer?: any;
  coObligants?: Array<{ name: string; phone: string; address?: string }>;
  vehicle?: {
    vehicleName: string;
    rcNo: string;
    engineNo?: string;
    chassisNo?: string;
    modelYear?: string;
  };
  loanAmount: number;
  interestRate: number;
  durationMonths: number;
  emiAmount: number;
  totalDueAmount: number;
  totalPaidAmount: number;
  pendingAmount: number;
  disbursementDate: string;
  status: string;
  installments?: IInstallment[];
  payments?: any[];
}

const InstallmentSchema = new Schema({
  instNo: { type: Number, required: true },
  dueDate: { type: String, required: true },
  emiAmount: { type: Number, required: true },
  principalPart: { type: Number, default: 0 },
  interestPart: { type: Number, default: 0 },
  status: { type: String, default: "PENDING" },
  paidAmount: { type: Number, default: 0 },
  paidDate: { type: String },
  receiptNo: { type: String }
}, { _id: false });

const LoanSchema: Schema = new Schema(
  {
    loanNo: { type: String, required: true, unique: true },
    borrowerId: { type: String, required: true },
    customer: { type: Schema.Types.Mixed },
    coObligants: [
      {
        name: { type: String },
        phone: { type: String },
        address: { type: String }
      }
    ],
    vehicle: {
      vehicleName: { type: String },
      rcNo: { type: String },
      engineNo: { type: String },
      chassisNo: { type: String },
      modelYear: { type: String }
    },
    loanAmount: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    durationMonths: { type: Number, required: true },
    emiAmount: { type: Number, required: true },
    totalDueAmount: { type: Number, required: true },
    totalPaidAmount: { type: Number, default: 0 },
    pendingAmount: { type: Number, required: true },
    disbursementDate: { type: String, required: true },
    status: { type: String, default: "ACTIVE" },
    installments: [InstallmentSchema],
    payments: [{ type: Schema.Types.Mixed }]
  },
  { timestamps: true }
);

export const LoanModel = (mongoose.models.Loan || mongoose.model<ILoan>("Loan", LoanSchema)) as mongoose.Model<ILoan>;
