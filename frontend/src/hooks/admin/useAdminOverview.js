import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRevenueChart, fetchBookingsChart } from '../../redux/adminSlice';

export const useAdminOverview = () => {
  const dispatch = useDispatch();
  const {
    users,
    hotels,
    owners,
    pendingManagers,
    pendingHotels,
    stats
  } = useSelector((state) => state.admin);

  const loadRevenueChart = useCallback((period) => {
    dispatch(fetchRevenueChart(period));
  }, [dispatch]);

  const loadBookingsChart = useCallback((period) => {
    dispatch(fetchBookingsChart(period));
  }, [dispatch]);

  return {
    users,
    hotels,
    owners,
    pendingManagers,
    pendingHotels,
    stats,
    loadRevenueChart,
    loadBookingsChart
  };
};
