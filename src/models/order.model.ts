import mongoose, { Schema, Document } from "mongoose";

export interface IOrder extends Document {
  orderNumber: string;
  customerId: mongoose.Types.ObjectId;
  items: mongoose.Types.ObjectId[]; // references to OrderItem
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  paymentMethod: "COD"; // Only Cash on Delivery for now
  paymentStatus: "pending" | "paid" | "failed";
  orderStatus: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  totalAmount: number;
  shippingCost: number;
  taxAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema: Schema<IOrder> = new Schema(
  {
    orderNumber: { 
      type: String, 
      required: true, 
      unique: true 
    },
    customerId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    items: [{ 
      type: Schema.Types.ObjectId, 
      ref: "OrderItem" 
    }],
    shippingAddress: {
      name: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true, default: "India" },
      phone: { type: String, required: true }
    },
    paymentMethod: { 
      type: String, 
      enum: ["COD"], 
      default: "COD" 
    },
    paymentStatus: { 
      type: String, 
      enum: ["pending", "paid", "failed"], 
      default: "pending" 
    },
    orderStatus: { 
      type: String, 
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"], 
      default: "pending" 
    },
    totalAmount: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    shippingCost: { 
      type: Number, 
      default: 0, 
      min: 0 
    },
    taxAmount: { 
      type: Number, 
      default: 0, 
      min: 0 
    },
    notes: { 
      type: String 
    }
  },
  { timestamps: true }
);

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Index for better query performance
orderSchema.index({ customerId: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });

export default mongoose.models.Order || mongoose.model<IOrder>("Order", orderSchema);
