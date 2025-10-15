'use client';

import { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import StarRating from './StarRating';

interface ReviewFormProps {
  productId: string;
  onReviewSubmitted?: () => void;
  existingReview?: {
    id: string;
    rating: number;
    title?: string;
    comment?: string;
  };
}

export default function ReviewForm({ 
  productId, 
  onReviewSubmitted,
  existingReview 
}: ReviewFormProps) {
  const { isAuthenticated, token } = useAppSelector((state) => state.auth);
  
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(!existingReview ? true : false);

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
    if (!isAuthenticated) {
      setError('Please log in to submit a review');
      return;
    }

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const url = existingReview
        ? `/api/customer/reviews/${existingReview.id}`
        : '/api/customer/reviews';
      
      const method = existingReview ? 'PUT' : 'POST';
      const body = existingReview
        ? { rating, title, comment }
        : { productId, rating, title, comment };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        onReviewSubmitted?.();
        setIsEditing(false);
      } else {
        const result = await response.json();
        setError(result.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
      setError('Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  // If not logged in
  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Write a Review
        </h3>
        <p className="text-gray-600 mb-4">
          Please log in to write a review for this product.
        </p>
        <button
          onClick={() => (window.location.href = '/login')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Log In
        </button>
      </div>
    );
  }

  // ✅ If the review exists and user is not editing → show view mode
  if (existingReview && !isEditing) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Your Review
        </h3>
        <div className="mb-3">
          <StarRating rating={existingReview.rating} interactive={false} size="lg" />
        </div>
        {existingReview.title && (
          <h4 className="text-md font-medium text-gray-800 mb-1">{existingReview.title}</h4>
        )}
        {existingReview.comment && (
          <p className="text-gray-700 mb-4 whitespace-pre-line">{existingReview.comment}</p>
        )}
        <button
          onClick={() => setIsEditing(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Edit Review
        </button>
      </div>
    );
  }

  // ✅ Edit mode or new review mode
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {existingReview ? 'Edit Your Review' : 'Write a Review'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating *
          </label>
          <StarRating
            rating={rating}
            interactive={true}
            onRatingChange={setRating}
            size="lg"
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Review Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your review in a few words"
            className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            maxLength={100}
          />
          <p className="text-xs text-gray-500 mt-1">
            {title.length}/100 characters
          </p>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Review
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product..."
            rows={4}
            className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            maxLength={1000}
          />
          <p className="text-xs text-gray-500 mt-1">
            {comment.length}/1000 characters
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Submit / Cancel */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 
                    5.291A7.962 7.962 0 014 12H0c0 
                    3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {existingReview ? 'Updating...' : 'Submitting...'}
              </div>
            ) : existingReview ? (
              'Update Review'
            ) : (
              'Submit Review'
            )}
          </button>

          {existingReview && (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
