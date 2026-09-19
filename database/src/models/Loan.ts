import { PgModel } from "./pgModel.js";

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

export interface ILoan {
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
  createdAt?: string;
  updatedAt?: string;
  save?: () => Promise<any>;
}

export const LoanModel = new PgModel<ILoan>("loans");
