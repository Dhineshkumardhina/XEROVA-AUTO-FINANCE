import { PgModel } from "./pgModel.js";

export interface ICustomer {
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
  createdAt?: string;
  updatedAt?: string;
  save?: () => Promise<any>;
}

export const CustomerModel = new PgModel<ICustomer>("customers");
