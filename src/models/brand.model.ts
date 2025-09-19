import mongoose, { Schema, Document } from "mongoose";

export interface IBrand extends Document {
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const brandSchema: Schema<IBrand> = new Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Brand || mongoose.model<IBrand>("Brand", brandSchema);
