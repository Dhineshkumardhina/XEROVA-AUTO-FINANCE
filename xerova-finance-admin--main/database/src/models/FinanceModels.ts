import mongoose, { Schema, Document } from "mongoose";

// 1. Voucher
export interface IVoucher extends Document {
  id: string;
  type: "DEBIT" | "CREDIT" | "JOURNAL";
  category: string;
  amount: number;
  payeeOrPayer: string;
  description: string;
  date: string;
  authorizedBy?: string;
}
const VoucherSchema = new Schema({
  id: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  payeeOrPayer: { type: String, required: true },
  description: { type: String },
  date: { type: String, required: true },
  authorizedBy: { type: String, default: "Admin" }
}, { timestamps: true });
export const VoucherModel = (mongoose.models.Voucher || mongoose.model<IVoucher>("Voucher", VoucherSchema)) as mongoose.Model<IVoucher>;

// 2. Deposit
export interface IDeposit extends Document {
  id: string;
  depositorName: string;
  amount: number;
  interestRatePct: number;
  termMonths: number;
  startDate: string;
  maturityDate: string;
  maturityAmount: number;
  status: "ACTIVE" | "MATURED" | "WITHDRAWN";
}
const DepositSchema = new Schema({
  id: { type: String, required: true, unique: true },
  depositorName: { type: String, required: true },
  amount: { type: Number, required: true },
  interestRatePct: { type: Number, required: true },
  termMonths: { type: Number, required: true },
  startDate: { type: String, required: true },
  maturityDate: { type: String, required: true },
  maturityAmount: { type: Number, required: true },
  status: { type: String, default: "ACTIVE" }
}, { timestamps: true });
export const DepositModel = (mongoose.models.Deposit || mongoose.model<IDeposit>("Deposit", DepositSchema)) as mongoose.Model<IDeposit>;

// 3. HandLoan
export interface IHandLoan extends Document {
  id: string;
  borrowerName: string;
  phone: string;
  amount: number;
  interestRatePerMonth: number;
  givenDate: string;
  promisedReturnDate: string;
  status: "ACTIVE" | "PAID" | "DEFAULTED";
  repaidAmount?: number;
}
const HandLoanSchema = new Schema({
  id: { type: String, required: true, unique: true },
  borrowerName: { type: String, required: true },
  phone: { type: String, required: true },
  amount: { type: Number, required: true },
  interestRatePerMonth: { type: Number, required: true },
  givenDate: { type: String, required: true },
  promisedReturnDate: { type: String, required: true },
  status: { type: String, default: "ACTIVE" },
  repaidAmount: { type: Number, default: 0 }
}, { timestamps: true });
export const HandLoanModel = (mongoose.models.HandLoan || mongoose.model<IHandLoan>("HandLoan", HandLoanSchema)) as mongoose.Model<IHandLoan>;

// 4. BadDebt
export interface IBadDebt extends Document {
  id: string;
  loanNo: string;
  customerName: string;
  originalLoanAmount: number;
  defaultedAmount: number;
  writeOffDate: string;
  recoveryStatus: "UNRECOVERED" | "PARTIALLY_RECOVERED" | "SETTLED" | "LEGAL_ACTION";
  remarks?: string;
}
const BadDebtSchema = new Schema({
  id: { type: String, required: true, unique: true },
  loanNo: { type: String, required: true },
  customerName: { type: String, required: true },
  originalLoanAmount: { type: Number, required: true },
  defaultedAmount: { type: Number, required: true },
  writeOffDate: { type: String, required: true },
  recoveryStatus: { type: String, default: "UNRECOVERED" },
  remarks: { type: String }
}, { timestamps: true });
export const BadDebtModel = (mongoose.models.BadDebt || mongoose.model<IBadDebt>("BadDebt", BadDebtSchema)) as mongoose.Model<IBadDebt>;

// 5. AuctionSale
export interface IAuctionSale extends Document {
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
}
const AuctionSaleSchema = new Schema({
  id: { type: String, required: true, unique: true },
  seizedVehicleId: { type: String, required: true },
  vehicleName: { type: String, required: true },
  rcNo: { type: String, required: true },
  buyerName: { type: String, required: true },
  buyerPhone: { type: String, required: true },
  basePrice: { type: Number, required: true },
  finalBidAmount: { type: Number, required: true },
  auctionDate: { type: String, required: true },
  status: { type: String, default: "COMPLETED" }
}, { timestamps: true });
export const AuctionSaleModel = (mongoose.models.AuctionSale || mongoose.model<IAuctionSale>("AuctionSale", AuctionSaleSchema)) as mongoose.Model<IAuctionSale>;

// 6. EmployeeSession
export interface IEmployeeSession extends Document {
  sessionId: string;
  userId: string;
  username: string;
  loginTime: string;
  logoutTime?: string | null;
  ipAddress?: string;
  status: "ACTIVE" | "CLOSED";
}
const EmployeeSessionSchema = new Schema({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  username: { type: String, required: true },
  loginTime: { type: String, required: true },
  logoutTime: { type: String, default: null },
  ipAddress: { type: String },
  status: { type: String, default: "ACTIVE" }
}, { timestamps: true });
export const EmployeeSessionModel = (mongoose.models.EmployeeSession || mongoose.model<IEmployeeSession>("EmployeeSession", EmployeeSessionSchema)) as mongoose.Model<IEmployeeSession>;

// 7. Setting
export interface ISetting extends Document {
  key: string;
  value: any;
}
const SettingSchema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true }
}, { timestamps: true });
export const SettingModel = (mongoose.models.Setting || mongoose.model<ISetting>("Setting", SettingSchema)) as mongoose.Model<ISetting>;

// 8. AuditLog
export interface IAuditLog extends Document {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}
const AuditLogSchema = new Schema({
  id: { type: String, required: true, unique: true },
  timestamp: { type: String, required: true },
  user: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: String, required: true }
}, { timestamps: true });
export const AuditLogModel = (mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema)) as mongoose.Model<IAuditLog>;
