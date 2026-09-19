import { PgModel } from "./pgModel.js";

// 1. Voucher
export interface IVoucher {
  id: string;
  type: "DEBIT" | "CREDIT" | "JOURNAL";
  category: string;
  amount: number;
  payeeOrPayer: string;
  description: string;
  date: string;
  authorizedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  save?: () => Promise<any>;
}
export const VoucherModel = new PgModel<IVoucher>("vouchers");

// 2. Deposit
export interface IDeposit {
  id: string;
  depositorName: string;
  amount: number;
  interestRatePct: number;
  termMonths: number;
  startDate: string;
  maturityDate: string;
  maturityAmount: number;
  status: "ACTIVE" | "MATURED" | "WITHDRAWN";
  createdAt?: string;
  updatedAt?: string;
  save?: () => Promise<any>;
}
export const DepositModel = new PgModel<IDeposit>("deposits");

// 3. HandLoan
export interface IHandLoan {
  id: string;
  borrowerName: string;
  phone: string;
  amount: number;
  interestRatePerMonth: number;
  givenDate: string;
  promisedReturnDate: string;
  status: "ACTIVE" | "PAID" | "DEFAULTED";
  repaidAmount?: number;
  createdAt?: string;
  updatedAt?: string;
  save?: () => Promise<any>;
}
export const HandLoanModel = new PgModel<IHandLoan>("hand_loans");

// 4. BadDebt
export interface IBadDebt {
  id: string;
  loanNo: string;
  customerName: string;
  originalLoanAmount: number;
  defaultedAmount: number;
  writeOffDate: string;
  recoveryStatus: "UNRECOVERED" | "PARTIALLY_RECOVERED" | "SETTLED" | "LEGAL_ACTION";
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
  save?: () => Promise<any>;
}
export const BadDebtModel = new PgModel<IBadDebt>("bad_debts");

// 5. AuctionSale
export interface IAuctionSale {
  id: string;
  seizedVehicleId: string;
  vehicleName: string;
  rcNo: string;
  buyerName: string;
  buyerPhone: string;
  basePrice: number;
  finalBidAmount: number;
  auctionDate: string;
  status: "COMPLETED" | "PENDING_PAYMENT" | "CANCELLED";
  createdAt?: string;
  updatedAt?: string;
  save?: () => Promise<any>;
}
export const AuctionSaleModel = new PgModel<IAuctionSale>("auction_sales");

// 6. EmployeeSession
export interface IEmployeeSession {
  sessionId: string;
  userId: string;
  username: string;
  loginTime: string;
  logoutTime?: string | null;
  ipAddress?: string;
  status: "ACTIVE" | "CLOSED";
  createdAt?: string;
  updatedAt?: string;
  save?: () => Promise<any>;
}
export const EmployeeSessionModel = new PgModel<IEmployeeSession>("employee_sessions");

// 7. Setting
export interface ISetting {
  key: string;
  value: any;
  createdAt?: string;
  updatedAt?: string;
  save?: () => Promise<any>;
}
export const SettingModel = new PgModel<ISetting>("settings");

// 8. AuditLog
export interface IAuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  createdAt?: string;
  updatedAt?: string;
  save?: () => Promise<any>;
}
export const AuditLogModel = new PgModel<IAuditLog>("audit_logs");
