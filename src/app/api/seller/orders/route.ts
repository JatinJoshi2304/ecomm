import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { authMiddleware } from "@/middlewares/auth";
import { errorResponse, successResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";
import Order from "@/models/order.model";
import OrderItem from "@/models/orderItem.model";
import "@/models/index";

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const authResult = await authMiddleware(["seller"])(req);
    if (authResult) return authResult;

    await connectDB();

    const sellerId = (req as any).user.id;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    // Build query to find orders containing items from this seller
    const orderItemsQuery: any = { sellerId };
    if (status) {
      // We'll need to join with orders to filter by status
    }

    // Get order items for this seller
    const orderItems = await OrderItem.find(orderItemsQuery)
      .populate({
        path: "orderId",
        match: status ? { orderStatus: status } : {},
        populate: {
          path: "customerId",
          model: "User",
          select: "name email"
        }
      })
      .populate({
        path: "productId",
        model: "Product",
        select: "name price images",
        populate: [
          { path: "size", model: "Size", select: "name" },
          { path: "color", model: "Color", select: "name hexCode" }
        ]
      })
      .sort({ createdAt: -1 });

    // Filter out order items where order is null (due to status filter)
    const validOrderItems = orderItems.filter(item => item.orderId);

    // Calculate pagination
    const skip = (page - 1) * limit;
    const paginatedItems = validOrderItems.slice(skip, skip + limit);

    // Group order items by order
    const ordersMap = new Map();
    paginatedItems.forEach(item => {
      const orderId = item.orderId._id.toString();
      if (!ordersMap.has(orderId)) {
        ordersMap.set(orderId, {
          ...item.orderId.toObject(),
          sellerItems: []
        });
      }
      ordersMap.get(orderId).sellerItems.push(item);
    });

    const orders = Array.from(ordersMap.values());

    // Get total count for pagination
    const totalItems = validOrderItems.length;
    const totalPages = Math.ceil(totalItems / limit);

    return NextResponse.json(
      successResponse(
        "FETCH",
        {
          orders,
          pagination: {
            currentPage: page,
            totalPages,
            totalOrders: totalItems,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
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
    const authResult = await authMiddleware(["seller"])(req);
    if (authResult) return authResult;

    await connectDB();

    const sellerId = (req as any).user.id;
    const { orderId, orderStatus } = await req.json();

    if (!orderId || !orderStatus) {
      return NextResponse.json(
        errorResponse(
          "VALIDATION_FAILED",
          RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST,
          "Order ID and status are required"
        ),
        { status: RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST }
      );
    }

    // Validate status
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

    // Check if seller has items in this order
    const hasItems = await OrderItem.findOne({ 
      orderId, 
      sellerId 
    });

    if (!hasItems) {
      return NextResponse.json(
        errorResponse(
          "FORBIDDEN",
          RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN,
          "You don't have permission to update this order"
        ),
        { status: RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN }
      );
    }

    // Update order status
    const order = await Order.findByIdAndUpdate(
      orderId,
      { orderStatus },
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
            { path: "color", model: "Color", select: "name" }
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
