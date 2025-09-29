'use client';

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';

interface Wishlist {
  _id: string;
  name: string;
  description?: string;
  isDefault: boolean;
}

interface WishlistButtonProps {
  productId: string;
  size?: string;
  color?: string;
  onAddToWishlist?: (wishlistId: string) => void;
}

export default function WishlistButton({ productId, size, color, onAddToWishlist }: WishlistButtonProps) {
  const { isAuthenticated, token } = useAppSelector((state) => state.auth);
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadWishlists();
      checkIfInWishlist();
    }
  }, [isAuthenticated, productId]);

  const loadWishlists = async () => {
    try {
      const response = await fetch('/api/customer/wishlists', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setWishlists(result.data.wishlists);
        }
      }
    } catch (error) {
      console.error('Failed to load wishlists:', error);
    }
  };

  const checkIfInWishlist = async () => {
    try {
      const response = await fetch(`/api/customer/wishlists/items?productId=${productId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setIsInWishlist(result.data.items.length > 0);
        }
      }
    } catch (error) {
      console.error('Failed to check wishlist status:', error);
    }
  };

  const handleAddToWishlist = async (wishlistId: string) => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/customer/wishlists/${wishlistId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId,
          size,
          color
        })
      });

      if (response.ok) {
        setIsInWishlist(true);
        setShowWishlistModal(false);
        onAddToWishlist?.(wishlistId);
      } else {
        const result = await response.json();
        if (result.message?.includes('already exists')) {
          alert('This product is already in the selected wishlist');
        } else {
          alert('Failed to add product to wishlist');
        }
      }
    } catch (error) {
      console.error('Failed to add to wishlist:', error);
      alert('Failed to add product to wishlist');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAddToDefault = async () => {
    setLoading(true);
    
    try {
      // Get default wishlist
      const response = await fetch('/api/customer/wishlists/default', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const defaultWishlistId = result.data._id;
          await handleAddToWishlist(defaultWishlistId);
        }
      }
    } catch (error) {
      console.error('Failed to add to default wishlist:', error);
      alert('Failed to add product to wishlist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async () => {
    setLoading(true);
    
    try {
      // Find which wishlist contains this product
      const response = await fetch(`/api/customer/wishlists/items?productId=${productId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.items.length > 0) {
          const item = result.data.items[0];
          // Extract the actual wishlist ID from the populated object
          const wishlistId = typeof item.wishlistId === 'object' ? item.wishlistId._id : item.wishlistId;
          const deleteResponse = await fetch(`/api/customer/wishlists/${wishlistId}/items/${item._id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (deleteResponse.ok) {
            setIsInWishlist(false);
          }
        }
      }
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => {
            if (isInWishlist) {
              handleRemoveFromWishlist();
            } else {
              handleQuickAddToDefault();
            }
          }}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isInWishlist
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          ) : (
            <svg
              className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          )}
          <span className="text-sm font-medium">
            {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
          </span>
        </button>
        
        {!isInWishlist && wishlists.length > 1 && (
          <button
            onClick={() => setShowWishlistModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        )}
      </div>

      {/* Wishlist Selection Modal */}
      {showWishlistModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add to Wishlist
            </h3>
            
            <div className="space-y-2 mb-6">
              {wishlists
                .sort((a, b) => {
                  // Sort default wishlist first
                  if (a.isDefault && !b.isDefault) return -1;
                  if (!a.isDefault && b.isDefault) return 1;
                  return 0;
                })
                .map((wishlist) => (
                  <button
                    key={wishlist._id}
                    onClick={() => handleAddToWishlist(wishlist._id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      wishlist.isDefault 
                        ? 'border-blue-200 bg-blue-50 hover:bg-blue-100' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium text-gray-900">{wishlist.name}</span>
                        {wishlist.description && (
                          <p className="text-sm text-gray-600 mt-1">{wishlist.description}</p>
                        )}
                      </div>
                      {wishlist.isDefault && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                  </button>
                ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowWishlistModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
