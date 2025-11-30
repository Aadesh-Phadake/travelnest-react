import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useSelector } from 'react-redux'; 
import { MapPin, Star, User, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import WeatherWidget from '../components/WeatherWidget';

const ListingDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewRating, setReviewRating] = useState(5);
    
    // Booking State
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [guests, setGuests] = useState(1);

    // Fetch Listing Data
    useEffect(() => {
        const fetchListing = async () => {
            try {
                const res = await api.get(`/listings/${id}`);
                setListing(res.data.listing || res.data);
            } catch (error) {
                console.error(error);
                toast.error("Could not load hotel details");
                navigate('/listings');
            } finally {
                setLoading(false);
            }
        };
        fetchListing();
    }, [id, navigate]);

    const handleBookNow = (e) => {
        e.preventDefault();
        if (!user) return toast.error("Please login to book");
        if (!checkIn || !checkOut) return toast.error("Select dates first");
        if (new Date(checkOut) <= new Date(checkIn)) return toast.error("Checkout must be after Check-in");

        navigate(`/payment/create/${id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post(`/listings/${id}/reviews`, { 
                rating: reviewRating, 
                comment: reviewComment 
            });
            setListing(prev => ({
                ...prev,
                reviews: [...prev.reviews, res.data.review] 
            }));
            setReviewComment('');
            setReviewRating(5);
            toast.success("Review added!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to post review");
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if(!window.confirm("Delete this review?")) return;
        try {
            await api.delete(`/listings/${id}/reviews/${reviewId}`);
            setListing(prev => ({
                ...prev,
                reviews: prev.reviews.filter(r => r._id !== reviewId)
            }));
            toast.success("Review deleted");
        } catch (error) {
            toast.error("Failed to delete review");
        }
    };

    const handleDeleteListing = async () => {
        if(!window.confirm("Are you sure? This cannot be undone.")) return;
        try {
            await api.delete(`/listings/${id}`);
            toast.success("Listing deleted");
            navigate('/listings');
        } catch (error) {
            toast.error("Failed to delete listing");
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
    if (!listing) return <div className="text-center mt-10">Listing not found</div>;

    const isOwner = user && listing.owner && (user._id === listing.owner._id || user._id === listing.owner);
    const pricePerNight = listing.price;
    const totalPrice = Math.round(pricePerNight * 1.05); 


    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">{listing.title}</h1>
                    <div className="flex flex-wrap items-center gap-4 text-gray-600">
                        <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-lg text-sm font-medium">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span>{listing.location}, {listing.country}</span>
                        </div>
                    </div>
                </div>
                <div className="flex-shrink-0 w-full md:w-auto">
                    <div className="md:-mt-4">
                        <WeatherWidget location={listing.location} country={listing.country} />
                    </div>
                </div>
            </div>

            {/* IMAGES SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl overflow-hidden h-[400px] md:h-[500px] mb-10 shadow-md">
                <div className="h-full">
                    <img 
                        src={listing.images?.[0]?.url || listing.images?.[0] || "https://via.placeholder.com/800"} 
                        className="w-full h-full object-cover hover:opacity-95 transition cursor-pointer"
                        alt="Main View"
                    />
                </div>
                <div className="hidden md:grid grid-cols-2 gap-2 h-full">
                    {[1, 2, 3, 4].map((idx) => (
                        <img 
                            key={idx}
                            src={listing.images?.[idx]?.url || listing.images?.[idx] || "https://via.placeholder.com/400?text=View"} 
                            className="w-full h-full object-cover hover:opacity-95 transition" 
                            alt={`View ${idx}`} 
                        />
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-10">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Hosted by {listing.owner?.username || "TravelNest Host"}</h2>
                            <p className="text-gray-500 mt-1">Superhost · 5 years hosting</p>
                        </div>
                        <div className="h-14 w-14 bg-gray-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                            <User className="h-7 w-7 text-gray-500" />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">About this place</h3>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-line text-lg">
                            {listing.description}
                        </p>
                    </div>

                    {isOwner && (
                        <div className="flex gap-4 p-6 bg-gray-50 rounded-xl border border-gray-100">
                            <button onClick={() => navigate(`/edit-listing/${id}`)} className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-black transition font-medium">
                                <Edit className="w-4 h-4" /> Edit Listing
                            </button>
                            <button onClick={handleDeleteListing} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition font-medium">
                                <Trash2 className="w-4 h-4" /> Delete Listing
                            </button>
                        </div>
                    )}

                    {/* Google Maps Section */}
                    <div className="border-t border-gray-100 pt-10">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Where you'll be</h3>
                        <div className="w-full h-[400px] bg-gray-100 rounded-2xl overflow-hidden shadow-sm">
                            <iframe
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                loading="lazy"
                                allowFullScreen
                                referrerPolicy="no-referrer-when-downgrade"
                                title="map"
                                src={`https://maps.google.com/maps?q=${encodeURIComponent(listing.location + ', ' + listing.country)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                            ></iframe>
                        </div>
                    </div>

                    {/* Reviews */}
                    <div className="border-t border-gray-100 pt-10">
                        <div className="flex items-center gap-3 mb-8">
                            <Star className="w-7 h-7 fill-primary text-primary" />
                            <h3 className="text-2xl font-bold text-gray-900">
                                {listing.reviews?.length > 0 
                                    ? `${(listing.reviews.reduce((acc, r) => acc + r.rating, 0) / listing.reviews.length).toFixed(1)} · ${listing.reviews.length} Reviews` 
                                    : "No reviews yet"}
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                            {listing.reviews?.map(review => (
                                <div key={review._id} className="bg-gray-50 p-6 rounded-2xl">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-gray-500 shadow-sm">
                                                {review.author?.username?.[0]?.toUpperCase() || "G"}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{review.author?.username || "Guest"}</div>
                                                <div className="text-xs text-gray-500">Verified Stay</div>
                                            </div>
                                        </div>
                                        {(user && user._id === review.author?._id) && (
                                            <button onClick={() => handleDeleteReview(review._id)} className="text-gray-400 hover:text-red-500">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex gap-1 mb-3">
                                        {[...Array(review.rating)].map((_, i) => (
                                            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                        ))}
                                    </div>
                                    <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                                </div>
                            ))}
                        </div>

                        {/* Add Review Form */}
                        {user && user.role === 'traveller' && (
                            <div className="bg-white border border-gray-200 p-8 rounded-2xl shadow-sm">
                                <h4 className="text-lg font-bold text-gray-900 mb-6">Rate your experience</h4>
                                <form onSubmit={handleSubmitReview}>
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">How many stars?</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setReviewRating(star)}
                                                    className={`text-3xl transition-transform hover:scale-110 ${star <= reviewRating ? 'text-amber-400' : 'text-gray-200'}`}
                                                >
                                                    ★
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Share your feedback</label>
                                        <textarea
                                            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
                                            rows="4"
                                            placeholder="What did you like? What could be improved?"
                                            required
                                            value={reviewComment}
                                            onChange={(e) => setReviewComment(e.target.value)}
                                        ></textarea>
                                    </div>
                                    <button type="submit" className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition shadow-lg">
                                        Post Review
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Sticky Booking Card */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 bg-white border border-gray-200 rounded-2xl shadow-xl p-6 lg:p-8">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <span className="text-3xl font-bold text-gray-900">₹{totalPrice.toLocaleString("en-IN")}</span>
                                <span className="text-gray-500 font-medium"> / night</span>
                            </div>
                        </div>

                        {user && user.role !== 'traveller' ? (
                            <div className="p-4 bg-gray-100 rounded-xl text-center text-gray-600 mb-4 font-medium border border-gray-200">
                                {user.role === 'manager' ? "Switch to Traveller account to book" : "Admins cannot book"}
                            </div>
                        ) : (
                            <form onSubmit={handleBookNow} className="space-y-4">
                                <div className="grid grid-cols-2 border border-gray-300 rounded-xl overflow-hidden">
                                    <div className="p-3 border-r border-gray-300 bg-white hover:bg-gray-50 transition cursor-pointer">
                                        <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">Check-in</label>
                                        <input 
                                            type="date" 
                                            className="w-full outline-none text-sm bg-transparent mt-1 font-medium text-gray-900 cursor-pointer"
                                            min={new Date().toISOString().split('T')[0]}
                                            value={checkIn}
                                            onChange={(e) => setCheckIn(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="p-3 bg-white hover:bg-gray-50 transition cursor-pointer">
                                        <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">Check-out</label>
                                        <input 
                                            type="date" 
                                            className="w-full outline-none text-sm bg-transparent mt-1 font-medium text-gray-900 cursor-pointer"
                                            min={checkIn || new Date().toISOString().split('T')[0]}
                                            value={checkOut}
                                            onChange={(e) => setCheckOut(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="border border-gray-300 rounded-xl p-3 bg-white hover:bg-gray-50 transition cursor-pointer">
                                    <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">Guests</label>
                                    <select 
                                        className="w-full outline-none text-sm bg-transparent mt-1 font-medium text-gray-900 cursor-pointer"
                                        value={guests}
                                        onChange={(e) => setGuests(e.target.value)}
                                    >
                                        {[1,2,3,4,5].map(num => <option key={num} value={num}>{num} Guests</option>)}
                                    </select>
                                </div>

                                <button type="submit" className="w-full bg-primary text-white py-3.5 rounded-xl font-bold text-lg hover:brightness-110 transition shadow-lg shadow-primary/30">
                                    Reserve
                                </button>
                            </form>
                        )}

                        {!user && (
                            <div className="mt-4 text-center">
                                <Link to="/login" className="text-primary font-medium hover:underline">Login to book</Link>
                            </div>
                        )}
                        
                        <div className="mt-4 flex justify-between text-xs text-gray-400 px-2">
                            <span>Won't charge you yet</span>
                            <span>Free cancellation</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ListingDetails;