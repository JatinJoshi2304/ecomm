import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  storeId: mongoose.Types.ObjectId; // link to Store
  name: string;
  description?: string;
  price: number;
  stock: number;
  category: mongoose.Types.ObjectId;
  brand: mongoose.Types.ObjectId;
  size?: mongoose.Types.ObjectId;
  color?: mongoose.Types.ObjectId;
  material?: mongoose.Types.ObjectId;
  tags?: mongoose.Types.ObjectId[];
  purchases: number;
  popularityScore: number;
  averageRating: number;
  reviewCount: number;
  images?: string[]; // Cloudinary URLs
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema: Schema<IProduct> = new Schema(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    brand: { type: Schema.Types.ObjectId, ref: "Brand", required: true },
    size: { type: Schema.Types.ObjectId, ref: "Size" },
    color: { type: Schema.Types.ObjectId, ref: "Color" },
    material: { type: Schema.Types.ObjectId, ref: "Material" },
    tags: [{ type: Schema.Types.ObjectId, ref: "Tag" }],
    purchases: { type: Number, default: 0 },
    popularityScore: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 }, // computed field
    reviewCount: { type: Number, default: 0 },   // computed field
    images: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model<IProduct>("Product", productSchema);
