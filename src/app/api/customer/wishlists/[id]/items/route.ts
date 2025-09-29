import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { authMiddleware } from "@/middlewares/auth";
import { errorResponse, successResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";
import Wishlist from "@/models/wishlist.model";
import WishlistItem from "@/models/wishlistItem.model";
import Product from "@/models/product.model";
import "@/models/index";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check authentication
    const authResult = await authMiddleware(["customer"])(req);
    if (authResult) return authResult;

    await connectDB();

    const userId = (req as any).user.id;
    const { id: wishlistId } = await params;
    const { productId, size, color, notes, priority } = await req.json();

    // Validate required fields
    if (!productId) {
      return NextResponse.json(
        errorResponse(
          "VALIDATION_ERROR",
          RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST,
          "Product ID is required"
        ),
        { status: RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST }
      );
    }

    // Check if wishlist exists and belongs to user
    const wishlist = await Wishlist.findOne({ 
      _id: wishlistId, 
      customerId: userId 
    });

    if (!wishlist) {
      return NextResponse.json(
        errorResponse(
          "NOT_FOUND",
          RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND,
          "Wishlist not found"
        ),
        { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND }
      );
    }

    // Check if product exists and is active
    const product = await Product.findOne({ 
      _id: productId, 
      isActive: true 
    });

    if (!product) {
      return NextResponse.json(
        errorResponse(
          "NOT_FOUND",
          RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND,
          "Product not found or inactive"
        ),
        { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND }
      );
    }

    // Check if item already exists in this wishlist
    const existingItem = await WishlistItem.findOne({ 
      wishlistId, 
      productId 
    });

    if (existingItem) {
      return NextResponse.json(
        errorResponse(
          "CONFLICT",
          RESPONSE_MESSAGES.STATUS_CODES.CONFLICT,
          "Product already exists in this wishlist"
        ),
        { status: RESPONSE_MESSAGES.STATUS_CODES.CONFLICT }
      );
    }

    // Create wishlist item
    const wishlistItem = new WishlistItem({
      wishlistId,
      productId,
      size: size || undefined,
      color: color || undefined,
      notes: notes?.trim(),
      priority: priority || 'medium'
    });

    await wishlistItem.save();

    // Populate the item with product details
    await wishlistItem.populate({
      path: "productId",
      model: "Product",
      select: "name price images stock isActive",
      populate: [
        { path: "category", model: "Category", select: "name" },
        { path: "brand", model: "Brand", select: "name" },
        { path: "size", model: "Size", select: "name" },
        { path: "color", model: "Color", select: "name hexCode" },
        { path: "material", model: "Material", select: "name" }
      ]
    });

    return NextResponse.json(
      successResponse(
        "CREATE",
        wishlistItem,
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
