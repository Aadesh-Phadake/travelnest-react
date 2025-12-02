import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';
import toast from 'react-hot-toast';

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

const hotelsSlice = createSlice({
    name: 'hotels',
    initialState: {
        hotels: [],
        loading: false,
        error: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
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
            .addCase(deleteHotel.fulfilled, (state, action) => {
                state.hotels = state.hotels.filter(h => h._id !== action.payload);
            })
            // Cross-slice actions
            .addCase('users/deleteUser/fulfilled', (state, action) => {
                state.hotels = state.hotels.filter(h => {
                    const ownerId = h.owner?._id || h.owner;
                    return ownerId !== action.payload;
                });
            })
            .addCase('owners/deleteOwner/fulfilled', (state, action) => {
                state.hotels = state.hotels.filter(h => {
                    const ownerId = h.owner?._id || h.owner;
                    return ownerId !== action.payload;
                });
            });
    }
});

export default hotelsSlice.reducer;
