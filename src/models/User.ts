import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "admin" | "seller" | "customer";
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "seller", "customer"], default: "customer" }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
