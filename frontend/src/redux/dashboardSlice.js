import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

// Thunks
export const fetchManagerHotels = createAsyncThunk('dashboard/fetchManagerHotels', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/manager/api/hotels');
    return res.data?.hotels || [];
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load hotels');
  }
});

export const fetchManagerBookings = createAsyncThunk('dashboard/fetchManagerBookings', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/manager/api/bookings');
    return res.data?.bookings || [];
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load bookings');
  }
});

export const fetchManagerChats = createAsyncThunk('dashboard/fetchManagerChats', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/api/chat/manager/all');
    return res.data?.chats || [];
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to load chats');
  }
});

export const fetchUnreadCount = createAsyncThunk('dashboard/fetchUnreadCount', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/api/chat/manager/unread/count');
    return res.data?.unreadCount || 0;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to load unread count');
  }
});

const initialState = {
  properties: [],
  bookings: [],
  chats: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearDashboardError(state) { state.error = null; },
    // Optimistic updates for chats list preview
    appendManagerMessage(state, action) {
      const { chatId, message } = action.payload;
      state.chats = state.chats.map(c => c._id === chatId ? { ...c, messages: [...(c.messages || []), message], lastMessage: message.message, lastMessageTime: new Date().toISOString() } : c);
    },
    setChats(state, action) { state.chats = action.payload || []; },
    updateBookingStatus(state, action) {
      const { bookingId, changes } = action.payload;
      state.bookings = state.bookings.map(b => b._id === bookingId ? { ...b, ...changes } : b);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchManagerHotels.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchManagerHotels.fulfilled, (s, a) => { s.loading = false; s.properties = a.payload; })
      .addCase(fetchManagerHotels.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchManagerBookings.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchManagerBookings.fulfilled, (s, a) => { s.loading = false; s.bookings = a.payload; })
      .addCase(fetchManagerBookings.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchManagerChats.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchManagerChats.fulfilled, (s, a) => { s.loading = false; s.chats = a.payload; })
      .addCase(fetchManagerChats.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchUnreadCount.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchUnreadCount.fulfilled, (s, a) => { s.loading = false; s.unreadCount = a.payload; })
      .addCase(fetchUnreadCount.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
  }
});

export const { clearDashboardError, appendManagerMessage, setChats, updateBookingStatus } = dashboardSlice.actions;
export default dashboardSlice.reducer;
