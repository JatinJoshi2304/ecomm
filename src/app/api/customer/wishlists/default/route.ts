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

    // Check if default wishlist exists
    let defaultWishlist = await Wishlist.findOne({ 
      customerId: userId, 
      isDefault: true 
    });

    // If no default wishlist exists, create one
    if (!defaultWishlist) {
      defaultWishlist = new Wishlist({
        customerId: userId,
        name: "My Wishlist",
        description: "Your default wishlist for saving favorite products",
        isDefault: true,
        isPublic: false
      });

      await defaultWishlist.save();
    }

    return NextResponse.json(
      successResponse(
        "FETCH",
        defaultWishlist,
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

    // Check if default wishlist already exists
    const existingDefault = await Wishlist.findOne({ 
      customerId: userId, 
      isDefault: true 
    });

    if (existingDefault) {
      return NextResponse.json(
        errorResponse(
          "CONFLICT",
          RESPONSE_MESSAGES.STATUS_CODES.CONFLICT,
          "Default wishlist already exists"
        ),
        { status: RESPONSE_MESSAGES.STATUS_CODES.CONFLICT }
      );
    }

    // Create default wishlist
    const defaultWishlist = new Wishlist({
      customerId: userId,
      name: "My Wishlist",
      description: "Your default wishlist for saving favorite products",
      isDefault: true,
      isPublic: false
    });

    await defaultWishlist.save();

    return NextResponse.json(
      successResponse(
        "CREATE",
        defaultWishlist,
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
