import mongoose, { Schema, Document } from "mongoose";

export interface ITag extends Document {
  name: string;       // e.g., Waterproof, Eco-Friendly
  type?: string;      // optional, e.g., category or product type
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const tagSchema: Schema<ITag> = new Schema(
  {
    name: { type: String, required: true, unique: true },
    type: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Tag || mongoose.model<ITag>("Tag", tagSchema);
