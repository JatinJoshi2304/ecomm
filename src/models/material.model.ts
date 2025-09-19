import mongoose, { Schema, Document } from "mongoose";

export interface IMaterial extends Document {
  name: string;       // e.g., Cotton, Leather
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const materialSchema: Schema<IMaterial> = new Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Material || mongoose.model<IMaterial>("Material", materialSchema);
