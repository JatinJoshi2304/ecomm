import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { authMiddleware } from "@/middlewares/auth";
import { errorResponse, successResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";
import Wishlist from "@/models/wishlist.model";
import WishlistItem from "@/models/wishlistItem.model";
import "@/models/index";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check authentication
    const authResult = await authMiddleware(["customer"])(req);
    if (authResult) return authResult;

    await connectDB();

    const userId = (req as any).user.id;
    const { id: wishlistId } = await params;

    // Get wishlist with items
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

    // Get wishlist items with product details
    const items = await WishlistItem.find({ wishlistId })
      .populate({
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
      })
      .populate("size", "name")
      .populate("color", "name hexCode")
      .sort({ priority: -1, createdAt: -1 });

    return NextResponse.json(
      successResponse(
        "FETCH",
        {
          wishlist,
          items
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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check authentication
    const authResult = await authMiddleware(["customer"])(req);
    if (authResult) return authResult;

    await connectDB();

    const userId = (req as any).user.id;
    const { id: wishlistId } = await params;
    const { name, description, isPublic } = await req.json();

    // Find wishlist
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

    // Prevent updating default wishlist name
    if (wishlist.isDefault && name && name !== wishlist.name) {
      return NextResponse.json(
        errorResponse(
          "FORBIDDEN",
          RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN,
          "Cannot rename default wishlist"
        ),
        { status: RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN }
      );
    }

    // Check if new name conflicts with existing wishlist
    if (name && name.trim() !== wishlist.name) {
      const existingWishlist = await Wishlist.findOne({ 
        customerId: userId, 
        name: name.trim(),
        _id: { $ne: wishlistId }
      });

      if (existingWishlist) {
        return NextResponse.json(
          errorResponse(
            "CONFLICT",
            RESPONSE_MESSAGES.STATUS_CODES.CONFLICT,
            "A wishlist with this name already exists"
          ),
          { status: RESPONSE_MESSAGES.STATUS_CODES.CONFLICT }
        );
      }
    }

    // Update wishlist
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim();
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const updatedWishlist = await Wishlist.findByIdAndUpdate(
      wishlistId,
      updateData,
      { new: true }
    );

    return NextResponse.json(
      successResponse(
        "UPDATE",
        updatedWishlist,
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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check authentication
    const authResult = await authMiddleware(["customer"])(req);
    if (authResult) return authResult;

    await connectDB();

    const userId = (req as any).user.id;
    const { id: wishlistId } = await params;

    // Find wishlist
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

    // Prevent deleting default wishlist
    if (wishlist.isDefault) {
      return NextResponse.json(
        errorResponse(
          "FORBIDDEN",
          RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN,
          "Cannot delete default wishlist"
        ),
        { status: RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN }
      );
    }

    // Delete all wishlist items first
    await WishlistItem.deleteMany({ wishlistId });

    // Delete wishlist
    await Wishlist.findByIdAndDelete(wishlistId);

    return NextResponse.json(
      successResponse(
        "DELETE",
        { message: "Wishlist deleted successfully" },
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
