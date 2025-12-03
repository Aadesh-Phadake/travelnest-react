import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';
import toast from 'react-hot-toast';

// Async Thunks

export const fetchAdminDashboardData = createAsyncThunk(
  'admin/fetchAll',
  async ({ revenuePeriod, bookingsPeriod }, { rejectWithValue }) => {
    try {
      const [
        usersRes,
        hotelsRes,
        ownersRes,
        revenueRes,
        topHotelsRes,
        bookingsTrendRes,
        pendingManagersRes,
        pendingHotelsRes,
        commissionSummaryRes,
        contactMessagesRes,
      ] = await Promise.all([
        api.get('/api/admin/users'),
        api.get('/api/admin/hotels'),
        api.get('/api/admin/owners'),
        api.get('/api/admin/charts/revenue', { params: { period: revenuePeriod } }),
        api.get('/api/admin/charts/top-hotels'),
        api.get('/api/admin/charts/bookings-trend', { params: { period: bookingsPeriod } }),
        api.get('/api/admin/managers/pending'),
        api.get('/api/admin/hotels/pending'),
        api.get('/api/admin/commission/summary'),
        api.get('/api/admin/contact-messages'),
      ]);

      return {
        users: usersRes.data?.users || [],
        hotels: hotelsRes.data?.hotels || [],
        owners: ownersRes.data?.owners || [],
        revenueSeries: revenueRes.data?.data || [],
        topHotelsSeries: topHotelsRes.data?.data || [],
        bookingsSeries: bookingsTrendRes.data?.data || [],
        pendingManagers: pendingManagersRes.data?.managers || [],
        pendingHotels: pendingHotelsRes.data?.hotels || [],
        commissionSummary: commissionSummaryRes.data?.summary || {
          totalCommission: 0,
          avgCommissionPerBooking: 0,
        },
        contactMessages: contactMessagesRes.data?.messages || [],
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load admin dashboard');
    }
  }
);

export const fetchRevenueChart = createAsyncThunk(
  'admin/fetchRevenueChart',
  async (period, { rejectWithValue }) => {
    try {
      const res = await api.get('/api/admin/charts/revenue', { params: { period } });
      return res.data?.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch revenue chart');
    }
  }
);

export const fetchBookingsChart = createAsyncThunk(
  'admin/fetchBookingsChart',
  async (period, { rejectWithValue }) => {
    try {
      const res = await api.get('/api/admin/charts/bookings-trend', { params: { period } });
      return res.data?.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bookings chart');
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
      return rejectWithValue(error.response?.data?.message || 'Failed to delete user');
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
      return rejectWithValue(error.response?.data?.message || 'Failed to delete owner');
    }
  }
);

export const deleteHotel = createAsyncThunk(
  'admin/deleteHotel',
  async (id, { rejectWithValue }) => {
    try {
      // We need to find the hotel to know the owner, but we can do that in the reducer or here.
      // Let's just return the id and handle state update in reducer.
      await api.delete(`/api/admin/hotels/${id}`);
      toast.success('Hotel deleted');
      return id;
    } catch (error) {
      toast.error('Failed to delete hotel');
      return rejectWithValue(error.response?.data?.message || 'Failed to delete hotel');
    }
  }
);

export const toggleMembership = createAsyncThunk(
  'admin/toggleMembership',
  async ({ id, current }, { rejectWithValue }) => {
    try {
      await api.patch(`/api/admin/users/${id}/membership`, { isMember: !current });
      toast.success('Membership updated');
      return { id, isMember: !current };
    } catch (error) {
      toast.error('Failed to update membership');
      return rejectWithValue(error.response?.data?.message || 'Failed to update membership');
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
      return rejectWithValue(error.response?.data?.message || 'Failed to approve manager');
    }
  }
);

export const rejectManager = createAsyncThunk(
  'admin/rejectManager',
  async (id, { rejectWithValue }) => {
    try {
      await api.patch(`/api/admin/managers/${id}/reject`);
      toast.success('Manager request rejected');
      return id;
    } catch (error) {
      toast.error('Failed to reject manager');
      return rejectWithValue(error.response?.data?.message || 'Failed to reject manager');
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
      return rejectWithValue(error.response?.data?.message || 'Failed to approve hotel');
    }
  }
);

export const rejectHotel = createAsyncThunk(
  'admin/rejectHotel',
  async (id, { rejectWithValue }) => {
    try {
      await api.patch(`/api/admin/hotels/${id}/reject`);
      toast.success('Hotel rejected');
      return id;
    } catch (error) {
      toast.error('Failed to reject hotel');
      return rejectWithValue(error.response?.data?.message || 'Failed to reject hotel');
    }
  }
);

const initialState = {
  users: [],
  owners: [],
  hotels: [],
  pendingManagers: [],
  pendingHotels: [],
  contactMessages: [],
  stats: {
    revenueSeries: [],
    bookingsSeries: [],
    topHotelsSeries: [],
    commissionSummary: {
      totalCommission: 0,
      avgCommissionPerBooking: 0,
    },
  },
  loading: false,
  actionLoading: false,
  error: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearAdminData: () => {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchAdminDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.users;
        state.hotels = action.payload.hotels;
        state.owners = action.payload.owners;
        state.pendingManagers = action.payload.pendingManagers;
        state.pendingHotels = action.payload.pendingHotels;
        state.contactMessages = action.payload.contactMessages;
        state.stats.revenueSeries = action.payload.revenueSeries;
        state.stats.bookingsSeries = action.payload.bookingsSeries;
        state.stats.topHotelsSeries = action.payload.topHotelsSeries;
        state.stats.commissionSummary = action.payload.commissionSummary;
      })
      .addCase(fetchAdminDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Charts
      .addCase(fetchRevenueChart.fulfilled, (state, action) => {
        state.stats.revenueSeries = action.payload;
      })
      .addCase(fetchBookingsChart.fulfilled, (state, action) => {
        state.stats.bookingsSeries = action.payload;
      })

      // Delete User
      .addCase(deleteUser.pending, (state) => { state.actionLoading = true; })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.users = state.users.filter((u) => u._id !== action.payload);
      })
      .addCase(deleteUser.rejected, (state) => { state.actionLoading = false; })

      // Delete Owner
      .addCase(deleteOwner.pending, (state) => { state.actionLoading = true; })
      .addCase(deleteOwner.fulfilled, (state, action) => {
        state.actionLoading = false;
        const id = action.payload;
        state.owners = state.owners.filter((o) => o.ownerId !== id);
        state.users = state.users.filter((u) => u._id !== id);
        // Remove their hotels
        state.hotels = state.hotels.filter((h) => {
            const ownerId = h.owner?._id || h.owner;
            return ownerId !== id;
        });
        state.pendingHotels = state.pendingHotels.filter((h) => {
            const ownerId = h.owner?._id || h.owner;
            return ownerId !== id;
        });
      })
      .addCase(deleteOwner.rejected, (state) => { state.actionLoading = false; })

      // Delete Hotel
      .addCase(deleteHotel.pending, (state) => { state.actionLoading = true; })
      .addCase(deleteHotel.fulfilled, (state, action) => {
        state.actionLoading = false;
        const id = action.payload;
        const hotelToDelete = state.hotels.find(h => h._id === id);
        
        state.hotels = state.hotels.filter((h) => h._id !== id);
        state.pendingHotels = state.pendingHotels.filter((h) => h._id !== id);

        // Update owner count
        if (hotelToDelete && hotelToDelete.owner) {
            const ownerId = hotelToDelete.owner._id || hotelToDelete.owner;
            state.owners = state.owners.map(owner => {
                if (owner.ownerId === ownerId) {
                    return { ...owner, hotels: Math.max(0, owner.hotels - 1) };
                }
                return owner;
            });
        }
      })
      .addCase(deleteHotel.rejected, (state) => { state.actionLoading = false; })

      // Toggle Membership
      .addCase(toggleMembership.pending, (state) => { state.actionLoading = true; })
      .addCase(toggleMembership.fulfilled, (state, action) => {
        state.actionLoading = false;
        const { id, isMember } = action.payload;
        state.users = state.users.map((u) => (u._id === id ? { ...u, isMember } : u));
      })
      .addCase(toggleMembership.rejected, (state) => { state.actionLoading = false; })

      // Approve Manager
      .addCase(approveManager.pending, (state) => { state.actionLoading = true; })
      .addCase(approveManager.fulfilled, (state, action) => {
        state.actionLoading = false;
        const id = action.payload;
        state.pendingManagers = state.pendingManagers.filter((m) => m._id !== id);
        state.users = state.users.map((u) => (u._id === id ? { ...u, isApproved: true, role: 'manager' } : u));
      })
      .addCase(approveManager.rejected, (state) => { state.actionLoading = false; })

      // Reject Manager
      .addCase(rejectManager.pending, (state) => { state.actionLoading = true; })
      .addCase(rejectManager.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.pendingManagers = state.pendingManagers.filter((m) => m._id !== action.payload);
      })
      .addCase(rejectManager.rejected, (state) => { state.actionLoading = false; })

      // Approve Hotel
      .addCase(approveHotel.pending, (state) => { state.actionLoading = true; })
      .addCase(approveHotel.fulfilled, (state, action) => {
        state.actionLoading = false;
        const id = action.payload;
        state.pendingHotels = state.pendingHotels.filter((h) => h._id !== id);
        state.hotels = state.hotels.map((h) => (h._id === id ? { ...h, status: 'approved' } : h));
      })
      .addCase(approveHotel.rejected, (state) => { state.actionLoading = false; })

      // Reject Hotel
      .addCase(rejectHotel.pending, (state) => { state.actionLoading = true; })
      .addCase(rejectHotel.fulfilled, (state, action) => {
        state.actionLoading = false;
        const id = action.payload;
        const hotelToReject = state.pendingHotels.find(h => h._id === id);
        
        state.pendingHotels = state.pendingHotels.filter((h) => h._id !== id);

        if (hotelToReject && hotelToReject.owner) {
            const ownerId = hotelToReject.owner._id || hotelToReject.owner;
            state.owners = state.owners.map(owner => {
                if (owner.ownerId === ownerId) {
                    return { ...owner, hotels: Math.max(0, owner.hotels - 1) };
                }
                return owner;
            });
        }
      })
      .addCase(rejectHotel.rejected, (state) => { state.actionLoading = false; });
  },
});

export const { clearAdminData } = adminSlice.actions;
export default adminSlice.reducer;
