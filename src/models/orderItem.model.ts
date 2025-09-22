import mongoose, { Schema, Document } from "mongoose";

export interface IOrderItem extends Document {
  orderId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  quantity: number;
  price: number; // price at time of order
  size?: mongoose.Types.ObjectId;
  color?: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId; // product owner/seller
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema: Schema<IOrderItem> = new Schema(
  {
    orderId: { 
      type: Schema.Types.ObjectId, 
      ref: "Order", 
      required: true 
    },
    productId: { 
      type: Schema.Types.ObjectId, 
      ref: "Product", 
      required: true 
    },
    quantity: { 
      type: Number, 
      required: true, 
      min: 1 
    },
    price: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    size: { 
      type: Schema.Types.ObjectId, 
      ref: "Size" 
    },
    color: { 
      type: Schema.Types.ObjectId, 
      ref: "Color" 
    },
    sellerId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    }
  },
  { timestamps: true }
);

// Index for better query performance
orderItemSchema.index({ orderId: 1 });
orderItemSchema.index({ productId: 1 });
orderItemSchema.index({ sellerId: 1 });

export default mongoose.models.OrderItem || mongoose.model<IOrderItem>("OrderItem", orderItemSchema);
