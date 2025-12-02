import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  Users,
  Building2,
  DollarSign,
  BarChart3,
  Trash2,
  ShieldCheck,
  ShieldX,
  Loader2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview'); // overview | users | hotels | approvals

  const [usersData, setUsersData] = useState([]);
  const [ownersData, setOwnersData] = useState([]);
  const [hotelsData, setHotelsData] = useState([]);

  const [revenuePeriod, setRevenuePeriod] = useState('month'); // day | week | month | year
  const [revenueSeries, setRevenueSeries] = useState([]);
  const [bookingsPeriod, setBookingsPeriod] = useState('month');
  const [bookingsSeries, setBookingsSeries] = useState([]);
  const [topHotelsSeries, setTopHotelsSeries] = useState([]);

  const [pendingManagers, setPendingManagers] = useState([]);
  const [pendingHotels, setPendingHotels] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);

  const [commissionSummary, setCommissionSummary] = useState({
    totalCommission: 0,
    avgCommissionPerBooking: 0,
  });

  const [isActionLoading, setIsActionLoading] = useState(false);

  const isAdmin = user && (user.role === 'admin' || user.username === 'TravelNest');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!isAdmin) {
      return;
    }

    const fetchAll = async () => {
      try {
        setLoading(true);

        const [
          usersRes,
          hotelsRes,
          ownersRes,
          revenueRes,
          topHotelsRes,
          bookingsTrendRes,
          pendingManagersRes,
          pendingHotelsRes,
          commissionSummaryRes,
          contactMessagesRes,
        ] = await Promise.all([
          api.get('/api/admin/users'),
          api.get('/api/admin/hotels'),
          api.get('/api/admin/owners'),
          api.get('/api/admin/charts/revenue', { params: { period: revenuePeriod } }),
          api.get('/api/admin/charts/top-hotels'),
          api.get('/api/admin/charts/bookings-trend', { params: { period: bookingsPeriod } }),
          api.get('/api/admin/managers/pending'),
          api.get('/api/admin/hotels/pending'),
          api.get('/api/admin/commission/summary'),
          api.get('/api/admin/contact-messages'),
        ]);

        setUsersData(usersRes.data?.users || []);
        setHotelsData(hotelsRes.data?.hotels || []);
        setOwnersData(ownersRes.data?.owners || []);
        setRevenueSeries(revenueRes.data?.data || []);
        setTopHotelsSeries(topHotelsRes.data?.data || []);
        setBookingsSeries(bookingsTrendRes.data?.data || []);
        setPendingManagers(pendingManagersRes.data?.managers || []);
        setPendingHotels(pendingHotelsRes.data?.hotels || []);
        setCommissionSummary(commissionSummaryRes.data?.summary || {
          totalCommission: 0,
          avgCommissionPerBooking: 0,
        });
        setContactMessages(contactMessagesRes.data?.messages || []);
      } catch (error) {
        console.error('Admin dashboard fetch error', error);
        if (error.response?.status === 401) {
          toast.error('Please login again as admin');
          navigate('/login');
        } else if (error.response?.status === 403) {
          toast.error('Access denied');
        } else {
          toast.error('Failed to load admin dashboard');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin]);

  // Refetch when period changes
  useEffect(() => {
    if (!isAdmin) return;

    const fetchCharts = async () => {
      try {
        const [revenueRes, bookingsTrendRes] = await Promise.all([
          api.get('/api/admin/charts/revenue', { params: { period: revenuePeriod } }),
          api.get('/api/admin/charts/bookings-trend', { params: { period: bookingsPeriod } }),
        ]);
        setRevenueSeries(revenueRes.data?.data || []);
        setBookingsSeries(bookingsTrendRes.data?.data || []);
      } catch (error) {
        console.error('Error refetching chart data', error);
      }
    };

    fetchCharts();
  }, [revenuePeriod, bookingsPeriod, isAdmin]);

  const totalUsers = usersData.length;
  const totalHotels = hotelsData.length;
  // Gross booking revenue (what travellers paid). Prefer backend summary, fallback to hotel aggregation.
  const grossRevenue =
    commissionSummary.totalRevenue ??
    hotelsData.reduce((sum, h) => sum + (h.revenue || 0), 0);
  const totalBookings = hotelsData.reduce((sum, h) => sum + (h.bookingCount || 0), 0);
  const totalCommission = commissionSummary.totalCommission || 0;

  // Owner share (what hotels earn before paying platform commission-on-revenue)
  const ownerGrossRevenue = Math.max(0, grossRevenue - totalCommission);
  // Platform also takes 15% of owner gross revenue
  const OWNER_REVENUE_RATE = 0.15;
  const ownerCommission = ownerGrossRevenue * OWNER_REVENUE_RATE;
  // Final platform revenue = service fee (platformCommission) + 15% of owner revenue
  const platformRevenue = totalCommission + ownerCommission;

  const totalPending = pendingManagers.length + pendingHotels.length;

  const formatDateDisplay = (raw) => {
    if (!raw) return null;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-GB');
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user and all their bookings?')) return;

    try {
      setIsActionLoading(true);
      await api.delete(`/api/admin/users/${id}`);
      setUsersData((prev) => prev.filter((u) => u._id !== id));
      toast.success('User deleted');
    } catch (error) {
      console.error('Delete user error', error);
      toast.error('Failed to delete user');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteOwner = async (id) => {
    if (!window.confirm('Delete this owner and all their hotels/bookings?')) return;

    try {
      setIsActionLoading(true);
      await api.delete(`/api/admin/users/${id}`);
      
      setOwnersData((prev) => prev.filter((o) => o.ownerId !== id));
      setUsersData((prev) => prev.filter((u) => u._id !== id));
      
      // Also remove their hotels from the view
      setHotelsData((prev) => prev.filter((h) => {
          const ownerId = h.owner?._id || h.owner;
          return ownerId !== id;
      }));
      
      setPendingHotels((prev) => prev.filter((h) => {
          const ownerId = h.owner?._id || h.owner;
          return ownerId !== id;
      }));

      toast.success('Owner deleted');
    } catch (error) {
      console.error('Delete owner error', error);
      toast.error('Failed to delete owner');
    } finally {
      setIsActionLoading(false);
    }
  };
  // handled togglemembership
  
  const handleToggleMembership = async (id, current) => {
    try {
      setIsActionLoading(true);
      await api.patch(`/api/admin/users/${id}/membership`, { isMember: !current });
      setUsersData((prev) =>
        prev.map((u) => (u._id === id ? { ...u, isMember: !current } : u))
      );
      toast.success('Membership updated');
    } catch (error) {
      console.error('Membership update error', error);
      toast.error('Failed to update membership');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteHotel = async (id) => {
    if (!window.confirm('Delete this hotel permanently?')) return;
    try {
      setIsActionLoading(true);
      
      // Find the hotel to get the owner ID before deleting
      const hotelToDelete = hotelsData.find(h => h._id === id);

      await api.delete(`/api/admin/hotels/${id}`);
      
      setHotelsData((prev) => prev.filter((h) => h._id !== id));
      setPendingHotels((prev) => prev.filter((h) => h._id !== id));

      // Update owner's hotel count if we found the hotel
      if (hotelToDelete && hotelToDelete.owner) {
          const ownerId = hotelToDelete.owner._id || hotelToDelete.owner; // Handle populated object or ID string
          setOwnersData(prev => prev.map(owner => {
              if (owner.ownerId === ownerId) {
                  return { ...owner, hotels: Math.max(0, owner.hotels - 1) };
              }
              return owner;
          }));
      }

      toast.success('Hotel deleted');
    } catch (error) {
      console.error('Delete hotel error', error);
      toast.error('Failed to delete hotel');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleApproveManager = async (id) => {
    try {
      setIsActionLoading(true);
      await api.patch(`/api/admin/managers/${id}/approve`);
      setPendingManagers((prev) => prev.filter((m) => m._id !== id));
      // Also update users table if that manager is loaded there
      setUsersData((prev) =>
        prev.map((u) => (u._id === id ? { ...u, isApproved: true, role: 'manager' } : u)),
      );
      toast.success('Manager approved');
    } catch (error) {
      console.error('Approve manager error', error);
      toast.error('Failed to approve manager');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectManager = async (id) => {
    if (!window.confirm('Reject this manager request?')) return;
    try {
      setIsActionLoading(true);
      await api.patch(`/api/admin/managers/${id}/reject`);
      setPendingManagers((prev) => prev.filter((m) => m._id !== id));
      toast.success('Manager request rejected');
    } catch (error) {
      console.error('Reject manager error', error);
      toast.error('Failed to reject manager');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleApproveHotel = async (id) => {
    try {
      setIsActionLoading(true);
      await api.patch(`/api/admin/hotels/${id}/approve`);
      setPendingHotels((prev) => prev.filter((h) => h._id !== id));
      // Optionally reflect in hotelsData if already loaded there
      setHotelsData((prev) =>
        prev.map((h) => (h._id === id ? { ...h, status: 'approved' } : h)),
      );
      toast.success('Hotel approved');
    } catch (error) {
      console.error('Approve hotel error', error);
      toast.error('Failed to approve hotel');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectHotel = async (id) => {
    if (!window.confirm('Reject this hotel listing?')) return;
    try {
      setIsActionLoading(true);
      
      // Find the hotel to get the owner ID
      const hotelToReject = pendingHotels.find(h => h._id === id);

      await api.patch(`/api/admin/hotels/${id}/reject`);
      setPendingHotels((prev) => prev.filter((h) => h._id !== id));

      // Update owner's hotel count
      if (hotelToReject && hotelToReject.owner) {
          const ownerId = hotelToReject.owner._id || hotelToReject.owner;
          setOwnersData(prev => prev.map(owner => {
              if (owner.ownerId === ownerId) {
                  return { ...owner, hotels: Math.max(0, owner.hotels - 1) };
              }
              return owner;
          }));
      }

      toast.success('Hotel rejected');
    } catch (error) {
      console.error('Reject hotel error', error);
      toast.error('Failed to reject hotel');
    } finally {
      setIsActionLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center max-w-md shadow-sm">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚫</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Admin access only
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You must be logged in as an admin (or TravelNest master account) to view this
            dashboard.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition"
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const MetricCard = ({ icon: Icon, label, value, sub }) => (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 flex flex-col gap-2 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {label}
        </p>
        <span className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {value}
      </p>
      {sub && <p className="text-xs text-gray-500 dark:text-gray-400">{sub}</p>}
    </div>
  );

  const PeriodPills = ({ value, onChange }) => {
    const options = [
      { value: 'day', label: 'Daily' },
      { value: 'week', label: 'Weekly' },
      { value: 'month', label: 'Monthly' },
      { value: 'year', label: 'Yearly' },
    ];
    return (
      <div className="inline-flex rounded-full bg-gray-100 dark:bg-gray-800 p-1 text-xs">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1 rounded-full font-medium transition text-xs ${
              value === opt.value
                ? 'bg-white dark:bg-gray-900 text-primary shadow-sm'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-[80vh] bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-1">
              Super Admin
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-50">
              Control Center
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
              Monitor users, properties and global performance of TravelNest.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isActionLoading && (
              <span className="flex items-center gap-2 text-xs text-gray-500">
                <Loader2 className="w-3 h-3 animate-spin" /> Applying changes...
              </span>
            )}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-xs text-gray-600 dark:text-gray-200 flex flex-col">
              <span className="font-semibold">{user?.username}</span>
              <span className="text-[11px] text-gray-500">{user?.email}</span>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 flex gap-4 text-sm font-medium">
          <button
            onClick={() => setTab('overview')}
            className={`pb-3 px-1 -mb-px border-b-2 transition ${
              tab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setTab('users')}
            className={`pb-3 px-1 -mb-px border-b-2 transition ${
              tab === 'users'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setTab('hotels')}
            className={`pb-3 px-1 -mb-px border-b-2 transition ${
              tab === 'hotels'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Hotels
          </button>
          <button
            onClick={() => setTab('owners')}
            className={`pb-3 px-1 -mb-px border-b-2 transition ${
              tab === 'owners'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Owners
          </button>
          <button
            onClick={() => setTab('approvals')}
            className={`pb-3 px-1 -mb-px border-b-2 transition ${
              tab === 'approvals'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Approvals
          </button>
          <button
            onClick={() => setTab('messages')}
            className={`pb-3 px-1 -mb-px border-b-2 transition ${
              tab === 'messages'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Messages
          </button>
        </div>

        {tab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Platform Revenue */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Revenue</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                      ₹{platformRevenue.toLocaleString('en-IN')}
                    </h3>
                  </div>
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs text-gray-500">
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    +15% <span className="text-gray-400">service fee</span>
                  </span>
                </div>
              </div>

              {/* Gross Booking Value */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Gross Bookings</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                      ₹{grossRevenue.toLocaleString('en-IN')}
                    </h3>
                  </div>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  Total value of all bookings
                </div>
              </div>

              {/* Total Bookings */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Bookings</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                      {totalBookings.toLocaleString('en-IN')}
                    </h3>
                  </div>
                  <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg text-violet-600 dark:text-violet-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  Across {totalHotels} listed hotels
                </div>
              </div>

              {/* Pending Actions */}
              <div 
                onClick={() => setTab('approvals')}
                className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between cursor-pointer hover:border-primary/50 transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Actions</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                      {totalPending}
                    </h3>
                  </div>
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400 group-hover:bg-amber-200 transition-colors">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-amber-600 font-medium">
                  {pendingManagers.length} managers, {pendingHotels.length} hotels
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Revenue Chart (2/3 width) */}
              <div className="lg:col-span-2 space-y-6">
                <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Revenue Analytics</h2>
                      <p className="text-sm text-gray-500">Platform earnings vs Total transaction volume</p>
                    </div>
                    <PeriodPills value={revenuePeriod} onChange={setRevenuePeriod} />
                  </div>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={revenueSeries.map((p) => {
                          const ownerGross = Math.max(0, (p.revenue || 0) - (p.commission || 0));
                          const ownerCommission = ownerGross * 0.15;
                          const platformRevenuePeriod = (p.commission || 0) + ownerCommission;
                          return {
                            ...p,
                            platformRevenue: platformRevenuePeriod,
                          };
                        })}
                        margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`}
                          dx={-10}
                        />
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(value, name) => [
                            `₹${value.toLocaleString('en-IN')}`,
                            name === 'platformRevenue' ? 'Net Revenue' : 'Gross Volume',
                          ]}
                        />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          name="revenue"
                          stroke="#94a3b8"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="platformRevenue"
                          name="platformRevenue"
                          stroke="#0ea5e9"
                          strokeWidth={3}
                          dot={false}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Booking Trends</h2>
                      <p className="text-sm text-gray-500">Number of reservations over time</p>
                    </div>
                    <PeriodPills value={bookingsPeriod} onChange={setBookingsPeriod} />
                  </div>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={bookingsSeries} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          tickLine={false}
                          axisLine={false}
                          dx={-10}
                        />
                        <Tooltip 
                          cursor={{ fill: '#f3f4f6' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="bookings" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              </div>

              {/* Right Column: Top Hotels & Quick Actions (1/3 width) */}
              <div className="space-y-6">
                {/* Top Performing Hotels */}
                <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm h-full">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Top Performers</h2>
                  <div className="space-y-6">
                    {topHotelsSeries.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No data available yet.</p>
                    )}
                    {topHotelsSeries.map((h, i) => (
                      <div key={h.name} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          i === 0 ? 'bg-yellow-100 text-yellow-700' : 
                          i === 1 ? 'bg-gray-100 text-gray-700' : 
                          i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-600'
                        }`}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {h.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {h.bookings} bookings
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            ₹{(h.revenue || 0).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => setTab('hotels')}
                    className="w-full mt-6 py-2 text-sm text-primary font-medium hover:bg-primary/5 rounded-lg transition-colors"
                  >
                    View all hotels
                  </button>
                </section>

                {/* Quick Stats / Distribution */}
                <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">User Distribution</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Travellers
                      </span>
                      <span className="font-semibold">{usersData.filter(u => u.role !== 'manager' && u.role !== 'admin').length}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${(usersData.filter(u => u.role !== 'manager').length / (usersData.length || 1)) * 100}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-sm pt-2">
                      <span className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                        <Building2 className="w-4 h-4" /> Managers
                      </span>
                      <span className="font-semibold">{ownersData.length}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full" 
                        style={{ width: `${(ownersData.length / (usersData.length || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Users
                </h2>
                <p className="text-xs text-gray-500">
                  Manage travellers and memberships. TravelNest master is hidden.
                </p>
              </div>
              <span className="text-[11px] text-gray-500">
                {totalUsers} users
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-500">
                  <tr className="text-left">
                    <th className="px-4 py-2 font-semibold">User</th>
                    <th className="px-4 py-2 font-semibold">Bookings</th>
                    <th className="px-4 py-2 font-semibold">Total spent</th>
                    <th className="px-4 py-2 font-semibold">Last booking</th>
                    <th className="px-4 py-2 font-semibold">Member</th>
                    <th className="px-4 py-2 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {usersData.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/40">
                      <td className="px-4 py-2">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {u.username}
                          </span>
                          <span className="text-[11px] text-gray-500">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                        {u.totalBookings || 0}
                      </td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                        ₹{(u.totalSpent || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-2 text-gray-500">
                        {u.lastBooking
                          ? new Date(u.lastBooking).toLocaleDateString('en-GB')
                          : '—'}
                      </td>
                      <td className="px-4 py-2">
                        {u.isMember ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                            <ShieldX className="w-3 h-3" /> None
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleToggleMembership(u._id, u.isMember)}
                            className="px-3 py-1 rounded-full text-[11px] font-medium border border-primary/30 text-primary hover:bg-primary/5 transition"
                          >
                            {u.isMember ? 'Remove' : 'Make member'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="p-1.5 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {usersData.length === 0 && (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-4 py-8 text-center text-xs text-gray-500"
                      >
                        No users yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'hotels' && (
          <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Hotels
                </h2>
                <p className="text-xs text-gray-500">
                  Global view of all listings created on the platform.
                </p>
              </div>
              <span className="text-[11px] text-gray-500">
                {totalHotels} hotels
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-500">
                  <tr className="text-left">
                    <th className="px-4 py-2 font-semibold">Hotel</th>
                    <th className="px-4 py-2 font-semibold">Location</th>
                    <th className="px-4 py-2 font-semibold">Owner</th>
                    <th className="px-4 py-2 font-semibold">Bookings</th>
                    <th className="px-4 py-2 font-semibold">Revenue</th>
                    <th className="px-4 py-2 font-semibold">Platform Revenue</th>
                    <th className="px-4 py-2 font-semibold">Created</th>
                    <th className="px-4 py-2 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {hotelsData.map((h) => (
                    <tr key={h._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/40">
                      <td className="px-4 py-2">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {h.title}
                          </span>
                          <span className="text-[11px] text-gray-500 truncate max-w-[220px]">
                            {h._id}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                        {h.location}, {h.country}
                      </td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                        {h.owner?.username || '—'}
                      </td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                        {h.bookingCount || 0}
                      </td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                        ₹{(h.revenue || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                        ₹{(h.platformRevenue || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-2 text-gray-500">
                        {formatDateDisplay(h.createdAt || h.lastUpdated) || '—'}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => handleDeleteHotel(h._id)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium text-red-500 border border-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {hotelsData.length === 0 && (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-4 py-8 text-center text-xs text-gray-500"
                      >
                        No hotels yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'owners' && (
          <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Hotel Owners
                </h2>
                <p className="text-xs text-gray-500">
                  Aggregated performance and contribution of each owner to platform revenue.
                </p>
              </div>
              <span className="text-[11px] text-gray-500">
                {ownersData.length} owners
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-500">
                  <tr className="text-left">
                    <th className="px-4 py-2 font-semibold">Owner</th>
                    <th className="px-4 py-2 font-semibold">Hotels</th>
                    <th className="px-4 py-2 font-semibold">Bookings</th>
                    <th className="px-4 py-2 font-semibold">Guest Revenue</th>
                    <th className="px-4 py-2 font-semibold">Service Fee</th>
                    <th className="px-4 py-2 font-semibold">15% Owner Share</th>
                    <th className="px-4 py-2 font-semibold">Platform Revenue</th>
                    <th className="px-4 py-2 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {ownersData.map((o) => (
                    <tr key={o.ownerId} className="hover:bg-gray-50 dark:hover:bg-gray-900/40">
                      <td className="px-4 py-2">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {o.username}
                          </span>
                          <span className="text-[11px] text-gray-500">{o.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                        {o.hotels || 0}
                      </td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                        {o.totalBookings || 0}
                      </td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                        ₹{(o.grossRevenue || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                        ₹{(o.commission || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                        ₹{(o.ownerCommission || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                        ₹{(o.platformRevenue || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => handleDeleteOwner(o.ownerId)}
                          className="p-1.5 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {ownersData.length === 0 && (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-4 py-8 text-center text-xs text-gray-500"
                      >
                        No owners found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'approvals' && (
          <section className="space-y-6">
            {/* Pending Manager Approvals */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Pending Manager Approvals
                  </h2>
                  <p className="text-xs text-gray-500">
                    Approve hotel managers before they can list and manage properties.
                  </p>
                </div>
                <span className="text-[11px] text-gray-500">
                  {pendingManagers.length} pending
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-500">
                    <tr className="text-left">
                      <th className="px-4 py-2 font-semibold">Manager</th>
                      <th className="px-4 py-2 font-semibold">Email</th>
                      <th className="px-4 py-2 font-semibold">Requested at</th>
                      <th className="px-4 py-2 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {pendingManagers.map((m) => (
                      <tr key={m._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/40">
                        <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                          {m.username}
                        </td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                          {m.email}
                        </td>
                        <td className="px-4 py-2 text-gray-500">
                          {m.createdAt
                            ? new Date(m.createdAt).toLocaleDateString('en-GB')
                            : '—'}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleApproveManager(m._id)}
                              className="px-3 py-1 rounded-full text-[11px] font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectManager(m._id)}
                              className="px-3 py-1 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 transition"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {pendingManagers.length === 0 && (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-4 py-8 text-center text-xs text-gray-500"
                        >
                          No pending manager requests.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pending Hotel Approvals */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Pending Hotel Approvals
                  </h2>
                  <p className="text-xs text-gray-500">
                    Review and approve hotel listings submitted by managers.
                  </p>
                </div>
                <span className="text-[11px] text-gray-500">
                  {pendingHotels.length} pending
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-500">
                    <tr className="text-left">
                      <th className="px-4 py-2 font-semibold">Hotel</th>
                      <th className="px-4 py-2 font-semibold">Location</th>
                      <th className="px-4 py-2 font-semibold">Manager</th>
                      <th className="px-4 py-2 font-semibold">Submitted at</th>
                      <th className="px-4 py-2 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {pendingHotels.map((h) => (
                      <tr key={h._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/40">
                        <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                          {h.title}
                        </td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                          {h.location}, {h.country}
                        </td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                          {h.owner?.username || '—'}
                        </td>
                        <td className="px-4 py-2 text-gray-500">
                          {h.createdAt
                            ? new Date(h.createdAt).toLocaleDateString('en-GB')
                            : '—'}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleApproveHotel(h._id)}
                              className="px-3 py-1 rounded-full text-[11px] font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectHotel(h._id)}
                              className="px-3 py-1 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 transition"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {pendingHotels.length === 0 && (
                      <tr>
                        <td
                          colSpan="5"
                          className="px-4 py-8 text-center text-xs text-gray-500"
                        >
                          No pending hotel approvals.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
        {tab === 'messages' && (
          <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Contact Messages
                </h2>
                <p className="text-xs text-gray-500">
                  Messages sent via the Contact Us page.
                </p>
              </div>
              <span className="text-[11px] text-gray-500">
                {contactMessages.length} messages
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-500">
                  <tr className="text-left">
                    <th className="px-4 py-2 font-semibold">Name</th>
                    <th className="px-4 py-2 font-semibold">Email</th>
                    <th className="px-4 py-2 font-semibold">Subject</th>
                    <th className="px-4 py-2 font-semibold">Message</th>
                    <th className="px-4 py-2 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {contactMessages.map((msg) => (
                    <tr key={msg._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/40">
                      <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">
                        {msg.name}
                      </td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                        {msg.email}
                      </td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                        {msg.subject || '—'}
                      </td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-200 max-w-xs truncate" title={msg.message}>
                        {msg.message}
                      </td>
                      <td className="px-4 py-2 text-gray-500">
                        {msg.createdAt
                          ? new Date(msg.createdAt).toLocaleDateString('en-GB')
                          : '—'}
                      </td>
                    </tr>
                  ))}
                  {contactMessages.length === 0 && (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-4 py-8 text-center text-xs text-gray-500"
                      >
                        No messages yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;