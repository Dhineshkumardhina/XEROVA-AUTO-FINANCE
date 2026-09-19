import mongoose, { Schema, Document } from "mongoose";

export interface IMaster extends Document {
  id: string;
  name: string;
  category: "dealer" | "broker" | "area" | "godown" | "ledger_group" | string;
  phone?: string;
  address?: string;
  commissionPct?: string | number;
  status?: string;
}

const MasterSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    commissionPct: { type: Schema.Types.Mixed, default: "2" },
    status: { type: String, default: "Active" }
  },
  { timestamps: true }
);

export const MasterModel = (mongoose.models.Master || mongoose.model<IMaster>("Master", MasterSchema)) as mongoose.Model<IMaster>;
