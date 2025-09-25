import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import Product from "@/models/product.model";
import { successResponse, errorResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";

// GET /api/customer/products - Get product details
export async function GET() {
    try {
      await connectDB();
      
  
      const products = await Product.find()
                        .sort({ createdAt: -1 })
                        .limit(10)
                        .populate("category brand size color material tags");
  
      return NextResponse.json(
        successResponse("FETCH", products, RESPONSE_MESSAGES.STATUS_CODES.SUCCESS),
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
