import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  approveManager,
  rejectManager,
  approveHotel,
  rejectHotel
} from '../../redux/adminSlice';

export const useAdminApprovals = () => {
  const dispatch = useDispatch();
  const { pendingManagers, pendingHotels } = useSelector((state) => state.admin);

  const approveMgr = useCallback((id) => {
    return dispatch(approveManager(id));
  }, [dispatch]);

  const rejectMgr = useCallback((id) => {
    return dispatch(rejectManager(id));
  }, [dispatch]);

  const approveHtl = useCallback((id) => {
    return dispatch(approveHotel(id));
  }, [dispatch]);

  const rejectHtl = useCallback((id) => {
    return dispatch(rejectHotel(id));
  }, [dispatch]);

  return {
    pendingManagers,
    pendingHotels,
    approveMgr,
    rejectMgr,
    approveHtl,
    rejectHtl
  };
};
