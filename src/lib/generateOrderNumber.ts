import mongoose from "mongoose";

/**
 * Generate a unique order number
 * Format: ORD-YYYYMMDD-XXXX
 * - YYYYMMDD = current date
 * - XXXX = incremental padded number
 */
export async function generateOrderNumber(): Promise<string> {
  const today = new Date();
  const datePart = today.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD

  // Count existing orders for today
  const count = await mongoose.model("Order").countDocuments({
    createdAt: {
      $gte: new Date(today.setHours(0, 0, 0, 0)),
      $lte: new Date(today.setHours(23, 59, 59, 999)),
    },
  });

  // Increment count to get next order sequence
  const sequence = String(count + 1).padStart(4, "0");

  return `ORD-${datePart}-${sequence}`;
}
