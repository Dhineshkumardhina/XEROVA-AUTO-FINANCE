/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum LoanStatus {
  ACTIVE = "ACTIVE",
  CLOSED = "CLOSED",
  SEIZED = "SEIZED",
  PENDING = "PENDING"
}

export enum ReceiptPayMode {
  CASH = "CASH",
  BANK = "BANK",
  UPI = "UPI",
  CHEQUE = "CHEQUE"
}

export enum VoucherType {
  PAYMENT = "PAYMENT",
  RECEIPT = "RECEIPT",
  JOURNAL = "JOURNAL",
  CONTRA = "CONTRA",
  DEBIT = "DEBIT",
  CREDIT = "CREDIT"
}

export interface User {
  id: string;
  username: string;
  role: string;
  name: string;
  phone: string;
  password?: string;
}

export interface Customer {
  id: string;
  name: string;
  dob: string;
  photoUrl: string;
  signatureUrl: string;
  govtIdType: string;
  govtIdNo: string;
  occupation: string;
  employer: string;
  income: number;
  address: string;
  landmark: string;
  houseType: "OWN" | "RENTED";
  phone: string;
  housePhone: string;
  officePhone: string;
  officeAddress: string;
  fatherName: string;
  spouseName: string;
  latitude?: number;
  longitude?: number;
  password?: string;
}

export interface CoObligant {
  name: string;
  fatherSpouseName: string;
  address: string;
  landmark: string;
  officeAddress: string;
  phone: string;
  refPhone: string;
  photoUrl: string;
  govtId: string;
}

export interface Vehicle {
  engineNo: string;
  chassisNo: string;
  rcBookType: string;
  rcNo: string;
  vehicleType: string;
  vehicleName: string;
  model: string;
  makeYear: number;
  color: string;
  insuranceCompany: string;
  insuranceExpiry: string;
  taxExpiry: string;
  fcExpiry: string;
  permitExpiry: string;
  pollutionExpiry: string;
  photoUrls: string[];
}

export interface Installment {
  id: string;
  loanNo: string;
  dueDate: string;
  dueAmount: number;
  principalPart: number;
  interestPart: number;
  penalty: number;
  paidAmount: number;
  paidDate?: string;
  status: "PENDING" | "PAID" | "OVERDUE";
}

export interface Loan {
  loanNo: string; // HP/Loan No
  customer: Customer;
  vehicle: Vehicle;
  coObligants: CoObligant[];
  // Loan details
  vehicleValue: number;
  downPayment: number;
  loanAmount: number;
  interestRate: number; // annual rate e.g. 12
  durationMonths: number;
  totalInterest: number;
  totalDueAmount: number;
  emiAmount: number;
  penaltyRatePerDay: number;
  documentationCharge: number;
  brokerCommission: number;
  dealerCommission: number;
  netPayable: number;
  brokerName: string;
  dealerName: string;
  dealerAmount: number;
  handloanAmount: number;
  handloanRemarks: string;
  payMode: string;
  remarks: string;
  hpDate: string;
  status: LoanStatus;
  installments: Installment[];
  gpsInstalled: boolean;
  documentsVerified: boolean;
  photoUploaded: boolean;
  govtIdUploaded: boolean;
  rcUploaded: boolean;
}

export interface Receipt {
  id: string;
  receiptNo: string;
  loanNo: string;
  customerName: string;
  date: string;
  amount: number;
  payMode: ReceiptPayMode;
  payModeDetails: string; // cheque no, transaction id, bank name
  documentationChargePaid: number;
  penaltyPaid: number;
  remarks: string;
  collectedBy: string;
  digitalSignatureUrl?: string;
}

export interface PreLoan {
  id: string;
  serialNo: string;
  date: string;
  name: string;
  fatherSpouseName: string;
  phone: string;
  housePhone: string;
  address: string;
  landmark: string;
  area: string;
  vehicleName: string;
  vehicleNo: string;
  engineNo: string;
  chassisNo: string;
  rcNo: string;
  model: string;
  vehicleValue: number;
  requiredLoan: number;
  downPayment: number;
  brokerName: string;
  coObligantName: string;
  status: "PENDING" | "VERIFIED" | "APPROVED" | "REJECTED";
  assignedExecutive?: string;
  riskScore?: number;
  fraudFlagged?: boolean;
  aiReportText?: string;
}

export interface Consultancy {
  id: string;
  type: "PURCHASE" | "SALE";
  accountNo?: string;
  serialNo: string;
  date: string;
  vehicleNo: string;
  vehicleName: string;
  model: string;
  vehicleValue: number;
  name: string;
  fatherSpouseName: string;
  phone: string;
  address: string;
  landmark: string;
  area: string;
  brokerName: string;
  hpDate?: string;
  hpAmount?: number;
  hireCharges?: number;
  totalDue?: number;
  callHistory: { date: string; summary: string }[];
  rcBookHistory: { date: string; status: string }[];
  status: "OPEN" | "COMPLETED" | "CANCELLED";
}

export interface Voucher {
  id: string;
  voucherNo: string;
  date: string;
  type: VoucherType;
  debitLedger: string;
  creditLedger: string;
  amount: number;
  narration: string;
  approvedBy?: string;
}

export interface SeizedVehicle {
  id: string;
  loanNo: string;
  customerName: string;
  vehicleNo: string;
  vehicleName: string;
  seizeDate?: string;
  seizedDate?: string;
  godownName: string;
  gpsLocation?: string;
  policeStation?: string;
  policeCaseNo?: string;
  photographs?: string[];
  inventoryNotes?: string;
  recoveryTeam?: string;
  legalStatus?: string;
  status: string;
  auctionId?: string;
  salePrice?: number;
  buyerName?: string;
  buyerPhone?: string;
  auctionDate?: string;
  loanBalance?: number;
  customerPhone?: string;
  customerEmail?: string;
}

export interface AuctionSale {
  id: string;
  vehicleNo: string;
  inspectionDate?: string;
  auctionDate: string;
  buyerName: string;
  buyerPhone: string;
  salePrice?: number;
  bidAmount?: number;
  invoiceNo: string;
  paymentReceived?: number;
  deliveryDate?: string;
  customerName?: string;
  loanNo?: string;
  vehicleName?: string;
  date?: string;
}

export interface BadDebt {
  id: string;
  loanNo: string;
  customerName: string;
  vehicleNo?: string;
  amount: number;
  policeCase?: string;
  legalNoticeDate?: string;
  settlementAmount?: number;
  writeOffDate?: string;
  status?: string;
  remarks: string;
}

export interface Deposit {
  id: string;
  type: "CASH" | "BANK";
  date: string;
  amount: number;
  accountNo: string;
  bankName?: string;
  referenceNo?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export interface HandLoan {
  id: string;
  customerName: string;
  phone: string;
  amount: number;
  date: string;
  remarks: string;
  payments: { date: string; amount: number; remarks: string }[];
  status: "ACTIVE" | "SETTLED";
}

export interface MasterEntry {
  id: string;
  category: "vehicle_type" | "color" | "area" | "sub_area" | "godown" | "broker" | "agent" | "dealer" | "govt_id" | "company" | "company_group" | "ledger" | "ledger_group";
  name: string;
  details?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}
