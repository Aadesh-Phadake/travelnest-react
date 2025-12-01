import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Car, MapPin, Calendar, Users, Clock, Hotel, ChevronRight, LogOut, Trash2, ExternalLink, Crown } from 'lucide-react';

const Profile = () => {
    const [profileData, setProfileData] = useState(null);
    const [taxiBookings, setTaxiBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('hotels'); // 'hotels' or 'taxis'

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const profileRes = await api.get('/profile');
                setProfileData(profileRes.data);

                const taxiRes = await api.get('/taxis/bookings');
                setTaxiBookings(taxiRes.data.bookings || []);
            } catch (error) {
                console.error(error);
                toast.error("Failed to load profile data");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

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
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-300">{user.username}</h1>
                        <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                        
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