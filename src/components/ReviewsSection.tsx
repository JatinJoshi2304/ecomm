'use client';

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import ReviewForm from './ReviewForm';
import ReviewCard from './ReviewCard';
import StarRating from './StarRating';

interface Review {
  _id: string;
  rating: number;
  title?: string;
  comment?: string;
  isVerified: boolean;
  helpful: number;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ReviewsSectionProps {
  productId: string;
  productName: string;
  averageRating: number;
  reviewCount: number;
}

export default function ReviewsSection({ 
  productId, 
  // productName,
  averageRating, 
  reviewCount 
}: ReviewsSectionProps) {
  const { isAuthenticated, token, user } = useAppSelector((state) => state.auth);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [ratingFilter, setRatingFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [ratingStats, setRatingStats] = useState({
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0
  });

  // Find current user's review
  const userReview = reviews.find(r => r.userId._id === user?.id) || null;
  const otherReviews = reviews.filter(r => r.userId._id !== user?.id);

  const loadReviews = async (page = 1, rating = '', sort = 'newest') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '5',
        sortBy: sort
      });
      if (rating) params.append('rating', rating);

      const response = await fetch(`/api/customer/products/${productId}/reviews?${params}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setReviews(result.data.reviews);
          setTotalPages(result.data.pagination.totalPages);
          setRatingStats(result.data.ratingStats);
        }
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews(currentPage, ratingFilter, sortBy);
  }, [productId, currentPage, ratingFilter, sortBy]);

  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    loadReviews(currentPage, ratingFilter, sortBy);
  };

  const handleEditReview = (review: Review) => {
    if (review.userId._id === user?.id) {
      setShowReviewForm(true);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/customer/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        loadReviews(currentPage, ratingFilter, sortBy);
      }
    } catch (error) {
      console.error('Failed to delete review:', error);
    }
  };

  const handleHelpful = async (reviewId: string) => {
    console.log('Marked review as helpful:', reviewId);
  };

  const handleFilterChange = (rating: string) => {
    setRatingFilter(rating);
    setCurrentPage(1);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    setCurrentPage(1);
  };

  // const getRatingPercentage = (rating: number) => {
  //   if (reviewCount === 0) return 0;
  //   return Math.round((ratingStats[rating as keyof typeof ratingStats] / reviewCount) * 100);
  // };

  return (
    <div className="space-y-6">
      {/* Reviews Header */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Customer Reviews</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <StarRating rating={averageRating} size="lg" showRating={true} />
                <span className="text-sm text-gray-600">
                  ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            </div>
          </div>

          {/* Write a Review button only if user has no review */}
          {isAuthenticated && !userReview && !showReviewForm && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Write a Review
            </button>
          )}
        </div>

        {/* Rating Distribution */}
        {/* {reviewCount > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-3">
                  <button
                    onClick={() => handleFilterChange(ratingFilter === rating.toString() ? '' : rating.toString())}
                    className={`text-sm font-medium ${
                      ratingFilter === rating.toString() 
                        ? 'text-blue-600' 
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    {rating} star{rating !== 1 ? 's' : ''}
                  </button>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${getRatingPercentage(rating)}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8">
                    {ratingStats[rating as keyof typeof ratingStats]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )} */}
      </div>

      {/* User Review Form */}
      {isAuthenticated && (showReviewForm || userReview) && (
        <ReviewForm
          productId={productId}
          existingReview={userReview ? {
            id: userReview._id,
            rating: userReview.rating,
            title: userReview.title,
            comment: userReview.comment
          } : undefined}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}

      {/* Filters and Sort */}
      {reviewCount > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-4">
            <select
              value={ratingFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : otherReviews.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">
            {ratingFilter ? 'No reviews found for the selected rating.' : 'No reviews yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {otherReviews.map((review) => (
            <ReviewCard
              key={review._id}
              review={review}
              onEdit={handleEditReview}
              onDelete={handleDeleteReview}
              onHelpful={handleHelpful}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
