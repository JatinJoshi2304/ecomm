import mongoose, { Schema, Document } from "mongoose";

export interface IAddress extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema: Schema<IAddress> = new Schema(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    name: { 
      type: String, 
      required: true 
    },
    street: { 
      type: String, 
      required: true 
    },
    city: { 
      type: String, 
      required: true 
    },
    state: { 
      type: String, 
      required: true 
    },
    zipCode: { 
      type: String, 
      required: true 
    },
    country: { 
      type: String, 
      required: true, 
      default: "India" 
    },
    phone: { 
      type: String, 
      required: true 
    },
    isDefault: { 
      type: Boolean, 
      default: false 
    }
  },
  { timestamps: true }
);

// Ensure only one default address per user
addressSchema.index({ userId: 1, isDefault: 1 }, { 
  unique: true, 
  partialFilterExpression: { isDefault: true } 
});

export default mongoose.models.Address || mongoose.model<IAddress>("Address", addressSchema);
