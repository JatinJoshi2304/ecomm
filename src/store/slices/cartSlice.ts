import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface CartItem {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    stock: number;
  };
  quantity: number;
  price: number; // price when added to cart
  size?: {
    _id: string;
    name: string;
    type: string;
  };
  color?: {
    _id: string;
    name: string;
    hexCode: string;
  };
  subtotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface Cart {
  id: string;
  userId?: string;
  sessionId?: string;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;
}

export interface AddToCartData {
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
  sessionId?: string;
}

export interface UpdateCartItemData {
  itemId: string;
  quantity: number;
  sessionId?: string;
}

// Initial state
const initialState: CartState = {
  cart: null,
  isLoading: false,
  error: null,
  sessionId: null,
};

// Helper function to generate session ID
const generateSessionId = () => {
  return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
};

// Async thunks
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (params: { sessionId?: string; token?: string }, { rejectWithValue }) => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (params.token) {
        headers['Authorization'] = `Bearer ${params.token}`;
      }

      const url = params.sessionId 
        ? `/api/customer/cart?sessionId=${params.sessionId}`
        : '/api/customer/cart';

      const response = await fetch(url, { headers });
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch cart');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Network error');
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async (data: AddToCartData, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string | null }; cart: CartState };
      const token = state.auth.token;
      const sessionId = data.sessionId || state.cart.sessionId;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const body = {
        productId: data.productId,
        quantity: data.quantity,
        size: data.size,
        color: data.color,
        ...(sessionId && { sessionId }),
      };

      const response = await fetch('/api/customer/cart', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        return rejectWithValue(result.message || 'Failed to add to cart');
      }

      return result.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Network error');
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async (data: UpdateCartItemData, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string | null }; cart: CartState };
      const token = state.auth.token;
      const sessionId = data.sessionId || state.cart.sessionId;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const body = {
        quantity: data.quantity,
        ...(sessionId && { sessionId }),
      };

      const response = await fetch(`/api/customer/cart/items/${data.itemId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        return rejectWithValue(result.message || 'Failed to update cart item');
      }

      return result.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Network error');
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (data: { itemId: string; sessionId?: string }, { getState, rejectWithValue }) => {
    try {
      debugger
      const state = getState() as { auth: { token: string | null }; cart: CartState };
      const token = state.auth.token;
      const sessionId = data.sessionId || state.cart.sessionId;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = token 
        ? `/api/customer/cart/items/${data.itemId}`
        : `/api/customer/cart/items/${data.itemId}?sessionId=${sessionId}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers,
      });

      const result = await response.json();

      if (!response.ok) {
        return rejectWithValue(result.message || 'Failed to remove from cart');
      }

      return result.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Network error');
    }
  }
);

export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (params: { sessionId?: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string | null }; cart: CartState };
      const token = state.auth.token;
      const sessionId = params.sessionId || state.cart.sessionId;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = sessionId 
        ? `/api/customer/cart?sessionId=${sessionId}`
        : '/api/customer/cart';

      const response = await fetch(url, {
        method: 'DELETE',
        headers,
      });

      const result = await response.json();

      if (!response.ok) {
        return rejectWithValue(result.message || 'Failed to clear cart');
      }

      return result.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Network error');
    }
  }
);

export const mergeCarts = createAsyncThunk(
  'cart/mergeCarts',
  async (params: { guestSessionId: string; token: string }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/customer/cart/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${params.token}`,
        },
        body: JSON.stringify({
          guestSessionId: params.guestSessionId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return rejectWithValue(result.message || 'Failed to merge carts');
      }

      return result.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Network error');
    }
  }
);

// Cart slice
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSessionId: (state, action: PayloadAction<string>) => {
      state.sessionId = action.payload;
    },
    generateNewSessionId: (state) => {
      state.sessionId = generateSessionId();
    },
    clearCart: (state) => {
      state.cart = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch cart
    builder
      .addCase(fetchCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cart = action.payload;
        state.error = null;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Add to cart
    builder
      .addCase(addToCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cart = action.payload;
        state.error = null;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update cart item
    builder
      .addCase(updateCartItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cart = action.payload;
        state.error = null;
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Remove from cart
    builder
      .addCase(removeFromCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cart = action.payload;
        state.error = null;
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Clear cart
    builder
      .addCase(clearCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cart = action.payload;
        state.error = null;
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Merge carts
    builder
      .addCase(mergeCarts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(mergeCarts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cart = action.payload;
        state.error = null;
      })
      .addCase(mergeCarts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setSessionId, generateNewSessionId, clearCart: clearCartAction } = cartSlice.actions;
export default cartSlice.reducer;
