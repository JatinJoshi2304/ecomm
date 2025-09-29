'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAppSelector } from '@/store/hooks';

interface Wishlist {
  _id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WishlistWithItemCount extends Wishlist {
  itemCount: number;
}

export default function CustomerWishlistsPage() {
  const router = useRouter();
  const { isAuthenticated, token } = useAppSelector((state) => state.auth);
  
  const [wishlists, setWishlists] = useState<WishlistWithItemCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWishlistName, setNewWishlistName] = useState('');
  const [newWishlistDescription, setNewWishlistDescription] = useState('');
  const [newWishlistPublic, setNewWishlistPublic] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadWishlists();
  }, [isAuthenticated, router]);

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
          // Load item count for each wishlist
          const wishlistsWithCounts = await Promise.all(
            result.data.wishlists.map(async (wishlist: Wishlist) => {
              try {
                const itemsResponse = await fetch(`/api/customer/wishlists/items?wishlistId=${wishlist._id}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                
                if (itemsResponse.ok) {
                  const itemsResult = await itemsResponse.json();
                  return {
                    ...wishlist,
                    itemCount: itemsResult.success ? itemsResult.data.items.length : 0
                  };
                }
                return { ...wishlist, itemCount: 0 };
              } catch (error) {
                console.error('Failed to load wishlist items:', error);
                return { ...wishlist, itemCount: 0 };
              }
            })
          );
          
          setWishlists(wishlistsWithCounts);
        }
      }
    } catch (error) {
      console.error('Failed to load wishlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWishlist = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newWishlistName.trim()) return;

    setCreating(true);
    
    try {
      const response = await fetch('/api/customer/wishlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newWishlistName.trim(),
          description: newWishlistDescription.trim(),
          isPublic: newWishlistPublic
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Add the new wishlist to the list
          setWishlists(prev => [...prev, { ...result.data, itemCount: 0 }]);
          setNewWishlistName('');
          setNewWishlistDescription('');
          setNewWishlistPublic(false);
          setShowCreateForm(false);
        }
      } else {
        const result = await response.json();
        alert(result.message || 'Failed to create wishlist');
      }
    } catch (error) {
      console.error('Failed to create wishlist:', error);
      alert('Failed to create wishlist');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteWishlist = async (wishlistId: string, isDefault: boolean) => {
    if (isDefault) {
      alert('Cannot delete the default wishlist');
      return;
    }

    if (!confirm('Are you sure you want to delete this wishlist? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/customer/wishlists/${wishlistId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setWishlists(prev => prev.filter(w => w._id !== wishlistId));
      } else {
        const result = await response.json();
        alert(result.message || 'Failed to delete wishlist');
      }
    } catch (error) {
      console.error('Failed to delete wishlist:', error);
      alert('Failed to delete wishlist');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Wishlists</h1>
              <p className="text-gray-600 mt-2">Organize your favorite products into wishlists</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Create New Wishlist
            </button>
          </div>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Wishlist</h3>
            <form onSubmit={handleCreateWishlist}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newWishlistName}
                    onChange={(e) => setNewWishlistName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter wishlist name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Public
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newWishlistPublic}
                      onChange={(e) => setNewWishlistPublic(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">Make this wishlist public</span>
                  </label>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newWishlistDescription}
                  onChange={(e) => setNewWishlistDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Enter wishlist description (optional)"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Wishlist'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Wishlists Grid */}
        {wishlists.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No wishlists yet</h3>
            <p className="text-gray-600 mb-6">Create your first wishlist to start saving your favorite products</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Wishlist
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlists.map((wishlist) => (
              <div key={wishlist._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {wishlist.name}
                      </h3>
                      {/* {wishlist.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {wishlist.description}
                        </p>
                      )} */}
                      <p className="text-sm text-gray-500">
                        {wishlist.itemCount} {wishlist.itemCount === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {wishlist.isDefault && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Default
                        </span>
                      )}
                      {wishlist.isPublic && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Public
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/customer/wishlists/${wishlist._id}`}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center text-sm font-medium"
                    >
                      View Wishlist
                    </Link>
                    {!wishlist.isDefault && (
                      <button
                        onClick={() => handleDeleteWishlist(wishlist._id, wishlist.isDefault)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
