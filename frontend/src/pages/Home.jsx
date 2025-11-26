import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import ListingCard from '../components/ListingCard';
import { Search, Filter, Star } from 'lucide-react';

const Home = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [priceFilter, setPriceFilter] = useState('');
    const [ratingFilter, setRatingFilter] = useState('');

    // Fetch Listings Function
    const fetchListings = async () => {
        setLoading(true);
        try {
            // Build query string
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (priceFilter) params.append('price', priceFilter);
            if (ratingFilter) params.append('rating', ratingFilter);

            // Call backend with params
            // Note: Ensure your backend /listings route handles these query params
            // If not, we can filter on the frontend (shown below as backup)
            const response = await api.get(`/listings?${params.toString()}`);
            setListings(response.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching listings:", err);
            setError("Failed to load hotels.");
        } finally {
            setLoading(false);
        }
    };

    // Fetch on initial load
    useEffect(() => {
        fetchListings();
    }, []); 

    // Handle Search Submit
    const handleSearch = (e) => {
        e.preventDefault();
        fetchListings();
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            
            {/* --- Filter & Search Section --- */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-8 top-20 z-40">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-center">
                    
                    {/* Search Input */}
                    <div className="relative flex-grow w-full md:w-auto">
                        <input 
                            type="text" 
                            placeholder="Search by name or location..." 
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                    </div>

                    {/* Price Filter */}
                    <div className="w-full md:w-48">
                        <select 
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
                            value={priceFilter}
                            onChange={(e) => setPriceFilter(e.target.value)}
                        >
                            <option value="">Any Price</option>
                            <option value="0-1000">Under ₹1,000</option>
                            <option value="1000-2000">₹1,000 - ₹2,000</option>
                            <option value="2000-3000">₹2,000 - ₹3,000</option>
                            <option value="3000+">Above ₹3,000</option>
                        </select>
                    </div>

                    {/* Rating Filter */}
                    <div className="w-full md:w-48">
                        <select 
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
                            value={ratingFilter}
                            onChange={(e) => setRatingFilter(e.target.value)}
                        >
                            <option value="">Any Rating</option>
                            <option value="4">4+ Stars</option>
                            <option value="3">3+ Stars</option>
                            <option value="2">2+ Stars</option>
                        </select>
                    </div>

                    {/* Search Button */}
                    <button 
                        type="submit" 
                        className="w-full md:w-auto px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:brightness-90 transition flex items-center justify-center gap-2"
                    >
                        <Filter className="w-4 h-4" /> Filter
                    </button>

                    {/* Clear Button */}
                    {(searchTerm || priceFilter || ratingFilter) && (
                        <button 
                            type="button"
                            onClick={() => {
                                setSearchTerm('');
                                setPriceFilter('');
                                setRatingFilter('');
                                // Quick timeout to let state update before refetching
                                setTimeout(() => window.location.reload(), 100); 
                            }}
                            className="text-gray-500 text-sm hover:text-red-500 underline"
                        >
                            Clear
                        </button>
                    )}
                </form>
            </div>

            {/* --- Results Section --- */}
            {loading ? (
                <div className="min-h-[50vh] flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-500">Finding best places...</p>
                </div>
            ) : error ? (
                <div className="text-center py-10">
                    <p className="text-red-500 text-lg">{error}</p>
                    <button onClick={fetchListings} className="mt-4 text-primary underline">Try Again</button>
                </div>
            ) : listings.length > 0 ? (
                <>
                    <p className="mb-4 text-gray-500 text-sm font-medium">Found {listings.length} properties</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {listings.map(listing => (
                            <ListingCard key={listing._id} listing={listing} />
                        ))}
                    </div>
                </>
            ) : (
                <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700">No matches found</h3>
                    <p className="text-gray-500 mt-2">Try adjusting your filters or search term.</p>
                </div>
            )}
        </div>
    );
};

export default Home;