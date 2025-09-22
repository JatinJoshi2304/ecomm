import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { authMiddleware } from "@/middlewares/auth";
import { errorResponse, successResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";
import Cart from "@/models/cart.model";
import CartItem from "@/models/cartItem.model";
import Order from "@/models/order.model";
import OrderItem from "@/models/orderItem.model";
import Product from "@/models/product.model";
import "@/models/index";

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const authResult = await authMiddleware(["customer"])(req);
    if (authResult) return authResult;

    await connectDB();

    const { shippingAddress } = await req.json();
    const userId = (req as any).user.id;

    // Validate shipping address
    if (!shippingAddress || !shippingAddress.name || !shippingAddress.street || 
        !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode || 
        !shippingAddress.phone) {
      return NextResponse.json(
        errorResponse(
          "VALIDATION_FAILED",
          RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST,
          "Shipping address is required with all fields"
        ),
        { status: RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST }
      );
    }

    // Get customer's cart
    const cart = await Cart.findOne({ userId })
      .populate({
        path: "items",
        populate: {
          path: "productId",
          model: "Product",
          populate: [
            { path: "seller", model: "User" },
            { path: "size", model: "Size" },
            { path: "color", model: "Color" }
          ]
        }
      });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        errorResponse(
          "NOT_FOUND",
          RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND,
          "Cart is empty"
        ),
        { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND }
      );
    }

    // Validate stock and calculate totals
    let totalAmount = 0;
    const orderItems = [];

    for (const cartItem of cart.items) {
      const product = cartItem.productId;
      
      // Check stock availability
      if (product.stock < cartItem.quantity) {
        return NextResponse.json(
          errorResponse(
            "INSUFFICIENT_STOCK",
            RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST,
            `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${cartItem.quantity}`
          ),
          { status: RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST }
        );
      }

      // Calculate item total
      const itemTotal = cartItem.price * cartItem.quantity;
      totalAmount += itemTotal;

      // Prepare order item data
      orderItems.push({
        productId: product._id,
        quantity: cartItem.quantity,
        price: cartItem.price,
        size: cartItem.size,
        color: cartItem.color,
        sellerId: product.seller._id
      });
    }

    // Create order
    const order = new Order({
      customerId: userId,
      shippingAddress,
      paymentMethod: "COD",
      paymentStatus: "pending",
      orderStatus: "pending",
      totalAmount,
      shippingCost: 0, // Free shipping for now
      taxAmount: 0 // No tax for now
    });

    await order.save();

    // Create order items
    for (const itemData of orderItems) {
      const orderItem = new OrderItem({
        ...itemData,
        orderId: order._id
      });
      await orderItem.save();
      order.items.push(orderItem._id);
    }

    await order.save();

    // Update product stock
    for (const cartItem of cart.items) {
      const product = cartItem.productId;
      product.stock -= cartItem.quantity;
      await product.save();
    }

    // Clear cart
    await CartItem.deleteMany({ cartId: cart._id });
    cart.items = [];
    cart.totalItems = 0;
    cart.totalPrice = 0;
    await cart.save();

    // Populate order with details for response
    const populatedOrder = await Order.findById(order._id)
      .populate({
        path: "items",
        populate: {
          path: "productId",
          model: "Product",
          populate: [
            { path: "size", model: "Size" },
            { path: "color", model: "Color" }
          ]
        }
      })
      .populate("customerId", "name email");

    return NextResponse.json(
      successResponse(
        "CREATE",
        populatedOrder,
        RESPONSE_MESSAGES.STATUS_CODES.CREATED
      ),
      { status: RESPONSE_MESSAGES.STATUS_CODES.CREATED }
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
