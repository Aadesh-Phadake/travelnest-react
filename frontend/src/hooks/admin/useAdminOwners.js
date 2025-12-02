import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchOwners, deleteOwner } from '../../redux/admin/ownersSlice';

export const useAdminOwners = () => {
    const dispatch = useDispatch();
    const { owners, loading, error } = useSelector((state) => state.owners);

    useEffect(() => {
        dispatch(fetchOwners());
    }, [dispatch]);

    const removeOwner = (id) => {
        if (window.confirm('Are you sure you want to delete this owner? This will also delete all their hotels.')) {
            dispatch(deleteOwner(id));
        }
    };

    return {
        owners,
        loading,
        error,
        removeOwner
    };
};
