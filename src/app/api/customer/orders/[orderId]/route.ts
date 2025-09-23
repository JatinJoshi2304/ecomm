import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { errorResponse, successResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";
import Order from "@/models/order.model";
import "@/models/index";
import { verifyToken } from "@/lib/jwt";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // Check authentication
    // const authResult = await authMiddleware(["customer"])(req);
    // if (authResult) return authResult;

    await connectDB();

    let userId: string | undefined;
  
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = verifyToken(token);
      if (decoded && decoded.role === "customer") {
        userId = decoded.id;
      }
    }

    const { orderId } = await params;

    // Get order with full details
    const order = await Order.findOne({ 
      _id: orderId, 
      customerId: userId 
    })
      .populate({
        path: "items",
        populate: {
          path: "productId",
          model: "Product",
          populate: [
            { path: "size", model: "Size" },
            { path: "color", model: "Color" },
            // { path: "seller", model: "User", select: "name email" }
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
