// File: /app/api/products/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import Product from "@/models/product.model";
import { successResponse, errorResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const query = url.searchParams.get("q") || ""; // search text
    const limit = parseInt(url.searchParams.get("limit") || "10");

    if (!query) {
      return NextResponse.json(
        errorResponse(
          "NOT_FOUND",
          RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST,
          "Search query parameter 'q' is required."
        ),
        { status: RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST }
      );
    }

    // Search products by name (case-insensitive)
    const products = await Product.find({
      name: { $regex: query, $options: "i" }, // "i" = case-insensitive
      isActive: true,
    })
      .limit(limit)
      .populate("category brand size color material tags"); 

    return NextResponse.json(
      successResponse("FETCH",products, RESPONSE_MESSAGES.STATUS_CODES.SUCCESS),
      { status: RESPONSE_MESSAGES.STATUS_CODES.SUCCESS }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json(
      errorResponse("SERVER_ERROR", RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR, message),
      { status: RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR }
    );
  }
}
