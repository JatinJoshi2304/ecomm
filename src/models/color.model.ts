import mongoose, { Schema, Document } from "mongoose";

export interface IColor extends Document {
  name: string;       // e.g., Red, Blue
  hexCode?: string;   // optional, for frontend display
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const colorSchema: Schema<IColor> = new Schema(
  {
    name: { type: String, required: true, unique: true },
    hexCode: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Color || mongoose.model<IColor>("Color", colorSchema);
