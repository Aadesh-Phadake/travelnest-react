import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    fetchPendingApprovals,
    approveManager,
    rejectManager,
    approveHotel,
    rejectHotel
} from '../../redux/admin/approvalsSlice';
import { fetchHotels } from '../../redux/admin/hotelsSlice';
import { fetchOwners } from '../../redux/admin/ownersSlice';

/**
 * Custom hook for admin approval management functionality
 *
 * Provides state management and actions for:
 * - Fetching pending manager and hotel approvals
 * - Approving/rejecting manager role requests
 * - Approving/rejecting hotel listings
 * - Refreshing related data after approvals
 *
 * Used in admin components that handle the approval workflow
 */
export const useAdminApprovals = () => {
    const dispatch = useDispatch();

    // Extract approval management state from Redux store
    const { pendingManagers, pendingHotels, loading, error } = useSelector((state) => state.approvals);

    // Fetch pending approvals on component mount
    useEffect(() => {
        dispatch(fetchPendingApprovals());
    }, [dispatch]);

    /**
     * Approves a manager role request with confirmation
     * @param {string} id - User ID requesting manager role
     * Grants manager privileges and refreshes owner list
     */
    const confirmApproveManager = async (id) => {
        if (window.confirm('Approve this user as a Manager?')) {
            await dispatch(approveManager(id));
            // Refresh owners list to include newly approved manager
            dispatch(fetchOwners());
        }
    };

    /**
     * Rejects a manager role request with confirmation
     * @param {string} id - User ID whose request is being rejected
     * Demotes user back to traveller role
     */
    const confirmRejectManager = (id) => {
        if (window.confirm('Reject this manager request?')) {
            dispatch(rejectManager(id));
        }
    };

    /**
     * Approves a hotel listing with confirmation
     * @param {string} id - Hotel ID to approve
     * Makes the hotel available for booking and refreshes hotel list
     */
    const confirmApproveHotel = async (id) => {
        if (window.confirm('Approve this hotel listing?')) {
            await dispatch(approveHotel(id));
            // Refresh hotels list to show approved status
            dispatch(fetchHotels());
        }
    };

    /**
     * Rejects a hotel listing with reason prompt
     * @param {string} id - Hotel ID to reject
     * Prompts for rejection reason and sets hotel status to rejected
     */
    const confirmRejectHotel = (id) => {
        const reason = window.prompt('Please provide a reason for rejection:', 'Does not meet platform guidelines');
        if (reason !== null) {
            dispatch(rejectHotel({ id, reason }));
        }
    };

    return {
        pendingManagers,       // Array of users requesting manager approval
        pendingHotels,         // Array of hotels pending approval
        loading,               // Loading state for approval operations
        error,                 // Error message if operations fail
        confirmApproveManager, // Function to approve manager request
        confirmRejectManager,  // Function to reject manager request
        confirmApproveHotel,   // Function to approve hotel listing
        confirmRejectHotel     // Function to reject hotel listing
    };
};
