import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

// 1. Define the Async Action (Thunk) for Login
export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await api.post('/login', credentials);
            return response.data.user; // payload for fulfilled state
        } catch (error) {
            // Return error message for rejected state
            return rejectWithValue(error.response?.data?.message || 'Login failed');
        }
    }
);

// 2. Define the Slice
const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        loading: false,
        error: null,
    },
    reducers: {
        // Synchronous action for logout
        logout: (state) => {
            state.user = null;
            state.error = null;
            // Optionally call api.get('/logout') here or in the component
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Handle Loading
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            // Handle Success
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload; // Data from backend
            })
            // Handle Error
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload; // Error message
            });
    },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;