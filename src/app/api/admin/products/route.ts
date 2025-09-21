import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import Product from "@/models/product.model";
import { verifyToken } from "@/lib/jwt";
import { errorResponse, successResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Get token from headers
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - No Token Provided" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Access denied. Admins only." },
        { status: 403 }
      );
    }
// with store details populate user details
    const products = await Product.find().populate("storeId");

    return NextResponse.json(
      successResponse("FETCH", products, RESPONSE_MESSAGES.STATUS_CODES.SUCCESS),
      { status: RESPONSE_MESSAGES.STATUS_CODES.SUCCESS }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";

    return NextResponse.json(
      errorResponse(
        "SERVER_ERROR",
        RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR,
        message
      ),
      { status: RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR }
    );
  }
}
