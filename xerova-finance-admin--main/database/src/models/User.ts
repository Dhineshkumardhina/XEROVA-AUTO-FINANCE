import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  id: string;
  username: string;
  role: string;
  name: string;
  email?: string;
  phone?: string;
  status?: string;
}

const UserSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    role: { type: String, required: true, default: "Employee" },
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    status: { type: String, default: "Active" }
  },
  { timestamps: true }
);

export const UserModel = (mongoose.models.User || mongoose.model<IUser>("User", UserSchema)) as mongoose.Model<IUser>;
