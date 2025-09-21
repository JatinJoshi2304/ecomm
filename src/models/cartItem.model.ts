import mongoose, { Schema, Document } from "mongoose";

export interface ICartItem extends Document {
  cartId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  quantity: number;
  price: number; // price at time of adding to cart
  size?: mongoose.Types.ObjectId;
  color?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema: Schema<ICartItem> = new Schema(
  {
    cartId: { type: Schema.Types.ObjectId, ref: "Cart", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    size: { type: Schema.Types.ObjectId, ref: "Size" },
    color: { type: Schema.Types.ObjectId, ref: "Color" },
  },
  { timestamps: true }
);

// Ensure unique product per cart (with same size/color)
cartItemSchema.index({ cartId: 1, productId: 1, size: 1, color: 1 }, { unique: true });

export default mongoose.models.CartItem || mongoose.model<ICartItem>("CartItem", cartItemSchema);
