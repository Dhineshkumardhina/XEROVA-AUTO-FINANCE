import { PgModel } from "./pgModel.js";

export interface IConsultancy {
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
  createdAt?: string;
  updatedAt?: string;
  save?: () => Promise<any>;
}

export const ConsultancyModel = new PgModel<IConsultancy>("consultancies");
