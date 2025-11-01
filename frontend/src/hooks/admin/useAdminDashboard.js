import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUsers } from '../../redux/admin/usersSlice';
import { fetchHotels } from '../../redux/admin/hotelsSlice';
import { fetchOwners } from '../../redux/admin/ownersSlice';
import { fetchPendingApprovals } from '../../redux/admin/approvalsSlice';
import api from '../../api/axios';
import toast from 'react-hot-toast';

/**
 * Custom hook for admin dashboard functionality
 *
 * Aggregates all admin data and provides comprehensive dashboard statistics including:
 * - User, hotel, and owner counts
 * - Pending approvals overview
 * - Revenue and booking trend charts
 * - Top performing hotels
 * - Commission summaries
 *
 * Manages multiple API calls and state synchronization for the admin dashboard
 */
export const useAdminDashboard = () => {
    const dispatch = useDispatch();

    // Extract data from various Redux slices for dashboard overview
    const { users } = useSelector((state) => state.users);
    const { hotels } = useSelector((state) => state.hotels);
    const { owners } = useSelector((state) => state.owners);
    const { pendingManagers, pendingHotels } = useSelector((state) => state.approvals);

    // Local state for dashboard-specific data and loading states
    const [loading, setLoading] = useState(true);

    // Revenue chart state and controls
    const [revenuePeriod, setRevenuePeriod] = useState('month'); // 'week', 'month', 'year'
    const [revenueSeries, setRevenueSeries] = useState([]);

    // Bookings trend chart state and controls
    const [bookingsPeriod, setBookingsPeriod] = useState('month'); // 'week', 'month', 'year'
    const [bookingsSeries, setBookingsSeries] = useState([]);

    // Static dashboard data (doesn't change with time filters)
    const [topHotelsSeries, setTopHotelsSeries] = useState([]);
    const [commissionSummary, setCommissionSummary] = useState({
        totalCommission: 0,
        avgCommissionPerBooking: 0,
    });

    // Fetch all Redux-managed data on component mount
    useEffect(() => {
        dispatch(fetchUsers());
        dispatch(fetchHotels());
        dispatch(fetchOwners());
        dispatch(fetchPendingApprovals());
    }, [dispatch]);

    // Fetch static dashboard data (top hotels and commission summary)
    useEffect(() => {
        const fetchStaticData = async () => {
            try {
                setLoading(true);
                // Parallel API calls for better performance
                const [topHotelsRes, commissionSummaryRes] = await Promise.all([
                    api.get('/api/admin/charts/top-hotels'),
                    api.get('/api/admin/commission/summary'),
                ]);

                setTopHotelsSeries(topHotelsRes.data?.data || []);
                setCommissionSummary(commissionSummaryRes.data?.summary || {
                    totalCommission: 0,
                    avgCommissionPerBooking: 0,
                });
            } catch (error) {
                console.error('Admin static data fetch error', error);
                toast.error('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchStaticData();
    }, []);

    // Fetch revenue chart data when period changes
    useEffect(() => {
        const fetchRevenue = async () => {
            try {
                const res = await api.get('/api/admin/charts/revenue', {
                    params: { period: revenuePeriod }
                });
                setRevenueSeries(res.data?.data || []);
            } catch (error) {
                console.error('Revenue chart fetch error', error);
            }
        };
        fetchRevenue();
    }, [revenuePeriod]);

    // Fetch bookings trend data when period changes
    useEffect(() => {
        const fetchBookingsTrend = async () => {
            try {
                const res = await api.get('/api/admin/charts/bookings-trend', {
                    params: { period: bookingsPeriod }
                });
                setBookingsSeries(res.data?.data || []);
            } catch (error) {
                console.error('Bookings trend fetch error', error);
            }
        };
        fetchBookingsTrend();
    }, [bookingsPeriod]);

    return {
        // Redux-managed data
        users,              // All users for user count
        hotels,             // All hotels for hotel count
        owners,             // All owners for owner statistics
        pendingManagers,    // Pending manager approvals count
        pendingHotels,      // Pending hotel approvals count

        // Loading states
        loading,            // Overall dashboard loading state

        // Revenue chart data and controls
        revenuePeriod,      // Current revenue chart period
        setRevenuePeriod,   // Function to change revenue period
        revenueSeries,      // Revenue chart data points

        // Bookings chart data and controls
        bookingsPeriod,     // Current bookings chart period
        setBookingsPeriod,  // Function to change bookings period
        bookingsSeries,     // Bookings trend data points

        // Static dashboard data
        topHotelsSeries,    // Top performing hotels data
        commissionSummary   // Platform commission statistics
    };
};
