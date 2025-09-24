import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import Brand from "@/models/brand.model";
import { successResponse, errorResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";

// GET /api/customer/products/brands - Get all brands
export async function GET() {
  try {
    await connectDB();

    const brands = await Brand.find().sort({ name: 1 });

    return NextResponse.json(
      successResponse("FETCH", { brands }, RESPONSE_MESSAGES.STATUS_CODES.SUCCESS),
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
