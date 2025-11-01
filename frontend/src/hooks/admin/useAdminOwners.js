import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchOwners, deleteOwner } from '../../redux/admin/ownersSlice';

/**
 * Custom hook for admin owner/manager management functionality
 *
 * Provides state management and actions for:
 * - Fetching owner statistics (hotels owned, revenue, bookings)
 * - Deleting owners (with cascading cleanup of their hotels)
 *
 * Used in admin components that need to manage hotel owners and view performance metrics
 */
export const useAdminOwners = () => {
    const dispatch = useDispatch();

    // Extract owner management state from Redux store
    const { owners, loading, error } = useSelector((state) => state.owners);

    // Fetch owners on component mount
    useEffect(() => {
        dispatch(fetchOwners());
    }, [dispatch]);

    /**
     * Removes an owner from the system with confirmation
     * @param {string} id - Owner ID to delete
     * Warning: This also deletes all hotels owned by this owner
     */
    const removeOwner = (id) => {
        if (window.confirm('Are you sure you want to delete this owner? This will also delete all their hotels.')) {
            dispatch(deleteOwner(id));
        }
    };

    return {
        owners,     // Array of owners with performance statistics
        loading,    // Loading state for owner operations
        error,      // Error message if operations fail
        removeOwner // Function to delete an owner
    };
};
