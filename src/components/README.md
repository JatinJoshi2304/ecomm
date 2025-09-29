# Review System Components

This directory contains components for the product review and rating system.

## Components

### StarRating
A reusable star rating component that can be used for display or interactive rating input.

**Props:**
- `rating`: Current rating value (0-5)
- `maxRating`: Maximum rating (default: 5)
- `size`: Size variant ('sm', 'md', 'lg')
- `interactive`: Whether the rating can be clicked
- `onRatingChange`: Callback when rating changes
- `showRating`: Whether to show the numeric rating
- `className`: Additional CSS classes

### ReviewForm
A form component for submitting and editing product reviews.

**Props:**
- `productId`: ID of the product being reviewed
- `onReviewSubmitted`: Callback when review is submitted
- `onCancel`: Callback when form is cancelled
- `existingReview`: Existing review data for editing

### ReviewCard
A component for displaying individual reviews.

**Props:**
- `review`: Review data object
- `onEdit`: Callback when edit is requested
- `onDelete`: Callback when delete is requested
- `onHelpful`: Callback when helpful is clicked

### ReviewsSection
A comprehensive component that manages the entire reviews section for a product.

**Props:**
- `productId`: ID of the product
- `productName`: Name of the product
- `averageRating`: Current average rating
- `reviewCount`: Total number of reviews

### ReviewSummary
A compact component for showing rating summary in product cards.

**Props:**
- `averageRating`: Average rating value
- `reviewCount`: Number of reviews
- `size`: Size variant ('sm', 'md', 'lg')
- `showCount`: Whether to show review count
- `className`: Additional CSS classes

## API Endpoints

The review system uses the following API endpoints:

- `GET /api/customer/reviews` - Get user's reviews or product reviews
- `POST /api/customer/reviews` - Create a new review
- `GET /api/customer/reviews/[id]` - Get a specific review
- `PUT /api/customer/reviews/[id]` - Update a review
- `DELETE /api/customer/reviews/[id]` - Delete a review
- `GET /api/customer/products/[id]/reviews` - Get reviews for a specific product

## Features

- ⭐ Interactive star rating system
- 📝 Rich review form with title and comment
- 🔍 Review filtering and sorting
- 📊 Rating distribution visualization
- 👍 Helpful votes for reviews
- ✏️ Edit and delete own reviews
- 📄 Pagination for large review lists
- 🔐 Authentication-based access control
- 📱 Responsive design
