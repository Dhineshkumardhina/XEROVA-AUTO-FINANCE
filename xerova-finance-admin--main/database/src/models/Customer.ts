import mongoose, { Schema, Document } from "mongoose";

export interface ICustomer extends Document {
  id: string;
  name: string;
  phone: string;
  address?: string;
  address1?: string;
  address2?: string;
  address3?: string;
  city?: string;
  state?: string;
  pincode?: string;
  panNo?: string;
  aadhaarNo?: string;
  occupation?: string;
  monthlyIncome?: number;
  guarantors?: Array<{ name: string; phone: string; address?: string }>;
}

const CustomerSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String },
    address1: { type: String },
    address2: { type: String },
    address3: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    panNo: { type: String },
    aadhaarNo: { type: String },
    occupation: { type: String },
    monthlyIncome: { type: Number, default: 0 },
    guarantors: [
      {
        name: { type: String },
        phone: { type: String },
        address: { type: String }
      }
    ]
  },
  { timestamps: true }
);

export const CustomerModel = (mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema)) as mongoose.Model<ICustomer>;
