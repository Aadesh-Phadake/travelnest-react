import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteOwner } from '../../redux/adminSlice';

export const useAdminOwners = () => {
  const dispatch = useDispatch();
  const { owners } = useSelector((state) => state.admin);

  const removeOwner = useCallback((id) => {
    return dispatch(deleteOwner(id));
  }, [dispatch]);

  return { owners, removeOwner };
};
