import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchHotels, deleteHotel } from '../../redux/admin/hotelsSlice';

/**
 * Custom hook for admin hotel management functionality
 *
 * Provides state management and actions for:
 * - Fetching all hotel listings in the system
 * - Deleting hotels (with cascading cleanup of associated bookings)
 *
 * Used in admin components that need to manage hotel listings
 */
export const useAdminHotels = () => {
    const dispatch = useDispatch();

    // Extract hotel management state from Redux store
    const { hotels, loading, error } = useSelector((state) => state.hotels);

    // Fetch hotels on component mount
    useEffect(() => {
        dispatch(fetchHotels());
    }, [dispatch]);

    /**
     * Removes a hotel from the system with confirmation
     * @param {string} id - Hotel ID to delete
     * Warning: This also deletes all bookings associated with the hotel
     */
    const removeHotel = (id) => {
        if (window.confirm('Are you sure you want to delete this hotel? This action cannot be undone.')) {
            dispatch(deleteHotel(id));
        }
    };

    return {
        hotels,     // Array of all hotel listings
        loading,    // Loading state for hotel operations
        error,      // Error message if operations fail
        removeHotel // Function to delete a hotel
    };
};
