import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'seller' | 'admin';
  isActive: boolean;
  isApproved?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'customer' | 'seller';
}

export interface AuthResponse {
  success: boolean;
  data: {
    _id: string;
    name: string;
    email: string;
    role: string;
    token: string;
  };
  message: string;
  statusCode: number;
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data: AuthResponse = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Login failed');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Network error');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData: RegisterData, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data: AuthResponse = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Registration failed');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Network error');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const token = state.auth.token;

      if (token) {
        // You can add a logout API call here if needed
        // await fetch('/api/auth/logout', {
        //   method: 'POST',
        //   headers: {
        //     'Authorization': `Bearer ${token}`,
        //   },
        // });
      }

      return true;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Logout failed');
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        console.log("Action payload ::::", action.payload);
        state.user = {
          _id: action.payload.data._id,
          name: action.payload.data.name,
          email: action.payload.data.email,
          role: action.payload.data.role as 'customer' | 'seller' | 'admin',
          isActive: true,
          createdAt: '',
          updatedAt: '',
        };
        state.token = action.payload.data.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = {
          _id: action.payload.data._id,
          name: action.payload.data.name,
          email: action.payload.data.email,
          role: action.payload.data.role as 'customer' | 'seller' | 'admin',
          isActive: true,
          createdAt: '',
          updatedAt: '',
        };
        state.token = action.payload.data.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Logout
    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
