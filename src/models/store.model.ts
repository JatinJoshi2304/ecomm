import mongoose, { Schema, Document } from "mongoose";

export interface IStore extends Document {
  userId: mongoose.Types.ObjectId; // reference to the seller user
  storeName: string;
  storeDescription?: string;
  storeImage?: string; // Cloudinary URL
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const storeSchema: Schema<IStore> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    storeName: { type: String, required: true, unique: true },
    storeDescription: { type: String },
    storeImage: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Store || mongoose.model<IStore>("Store", storeSchema);
