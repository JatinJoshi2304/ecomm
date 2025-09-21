import mongoose, { Schema } from "mongoose";

const reviewSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product", // link each review to a product
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Review || mongoose.model("Review", reviewSchema);
