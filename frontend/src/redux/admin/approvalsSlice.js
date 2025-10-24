import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';
import toast from 'react-hot-toast';

/**
 * Redux slice for managing admin approval operations
 * Handles pending manager and hotel approvals, including approve/reject actions
 */

/**
 * Async thunk to fetch all pending approvals (both managers and hotels)
 * Makes parallel API calls to GET /api/admin/managers/pending and GET /api/admin/hotels/pending
 * Returns combined data for both pending managers and hotels
 */
export const fetchPendingApprovals = createAsyncThunk(
    'approvals/fetchPendingApprovals',
    async (_, { rejectWithValue }) => {
        try {
            const [pendingManagersRes, pendingHotelsRes] = await Promise.all([
                api.get('/api/admin/managers/pending'),
                api.get('/api/admin/hotels/pending')
            ]);
            return {
                pendingManagers: pendingManagersRes.data?.managers || [],
                pendingHotels: pendingHotelsRes.data?.hotels || []
            };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch approvals');
        }
    }
);

/**
 * Async thunk to approve a manager request
 * Calls PATCH /api/admin/managers/:id/approve endpoint
 * Grants manager role and approval status to the user
 */
export const approveManager = createAsyncThunk(
    'approvals/approveManager',
    async (id, { rejectWithValue }) => {
        try {
            await api.patch(`/api/admin/managers/${id}/approve`);
            toast.success('Manager approved');
            return id;
        } catch (error) {
            toast.error('Failed to approve manager');
            return rejectWithValue(error.response?.data?.message);
        }
    }
);

/**
 * Async thunk to reject a manager request
 * Calls PATCH /api/admin/managers/:id/reject endpoint
 * Demotes user back to traveller role and removes approval
 */
export const rejectManager = createAsyncThunk(
    'approvals/rejectManager',
    async (id, { rejectWithValue }) => {
        try {
            await api.patch(`/api/admin/managers/${id}/reject`);
            toast.success('Manager rejected');
            return id;
        } catch (error) {
            toast.error('Failed to reject manager');
            return rejectWithValue(error.response?.data?.message);
        }
    }
);

/**
 * Async thunk to approve a hotel listing
 * Calls PATCH /api/admin/hotels/:id/approve endpoint
 * Makes the hotel available for booking on the platform
 */
export const approveHotel = createAsyncThunk(
    'approvals/approveHotel',
    async (id, { rejectWithValue }) => {
        try {
            await api.patch(`/api/admin/hotels/${id}/approve`);
            toast.success('Hotel approved');
            return id;
        } catch (error) {
            toast.error('Failed to approve hotel');
            return rejectWithValue(error.response?.data?.message);
        }
    }
);

/**
 * Async thunk to reject a hotel listing
 * Calls PATCH /api/admin/hotels/:id/reject endpoint
 * Accepts either a string ID or an object with id and reason properties
 * Sets hotel status to rejected with optional rejection reason
 */
export const rejectHotel = createAsyncThunk(
    'approvals/rejectHotel',
    async (payload, { rejectWithValue }) => {
        try {
            const id = typeof payload === 'object' ? payload.id : payload;
            const reason = typeof payload === 'object' ? payload.reason : null;

            await api.patch(`/api/admin/hotels/${id}/reject`, { reason });
            toast.success('Hotel rejected');
            return id;
        } catch (error) {
            toast.error('Failed to reject hotel');
            return rejectWithValue(error.response?.data?.message);
        }
    }
);

/**
 * Approvals slice configuration
 * Manages state for pending managers, pending hotels, loading states, and errors
 */
const approvalsSlice = createSlice({
    name: 'approvals',
    initialState: {
        pendingManagers: [], // Array of users requesting manager approval
        pendingHotels: [], // Array of hotels pending approval
        loading: false, // Loading state for async operations
        error: null // Error message if any operation fails
    },
    reducers: {}, // No synchronous reducers needed
    extraReducers: (builder) => {
        builder
            // Fetch pending approvals cases
            .addCase(fetchPendingApprovals.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPendingApprovals.fulfilled, (state, action) => {
                state.loading = false;
                state.pendingManagers = action.payload.pendingManagers;
                state.pendingHotels = action.payload.pendingHotels;
            })
            .addCase(fetchPendingApprovals.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Manager approval cases
            .addCase(approveManager.fulfilled, (state, action) => {
                // Remove approved manager from pending list
                state.pendingManagers = state.pendingManagers.filter(m => m._id !== action.payload);
            })
            .addCase(rejectManager.fulfilled, (state, action) => {
                // Remove rejected manager from pending list
                state.pendingManagers = state.pendingManagers.filter(m => m._id !== action.payload);
            })

            // Hotel approval cases
            .addCase(approveHotel.fulfilled, (state, action) => {
                // Remove approved hotel from pending list
                state.pendingHotels = state.pendingHotels.filter(h => h._id !== action.payload);
            })
            .addCase(rejectHotel.fulfilled, (state, action) => {
                // Remove rejected hotel from pending list
                state.pendingHotels = state.pendingHotels.filter(h => h._id !== action.payload);
            });
    }
});

export default approvalsSlice.reducer;
