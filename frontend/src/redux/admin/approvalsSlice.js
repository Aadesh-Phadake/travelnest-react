import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';
import toast from 'react-hot-toast';

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

const approvalsSlice = createSlice({
    name: 'approvals',
    initialState: {
        pendingManagers: [],
        pendingHotels: [],
        loading: false,
        error: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
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
            .addCase(approveManager.fulfilled, (state, action) => {
                state.pendingManagers = state.pendingManagers.filter(m => m._id !== action.payload);
            })
            .addCase(rejectManager.fulfilled, (state, action) => {
                state.pendingManagers = state.pendingManagers.filter(m => m._id !== action.payload);
            })
            .addCase(approveHotel.fulfilled, (state, action) => {
                state.pendingHotels = state.pendingHotels.filter(h => h._id !== action.payload);
            })
            .addCase(rejectHotel.fulfilled, (state, action) => {
                state.pendingHotels = state.pendingHotels.filter(h => h._id !== action.payload);
            });
    }
});

export default approvalsSlice.reducer;
