import { PgModel } from "./pgModel.js";

export interface ISeizedVehicle {
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
  createdAt?: string;
  updatedAt?: string;
  save?: () => Promise<any>;
}

export const SeizedVehicleModel = new PgModel<ISeizedVehicle>("seized_vehicles");
