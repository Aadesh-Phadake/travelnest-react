import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUsers, deleteUser, toggleMembership } from '../../redux/admin/usersSlice';

export const useAdminUsers = () => {
    const dispatch = useDispatch();
    const { users, loading, error } = useSelector((state) => state.users);

    useEffect(() => {
        dispatch(fetchUsers());
    }, [dispatch]);

    const removeUser = (id) => {
        if (window.confirm('Delete this user and all their bookings?')) {
            dispatch(deleteUser(id));
        }
    };

    const updateMembership = (id, isMember) => {
        dispatch(toggleMembership({ id, isMember }));
    };

    return {
        users,
        loading,
        error,
        removeUser,
        updateMembership
    };
};
