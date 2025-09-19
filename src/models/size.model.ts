import mongoose, { Schema, Document } from "mongoose";

export interface ISize extends Document {
  name: string;       // e.g., S, M, L or 6, 7, 8
  type: string;       // e.g., clothing, shoes
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const sizeSchema: Schema<ISize> = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Ensure unique size per type
sizeSchema.index({ name: 1, type: 1 }, { unique: true });

export default mongoose.models.Size || mongoose.model<ISize>("Size", sizeSchema);
