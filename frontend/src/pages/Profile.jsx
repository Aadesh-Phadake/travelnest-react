import { Calendar, Car, Crown, ExternalLink, Gift, Hotel, IndianRupee, MapPin, Settings, Star, Trash2, TrendingUp, Users, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const Profile = () => {
    const [profileData, setProfileData] = useState(null);
    const [taxiBookings, setTaxiBookings] = useState([]);
    const [walletData, setWalletData] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(null); // 'hotels', 'taxis', or 'wallet'
    const [redeemPoints, setRedeemPoints] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const profileRes = await api.get('/profile');
                setProfileData(profileRes.data);

                const taxiRes = await api.get('/taxis/bookings');
                setTaxiBookings(taxiRes.data.bookings || []);

                // Fetch wallet data only for travellers
                if (profileRes.data.user.role === 'traveller') {
                    const walletRes = await api.get('/wallet?t=' + Date.now());
                    setWalletData(walletRes.data);

                    const transactionsRes = await api.get('/wallet/transactions?t=' + Date.now());
                    setTransactions(transactionsRes.data.transactions || []);
                }

                // Set default tab based on user role and navigation
                if (profileRes.data.user.role === 'traveller' && (walletData || location.state?.timestamp)) {
                    setActiveTab('wallet');
                } else {
                    setActiveTab('hotels');
                }
            } catch (error) {
                console.error(error);
                toast.error("Failed to load profile data");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    // Refresh wallet data when navigating from checkout
    useEffect(() => {
        if (location.state?.timestamp && profileData?.user?.role === 'traveller') {
            const refreshWallet = async () => {
                try {
                    const walletRes = await api.get('/wallet?t=' + Date.now());
                    setWalletData(walletRes.data);
                    const transactionsRes = await api.get('/wallet/transactions?t=' + Date.now());
                    setTransactions(transactionsRes.data.transactions || []);
                } catch (error) {
                    console.log('Wallet refresh failed:', error);
                }
            };
            refreshWallet();
        }
    }, [location.state, profileData]);

    const handleCancelBooking = async (id) => {
        if(!window.confirm("Are you sure you want to cancel this booking?")) return;
        try {
            await api.delete(`/profile/cancel/${id}`);
            setProfileData(prev => ({
                ...prev,
                bookings: prev.bookings.filter(b => b._id !== id)
            }));
            toast.success("Booking cancelled");
        } catch (error) {
            toast.error("Could not cancel booking");
        }
    };

    const handleRedeemPoints = async (points, discountAmount) => {
        if (!window.confirm(`Are you sure you want to redeem ${points} points for ₹${discountAmount} discount?`)) return;

        try {
            const response = await api.post('/wallet/redeem', { points });
            toast.success(response.data.message);

            // Update wallet data
            setWalletData(prev => ({
                ...prev,
                walletBalance: response.data.newBalance,
                rewardPoints: response.data.remainingPoints
            }));

            // Refresh transactions
            const transactionsRes = await api.get('/wallet/transactions');
            setTransactions(transactionsRes.data.transactions || []);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to redeem points");
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    if (!profileData) return <div className="text-center mt-10">User not found</div>;

    const { user, bookings } = profileData;
    const isMember = user.isMember && new Date(user.membershipExpiresAt) > new Date();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6">
            <div className="max-w-5xl mx-auto">
                
                {/* --- 1. Profile Header Card --- */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center md:items-start gap-6">
                    {/* Avatar Placeholder */}
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary text-3xl font-bold border-4 border-white shadow-sm">
                        {user.username.charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="flex-1 text-center md:text-left space-y-1">
                        <div className="flex items-center justify-center md:justify-between mb-2">
                            <div className="md:hidden"></div>
                            <div className="text-center md:text-left">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-300">{user.username}</h1>
                                <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                            </div>
                            <Link
                                to="/profile/settings"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm font-medium"
                            >
                                <Settings className="w-4 h-4" />
                                Settings
                            </Link>
                        </div>

                        <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-3">
                            {isMember ? (
                                <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-200">
                                    <Crown className="w-3.5 h-3.5 fill-amber-600 text-amber-600" />
                                    Premium Member
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1.5 rounded-full">
                                    Free Account
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full">
                                {bookings.length} Stays
                            </span>
                        </div>
                    </div>
                </div>

                {/* --- 2. Tabs Navigation --- */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 mb-8">
                    <button
                        onClick={() => setActiveTab('hotels')}
                        className={`pb-4 px-6 text-sm font-medium transition-all relative ${
                            activeTab === 'hotels' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <span className="flex items-center gap-2"><Hotel className="w-4 h-4"/> Hotel Bookings</span>
                        {activeTab === 'hotels' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('taxis')}
                        className={`pb-4 px-6 text-sm font-medium transition-all relative ${
                            activeTab === 'taxis' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <span className="flex items-center gap-2"><Car className="w-4 h-4"/> Taxi Rides</span>
                        {activeTab === 'taxis' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></span>}
                    </button>
                    {user.role === 'traveller' && (
                        <button
                            onClick={() => {
                                setActiveTab('wallet');
                                // Refresh wallet data when switching to wallet tab
                                if (user.role === 'traveller') {
                                    const fetchWalletData = async () => {
                                        try {
                                            const res = await api.get('/wallet?t=' + Date.now());
                                            setWalletData(res.data);
                                            const transactionsRes = await api.get('/wallet/transactions?t=' + Date.now());
                                            setTransactions(transactionsRes.data.transactions || []);
                                        } catch (error) {
                                            console.log('Wallet data not available:', error);
                                        }
                                    };
                                    fetchWalletData();
                                }
                            }}
                            className={`pb-4 px-6 text-sm font-medium transition-all relative ${
                                activeTab === 'wallet' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <span className="flex items-center gap-2"><Wallet className="w-4 h-4"/> Wallet & Rewards</span>
                            {activeTab === 'wallet' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></span>}
                        </button>
                    )}
                </div>

                {/* --- 3. Content Area --- */}
                
                {/* HOTEL BOOKINGS TAB */}
                {activeTab === 'hotels' && (
                    <div className="space-y-6">
                        {bookings.length > 0 ? (
                            bookings.map(booking => (
                                <div key={booking._id} className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-300">
                                    <div className="flex flex-col md:flex-row">
                                        
                                        {/* Image Section */}
                                        <div className="md:w-48 h-32 md:h-auto bg-gray-200 relative">
                                            {booking.listing?.images?.[0] ? (
                                                <img src={booking.listing.images[0]} alt="Hotel" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                                                    <Hotel className="w-8 h-8" />
                                                </div>
                                            )}
                                            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                                                Confirmed
                                            </div>
                                        </div>

                                        {/* Details Section */}
                                        <div className="flex-1 p-5">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition">
                                                        {booking.listing?.title || "Property Unavailable"}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                                        <MapPin className="w-3.5 h-3.5" />
                                                        {booking.listing?.location || "Location unavailable"}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-gray-900">₹{booking.totalAmount.toLocaleString('en-IN')}</p>
                                                    <p className="text-xs text-gray-400">Total Paid</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6 my-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    <span>{new Date(booking.checkIn).toLocaleDateString()} — {new Date(booking.checkOut).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                                                    <Users className="w-4 h-4 text-gray-400" />
                                                    <span>{booking.guests} Guests</span>
                                                </div>
                                            </div>

                                            {/* Actions Footer */}
                                            <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                                                <Link 
                                                    to={`/listings/${booking.listing?._id}`} 
                                                    className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-primary transition"
                                                >
                                                    View Hotel <ExternalLink className="w-3.5 h-3.5" />
                                                </Link>

                                                {/* Taxi Button - Highlighted */}
                                                {booking.listing && (
                                                    <Link 
                                                        to={`/listings/${booking.listing._id}/taxi`} 
                                                        className="ml-auto inline-flex items-center gap-2 bg-yellow-400 text-black text-sm font-semibold px-4 py-2 rounded-full hover:bg-yellow-500 transition shadow-sm"
                                                    >
                                                        <Car className="w-4 h-4" /> Book Taxi
                                                    </Link>
                                                )}

                                                <button 
                                                    onClick={() => handleCancelBooking(booking._id)}
                                                    className="inline-flex items-center gap-1 text-sm font-medium text-red-500 hover:text-red-700 px-3 py-2 rounded hover:bg-red-50 transition"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" /> Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <EmptyState 
                                icon={Hotel}
                                title="No trips planned yet"
                                description="Time to dust off your luggage and start exploring!"
                                actionLink="/listings"
                                actionText="Explore Hotels"
                            />
                        )}
                    </div>
                )}

                {/* TAXI RIDES TAB */}
                {activeTab === 'taxis' && (
                    <div className="space-y-4">
                        {taxiBookings.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {taxiBookings.map(taxi => (
                                    <div key={taxi._id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all duration-300">
                                        
                                        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-blue-50 p-2 rounded-lg">
                                                    <Car className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <span className="block text-sm font-bold text-gray-900">{taxi.taxiType} Ride</span>
                                                    <span className="text-xs text-gray-500">{new Date(taxi.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <span className={`text-xs font-bold px-2 py-1 rounded ${taxi.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {taxi.paymentStatus}
                                            </span>
                                        </div>

                                        {/* Visual Route */}
                                        <div className="relative pl-4 border-l-2 border-dashed border-gray-200 space-y-6 my-2 ml-2">
                                            <div className="relative">
                                                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-green-500 ring-4 ring-white"></div>
                                                <p className="text-xs text-gray-400 uppercase font-bold">Pickup</p>
                                                <p className="text-sm font-medium text-gray-800 line-clamp-1">{taxi.pickupLocation}</p>
                                            </div>
                                            <div className="relative">
                                                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-red-500 ring-4 ring-white"></div>
                                                <p className="text-xs text-gray-400 uppercase font-bold">Drop</p>
                                                <p className="text-sm font-medium text-gray-800 line-clamp-1">{taxi.dropLocation}</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                                            <span className="text-xs text-gray-500">Distance: {taxi.distanceKm}km</span>
                                            <span className="text-lg font-bold text-gray-900">₹{taxi.fareAmount}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState 
                                icon={Car}
                                title="No rides yet"
                                description="Book a taxi easily for your next hotel stay."
                                actionLink="/listings"
                                actionText="Book a Stay First"
                            />
                        )}
                    </div>
                )}

                {/* WALLET & REWARDS TAB */}
                {activeTab === 'wallet' && user.role === 'traveller' && (
                    <div className="space-y-6">
                        {/* Wallet Balance & Points Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Wallet Balance Card */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                                            <Wallet className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Wallet Balance</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Available for bookings</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                    ₹{walletData?.walletBalance?.toLocaleString('en-IN') || '0'}
                                </div>
                            </div>

                            {/* Reward Points Card */}
                            <div className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                                            <Star className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Reward Points</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Earn more with bookings</p>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const res = await api.get('/wallet?t=' + Date.now());
                                                    setWalletData(res.data);
                                                    const transactionsRes = await api.get('/wallet/transactions?t=' + Date.now());
                                                    setTransactions(transactionsRes.data.transactions || []);
                                                    toast.success('Wallet data refreshed');
                                                } catch (error) {
                                                    console.log('Wallet refresh failed:', error);
                                                    toast.error('Failed to refresh wallet data');
                                                }
                                            }}
                                            className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                                        >
                                            Refresh
                                        </button>
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                                    {walletData?.rewardPoints?.toLocaleString('en-IN') || '0'} pts
                                </div>
                            </div>
                        </div>

                        {/* Earn & Redeem Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Earn Points Info */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Earn Points</h3>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 dark:text-gray-400">Per ₹100 spent</span>
                                        <span className="font-semibold text-green-600 dark:text-green-400">10 points</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 dark:text-gray-400">Next booking reward</span>
                                        <span className="font-semibold text-blue-600 dark:text-blue-400">Coming soon</span>
                                    </div>
                                </div>
                            </div>

                            {/* Redeem Points */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                                        <Gift className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Redeem Points</h3>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 dark:text-gray-400">100 points =</span>
                                        <span className="font-semibold text-orange-600 dark:text-orange-400">₹5 discount</span>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Number of points to redeem
                                        </label>
                                        <input
                                            type="number"
                                            value={redeemPoints}
                                            onChange={(e) => setRedeemPoints(e.target.value)}
                                            min="20"
                                            max={walletData?.rewardPoints || 0}
                                            step="20"
                                            placeholder="Enter points (min 20)"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-gray-100"
                                        />
                                        {redeemPoints && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                You will get ₹{Math.floor(parseInt(redeemPoints) / 20) || 0} discount
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => {
                                            const points = parseInt(redeemPoints);
                                            const discount = Math.floor(points / 20);
                                            if (points >= 20 && discount > 0) {
                                                handleRedeemPoints(points, discount);
                                                setRedeemPoints('');
                                            }
                                        }}
                                        disabled={!redeemPoints || parseInt(redeemPoints) < 20 || parseInt(redeemPoints) > (walletData?.rewardPoints || 0)}
                                        className="w-full mt-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                                    >
                                        Redeem Points
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Transaction History */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Transaction History</h3>
                            {transactions.length > 0 ? (
                                <div className="space-y-3">
                                    {transactions.map((transaction, index) => (
                                        <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                    transaction.type === 'earn' ? 'bg-green-100 dark:bg-green-900/30' :
                                                    transaction.type === 'redeem' ? 'bg-orange-100 dark:bg-orange-900/30' :
                                                    'bg-blue-100 dark:bg-blue-900/30'
                                                }`}>
                                                    {transaction.type === 'earn' ? (
                                                        <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                    ) : transaction.type === 'redeem' ? (
                                                        <Gift className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                                    ) : (
                                                        <IndianRupee className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-gray-100">{transaction.description}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {new Date(transaction.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`font-semibold ${
                                                transaction.type === 'earn' ? 'text-green-600 dark:text-green-400' :
                                                transaction.type === 'redeem' ? 'text-orange-600 dark:text-orange-400' :
                                                'text-blue-600 dark:text-blue-400'
                                            }`}>
                                                {transaction.type === 'earn' ? '+' : transaction.type === 'redeem' ? '-' : ''}
                                                {transaction.type === 'earn' ? `${Math.round(transaction.amount / 10)} pts` : `₹${transaction.amount}`}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Wallet className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-500 dark:text-gray-400">No transactions yet</p>
                                    <p className="text-sm text-gray-400 dark:text-gray-500">Make your first booking to start earning points!</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

// Helper Component for Empty States
const EmptyState = ({ icon: Icon, title, description, actionLink, actionText }) => (
    <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
        <p className="text-gray-500 mb-6">{description}</p>
        <Link to={actionLink} className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-primary hover:brightness-90 transition">
            {actionText}
        </Link>
    </div>
);

export default Profile;