import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';
import toast from 'react-hot-toast';

/**
 * Redux slice for managing admin user operations
 * Handles fetching users, deleting users, and toggling membership status
 */

/**
 * Async thunk to fetch all users with their booking statistics
 * Calls GET /api/admin/users endpoint
 */
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

/**
 * Async thunk to delete a user and all associated data
 * Calls DELETE /api/admin/users/:id endpoint
 * Shows success/error toast notifications
 */
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

/**
 * Async thunk to toggle user membership status
 * Calls PATCH /api/admin/users/:id/membership endpoint
 * Toggles between member and non-member status
 */
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

/**
 * Users slice configuration
 * Manages state for user list, loading states, and errors
 */
const usersSlice = createSlice({
    name: 'users',
    initialState: {
        users: [], // Array of user objects with booking statistics
        loading: false, // Loading state for async operations
        error: null // Error message if any operation fails
    },
    reducers: {}, // No synchronous reducers needed
    extraReducers: (builder) => {
        builder
            // Fetch users cases
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

            // Delete user cases
            .addCase(deleteUser.fulfilled, (state, action) => {
                // Remove deleted user from the users array
                state.users = state.users.filter(u => u._id !== action.payload);
            })

            // Toggle membership cases
            .addCase(toggleMembership.fulfilled, (state, action) => {
                const { id, isMember } = action.payload;
                // Update the membership status of the specific user
                const user = state.users.find(u => u._id === id);
                if (user) user.isMember = isMember;
            })

            // Cross-slice actions - handle state updates from other slices

            // When an owner is deleted, remove them from users list
            .addCase('owners/deleteOwner/fulfilled', (state, action) => {
                state.users = state.users.filter(u => u._id !== action.payload);
            })

            // When a manager is approved, update their role and approval status
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
