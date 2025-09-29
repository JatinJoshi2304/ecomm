import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { authMiddleware } from "@/middlewares/auth";
import { errorResponse, successResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";
import Wishlist from "@/models/wishlist.model";
import WishlistItem from "@/models/wishlistItem.model";
import "@/models/index";

export async function PUT(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string, itemId: string }> }
) {
  try {
    // Check authentication
    const authResult = await authMiddleware(["customer"])(req);
    if (authResult) return authResult;

    await connectDB();

    const userId = (req as any).user.id;
    const { id: wishlistId, itemId } = await params;
    const { size, color, notes, priority } = await req.json();

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

    // Find and update wishlist item
    const updateData: any = {};
    if (size !== undefined) updateData.size = size;
    if (color !== undefined) updateData.color = color;
    if (notes !== undefined) updateData.notes = notes?.trim();
    if (priority !== undefined) updateData.priority = priority;

    const updatedItem = await WishlistItem.findOneAndUpdate(
      { _id: itemId, wishlistId },
      updateData,
      { new: true }
    ).populate({
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
    }).populate("size", "name")
    .populate("color", "name hexCode");

    if (!updatedItem) {
      return NextResponse.json(
        errorResponse(
          "NOT_FOUND",
          RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND,
          "Wishlist item not found"
        ),
        { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND }
      );
    }

    return NextResponse.json(
      successResponse(
        "UPDATE",
        updatedItem,
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

export async function DELETE(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string, itemId: string }> }
) {
  try {
    // Check authentication
    const authResult = await authMiddleware(["customer"])(req);
    if (authResult) return authResult;

    await connectDB();

    const userId = (req as any).user.id;
    const { id: wishlistId, itemId } = await params;

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

    // Delete wishlist item
    const deletedItem = await WishlistItem.findOneAndDelete({ 
      _id: itemId, 
      wishlistId 
    });

    if (!deletedItem) {
      return NextResponse.json(
        errorResponse(
          "NOT_FOUND",
          RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND,
          "Wishlist item not found"
        ),
        { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND }
      );
    }

    return NextResponse.json(
      successResponse(
        "DELETE",
        { message: "Item removed from wishlist" },
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
