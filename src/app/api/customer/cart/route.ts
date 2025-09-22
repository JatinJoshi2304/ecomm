import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import Cart from "@/models/cart.model";
import CartItem from "@/models/cartItem.model";
import Product from "@/models/product.model";
import { verifyToken } from "@/lib/jwt";
import { successResponse, errorResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";
import { getOrCreateCart, updateCartTotals, formatCartResponse } from "@/lib/cartHelpers";

// GET /api/customer/cart - Get cart contents
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId");
    
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

    const cart = await getOrCreateCart(userId, sessionId || undefined);
    
    if (!cart) {
      return NextResponse.json(
        errorResponse("SERVER_ERROR", RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR, "Failed to create or retrieve cart"),
        { status: RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR }
      );
    }
    
    const formattedCart = await formatCartResponse(cart);

    return NextResponse.json(
      successResponse("FETCH", formattedCart, RESPONSE_MESSAGES.STATUS_CODES.SUCCESS),
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

// POST /api/customer/cart - Add item to cart
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { productId, quantity = 1, size, color, sessionId } = await req.json();

    if (!productId) {
      return NextResponse.json(
        errorResponse(
          "VALIDATION_FAILED",
          RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST,
          "Product ID is required"
        ),
        { status: RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST }
      );
    }

    // Verify product exists and is active
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return NextResponse.json(
        errorResponse("NOT_FOUND", RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND, "Product not found"),
        { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND }
      );
    }

    // Check stock availability
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

    // Get or create cart
    console.log("user Id :::",userId,"session id :::",sessionId);
    const cart = await getOrCreateCart(userId, sessionId || undefined);
    
    if (!cart) {
      return NextResponse.json(
        errorResponse("SERVER_ERROR", RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR, "Failed to create or retrieve cart"),
        { status: RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR }
      );
    }

    // Check if item already exists in cart
    const existingItem = await CartItem.findOne({
      cartId: cart._id,
      productId,
      size: size || null,
      color: color || null,
    });

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      if (product.stock < newQuantity) {
        return NextResponse.json(
          errorResponse(
            "VALIDATION_FAILED",
            RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST,
            "Insufficient stock available"
          ),
          { status: RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST }
        );
      }
      existingItem.quantity = newQuantity;
      await existingItem.save();
    } else {
      // Create new cart item
      await CartItem.create({
        cartId: cart._id,
        productId,
        quantity,
        price: product.price,
        size: size || null,
        color: color || null,
      });
    }

    // Update cart totals
    await updateCartTotals(cart._id);

    // Return updated cart
    const updatedCart = await Cart.findById(cart._id);
    const formattedCart = await formatCartResponse(updatedCart!);

    return NextResponse.json(
      successResponse("CREATE", formattedCart, RESPONSE_MESSAGES.STATUS_CODES.SUCCESS),
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

// DELETE /api/customer/cart - Clear entire cart
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId");
    
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

    const cart = await getOrCreateCart(userId, sessionId || undefined);
    
    if (!cart) {
      return NextResponse.json(
        errorResponse("SERVER_ERROR", RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR, "Failed to create or retrieve cart"),
        { status: RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR }
      );
    }

    // Delete all cart items
    await CartItem.deleteMany({ cartId: cart._id });

    // Reset cart totals
    cart.totalItems = 0;
    cart.totalPrice = 0;
    await cart.save();

    const formattedCart = await formatCartResponse(cart);

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
