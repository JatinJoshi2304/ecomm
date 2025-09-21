import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { verifyToken } from "@/lib/jwt";
import { successResponse, errorResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";
import { mergeGuestCartWithUserCart, formatCartResponse } from "@/lib/cartHelpers";

// POST /api/customer/cart/merge - Merge guest cart with user cart
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Auth check - Customer only
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        errorResponse("UNAUTHORIZED", RESPONSE_MESSAGES.STATUS_CODES.UNAUTHORIZED),
        { status: RESPONSE_MESSAGES.STATUS_CODES.UNAUTHORIZED }
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "customer") {
      return NextResponse.json(
        errorResponse("FORBIDDEN", RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN),
        { status: RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN }
      );
    }

    const { guestSessionId } = await req.json();

    if (!guestSessionId) {
      return NextResponse.json(
        errorResponse(
          "VALIDATION_FAILED",
          RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST,
          "Guest session ID is required"
        ),
        { status: RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST }
      );
    }

    // Merge guest cart with user cart
    const mergedCart = await mergeGuestCartWithUserCart(guestSessionId, decoded.id);
    
    if (!mergedCart) {
      return NextResponse.json(
        errorResponse("NOT_FOUND", RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND, "No cart found to merge"),
        { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND }
      );
    }

    const formattedCart = await formatCartResponse(mergedCart);

    return NextResponse.json(
      successResponse(
        "UPDATE",
        {
          message: "Cart merged successfully",
          cart: formattedCart,
        },
        RESPONSE_MESSAGES.STATUS_CODES.SUCCESS
      ),
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
