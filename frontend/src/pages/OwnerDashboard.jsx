// Import React library and necessary hooks: useEffect (for side effects like fetching data), useState (for storing data)
import React, { useEffect, useState } from 'react';

// Import hooks from react-router-dom for navigation and accessing URL parameters
import { useNavigate, useParams } from 'react-router-dom';

// Import our custom axios instance to make API requests
import api from '../api/axios';

// Import toast for showing success/error notifications
import toast from 'react-hot-toast';

// Import icons from lucide-react library to use in the UI
import { Plus, X, Save, Loader, ArrowLeft, Upload, FileText, Image as ImageIcon } from 'lucide-react';

// Define the functional component named ListingForm
const ListingForm = () => {
    // Get the 'id' parameter from the URL (e.g., /edit/123 -> id is 123)
    const { id } = useParams(); 
    
    // Initialize the navigate hook to redirect the user after form submission
    const navigate = useNavigate();
    
    // Check if 'id' exists. If it does, we are in "Edit Mode", otherwise "Create Mode"
    const isEditMode = Boolean(id);

    // State to handle the loading spinner when fetching data or submitting
    const [loading, setLoading] = useState(false);
    
    // State to disable buttons and show specific loading during file uploads
    const [uploading, setUploading] = useState(false);
    
    // State object to store all the form input values
    const [formData, setFormData] = useState({
        title: '',          // Stores listing title
        description: '',    // Stores description text
        price: '',          // Stores price per night
        country: '',        // Stores country name
        location: '',       // Stores specific location/city
        images: [],         // Array to store URLs of uploaded images from the server
        hotelLicense: null, // Stores URL of the uploaded license document
        rooms: '',          // Total number of rooms (calculated later)
        // Nested object to store specific room counts
        roomTypes: {
            single: '',     // Count of single rooms
            double: '',     // Count of double rooms
            triple: ''      // Count of triple rooms
        }
    });

    // State to store raw File objects (optional, useful if we needed to upload on submit instead of immediately)
    const [imageFiles, setImageFiles] = useState([]); 
    
    // State to store the raw License File object
    const [licenseFile, setLicenseFile] = useState(null); 
    
    // State to store local preview URLs so users can see images immediately before server response
    const [imagePreviews, setImagePreviews] = useState([]); 

    // useEffect hook to run code when the component mounts or when dependencies change
    useEffect(() => {
        // Only run this logic if we are in Edit Mode (i.e., we have an ID)
        if (isEditMode) {
            // Define an async function to fetch data
            const fetchListing = async () => {
                try {
                    setLoading(true); // Start loading spinner
                    
                    // Make GET request to backend to get listing details by ID
                    const res = await api.get(`/listings/${id}`);
                    
                    // Extract data from response (handling potential different response structures)
                    const data = res.data.listing || res.data;
                    
                    // Update form state with the data received from the database
                    setFormData({
                        title: data.title || '',
                        description: data.description || '',
                        price: data.price || '',
                        country: data.country || '',
                        location: data.location || '',
                        // If images exist, use them, otherwise use empty array
                        images: data.images && data.images.length > 0 ? data.images : [],
                        hotelLicense: data.hotelLicense || null,
                        rooms: data.rooms || '',
                        // Ensure roomTypes structure exists
                        roomTypes: data.roomTypes || {
                            single: '',
                            double: '',
                            triple: ''
                        }
                    });
                    
                    // If the listing has images, set them as the previews
                    if (data.images && data.images.length > 0) {
                        setImagePreviews(data.images);
                    }
                } catch (error) {
                    // Show error if fetch fails
                    toast.error("Failed to load listing details");
                    // Redirect user back to listings page on error
                    navigate('/listings');
                } finally {
                    // Stop loading spinner regardless of success or failure
                    setLoading(false);
                }
            };
            // Call the function defined above
            fetchListing();
        }
    }, [id, isEditMode, navigate]); // Dependencies: run if ID, mode, or navigate changes

    // Helper function to handle text input changes
    const handleChange = (e) => {
        // Update state: copy existing formData, then update the key [e.target.name] with new value
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Helper function to handle single image file selection
    const handleImageChange = async (e, index) => {
        // Get the first file selected by the user
        const file = e.target.files[0];
        
        // If no file selected, stop here
        if (!file) return;

        // Validation: Check if file type starts with 'image/'
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        // Validation: Check if file size is greater than 10MB
        if (file.size > 10 * 1024 * 1024) {
            toast.error('Image size should be less than 10MB');
            return;
        }

        try {
            setUploading(true); // Start upload loading state
            
            // Create a new FormData object to send file to server
            const formDataUpload = new FormData();
            formDataUpload.append('image', file); // Append file with key 'image'

            // Send POST request to upload endpoint
            const response = await api.post('/api/upload/image', formDataUpload);

            // If backend says success
            if (response.data.success) {
                const imageUrl = response.data.url; // Get the URL returned by server
                
                // Copy current images array safely
                const currentImages = Array.isArray(formData.images) ? formData.images : [];
                const newImages = [...currentImages];
                
                // If index is provided, replace that image. Otherwise, add to end.
                if (index !== undefined && index < newImages.length) {
                    newImages[index] = imageUrl;
                } else {
                    newImages.push(imageUrl);
                }
                
                // (Logic to update raw files array - mirroring above logic)
                const currentImageFiles = Array.isArray(imageFiles) ? imageFiles : [];
                const newImageFiles = [...currentImageFiles];
                if (index !== undefined && index < newImageFiles.length) {
                    newImageFiles[index] = file;
                } else {
                    newImageFiles.push(file);
                }
                
                // (Logic to update previews array - creating local object URL)
                const currentPreviews = Array.isArray(imagePreviews) ? imagePreviews : [];
                const newPreviews = [...currentPreviews];
                const previewUrl = URL.createObjectURL(file);
                if (index !== undefined && index < newPreviews.length) {
                    newPreviews[index] = previewUrl;
                } else {
                    newPreviews.push(previewUrl);
                }

                // Update all states
                setFormData(prevData => ({ ...prevData, images: newImages }));
                setImageFiles(newImageFiles);
                setImagePreviews(newPreviews);
                
                toast.success('Image uploaded successfully!');
            }
        } catch (error) {
            console.error('Upload error:', error);
            // Show error message from server or default message
            toast.error(error.response?.data?.message || 'Failed to upload image');
        } finally {
            setUploading(false); // Stop upload loading
            e.target.value = ''; // Clear file input so same file can be selected again
        }
    };

    // Helper function to handle selecting multiple images at once
    const handleMultipleImages = async (e) => {
        // Convert FileList to Array
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Check if adding these files exceeds the 20 image limit
        const currentImages = Array.isArray(formData.images) ? formData.images : [];
        if (currentImages.length + files.length > 20) {
            toast.error('Maximum 20 images allowed');
            return;
        }

        // Filter valid files (check type and size for each file)
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

        // If no valid files remain after filtering, stop
        if (validFiles.length === 0) return;

        try {
            setUploading(true); // Start upload loading
            
            // Create FormData to send multiple files
            const formDataUpload = new FormData();
            // Loop through valid files and append them all under key 'images'
            validFiles.forEach(file => {
                formDataUpload.append('images', file);
            });
            
            // Send to batch upload endpoint
            const response = await api.post('/api/upload/images', formDataUpload);
            
            // Get success URLs from response
            const successfulUrls = response.data.success ? response.data.urls : [];

            if (successfulUrls.length > 0) {
                // Update form data: spread old images + add new URLs
                setFormData(prevData => ({
                    ...prevData,
                    images: [...(prevData.images || []), ...successfulUrls]
                }));
                
                // Generate local previews for the UI
                const newPreviews = validFiles.map(file => URL.createObjectURL(file));
                setImagePreviews(prevPreviews => [...(prevPreviews || []), ...newPreviews]);
                
                toast.success(`${successfulUrls.length} image(s) uploaded successfully!`);
            }
        } catch (error) {
            console.error('Upload error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to upload images';
            toast.error(errorMessage);
        } finally {
            setUploading(false); // Stop loading
            e.target.value = ''; // Reset input
        }
    };

    // Helper function to handle License Document upload
    const handleLicenseChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validation: Allow PDF, JPG, PNG
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
        
        // Check if file type matches allowed list
        if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
            toast.error('Please select a PDF or image file (JPG/PNG)');
            return;
        }
        
        // Validation: Size limit
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size should be less than 10MB');
            return;
        }

        try {
            setUploading(true);
            
            const formDataUpload = new FormData();
            formDataUpload.append('document', file); // Append as 'document'

            const response = await api.post('/api/upload/document', formDataUpload);

            // If upload successful and URL returned
            if (response.data.success && response.data.url) {
                // Update formData with the document URL
                setFormData(prevData => ({ ...prevData, hotelLicense: response.data.url }));
                setLicenseFile(file); // Store raw file in state
                toast.success('License document uploaded successfully!');
            } else {
                throw new Error('Upload succeeded but no URL returned');
            }
        } catch (error) {
            // Handle errors
            const errorMessage = error.response?.data?.message || error.message || 'Failed to upload document';
            toast.error(errorMessage);
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    // Helper function to remove an image from the list by index
    const removeImage = (index) => {
        const currentImages = Array.isArray(formData.images) ? formData.images : [];
        // Create new array excluding the item at 'index'
        const newImages = currentImages.filter((_, i) => i !== index);
        // Do the same for previews and files arrays to keep them in sync
        const newPreviews = Array.isArray(imagePreviews) ? imagePreviews.filter((_, i) => i !== index) : [];
        const newImageFiles = Array.isArray(imageFiles) ? imageFiles.filter((_, i) => i !== index) : [];
        
        // Update states with the filtered arrays
        setFormData(prevData => ({ ...prevData, images: newImages }));
        setImagePreviews(newPreviews);
        setImageFiles(newImageFiles);
    };

    // Function to handle form submission (Save button)
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default browser form refresh behavior
        
        // Validation: Check required text fields
        if (!formData.title || !formData.price || !formData.location) {
            return toast.error("Please fill in all required fields");
        }

        // Validation: Check if at least one image is uploaded
        const currentImages = Array.isArray(formData.images) ? formData.images : [];
        if (currentImages.length === 0) {
            return toast.error("Please upload at least one image");
        }

        // Validation: Calculate total rooms to ensure it's not 0
        const totalRooms = (parseInt(formData.roomTypes.single) || 0) + 
                          (parseInt(formData.roomTypes.double) || 0) + 
                          (parseInt(formData.roomTypes.triple) || 0);
        
        if (totalRooms === 0) {
            return toast.error("Please enter at least one room type");
        }

        try {
            setLoading(true); // Start loading spinner
            
            // Recalculate total rooms for the payload
            const calculatedTotalRooms = (parseInt(formData.roomTypes.single) || 0) + 
                                         (parseInt(formData.roomTypes.double) || 0) + 
                                         (parseInt(formData.roomTypes.triple) || 0);

            // Create the data object to send to the backend
            const submitData = {
                ...formData,
                // Filter out any empty strings from images array just in case
                images: currentImages.filter(url => url && url.trim() !== ""),
                hotelLicense: formData.hotelLicense || null,
                // Send the calculated integer, not a string
                rooms: calculatedTotalRooms, 
                // Ensure room types are numbers (parse strings to Int)
                roomTypes: {
                    single: parseInt(formData.roomTypes.single) || 0,
                    double: parseInt(formData.roomTypes.double) || 0,
                    triple: parseInt(formData.roomTypes.triple) || 0
                }
            };

            // If Edit Mode: Send PUT request
            if (isEditMode) {
                await api.put(`/listings/${id}`, submitData);
                toast.success("Listing updated successfully!");
                navigate(`/listings/${id}`); // Go to the updated listing page
            } else {
                // If Create Mode: Send POST request
                await api.post('/listings', submitData);
                toast.success("Listing created successfully!");
                navigate('/listings'); // Go to listings dashboard
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Operation failed");
        } finally {
            setLoading(false); // Stop loading spinner
        }
    };

    // Conditional Render: Show full screen loader if we are editing but data isn't loaded yet
    if (loading && isEditMode && !formData.title) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    // Main JSX Render
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                {/* Back Button */}
                <button 
                    onClick={() => navigate(-1)} // Go back to previous page
                    className="flex items-center text-gray-500 hover:text-gray-700 mb-6 transition"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </button>

                {/* Main Card Container */}
                <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
                    {/* Header Section */}
                    <div className="bg-primary/10 px-8 py-6 border-b border-primary/20">
                        {/* Dynamic Title based on mode */}
                        <h2 className="text-2xl font-bold text-gray-900">
                            {isEditMode ? "Edit Listing" : "Create New Listing"}
                        </h2>
                        <p className="text-gray-600 mt-1 text-sm">
                            {isEditMode ? "Update your property details below." : "Fill in the details to list your property on TravelNest."}
                        </p>
                    </div>

                    {/* Form Start */}
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        
                        {/* Title Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Listing Title</label>
                            <input
                                type="text"
                                name="title" // Must match state key
                                value={formData.title} // Bind to state
                                onChange={handleChange} // Update state on typing
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                                placeholder="e.g. Cozy Cottage in the Hills"
                                required // Browser validation
                            />
                        </div>

                        {/* Description Textarea */}
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

                        {/* Two Column Grid for Price and Country */}
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

                        {/* Location Input */}
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

                        {/* Room Types Section */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <label className="block text-sm font-bold text-gray-700 mb-3">Room Types Available</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Single Room Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Single Stay Rooms (1 person)</label>
                                    <input
                                        type="number"
                                        name="roomTypes.single"
                                        value={formData.roomTypes.single}
                                        // Inline onChange to handle nested state update
                                        onChange={(e) => {
                                            setFormData({
                                                ...formData,
                                                roomTypes: {
                                                    ...formData.roomTypes, // Keep other room types
                                                    single: e.target.value // Update single
                                                }
                                            });
                                        }}
                                        min="0"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                                        placeholder="e.g. 30"
                                        required
                                    />
                                </div>
                                {/* Double Room Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Double Stay Rooms (2 people)</label>
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
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                                        placeholder="e.g. 50"
                                        required
                                    />
                                </div>
                                {/* Triple Room Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Triple Stay Rooms (3 people)</label>
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
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                                        placeholder="e.g. 20"
                                        required
                                    />
                                </div>
                            </div>
                            {/* Live calculation text showing total sum */}
                            <p className="text-xs text-gray-400 mt-2">
                                Total Rooms: {(
                                    (parseInt(formData.roomTypes.single) || 0) + 
                                    (parseInt(formData.roomTypes.double) || 0) + 
                                    (parseInt(formData.roomTypes.triple) || 0)
                                )}
                            </p>
                        </div>

                        {/* Image Upload Section */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <label className="block text-sm font-bold text-gray-700 mb-3 items-center gap-2">
                                <ImageIcon className="w-4 h-4" />
                                Property Images
                            </label>
                            
                            {/* Upload Button Area */}
                            <div className="mb-4">
                                <label className="block text-xs text-gray-600 mb-2">Upload Multiple Images</label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="image-upload"
                                        multiple // Allow selecting multiple files
                                        accept="image/*"
                                        onChange={handleMultipleImages}
                                        className="hidden" // Hide the default ugly file input
                                        // Disable if uploading or max limit reached
                                        disabled={uploading || (Array.isArray(formData.images) && formData.images.length >= 20)}
                                    />
                                    {/* Custom styled label acts as button */}
                                    <label 
                                        htmlFor="image-upload"
                                        className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition"
                                    >
                                        <div className="flex flex-col items-center justify-center">
                                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                            <span className="text-sm text-gray-600">Click to upload images</span>
                                            <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB each</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Image Previews Grid */}
                            {Array.isArray(formData.images) && formData.images.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                                    {/* Map through images to show them */}
                                    {formData.images.map((url, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={imagePreviews[index] || url} // Use preview if avail, else URL
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-32 object-cover rounded-lg border border-gray-200"
                                            />
                                            {/* Delete X Button (Visible on Hover) */}
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
                            
                            {/* Image Counter */}
                            <p className="text-xs text-gray-400 mt-3">
                                {Array.isArray(formData.images) ? formData.images.length : 0} / 20 images uploaded
                            </p>
                        </div>

                        {/* License Document Section */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <label className="block text-sm font-bold text-gray-700 mb-3 items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Hotel License Document
                            </label>
                            
                            {/* Logic: If license exists, show view link. Else, show upload input. */}
                            {formData.hotelLicense ? (
                                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-green-600" />
                                        <span className="text-sm text-gray-700">License document uploaded</span>
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
                                        className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition"
                                    >
                                        <div className="flex flex-col items-center justify-center">
                                            <Upload className="w-6 h-6 text-gray-400 mb-1" />
                                            <span className="text-sm text-gray-600">Upload License Document</span>
                                            <span className="text-xs text-gray-400 mt-1">PDF, JPG, PNG up to 10MB</span>
                                        </div>
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || uploading} // Disable if busy
                            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary hover:brightness-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {/* Conditional content: Spinner if loading, Text if not */}
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

// Export the component so it can be used in other files
export default ListingForm;