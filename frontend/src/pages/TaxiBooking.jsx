import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { MapPin, Navigation, Crosshair, ArrowUpDown, Car, Truck, Gem, Clock } from 'lucide-react';

// Fix Leaflet Icon Issue in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const TaxiBooking = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [listing, setListing] = useState(null);
    
    // Form State
    const [pickup, setPickup] = useState('');
    const [drop, setDrop] = useState('');
    const [distance, setDistance] = useState(0);
    const [taxiType, setTaxiType] = useState('Standard');
    
    // Map State
    const [pickupCoords, setPickupCoords] = useState(null);
    const [dropCoords, setDropCoords] = useState(null);
    const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); 
    const [activeMarker, setActiveMarker] = useState('drop'); 

    // Estimate State
    const [estimate, setEstimate] = useState(null);
    const [loadingEstimate, setLoadingEstimate] = useState(false);

    // Fetch Listing Data
    useEffect(() => {
        const fetchListing = async () => {
            try {
                const res = await api.get(`/listings/${id}`);
                const data = res.data.listing || res.data;
                setListing(data);
                
                const query = `${data.location}, ${data.country}`;
                const geo = await geocode(query);
                if (geo) {
                    setMapCenter([geo.lat, geo.lng]);
                    setPickupCoords({ lat: geo.lat, lng: geo.lng });
                    setPickup(geo.displayName);
                }
            } catch (error) {
                toast.error("Failed to load hotel details");
                navigate('/listings');
            }
        };
        fetchListing();
    }, [id, navigate]);

    // --- Geo Utils ---
    const geocode = async (query) => {
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
            const res = await fetch(url);
            const data = await res.json();
            if (data && data.length > 0) {
                return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), displayName: data[0].display_name };
            }
        } catch (e) { console.error(e); }
        return null;
    };

    const reverseGeocode = async (lat, lng) => {
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
            const res = await fetch(url);
            const data = await res.json();
            return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        } catch (e) { return `${lat.toFixed(5)}, ${lng.toFixed(5)}`; }
    };

    // --- Map Interactions ---
    const MapClickHandler = () => {
        useMapEvents({
            click: async (e) => {
                const { lat, lng } = e.latlng;
                const address = await reverseGeocode(lat, lng);
                
                if (activeMarker === 'pickup') {
                    setPickupCoords({ lat, lng });
                    setPickup(address);
                } else {
                    setDropCoords({ lat, lng });
                    setDrop(address);
                }
                setEstimate(null); 
            }
        });
        return null;
    };

    const RecenterMap = ({ center }) => {
        const map = useMap();
        useEffect(() => {
            map.setView(center);
        }, [center, map]);
        return null;
    };

    // --- Logic ---
    useEffect(() => {
        if (pickupCoords && dropCoords) {
            const R = 6371; 
            const dLat = (dropCoords.lat - pickupCoords.lat) * Math.PI / 180;
            const dLon = (dropCoords.lng - pickupCoords.lng) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(pickupCoords.lat * Math.PI / 180) * Math.cos(dropCoords.lat * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const d = R * c;
            setDistance(Math.round(d * 10) / 10);
        }
    }, [pickupCoords, dropCoords]);

    const handleGetEstimate = async () => {
        if (!pickup || !drop || distance <= 0) return toast.error("Please set valid locations");
        if (distance > 50) return toast.error("Distance exceeds 50km limit");

        setLoadingEstimate(true);
        try {
            const res = await api.post(`/listings/${id}/taxi/estimate`, {
                pickupLocation: pickup,
                dropLocation: drop,
                distanceKm: distance,
                taxiType
            });
            setEstimate(res.data);
        } catch (error) {
            toast.error("Failed to get estimate");
        } finally {
            setLoadingEstimate(false);
        }
    };

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePay = async () => {
        if (!estimate) return toast.error("Please get an estimate first");
        const isLoaded = await loadRazorpay();
        if (!isLoaded) return toast.error("Razorpay SDK failed");

        try {
            const orderRes = await api.post(`/listings/${id}/taxi/order`, {
                pickupLocation: pickup,
                dropLocation: drop,
                distanceKm: distance,
                taxiType
            });
            const order = orderRes.data;

            const options = {
                key: order.keyId,
                amount: order.amount * 100,
                currency: 'INR',
                name: "Taxi Booking",
                description: "Taxi Ride Payment",
                order_id: order.orderId,
                handler: async function (response) {
                    try {
                        const verifyRes = await api.post('/taxis/verify', {
                            bookingId: order.bookingId,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        if (verifyRes.data.success) {
                            toast.success("Taxi Booked Successfully!");
                            navigate('/profile'); 
                        } else {
                            toast.error("Verification failed");
                        }
                    } catch (e) {
                        toast.error("Payment verification failed");
                    }
                },
                theme: { color: "#C68148" }
            };
            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error) {
            toast.error("Failed to initiate payment");
        }
    };

    const handleSwap = () => {
        setPickup(drop);
        setDrop(pickup);
        const tempCoords = pickupCoords;
        setPickupCoords(dropCoords);
        setDropCoords(tempCoords);
        setEstimate(null);
    };

    const handleMyLocation = () => {
        if (!navigator.geolocation) return toast.error("Geolocation not supported");
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            const addr = await reverseGeocode(latitude, longitude);
            setPickupCoords({ lat: latitude, lng: longitude });
            setPickup(addr);
            setMapCenter([latitude, longitude]); 
        }, () => toast.error("Unable to retrieve location"));
    };

    // Helper for Taxi Card Selection
    const TaxiOption = ({ type, icon: Icon, label }) => (
        <div 
            onClick={() => { setTaxiType(type); setEstimate(null); }}
            className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all duration-200 
                ${taxiType === type ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
        >
            <Icon className={`w-6 h-6 ${taxiType === type ? 'text-primary' : 'text-gray-500'}`} />
            <span className={`text-sm font-medium ${taxiType === type ? 'text-primary' : 'text-gray-600'}`}>{label}</span>
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-6 max-w-6xl h-[calc(100vh-80px)] min-h-[600px]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                
                {/* LEFT: Form Section (4 Columns) */}
                <div className="lg:col-span-4 flex flex-col h-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    
                    <div className="p-5 border-b bg-white z-10">
                        <h2 className="text-2xl font-bold text-gray-800">Book a Ride</h2>
                        <p className="text-sm text-gray-500 truncate">To/From: {listing ? listing.title : 'Loading...'}</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-6">
                        
                        {/* Visual Timeline Inputs */}
                        <div className="relative">
                            {/* Vertical Line Connector */}
                            <div className="absolute left-4 top-10 bottom-10 w-0.5 border-l-2 border-dashed border-gray-300 z-0"></div>

                            {/* Pickup */}
                            <div className="relative z-10 mb-4">
                                <div className="absolute left-0 top-3 w-8 flex justify-center">
                                    <div className="w-3 h-3 rounded-full bg-green-500 ring-4 ring-white"></div>
                                </div>
                                <div className="ml-10">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pickup</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={pickup} 
                                            onChange={(e) => { setPickup(e.target.value); setEstimate(null); }}
                                            className="w-full p-3 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none font-medium"
                                            placeholder="Current Location"
                                        />
                                        <button onClick={handleMyLocation} className="absolute right-3 top-3 text-gray-400 hover:text-primary" title="Use My Location">
                                            <Crosshair className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Swap Button (Floating between inputs) */}
                            <div className="absolute left-8 top-1/2 -translate-y-1/2 z-20">
                                <button onClick={handleSwap} className="p-1.5 bg-white border shadow-sm rounded-full text-gray-500 hover:text-primary transition">
                                    <ArrowUpDown className="w-3 h-3" />
                                </button>
                            </div>

                            {/* Drop */}
                            <div className="relative z-10">
                                <div className="absolute left-0 top-3 w-8 flex justify-center">
                                    <div className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-white"></div>
                                </div>
                                <div className="ml-10">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Drop</label>
                                    <input 
                                        type="text" 
                                        value={drop} 
                                        onChange={(e) => { setDrop(e.target.value); setEstimate(null); }}
                                        className="w-full p-3 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none font-medium"
                                        placeholder="Search destination"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Vehicle Selection */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Ride</label>
                            <div className="grid grid-cols-3 gap-3">
                                <TaxiOption type="Standard" icon={Car} label="Standard" />
                                <TaxiOption type="SUV" icon={Truck} label="SUV" />
                                <TaxiOption type="Luxury" icon={Gem} label="Luxury" />
                            </div>
                        </div>

                        {/* Estimate Card */}
                        {estimate ? (
                            <div className="bg-gray-900 text-white p-4 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-400 text-xs font-bold uppercase">Total Fare</span>
                                    <span className="bg-white/20 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {estimate.timeMin} min
                                    </span>
                                </div>
                                <div className="text-3xl font-bold tracking-tight">₹{estimate.fare}</div>
                                <div className="text-xs text-gray-400 mt-1">{taxiType} Ride • {distance} km</div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                                <p className="text-sm text-gray-500">Enter locations to see fare estimate</p>
                            </div>
                        )}

                        {/* Warning */}
                        {distance > 50 && (
                            <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg font-medium text-center border border-red-100">
                                Distance too far (Max 50km).
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-5 border-t bg-white">
                        {!estimate ? (
                            <button 
                                onClick={handleGetEstimate}
                                disabled={loadingEstimate || distance <= 0 || distance > 50}
                                className="w-full py-3.5 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            >
                                {loadingEstimate ? "Calculating..." : "Get Price Estimate"}
                            </button>
                        ) : (
                            <div className="grid grid-cols-3 gap-3">
                                <button 
                                    onClick={() => setEstimate(null)}
                                    className="col-span-1 py-3.5 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition"
                                >
                                    Back
                                </button>
                                <button 
                                    onClick={handlePay}
                                    className="col-span-2 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-[#A96330] transition shadow-lg shadow-primary/30"
                                >
                                    Book & Pay
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Map Section (8 Columns) */}
                <div className="lg:col-span-8 h-[400px] lg:h-full rounded-2xl overflow-hidden shadow-xl border border-gray-200 relative">
                    <MapContainer center={mapCenter} zoom={14} style={{ height: "100%", width: "100%" }}>
                        <TileLayer 
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                        />
                        <RecenterMap center={mapCenter} />
                        <MapClickHandler />
                        
                        {pickupCoords && <Marker position={[pickupCoords.lat, pickupCoords.lng]}><Popup>Pickup</Popup></Marker>}
                        {dropCoords && <Marker position={[dropCoords.lat, dropCoords.lng]}><Popup>Drop</Popup></Marker>}
                    </MapContainer>

                    {/* Map Floating Controls */}
                    <div className="absolute top-4 left-4 z-[1000] flex gap-2">
                        <button 
                            onClick={() => setActiveMarker('pickup')}
                            className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg transition ${activeMarker === 'pickup' ? 'bg-black text-white ring-2 ring-offset-2 ring-black' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                        >
                            Set Pickup
                        </button>
                        <button 
                            onClick={() => setActiveMarker('drop')}
                            className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg transition ${activeMarker === 'drop' ? 'bg-primary text-white ring-2 ring-offset-2 ring-primary' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                        >
                            Set Drop
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TaxiBooking;