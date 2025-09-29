import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { authMiddleware } from "@/middlewares/auth";
import { errorResponse, successResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";
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
    const limit = parseInt(searchParams.get('limit') || '10');

    // Ensure default wishlist exists
    const defaultWishlist = await Wishlist.findOne({ 
      customerId: userId, 
      isDefault: true 
    });

    if (!defaultWishlist) {
      const newDefaultWishlist = new Wishlist({
        customerId: userId,
        name: "My Wishlist",
        description: "Your default wishlist for saving favorite products",
        isDefault: true,
        isPublic: false
      });
      await newDefaultWishlist.save();
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get wishlists with pagination
    const wishlists = await Wishlist.find({ customerId: userId })
      .sort({ isDefault: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalWishlists = await Wishlist.countDocuments({ customerId: userId });
    const totalPages = Math.ceil(totalWishlists / limit);

    return NextResponse.json(
      successResponse(
        "FETCH",
        {
          wishlists,
          pagination: {
            currentPage: page,
            totalPages,
            totalWishlists,
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

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const authResult = await authMiddleware(["customer"])(req);
    if (authResult) return authResult;

    await connectDB();

    const userId = (req as any).user.id;
    const { name, description, isPublic } = await req.json();

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        errorResponse(
          "VALIDATION_ERROR",
          RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST,
          "Wishlist name is required"
        ),
        { status: RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST }
      );
    }

    // Check if wishlist with same name already exists for this user
    const existingWishlist = await Wishlist.findOne({ 
      customerId: userId, 
      name: name.trim() 
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

    // Create new wishlist
    const wishlist = new Wishlist({
      customerId: userId,
      name: name.trim(),
      description: description?.trim(),
      isPublic: isPublic || false,
      isDefault: false
    });

    await wishlist.save();

    return NextResponse.json(
      successResponse(
        "CREATE",
        wishlist,
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
