import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';
import toast from 'react-hot-toast';

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

const ownersSlice = createSlice({
    name: 'owners',
    initialState: {
        owners: [],
        loading: false,
        error: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
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
            .addCase(deleteOwner.fulfilled, (state, action) => {
                state.owners = state.owners.filter(o => o.ownerId !== action.payload);
            })
            // Cross-slice actions
            .addCase('users/deleteUser/fulfilled', (state, action) => {
                state.owners = state.owners.filter(o => o.ownerId !== action.payload);
            });
    }
});

export default ownersSlice.reducer;
