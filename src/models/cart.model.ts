import mongoose, { Schema, Document } from "mongoose";

export interface ICart extends Document {
  userId?: mongoose.Types.ObjectId; // null for guest carts
  sessionId?: string; // for guest carts
  items: mongoose.Types.ObjectId[]; // references to CartItem
  totalItems: number;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

const cartSchema: Schema<ICart> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    sessionId: { type: String, default: null },
    items: [{ type: Schema.Types.ObjectId, ref: "CartItem" }],
    totalItems: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Ensure one cart per user or session
// Create separate indexes for user and guest carts
// cartSchema.index({ userId: 1 }, { unique: true, partialFilterExpression: { userId: { $ne: null } } });
// cartSchema.index({ sessionId: 1 }, { unique: true, partialFilterExpression: { sessionId: { $ne: null } } });

export default mongoose.models.Cart || mongoose.model<ICart>("Cart", cartSchema);
