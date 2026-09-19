import { PgModel } from "./pgModel.js";

export interface IUser {
  id: string;
  username: string;
  role: string;
  name: string;
  email?: string;
  phone?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  save?: () => Promise<any>;
}

export const UserModel = new PgModel<IUser>("users");
