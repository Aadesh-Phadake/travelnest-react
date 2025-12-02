import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export const fetchUsers = createAsyncThunk(
    'users/fetchUsers',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/api/admin/users');
            return response.data?.users || [];
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
        }
    }
);

export const deleteUser = createAsyncThunk(
    'users/deleteUser',
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`/api/admin/users/${id}`);
            toast.success('User deleted');
            return id;
        } catch (error) {
            toast.error('Failed to delete user');
            return rejectWithValue(error.response?.data?.message);
        }
    }
);

export const toggleMembership = createAsyncThunk(
    'users/toggleMembership',
    async ({ id, isMember }, { rejectWithValue }) => {
        try {
            await api.patch(`/api/admin/users/${id}/membership`, { isMember: !isMember });
            toast.success('Membership updated');
            return { id, isMember: !isMember };
        } catch (error) {
            toast.error('Failed to update membership');
            return rejectWithValue(error.response?.data?.message);
        }
    }
);

const usersSlice = createSlice({
    name: 'users',
    initialState: {
        users: [],
        loading: false,
        error: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchUsers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.users = action.payload;
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(deleteUser.fulfilled, (state, action) => {
                state.users = state.users.filter(u => u._id !== action.payload);
            })
            .addCase(toggleMembership.fulfilled, (state, action) => {
                const { id, isMember } = action.payload;
                const user = state.users.find(u => u._id === id);
                if (user) user.isMember = isMember;
            })
            // Cross-slice actions
            .addCase('owners/deleteOwner/fulfilled', (state, action) => {
                state.users = state.users.filter(u => u._id !== action.payload);
            })
            .addCase('approvals/approveManager/fulfilled', (state, action) => {
                const user = state.users.find(u => u._id === action.payload);
                if (user) {
                    user.role = 'manager';
                    user.isApproved = true;
                }
            });
    }
});

export default usersSlice.reducer;
