import mongoose, { Schema, Document } from "mongoose";

export interface IConsultancy extends Document {
  id: string;
  type?: "PURCHASE" | "SALE";
  serialNo?: string;
  vehicleName: string;
  vehicleNo: string;
  vehicleModel?: string;
  makeYear?: number;
  vehicleValue?: number;
  mileage?: string;
  condition?: string;
  sellerName?: string;
  name?: string;
  phone?: string;
  address?: string;
  landmark?: string;
  area?: string;
  brokerName?: string;
  purchasePrice?: number;
  marketValuation?: number;
  status: string;
  buyerName?: string;
  buyerPhone?: string;
  soldPrice?: number;
  soldDate?: string;
  purchaseDate?: string;
  commissionEarned?: number;
  rtoTransferCharges?: number;
  paymentMode?: string;
  buyoutRemarks?: string;
  callHistory?: any[];
  rcBookHistory?: any[];
  remarks?: string;
  date: string;
}

const ConsultancySchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    type: { type: String, default: "PURCHASE" },
    serialNo: { type: String },
    vehicleName: { type: String, required: true },
    vehicleNo: { type: String, required: true },
    model: { type: String },
    makeYear: { type: Number },
    vehicleValue: { type: Number, default: 0 },
    mileage: { type: String },
    condition: { type: String },
    sellerName: { type: String },
    name: { type: String },
    phone: { type: String },
    address: { type: String },
    landmark: { type: String },
    area: { type: String },
    brokerName: { type: String },
    purchasePrice: { type: Number, default: 0 },
    marketValuation: { type: Number, default: 0 },
    status: { type: String, default: "OPEN" },
    buyerName: { type: String },
    buyerPhone: { type: String },
    soldPrice: { type: Number, default: 0 },
    soldDate: { type: String },
    purchaseDate: { type: String },
    commissionEarned: { type: Number, default: 0 },
    rtoTransferCharges: { type: Number, default: 0 },
    paymentMode: { type: String },
    buyoutRemarks: { type: String },
    callHistory: [{ type: Schema.Types.Mixed }],
    rcBookHistory: [{ type: Schema.Types.Mixed }],
    remarks: { type: String },
    date: { type: String, required: true }
  },
  { timestamps: true, strict: false }
);

export const ConsultancyModel = (mongoose.models.Consultancy || mongoose.model<IConsultancy>("Consultancy", ConsultancySchema)) as mongoose.Model<IConsultancy>;

