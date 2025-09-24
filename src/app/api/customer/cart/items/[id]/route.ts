import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import Cart from "@/models/cart.model";
import CartItem from "@/models/cartItem.model";
import { verifyToken } from "@/lib/jwt";
import { successResponse, errorResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";
import { updateCartTotals, formatCartResponse } from "@/lib/cartHelpers";

// PATCH /api/customer/cart/items/[id] - Update cart item quantity
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const { quantity, sessionId } = await req.json();
    const { id } = await params;

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        errorResponse(
          "VALIDATION_FAILED",
          RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST,
          "Valid quantity is required"
        ),
        { status: RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST }
      );
    }

    // Try to get user from token
    let userId: string | undefined;
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = verifyToken(token);
      if (decoded && decoded.role === "customer") {
        userId = decoded.id;
      }
    }

    if (!userId && !sessionId) {
      return NextResponse.json(
        errorResponse(
          "VALIDATION_FAILED",
          RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST,
          "Either user authentication or sessionId is required"
        ),
        { status: RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST }
      );
    }

    // Find cart item
    const cartItem = await CartItem.findById(id).populate("productId");
    if (!cartItem) {
      return NextResponse.json(
        errorResponse("NOT_FOUND", RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND, "Cart item not found"),
        { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND }
      );
    }

    // Verify cart ownership
    const cart = await Cart.findById(cartItem.cartId);
    if (!cart) {
      return NextResponse.json(
        errorResponse("NOT_FOUND", RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND, "Cart not found"),
        { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND }
      );
    }

    if (userId && cart.userId?.toString() !== userId) {
      console.log("First one error")
      
      return NextResponse.json(
        errorResponse("FORBIDDEN", RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN),
        { status: RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN}
      );
    }

    if (!userId && (sessionId && cart.sessionId !== sessionId)) {
      console.log("Second one error")
      return NextResponse.json(
        errorResponse("FORBIDDEN", RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN),
        { status: RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN }
      );
    }

    // Check stock availability
    const product = cartItem.productId as any;
    if (product.stock < quantity) {
      return NextResponse.json(
        errorResponse(
          "VALIDATION_FAILED",
          RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST,
          "Insufficient stock available"
        ),
        { status: RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST }
      );
    }

    // Update quantity
    cartItem.quantity = quantity;
    await cartItem.save();

    // Update cart totals
    await updateCartTotals(cart._id);

    // Return updated cart
    const updatedCart = await Cart.findById(cart._id);
    const formattedCart = await formatCartResponse(updatedCart!);

    return NextResponse.json(
      successResponse("UPDATE", formattedCart, RESPONSE_MESSAGES.STATUS_CODES.SUCCESS),
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

// DELETE /api/customer/cart/items/[id] - Remove item from cart
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId");
    const { id } = await params;

    // Try to get user from token
    let userId: string | undefined;
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = verifyToken(token);
      if (decoded && decoded.role === "customer") {
        userId = decoded.id;
      }
    }

    if (!userId && !sessionId) {
      return NextResponse.json(
        errorResponse(
          "VALIDATION_FAILED",
          RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST,
          "Either user authentication or sessionId is required"
        ),
        { status: RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST }
      );
    }

    // Find cart item
    const cartItem = await CartItem.findById(id);
    if (!cartItem) {
      return NextResponse.json(
        errorResponse("NOT_FOUND", RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND, "Cart item not found"),
        { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND }
      );
    }

    // Verify cart ownership
    const cart = await Cart.findById(cartItem.cartId);
    if (!cart) {
      return NextResponse.json(
        errorResponse("NOT_FOUND", RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND, "Cart not found"),
        { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND }
      );
    }

    if (userId && cart.userId?.toString() !== userId) {
      return NextResponse.json(
        errorResponse("FORBIDDEN", RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN),
        { status: RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN }
      );
    }

    if (sessionId && cart.sessionId !== sessionId) {
      return NextResponse.json(
        errorResponse("FORBIDDEN", RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN),
        { status: RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN }
      );
    }

    // Delete cart item
    await CartItem.findByIdAndDelete(id);

    // Update cart totals
    await updateCartTotals(cart._id);

    // Return updated cart
    const updatedCart = await Cart.findById(cart._id);
    const formattedCart = await formatCartResponse(updatedCart!);

    return NextResponse.json(
      successResponse("DELETE", formattedCart, RESPONSE_MESSAGES.STATUS_CODES.SUCCESS),
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
