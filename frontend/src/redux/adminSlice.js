import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';
import toast from 'react-hot-toast';

// --- Async Thunks ---

// Fetch all dashboard data
export const fetchAdminData = createAsyncThunk(
    'admin/fetchData',
    async (_, { rejectWithValue }) => {
        try {
            const [
                usersRes,
                hotelsRes,
                ownersRes,
                pendingManagersRes,
                pendingHotelsRes,
                contactMessagesRes
            ] = await Promise.all([
                api.get('/api/admin/users'),
                api.get('/api/admin/hotels'),
                api.get('/api/admin/owners'),
                api.get('/api/admin/managers/pending'),
                api.get('/api/admin/hotels/pending'),
                api.get('/api/admin/contact-messages'),
            ]);

            return {
                users: usersRes.data?.users || [],
                hotels: hotelsRes.data?.hotels || [],
                owners: ownersRes.data?.owners || [],
                pendingManagers: pendingManagersRes.data?.managers || [],
                pendingHotels: pendingHotelsRes.data?.hotels || [],
                contactMessages: contactMessagesRes.data?.messages || []
            };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch admin data');
        }
    }
);

export const deleteUser = createAsyncThunk(
    'admin/deleteUser',
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

export const deleteHotel = createAsyncThunk(
    'admin/deleteHotel',
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

export const deleteOwner = createAsyncThunk(
    'admin/deleteOwner',
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

export const toggleMembership = createAsyncThunk(
    'admin/toggleMembership',
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

export const approveManager = createAsyncThunk(
    'admin/approveManager',
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
    'admin/rejectManager',
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
    'admin/approveHotel',
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
    'admin/rejectHotel',
    async (payload, { rejectWithValue }) => {
        try {
            // Handle both simple ID and object payload
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

// --- Slice ---

const adminSlice = createSlice({
    name: 'admin',
    initialState: {
        users: [],
        hotels: [],
        owners: [],
        pendingManagers: [],
        pendingHotels: [],
        contactMessages: [],
        loading: false,
        error: null,
        lastFetched: null
    },
    reducers: {
        clearAdminError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Data
            .addCase(fetchAdminData.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAdminData.fulfilled, (state, action) => {
                state.loading = false;
                state.users = action.payload.users;
                state.hotels = action.payload.hotels;
                state.owners = action.payload.owners;
                state.pendingManagers = action.payload.pendingManagers;
                state.pendingHotels = action.payload.pendingHotels;
                state.contactMessages = action.payload.contactMessages;
                state.lastFetched = Date.now();
            })
            .addCase(fetchAdminData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Delete User
            .addCase(deleteUser.fulfilled, (state, action) => {
                const userId = action.payload;
                state.users = state.users.filter(u => u._id !== userId);
                // Also remove from owners if present
                state.owners = state.owners.filter(o => o.ownerId !== userId);
                
                // Remove their hotels (in case the user was a manager)
                state.hotels = state.hotels.filter(h => {
                    const hOwnerId = h.owner?._id || h.owner;
                    return hOwnerId !== userId;
                });
                state.pendingHotels = state.pendingHotels.filter(h => {
                    const hOwnerId = h.owner?._id || h.owner;
                    return hOwnerId !== userId;
                });
            })

            // Delete Hotel
            .addCase(deleteHotel.fulfilled, (state, action) => {
                const hotelId = action.payload;
                const hotel = state.hotels.find(h => h._id === hotelId);
                
                state.hotels = state.hotels.filter(h => h._id !== hotelId);
                state.pendingHotels = state.pendingHotels.filter(h => h._id !== hotelId);

                // Update owner count
                if (hotel && hotel.owner) {
                    const ownerId = hotel.owner._id || hotel.owner;
                    const owner = state.owners.find(o => o.ownerId === ownerId);
                    if (owner) {
                        owner.hotels = Math.max(0, owner.hotels - 1);
                    }
                }
            })

            // Delete Owner
            .addCase(deleteOwner.fulfilled, (state, action) => {
                const ownerId = action.payload;
                state.owners = state.owners.filter(o => o.ownerId !== ownerId);
                state.users = state.users.filter(u => u._id !== ownerId);
                // Remove their hotels
                state.hotels = state.hotels.filter(h => {
                    const hOwnerId = h.owner?._id || h.owner;
                    return hOwnerId !== ownerId;
                });
                state.pendingHotels = state.pendingHotels.filter(h => {
                    const hOwnerId = h.owner?._id || h.owner;
                    return hOwnerId !== ownerId;
                });
            })

            // Toggle Membership
            .addCase(toggleMembership.fulfilled, (state, action) => {
                const { id, isMember } = action.payload;
                const user = state.users.find(u => u._id === id);
                if (user) user.isMember = isMember;
            })

            // Approve Manager
            .addCase(approveManager.fulfilled, (state, action) => {
                const id = action.payload;
                state.pendingManagers = state.pendingManagers.filter(m => m._id !== id);
                // Update in users list if present
                const user = state.users.find(u => u._id === id);
                if (user) {
                    user.isApproved = true;
                    user.role = 'manager';
                }
            })

            // Reject Manager
            .addCase(rejectManager.fulfilled, (state, action) => {
                state.pendingManagers = state.pendingManagers.filter(m => m._id !== action.payload);
            })

            // Approve Hotel
            .addCase(approveHotel.fulfilled, (state, action) => {
                const id = action.payload;
                const hotel = state.pendingHotels.find(h => h._id === id);
                state.pendingHotels = state.pendingHotels.filter(h => h._id !== id);
                
                if (hotel) {
                    hotel.status = 'approved';
                    // Add to main hotels list if not already there (though usually we fetch separate lists)
                    // For simplicity, we might just want to refetch or push it
                    state.hotels.unshift(hotel);
                }
            })

            // Reject Hotel
            .addCase(rejectHotel.fulfilled, (state, action) => {
                const id = action.payload;
                const hotel = state.pendingHotels.find(h => h._id === id);
                state.pendingHotels = state.pendingHotels.filter(h => h._id !== id);

                // Update owner count
                if (hotel && hotel.owner) {
                    const ownerId = hotel.owner._id || hotel.owner;
                    const owner = state.owners.find(o => o.ownerId === ownerId);
                    if (owner) {
                        owner.hotels = Math.max(0, owner.hotels - 1);
                    }
                }
            });
    }
});

export const { clearAdminError } = adminSlice.actions;
export default adminSlice.reducer;
