import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAdminDashboardData, clearAdminData } from '../../redux/adminSlice';

export const useAdminDashboard = () => {
  const dispatch = useDispatch();
  const { loading, actionLoading, error } = useSelector((state) => state.admin);

  const loadDashboard = useCallback((params) => {
    dispatch(fetchAdminDashboardData(params));
  }, [dispatch]);

  const resetAdminData = useCallback(() => {
    dispatch(clearAdminData());
  }, [dispatch]);

  return { loading, actionLoading, error, loadDashboard, resetAdminData };
};
