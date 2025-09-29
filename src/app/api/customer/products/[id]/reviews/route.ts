import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { errorResponse, successResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";
import Review from "@/models/review.model";
import Product from "@/models/product.model";
import "@/models/index";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const rating = searchParams.get('rating');
    const sortBy = searchParams.get('sortBy') || 'newest';

    // Check if product exists
    const product = await Product.findOne({ _id: id, isActive: true });
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

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build query
    const query: any = { productId: id };
    if (rating) {
      query.rating = parseInt(rating);
    }

    // Build sort options
    let sortOptions: any = {};
    switch (sortBy) {
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'highest':
        sortOptions = { rating: -1, createdAt: -1 };
        break;
      case 'lowest':
        sortOptions = { rating: 1, createdAt: -1 };
        break;
      case 'helpful':
        sortOptions = { helpful: -1, createdAt: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    // Get reviews with pagination
    const reviews = await Review.find(query)
      .populate({
        path: "userId",
        model: "User",
        select: "name email"
      })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalReviews = await Review.countDocuments(query);
    const totalPages = Math.ceil(totalReviews / limit);

    // Get rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: { productId: id } },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    // Format rating distribution
    const ratingStats = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    };

    ratingDistribution.forEach(item => {
      ratingStats[item._id as keyof typeof ratingStats] = item.count;
    });

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
          },
          ratingStats,
          productStats: {
            averageRating: product.averageRating,
            reviewCount: product.reviewCount
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
