import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
// import { useAuth } from '../context/AuthContext';
import { Calendar, IndianRupee, Loader, MapPin, ShieldCheck, Users, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';

const Checkout = () => {
    const { id } = useParams(); 
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    // const { user } = useAuth();
    const { user } = useSelector((state) => state.auth);

    const [orderDetails, setOrderDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [walletData, setWalletData] = useState(null);
    const [useWallet, setUseWallet] = useState(false);
    const [walletAmount, setWalletAmount] = useState(0);

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
                console.log("Checkout Debug - User:", user);
                console.log("Checkout Debug - Params:", { id, checkIn, checkOut, guests });

                if (!checkIn || !checkOut) {
                    toast.error("Please select valid dates");
                    return navigate(`/listings/${id}`);
                }

                if (!user) {
                    toast.error("Please login to continue");
                    return navigate('/login');
                }

                // Fetch wallet data first for traveller users
                if (user?.role === 'traveller') {
                    try {
                        const walletRes = await api.get('/wallet');
                        setWalletData(walletRes.data);
                        console.log("Wallet data loaded:", walletRes.data);
                    } catch (walletError) {
                        console.log("Wallet data not available:", walletError);
                    }
                }

                // Create order for final amount after wallet deduction
                const walletDeduction = useWallet ? walletAmount : 0;
                const res = await api.get(`/payment/create/${id}`, {
                    params: { checkIn, checkOut, guests, walletDeduction }
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
    }, [id, checkIn, checkOut, guests, navigate, user, useWallet, walletAmount]);

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            // Check if Razorpay is already loaded
            if (window.Razorpay) {
                resolve(true);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => {
                console.log('Razorpay script loaded successfully');
                resolve(true);
            };
            script.onerror = () => {
                console.error('Failed to load Razorpay script');
                resolve(false);
            };
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        console.log("handlePayment called");
        setProcessing(true);

        const totalAmount = parseFloat(orderDetails?.bookingDetails?.totalPrice || 0);
        const walletDeduction = parseFloat(orderDetails?.bookingDetails?.walletDeduction || 0);
        const finalAmount = parseFloat(orderDetails?.bookingDetails?.finalAmount || 0);

        console.log("handlePayment calculations:", {
            totalAmount,
            walletDeduction,
            finalAmount,
            orderDetails: orderDetails ? "exists" : "null"
        });

        try {
            if (finalAmount <= 0) {
                // Full wallet payment
                console.log("Full wallet payment:", { totalAmount, walletDeduction, finalAmount });
                const walletRes = await api.post('/payment/wallet-only', {
                    propertyId: id,
                    checkIn,
                    checkOut,
                    guests,
                    walletAmount: totalAmount // Use total amount for full wallet payment
                });

                if (walletRes.data.success) {
                    toast.success("Booking Confirmed with Wallet!");
                    navigate('/profile');
                } else {
                    toast.error(walletRes.data.message || "Wallet payment failed");
                }
            } else {
                // Partial wallet + Razorpay payment
                console.log("Starting Razorpay payment process...");

                // Load Razorpay SDK
                const isLoaded = await loadRazorpay();
                if (!isLoaded) {
                    toast.error("Razorpay SDK failed to load. Please check your internet connection.");
                    return;
                }

                // Double-check Razorpay availability
                if (!window.Razorpay) {
                    toast.error("Razorpay payment system is not available. Please refresh the page.");
                    return;
                }

                // Check if we have a valid order ID
                if (!orderDetails.orderId) {
                    toast.error("Payment order not created. Please try again.");
                    return;
                }

                // Validate final amount
                if (finalAmount <= 0) {
                    toast.error("Invalid payment amount. Please try again.");
                    return;
                }

                const options = {
                    key: orderDetails.key_id,
                    amount: Math.round(finalAmount * 100), // Convert to paise and ensure integer
                    currency: orderDetails.currency || "INR",
                    name: "TravelNest",
                    description: `Booking for ${orderDetails?.property?.title || 'Hotel'}`,
                    order_id: orderDetails.orderId,
                    handler: async function (response) {
                        console.log("Razorpay payment successful:", response);
                        try {
                            const verifyRes = await api.post('/payment/verify', {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                propertyId: id,
                                checkIn,
                                checkOut,
                                guests,
                                walletDeduction: walletDeduction
                            });

                            if (verifyRes.data.success) {
                                toast.success("Booking Confirmed!");
                                // Refresh wallet data if wallet was used
                                if (walletDeduction > 0 && user?.role === 'traveller') {
                                    try {
                                        const updatedWalletRes = await api.get('/wallet');
                                        setWalletData(updatedWalletRes.data);
                                        console.log("Wallet balance updated after payment:", updatedWalletRes.data);
                                    } catch (walletError) {
                                        console.log("Could not refresh wallet data:", walletError);
                                    }
                                }
                                navigate('/profile', { state: { timestamp: Date.now() } });
                            } else {
                                toast.error(verifyRes.data.message || "Payment verification failed");
                            }
                        } catch (err) {
                            console.error("Payment verification error:", err);
                            toast.error("Payment verification failed. Please contact support.");
                        }
                    },
                    prefill: {
                        name: user?.username || "",
                        email: user?.email || "",
                        contact: "9999999999"
                    },
                    theme: {
                        color: "#fe424d"
                    },
                    modal: {
                        ondismiss: function() {
                            console.log("Payment modal dismissed by user");
                            setProcessing(false);
                        }
                    }
                };

                console.log("Creating Razorpay payment object with options:", {
                    key: options.key,
                    amount: options.amount,
                    currency: options.currency,
                    order_id: options.order_id
                });

                try {
                    const paymentObject = new window.Razorpay(options);
                    console.log("Razorpay payment object created successfully");

                    // Add event listeners for better error handling
                    paymentObject.on('payment.failed', function (response) {
                        console.error('Razorpay payment failed:', response);
                        toast.error("Payment failed. Please try again.");
                        setProcessing(false);
                    });

                    paymentObject.open();
                    console.log("Razorpay payment modal opened");
                } catch (razorpayError) {
                    console.error('Razorpay instantiation error:', razorpayError);
                    toast.error("Payment system error. Please refresh the page and try again.");
                    setProcessing(false);
                }
            }
        } catch (err) {
            toast.error("Payment failed");
            console.error(err);
        } finally {
            setProcessing(false);
        }
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

                        {/* Wallet Balance Section - Only for Travellers */}
                        {user?.role === 'traveller' && walletData && walletData.walletBalance > 0 && (
                            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Wallet className="w-5 h-5 text-blue-600" />
                                        <span className="font-semibold text-blue-800">Use Wallet Balance</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-blue-700 font-bold">
                                        <IndianRupee className="w-4 h-4" />
                                        <span>{walletData.walletBalance.toLocaleString("en-IN")}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="useWallet"
                                        checked={useWallet}
                                        onChange={(e) => {
                                            console.log("WALLET CHECKBOX CHANGED:", e.target.checked);
                                            setUseWallet(e.target.checked);
                                            if (e.target.checked) {
                                                const maxWalletUse = Math.min(walletData.walletBalance, parseFloat(orderDetails?.bookingDetails?.totalPrice || 0));
                                                console.log("SETTING WALLET AMOUNT TO:", maxWalletUse, "walletBalance:", walletData.walletBalance, "totalPrice:", orderDetails?.bookingDetails?.totalPrice);
                                                setWalletAmount(maxWalletUse);
                                            } else {
                                                console.log("SETTING WALLET AMOUNT TO: 0");
                                                setWalletAmount(0);
                                            }
                                        }}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="useWallet" className="text-sm text-gray-700">
                                        Use wallet balance for this booking
                                    </label>
                                </div>

                                {useWallet && (
                                    <div className="mt-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Amount to use from wallet (₹)
                                        </label>
                                        <input
                                            type="number"
                                            value={walletAmount}
                                            onChange={(e) => {
                                                const amount = Math.min(parseFloat(e.target.value) || 0, walletData.walletBalance, parseFloat(orderDetails?.bookingDetails?.totalPrice || 0));
                                                setWalletAmount(amount);
                                            }}
                                            min="0"
                                            max={Math.min(walletData.walletBalance, parseFloat(orderDetails?.bookingDetails?.totalPrice || 0))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter amount"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Maximum: ₹{Math.min(walletData.walletBalance, parseFloat(orderDetails?.bookingDetails?.totalPrice || 0)).toLocaleString("en-IN")}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-start gap-3 mb-4">
                            <ShieldCheck className="w-6 h-6 text-green-500 flex-shrink-0" />
                            <p className="text-sm text-gray-600">
                                This is a secure payment processed by Razorpay. Your card details are never stored on our servers.
                            </p>
                        </div>

                        {/* Display wallet deduction and final amount */}
                        {(() => {
                            const totalAmount = parseFloat(orderDetails?.bookingDetails?.totalPrice || 0);
                            const walletDeduction = parseFloat(orderDetails?.bookingDetails?.walletDeduction || 0);
                            const finalAmount = parseFloat(orderDetails?.bookingDetails?.finalAmount || 0);

                            console.log("Checkout display calculation:", {
                                totalAmount,
                                walletDeduction,
                                finalAmount,
                                useWallet,
                                walletAmount
                            });

                            return (
                                <>
                                    {walletDeduction > 0 && (
                                        <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-green-700">Wallet deduction:</span>
                                                <span className="font-bold text-green-700">-₹{walletDeduction.toLocaleString("en-IN")}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm mt-1">
                                                <span className="text-gray-700">Amount to pay:</span>
                                                <span className="font-bold text-gray-900">₹{finalAmount.toLocaleString("en-IN")}</span>
                                            </div>
                                        </div>
                                    )}
                                </>
                            );
                        })()}

                        <button
                            onClick={() => {
                                console.log("PAYMENT BUTTON CLICKED");
                                handlePayment();
                            }}
                            disabled={processing}
                            className="w-full bg-primary text-white py-3 rounded-lg font-bold text-lg hover:brightness-90 transition shadow-md flex justify-center items-center gap-2"
                        >
                            {(() => {
                                const totalAmount = parseFloat(orderDetails?.bookingDetails?.totalPrice || 0);
                                const finalAmount = useWallet ? Math.max(0, totalAmount - walletAmount) : totalAmount;
                                return processing ? "Processing..." : `Pay ₹${finalAmount.toLocaleString("en-IN")}`;
                            })()}
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
                                    {orderDetails?.bookingDetails?.isMember ? (
                                        <span className="text-green-600 font-bold">Free (Member)</span>
                                    ) : (
                                        `₹${(Math.round(orderDetails?.bookingDetails?.totalPrice || 0) - (property.price * nights) - ((parseInt(guests) > 2 ? (parseInt(guests)-2)*500 : 0) * nights)).toLocaleString("en-IN")}`
                                    )}
                                </span>
                            </div>
                        </div>

                        <div className="border-t my-4 pt-4 flex justify-between items-center font-bold text-lg text-gray-900">
                            <span>Total (INR)</span>
                            <span>₹{parseFloat(orderDetails?.bookingDetails?.totalPrice || 0).toLocaleString("en-IN")}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;

