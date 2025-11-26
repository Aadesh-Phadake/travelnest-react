import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, X, Save, Loader, ArrowLeft } from 'lucide-react';

const ListingForm = () => {
    const { id } = useParams(); // If ID exists, we are in EDIT mode
    const navigate = useNavigate();
    const isEditMode = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        country: '',
        location: '',
        images: [''] // Start with one empty image field
    });

    // Fetch data if in Edit Mode
    useEffect(() => {
        if (isEditMode) {
            const fetchListing = async () => {
                try {
                    setLoading(true);
                    const res = await api.get(`/listings/${id}`);
                    const data = res.data.listing || res.data;
                    
                    // Ensure images array exists and has at least one entry
                    const images = data.images && data.images.length > 0 ? data.images : [''];
                    
                    setFormData({
                        title: data.title,
                        description: data.description,
                        price: data.price,
                        country: data.country,
                        location: data.location,
                        images: images
                    });
                } catch (error) {
                    toast.error("Failed to load listing details");
                    navigate('/listings');
                } finally {
                    setLoading(false);
                }
            };
            fetchListing();
        }
    }, [id, isEditMode, navigate]);

    // Handle text input changes
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handle Image URL changes
    const handleImageChange = (index, value) => {
        const newImages = [...formData.images];
        newImages[index] = value;
        setFormData({ ...formData, images: newImages });
    };

    // Add new image field
    const addImageField = () => {
        if (formData.images.length < 20) {
            setFormData({ ...formData, images: [...formData.images, ''] });
        } else {
            toast.error("Maximum 20 images allowed");
        }
    };

    // Remove image field
    const removeImageField = (index) => {
        const newImages = formData.images.filter((_, i) => i !== index);
        setFormData({ ...formData, images: newImages });
    };

    // Submit Form
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic Validation
        if (!formData.title || !formData.price || !formData.location) {
            return toast.error("Please fill in all required fields");
        }

        // Filter out empty image strings
        const cleanedData = {
            ...formData,
            images: formData.images.filter(url => url.trim() !== "")
        };

        try {
            setLoading(true);
            if (isEditMode) {
                await api.put(`/listings/${id}`, cleanedData);
                toast.success("Listing updated successfully!");
                navigate(`/listings/${id}`);
            } else {
                await api.post('/listings', cleanedData);
                toast.success("Listing created successfully!");
                navigate('/listings');
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Operation failed");
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditMode && !formData.title) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <button 
                    onClick={() => navigate(-1)} 
                    className="flex items-center text-gray-500 hover:text-gray-700 mb-6 transition"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </button>

                <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
                    <div className="bg-primary/10 px-8 py-6 border-b border-primary/20">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {isEditMode ? "Edit Listing" : "Create New Listing"}
                        </h2>
                        <p className="text-gray-600 mt-1 text-sm">
                            {isEditMode ? "Update your property details below." : "Fill in the details to list your property on TravelNest."}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Listing Title</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                                placeholder="e.g. Cozy Cottage in the Hills"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="4"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                                placeholder="Describe the property features, amenities, and surroundings..."
                                required
                            />
                        </div>

                        {/* Price & Country Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price per Night (₹)</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    min="0"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                                    placeholder="1500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                <input
                                    type="text"
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                                    placeholder="e.g. India"
                                    required
                                />
                            </div>
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location (City/State)</label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                                placeholder="e.g. Jaipur, Rajasthan"
                                required
                            />
                        </div>

                        {/* Dynamic Image URLs */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <label className="block text-sm font-bold text-gray-700 mb-3">Image URLs</label>
                            <div className="space-y-3">
                                {formData.images.map((url, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={url}
                                            onChange={(e) => handleImageChange(index, e.target.value)}
                                            className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                                            placeholder="https://example.com/image.jpg"
                                        />
                                        {formData.images.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeImageField(index)}
                                                className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition"
                                                title="Remove Image"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            <button
                                type="button"
                                onClick={addImageField}
                                disabled={formData.images.length >= 20}
                                className="mt-4 flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition disabled:opacity-50"
                            >
                                <Plus className="w-4 h-4" /> Add Another Image URL
                            </button>
                            <p className="text-xs text-gray-400 mt-2">You can add up to 20 images.</p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary hover:brightness-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? (
                                <Loader className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    {isEditMode ? "Update Listing" : "Create Listing"}
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ListingForm;