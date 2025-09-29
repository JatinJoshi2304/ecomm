import mongoose, { Schema, Document } from "mongoose";

export interface IWishlist extends Document {
  customerId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  isDefault: boolean; // Default wishlist (like "My Wishlist")
  isPublic: boolean; // Whether others can see this wishlist
  createdAt: Date;
  updatedAt: Date;
}

const wishlistSchema: Schema<IWishlist> = new Schema(
  {
    customerId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    name: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 100
    },
    description: { 
      type: String,
      trim: true,
      maxlength: 500
    },
    isDefault: { 
      type: Boolean, 
      default: false 
    },
    isPublic: { 
      type: Boolean, 
      default: false 
    }
  },
  { timestamps: true }
);

// Index for efficient queries
wishlistSchema.index({ customerId: 1, name: 1 }, { unique: true });
wishlistSchema.index({ customerId: 1, isDefault: 1 });

export default mongoose.models.Wishlist || mongoose.model<IWishlist>("Wishlist", wishlistSchema);
