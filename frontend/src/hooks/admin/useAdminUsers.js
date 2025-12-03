import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteUser, toggleMembership } from '../../redux/adminSlice';

export const useAdminUsers = () => {
  const dispatch = useDispatch();
  const { users } = useSelector((state) => state.admin);

  const removeUser = useCallback((id) => {
    return dispatch(deleteUser(id));
  }, [dispatch]);

  const updateMembership = useCallback((id, current) => {
    return dispatch(toggleMembership({ id, current }));
  }, [dispatch]);

  return { users, removeUser, updateMembership };
};
