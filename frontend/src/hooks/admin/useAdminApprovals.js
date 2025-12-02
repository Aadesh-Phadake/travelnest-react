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

export const useAdminApprovals = () => {
    const dispatch = useDispatch();
    const { pendingManagers, pendingHotels, loading, error } = useSelector((state) => state.approvals);

    useEffect(() => {
        dispatch(fetchPendingApprovals());
    }, [dispatch]);

    const confirmApproveManager = async (id) => {
        if (window.confirm('Approve this user as a Manager?')) {
            await dispatch(approveManager(id));
            dispatch(fetchOwners());
        }
    };

    const confirmRejectManager = (id) => {
        if (window.confirm('Reject this manager request?')) {
            dispatch(rejectManager(id));
        }
    };

    const confirmApproveHotel = async (id) => {
        if (window.confirm('Approve this hotel listing?')) {
            await dispatch(approveHotel(id));
            dispatch(fetchHotels());
        }
    };

    const confirmRejectHotel = (id) => {
        const reason = window.prompt('Please provide a reason for rejection:', 'Does not meet platform guidelines');
        if (reason !== null) {
            dispatch(rejectHotel({ id, reason }));
        }
    };

    return {
        pendingManagers,
        pendingHotels,
        loading,
        error,
        confirmApproveManager,
        confirmRejectManager,
        confirmApproveHotel,
        confirmRejectHotel
    };
};
