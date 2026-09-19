import mongoose, { Schema, Document } from "mongoose";

export interface ISeizedVehicle extends Document {
  id: string;
  loanNo: string;
  customerName: string;
  vehicleName: string;
  rcNo: string;
  seizureDate: string;
  godownLocation: string;
  valuationAmount: number;
  status: "IN_YARD" | "RELEASED" | "AUCTIONED" | "WRITTEN_OFF";
  releaseDate?: string;
  releaseRemarks?: string;
  auctionPrice?: number;
}

const SeizedVehicleSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    loanNo: { type: String, required: true },
    customerName: { type: String, required: true },
    vehicleName: { type: String, required: true },
    rcNo: { type: String, required: true },
    seizureDate: { type: String, required: true },
    godownLocation: { type: String, required: true },
    valuationAmount: { type: Number, required: true },
    status: { type: String, default: "IN_YARD" },
    releaseDate: { type: String },
    releaseRemarks: { type: String },
    auctionPrice: { type: Number }
  },
  { timestamps: true }
);

export const SeizedVehicleModel = (mongoose.models.SeizedVehicle || mongoose.model<ISeizedVehicle>("SeizedVehicle", SeizedVehicleSchema)) as mongoose.Model<ISeizedVehicle>;
