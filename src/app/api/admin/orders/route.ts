import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { authMiddleware } from "@/middlewares/auth";
import { errorResponse, successResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";
import Order from "@/models/order.model";
import "@/models/index";

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const authResult = await authMiddleware(["admin"])(req);
    if (authResult) return authResult;

    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');

    // Build query
    const query: any = {};
    if (status) {
      query.orderStatus = status;
    }
    if (customerId) {
      query.customerId = customerId;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get orders with pagination
    const orders = await Order.find(query)
      .populate({
        path: "items",
        populate: {
          path: "productId",
          model: "Product",
          select: "name price images",
          populate: [
            { path: "size", model: "Size", select: "name" },
            { path: "color", model: "Color", select: "name hexCode" },
            // { path: "seller", model: "User", select: "name email" }
          ]
        }
      })
      .populate("customerId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);

    // Get order statistics
    const stats = await Order.aggregate([
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 }
        }
      }
    ]);

    const totalRevenue = await Order.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" }
        }
      }
    ]);

    return NextResponse.json(
      successResponse(
        "FETCH",
        {
          orders,
          pagination: {
            currentPage: page,
            totalPages,
            totalOrders,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          },
          stats: {
            statusBreakdown: stats,
            totalRevenue: totalRevenue[0]?.total || 0
          }
        },
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

export async function PATCH(req: NextRequest) {
  try {
    // Check authentication
    const authResult = await authMiddleware(["admin"])(req);
    if (authResult) return authResult;

    await connectDB();

    const { orderId, orderStatus, paymentStatus } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        errorResponse(
          "VALIDATION_FAILED",
          RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST,
          "Order ID is required"
        ),
        { status: RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST }
      );
    }

    // Build update object
    const updateData: any = {};
    if (orderStatus) {
      const validStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
      if (!validStatuses.includes(orderStatus)) {
        return NextResponse.json(
          errorResponse(
            "VALIDATION_FAILED",
            RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST,
            "Invalid order status"
          ),
          { status: RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST }
        );
      }
      updateData.orderStatus = orderStatus;
    }

    if (paymentStatus) {
      const validPaymentStatuses = ["pending", "paid", "failed"];
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return NextResponse.json(
          errorResponse(
            "VALIDATION_FAILED",
            RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST,
            "Invalid payment status"
          ),
          { status: RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST }
        );
      }
      updateData.paymentStatus = paymentStatus;
    }

    // Update order
    const order = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    )
      .populate({
        path: "items",
        populate: {
          path: "productId",
          model: "Product",
          select: "name",
          populate: [
            { path: "size", model: "Size", select: "name" },
            { path: "color", model: "Color", select: "name" },
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
        "UPDATE",
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
