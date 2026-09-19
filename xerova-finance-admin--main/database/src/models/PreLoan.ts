import mongoose, { Schema, Document } from "mongoose";

export interface IPreLoan extends Document {
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
}

const PreLoanSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    serialNo: { type: String },
    applicantName: { type: String, required: true },
    name: { type: String },
    phone: { type: String, required: true },
    housePhone: { type: String },
    fatherSpouseName: { type: String },
    address: { type: String },
    landmark: { type: String },
    area: { type: String },
    vehicleModel: { type: String, required: true },
    vehicleName: { type: String },
    vehicleNo: { type: String },
    engineNo: { type: String },
    chassisNo: { type: String },
    rcNo: { type: String },
    model: { type: String },
    vehicleValue: { type: Number, default: 0 },
    requestedAmount: { type: Number, required: true },
    requiredLoan: { type: Number },
    downPayment: { type: Number, default: 0 },
    brokerName: { type: String },
    coObligantName: { type: String },
    aiRiskScore: { type: Number, default: 0 },
    aiFraudFlag: { type: Boolean, default: false },
    aiFraudReasons: [{ type: String }],
    status: { type: String, default: "PENDING" },
    verificationNotes: { type: String },
    date: { type: String, required: true }
  },
  { timestamps: true, strict: false }
);

export const PreLoanModel = (mongoose.models.PreLoan || mongoose.model<IPreLoan>("PreLoan", PreLoanSchema)) as mongoose.Model<IPreLoan>;

