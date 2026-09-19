import { PgModel } from "./pgModel.js";

export interface IPreLoan {
  id: string;
  serialNo?: string;
  applicantName: string;
  name?: string;
  phone: string;
  housePhone?: string;
  fatherSpouseName?: string;
  address?: string;
  landmark?: string;
  area?: string;
  vehicleModel: string;
  vehicleName?: string;
  vehicleNo?: string;
  engineNo?: string;
  chassisNo?: string;
  rcNo?: string;
  model?: string;
  vehicleModelYear?: string;
  vehicleValue?: number;
  requestedAmount: number;
  requiredLoan?: number;
  downPayment?: number;
  brokerName?: string;
  coObligantName?: string;
  aiRiskScore?: number;
  aiFraudFlag?: boolean;
  aiFraudReasons?: string[];
  status: "PENDING" | "APPROVED" | "REJECTED" | "UNDER_REVIEW";
  verificationNotes?: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
  save?: () => Promise<any>;
}

export const PreLoanModel = new PgModel<IPreLoan>("pre_loans");
