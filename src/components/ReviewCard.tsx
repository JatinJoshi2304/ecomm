'use client';

import { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
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

interface ReviewCardProps {
  review: Review;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
  onHelpful?: (reviewId: string) => void;
}

export default function ReviewCard({ 
  review, 
  onEdit, 
  onDelete, 
  onHelpful 
}: ReviewCardProps) {
  const { user } = useAppSelector((state) => state.auth);
  const [isHelpful, setIsHelpful] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpful);
  const [showFullComment, setShowFullComment] = useState(false);

  const isOwner = user?.id === review.userId._id;
  const isLongComment = review.comment && review.comment.length > 200;
  const displayComment = isLongComment && !showFullComment 
    ? review.comment?.substring(0, 200) + '...'
    : review.comment;

  const handleHelpful = async () => {
    if (isHelpful) return;
    
    setIsHelpful(true);
    setHelpfulCount(prev => prev + 1);
    onHelpful?.(review._id);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this review?')) {
      onDelete?.(review._id);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">
              {review.userId.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900">{review.userId.name}</h4>
              {review.isVerified && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Verified Purchase
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
          </div>
        </div>
        
        {isOwner && (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit?.(review)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Rating */}
      <div className="mb-3">
        <StarRating rating={review.rating} size="sm" />
      </div>

      {/* Title */}
      {review.title && (
        <h5 className="font-medium text-gray-900 mb-2">{review.title}</h5>
      )}

      {/* Comment */}
      {review.comment && (
        <div className="mb-4">
          <p className="text-gray-700 leading-relaxed">
            {displayComment}
          </p>
          {isLongComment && (
            <button
              onClick={() => setShowFullComment(!showFullComment)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2"
            >
              {showFullComment ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      )}

      {/* Helpful Section */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4">
          <button
            onClick={handleHelpful}
            disabled={isHelpful}
            className={`flex items-center gap-1 text-sm ${
              isHelpful 
                ? 'text-green-600 cursor-default' 
                : 'text-gray-600 hover:text-green-600 cursor-pointer'
            }`}
          >
            <svg 
              className={`w-4 h-4 ${isHelpful ? 'fill-current' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V18m-7-8a2 2 0 01-2-2V5a2 2 0 012-2h2.343M11 7v6a2 2 0 01-2 2H9m0 0l-2 2m2-2l2 2" 
              />
            </svg>
            <span>
              {isHelpful ? 'Helpful' : 'Helpful'} ({helpfulCount})
            </span>
          </button>
        </div>
        
        {review.updatedAt !== review.createdAt && (
          <p className="text-xs text-gray-500">
            Edited on {formatDate(review.updatedAt)}
          </p>
        )}
      </div>
    </div>
  );
}
