import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { MapPin, Star, User, Trash2, Edit, Car } from 'lucide-react';
import toast from 'react-hot-toast';

const ListingDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
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

    // Handle Booking Navigation
    const handleBookNow = (e) => {
        e.preventDefault();
        if (!user) return toast.error("Please login to book");
        
        // Validation
        if (!checkIn || !checkOut) return toast.error("Select dates first");
        if (new Date(checkOut) <= new Date(checkIn)) return toast.error("Checkout must be after Check-in");

        // Navigate to payment/checkout page
        navigate(`/payment/create/${id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
    };

    // Handle Review Submission
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

    // Handle Review Deletion
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

    // Handle Listing Deletion (Owner Only)
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
    
    // Calculate total price for display
    const pricePerNight = listing.price;
    const totalPrice = Math.round(pricePerNight * 1.05); // Including 5% fee logic

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            
            {/* HEADER: Title & Location */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">{listing.title}</h1>
                <div className="flex items-center gap-2 text-gray-600 mt-2">
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium">{listing.location}, {listing.country}</span>
                </div>
            </div>

            {/* IMAGES SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl overflow-hidden h-[400px] md:h-[500px] mb-8 shadow-sm">
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
                
                {/* LEFT COLUMN: Info, Map, Reviews */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Owner Info */}
                    <div className="flex justify-between items-center border-b border-gray-100 pb-6">
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-800">Hosted by {listing.owner?.username || "TravelNest User"}</h2>
                            <p className="text-gray-500">Experienced Host</p>
                        </div>
                        <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-gray-500" />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <h3 className="text-xl font-semibold mb-3">About this place</h3>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                            {listing.description}
                        </p>
                    </div>

                    {/* Owner Controls */}
                    {isOwner && (
                        <div className="flex gap-4 border-t border-gray-100 pt-6">
                            <button 
                                onClick={() => navigate(`/edit-listing/${listing._id}`)}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-black transition"
                            >
                                <Edit className="w-4 h-4" /> Edit Listing
                            </button>
                            <button 
                                onClick={handleDeleteListing}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                            >
                                <Trash2 className="w-4 h-4" /> Delete Listing
                            </button>
                        </div>
                    )}

                    {/* Reviews Section */}
                    <div className="border-t border-gray-100 pt-8">
                        <div className="flex items-center gap-2 mb-6">
                            <Star className="w-6 h-6 fill-primary text-primary" />
                            <h3 className="text-2xl font-semibold">
                                {listing.reviews?.length > 0 
                                    ? `${(listing.reviews.reduce((acc, r) => acc + r.rating, 0) / listing.reviews.length).toFixed(1)} · ${listing.reviews.length} Reviews` 
                                    : "No reviews yet"}
                            </h3>
                        </div>

                        {/* Reviews List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {listing.reviews?.map(review => (
                                <div key={review._id} className="bg-gray-50 p-4 rounded-xl">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="font-semibold">{review.author?.username || "Guest"}</div>
                                        </div>
                                        {(user && user._id === review.author?._id) && (
                                            <button onClick={() => handleDeleteReview(review._id)} className="text-gray-400 hover:text-red-500">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex gap-1 mb-2">
                                        {[...Array(review.rating)].map((_, i) => (
                                            <Star key={i} className="w-3 h-3 fill-black text-black" />
                                        ))}
                                    </div>
                                    <p className="text-gray-600 text-sm">{review.comment}</p>
                                </div>
                            ))}
                        </div>

                        {/* Add Review Form */}
                        {user && user.role === 'traveller' && (
                            <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
                                <h4 className="text-lg font-semibold mb-4">Leave a Review</h4>
                                <form onSubmit={handleSubmitReview}>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setReviewRating(star)}
                                                    className={`text-2xl transition ${star <= reviewRating ? 'text-yellow-400 scale-110' : 'text-gray-300'}`}
                                                >
                                                    ★
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                                        <textarea
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                            rows="3"
                                            required
                                            value={reviewComment}
                                            onChange={(e) => setReviewComment(e.target.value)}
                                        ></textarea>
                                    </div>
                                    <button type="submit" className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition">
                                        Submit Review
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Sticky Booking Card */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 bg-white border border-gray-200 rounded-xl shadow-lg p-6">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <span className="text-2xl font-bold text-gray-900">₹{totalPrice.toLocaleString("en-IN")}</span>
                                <span className="text-gray-500"> / night</span>
                            </div>
                            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                Inc. 5% fee
                            </div>
                        </div>

                        {/* BOOKING LOGIC: 
                           If user is NOT a traveller (Manager/Admin), show warning.
                           If user IS a traveller (or not logged in), show form.
                        */}
                        {user && user.role !== 'traveller' ? (
                            <div className="p-4 bg-gray-100 rounded-lg text-center text-gray-600 mb-4">
                                {user.role === 'manager' ? "Switch to Traveller account to book" : "Admins cannot book"}
                            </div>
                        ) : (
                            <form onSubmit={handleBookNow} className="space-y-4">
                                <div className="grid grid-cols-2 border border-gray-300 rounded-lg overflow-hidden">
                                    <div className="p-3 border-r border-gray-300 bg-white">
                                        <label className="block text-xs font-bold uppercase text-gray-500">Check-in</label>
                                        <input 
                                            type="date" 
                                            className="w-full outline-none text-sm bg-transparent mt-1"
                                            min={new Date().toISOString().split('T')[0]}
                                            value={checkIn}
                                            onChange={(e) => setCheckIn(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="p-3 bg-white">
                                        <label className="block text-xs font-bold uppercase text-gray-500">Check-out</label>
                                        <input 
                                            type="date" 
                                            className="w-full outline-none text-sm bg-transparent mt-1"
                                            min={checkIn || new Date().toISOString().split('T')[0]}
                                            value={checkOut}
                                            onChange={(e) => setCheckOut(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="border border-gray-300 rounded-lg p-3 bg-white">
                                    <label className="block text-xs font-bold uppercase text-gray-500">Guests</label>
                                    <select 
                                        className="w-full outline-none text-sm bg-transparent mt-1"
                                        value={guests}
                                        onChange={(e) => setGuests(e.target.value)}
                                    >
                                        {[1,2,3,4,5].map(num => <option key={num} value={num}>{num} Guests</option>)}
                                    </select>
                                </div>

                                <button type="submit" className="w-full bg-primary text-white py-3 rounded-lg font-bold text-lg hover:brightness-90 transition shadow-md">
                                    Reserve
                                </button>
                            </form>
                        )}

                        {!user && (
                            <div className="mt-4 text-center">
                                <Link to="/login" className="text-primary underline">Login to book</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ListingDetails;