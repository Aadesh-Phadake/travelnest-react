import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUsers } from '../../redux/admin/usersSlice';
import { fetchHotels } from '../../redux/admin/hotelsSlice';
import { fetchOwners } from '../../redux/admin/ownersSlice';
import { fetchPendingApprovals } from '../../redux/admin/approvalsSlice';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export const useAdminDashboard = () => {
    const dispatch = useDispatch();
    const { users } = useSelector((state) => state.users);
    const { hotels } = useSelector((state) => state.hotels);
    const { owners } = useSelector((state) => state.owners);
    const { pendingManagers, pendingHotels } = useSelector((state) => state.approvals);

    const [loading, setLoading] = useState(true);
    const [revenuePeriod, setRevenuePeriod] = useState('month');
    const [revenueSeries, setRevenueSeries] = useState([]);
    const [bookingsPeriod, setBookingsPeriod] = useState('month');
    const [bookingsSeries, setBookingsSeries] = useState([]);
    const [topHotelsSeries, setTopHotelsSeries] = useState([]);
    const [commissionSummary, setCommissionSummary] = useState({
        totalCommission: 0,
        avgCommissionPerBooking: 0,
    });

    // Fetch all data needed for stats
    useEffect(() => {
        dispatch(fetchUsers());
        dispatch(fetchHotels());
        dispatch(fetchOwners());
        dispatch(fetchPendingApprovals());
    }, [dispatch]);

    // Fetch static data (Top Hotels, Commission)
    useEffect(() => {
        const fetchStaticData = async () => {
            try {
                setLoading(true);
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

    // Fetch Revenue Chart
    useEffect(() => {
        const fetchRevenue = async () => {
            try {
                const res = await api.get('/api/admin/charts/revenue', { params: { period: revenuePeriod } });
                setRevenueSeries(res.data?.data || []);
            } catch (error) {
                console.error('Revenue chart fetch error', error);
            }
        };
        fetchRevenue();
    }, [revenuePeriod]);

    // Fetch Bookings Trend
    useEffect(() => {
        const fetchBookingsTrend = async () => {
            try {
                const res = await api.get('/api/admin/charts/bookings-trend', { params: { period: bookingsPeriod } });
                setBookingsSeries(res.data?.data || []);
            } catch (error) {
                console.error('Bookings trend fetch error', error);
            }
        };
        fetchBookingsTrend();
    }, [bookingsPeriod]);

    return {
        users,
        hotels,
        owners,
        pendingManagers,
        pendingHotels,
        loading,
        revenuePeriod,
        setRevenuePeriod,
        revenueSeries,
        bookingsPeriod,
        setBookingsPeriod,
        bookingsSeries,
        topHotelsSeries,
        commissionSummary
    };
};
