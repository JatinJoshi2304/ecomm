import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { successResponse, errorResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";

// GET /api/seller/status - Get seller status
export async function GET() {
  try {
    await connectDB();

    // This would typically get the seller ID from authentication
    // For now, returning a placeholder response
    return NextResponse.json(
      successResponse("FETCH", { 
        status: "active",
        message: "Seller status endpoint"
      }, RESPONSE_MESSAGES.STATUS_CODES.SUCCESS),
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
