import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { authMiddleware } from "@/middlewares/auth";
import { errorResponse, successResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";
import Review from "@/models/review.model";
import Product from "@/models/product.model";
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
    const productId = searchParams.get('productId');

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (productId) {
      query.productId = productId;
    } else {
      // If no productId, get user's reviews
      query.userId = userId;
    }

    // Get reviews with pagination
    const reviews = await Review.find(query)
      .populate({
        path: "productId",
        model: "Product",
        select: "name images price"
      })
      .populate({
        path: "userId",
        model: "User",
        select: "name email"
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalReviews = await Review.countDocuments(query);
    const totalPages = Math.ceil(totalReviews / limit);

    return NextResponse.json(
      successResponse(
        "FETCH",
        {
          reviews,
          pagination: {
            currentPage: page,
            totalPages,
            totalReviews,
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
    const { productId, rating, title, comment } = await req.json();

    // Validate required fields
    if (!productId || !rating) {
      return NextResponse.json(
        errorResponse(
          "VALIDATION_ERROR",
          RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST,
          "Product ID and rating are required"
        ),
        { status: RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST }
      );
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        errorResponse(
          "VALIDATION_ERROR",
          RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST,
          "Rating must be between 1 and 5"
        ),
        { status: RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST }
      );
    }

    // Check if product exists
    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) {
      return NextResponse.json(
        errorResponse(
          "NOT_FOUND",
          RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND,
          "Product not found"
        ),
        { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND }
      );
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ productId, userId });
    if (existingReview) {
      return NextResponse.json(
        errorResponse(
          "CONFLICT",
          RESPONSE_MESSAGES.STATUS_CODES.CONFLICT,
          "You have already reviewed this product"
        ),
        { status: RESPONSE_MESSAGES.STATUS_CODES.CONFLICT }
      );
    }

    // Create new review
    const review = new Review({
      productId,
      userId,
      rating,
      title: title?.trim(),
      comment: comment?.trim(),
      isVerified: false
    });

    await review.save();

    // Update product's average rating and review count
    await updateProductRatingStats(productId);

    // Populate the review with user and product details
    await review.populate([
      {
        path: "productId",
        model: "Product",
        select: "name images price"
      },
      {
        path: "userId",
        model: "User",
        select: "name email"
      }
    ]);

    return NextResponse.json(
      successResponse(
        "CREATE",
        review,
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

// Helper function to update product rating statistics
async function updateProductRatingStats(productId: string) {
  try {
    const reviews = await Review.find({ productId });
    
    if (reviews.length === 0) return;

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    const reviewCount = reviews.length;

    await Product.findByIdAndUpdate(productId, {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      reviewCount
    });
  } catch (error) {
    console.error('Error updating product rating stats:', error);
  }
}
