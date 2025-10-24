import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';
import toast from 'react-hot-toast';

/**
 * Redux slice for managing admin hotel operations
 * Handles fetching approved hotels with statistics and deleting hotels
 */

/**
 * Async thunk to fetch all approved hotels with booking and revenue statistics
 * Calls GET /api/admin/hotels endpoint
 * Returns hotels with calculated platform revenue and commission data
 */
export const fetchHotels = createAsyncThunk(
    'hotels/fetchHotels',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/api/admin/hotels');
            return response.data?.hotels || [];
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch hotels');
        }
    }
);

/**
 * Async thunk to delete a hotel and all associated bookings
 * Calls DELETE /api/admin/hotels/:id endpoint
 * Shows success/error toast notifications
 */
export const deleteHotel = createAsyncThunk(
    'hotels/deleteHotel',
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`/api/admin/hotels/${id}`);
            toast.success('Hotel deleted');
            return id;
        } catch (error) {
            toast.error('Failed to delete hotel');
            return rejectWithValue(error.response?.data?.message);
        }
    }
);

/**
 * Hotels slice configuration
 * Manages state for hotel list, loading states, and errors
 */
const hotelsSlice = createSlice({
    name: 'hotels',
    initialState: {
        hotels: [], // Array of hotel objects with booking/revenue statistics
        loading: false, // Loading state for async operations
        error: null // Error message if any operation fails
    },
    reducers: {}, // No synchronous reducers needed
    extraReducers: (builder) => {
        builder
            // Fetch hotels cases
            .addCase(fetchHotels.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchHotels.fulfilled, (state, action) => {
                state.loading = false;
                state.hotels = action.payload;
            })
            .addCase(fetchHotels.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Delete hotel cases
            .addCase(deleteHotel.fulfilled, (state, action) => {
                // Remove deleted hotel from the hotels array
                state.hotels = state.hotels.filter(h => h._id !== action.payload);
            })

            // Cross-slice actions - handle state updates from other slices

            // When a user is deleted, remove all their hotels
            .addCase('users/deleteUser/fulfilled', (state, action) => {
                state.hotels = state.hotels.filter(h => {
                    const ownerId = h.owner?._id || h.owner;
                    return ownerId !== action.payload;
                });
            })

            // When an owner is deleted, remove all their hotels
            .addCase('owners/deleteOwner/fulfilled', (state, action) => {
                state.hotels = state.hotels.filter(h => {
                    const ownerId = h.owner?._id || h.owner;
                    return ownerId !== action.payload;
                });
            });
    }
});

export default hotelsSlice.reducer;
