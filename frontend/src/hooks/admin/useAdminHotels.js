import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteHotel } from '../../redux/adminSlice';

export const useAdminHotels = () => {
  const dispatch = useDispatch();
  const { hotels } = useSelector((state) => state.admin);

  const removeHotel = useCallback((id) => {
    return dispatch(deleteHotel(id));
  }, [dispatch]);

  return { hotels, removeHotel };
};
