import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, X, Save, Loader, ArrowLeft, Upload, FileText, Image as ImageIcon } from 'lucide-react';

const ListingForm = () => {
    const { id } = useParams(); // If ID exists, we are in EDIT mode
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const isEditMode = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        country: '',
        location: '',
        images: [], // Array of image URLs
        hotelLicense: null, // License document URL
        rooms: '', // Number of rooms available (legacy)
        roomTypes: {
            single: '',
            double: '',
            triple: ''
        }
    });
    const [imageFiles, setImageFiles] = useState([]); // Array of File objects
    const [licenseFile, setLicenseFile] = useState(null); // License File object
    const [imagePreviews, setImagePreviews] = useState([]); // Preview URLs

    // Fetch data if in Edit Mode
    useEffect(() => {
        if (isEditMode) {
            const fetchListing = async () => {
                try {
                    setLoading(true);
                    const res = await api.get(`/listings/${id}`);
                    const data = res.data.listing || res.data;
                    
                    setFormData({
                        title: data.title || '',
                        description: data.description || '',
                        price: data.price || '',
                        country: data.country || '',
                        location: data.location || '',
                        images: data.images && data.images.length > 0 ? data.images : [],
                        hotelLicense: data.hotelLicense || null,
                        rooms: data.rooms || '',
                        roomTypes: data.roomTypes || {
                            single: '',
                            double: '',
                            triple: ''
                        }
                    });
                    
                    // Set previews for existing images
                    if (data.images && data.images.length > 0) {
                        setImagePreviews(data.images);
                    }
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

    // Handle image file selection
    const handleImageChange = async (e, index) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('Image size should be less than 10MB');
            return;
        }

        try {
            setUploading(true);
            
            // Create FormData for upload
            const formData = new FormData();
            formData.append('image', file);

            // Upload to Cloudinary via backend
            const response = await api.post('/api/upload/image', formData);

            if (response.data.success) {
                const imageUrl = response.data.url;
                
                // Update images array
                const currentImages = Array.isArray(formData.images) ? formData.images : [];
                const newImages = [...currentImages];
                if (index !== undefined && index < newImages.length) {
                    newImages[index] = imageUrl;
                } else {
                    newImages.push(imageUrl);
                }
                
                // Update image files and previews
                const currentImageFiles = Array.isArray(imageFiles) ? imageFiles : [];
                const newImageFiles = [...currentImageFiles];
                if (index !== undefined && index < newImageFiles.length) {
                    newImageFiles[index] = file;
                } else {
                    newImageFiles.push(file);
                }
                
                const currentPreviews = Array.isArray(imagePreviews) ? imagePreviews : [];
                const newPreviews = [...currentPreviews];
                const previewUrl = URL.createObjectURL(file);
                if (index !== undefined && index < newPreviews.length) {
                    newPreviews[index] = previewUrl;
                } else {
                    newPreviews.push(previewUrl);
                }

                setFormData(prevData => ({ ...prevData, images: newImages }));
                setImageFiles(newImageFiles);
                setImagePreviews(newPreviews);
                
                toast.success('Image uploaded successfully!');
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error(error.response?.data?.message || 'Failed to upload image');
        } finally {
            setUploading(false);
            // Reset file input
            e.target.value = '';
        }
    };

    // Handle multiple image upload
    const handleMultipleImages = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Validate total count
        const currentImages = Array.isArray(formData.images) ? formData.images : [];
        if (currentImages.length + files.length > 20) {
            toast.error('Maximum 20 images allowed');
            return;
        }

        // Validate file types and sizes
        const validFiles = files.filter(file => {
            if (!file.type.startsWith('image/')) {
                toast.error(`${file.name} is not an image file`);
                return false;
            }
            if (file.size > 10 * 1024 * 1024) {
                toast.error(`${file.name} is too large (max 10MB)`);
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        try {
            setUploading(true);
            
            // Upload all files at once
            const formData = new FormData();
            validFiles.forEach(file => {
                formData.append('images', file);
                console.log('Added file to FormData:', file.name, file.size, file.type);
            });
            
            console.log('Sending upload request with', validFiles.length, 'files');
            const response = await api.post('/api/upload/images', formData);
            console.log('Upload response:', response.data);
            
            const successfulUrls = response.data.success ? response.data.urls : [];

            if (successfulUrls.length > 0) {
                setFormData(prevData => ({
                    ...prevData,
                    images: [...(prevData.images || []), ...successfulUrls]
                }));
                
                // Create previews
                const newPreviews = validFiles.map(file => URL.createObjectURL(file));
                setImagePreviews(prevPreviews => [...(prevPreviews || []), ...newPreviews]);
                
                toast.success(`${successfulUrls.length} image(s) uploaded successfully!`);
            }
        } catch (error) {
            console.error('Upload error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to upload images';
            console.error('Error details:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: errorMessage,
                request: {
                    url: error.config?.url,
                    method: error.config?.method,
                    headers: error.config?.headers
                }
            });
            toast.error(errorMessage);
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    // Handle license document upload
    const handleLicenseChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type (PDF or image)
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
        
        if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
            toast.error('Please select a PDF or image file (JPG/PNG)');
            console.error('Invalid file type:', file.type, 'Extension:', fileExtension);
            return;
        }
        
        console.log('License file selected:', {
            name: file.name,
            type: file.type,
            size: file.size,
            extension: fileExtension
        });

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size should be less than 10MB');
            return;
        }

        try {
            setUploading(true);
            
            // Create FormData for upload
            const formData = new FormData();
            formData.append('document', file);

            // Upload to Cloudinary via backend
            const response = await api.post('/api/upload/document', formData);

            if (response.data.success && response.data.url) {
                setFormData(prevData => ({ ...prevData, hotelLicense: response.data.url }));
                setLicenseFile(file);
                console.log('License uploaded successfully:', response.data.url);
                toast.success('License document uploaded successfully!');
            } else {
                throw new Error('Upload succeeded but no URL returned');
            }
        } catch (error) {
            console.error('Upload error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to upload document';
            console.error('Error details:', {
                status: error.response?.status,
                data: error.response?.data,
                message: errorMessage
            });
            toast.error(errorMessage);
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    // Remove image
    const removeImage = (index) => {
        const currentImages = Array.isArray(formData.images) ? formData.images : [];
        const newImages = currentImages.filter((_, i) => i !== index);
        const newPreviews = Array.isArray(imagePreviews) ? imagePreviews.filter((_, i) => i !== index) : [];
        const newImageFiles = Array.isArray(imageFiles) ? imageFiles.filter((_, i) => i !== index) : [];
        
        setFormData(prevData => ({ ...prevData, images: newImages }));
        setImagePreviews(newPreviews);
        setImageFiles(newImageFiles);
    };

    // Submit Form
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic Validation
        if (!formData.title || !formData.price || !formData.location) {
            return toast.error("Please fill in all required fields");
        }

        // Validate images
        const currentImages = Array.isArray(formData.images) ? formData.images : [];
        if (currentImages.length === 0) {
            return toast.error("Please upload at least one image");
        }

        // Validate room types
        const totalRooms = (parseInt(formData.roomTypes.single) || 0) + 
                          (parseInt(formData.roomTypes.double) || 0) + 
                          (parseInt(formData.roomTypes.triple) || 0);
        if (totalRooms === 0) {
            return toast.error("Please enter at least one room type");
        }

        try {
            setLoading(true);
            const currentImages = Array.isArray(formData.images) ? formData.images : [];
            // Calculate total rooms
            const calculatedTotalRooms = (parseInt(formData.roomTypes.single) || 0) + 
                                         (parseInt(formData.roomTypes.double) || 0) + 
                                         (parseInt(formData.roomTypes.triple) || 0);

            const submitData = {
                ...formData,
                images: currentImages.filter(url => url && url.trim() !== ""),
                hotelLicense: formData.hotelLicense || null,
                // FIX: Send the calculated number, not an empty string
                rooms: calculatedTotalRooms, 
                roomTypes: {
                    single: parseInt(formData.roomTypes.single) || 0,
                    double: parseInt(formData.roomTypes.double) || 0,
                    triple: parseInt(formData.roomTypes.triple) || 0
                }
            };
            
            console.log('Submitting form data:', {
                ...submitData,
                images: submitData.images.length,
                hotelLicense: submitData.hotelLicense ? 'Present' : 'Missing'
            });

            if (isEditMode) {
                await api.put(`/listings/${id}`, submitData);
                toast.success("Listing updated successfully!");
                navigate(`/listings/${id}`);
            } else {
                await api.post('/listings', submitData);
                if (user?.role === 'admin') {
                    toast.success("Listing created successfully!");
                } else {
                    toast.success("Listing request sent for approval!");
                }
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <button 
                    onClick={() => navigate(-1)} 
                    className="flex items-center text-gray-500 hover:text-gray-700 mb-6 transition"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </button>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
                    <div className="bg-primary/10 px-8 py-6 border-b border-primary/20">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {isEditMode ? "Edit Listing" : "Create New Listing"}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">
                            {isEditMode ? "Update your property details below." : "Fill in the details to list your property on TravelNest."}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Listing Title</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                placeholder="e.g. Cozy Cottage in the Hills"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="4"
                                className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                placeholder="Describe the property features, amenities, and surroundings..."
                                required
                            />
                        </div>

                        {/* Price & Country Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price per Night (₹)</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    min="0"
                                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                    placeholder="1500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
                                <input
                                    type="text"
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                    placeholder="e.g. India"
                                    required
                                />
                            </div>
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location (City/State)</label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                placeholder="e.g. Jaipur, Rajasthan"
                                required
                            />
                        </div>

                        {/* Room Types */}
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">Room Types Available</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Single Stay Rooms (1 person)</label>
                                    <input
                                        type="number"
                                        name="roomTypes.single"
                                        value={formData.roomTypes.single}
                                        onChange={(e) => {
                                            setFormData({
                                                ...formData,
                                                roomTypes: {
                                                    ...formData.roomTypes,
                                                    single: e.target.value
                                                }
                                            });
                                        }}
                                        min="0"
                                        className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                        placeholder="e.g. 30"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Double Stay Rooms (2 people)</label>
                                    <input
                                        type="number"
                                        name="roomTypes.double"
                                        value={formData.roomTypes.double}
                                        onChange={(e) => {
                                            setFormData({
                                                ...formData,
                                                roomTypes: {
                                                    ...formData.roomTypes,
                                                    double: e.target.value
                                                }
                                            });
                                        }}
                                        min="0"
                                        className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                        placeholder="e.g. 50"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Triple Stay Rooms (3 people)</label>
                                    <input
                                        type="number"
                                        name="roomTypes.triple"
                                        value={formData.roomTypes.triple}
                                        onChange={(e) => {
                                            setFormData({
                                                ...formData,
                                                roomTypes: {
                                                    ...formData.roomTypes,
                                                    triple: e.target.value
                                                }
                                            });
                                        }}
                                        min="0"
                                        className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                        placeholder="e.g. 20"
                                        required
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                                Total Rooms: {(
                                    (parseInt(formData.roomTypes.single) || 0) + 
                                    (parseInt(formData.roomTypes.double) || 0) + 
                                    (parseInt(formData.roomTypes.triple) || 0)
                                )}
                            </p>
                        </div>

                        {/* Image Upload Section */}
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3  items-center gap-2">
                                <ImageIcon className="w-4 h-4" />
                                Property Images
                            </label>
                            
                            {/* Multiple Image Upload */}
                            <div className="mb-4">
                                <label className="block text-xs text-gray-600 mb-2">Upload Multiple Images</label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="image-upload"
                                        multiple
                                        accept="image/*"
                                        onChange={handleMultipleImages}
                                        className="hidden"
                                        disabled={uploading || (Array.isArray(formData.images) && formData.images.length >= 20)}
                                    />
                                    <label 
                                        htmlFor="image-upload"
                                        className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-500 rounded-lg cursor-pointer hover:border-primary transition"
                                    >
                                        <div className="flex flex-col items-center justify-center">
                                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                            <span className="text-sm text-gray-600 dark:text-gray-300">Click to upload images</span>
                                            <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB each</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Image Previews */}
                            {Array.isArray(formData.images) && formData.images.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                                    {formData.images.map((url, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={imagePreviews[index] || url}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                                                title="Remove Image"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            <p className="text-xs text-gray-400 mt-3">
                                {Array.isArray(formData.images) ? formData.images.length : 0} / 20 images uploaded
                            </p>
                        </div>

                        {/* Hotel License Document Upload */}
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3  items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Hotel License Document
                            </label>
                            
                            {formData.hotelLicense ? (
                                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-green-600" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">License document uploaded</span>
                                    </div>
                                    <a
                                        href={formData.hotelLicense}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-primary hover:underline"
                                    >
                                        View Document
                                    </a>
                                </div>
                            ) : (
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="license-upload"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleLicenseChange}
                                        className="hidden"
                                        disabled={uploading}
                                    />
                                    <label 
                                        htmlFor="license-upload"
                                        className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-500 rounded-lg cursor-pointer hover:border-primary transition"
                                    >
                                        <div className="flex flex-col items-center justify-center">
                                            <Upload className="w-6 h-6 text-gray-400 mb-1" />
                                            <span className="text-sm text-gray-600 dark:text-gray-300">Upload License Document</span>
                                            <span className="text-xs text-gray-400 mt-1">PDF, JPG, PNG up to 10MB</span>
                                        </div>
                                    </label>
                                </div>
                            )}
                            
                            <p className="text-xs text-gray-400 mt-2">
                                Upload your hotel license or registration document (PDF or Image)
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || uploading}
                            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary hover:brightness-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading || uploading ? (
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
