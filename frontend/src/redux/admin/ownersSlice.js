import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';
import toast from 'react-hot-toast';

/**
 * Redux slice for managing admin owner/manager operations
 * Handles fetching owner statistics and deleting owners (managers)
 */

/**
 * Async thunk to fetch all hotel owners/managers with their performance statistics
 * Calls GET /api/admin/owners endpoint
 * Returns owners with hotel counts, revenue breakdowns, and platform earnings
 */
export const fetchOwners = createAsyncThunk(
    'owners/fetchOwners',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/api/admin/owners');
            return response.data?.owners || [];
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch owners');
        }
    }
);

/**
 * Async thunk to delete an owner/manager and all their associated data
 * Calls DELETE /api/admin/users/:id endpoint (same as user deletion)
 * Shows success/error toast notifications
 * Note: This will cascade delete all hotels and bookings owned by this manager
 */
export const deleteOwner = createAsyncThunk(
    'owners/deleteOwner',
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`/api/admin/users/${id}`);
            toast.success('Owner deleted');
            return id;
        } catch (error) {
            toast.error('Failed to delete owner');
            return rejectWithValue(error.response?.data?.message);
        }
    }
);

/**
 * Owners slice configuration
 * Manages state for owner list, loading states, and errors
 */
const ownersSlice = createSlice({
    name: 'owners',
    initialState: {
        owners: [], // Array of owner objects with performance statistics
        loading: false, // Loading state for async operations
        error: null // Error message if any operation fails
    },
    reducers: {}, // No synchronous reducers needed
    extraReducers: (builder) => {
        builder
            // Fetch owners cases
            .addCase(fetchOwners.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchOwners.fulfilled, (state, action) => {
                state.loading = false;
                state.owners = action.payload;
            })
            .addCase(fetchOwners.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Delete owner cases
            .addCase(deleteOwner.fulfilled, (state, action) => {
                // Remove deleted owner from the owners array
                state.owners = state.owners.filter(o => o.ownerId !== action.payload);
            })

            // Cross-slice actions - handle state updates from other slices

            // When a user is deleted, remove them from owners list if they were a manager
            .addCase('users/deleteUser/fulfilled', (state, action) => {
                state.owners = state.owners.filter(o => o.ownerId !== action.payload);
            });
    }
});

export default ownersSlice.reducer;
