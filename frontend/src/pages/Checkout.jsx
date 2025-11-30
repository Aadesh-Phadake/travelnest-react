import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
// import { useAuth } from '../context/AuthContext';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { MapPin, Calendar, Users, ShieldCheck, Loader } from 'lucide-react';

const Checkout = () => {
    const { id } = useParams(); 
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    // const { user } = useAuth();
    const { user } = useSelector((state) => state.auth);

    const [orderDetails, setOrderDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    const guests = searchParams.get('guests') || 1;

    // Helper: Safely format dates to prevent crashes
    const formatDate = (dateString) => {
        if (!dateString) return "Select Date";
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleDateString();
    };

    // Helper: Calculate nights safely
    const calculateNights = () => {
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        if (isNaN(start) || isNaN(end)) return 0;
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        return diffDays > 0 ? diffDays : 0;
    };

    useEffect(() => {
        const createOrder = async () => {
            try {
                if (!checkIn || !checkOut) {
                    toast.error("Please select valid dates");
                    return navigate(`/listings/${id}`);
                }

                const res = await api.get(`/payment/create/${id}`, {
                    params: { checkIn, checkOut, guests }
                });

                console.log("Checkout Data Received:", res.data); // Debugging log
                setOrderDetails(res.data);
            } catch (error) {
                console.error("Order creation failed:", error);
                toast.error(error.response?.data?.message || "Could not initiate booking");
                navigate(`/listings/${id}`);
            } finally {
                setLoading(false);
            }
        };

        createOrder();
    }, [id, checkIn, checkOut, guests, navigate]);

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        const isLoaded = await loadRazorpay();
        if (!isLoaded) return toast.error("Razorpay SDK failed to load");

        setProcessing(true);

        const options = {
            key: orderDetails.key_id, 
            amount: orderDetails.amount,
            currency: orderDetails.currency,
            name: "TravelNest",
            description: `Booking for ${orderDetails.property.title}`,
            order_id: orderDetails.orderId,
            handler: async function (response) {
                try {
                    const verifyRes = await api.post('/payment/verify', {
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        propertyId: id,
                        checkIn,
                        checkOut,
                        guests
                    });

                    if (verifyRes.data.success) {
                        toast.success("Booking Confirmed!");
                        navigate('/profile');
                    } else {
                        toast.error("Payment verification failed");
                    }
                } catch (err) {
                    toast.error("Payment verification failed");
                    console.error(err);
                }
            },
            prefill: {
                name: user?.username,
                email: user?.email,
                contact: "9999999999"
            },
            theme: {
                color: "#fe424d"
            }
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
        setProcessing(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <Loader className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-gray-500">Calculating best price...</p>
            </div>
        );
    }

    // Safety check: If loading finished but data is missing
    if (!orderDetails || !orderDetails.property) {
        return (
            <div className="text-center mt-20">
                <h2 className="text-xl font-bold text-red-500">Something went wrong</h2>
                <button onClick={() => navigate(-1)} className="mt-4 text-primary underline">Go Back</button>
            </div>
        );
    }

    const { property, bookingDetails } = orderDetails;
    const nights = calculateNights();
    
    // Handle different image formats (String URL vs Object)
    const mainImage = Array.isArray(property.images) && property.images.length > 0
        ? (typeof property.images[0] === 'string' ? property.images[0] : property.images[0].url)
        : (property.image?.url || "https://via.placeholder.com/150");

    return (
        <div className="container mx-auto px-4 py-10 max-w-5xl">
            <h1 className="text-3xl font-bold mb-8">Confirm and Pay</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                
                {/* LEFT: Booking Details */}
                <div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
                        <h2 className="text-xl font-semibold mb-4">Your Trip</h2>
                        
                        <div className="flex justify-between items-center py-3 border-b">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-gray-500" />
                                <div>
                                    <p className="font-bold text-sm">Dates</p>
                                    <p className="text-gray-600 text-sm">
                                        {formatDate(checkIn)} – {formatDate(checkOut)} ({nights} Nights)
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center py-3">
                            <div className="flex items-center gap-3">
                                <Users className="w-5 h-5 text-gray-500" />
                                <div>
                                    <p className="font-bold text-sm">Guests</p>
                                    <p className="text-gray-600 text-sm">{guests} guest{guests > 1 ? 's' : ''}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h2 className="text-xl font-semibold mb-4">Payment Info</h2>
                        <div className="flex items-start gap-3 mb-4">
                            <ShieldCheck className="w-6 h-6 text-green-500 flex-shrink-0" />
                            <p className="text-sm text-gray-600">
                                This is a secure payment processed by Razorpay. Your card details are never stored on our servers.
                            </p>
                        </div>
                        <button 
                            onClick={handlePayment}
                            disabled={processing}
                            className="w-full bg-primary text-white py-3 rounded-lg font-bold text-lg hover:brightness-90 transition shadow-md flex justify-center items-center gap-2"
                        >
                            {processing ? "Processing..." : `Pay ₹${parseFloat(bookingDetails.totalPrice).toLocaleString("en-IN")}`}
                        </button>
                    </div>
                </div>

                {/* RIGHT: Hotel Summary Card */}
                <div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg sticky top-24">
                        <div className="flex gap-4 mb-6 pb-6 border-b">
                            <img 
                                src={mainImage} 
                                className="w-24 h-24 object-cover rounded-lg" 
                                alt={property.title}
                            />
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Hotel</p>
                                <h3 className="font-bold text-gray-900 line-clamp-2">{property.title}</h3>
                                <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                                    <MapPin className="w-3 h-3" />
                                    <span>{property.location}</span>
                                </div>
                            </div>
                        </div>

                        <h3 className="text-xl font-semibold mb-4">Price Details</h3>
                        
                        <div className="space-y-3 text-gray-600">
                            <div className="flex justify-between">
                                <span>₹{property.price.toLocaleString("en-IN")} x {nights} nights</span>
                                <span>₹{(property.price * nights).toLocaleString("en-IN")}</span>
                            </div>
                            
                            {parseInt(guests) > 2 && (
                                <div className="flex justify-between text-orange-600">
                                    <span>Extra Guest Fee</span>
                                    <span>+ ₹{((parseInt(guests) - 2) * 500 * nights).toLocaleString("en-IN")}</span>
                                </div>
                            )}

                            <div className="flex justify-between">
                                <span className="underline decoration-dotted">Service fee</span>
                                <span>
                                    {bookingDetails.isMember ? (
                                        <span className="text-green-600 font-bold">Free (Member)</span>
                                    ) : (
                                        `₹${(Math.round(bookingDetails.totalPrice) - (property.price * nights) - ((parseInt(guests) > 2 ? (parseInt(guests)-2)*500 : 0) * nights)).toLocaleString("en-IN")}`
                                    )}
                                </span>
                            </div>
                        </div>

                        <div className="border-t my-4 pt-4 flex justify-between items-center font-bold text-lg text-gray-900">
                            <span>Total (INR)</span>
                            <span>₹{parseFloat(bookingDetails.totalPrice).toLocaleString("en-IN")}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;