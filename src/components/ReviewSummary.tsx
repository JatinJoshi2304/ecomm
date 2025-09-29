'use client';

import StarRating from './StarRating';

interface ReviewSummaryProps {
  averageRating: number;
  reviewCount: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export default function ReviewSummary({
  averageRating,
  reviewCount,
  size = 'sm',
  showCount = true,
  className = ''
}: ReviewSummaryProps) {
  if (reviewCount === 0) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <StarRating rating={0} size={size} />
        {showCount && (
          <span className="text-sm text-gray-500">No reviews yet</span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <StarRating rating={averageRating} size={size} />
      {showCount && (
        <span className="text-sm text-gray-600">
          ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
}
