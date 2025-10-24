import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

/**
 * Redux slice for managing admin contact message operations
 * Handles fetching contact messages from users for admin review
 */

/**
 * Async thunk to fetch all contact messages
 * Calls GET /api/admin/contact-messages endpoint to retrieve all contact messages
 * Returns array of contact messages sorted by creation date (newest first)
 */
export const fetchMessages = createAsyncThunk(
    'messages/fetchMessages',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/api/admin/contact-messages');
            return response.data?.messages || [];
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
        }
    }
);

/**
 * Messages slice configuration
 * Manages state for contact messages, loading states, and errors
 */
const messagesSlice = createSlice({
    name: 'messages',
    initialState: {
        messages: [], // Array of contact messages from users
        loading: false, // Loading state for async operations
        error: null // Error message if any operation fails
    },
    reducers: {}, // No synchronous reducers needed
    extraReducers: (builder) => {
        builder
            // Fetch messages cases
            .addCase(fetchMessages.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMessages.fulfilled, (state, action) => {
                state.loading = false;
                state.messages = action.payload;
            })
            .addCase(fetchMessages.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export default messagesSlice.reducer;
