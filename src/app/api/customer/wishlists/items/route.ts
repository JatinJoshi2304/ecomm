import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { authMiddleware } from "@/middlewares/auth";
import { errorResponse, successResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";
import WishlistItem from "@/models/wishlistItem.model";
import Wishlist from "@/models/wishlist.model";
import "@/models/index";

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const authResult = await authMiddleware(["customer"])(req);
    if (authResult) return authResult;

    await connectDB();

    const userId = (req as any).user.id;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const wishlistId = searchParams.get('wishlistId');
    const productId = searchParams.get('productId');
    const priority = searchParams.get('priority');

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    
    if (wishlistId) {
      // Verify wishlist belongs to user
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
      
      query.wishlistId = wishlistId;
    } else {
      // Get all wishlists for user and find items in those wishlists
      const userWishlists = await Wishlist.find({ customerId: userId }).select('_id');
      const wishlistIds = userWishlists.map(w => w._id);
      query.wishlistId = { $in: wishlistIds };
    }

    // If productId is provided, filter by that specific product
    if (productId) {
      query.productId = productId;
    }

    if (priority) {
      query.priority = priority;
    }

    // Get wishlist items with product details
    const items = await WishlistItem.find(query)
      .populate({
        path: "wishlistId",
        model: "Wishlist",
        select: "name isDefault"
      })
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
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalItems = await WishlistItem.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    return NextResponse.json(
      successResponse(
        "FETCH",
        {
          items,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems,
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
