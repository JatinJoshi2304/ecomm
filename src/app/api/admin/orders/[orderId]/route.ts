import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { authMiddleware } from "@/middlewares/auth";
import { errorResponse, successResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";
import Order from "@/models/order.model";
import "@/models/index";

export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    // Check authentication
    const authResult = await authMiddleware(["admin"])(req);
    if (authResult) return authResult;

    await connectDB();

    const { orderId } = params;

    // Get order with full details
    const order = await Order.findById(orderId)
      .populate({
        path: "items",
        populate: {
          path: "productId",
          model: "Product",
          populate: [
            { path: "size", model: "Size" },
            { path: "color", model: "Color" },
            { path: "seller", model: "User", select: "name email" }
          ]
        }
      })
      .populate("customerId", "name email");

    if (!order) {
      return NextResponse.json(
        errorResponse(
          "NOT_FOUND",
          RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND,
          "Order not found"
        ),
        { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND }
      );
    }

    return NextResponse.json(
      successResponse(
        "FETCH",
        order,
        RESPONSE_MESSAGES.STATUS_CODES.SUCCESS
      ),
      { status: RESPONSE_MESSAGES.STATUS_CODES.SUCCESS }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    
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
