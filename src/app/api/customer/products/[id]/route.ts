import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import Product from "@/models/product.model";
import Review from "@/models/review.model";
import { successResponse, errorResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";

// GET /api/customer/products/[id] - Get product details
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const includeReviews = url.searchParams.get("includeReviews") === "true";
    const includeRelated = url.searchParams.get("includeRelated") === "true";
    const reviewsLimit = parseInt(url.searchParams.get("reviewsLimit") || "5");
    const relatedLimit = parseInt(url.searchParams.get("relatedLimit") || "4");

    const { id } = params;

    // Get product details
    const product = await Product.findOne({
      _id: id,
      isActive: true,
    })
      .populate("category", "name")
      .populate("brand", "name")
      .populate("size", "name type")
      .populate("color", "name hexCode")
      .populate("material", "name")
      .populate("tags", "name type")
      .populate("storeId", "storeName storeImage storeDescription");

    if (!product) {
      return NextResponse.json(
        errorResponse("NOT_FOUND", RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND, "Product not found"),
        { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND }
      );
    }

    // Format product data
    const productData = {
      id: product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      images: product.images,
      averageRating: product.averageRating,
      reviewCount: product.reviewCount,
      purchases: product.purchases,
      popularityScore: product.popularityScore,
      category: product.category,
      brand: product.brand,
      size: product.size,
      color: product.color,
      material: product.material,
      tags: product.tags,
      store: {
        id: product.storeId._id,
        name: product.storeId.storeName,
        image: product.storeId.storeImage,
        description: product.storeId.storeDescription,
      },
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    let responseData: any = { product: productData };

    // Get reviews if requested
    if (includeReviews) {
      const reviews = await Review.find({ productId: id })
        .populate("userId", "name")
        .sort({ createdAt: -1 })
        .limit(reviewsLimit);

      const formattedReviews = reviews.map(review => ({
        id: review._id,
        rating: review.rating,
        comment: review.comment,
        user: {
          id: review.userId._id,
          name: review.userId.name,
        },
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      }));

      responseData.reviews = {
        items: formattedReviews,
        totalCount: product.reviewCount,
        averageRating: product.averageRating,
        hasMore: product.reviewCount > reviewsLimit,
      };
    }

    // Get related products if requested
    if (includeRelated) {
      const relatedProducts = await Product.find({
        _id: { $ne: id },
        $or: [
          { category: product.category._id },
          { brand: product.brand._id },
        ],
        isActive: true,
      })
        .populate("category", "name")
        .populate("brand", "name")
        .populate("storeId", "storeName storeImage")
        .sort({ averageRating: -1, purchases: -1 })
        .limit(relatedLimit);

      const formattedRelated = relatedProducts.map(relatedProduct => ({
        id: relatedProduct._id,
        name: relatedProduct.name,
        price: relatedProduct.price,
        images: relatedProduct.images,
        averageRating: relatedProduct.averageRating,
        reviewCount: relatedProduct.reviewCount,
        category: relatedProduct.category,
        brand: relatedProduct.brand,
        store: {
          id: relatedProduct.storeId._id,
          name: relatedProduct.storeId.storeName,
          image: relatedProduct.storeId.storeImage,
        },
      }));

      responseData.relatedProducts = formattedRelated;
    }

    return NextResponse.json(
      successResponse(
        "FETCH",
        responseData,
        RESPONSE_MESSAGES.STATUS_CODES.SUCCESS
      ),
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
