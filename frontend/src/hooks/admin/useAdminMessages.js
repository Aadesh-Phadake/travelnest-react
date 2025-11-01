import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchMessages } from '../../redux/admin/messagesSlice';

/**
 * Custom hook for admin contact message management functionality
 *
 * Provides state management for:
 * - Fetching all contact messages from users
 * - Displaying messages for admin review
 *
 * Used in admin components that display and manage user contact messages
 * Note: This hook only provides read access - messages cannot be deleted through this interface
 */
export const useAdminMessages = () => {
    const dispatch = useDispatch();

    // Extract message management state from Redux store
    const { messages, loading, error } = useSelector((state) => state.messages);

    // Fetch messages on component mount
    useEffect(() => {
        dispatch(fetchMessages());
    }, [dispatch]);

    return {
        messages, // Array of contact messages from users (sorted by creation date)
        loading,  // Loading state for message fetching
        error     // Error message if fetching fails
    };
};
