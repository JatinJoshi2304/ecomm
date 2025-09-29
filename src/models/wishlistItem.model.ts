import mongoose, { Schema, Document } from "mongoose";

export interface IWishlistItem extends Document {
  wishlistId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  size?: mongoose.Types.ObjectId;
  color?: mongoose.Types.ObjectId;
  notes?: string; // Personal notes about the item
  priority: 'low' | 'medium' | 'high'; // Priority level for the item
  createdAt: Date;
  updatedAt: Date;
}

const wishlistItemSchema: Schema<IWishlistItem> = new Schema(
  {
    wishlistId: { 
      type: Schema.Types.ObjectId, 
      ref: "Wishlist", 
      required: true 
    },
    productId: { 
      type: Schema.Types.ObjectId, 
      ref: "Product", 
      required: true 
    },
    size: { 
      type: Schema.Types.ObjectId, 
      ref: "Size" 
    },
    color: { 
      type: Schema.Types.ObjectId, 
      ref: "Color" 
    },
    notes: { 
      type: String,
      trim: true,
      maxlength: 500
    },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high'], 
      default: 'medium' 
    }
  },
  { timestamps: true }
);

// Index for efficient queries
wishlistItemSchema.index({ wishlistId: 1, productId: 1 }, { unique: true });
wishlistItemSchema.index({ wishlistId: 1, priority: 1 });
wishlistItemSchema.index({ productId: 1 });

export default mongoose.models.WishlistItem || mongoose.model<IWishlistItem>("WishlistItem", wishlistItemSchema);
