import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUsers, deleteUser, toggleMembership } from '../../redux/admin/usersSlice';

/**
 * Custom hook for admin user management functionality
 *
 * Provides state management and actions for:
 * - Fetching all users with their roles and membership status
 * - Deleting users (with cascading cleanup of bookings)
 * - Toggling user membership status
 *
 * Used in admin components that need to manage user accounts
 */
export const useAdminUsers = () => {
    const dispatch = useDispatch();

    // Extract user management state from Redux store
    const { users, loading, error } = useSelector((state) => state.users);

    // Fetch users on component mount
    useEffect(() => {
        dispatch(fetchUsers());
    }, [dispatch]);

    /**
     * Removes a user from the system with confirmation
     * @param {string} id - User ID to delete
     * Warning: This also deletes all bookings associated with the user
     */
    const removeUser = (id) => {
        if (window.confirm('Delete this user and all their bookings?')) {
            dispatch(deleteUser(id));
        }
    };

    /**
     * Updates a user's membership status
     * @param {string} id - User ID
     * @param {boolean} isMember - New membership status
     */
    const updateMembership = (id, isMember) => {
        dispatch(toggleMembership({ id, isMember }));
    };

    return {
        users,           // Array of all users with roles and membership info
        loading,         // Loading state for user operations
        error,           // Error message if operations fail
        removeUser,      // Function to delete a user
        updateMembership // Function to toggle membership status
    };
};
