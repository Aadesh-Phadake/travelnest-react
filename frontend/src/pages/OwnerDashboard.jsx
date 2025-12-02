//imported required modules 
import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
    Home, 
    DollarSign, 
    ArrowLeft, 
    Building2,
    Clock
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

//owner dashboard
const OwnerDashboard = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const [properties, setProperties] = useState([]);
    //bookings
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('properties');
    const [accessError, setAccessError] = useState(null);
    
    // Revenue filter states
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [filteredRevenue, setFilteredRevenue] = useState(null);
   //used useEffect for side tracks 
    useEffect(() => {
        // Check if user is logged in
        if (!user) {
            navigate('/login');
            return;
        }
        
        // Check if user is a manager
        if (user.role !== 'manager' && user.role !== 'admin') {
            setAccessError('Access denied. Only managers can view this dashboard.');
            setLoading(false);
            return;
        }

        // Check if manager is approved
        if (user.role === 'manager' && !user.isApproved) {
            setAccessError('Your manager account is currently pending approval from an administrator. You will be able to access the dashboard once approved.');
            setLoading(false);
            return;
        }

        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                
                // Fetch manager's hotels
                const hotelsRes = await api.get('/manager/api/hotels');
                setProperties(hotelsRes.data?.hotels || []);

                // Fetch bookings for manager's hotels
                const bookingsRes = await api.get('/manager/api/bookings');
                setBookings(bookingsRes.data?.bookings || []);
            } catch (error) {
                console.error('Dashboard fetch error:', error);
                if (error.response?.status === 401) {
                    toast.error("Please login to access the dashboard");
                    navigate('/login');
                } else if (error.response?.status === 403) {
                    // Use the specific message from backend if available
                    setAccessError(error.response?.data?.message || 'Access denied.');
                } else {
                    toast.error("Failed to load dashboard data");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user, navigate]);

    // Filter properties
    const activeProperties = properties.filter(p => !p.status || p.status === 'approved');
    const pendingProperties = properties.filter(p => p.status === 'pending');
    const rejectedProperties = properties.filter(p => p.status === 'rejected');

    // Calculate statistics
    const totalProperties = activeProperties.length;
    
    // Today's date for calculations
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Revenue Today
    const revenueToday = bookings.filter(b => {
        const bookingDate = new Date(b.createdAt);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        return bookingDate >= todayStart && bookingDate <= todayEnd;
    }).reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    // Revenue This Month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const revenueMonth = bookings.filter(b => {
        return new Date(b.createdAt) >= startOfMonth;
    }).reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    // Total Revenue
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    // Total Rooms across all properties
    const totalRooms = activeProperties.reduce((sum, p) => {
        const rooms = p.rooms || 
            ((p.roomTypes?.single || 0) + (p.roomTypes?.double || 0) + (p.roomTypes?.triple || 0));
        return sum + rooms;
    }, 0);
    
    // Occupied Rooms (active bookings where checkIn <= today && checkOut > today)
    const occupiedRooms = bookings.filter(b => {
        const checkIn = new Date(b.checkIn);
        const checkOut = new Date(b.checkOut);
        checkIn.setHours(0, 0, 0, 0);
        checkOut.setHours(0, 0, 0, 0);
        return checkIn <= today && checkOut > today;
    }).reduce((sum, b) => {
        // Count rooms from roomAllocation or default to 1
        if (b.roomAllocation) {
            return sum + (b.roomAllocation.single || 0) + (b.roomAllocation.double || 0) + (b.roomAllocation.triple || 0);
        }
        return sum + 1;
    }, 0);
    
    // Occupancy Rate
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    // Get occupied rooms for a specific property
    const getOccupiedRoomsForProperty = (propertyId) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        return bookings.filter(b => {
            // Get listing ID (handles both populated and non-populated)
            const listingId = b.listing?._id || b.listing;
            if (String(listingId) !== String(propertyId)) return false;
            
            const checkIn = new Date(b.checkIn);
            const checkOut = new Date(b.checkOut);
            checkIn.setHours(0, 0, 0, 0);
            checkOut.setHours(0, 0, 0, 0);
            return checkIn <= now && checkOut > now;
        }).reduce((sum, b) => {
            if (b.roomAllocation) {
                return sum + (b.roomAllocation.single || 0) + (b.roomAllocation.double || 0) + (b.roomAllocation.triple || 0);
            }
            return sum + 1;
        }, 0);
    };

    // Apply date filter for revenue
    const handleApplyFilter = () => {
        if (!fromDate || !toDate) {
            toast.error("Please select both dates");
            return;
        }
        
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);

        if (from > to) {
            toast.error("'From' date cannot be after 'To' date");
            return;
        }

        const filtered = bookings.filter(b => {
            const bookingDate = new Date(b.createdAt);
            return bookingDate >= from && bookingDate <= to;
        }).reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        
        setFilteredRevenue(filtered);
    };

    // Reset filter
    const handleResetFilter = () => {
        setFromDate('');
        setToDate('');
        setFilteredRevenue(null);
    };

    // Chart data - Last 7 days revenue
    const getChartData = () => {
        const data = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            
            const nextDate = new Date(date);
            nextDate.setHours(23, 59, 59, 999);
            
            // Format date
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            const dayRevenue = bookings.filter(b => {
                const bookingDate = new Date(b.createdAt);
                return bookingDate >= date && bookingDate <= nextDate;
            }).reduce((sum, b) => sum + (b.totalAmount || 0), 0);

            data.push({ date: dateStr, revenue: dayRevenue });
        }
        return data;
    };

    const chartData = getChartData();

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Access denied state
    if (accessError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center max-w-md">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🚫</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-6">{accessError}</p>
                    <button 
                        onClick={() => navigate('/')}
                        className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-2 rounded-lg transition"
                    >
                        Go to Homepage
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto">
                
                {/* Header Row */}
                <div className="flex items-center justify-between mb-8">
                    <button 
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium px-4 py-2 rounded-lg border border-primary/30 hover:bg-primary/5 transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                    
                    <h1 className="text-2xl font-bold text-gray-900">Owner Dashboard</h1>
                    
                    <div className="bg-white text-orange-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200">
                        👋 Welcome back, <span className="text-primary font-semibold">{user?.username || 'Manager'}!</span>
                    </div>
                </div>

                {/* Profile Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 mb-8">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        {/* Avatar */}
                        <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center text-primary text-3xl font-bold">
                            {user?.username?.charAt(0)?.toUpperCase() || 'M'}
                        </div>
                        
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-2xl font-bold text-gray-900">{user?.username || 'Manager'}</h2>
                            <p className="text-gray-500">{user?.email || ''}</p>
                            
                            <div className="pt-3 flex flex-wrap justify-center md:justify-start gap-3">
                                <span className="inline-flex items-center bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200">
                                    Manager
                                </span>
                                <span className="inline-flex items-center bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full border border-blue-200">
                                    {totalProperties} Properties
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 mt-8">
                        <button 
                            onClick={() => setActiveTab('properties')}
                            className={`pb-4 px-6 text-sm font-medium transition-all relative ${
                                activeTab === 'properties' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <Home className="w-4 h-4" />
                                Active Listings
                            </span>
                            {activeTab === 'properties' && (
                                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></span>
                            )}
                        </button>
                        <button 
                            onClick={() => setActiveTab('pending')}
                            className={`pb-4 px-6 text-sm font-medium transition-all relative ${
                                activeTab === 'pending' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Pending Approval
                                {pendingProperties.length > 0 && (
                                    <span className="bg-yellow-100 text-yellow-800 text-xs py-0.5 px-2 rounded-full">
                                        {pendingProperties.length}
                                    </span>
                                )}
                            </span>
                            {activeTab === 'pending' && (
                                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></span>
                            )}
                        </button>
                        <button 
                            onClick={() => setActiveTab('rejected')}
                            className={`pb-4 px-6 text-sm font-medium transition-all relative ${
                                activeTab === 'rejected' ? 'text-red-600' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center text-[10px] font-bold">!</div>
                                Rejected
                                {rejectedProperties.length > 0 && (
                                    <span className="bg-red-100 text-red-800 text-xs py-0.5 px-2 rounded-full">
                                        {rejectedProperties.length}
                                    </span>
                                )}
                            </span>
                            {activeTab === 'rejected' && (
                                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 rounded-t-full"></span>
                            )}
                        </button>
                    </div>

                    {/* Properties Table */}
                    {activeTab === 'properties' && (
                        <div className="mt-6 overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        <th className="pb-4 pr-6">Title</th>
                                        <th className="pb-4 pr-6">Status</th>
                                        <th className="pb-4 pr-6">Location</th>
                                        <th className="pb-4 pr-6">Type</th>
                                        <th className="pb-4 pr-6">Price</th>
                                        <th className="pb-4 pr-6">Inventory</th>
                                        <th className="pb-4 pr-6">Occupied</th>
                                        <th className="pb-4">Updated</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {activeProperties.length > 0 ? (
                                        activeProperties.map(property => (
                                            <tr key={property._id} className="hover:bg-gray-50 transition">
                                                <td className="py-4 pr-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                                            {property.images?.[0] ? (
                                                                <img 
                                                                    src={property.images[0]} 
                                                                    alt={property.title}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <Building2 className="w-5 h-5 text-gray-400" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <Link 
                                                                to={`/listings/${property._id}`}
                                                                className="text-gray-900 font-medium hover:text-primary transition"
                                                            >
                                                                {property.title}
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 pr-6">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Approved
                                                    </span>
                                                </td>
                                                <td className="py-4 pr-6 text-gray-600">
                                                    {property.location}, {property.country}
                                                </td>
                                                <td className="py-4 pr-6 text-gray-600">
                                                    standard
                                                </td>
                                                <td className="py-4 pr-6 text-gray-900 font-medium">
                                                    ₹{property.price?.toLocaleString('en-IN')}
                                                </td>
                                                <td className="py-4 pr-6 text-gray-600">
                                                    {property.rooms || 
                                                        ((property.roomTypes?.single || 0) + (property.roomTypes?.double || 0) + (property.roomTypes?.triple || 0)) || 0}
                                                </td>
                                                <td className="py-4 pr-6 text-gray-600">
                                                    {getOccupiedRoomsForProperty(property._id)}
                                                </td>
                                                <td className="py-4 text-gray-500">
                                                    {property.lastUpdated || property.createdAt 
                                                        ? new Date(property.lastUpdated || property.createdAt).toLocaleDateString('en-GB')
                                                        : 'N/A'
                                                    }
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="py-8 text-center text-gray-500">
                                                No active properties found. <Link to="/create-listing" className="text-primary hover:underline">Add your first property</Link>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pending Properties Table */}
                    {activeTab === 'pending' && (
                        <div className="mt-6 overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        <th className="pb-4 pr-6">Title</th>
                                        <th className="pb-4 pr-6">Status</th>
                                        <th className="pb-4 pr-6">Location</th>
                                        <th className="pb-4 pr-6">Price</th>
                                        <th className="pb-4 pr-6">Submitted</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {pendingProperties.length > 0 ? (
                                        pendingProperties.map(property => (
                                            <tr key={property._id} className="hover:bg-gray-50 transition">
                                                <td className="py-4 pr-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 opacity-75">
                                                            {property.images?.[0] ? (
                                                                <img 
                                                                    src={property.images[0]} 
                                                                    alt={property.title}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <Building2 className="w-5 h-5 text-gray-400" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-gray-900 font-medium">
                                                                {property.title}
                                                            </span>
                                                            <span className="text-[10px] text-gray-500">Awaiting admin approval</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 pr-6">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                        Pending Approval
                                                    </span>
                                                </td>
                                                <td className="py-4 pr-6 text-gray-600">
                                                    {property.location}, {property.country}
                                                </td>
                                                <td className="py-4 pr-6 text-gray-900 font-medium">
                                                    ₹{property.price?.toLocaleString('en-IN')}
                                                </td>
                                                <td className="py-4 text-gray-500">
                                                    {property.createdAt 
                                                        ? new Date(property.createdAt).toLocaleDateString('en-GB')
                                                        : 'Just now'
                                                    }
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="py-8 text-center text-gray-500">
                                                No pending approvals.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Rejected Properties Table */}
                    {activeTab === 'rejected' && (
                        <div className="mt-6 overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        <th className="pb-4 pr-6">Title</th>
                                        <th className="pb-4 pr-6">Status</th>
                                        <th className="pb-4 pr-6">Rejection Reason</th>
                                        <th className="pb-4 pr-6">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {rejectedProperties.length > 0 ? (
                                        rejectedProperties.map(property => (
                                            <tr key={property._id} className="hover:bg-gray-50 transition">
                                                <td className="py-4 pr-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 opacity-50 grayscale">
                                                            {property.images?.[0] ? (
                                                                <img 
                                                                    src={property.images[0]} 
                                                                    alt={property.title}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <Building2 className="w-5 h-5 text-gray-400" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-gray-900 font-medium line-through text-gray-500">
                                                                {property.title}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 pr-6">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        Rejected
                                                    </span>
                                                </td>
                                                <td className="py-4 pr-6">
                                                    <span className="text-sm text-red-600 font-medium">
                                                        {property.rejectionReason || 'Does not meet platform guidelines'}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-gray-500">
                                                    {property.updatedAt 
                                                        ? new Date(property.updatedAt).toLocaleDateString('en-GB')
                                                        : 'N/A'
                                                    }
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="py-8 text-center text-gray-500">
                                                No rejected properties.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Live Business Snapshot */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Live Business Snapshot</h3>
                    <div className="w-12 h-1 bg-primary rounded-full mb-6"></div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Total Properties */}
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <Home className="w-5 h-5 text-orange-600" />
                                </div>
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Properties</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-700">{totalProperties}</p>
                        </div>

                        {/* Revenue Today */}
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <DollarSign className="w-5 h-5 text-orange-600" />
                                </div>
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue Today</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-700">₹{revenueToday.toLocaleString('en-IN')}</p>
                        </div>

                        {/* Revenue Month */}
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <DollarSign className="w-5 h-5 text-orange-600" />
                                </div>
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue Month</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-700">₹{revenueMonth.toLocaleString('en-IN')}</p>
                        </div>

                        {/* Total Rooms */}
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                                </div>
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Rooms</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-700">{totalRooms}</p>
                        </div>

                        {/* Occupancy Rate */}
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                                </div>
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Occupancy Rate</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-700">{occupancyRate}%</p>
                        </div>
                    </div>
                </div>

                {/* Revenue and Analytics Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Total Revenue Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">Total Revenue</h3>
                        <div className="w-12 h-1 bg-primary rounded-full mb-6"></div>

                        <div className="bg-gray-50 rounded-xl p-6 text-center mb-6">
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-2">
                                <span className="text-lg">💰</span>
                                <span className="uppercase font-semibold tracking-wider">
                                    {filteredRevenue !== null ? 'Filtered Revenue' : 'All Time Revenue'}
                                </span>
                            </div>
                            <p className="text-4xl font-bold text-primary">
                                ₹{(filteredRevenue !== null ? filteredRevenue : totalRevenue).toLocaleString('en-IN')}
                            </p>
                            {filteredRevenue !== null && (
                                <p className="text-xs text-gray-400 mt-2">
                                    From {fromDate} to {toDate}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">From:</span>
                                <input 
                                    type="date" 
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">To:</span>
                                <input 
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                            </div>
                            <button 
                                onClick={handleApplyFilter}
                                className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-2 rounded-lg transition"
                            >
                                Apply
                            </button>
                            {filteredRevenue !== null && (
                                <button 
                                    onClick={handleResetFilter}
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-4 py-2 rounded-lg transition"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Smart Analytics Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">Smart Analytics</h3>
                        <div className="w-12 h-1 bg-primary rounded-full mb-6"></div>

                        <div className="mb-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-4">Daily Revenue</h4>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis 
                                            dataKey="date" 
                                            tick={{ fontSize: 11, fill: '#6b7280' }}
                                            tickLine={false}
                                            axisLine={{ stroke: '#e5e7eb' }}
                                            interval={0}
                                            angle={-45}
                                            textAnchor="end"
                                            height={60}
                                        />
                                        <YAxis 
                                            tick={{ fontSize: 12, fill: '#6b7280' }}
                                            tickLine={false}
                                            axisLine={{ stroke: '#e5e7eb' }}
                                            tickFormatter={(value) => value.toLocaleString()}
                                        />
                                        <Tooltip 
                                            formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                                            labelStyle={{ color: '#374151' }}
                                            contentStyle={{ 
                                                backgroundColor: '#fff', 
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                            }}
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="revenue" 
                                            stroke="#7c3aed" 
                                            strokeWidth={2}
                                            dot={{ fill: '#fff', stroke: '#7c3aed', strokeWidth: 2, r: 4 }}
                                            activeDot={{ r: 6, fill: '#7c3aed' }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default OwnerDashboard;
